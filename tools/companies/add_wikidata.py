"""Add notable companies from data/company-sources/wikidata/<cc>.json to the directory (owner, 19 Nov 2026).

  python3 tools/companies/add_wikidata.py ke ng za     # or --all for every saved country

Rules:
- Companies already in data/companies.json are never changed (matched by Wikidata id, LEI, ISIN or name + country).
- Listed companies keep their stock ticker as an untracked listing ("WD:<exchange>:<ticker>"); prices are not tracked.
- Unlisted companies get no listing and are marked "listed": false ("Not listed" on the site).
- The head office goes into assets/globe/company-hq.json (keyed "co:<slug>" for unlisted companies), only when Wikidata
  gives both the city and its coordinates. Without that the company is in the directory but not on the globe.
- Only facts are copied. Descriptions are written later in our own words (Haiku bot), never copied.
"""
import argparse, datetime, json, pathlib, re, sys, unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / 'data/company-sources/wikidata'
DIRECTORY = ROOT / 'data/companies.json'
HQ = ROOT / 'assets/globe/company-hq.json'
REGION = {**{c: 'Africa' for c in 'dz ao bj bw bf bi cv cm cf td km cd cg ci dj eg gq er sz et ga gm gh gn gw ke ls lr ly mg mw ml mr mu ma mz na ne ng rw st sn sc sl so za ss sd tz tg tn ug zm zw'.split()}}
FORMS = r'\b(PLC|Limited|Ltd|S\.?A\.?|SA|Inc|Corporation|Corp|Company|Co|LLC|Group|Holdings?|S\.?p\.?A|AG|NV|BV)\b\.?'


def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()).strip('-')


def key(s):
    return re.sub(r'[^a-z0-9]', '', slugify(re.sub(FORMS, '', s or '', flags=re.I)))


def country_name(cc):
    names = json.loads((ROOT / 'tools/companies/countries.json').read_text(encoding='utf-8'))
    return names.get(cc.upper(), cc.upper())


def main(argv=None):
    ap = argparse.ArgumentParser(); ap.add_argument('cc', nargs='*'); ap.add_argument('--all', action='store_true')
    a = ap.parse_args(argv)
    files = sorted(SRC.glob('*.json')) if a.all else [SRC / f'{c.lower()}.json' for c in a.cc]
    d = json.loads(DIRECTORY.read_text(encoding='utf-8')); hqd = json.loads(HQ.read_text(encoding='utf-8')); H = hqd['companies']
    qids = {h.get('qid') for h in H.values() if h.get('qid')} | {c.get('qid') for c in d['companies'] if c.get('qid')}
    leis = {h.get('lei') for h in H.values() if h.get('lei')} | {c.get('lei') for c in d['companies'] if c.get('lei')}
    isins = {l.get('isin') for c in d['companies'] for l in c['listings'] if l.get('isin')}
    names = {(key(c['name']), c['cc']) for c in d['companies']} | {(key(c.get('legal_name')), c['cc']) for c in d['companies'] if c.get('legal_name')}
    slugs = {c['slug'] for c in d['companies']}; today = datetime.date.today().isoformat(); added = onglobe = 0
    for f in files:
        src = json.loads(f.read_text(encoding='utf-8')); n0 = added
        for w in src['companies']:
            cc = w['cc']
            if w['qid'] in qids or (w.get('lei') and w['lei'] in leis) or set(w['isin']) & isins or (key(w['name']), cc) in names: continue
            if not key(w['name']): continue
            slug = slugify(w['name']); slug = slug if slug not in slugs else f'{slug}-{cc}'
            if slug in slugs: slug = f"{slug}-{w['qid'].lower()}"
            slugs.add(slug); qids.add(w['qid']); names.add((key(w['name']), cc))
            country = country_name(cc)
            listings = [{'s': f"WD:{re.sub(r'[^A-Z0-9]', '', l['exchange'].upper())[:12]}:{l['ticker']}", 'name': w['name'], 'exchange': l['exchange'], 'tracked': False,
                         **({'isin': w['isin'][0]} if w['isin'] else {})} for l in w['listings'] if l.get('ticker')]
            c = {'slug': slug, 'name': w['name'], 'legal_name': w['name'], 'country': country, 'cc': cc, 'region': REGION.get(cc, src.get('region')),
                 'sector': None, 'industry': None, 'wikidata_industries': w['industries'][:4], 'public': bool(w['listed']), 'listed': bool(w['listed']),
                 'qid': w['qid'], **({'lei': w['lei']} if w.get('lei') else {}),
                 'hq': f"{w['hq_city']}, {country}" if w.get('hq_city') else None, 'website': w.get('website'), 'description': None, 'founded': w.get('founded'),
                 'story': [], 'related': [], 'videos': [],
                 'sources': [{'name': 'Wikidata (CC0)', 'url': f"https://www.wikidata.org/wiki/{w['qid']}", 'checked_at': src['checked_at']}],
                 'logo': None, 'listings': listings}
            d['companies'].append(c); added += 1
            if w.get('hq') and w.get('hq_city'):
                k = listings[0]['s'] if listings else f'co:{slug}'
                H[k] = {'hq_city': w['hq_city'], 'hq_lat': w['hq'][0], 'hq_lon': w['hq'][1], 'qid': w['qid'], 'company_label': w['name'],
                        'source': 'Wikidata (CC0) P159 headquarters location, P625 coordinates', 'source_url': f"https://www.wikidata.org/entity/{w['qid']}", 'checked_at': today}
                onglobe += 1
        print(f'{f.stem}: {added - n0} added')
    d['count'] = len(d['companies'])
    DIRECTORY.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    hqd['matched'] = len(H); HQ.write_text(json.dumps(hqd, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{added} companies added ({onglobe} with a head office on the globe); {d["count"]} in the directory')


if __name__ == '__main__':
    sys.exit(main())
