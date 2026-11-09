import unittest
"""Market Overview: corporate-event significance and ranking (real fixtures)."""
import json, unittest, importlib.util
from pathlib import Path
try:  # registry.py lives in the backend repository; registry-backed checks run there
    from registry import Registry
except ImportError:
    Registry = None
NEEDS_REGISTRY = unittest.skipIf(Registry is None, 'registry.py (backend repository) not on path')
from tools.market_focus_relevance import corporate_significance, overview_rank, country_rank
ROOT = Path(__file__).resolve().parents[1]
FIX = {a['id']: a for a in json.loads((ROOT/'tests/fixtures/market-focus-ranking-articles.json').read_text())}

def art(**kw):
    base = {'id': 'x', 'headline': 'Acme Corp news', 'published_at': '2026-11-06T00:00:00Z', 'importance': 2, 'impacts': []}
    return base | kw

class OverviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.registry = Registry() if Registry else None

    def test_non_corporate_events_score_zero(self):
        for e in ('macro-data', 'regulation', 'rates', 'trade', None):
            self.assertEqual(corporate_significance(art(event_type=e)), (0.0, []))

    def test_event_weights_are_ordered(self):
        s = lambda e: corporate_significance(art(event_type=e))[0]
        self.assertGreater(s('m&a'), s('earnings'))
        self.assertEqual(s('earnings'), s('guidance'))
        self.assertGreater(s('guidance'), s('capital'))
        self.assertGreater(s('capital'), s('management'))

    def test_market_moving_flag_adds_bonus(self):
        a, b = art(event_type='earnings'), art(event_type='earnings', market_moving=True)
        self.assertAlmostEqual(corporate_significance(b)[0] - corporate_significance(a)[0], 0.25)

    @NEEDS_REGISTRY
    def test_unverified_company_gets_no_issuer_bonus(self):
        a = art(event_type='m&a', headline='Zzqx Holdings buys Qqzz Ltd',
                impacts=[{'kind': 'company', 'name': 'Zzqx Holdings', 'country': 'NG'}])
        score, reasons = corporate_significance(a, self.registry)
        self.assertEqual(score, 1.0)
        self.assertNotIn('verified issuer named in headline', reasons)

    def test_cbn_policy_still_outranks_regional_debt(self):
        cbn, debt = FIX['n61fdaeb550'], FIX['n6b834d62c0']
        self.assertGreater(overview_rank(cbn, 'Nigeria', 'NG', self.registry),
                           overview_rank(debt, 'Nigeria', 'NG', self.registry))

    def test_direct_relevance_dominates_corporate_significance(self):
        regional_deal = art(id='r', event_type='m&a', market_moving=True, importance=3, headline='African lenders merge')
        direct_minor = art(id='d', event_type='macro-data', importance=1, headline='Nigeria inflation data')
        self.assertGreater(overview_rank(direct_minor, 'Nigeria', 'NG'), overview_rank(regional_deal, 'Nigeria', 'NG'))

    def test_overview_rank_extends_country_rank_without_mutation(self):
        a = art(event_type='guidance', headline='Nigeria Acme guidance')
        before = json.dumps(a, sort_keys=True)
        o, c = overview_rank(a, 'Nigeria', 'NG'), country_rank(a, 'Nigeria', 'NG')
        self.assertEqual((o[0], o[2], o[3]), (c[0], c[2], c[3]))
        self.assertAlmostEqual(o[1] - c[1], 0.75)
        self.assertEqual(before, json.dumps(a, sort_keys=True))

    @NEEDS_REGISTRY
    def test_builder_uses_overview_rank(self):
        spec = importlib.util.spec_from_file_location('mf', ROOT/'tools/globe-news/build_market_focus.py')
        mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
        a = art(event_type='m&a', headline='Nigeria Acme deal')
        self.assertEqual(mod.rank(a, 'Nigeria', 'NG'), overview_rank(a, 'Nigeria', 'NG'))



@NEEDS_REGISTRY
class CorporateSlotTests(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location('mf2', ROOT/'tools/globe-news/build_market_focus.py')
        self.mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(self.mod)
        self.g = lambda a: a['g']
    def test_corporate_moved_into_top_four(self):
        arts = [art(id=str(i), g='Policy') for i in range(5)] + [art(id='c', g='Corporate', event_type='earnings')]
        out = self.mod.reserve_corporate_slot(arts, self.g)
        self.assertEqual([a['id'] for a in out], ['0', '1', '2', 'c', '3', '4'])
    def test_no_change_when_corporate_already_shown_or_absent(self):
        arts = [art(id='c', g='Corporate', event_type='m&a')] + [art(id=str(i), g='Policy') for i in range(5)]
        self.assertEqual(self.mod.reserve_corporate_slot(arts, self.g), arts)
        arts = [art(id=str(i), g='Policy') for i in range(6)]
        self.assertEqual(self.mod.reserve_corporate_slot(arts, self.g), arts)
if __name__ == '__main__': unittest.main()
