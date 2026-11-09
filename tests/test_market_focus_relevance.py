import json
import unittest
from pathlib import Path
try:  # registry.py lives in the backend repository; registry-backed checks run there
    from registry import Registry
except ImportError:
    Registry = None
NEEDS_REGISTRY = unittest.skipIf(Registry is None, 'registry.py (backend repository) not on path')
from tools.market_focus_relevance import country_rank, company_relevance, named
ROOT=Path(__file__).resolve().parents[1]
class CountryRankTests(unittest.TestCase):
    def test_exact_country_boundaries(self):
        self.assertFalse(named('Niger','Nigeria raises rates'))
    def test_cbn_policy_outranks_regional_debt(self):
        by={a['id']:a for a in json.loads((ROOT/'tests/fixtures/market-focus-ranking-articles.json').read_text())}
        self.assertGreater(country_rank(by['n61fdaeb550'],'Nigeria','NG'),country_rank(by['n6b834d62c0'],'Nigeria','NG'))
@NEEDS_REGISTRY
class RelevanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry=Registry()
        cls.articles=json.loads((ROOT/'assets/globe/news-48h.json').read_text())['stories']
    def test_exact_country_boundaries(self):
        self.assertFalse(named('Niger','Nigeria raises rates'))
        self.assertTrue(named('Nigeria','Nigeria raises rates'))
    def test_cbn_policy_outranks_real_regional_debt_article(self):
        by={a['id']:a for a in json.loads((ROOT/'tests/fixtures/market-focus-ranking-articles.json').read_text())}
        self.assertGreater(country_rank(by['n61fdaeb550'],'Nigeria','NG'),country_rank(by['n6b834d62c0'],'Nigeria','NG'))
    def test_real_articles_score_reproducibly(self):
        for a in self.articles:
            first=country_rank(a,a['location']['country'],'ZZ')
            self.assertEqual(first,country_rank(a,a['location']['country'],'ZZ'))
            self.assertIn(first[0],(0,1))
            self.assertEqual(first[-1],a['id'])
    def test_only_verified_companies_and_no_article_mutation(self):
        import copy
        n=0
        for a in self.articles:
            before=copy.deepcopy(a);rows=company_relevance(a,self.registry)
            self.assertEqual(a,before)
            self.assertEqual(len(rows),len({r['company_id'] for r in rows}))
            for row in rows:
                n+=1;self.assertIn(row['registry_id'],self.registry.assets)
                self.assertIn(self.registry.assets[row['registry_id']]['class'],('equity','fund'))
        self.assertGreater(n,0)
