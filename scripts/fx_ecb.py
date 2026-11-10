"""Build assets/globe/fx-ecb.json from the ECB euro reference rates (no key).
USD-based cross rates are derived as EUR/XXX ÷ EUR/USD for the latest ECB date.
Keeps the previous file if the download or parsing fails."""
import json, sys, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path
URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml'
ROOT = Path(__file__).resolve().parents[1]
OUTS = [ROOT / 'assets/globe/fx-ecb.json', ROOT / 'docs/assets/globe/fx-ecb.json']
def main():
    try:
        raw = urllib.request.urlopen(urllib.request.Request(URL, headers={'User-Agent': 'InvestediaRobot/1.0'}), timeout=30).read()
        ns = {'e': 'http://www.ecb.int/vocabulary/2002-08-01/eurofxref'}
        days = ET.fromstring(raw).findall('.//e:Cube/e:Cube[@time]', ns)
        day = max(days, key=lambda d: d.get('time'))
        eur = {c.get('currency'): float(c.get('rate')) for c in day.findall('e:Cube', ns)}
        if 'USD' not in eur or len(eur) < 20: raise ValueError('incomplete ECB data')
    except Exception as e:
        print('ECB fetch failed; keeping previous file:', e, file=sys.stderr); return 1
    usd = {k: round(v / eur['USD'], 6) for k, v in eur.items() if k != 'USD'}
    usd['EUR'] = round(1 / eur['USD'], 6)
    out = {'schema': 'investedia.fx-ecb/v1', 'as_of': day.get('time'), 'source': 'European Central Bank, euro foreign exchange reference rates',
           'source_url': URL, 'terms': 'Reuse permitted with the source named (ECB). Reference rates are for information purposes only.',
           'method': 'USD/XXX = (EUR/XXX) / (EUR/USD), same ECB reference date', 'kind': 'daily reference rate, not a live or tradable price',
           'eur': eur, 'usd': dict(sorted(usd.items()))}
    for p in OUTS:
        p.parent.mkdir(parents=True, exist_ok=True); p.write_text(json.dumps(out, indent=1) + '\n', encoding='utf-8')
    print(json.dumps({'as_of': out['as_of'], 'currencies': len(usd)})); return 0
if __name__ == '__main__': sys.exit(main())
