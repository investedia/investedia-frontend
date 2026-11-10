import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('economy_history', Path(__file__).parents[1] / 'scripts/economy_history.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def row(year, value, code='US', iso3='USA', indicator=m.SERIES['growth']):
    return dict(date=str(year), value=value, country={'id': code}, countryiso3code=iso3, indicator={'id': indicator})


class EconomyHistoryTests(unittest.TestCase):
    def test_null_is_gap_not_zero(self):
        self.assertEqual(m.parse([row(2020, 2), row(2021, None), row(2022, 4)], m.SERIES['growth']), {('US', 2020): 2, ('US', 2022): 4})

    def test_official_regions(self):
        result = m.parse([row(2020, 2, 'XC', 'EMU'), row(2020, 1, '1W', 'WLD')], m.SERIES['growth'])
        self.assertIn(('EMU', 2020), result)
        self.assertIn(('WLD', 2020), result)

    def test_conflicts_rejected(self):
        with self.assertRaises(ValueError):
            m.parse([row(2020, 2), row(2020, 3)], m.SERIES['growth'])

    def test_wrong_series_rejected(self):
        with self.assertRaises(ValueError):
            m.parse([row(2020, 2, indicator='OTHER')], m.SERIES['growth'])

    def test_nonfinite_rejected(self):
        with self.assertRaises(ValueError):
            m.parse([row(2020, float('nan'))], m.SERIES['growth'])

    def test_source_timestamp_retained(self):
        out = m.materialise({'growth': {('US', 2020): 2, ('US', 2019): 1}}, 'original-asof')
        self.assertEqual(out['US']['as_of'], 'original-asof')
        self.assertEqual(out['US']['series']['growth']['values'], [[2019, 1], [2020, 2]])
