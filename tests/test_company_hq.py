"""Offline HQ builder safeguards; fixtures are not published headquarters data."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('company_hq',Path(__file__).parents[1]/'tools/hq/build_company_hq.py')
hq=importlib.util.module_from_spec(spec);spec.loader.exec_module(hq)

def binding(label='Fixture Holdings',item='Q123',city='Fixture City',coord='Point(1 52)',place='Q456'):
    return {k:{'value':v} for k,v in dict(item='http://www.wikidata.org/entity/'+item,label=label,hq='http://www.wikidata.org/entity/'+place,hqLabel=city,coord=coord).items()}

class CompanyHQTests(unittest.TestCase):
    def test_unique_explicit_match(self):
        r,why=hq.select_match({'n':'Fixture Holdings'},[binding()],'2026-11-11')
        self.assertIsNone(why);self.assertEqual((r['hq_lat'],r['hq_lon']),(52,1))
        self.assertEqual(r['qid'],'Q123')

    def test_first_word_is_not_a_substring_match(self):
        self.assertIsNone(hq.select_match({'n':'Fixture Holdings'},[binding(label='Unfixture Inc')],'2026-11-11')[0])

    def test_multiple_companies_or_headquarters_not_first_row_wins(self):
        for rows in ([binding(),binding(item='Q124')],[binding(),binding(city='Other city',place='Q457')],[binding(),binding(coord='Point(2 52)')]):
            self.assertIsNone(hq.select_match({'n':'Fixture Holdings'},rows,'2026-11-11')[0])
        self.assertIsNotNone(hq.select_match({'n':'Fixture Holdings'},[binding(),binding()],'2026-11-11')[0])

    def test_invalid_coordinates_and_truncated_results(self):
        for text in ['Point(181 52)','Point(1 91)','Point(1 52) trailing','Point(NaN 52)']:
            self.assertIsNone(hq.parse_point(text))
        self.assertIsNone(hq.select_match({'n':'Fixture Holdings'},[binding()]*20,'2026-11-11')[0])

    def test_source_failure_is_not_a_no_match(self):
        def fail(_):raise OSError('offline fixture')
        with self.assertRaisesRegex(RuntimeError,'output unchanged'):
            hq.collect([{'s':'FCT','n':'Fixture Holdings'}],query_fn=fail,sleep_fn=lambda _:None)

    def test_reference_check_never_fills_missing_or_wrong_cities(self):
        rows={'NVDA':{'hq_city':'Santa Clara'},'AAPL':{'hq_city':'Cupertino'},'MSFT':{'hq_city':'Redmond'}}
        hq.check_reference_rows(rows)
        rows['AAPL']['hq_city']='Wrong city'
        with self.assertRaises(ValueError):hq.check_reference_rows(rows)
        self.assertEqual(rows['AAPL']['hq_city'],'Wrong city')

    def test_failed_run_preserves_existing_file(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp)/'company-hq.json';out.write_text('previous successful data')
            with patch.object(hq,'OUT',out),patch.object(hq,'query',side_effect=OSError('offline fixture')),patch('sys.argv',['build_company_hq.py','--limit','10']):
                with self.assertRaises(RuntimeError):hq.main()
            self.assertEqual(out.read_text(),'previous successful data')
            self.assertFalse(out.with_name('company-hq.sample.json').exists())
