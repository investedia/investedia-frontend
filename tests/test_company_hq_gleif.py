import pathlib, sys, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'tools' / 'hq'))
import gleif_pass as G

def rec(lei, name, city='Lisbon', country='PT', status='ISSUED', category='GENERAL'):
    a = {'city': city, 'country': country, 'addressLines': ['x']}
    return {'id': lei, 'attributes': {'registration': {'status': status}, 'entity': {'legalName': {'name': name}, 'category': category,
            'headquartersAddress': a, 'legalAddress': dict(a)}}}

IDX = {'PT': {'lisbon': [(38.72, -9.14, 500000, 'Lisbon')]}, 'US': {'wilmington': [(39.7, -75.5, 70000, 'Wilmington')]},
       'SE': {G.fold('Västerås'): [(59.6, 16.5, 127000, 'Västerås')]}}
EDP = {'name': 'EDP', 'legal_name': 'EDP', 'cc': 'pt', 'country': 'Portugal'}

class Gleif(unittest.TestCase):
    def test_initials_join_and_legal_forms_drop(self):
        self.assertEqual(G.words('EDP, S.A.'), ['edp'])
        self.assertEqual(G.words('CENTRAL PUERTO S A'), ['central', 'puerto'])
        self.assertEqual(G.words('Chevron U.S.A. Inc.'), ['chevron', 'usa'])   # a subsidiary, not Chevron
        self.assertEqual(G.words('FERRARI B& B SRL'), ['ferrari', 'b', 'b'])   # a B&B, not Ferrari

    def test_exact_name_only(self):
        row, why = G.decide(EDP, 'PT', [rec('L1', 'EDP, S.A.')], IDX)
        self.assertEqual((row['hq_city'], row['lei'], row['method']), ('Lisbon', 'L1', 'gleif'))
        self.assertEqual(G.decide(EDP, 'PT', [rec('L2', 'EDP Renovaveis S.A.')], IDX), (None, None))

    def test_two_exact_entities_is_not_a_match(self):
        row, why = G.decide(EDP, 'PT', [rec('L1', 'EDP S.A.'), rec('L2', 'EDP, SA')], IDX)
        self.assertIsNone(row); self.assertIn('several', why)

    def test_funds_branches_and_lapsed_are_not_used(self):
        self.assertEqual(G.decide(EDP, 'PT', [rec('L1', 'EDP', category='FUND')], IDX), (None, None))
        row, why = G.decide(EDP, 'PT', [rec('L1', 'EDP', status='LAPSED')], IDX)
        self.assertIsNone(row); self.assertIn('lapsed', why)

    def test_registration_agent_city_goes_to_review(self):
        wmt = {'name': 'Walmart', 'legal_name': 'Walmart', 'cc': 'us', 'country': 'United States'}
        row, why = G.decide(wmt, 'US', [rec('W', 'WALMART INC.', city='Wilmington', country='US')], IDX)
        self.assertIsNone(row); self.assertIn('registration address', why)

    def test_hq_in_other_country_goes_to_review(self):
        row, why = G.decide(EDP, 'PT', [rec('L1', 'EDP', country='ES', city='Madrid')], IDX)
        self.assertIsNone(row); self.assertIn('ES', why)

    def test_accents_fold_for_city_lookup(self):
        self.assertEqual(G.place('Vasteras', 'SE', IDX)[3], 'Västerås')

if __name__ == '__main__': unittest.main()
