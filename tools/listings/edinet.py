"""Listed companies in Japan from the Financial Services Agency's EDINET code list (owner task, 19 Nov 2026).

  python3 tools/listings/edinet.py      download and save data/listed-companies/edinet-jp.json

Why this source: the Japan Exchange Group's website terms forbid collecting its data for commercial use without permission,
so the TSE company list cannot be used. EDINET (the government's statutory disclosure system, run by the Financial
Services Agency) publishes a list of every filer as a download file. EDINET's terms
(https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WZEK0030.html) put its content under the Public Data
License 1.0 (reuse, including commercial, allowed with a source citation and a note when edited). They forbid scraping the
website, except for content the EDINET API does not provide; the code list is not in the API and is offered as a file.

Source credit to show with this data: 出典：EDINET閲覧（提出）サイト (the code-list download URL), PDL1.0
(https://www.digital.go.jp/resources/open_data/public_data_license_v1.0); edited by Investedia (filtered to listed companies).

Kept: filers marked 上場 (listed) with a securities code. The EDINET code list covers every Japanese exchange (Tokyo, Nagoya,
Sapporo, Fukuoka) and does not say which one, so the exchange is recorded as "Japanese stock exchanges". The TSE-style
code is the securities code without its last check digit (13760 -> 1376, 130A0 -> 130A). Left out: foreign companies
(the file does not say which country they are based in) and investment corporations (J-REITs, infrastructure funds).
Saved: code, English name, Japanese name, and EDINET's industry (in Japanese, as given). Nothing else.
"""
import csv, io, pathlib, sys, zipfile
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from listing_io import get, save

URL = 'https://disclosure2dl.edinet-fsa.go.jp/searchdocument/codelist/Edinetcode.zip'
TERMS = 'https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WZEK0030.html'


def main():
    raw = get(URL)
    z = zipfile.ZipFile(io.BytesIO(raw)); lines = z.read(z.namelist()[0]).decode('cp932').splitlines()
    rows = list(csv.reader(lines[1:])); head, data = rows[0], rows[1:]; I = {k: i for i, k in enumerate(head)}
    out = []
    for r in data:
        code = r[I['証券コード']].strip(); jp = r[I['提出者名']].strip()
        if r[I['上場区分']] != '上場' or not code or r[I['提出者種別']] != '内国法人・組合': continue
        if '投資法人' in jp or 'ＥＴＦ' in jp or 'ETF' in jp: continue  # J-REITs / funds are not ordinary shares of a company
        sym = code[:-1] if len(code) == 5 and code.endswith('0') else code
        out.append({'symbol': sym, 'name': r[I['提出者名（英字）']].strip() or None, 'name_local': jp, 'country_key': 'JP',
                    'industry': r[I['提出者業種']].strip() or None})
    save('edinet-jp', 'Japanese stock exchanges (EDINET listed filers, Financial Services Agency)', URL, TERMS, raw, out)


if __name__ == '__main__': main()
