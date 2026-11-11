"""Build assets/globe/company-hq.json: head-office city for each listed company.

Source: Wikidata (CC0). Match rule: ticker (P249) equals the asset symbol with any
exchange suffix removed, the company has a headquarters location (P159) with
coordinates (P625), and the English label shares the first significant word of the
asset name. Only one matching item may remain; otherwise the company is left out
(its HQ shows as "not available"). Never guesses.
Usage: python3 tools/hq/build_company_hq.py [--limit N]
"""
import json, re, sys, time, urllib.parse, urllib.request, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
MARKETS = ROOT / 'assets/globe/markets.json'
OUT = ROOT / 'assets/globe/company-hq.json'
UA = 'InvestediaBuild/1.0 (site data build; contact via site)'
STOP = {'inc', 'corp', 'corporation', 'co', 'ltd', 'plc', 'group', 'holdings', 'the', 'sa', 'se', 'nv', 'ag', 'and', 'company', 'limited'}

def words(name):
    return [w for w in re.findall(r'[a-z0-9]+', name.lower()) if w not in STOP]

def query(ticker):
    q = f'''SELECT ?item ?label ?hqLabel ?coord WHERE {{
      ?item wdt:P249 "{ticker}" ; wdt:P159 ?hq .
      ?hq wdt:P625 ?coord .
      ?item rdfs:label ?label . FILTER(LANG(?label)="en")
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }} LIMIT 20'''
    url = 'https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': q, 'format': 'json'})
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/sparql-results+json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)['results']['bindings']

def parse_point(wkt):
    m = re.match(r'Point\(([-\d.]+) ([-\d.]+)\)', wkt)
    return (float(m.group(2)), float(m.group(1))) if m else None  # (lat, lon)

def main():
    limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else None
    assets = json.load(open(MARKETS))['assets']
    stocks = [a for a in assets if a.get('t') == 'stocks' and a.get('g') != 'Index'][:limit]
    out, misses = {}, []
    checked = datetime.date.today().isoformat()
    for a in stocks:
        sym = a['s'].split('.')[0].upper()
        ws = words(a['n'])[:1]
        try:
            rows = query(sym)
        except Exception as e:
            misses.append({'s': a['s'], 'why': f'query failed: {e.__class__.__name__}'})
            time.sleep(2); continue
        hits = {}
        for r in rows:
            label = r['label']['value'].lower()
            if ws and ws[0] in label:
                hits.setdefault(r['item']['value'], r)
        if len(hits) != 1:
            misses.append({'s': a['s'], 'why': 'no unique match' if hits else 'no match'})
        else:
            r = next(iter(hits.values()))
            ll = parse_point(r['coord']['value'])
            if ll:
                out[a['s']] = {'hq_city': r['hqLabel']['value'], 'hq_lat': round(ll[0], 4), 'hq_lon': round(ll[1], 4),
                               'qid': r['item']['value'].rsplit('/', 1)[-1],
                               'source': 'Wikidata (CC0) P159 headquarters location, P625 coordinates',
                               'checked_at': checked}
        time.sleep(1.1)  # polite rate for query.wikidata.org
    doc = {'schema': 'investedia.company-hq.v1', 'licence': 'CC0 1.0 (Wikidata)', 'checked_at': checked,
           'matched': len(out), 'asked': len(stocks), 'companies': out, 'not_matched': misses}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1))
    print(f"asked {len(stocks)} matched {len(out)} not matched {len(misses)} -> {OUT}")

if __name__ == '__main__':
    main()
