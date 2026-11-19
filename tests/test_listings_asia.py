"""Checks for the official Asian exchange lists in data/listed-companies (owner task, 19 Nov 2026).

Every file written by tools/listings/listing_io.save (it has a terms_url) must follow investedia.listed-companies/v1:
required fields, a sensible count that matches the list, no duplicate symbols, company-like names, valid 2-letter country
codes, only the allowed listing fields, and no instruments that are not ordinary shares.
"""
import json, pathlib, re, unittest

DIR = pathlib.Path(__file__).resolve().parents[1] / 'data/listed-companies'
ASIA = ['twse', 'tpex', 'edinet-jp']  # exchanges saved by this task; see data/listed-companies/ASIA-REPORT.md for the skipped ones
FIELDS = {'symbol', 'name', 'name_local', 'isin', 'country_key', 'sector', 'industry', 'website'}
NOT_SHARE = re.compile(r'(?<![-\w])(ETF|REIT|Fund|Warrant|Bond|Preferred|Preference|Depositary)(?![-\w])', re.I)  # 'SHO-BOND Holdings' is a company


def files():
    return [p for p in sorted(DIR.glob('*.json')) if 'terms_url' in json.loads(p.read_text(encoding='utf-8'))]


class ListingsAsia(unittest.TestCase):
    def test_expected_files_exist(self):
        have = {p.stem for p in files()}
        for k in ASIA: self.assertIn(k, have)

    def test_format(self):
        for p in files():
            with self.subTest(file=p.name):
                d = json.loads(p.read_text(encoding='utf-8'))
                self.assertEqual(d['schema'], 'investedia.listed-companies/v1')
                for k in ('exchange', 'source_url', 'terms_url', 'checked_at', 'source_sha256', 'count', 'listings'): self.assertTrue(d.get(k), k)
                self.assertTrue(d['source_url'].startswith('https://') and d['terms_url'].startswith('https://'))
                self.assertRegex(d['checked_at'], r'^\d{4}-\d{2}-\d{2}$'); self.assertRegex(d['source_sha256'], r'^[0-9a-f]{64}$')
                L = d['listings']; self.assertEqual(d['count'], len(L)); self.assertTrue(50 <= len(L) <= 6000, 'count not sensible')
                syms = [r['symbol'] for r in L]; self.assertEqual(len(syms), len(set(syms)), 'duplicate symbols')
                for r in L:
                    self.assertLessEqual(set(r), FIELDS, r)
                    self.assertTrue(r['symbol'] and r['name'], r)
                    self.assertRegex(r['country_key'], r'^[A-Z]{2}$')
                    self.assertTrue(len(re.findall(r'[^\W\d_]', r['name'])) >= 2 or r.get('name_local'), r)  # 'H&L', 'T.S.M.C.' and '55688' (Taiwan Taxi) are real short names
                    if not re.search(r'(?i)\b(co|ltd|inc|corp|corporation|holdings|group|plc)\b', r['name']):  # 'Fund Creation Group Co.,Ltd' is a company
                        self.assertFalse(NOT_SHARE.search(r['name']), r)
                    if 'isin' in r: self.assertRegex(r['isin'], r'^[A-Z]{2}[A-Z0-9]{9}\d$')
                    if 'website' in r: self.assertTrue(r['website'].lower().startswith(('http://', 'https://')), r)


if __name__ == '__main__': unittest.main()
