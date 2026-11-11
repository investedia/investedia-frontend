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
        self.assertIsNone(hq.select_match({'n':'Fixture Holdings'},[binding(city='Q456')],'2026-11-11')[0])

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
            with patch.object(hq,'OUT',out),patch.object(hq,'query_many',side_effect=OSError('offline fixture')),patch('sys.argv',['build_company_hq.py','--limit','10']):
                with self.assertRaises(RuntimeError):hq.main()
            self.assertEqual(out.read_text(),'previous successful data')
            self.assertFalse(out.with_name('company-hq.sample.json').exists())

    def test_query_includes_listing_qualifiers_and_groups_tickers(self):
        import io, json, urllib.parse
        r=binding();r['ticker']={'value':'FCT_OFFLINE_FIXTURE_20261111'}
        with patch.object(hq.urllib.request,'urlopen',return_value=io.BytesIO(json.dumps({'results':{'bindings':[r]}}).encode())) as request, patch.object(hq,'active_rows',side_effect=lambda rows,tickers:rows), patch.object(hq.pathlib.Path,'exists',return_value=False), patch.object(hq.pathlib.Path,'write_text'):
            result=hq.query_many(['FCT_OFFLINE_FIXTURE_20261111','OTHER'])
        self.assertEqual(len(result['FCT_OFFLINE_FIXTURE_20261111']),1);self.assertEqual(result['OTHER'],[])
        q=urllib.parse.parse_qs(urllib.parse.urlsplit(request.call_args.args[0].full_url).query)['query'][0]
        self.assertIn('p:P414/pq:P249',q);self.assertIn('VALUES ?ticker',q)

    def test_partial_name_collision_is_rejected(self):
        r,why=hq.select_match({'n':'Reliance Industries'},[binding(label='Reliance Sekuritas Indonesia')],'2026-11-11')
        self.assertIsNone(r)
        r,why=hq.select_match({'n':"L'Oreal"},[binding(label="L’Oréal")],'2026-11-11')
        self.assertIsNotNone(r)

    def test_ended_and_dissolved_candidates_are_rejected(self):
        r=binding();r['ticker']={'value':'FCT'}
        def state(kind,**values):
            return {'item':r['item'],'kind':{'value':kind},**{k:{'value':v} for k,v in values.items()}}
        states=[state('listing',ticker='FCT',rank='http://wikiba.se/ontology#NormalRank'),state('hq',hq=r['hq']['value'],rank='http://wikiba.se/ontology#NormalRank')]
        with patch.object(hq,'fetch_rows',return_value=states),patch.object(hq.time,'sleep'):
            self.assertEqual(len(hq.active_rows([r],['FCT'])),1)
        for extra in [state('dissolved',end='2016-01-01T00:00:00Z')]:
            with patch.object(hq,'fetch_rows',return_value=states+[extra]),patch.object(hq.time,'sleep'):
                self.assertEqual(hq.active_rows([r],['FCT']),[])
        states[0]['end']={'value':'2016-01-01T00:00:00Z'}
        with patch.object(hq,'fetch_rows',return_value=states),patch.object(hq.time,'sleep'):
            self.assertEqual(hq.active_rows([r],['FCT']),[])

    def test_domain_suffix_not_an_identity_word(self):
        r,why=hq.select_match({'n':'Amazon.com Inc'},[binding(label='Amazon')],'2026-11-11')
        self.assertIsNotNone(r)

    def test_review_notes_flag_source_issues_without_inventing_a_city(self):
        row={'qid':'Q66','hq_qid':'Q1297','hq_city':'Chicago','hq_lat':41.8819,'hq_lon':-87.6278}
        out=hq.annotate_review({'BA':row})
        self.assertEqual(out[0]['s'],'BA');self.assertEqual(row['hq_city'],'Chicago')
        self.assertIn('Potentially stale',row['review_notes'][0])
