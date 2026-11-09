import json, copy, unittest, importlib.util
from pathlib import Path
from tools.market_overview_evidence import market_relevance, physical_location, geo_allowed
ROOT = Path(__file__).resolve().parents[1]
def art(h, place='Lagos', country='Nigeria', impacts=()):
    return {'id': 'x', 'headline': h, 'location': {'place': place, 'country': country}, 'impacts': list(impacts)}

class Relevance(unittest.TestCase):
    def test_explicit_text_supported(self):
        self.assertEqual(market_relevance(art('CBN raises capital floor'), 'NG')['status'], 'supported')
    def test_model_impact_only_is_unverifiable(self):
        a = art('Lenders face tighter rules', impacts=[{'kind': 'country', 'country': 'NG'}])
        self.assertEqual(market_relevance(a, 'NG')['status'], 'unverifiable')
    def test_ambiguous_currency_word_not_supported(self):
        self.assertEqual(market_relevance(art('Real estate prices climb'), 'BR')['status'], 'unverifiable')
    def test_niger_is_not_nigeria(self):
        self.assertEqual(market_relevance(art('Niger junta extends mining ban'), 'NG')['status'], 'unsupported')

class Physical(unittest.TestCase):
    def test_place_in_text(self):
        r = physical_location(art('Lagos port congestion worsens'))
        self.assertEqual((r['status'], r['granularity']), ('supported', 'place'))
    def test_country_level_only(self):
        r = physical_location(art('Nigeria pushes exports'))
        self.assertEqual((r['status'], r['granularity']), ('supported', 'country'))
        self.assertFalse(geo_allowed(art('Nigeria pushes exports'), 'place'))
    def test_no_inference_from_hq_listing_or_dateline(self):
        # Recorded place (e.g. issuer HQ / dateline) absent from text -> unverifiable.
        a = art('MTN posts record data revenue', place='Johannesburg', country='South Africa')
        r = physical_location(a)
        self.assertEqual(r['status'], 'unverifiable'); self.assertFalse(geo_allowed(a))
        self.assertEqual(r['recorded'], a['location'])  # original preserved
    def test_inputs_unchanged(self):
        a = art('Nigeria pushes exports'); b = copy.deepcopy(a)
        market_relevance(a, 'NG'); physical_location(a); self.assertEqual(a, b)

try:
    import registry  # backend repository
    HAS_REGISTRY = True
except ImportError:
    HAS_REGISTRY = False

@unittest.skipUnless(HAS_REGISTRY, 'registry.py (backend repository) not on path')
class Builder(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location('mfe', ROOT/'tools/globe-news/build_market_focus.py')
        cls.m = importlib.util.module_from_spec(spec); spec.loader.exec_module(cls.m)
        from registry import Registry
        read = lambda p: json.loads((ROOT/p).read_text())
        cls.news = read('assets/globe/news-48h.json'); cls.conn = read('assets/globe/connections.json')
        cls.out = cls.m.project(cls.news, read('data/exchanges.json'), cls.conn, Registry(), read('assets/globe/iso.json'))
        cls.by = {a['id']: a for a in cls.news['stories']}
    def test_connections_only_with_supported_origin(self):
        lines = {c['id']: c for c in self.conn['connections']}
        for c in self.out['countries'].values():
            for lid in c['connections']: self.assertTrue(geo_allowed(self.by[lines[lid]['event']]))
    def test_developments_carry_both_statuses(self):
        for c in self.out['countries'].values():
            for d in c['developments']:
                self.assertIn(d['relevance'], ('supported', 'unverifiable', 'unsupported'))
                self.assertIn(d['location_evidence']['status'], ('supported', 'unverifiable'))
    def test_duplicates_kept_separate(self):
        ids = [d['id'] for c in self.out['countries'].values() for d in c['developments']]
        self.assertEqual(len(ids), len(set(ids)))  # no merged ids, nothing dropped by headline similarity
        for c in self.out['countries'].values():
            heads = [d['headline'] for d in c['developments']]
            self.assertEqual(len(heads), len(c['developments']))

if __name__ == '__main__': unittest.main()
