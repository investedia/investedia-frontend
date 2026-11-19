"""Listed companies on the Taipei Exchange (TPEx) main market, from TPEx's official OpenAPI (owner task, 19 Nov 2026).

  python3 tools/listings/tpex.py      download and save data/listed-companies/tpex.json

Terms: TPEx's website terms (https://www.tpex.org.tw/zh-tw/gtsm_disclaimer.html, section 5) forbid downloading data with
automated tools "unless by a means TPEx has agreed to", and section 7 exempts what TPEx has authorised for the government
open data platform. The OpenAPI (www.tpex.org.tw/openapi) is TPEx's own published channel for that open data.

Dataset mopsfin_t187ap03_O (basic information of TPEx-listed companies; the emerging board is a separate dataset and is not
used) gives: company code, Chinese full name, English abbreviation ("Symbol") and website. The English abbreviation is
used as `name`, the Chinese full name as `name_local`. The industry field is a numeric code and is not saved. Codes
starting 91 would be depositary receipts of foreign companies and are left out. Country stays TW (the "Registration"
field is the place of incorporation, not where the company is based).
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from listing_io import get, save

URL = 'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap03_O'
TERMS = 'https://www.tpex.org.tw/zh-tw/gtsm_disclaimer.html'


def main():
    raw = get(URL); rows = []
    for r in json.loads(raw):
        code = (r.get('SecuritiesCompanyCode') or '').strip()
        if not code or code.startswith('91'): continue
        site = (r.get('WebAddress') or '').strip(' 　')
        rows.append({'symbol': code, 'name': r.get('Symbol'), 'name_local': r.get('CompanyName'), 'country_key': 'TW',
                     'website': site if re.match(r'(?i)^https?://[^\s/]+\.[^\s]+$', site) else None})  # malformed addresses are dropped, not repaired
    save('tpex', 'Taipei Exchange (TPEx)', URL, TERMS, raw, rows)


if __name__ == '__main__': main()
