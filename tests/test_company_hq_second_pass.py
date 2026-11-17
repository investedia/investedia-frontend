import pathlib, sys, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'tools' / 'hq'))
import second_pass as P

def row(item='Q1', label='Maersk', hq='Q9', coord='Point(12.6 55.7)', cc='dk', city=True, listed=True, hqlabel='Copenhagen'):
    r = {'item': {'value': 'http://www.wikidata.org/entity/' + item}, 'label': {'value': label}, 'hq': {'value': 'http://www.wikidata.org/entity/' + hq},
         'hqLabel': {'value': hqlabel}, 'coord': {'value': coord}, 'hqcc': {'value': cc}}
    if city: r['city'] = {'value': 'true'}
    if listed: r['listed'] = {'value': 'true'}
    return r

CO = {'slug': 'maersk', 'name': 'A.P. Møller - Mærsk', 'legal_name': 'A.P. Møller - Mærsk', 'country': 'Denmark', 'cc': 'dk', 'listings': [{'s': 'MAERSK-B.CO'}]}

class SecondPass(unittest.TestCase):
    def test_variants_cover_common_ticker_spellings(self):
        self.assertIn('MAERSK B', P.variants('MAERSK-B.CO'))
        self.assertTrue({'700', '0700', '00700'} <= P.variants('0700.HK'))

    def test_single_match_in_home_country_is_accepted(self):
        got, why = P.decide(CO, [row(label='A.P. Møller-Mærsk')], 'wikidata-ticker')
        self.assertIsNone(why); self.assertEqual((got['hq_city'], got['precision'], got['qid']), ('Copenhagen', 'city', 'Q1'))
        self.assertTrue(got['source_url'].endswith('/Q1'))

    def test_two_companies_is_not_a_match(self):
        got, why = P.decide(CO, [row(label='Maersk'), row(item='Q2', label='Maersk Drilling')], 'wikidata-ticker')
        self.assertIsNone(got); self.assertIn('multiple', why)

    def test_hq_in_another_country_goes_to_review(self):
        got, why = P.decide(CO, [row(label='Maersk', cc='gb')], 'wikidata-ticker')
        self.assertIsNone(got); self.assertIn('GB', why)

    def test_name_must_overlap(self):
        self.assertEqual(P.decide(CO, [row(label='Novo Nordisk')], 'wikidata-ticker'), (None, None))

    def test_name_search_requires_a_listed_company(self):
        self.assertEqual(P.decide(CO, [row(label='Maersk', listed=False)], 'wikidata-name'), (None, None))

    def test_dissolved_company_is_ignored(self):
        r = row(label='Maersk'); r['end'] = {'value': '2010-01-01'}
        self.assertEqual(P.decide(CO, [r], 'wikidata-ticker'), (None, None))

    def test_hong_kong_accepts_china_country_only_inside_hong_kong(self):
        hk = dict(CO, cc='hk', country='Hong Kong', name='Maersk HK', legal_name='')
        self.assertIsNotNone(P.decide(hk, [row(label='Maersk', cc='cn', coord='Point(114.17 22.28)')], 'x')[0])
        got, why = P.decide(hk, [row(label='Maersk', cc='cn', coord='Point(121.47 31.23)')], 'x')
        self.assertIsNone(got); self.assertIn('outside Hong Kong', why)

    def test_initials_label_matches(self):
        amd = dict(CO, name='Advanced Micro Devices', legal_name='Advanced Micro Devices', cc='us', country='United States', listings=[{'s': 'AMD'}])
        got, _ = P.decide(amd, [row(label='AMD', cc='us', coord='Point(-121.96 37.35)')], 'wikidata-ticker')
        self.assertIsNotNone(got)

    def test_unrelated_short_label_without_ticker_match_is_rejected(self):
        self.assertEqual(P.decide(CO, [row(label='XYZ')], 'wikidata-name'), (None, None))

if __name__ == '__main__': unittest.main()
