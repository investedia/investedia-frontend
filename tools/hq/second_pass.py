"""Second HQ pass for directory companies the ticker matcher missed (owner, 17 Nov 2026).

build_company_hq.py matches the asset symbol (suffix removed) against Wikidata tickers plus a strict name check.
Many non-US companies were missed because tickers are written differently ("MAERSK-B.CO" vs "MAERSK B",
"0700.HK" vs "700") or names differ ("Acciones Iberdrola" vs "Iberdrola"). This pass, for every company in the
directory (data/companies.json) without an HQ in assets/globe/company-hq.json:

  1. ticker variants: exactly one Wikidata company with that ticker whose headquarters (P159, with P625
     coordinates) lies in the company's own country, and whose label shares a significant word with the name;
  2. name search: otherwise, exactly one listed company (has P414 stock exchange) found by legal name, in the
     company's own country, with HQ coordinates.

Never guesses: no unique candidate -> left out. HQ country different from the directory country -> review_required
(not shown on the globe). Existing rows are never changed. Source: Wikidata (CC0).
Usage: python3 tools/hq/second_pass.py [--check]    (--check prints results without writing)
"""
import argparse, datetime, json, math, pathlib, re, sys, time, unicodedata, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
HQ = ROOT / 'assets/globe/company-hq.json'
DIRECTORY = ROOT / 'data/companies.json'
UA = 'InvestediaBuild/1.0 (site data build; contact via site)'
STOP = {'inc', 'corp', 'corporation', 'co', 'ltd', 'plc', 'group', 'holdings', 'holding', 'the', 'sa', 'se', 'nv', 'ag',
        'and', 'company', 'limited', 'tbk', 'pt', 'asa', 'ab', 'oyj', 'spa', 'bhd', 'berhad', 'pcl', 'public', 'de',
        'acciones', 'class', 'b', 'a', 'shares', 'ord', 'sab', 'cv', 'of', 'bank', 'banco', 'international', 'industries'}
CC_ALIAS = {'hk': {'hk', 'cn'}, 'mo': {'mo', 'cn'}}  # Wikidata places Hong Kong / Macau under China (P17)
HK_BOX = (22.13, 113.82, 22.57, 114.45)
TODAY = datetime.date.today().isoformat()
REQUESTS = 0


TRANSLIT = str.maketrans({'æ': 'ae', 'ø': 'o', 'œ': 'oe', 'ß': 'ss', 'ð': 'd', 'þ': 'th', 'ł': 'l', 'đ': 'd', 'ı': 'i'})


def words(s):
    s = (s or '').casefold().translate(TRANSLIT)
    s = ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))
    return {w for w in re.findall(r'[a-z0-9]+', s) if w not in STOP and len(w) > 1}


CACHE = pathlib.Path('/tmp/investedia-hq-api-cache'); PACE = 3.0  # seconds between requests: faster trips Wikidata's limiter


def get(url):
    global REQUESTS
    import hashlib
    CACHE.mkdir(exist_ok=True)
    f = CACHE / (TODAY + '-' + hashlib.sha256(url.encode()).hexdigest() + '.json')
    if f.exists(): return json.loads(f.read_text())
    for attempt in range(8):
        try:
            REQUESTS += 1
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=60) as r: data = json.load(r)
            time.sleep(PACE); f.write_text(json.dumps(data))
            return data
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or attempt == 7: raise
            wait = int(e.headers.get('Retry-After') or 0) or (65 if e.code == 429 else 5 * (attempt + 1))
            print(f'Wikidata HTTP {e.code}; waiting {min(wait, 300)}s', flush=True); time.sleep(min(wait, 300))


def sparql(q):
    return get('https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': q, 'format': 'json'}))['results']['bindings']


def variants(symbol):
    base, _, suffix = symbol.partition('.')
    out = {base, base.replace('-', ' '), base.replace('-', '.'), base.replace('-', '')}
    if base.isdigit(): out |= {base.lstrip('0'), base.zfill(4), base.zfill(5), base.zfill(6)}
    if suffix in ('JK', 'BK', 'KL', 'SR', 'NS', 'BO', 'IS', 'WA', 'ST', 'CO', 'HE', 'OL', 'SW', 'MC', 'PA', 'AS', 'BR', 'MI', 'DE', 'L'):
        out.add(base.replace('_', ' '))
    return {v for v in out if v}


def item_rows(values_clause):
    """Candidate items with HQ, HQ coordinates, HQ country code and label (one query for many keys)."""
    return sparql(f'''SELECT DISTINCT ?key ?item ?label ?hq ?hqLabel ?coord ?hqcc ?city ?listed ?end WHERE {{
      {values_clause}
      ?item wdt:P159 ?hq . ?hq wdt:P625 ?coord .
      OPTIONAL {{ ?hq wdt:P17/wdt:P297 ?hqcc }}
      OPTIONAL {{ ?hq wdt:P1082 ?pop . BIND(true AS ?city) }}
      OPTIONAL {{ ?item wdt:P414 ?ex . BIND(true AS ?listed) }}
      OPTIONAL {{ ?item wdt:P576 ?end }}
      ?item rdfs:label ?label . FILTER(LANG(?label)="en")
      OPTIONAL {{ ?hq rdfs:label ?hqLabel . FILTER(LANG(?hqLabel)="en") }}
    }}''')


def point(wkt):
    m = re.fullmatch(r'Point\(([-\d.eE]+) ([-\d.eE]+)\)', wkt or '')
    if not m: return None
    lat, lon = float(m.group(2)), float(m.group(1))
    return (lat, lon) if math.isfinite(lat) and math.isfinite(lon) and abs(lat) <= 90 and abs(lon) <= 180 else None


def decide(company, rows, method):
    """Return (row, None) for one sure match, (None, review_reason) for review, (None, None) for no match."""
    cc = company['cc'].lower(); ok_cc = CC_ALIAS.get(cc, {cc})
    name_words = words(company['name']) | words(company.get('legal_name'))
    tickers = {v.casefold() for l in company['listings'] for v in variants(l['s'])}
    initials = ''.join(w[0] for w in re.findall(r'[a-z0-9]+', (company.get('legal_name') or company['name']).casefold().translate(TRANSLIT)) if w not in STOP)
    def same_name(r):  # shared word, or a short label that is the initials ("AMD") or the matched ticker ("ANZ")
        label = re.sub(r'[^a-z0-9]', '', r['label']['value'].casefold())
        return bool(name_words & words(r['label']['value'])) or (len(label) >= 2 and (label == initials or (r.get('ticker_match') and label in tickers)))
    rows = [r for r in rows if 'end' not in r and same_name(r)]
    if method == 'wikidata-name': rows = [r for r in rows if 'listed' in r]
    items = {r['item']['value'] for r in rows}
    if len(items) != 1: return None, ('multiple Wikidata companies match' if len(items) > 1 else None)
    hqs = {r['hq']['value'] for r in rows}
    if len(hqs) != 1: return None, 'Wikidata lists more than one current headquarters'
    r = rows[0]; ll = point(r['coord']['value'])
    if not ll: return None, None
    hqcc = {x['hqcc']['value'].lower() for x in rows if 'hqcc' in x}
    if not hqcc & ok_cc: return None, f'HQ is in {"/".join(sorted(hqcc)).upper() or "an unknown country"}, directory says {company["country"]}'
    if cc == 'hk' and not (HK_BOX[0] <= ll[0] <= HK_BOX[2] and HK_BOX[1] <= ll[1] <= HK_BOX[3]):
        return None, 'HQ is outside Hong Kong although the directory lists Hong Kong'
    qid = r['item']['value'].rsplit('/', 1)[-1]
    return {'hq_city': r.get('hqLabel', {}).get('value') or '', 'hq_lat': round(ll[0], 4), 'hq_lon': round(ll[1], 4), 'qid': qid,
            'hq_qid': r['hq']['value'].rsplit('/', 1)[-1], 'company_label': r['label']['value'], 'country': company['country'],
            'precision': 'city' if any('city' in x for x in rows) else 'site', 'method': method,
            'source': 'Wikidata (CC0) P159 headquarters location, P625 coordinates',
            'source_url': f'https://www.wikidata.org/entity/{qid}', 'checked_at': TODAY}, None


def chunks(xs, n):
    xs = sorted(xs)
    return [xs[i:i + n] for i in range(0, len(xs), n)]


API = 'https://www.wikidata.org/w/api.php?'


def entities(ids):
    """Wikidata entities by id via the regular API (not the query service), 50 per request."""
    out = {}
    for part in chunks(ids, 50):
        r = get(API + urllib.parse.urlencode({'action': 'wbgetentities', 'ids': '|'.join(part), 'props': 'claims|labels',
                                               'languages': 'en', 'format': 'json'}))
        out.update(r.get('entities', {}))
    return out


def current(claims, prop):
    """Values of non-deprecated statements without an end date (P582) in the past."""
    out = []
    for st in claims.get(prop, []):
        if st.get('rank') == 'deprecated': continue
        ends = [q['datavalue']['value']['time'][1:11] for q in st.get('qualifiers', {}).get('P582', []) if q.get('datavalue')]
        if any(e <= TODAY for e in ends): continue
        if 'datavalue' in st['mainsnak']: out.append(st)
    return out


def val(st):
    v = st['mainsnak']['datavalue']['value']
    return v.get('id') if isinstance(v, dict) and 'id' in v else v


def rows_for(items, keys):
    """Build rows shaped like the old query results: one per (item, current HQ with coordinates)."""
    ents = entities(items)
    hq_ids = {val(st) for e in ents.values() for st in current(e.get('claims', {}), 'P159')}
    hqs = entities(hq_ids)
    country_ids = {val(st) for e in hqs.values() for st in current(e.get('claims', {}), 'P17')}
    countries = entities(country_ids)
    cc = {q: [val(st) for st in current(e.get('claims', {}), 'P297')] for q, e in countries.items()}
    rows = []
    for q, e in ents.items():
        cl = e.get('claims', {}); label = e.get('labels', {}).get('en', {}).get('value')
        if not label: continue
        tickers = {val(st) for st in current(cl, 'P249')}
        for st in current(cl, 'P414'):
            tickers |= {x['datavalue']['value'] for x in st.get('qualifiers', {}).get('P249', []) if x.get('datavalue')}
        key = next((k for k in keys.get(q, ()) if k in tickers), None)
        for st in current(cl, 'P159'):
            h = hqs.get(val(st), {}); hc = h.get('claims', {})
            co = [val(x) for x in current(hc, 'P625')]
            if not co: continue
            r = {'key': {'value': key or q}, 'item': {'value': 'http://www.wikidata.org/entity/' + q}, 'label': {'value': label},
                 'hq': {'value': 'http://www.wikidata.org/entity/' + val(st)}, 'coord': {'value': f"Point({co[0]['longitude']} {co[0]['latitude']})"},
                 'hqLabel': {'value': h.get('labels', {}).get('en', {}).get('value', '')}, 'ticker_match': bool(key)}
            codes = [c for x in current(hc, 'P17') for c in cc.get(val(x), [])]
            if codes: r['hqcc'] = {'value': codes[0]}
            if current(hc, 'P1082'): r['city'] = {'value': 'true'}
            if current(cl, 'P414'): r['listed'] = {'value': 'true'}
            if any(v for v in current(cl, 'P576')): r['end'] = {'value': 'dissolved'}
            rows.append(r)
    return rows


def names(c):
    """Two search strings: the directory name, and the legal name with filler words removed ("Acciones Iberdrola" -> "Iberdrola")."""
    t = (c.get('legal_name') or c['name']).casefold().translate(TRANSLIT)
    kept = ' '.join(w for w in re.findall(r'[^\W_]+', t) if w not in STOP or w in ('bank', 'banco', 'international'))
    return {n for n in (c['name'], kept) if len(n) > 2}


def search_all(companies):
    """Candidate items per company from Wikidata search by name and legal name (regular API)."""
    found = {}
    for i, c in enumerate(companies, 1):
        if i % 10 == 0: print(f'searched {i}/{len(companies)} companies ({REQUESTS} requests)', flush=True)
        ids = set()
        for q in names(c):
            r = get(API + urllib.parse.urlencode({'action': 'wbsearchentities', 'search': q, 'language': 'en', 'type': 'item', 'limit': 7, 'format': 'json'}))
            ids |= {s['id'] for s in r.get('search', []) if re.fullmatch(r'Q[1-9][0-9]*', s['id'])}
        found[c['slug']] = ids
    return found


STALE = {'BA': 'Boeing moved its HQ to Arlington, Virginia in 2022; Wikidata may still say Chicago',
         'RIVN': 'Rivian HQ location needs a current filing check (Wikidata may be out of date)'}
COUNTRIES_AS_CITY = {'mexico'}
CITY_STATES = {'singapore', 'hong kong', 'macau', 'monaco'}  # here the city and country names are the same  # a country name is not a city


def quality(sym, row):
    """Reasons to hold a found row back for review (same standard as build_company_hq.py)."""
    city = (row.get('hq_city') or '').strip()
    if sym in STALE: return STALE[sym]
    if not city: return 'Source HQ has no city name'
    if row.get('precision') == 'site': return 'Source HQ label is a site/address; city name has not been resolved'
    if city.casefold() not in CITY_STATES and (city.casefold() in COUNTRIES_AS_CITY or city.casefold() == (row.get('country') or '').casefold()):
        return 'Source HQ is a country, not a city'
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(); ap.add_argument('--check', action='store_true'); ap.add_argument('--limit', type=int)
    a = ap.parse_args(argv)
    hq = json.loads(HQ.read_text(encoding='utf-8'))
    companies = json.loads(DIRECTORY.read_text(encoding='utf-8'))['companies']
    todo = [c for c in companies if not any(l['s'] in hq['companies'] for l in c['listings'])][:a.limit]
    added, review, missing = {}, [], []
    found = search_all(todo)
    keys = {}
    for c in todo:
        tick = {v for l in c['listings'] for v in variants(l['s'])}
        for q in found[c['slug']]: keys.setdefault(q, set()).update(tick)
    rows = rows_for(set().union(*found.values()) if found else set(), keys)
    results = {}
    for c in todo:
        mine = [r for r in rows if r['item']['value'].rsplit('/', 1)[-1] in found[c['slug']]]
        sure = [r for r in mine if r['ticker_match']]
        res = decide(c, sure, 'wikidata-ticker') if sure else (None, None)
        if res == (None, None): res = decide(c, mine, 'wikidata-name')
        results[c['slug']] = res
    for i, c in enumerate(todo, 1):
        row, why = results[c['slug']]; sym = c['listings'][0]['s']
        held = row and next((q for l in c['listings'] for q in [quality(l['s'], row)] if q), None)
        if held: row, why = None, held
        if row and any(r['s'] in {l['s'] for l in c['listings']} for r in hq['review_required']): row, why = None, None  # already held for review
        if row:
            for l in c['listings']: added[l['s']] = row
        elif why: review.append({'s': sym, 'why': [why]})
        else: missing.append({'s': sym, 'why': 'no unique Wikidata company with headquarters coordinates'})
        print(f'{i}/{len(todo)} {c["name"]}: ' + (f'{row["hq_city"]} ({row["method"]})' if row else ('REVIEW ' + why if why else 'not found')), flush=True)
    print(json.dumps({'checked': len(todo), 'added_companies': len(todo) - len(review) - len(missing), 'review': len(review), 'missing': len(missing), 'requests': REQUESTS}))
    if a.check: return 0
    for s, row in added.items(): hq['companies'].setdefault(s, row)
    known = {r['s'] for r in hq['review_required']}
    hq['review_required'] += [r for r in review if r['s'] not in known]
    hq['not_matched'] = [r for r in hq['not_matched'] if r['s'] not in hq['companies']] + [m for m in missing if m['s'] not in {x['s'] for x in hq['not_matched']}]
    hq['matched'] = len(hq['companies'])
    hq['second_pass'] = {'checked_at': TODAY, 'method': 'tools/hq/second_pass.py', 'added': len(added)}
    HQ.write_text(json.dumps(hq, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return 0


if __name__ == '__main__':
    sys.exit(main())
