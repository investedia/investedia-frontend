"""Build assets/globe/company-hq.json: head-office city for each listed company.

Source: Wikidata (CC0). Match rule: ticker (P249) equals the asset symbol with any
exchange suffix removed, the company has a headquarters location (P159) with
coordinates (P625), and the English label shares the first significant word of the
asset name. Only one matching item may remain; otherwise the company is left out
(its HQ shows as "not available"). Never guesses.
Limited checks write company-hq.sample.json; only a successful full run writes company-hq.json.
Source errors abort without replacing either file.
Usage: python3 tools/hq/build_company_hq.py [--limit N] [--output PATH]
"""
import argparse, json, math, re, sys, time, urllib.parse, urllib.request, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
MARKETS = ROOT / 'assets/globe/markets.json'
OUT = ROOT / 'assets/globe/company-hq.json'
UA = 'InvestediaBuild/1.0 (site data build; contact via site)'
STOP = {'inc', 'corp', 'corporation', 'co', 'ltd', 'plc', 'group', 'holdings', 'the', 'sa', 'se', 'nv', 'ag', 'and', 'company', 'limited'}

def words(name):
    return [w for w in re.findall(r'[a-z0-9]+', name.lower()) if w not in STOP]

def query(ticker):
    q = f'''SELECT DISTINCT ?item ?label ?hq ?hqLabel ?coord WHERE {{
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
    m = re.fullmatch(r'Point\(([-\d.]+) ([-\d.]+)\)', wkt or '')
    if not m: return None
    try: lat, lon = float(m.group(2)), float(m.group(1))
    except ValueError: return None
    return (lat, lon) if math.isfinite(lat) and math.isfinite(lon) and abs(lat) <= 90 and abs(lon) <= 180 else None


def select_match(asset, rows, checked):
    # Reaching LIMIT cannot establish uniqueness: an unseen item might also match.
    if len(rows) >= 20: return None, 'query result truncated; uniqueness not established'
    first = words(asset['n'])[:1]
    hits = [r for r in rows if first and first[0] in words(r.get('label', {}).get('value', ''))]
    if not hits: return None, 'no ticker/name match with headquarters coordinates'
    if len({r['item']['value'] for r in hits}) != 1: return None, 'multiple company identities'
    places = {}
    for r in hits:
        ll = parse_point(r.get('coord', {}).get('value'))
        if not ll or not r.get('hqLabel', {}).get('value'): return None, 'invalid or incomplete headquarters location'
        places[(r.get('hq', {}).get('value'), r['hqLabel']['value'], ll)] = r
    if len(places) != 1: return None, 'multiple headquarters or conflicting coordinates'
    r = next(iter(places.values())); ll = parse_point(r['coord']['value'])
    return {'hq_city': r['hqLabel']['value'], 'hq_lat': round(ll[0], 4), 'hq_lon': round(ll[1], 4),
            'qid': r['item']['value'].rsplit('/', 1)[-1],
            'source': 'Wikidata (CC0) P159 headquarters location, P625 coordinates',
            'source_url': r['item']['value'].replace('http://', 'https://'), 'checked_at': checked}, None


EXPECTED = {'NVDA': 'Santa Clara', 'AAPL': 'Cupertino', 'MSFT': 'Redmond'}


def check_reference_rows(companies):
    # Sanity checks only; expected cities are never written as replacement data.
    problems = [symbol + ': expected ' + city + ', got ' + str(companies.get(symbol, {}).get('hq_city'))
                for symbol, city in EXPECTED.items()
                if companies.get(symbol, {}).get('hq_city', '').split(',')[0].casefold() != city.casefold()]
    if problems: raise ValueError('Reference HQ verification failed: ' + '; '.join(problems))


def collect(stocks, query_fn=None, sleep_fn=time.sleep):
    query_fn = query_fn or query
    out, misses = {}, []
    checked = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    for i, a in enumerate(stocks):
        sym = a['s'].split('.')[0].upper()
        try: rows = query_fn(sym)
        except Exception as e:
            # A provider/proxy outage is not a company without a headquarters.
            # Abort without replacing the last successful output; do not hammer 600+ requests.
            raise RuntimeError(f"Source request failed for {a['s']}: {e.__class__.__name__}; output unchanged") from e
        match, why = select_match(a, rows, checked)
        if match: out[a['s']] = match
        else: misses.append({'s': a['s'], 'why': why})
        print(f"{i+1}/{len(stocks)} {a['s']}: {'matched' if match else why}", flush=True)
        sleep_fn(1.1)
    return {'schema': 'investedia.company-hq.v1', 'licence': 'CC0 1.0 (Wikidata)', 'checked_at': checked,
            'matched': len(out), 'asked': len(stocks), 'companies': out, 'not_matched': misses}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--limit', type=int)
    parser.add_argument('--output', type=pathlib.Path)
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1: parser.error('--limit must be positive')
    assets = json.loads(MARKETS.read_text())['assets']
    # Country ETFs are securities, not listed operating companies.
    stocks = [a for a in assets if a.get('t') == 'stocks' and a.get('g') not in ('Index', 'Country ETF')]
    if args.limit is None:
        print('Preflight: checking the first 10 companies before the full run.', flush=True)
        preflight = collect(stocks[:10]); check_reference_rows(preflight['companies'])
    doc = collect(stocks[:args.limit])
    if args.limit is None or {'NVDA','AAPL','MSFT'} <= {a['s'] for a in stocks[:args.limit]}:
        check_reference_rows(doc['companies'])
    # Limited checks never overwrite a complete registry.
    target = args.output or (OUT.with_name('company-hq.sample.json') if args.limit is not None else OUT)
    temp = target.with_suffix(target.suffix + '.tmp')
    temp.write_text(json.dumps(doc, ensure_ascii=False, indent=1, allow_nan=False) + '\n')
    temp.replace(target)
    print(f"asked {doc['asked']} matched {doc['matched']} not matched {len(doc['not_matched'])} -> {target}")

if __name__ == '__main__':
    main()
