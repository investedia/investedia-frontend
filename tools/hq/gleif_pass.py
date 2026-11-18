"""HQ pass from GLEIF (owner, 17 Nov 2026): free, official head-office data for directory companies still without an HQ.

GLEIF (the global LEI register, CC0) records each legal entity's legal name, country and headquarters address,
filed by the company itself. For every company in data/companies.json with no row in assets/globe/company-hq.json:
  1. search GLEIF by name within the company's country (fulltext, active entities only);
  2. keep candidates whose legal name (or an English / transliterated name) contains every significant word of our
     name; take the one whose name is exactly ours (legal-form words ignored), else the only one; otherwise none;
  3. place the HQ city with GeoNames cities15000 (CC BY 4.0), matching the city or district named in the
     headquarters address, in the same country; the largest matching city wins.
Accepted rows get precision "city" and method "gleif". Lapsed registrations, a headquarters country different from
the directory, or a city not found go to review_required with a reason. Companies already held for review are not
changed: GLEIF's answer is written to tools/hq/gleif-review-suggestions.json for a person to check.
Never guesses; existing rows are never changed.
Usage: python3 tools/hq/gleif_pass.py [--check] [--limit N]
"""
import argparse, csv, datetime, io, json, pathlib, re, sys, time, unicodedata, urllib.parse, urllib.request, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
HQ = ROOT / 'assets/globe/company-hq.json'
DIRECTORY = ROOT / 'data/companies.json'
SUGGEST = ROOT / 'tools/hq/gleif-review-suggestions.json'
CACHE = pathlib.Path('/tmp/investedia-gleif-cache'); CACHE.mkdir(exist_ok=True)
UA = 'InvestediaBuild/1.0 (site data build; contact via site)'
TODAY = datetime.date.today().isoformat()
FORMS = {'inc', 'incorporated', 'corp', 'corporation', 'co', 'company', 'ltd', 'limited', 'plc', 'group', 'holding', 'holdings', 'the', 'and',
         'sa', 'se', 'nv', 'ag', 'ab', 'asa', 'oyj', 'spa', 'bhd', 'berhad', 'pcl', 'public', 'tbk', 'pt', 'sab', 'cv', 'de', 'kk', 'kabushiki', 'kaisha',
         'sa/nv', 'qpsc', 'qsc', 'sgps', 'sab', 'saa', 'saic', 'llc', 'lp', 'gmbh', 'kgaa', 'as', 'a/s', 'nyrt', 'rt', 'jsc', 'pjsc', 'ojsc', 'saa', 'sac', 'srl', 'bv', 'acciones', 'class', 'shares'}
TRANSLIT = str.maketrans({'æ': 'ae', 'ø': 'o', 'œ': 'oe', 'ß': 'ss', 'ð': 'd', 'þ': 'th', 'ł': 'l', 'đ': 'd', 'ı': 'i', '&': ' and '})
CC_ALIAS = {'uk': 'GB'}
# Districts that GeoNames (cities over 15,000 people) does not list on their own, mapped to the city they are part of.
DISTRICTS = {'NG': {d: 'Lagos' for d in ('ikoyi', 'victoria island', 'ogba', 'apapa', 'marina', 'oregun', 'ilupeju', 'isolo', 'yaba', 'ebute metta', 'surulere', 'lagos island', 'iganmu', 'agidingbi', 'oshodi', 'maryland', 'gbagada', 'ilasamaja', 'amuwo odofin', 'ojota', 'anthony')}}
# Hand check 17 Nov 2026: GLEIF's address disagrees with the company's own reporting; a person must decide.
DOUBT = {'CPI': 'GLEIF says Cape Town; Capitec reports its head office in Stellenbosch',
         '3711.TW': 'GLEIF says Taipei; ASE reports its head office in Kaohsiung'}
AGENT_CITIES = {'US': ('wilmington', 'dover', 'carson city', 'cheyenne')}  # common registered-agent cities


def words(s, keep_forms=False):
    s = unicodedata.normalize('NFKD', (s or '').casefold().translate(TRANSLIT))
    s = ''.join(c for c in s if not unicodedata.combining(c))
    toks, out = re.findall(r'[a-z0-9]+', s), []
    for t in toks:  # runs of single letters are one word: S.A. -> sa (a legal form), U.S.A. -> usa, H.K. -> hk (not the parent company)
        if len(t) == 1 and out and out[-1][1]: out[-1] = (out[-1][0] + t, True)
        else: out.append((t, len(t) == 1))
    return [w for w, _ in out if keep_forms or w not in FORMS]


def get_json(url):
    import hashlib
    f = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.json')
    if f.exists(): return json.loads(f.read_text())
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/vnd.api+json'})
            with urllib.request.urlopen(req, timeout=60) as r: data = json.load(r)
            f.write_text(json.dumps(data)); time.sleep(1.1)  # GLEIF allows 60 requests a minute
            return data
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or attempt == 5: raise
            time.sleep(int(e.headers.get('Retry-After') or 0) or 10 * (attempt + 1))


def fold(s):
    """Lower case, accents removed (Västerås, Vaesteras, Vasteras all compare equal once folded)."""
    s = unicodedata.normalize('NFKD', (s or '').casefold().replace('ä', 'a').replace('ö', 'o').replace('å', 'a'))
    return unicodedata.normalize('NFC', ''.join(c for c in s if not unicodedata.combining(c)))


def geonames():
    """cities15000: name, ascii name and every alternate name (local scripts included) -> (lat, lon, population, name)."""
    z = CACHE / 'cities15000.zip'
    if not z.exists():
        req = urllib.request.Request('https://download.geonames.org/export/dump/cities15000.zip', headers={'User-Agent': UA})
        z.write_bytes(urllib.request.urlopen(req, timeout=120).read())
    idx = {}
    with zipfile.ZipFile(z) as zf, zf.open('cities15000.txt') as fh:
        for row in csv.reader(io.TextIOWrapper(fh, encoding='utf-8'), delimiter='\t', quoting=csv.QUOTE_NONE):
            name, ascii_, alts, lat, lon, cc, pop = row[1], row[2], row[3], float(row[4]), float(row[5]), row[8], int(row[14] or 0)
            for n in {name, ascii_, *alts.split(',')}:
                n = fold(n.strip())
                if len(n) >= 2: idx.setdefault(cc, {}).setdefault(n, []).append((lat, lon, pop, name))
    return idx


def place(city_text, cc, idx):
    """The largest GeoNames city in this country whose name appears in the address city text."""
    t = fold(city_text); best = None
    for n, hits in idx.get(cc, {}).items():
        latin = n.isascii()
        found = re.search(r'(?<![a-z0-9])' + re.escape(n) + r'(?![a-z0-9])', t) if latin else (n in t)
        if not found: continue
        for h in hits:
            key = (len(n), h[2])  # longer name first (a district beats the region), then population
            if not best or key > best[0]: best = (key, h)
    return best[1] if best else None


def by_isin(c):
    """Exact identity: the LEI linked to the listing's ISIN (GLEIF ISIN-LEI mapping). None if no listing has an ISIN."""
    isins = [l['isin'] for l in c['listings'] if l.get('isin')]
    if not isins: return None
    recs = []
    for i in isins: recs += get_json('https://api.gleif.org/api/v1/lei-records?' + urllib.parse.urlencode({'filter[isin]': i})).get('data', [])
    return recs


def candidates(c):
    cc = CC_ALIAS.get(c['cc'].lower(), c['cc'].upper())
    q = ' '.join(words(c.get('legal_name') or c['name'])) or c['name']
    url = 'https://api.gleif.org/api/v1/lei-records?' + urllib.parse.urlencode(
        {'filter[fulltext]': q, 'filter[entity.legalAddress.country]': cc, 'filter[entity.status]': 'ACTIVE', 'page[size]': 15})
    return cc, get_json(url).get('data', [])


def names_of(rec):
    e = rec['attributes']['entity']
    out = [e['legalName']['name']] + [x['name'] for x in e.get('otherNames') or []] + [x['name'] for x in e.get('transliteratedOtherNames') or []]
    return [n for n in out if n]


def decide(c, cc, recs, idx):
    if c.get('_isin_recs') is not None:  # matched by ISIN: the identity is exact, no name matching needed
        recs = c['_isin_recs']
        if len({r['id'] for r in recs}) != 1: return None, ('several LEIs for this ISIN' if recs else None)
        return located(c, cc, recs[0], idx, 'gleif-isin')
    want = set(words(c['name'])) or set(words(c.get('legal_name')))
    want2 = set(words(c.get('legal_name'))) or want
    pick = []  # the name must match exactly once legal-form words (Ltd, AB, Inc...) are ignored; ordinary companies only
    for r in recs:
        e = r['attributes']['entity']
        if e.get('category') not in (None, 'GENERAL'): continue  # no funds, branches or sole traders
        if any(set(words(n)) in (want, want2) for n in names_of(r)): pick.append(r)
    if len({r['id'] for r in pick}) != 1: return None, ('several GLEIF entities have exactly this name' if len(pick) > 1 else None)
    return located(c, cc, pick[0], idx, 'gleif')


def located(c, cc, r, idx, method):
    a = r['attributes']; e = a['entity']; hq = e['headquartersAddress']
    status, updated = a['registration']['status'], (a['registration'].get('lastUpdateDate') or '')[:10]
    recent = updated >= (datetime.date.today() - datetime.timedelta(days=3 * 365)).isoformat()
    if status not in ('ISSUED', 'LAPSED') or (status == 'LAPSED' and not recent):  # lapsed = renewal fee unpaid; a recent address is still usable
        return None, f"GLEIF registration is {status.lower()}" + (f', last updated {updated}' if updated else '')
    if hq['country'] != cc: return None, f"GLEIF headquarters is in {hq['country']}, directory says {c['country']}"
    if (hq.get('city') or '').strip().casefold() in AGENT_CITIES.get(cc, ()):
        return None, f"GLEIF headquarters is the registration address in {hq.get('city')}, not necessarily the operating HQ"
    p = place(DISTRICTS.get(cc, {}).get(fold(hq.get('city') or '').strip(), hq.get('city')), cc, idx)  # the city field only: a region or street line is not precise enough
    if not p: return None, f"GLEIF city '{hq.get('city')}' not found in GeoNames"
    lat, lon, pop, city = p
    return {'hq_city': city, 'hq_lat': round(lat, 4), 'hq_lon': round(lon, 4), 'lei': r['id'], 'company_label': e['legalName']['name'],
            'country': c['country'], 'precision': 'city', 'method': method,
            'source': 'GLEIF LEI record (CC0) headquarters address' + (f'; record lapsed, last updated {updated}' if status == 'LAPSED' else '') + '; city coordinates GeoNames (CC BY 4.0)',
            'source_url': f"https://search.gleif.org/#/record/{r['id']}", 'checked_at': TODAY}, None


def main(argv=None):
    ap = argparse.ArgumentParser(); ap.add_argument('--check', action='store_true'); ap.add_argument('--limit', type=int); ap.add_argument('--cc', nargs='*', help='only these directory country codes, e.g. ph bw')
    a = ap.parse_args(argv)
    hq = json.loads(HQ.read_text(encoding='utf-8')); C = hq['companies']
    held = {r['s'] for r in hq['review_required']}
    companies = json.loads(DIRECTORY.read_text(encoding='utf-8'))['companies']
    todo = [c for c in companies if not any(l['s'] in C for l in c['listings']) and (not a.cc or c['cc'] in a.cc)][:a.limit]
    idx = geonames()
    added, review, suggest, missing = {}, [], {}, []
    for i, c in enumerate(todo, 1):
        isin_recs = by_isin(c)
        c['_isin_recs'] = isin_recs
        if not isin_recs: c['_isin_recs'] = None  # no LEI linked to the ISIN (common for Kenyan listings): fall back to the strict name search
        cc, recs = (CC_ALIAS.get(c['cc'].lower(), c['cc'].upper()), []) if isin_recs else candidates(c)
        row, why = decide(c, cc, recs, idx)
        syms = [l['s'] for l in c['listings']]; sym = syms[0]
        doubt = next((DOUBT[s] for s in syms if s in DOUBT), None)
        if row and doubt: row, why = None, doubt
        if any(s in held for s in syms):
            if row: suggest[sym] = row
        elif row:
            for s in syms: added[s] = row
        elif why: review.append({'s': sym, 'why': [why]})
        else: missing.append(c['name'])
        print(f"{i}/{len(todo)} {c['name']}: " + (f"{row['hq_city']} ({'suggestion only' if any(s in held for s in syms) else 'added'})" if row else ('REVIEW ' + why if why else 'not found')), flush=True)
    n_added = len({id(v) for v in added.values()})
    print(json.dumps({'checked': len(todo), 'added_companies': n_added, 'review': len(review), 'suggestions_for_held': len(suggest), 'not_found': len(missing)}))
    if a.check: return 0
    for s, row in added.items(): C.setdefault(s, row)
    known = {r['s'] for r in hq['review_required']}
    hq['review_required'] += [r for r in review if r['s'] not in known]
    hq['not_matched'] = [r for r in hq['not_matched'] if r['s'] not in C]
    hq['matched'] = len(C)
    hq['gleif_pass'] = {'checked_at': TODAY, 'method': 'tools/hq/gleif_pass.py', 'added': len(added),
                        'licence': 'GLEIF data CC0; GeoNames CC BY 4.0 (attribution: GeoNames, geonames.org)'}
    HQ.write_text(json.dumps(hq, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    SUGGEST.write_text(json.dumps(suggest, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return 0


if __name__ == '__main__':
    sys.exit(main())
