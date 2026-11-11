"""Build assets/globe/company-hq.json: head-office city for each listed company.

Source: Wikidata (CC0). Match rule: ticker (P249, including the stock-exchange P414 qualifier) equals the asset symbol with any
exchange suffix removed, the company has a headquarters location (P159) with
coordinates (P625), and the English label contains every significant word of the
asset name. Ended listings/HQ statements and dissolved companies are excluded. Only one matching item may remain; otherwise the company is left out
(its HQ shows as "not available"). Never guesses.
Limited checks write company-hq.sample.json; only a successful full run writes company-hq.json.
Source errors abort without replacing either file.
Usage: python3 tools/hq/build_company_hq.py [--limit N] [--output PATH]
"""
import argparse, hashlib, json, math, re, sys, time, urllib.error, urllib.parse, urllib.request, datetime, pathlib, unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[2]
MARKETS = ROOT / 'assets/globe/markets.json'
OUT = ROOT / 'assets/globe/company-hq.json'
NETWORK_REQUESTS = 0
UA = 'InvestediaBuild/1.0 (site data build; contact via site)'
STOP = {'inc', 'corp', 'corporation', 'co', 'ltd', 'plc', 'group', 'holdings', 'the', 'sa', 'se', 'nv', 'ag', 'and', 'company', 'limited'}

def words(name):
    name = re.sub(r'\.com\b', '', name, flags=re.I)
    name = ''.join(c for c in unicodedata.normalize('NFKD', name.casefold()) if not unicodedata.combining(c))
    return [w for w in re.findall(r'[a-z0-9]+', name) if w not in STOP]

def query_many(tickers):
    tickers = sorted(set(tickers))
    if not tickers or len(tickers) > 10: raise ValueError('Use batches of 1–10 tickers')
    values = ' '.join(json.dumps(t) for t in tickers)
    cap = 20 * len(tickers)
    q = f'''SELECT DISTINCT ?ticker ?item ?label ?hq ?hqLabel ?coord WHERE {{
      VALUES ?ticker {{ {values} }}
      {{ ?item wdt:P249 ?ticker }} UNION {{ ?item p:P414/pq:P249 ?ticker }}
      ?item wdt:P159 ?hq . ?hq wdt:P625 ?coord .
      ?item rdfs:label ?label . FILTER(LANG(?label)="en")
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }} LIMIT {cap}'''
    rows = active_rows(fetch_rows(q, cap), tickers)
    grouped = {t: [] for t in tickers}
    for row in rows:
        ticker = row['ticker']['value']
        if ticker not in grouped: raise ValueError('Unexpected ticker in source response')
        grouped[ticker].append(row)
    return grouped


def fetch_rows(q, cap):
    global NETWORK_REQUESTS
    cache_dir = pathlib.Path('/tmp/investedia-hq-query-cache')
    cache_dir.mkdir(exist_ok=True)
    day = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    cache = cache_dir / (day + '-' + hashlib.sha256(q.encode()).hexdigest() + '.json')
    cached = json.loads(cache.read_text()) if cache.exists() else None
    url = 'https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': q, 'format': 'json'})
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/sparql-results+json'})
    for attempt in range(5):
        try:
            if cached is not None:
                rows = cached
                break
            NETWORK_REQUESTS += 1
            with urllib.request.urlopen(req, timeout=60) as r:
                rows = json.load(r)['results']['bindings']
            break
        except urllib.error.HTTPError as e:
            if e.code not in (429, 502, 503, 504) or attempt == 4: raise
            retry = e.headers.get('Retry-After', '')
            delay = int(retry) if retry.isdigit() else 5 * (attempt+1)
            if delay > 600: raise
            print(f'Wikidata HTTP {e.code}; respecting Retry-After/backoff {delay}s', flush=True)
            remaining = delay
            while remaining:
                pause = min(30, remaining)
                time.sleep(pause); remaining -= pause
                if remaining: print(f'Wikidata cooldown: {remaining}s remaining', flush=True)
    if len(rows) >= cap: raise ValueError('Query truncated; uniqueness cannot be verified')
    if cached is None: cache.write_text(json.dumps(rows, ensure_ascii=False))
    return rows


def active_rows(rows, tickers):
    # Fetch status only for identified candidates. Filtering in Python avoids a
    # graph-wide anti-join that can exhaust the public query service's time budget.
    ids = sorted({r['item']['value'].rsplit('/', 1)[-1] for r in rows})
    if any(not re.fullmatch(r'Q[1-9]\d*', q) for q in ids): raise ValueError('Invalid source entity')
    states = {}
    for offset in range(0, len(ids), 30):
        values = ' '.join('wd:'+q for q in ids[offset:offset+30])
        q = f'''SELECT DISTINCT ?item ?kind ?ticker ?hq ?end ?rank WHERE {{
          VALUES ?item {{ {values} }}
          {{ ?item wdt:P576 ?end . BIND("dissolved" AS ?kind) }} UNION
          {{ {{ ?item p:P414 ?statement . ?statement pq:P249 ?ticker }} UNION
             {{ ?item p:P249 ?statement . ?statement ps:P249 ?ticker }}
             ?statement wikibase:rank ?rank . OPTIONAL {{ ?statement pq:P582 ?end }} BIND("listing" AS ?kind) }} UNION
          {{ ?item p:P159 ?statement . ?statement ps:P159 ?hq; wikibase:rank ?rank .
             OPTIONAL {{ ?statement pq:P582 ?end }} BIND("hq" AS ?kind) }}
        }} LIMIT 5000'''
        network_before = NETWORK_REQUESTS
        for r in fetch_rows(q, 5000):
            item=r['item']['value']; st=states.setdefault(item, {'dissolved':False,'listings':set(),'hqs':set()})
            end=r.get('end',{}).get('value'); ended=bool(end and end.lstrip('+')[:10] <= datetime.datetime.now(datetime.timezone.utc).date().isoformat())
            kind=r['kind']['value']
            if kind=='dissolved': st['dissolved'] |= ended
            elif not ended and not r.get('rank',{}).get('value','').endswith('DeprecatedRank'):
                if kind=='listing': st['listings'].add(r['ticker']['value'])
                elif kind=='hq': st['hqs'].add(r['hq']['value'])
        if NETWORK_REQUESTS != network_before: time.sleep(1.1)
    return [r for r in rows if (st:=states.get(r['item']['value'])) and not st['dissolved']
            and r['ticker']['value'] in st['listings'] and r['hq']['value'] in st['hqs']]


def query(ticker):
    return query_many([ticker])[ticker]


def parse_point(wkt):
    m = re.fullmatch(r'Point\(([-\d.]+) ([-\d.]+)\)', wkt or '')
    if not m: return None
    try: lat, lon = float(m.group(2)), float(m.group(1))
    except ValueError: return None
    return (lat, lon) if math.isfinite(lat) and math.isfinite(lon) and abs(lat) <= 90 and abs(lon) <= 180 else None


def select_match(asset, rows, checked):
    # Reaching LIMIT cannot establish uniqueness: an unseen item might also match.
    if len(rows) >= 20: return None, 'query result truncated; uniqueness not established'
    required = set(words(asset['n']))
    hits = [r for r in rows if required and required <= set(words(r.get('label', {}).get('value', '')))]
    if not hits: return None, 'no ticker/name match with headquarters coordinates'
    if len({r['item']['value'] for r in hits}) != 1: return None, 'multiple company identities'
    places = {}
    for r in hits:
        ll = parse_point(r.get('coord', {}).get('value'))
        if not ll or not r.get('hqLabel', {}).get('value'): return None, 'invalid or incomplete headquarters location'
        if re.fullmatch(r'Q[1-9]\d*', r['hqLabel']['value']): return None, 'headquarters label unavailable'
        places[(r.get('hq', {}).get('value'), r['hqLabel']['value'], ll)] = r
    if len(places) != 1: return None, 'multiple headquarters or conflicting coordinates'
    r = next(iter(places.values())); ll = parse_point(r['coord']['value'])
    return {'hq_city': r['hqLabel']['value'], 'hq_lat': round(ll[0], 4), 'hq_lon': round(ll[1], 4),
            'qid': r['item']['value'].rsplit('/', 1)[-1],
            'hq_qid': r.get('hq', {}).get('value', '').rsplit('/', 1)[-1], 'company_label': r['label']['value'],
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
    out, misses = {}, []
    checked = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    size = 1 if query_fn else 10
    for start in range(0, len(stocks), size):
        batch = stocks[start:start+size]
        symbols = [a['s'].split('.')[0].upper() for a in batch]
        network_before = NETWORK_REQUESTS
        try:
            grouped = ({symbols[0]: query_fn(symbols[0])} if query_fn else query_many(symbols))
        except Exception as e:
            raise RuntimeError(f"Source request failed for batch starting {batch[0]['s']}: {e.__class__.__name__}; output unchanged") from e
        for i, (a, sym) in enumerate(zip(batch, symbols), start+1):
            match, why = select_match(a, grouped[sym], checked)
            if match: out[a['s']] = match
            else: misses.append({'s': a['s'], 'why': why})
            print(f"{i}/{len(stocks)} {a['s']}: {'matched' if match else why}", flush=True)
        if query_fn or NETWORK_REQUESTS != network_before:
            sleep_fn(5)  # sequential bounded requests; cached batches require no provider delay
    return {'schema': 'investedia.company-hq.v1', 'licence': 'CC0 1.0 (Wikidata)', 'checked_at': checked,
            'matched': len(out), 'asked': len(stocks), 'companies': out, 'not_matched': misses}


def annotate_review(companies):
    # Manual audit notes pinned to the exact source entity/location pair observed.
    # These are warnings, not alternative facts; a changed source pair clears the note.
    notes = {
        ('Q66','Q1297'): 'Potentially stale Boeing HQ location; independent current-source review required.',
        ('Q7338847','Q12439'): 'Potentially stale Rivian HQ location; independent current-source review required.',
        ('Q17012234','Q720087'): 'Potentially stale Enphase HQ location; independent current-source review required.',
        ('Q1089060','Q367280'): 'Legacy Chubb Corp entity; current CB issuer identity requires review.',
        ('Q107453017','Q5785'): 'HQ source identifies a country/territory, not a city.',
    }
    flagged = []
    for symbol, row in companies.items():
        warnings = []
        note = notes.get((row['qid'], row.get('hq_qid')))
        if note: warnings.append(note)
        if re.search(r'headquarters|campus|tower|building|palazzo|quai|^\d+\s', row['hq_city'], re.I):
            warnings.append('Source HQ label is a site/address; city name has not been resolved.')
        if warnings:
            row['review_notes'] = warnings
            flagged.append({'s':symbol,'why':warnings})
    return flagged


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
    doc['review_required'] = annotate_review(doc['companies'])
    # Limited checks never overwrite a complete registry.
    target = args.output or (OUT.with_name('company-hq.sample.json') if args.limit is not None else OUT)
    temp = target.with_suffix(target.suffix + '.tmp')
    temp.write_text(json.dumps(doc, ensure_ascii=False, indent=1, allow_nan=False) + '\n')
    temp.replace(target)
    print(f"asked {doc['asked']} matched {doc['matched']} not matched {len(doc['not_matched'])} -> {target}")

if __name__ == '__main__':
    main()
