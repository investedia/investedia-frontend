#!/usr/bin/env python3
"""Company logos from Wikidata P154 (logo image) on Wikimedia Commons, open licences only (owner, 18 Nov 2026, tracker #108).

For every company in data/companies.json without a logo:
  0. If a logo file already exists for one of its listings (assets/globe/logos.json), link it.
  1. Wikidata item: the QID already sourced in assets/globe/company-hq.json; otherwise one query-service request per
     country lists that country's companies (P17 = country and P414 stock exchange / P1278 LEI / P452 industry) that
     have a logo (P154). A company matches when every significant word of its name is in the item's English label or
     an alias, and exactly one item matches. No unique match -> skipped.
  2. Logo: the item's single current P154 value (preferred rank wins). Several -> skipped.
  3. Licence: read from the Commons file page (licensetpl_short); only Public domain / CC0 / CC BY* / CC BY-SA*.
  4. Download (step --download): SVG kept as is; raster must be >= 96 px both sides (tools/check-logos.py rule).
Never overwrites an existing logo. Pauses between requests and waits on HTTP 429, so it can run in the background.
Writes tools/logos/wikidata-logos-plan.json (steps 1-3) and, with --download, the files plus logos.json, credits.json
and the "logo" field in data/companies.json. Report: tools/logos/wikidata-logos-report.json.
Usage: python3 tools/logos/wikidata_logos.py --plan     then     python3 tools/logos/wikidata_logos.py --download
"""
import argparse, datetime, html, io, json, pathlib, re, time, unicodedata, urllib.error, urllib.parse, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[2]
UA = {'User-Agent': 'InvestediaBuild/1.0 (logo build; low volume)'}
OK = re.compile(r'^(public domain|pd\b.*|cc0.*|cc[ -]by(-sa)?[ -][0-9.]+.*)$', re.I)
PLAN = ROOT / 'tools/logos/wikidata-logos-plan.json'
STOP = {'plc', 'ltd', 'limited', 'inc', 'corp', 'corporation', 'company', 'co', 'group', 'holdings', 'holding', 'sa', 'ag', 'nv', 'the', 'of', 'and', 'nigeria', 'kenya', 'ghana', 'ci', 'cote', 'divoire', 'ivoire', 'sca', 'llc'}

def get(url, binary=False, accept=None, pause=1.5):
    h = dict(UA); h.update({'Accept': accept} if accept else {})
    for k in range(12):
        try:
            b = urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=120).read(); time.sleep(pause)
            return b if binary else b.decode('utf-8', 'replace')
        except urllib.error.HTTPError as e:
            if e.code == 429: print('  429, waiting 90 s', flush=True); time.sleep(90); continue
            raise
    raise RuntimeError('rate limited too long: ' + url)

def sparql(q): return json.loads(get('https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': q}), accept='application/sparql-results+json', pause=65))['results']['bindings']
def norm(s): return re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower())
def words(s): return {w for w in norm(s).split() if w not in STOP and len(w) > 1}
def fname(uri): return urllib.parse.unquote(uri.rsplit('/', 1)[-1])

def plan():
    D = json.loads((ROOT / 'data/companies.json').read_text()); L = json.loads((ROOT / 'assets/globe/logos.json').read_text())
    H = json.loads((ROOT / 'assets/globe/company-hq.json').read_text())['companies']; CQ = json.loads((ROOT / 'tools/logos/country-qids.json').read_text())
    out = {'checked_at': datetime.date.today().isoformat(), 'link': {}, 'logo': {}, 'skipped': {}}
    todo = []
    for c in D['companies']:
        if c.get('logo') and (ROOT / c['logo']).exists(): continue
        ex = next((l['s'] for l in c['listings'] if l['s'] in L and (ROOT / 'assets/globe' / L[l['s']]).exists()), None)
        if ex: out['link'][c['slug']] = L[ex].replace('../', 'assets/'); continue
        todo.append(c)
    print(len(todo), 'companies need a logo;', len(out['link']), 'can link an existing file', flush=True)
    known = {c['slug']: next((H[l['s']]['qid'] for l in c['listings'] if l['s'] in H and H[l['s']].get('qid')), None) for c in todo}
    known = {k: v for k, v in known.items() if v}
    cand = {}
    if known:
        rows = sparql('SELECT ?i ?logo ?rank WHERE { VALUES ?i {%s} ?i p:P154 ?st. ?st ps:P154 ?logo; wikibase:rank ?rank. FILTER NOT EXISTS{?st pq:P582 ?e} FILTER(?rank != wikibase:DeprecatedRank) }' % ' '.join('wd:' + q for q in set(known.values())))
        by = {}
        for r in rows: by.setdefault(r['i']['value'].rsplit('/', 1)[1], []).append((r['rank']['value'].endswith('PreferredRank'), fname(r['logo']['value'])))
        for s, q in known.items(): cand[s] = (q, by.get(q, []))
        print('known QIDs:', len(known), 'with a logo:', sum(1 for s in known if cand[s][1]), flush=True)
    rest = [c for c in todo if c['slug'] not in known]
    for cc in sorted({(c.get('cc') or '').upper() for c in rest}):
        if cc not in CQ: continue
        rows = sparql('SELECT ?i ?l ?a ?logo ?rank WHERE { ?i wdt:P17 wd:%s; p:P154 ?st. ?st ps:P154 ?logo; wikibase:rank ?rank. FILTER NOT EXISTS{?st pq:P582 ?e} FILTER(?rank != wikibase:DeprecatedRank) { ?i wdt:P414 [] } UNION { ?i wdt:P1278 [] } UNION { ?i wdt:P452 [] } OPTIONAL{?i rdfs:label ?l FILTER(lang(?l)="en")} OPTIONAL{?i skos:altLabel ?a FILTER(lang(?a)="en")} }' % CQ[cc])
        items = {}
        for r in rows:
            q = r['i']['value'].rsplit('/', 1)[1]; it = items.setdefault(q, {'names': set(), 'logos': set()})
            for k in ('l', 'a'):
                if k in r: it['names'].add(r[k]['value'])
            it['logos'].add((r['rank']['value'].endswith('PreferredRank'), fname(r['logo']['value'])))
        print(cc, len(items), 'Wikidata companies with a logo', flush=True)
        for c in [c for c in rest if (c.get('cc') or '').upper() == cc]:
            W = words(c.get('legal_name') or c['name']) or words(c['name'])
            m = [q for q, it in items.items() if W and any(W <= words(n) for n in it['names'])]
            if len(m) == 1: cand[c['slug']] = (m[0], list(items[m[0]]['logos']))
            else: out['skipped'][c['slug']] = f'{len(m)} matching Wikidata companies with a logo'
    for c in todo:
        if c['slug'] in out['skipped']: continue
        if c['slug'] not in cand or not cand[c['slug']][1]: out['skipped'][c['slug']] = 'no Wikidata logo'; continue
        q, logos = cand[c['slug']]; pref = [f for p, f in logos if p] or [f for p, f in logos]
        pref = list(dict.fromkeys(pref))
        if len(pref) != 1: out['skipped'][c['slug']] = f'{len(pref)} current logos on Wikidata ({q})'; continue
        out['logo'][c['slug']] = {'qid': q, 'file': pref[0], 'symbol': c['listings'][0]['s'], 'company': c['name']}
    for s, v in list(out['logo'].items()):
        page = get('https://commons.wikimedia.org/wiki/File:' + urllib.parse.quote(v['file'].replace(' ', '_')), pause=2.5)
        page = page.replace('&#95;', '_')  # Commons writes the class names with an entity: licensetpl&#95;short
        lic = [html.unescape(x).strip() for x in re.findall(r'class="licensetpl_short"[^>]*>([^<]+)<', page)]
        auth = re.search(r'id="fileinfotpl_aut"[^>]*>.*?</td>\s*<td[^>]*>(.*?)</td>', page, re.S)
        v['licences'] = lic; v['author'] = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', auth.group(1)))).strip()[:120] if auth else None
        good = [x for x in lic if OK.match(x)]
        if not good: out['skipped'][s] = f"licence not accepted: {lic or 'none found'}"; del out['logo'][s]; continue
        v['licence'] = good[0]; v['page'] = 'https://commons.wikimedia.org/wiki/File:' + urllib.parse.quote(v['file'].replace(' ', '_'))
        print('  ok', v['company'], '|', v['licence'], flush=True)
        PLAN.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    PLAN.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"plan: link {len(out['link'])}, logos {len(out['logo'])}, skipped {len(out['skipped'])}", flush=True)

def download():
    P = json.loads(PLAN.read_text()); D = json.loads((ROOT / 'data/companies.json').read_text())
    L = json.loads((ROOT / 'assets/globe/logos.json').read_text()); CR = json.loads((ROOT / 'assets/logos/credits.json').read_text())
    by = {c['slug']: c for c in D['companies']}; rep = {'checked_at': datetime.date.today().isoformat(), 'linked': [], 'added': [], 'skipped': dict(P['skipped'])}
    for s, path in P['link'].items():
        if not by[s].get('logo'): by[s]['logo'] = path; rep['linked'].append(s)
    def save():
        (ROOT / 'assets/globe/logos.json').write_text(json.dumps(dict(sorted(L.items())), ensure_ascii=False, indent=0) + '\n')
        (ROOT / 'assets/logos/credits.json').write_text(json.dumps(dict(sorted(CR.items())), ensure_ascii=False, indent=1) + '\n')
        (ROOT / 'data/companies.json').write_text(json.dumps(D, ensure_ascii=False, separators=(',', ':')))
        (ROOT / 'tools/logos/wikidata-logos-report.json').write_text(json.dumps(rep, ensure_ascii=False, indent=1) + '\n')
    for s, v in P['logo'].items():
        c = by[s]; sym = v['symbol']; svg = v['file'].lower().endswith('.svg'); ext = 'svg' if svg else 'png'
        out = ROOT / 'assets/logos/co' / f'{sym}.{ext}'
        if out.exists() or c.get('logo'): continue
        fp = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(v['file'].replace(' ', '_')) + ('' if svg else '?width=256')
        b = get(fp, binary=True, pause=20)
        if svg:
            if b'<svg' not in b[:6000]: rep['skipped'][s] = 'downloaded file is not an SVG'; continue
            out.write_bytes(b)
        else:
            from PIL import Image
            im = Image.open(io.BytesIO(b)); im.load()
            if min(im.size) < 96: rep['skipped'][s] = f'raster {im.size} smaller than 96 px'; continue
            im.save(out, 'PNG')
        L[sym] = f'../logos/co/{sym}.{ext}'; c['logo'] = f'assets/logos/co/{sym}.{ext}'
        CR[sym] = {'author': v.get('author') or 'Unknown', 'company': c['name'], 'file': v['page'], 'licence': v['licence'], 'retrieved': rep['checked_at'], 'wikidata': v['qid']}
        rep['added'].append(s); print('  +', c['name'], flush=True); save()
    save(); print(f"linked {len(rep['linked'])}, added {len(rep['added'])}, skipped {len(rep['skipped'])}", flush=True)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); g = ap.add_mutually_exclusive_group(required=True); g.add_argument('--plan', action='store_true'); g.add_argument('--download', action='store_true')
    a = ap.parse_args(); plan() if a.plan else download()
