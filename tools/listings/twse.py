"""Listed companies on the Taiwan Stock Exchange (TWSE), from TWSE's official OpenAPI (owner task, 19 Nov 2026).

  python3 tools/listings/twse.py      download and save data/listed-companies/twse.json

Terms: TWSE's website terms (https://www.twse.com.tw/en/terms/use.html) forbid downloading data with crawlers, scrapers or
other automated tools "unless by a means that Taiwan Stock Exchange has agreed to", and allow materials authorised for
public use through the Government Open Data Platform. The OpenAPI (openapi.twse.com.tw) is TWSE's own published
programmatic channel for its open data, so this tool uses it and nothing else.

Dataset t187ap03_L (listed companies' basic information) gives: company code, Chinese full name, English abbreviation and
website. The English abbreviation is the company's official short English name and is used as `name`; the Chinese full
name is kept as `name_local`. The industry field is only a numeric code, so it is not saved. Taiwan Depositary Receipts
(codes starting 91: foreign companies' receipts) are left out. Country stays TW: the dataset's "foreign registration
country" is where a company is incorporated (often the Cayman Islands), not where it is based.
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from listing_io import get, save

URL = 'https://openapi.twse.com.tw/v1/opendata/t187ap03_L'
TERMS = 'https://www.twse.com.tw/en/terms/use.html'


def main():
    raw = get(URL); rows = []
    for r in json.loads(raw):
        code = (r.get('公司代號') or '').strip()
        if not code or code.startswith('91'): continue
        site = (r.get('網址') or '').strip()
        rows.append({'symbol': code, 'name': r.get('英文簡稱'), 'name_local': r.get('公司名稱'), 'country_key': 'TW',
                     'website': site if re.match(r'(?i)^https?://[^\s/]+\.[^\s]+$', site) else None})  # malformed addresses are dropped, not repaired
    save('twse', 'Taiwan Stock Exchange', URL, TERMS, raw, rows)


if __name__ == '__main__': main()
