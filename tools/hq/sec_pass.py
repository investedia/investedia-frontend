#!/usr/bin/env python3
"""HQ pass from SEC EDGAR business addresses (owner, 18 Nov 2026): companies listed in the US (including foreign
issuers filing 20-F/40-F/6-K) whose HQ is still missing or held for review.

Source: the company's own filing profile on data.sec.gov (submissions JSON, "addresses.business" = principal executive
office), matched by exact ticker through SEC's company_tickers.json. US public-domain data.
City coordinates: US cities from the US Census 2024 Gazetteer places (public domain); cities outside the US from the
reviewed Wikidata (CC0) city table below (QID checked by name, country and description, 18 Nov 2026).
Rules: the ticker must be the company's SEC ticker; the HQ country must equal the directory country, else the row goes
to review_required (e.g. MercadoLibre: Montevideo vs Argentina); funds/ETFs are skipped; a city without a unique
coordinate source is skipped. Existing HQ rows are never changed; rows held for review are resolved only when this
independent, current company filing gives a city in the directory country.
Usage: python3 tools/hq/sec_pass.py [--check]
"""
import argparse, datetime, hashlib, io, json, pathlib, re, time, urllib.request, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[2]
HQ = ROOT / 'assets/globe/company-hq.json'; MK = ROOT / 'assets/globe/markets.json'
UA = {'User-Agent': 'InvestediaBuild/1.0 admin@example.com'}
TODAY = datetime.date.today().isoformat()
# SEC city (upper case) + SEC state/country code -> (display city, Wikidata QID, lat, lon, ISO country)
FOREIGN = {('DR VELDHOVEN', 'P7'): ('Veldhoven', 'Q9875', 51.42, 5.405, 'NL'), ('BAGSVAERD DENMARK', 'G7'): ('Bagsværd', 'Q2509805', 55.76, 12.455, 'DK'),
           ('TORONTO', None): ('Toronto', 'Q172', 43.6703, -79.3867, 'CA'), ('TORONTO, ONTARIO', 'A6'): ('Toronto', 'Q172', 43.6703, -79.3867, 'CA'),
           ('MONTEVIDEO', 'X3'): ('Montevideo', 'Q1335', -34.9059, -56.1913, 'UY'), ('SAO PAULO, SP', 'D5'): ('São Paulo', 'Q174', -23.5504, -46.6339, 'BR'),
           ('CAMBRIDGE', None): ('Cambridge', 'Q350', 52.2081, 0.1225, 'GB'), ('MARANELLO', 'L6'): ('Maranello', 'Q100060', 44.5264, 10.8667, 'IT'),
           ('TOKYO', 'M0'): ('Tokyo', 'Q1490', 35.6894, 139.6917, 'JP'), ('LONDON, SW1Y 4AD', 'X0'): ('London', 'Q84', 51.5072, -0.1275, 'GB'),
           ('TEL AVIV', None): ('Tel Aviv', 'Q33935', 32.08, 34.78, 'IL'), ('MEDELLIN', None): ('Medellín', 'Q48278', 6.2502, -75.5676, 'CO'),
           ('ZURICH', 'V8'): ('Zürich', 'Q72', 47.3744, 8.5411, 'CH'), ('WOKING SURREY', 'X0'): ('Woking', 'Q646225', 51.3161, -0.5611, 'GB')}
DIR_CC = {'United States': 'US', 'Netherlands': 'NL', 'Denmark': 'DK', 'Canada': 'CA', 'Brazil': 'BR', 'United Kingdom': 'GB', 'Italy': 'IT', 'Japan': 'JP',
          'Israel': 'IL', 'Colombia': 'CO', 'Switzerland': 'CH', 'Argentina': 'AR', 'Australia': 'AU', 'Taiwan': 'TW'}

def get(url):
    b = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read(); time.sleep(0.25); return b

def gazetteer():
    z = zipfile.ZipFile(io.BytesIO(get('https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip')))
    g = {}
    for line in z.read(z.namelist()[0]).decode('utf-8', 'replace').splitlines()[1:]:
        c = line.split('\t'); nm = re.sub(r' (city|town|village|CDP|borough|municipality)$', '', c[3].strip()).upper().replace('ST. ', 'ST ').replace('SAINT ', 'ST ')
        g.setdefault((c[0], nm), []).append((float(c[10]), float(c[11].strip()), c[3].strip(), c[1]))
    return g

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--check', action='store_true'); a = ap.parse_args()
    H = json.loads(HQ.read_text()); M = {x['s']: x for x in json.loads(MK.read_text())['assets']}
    tick = {v['ticker']: v for v in json.loads(get('https://www.sec.gov/files/company_tickers.json')).values()}
    want = [s for s, x in M.items() if x['t'] == 'stocks' and x.get('g') != 'Index' and not s.startswith('^') and '.' not in s and s not in H['companies'] and s in tick]
    G = gazetteer(); added, review = [], []
    rr = {x['s']: x for x in H.get('review_required', [])}
    for s in want:
        cik = tick[s]['cik_str']; url = f'https://data.sec.gov/submissions/CIK{cik:010d}.json'; raw = get(url); d = json.loads(raw)
        if s not in d.get('tickers', []): continue
        forms = set(d['filings']['recent']['form'][:200])
        if forms & {'N-CSR', 'N-PORT-P', 'NPORT-P', 'N-CEN'} or 'ETF' in d['name'].upper() or 'TRUST' in d['name'].upper() and 'S&P' in d['name'].upper(): continue
        ad = d['addresses']['business']; city, st = (ad.get('city') or '').strip().upper(), ad.get('stateOrCountry')
        dir_cc = DIR_CC.get(M[s]['k'])
        if not ad.get('isForeignLocation') and st and len(st) == 2 and st.isalpha() and city:
            hits = G.get((st, city.replace('ST. ', 'ST ').replace('SAINT ', 'ST ')))
            if not hits or len([h for h in hits if not h[2].endswith('CDP')] or hits) != 1: continue
            lat, lon, full, geoid = ([h for h in hits if not h[2].endswith('CDP')] or hits)[0]; cc, label = 'US', full.rsplit(' ', 1)[0]
            csrc = f'US Census 2024 Gazetteer place {geoid} (public domain)'
        else:
            f = FOREIGN.get((city, st))
            if not f: continue
            label, qid, lat, lon, cc = f; csrc = f'Wikidata {qid} (CC0) city coordinates'
        row = {'hq_city': label, 'hq_lat': round(lat, 4), 'hq_lon': round(lon, 4), 'cik': f'{cik:010d}', 'company_label': d['name'], 'precision': 'city', 'method': 'sec-business-address',
               'source': f'SEC EDGAR company filing profile: business address {city.title()}{", " + st if st else ""}; {csrc}', 'source_url': url, 'source_sha256': hashlib.sha256(raw).hexdigest(), 'checked_at': TODAY}
        if dir_cc and cc != dir_cc:
            review.append({'s': s, 'why': [f'SEC business address is in {label} ({cc}), directory says {M[s]["k"]}'], 'candidate': row}); continue
        H['companies'][s] = row; added.append(s); rr.pop(s, None)
    H['review_required'] = list(rr.values()) + [r for r in review if r['s'] not in rr]
    H['not_matched'] = [x for x in H.get('not_matched', []) if x.get('s') not in H['companies']]
    H['sec_pass'] = {'checked_at': TODAY, 'method': 'tools/hq/sec_pass.py', 'added': len(added)}; H['matched'] = len(H['companies'])
    print(f'added {len(added)}: {added}\nreview {len(review)}: {[r["s"] for r in review]}')
    if not a.check: HQ.write_text(json.dumps(H, ensure_ascii=False, indent=1) + '\n')

if __name__ == '__main__': main()
