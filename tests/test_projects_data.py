import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location('projects_data', pathlib.Path(__file__).parents[1] / 'tools/projects_data.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def binding(key='Q1', **kwargs):
    values = dict(item='http://www.wikidata.org/entity/' + key, itemLabel='Real project', countryLabel='United Kingdom', coord='Point(-0.1 51.5)')
    values.update(kwargs)
    return {k: {'value': v} for k, v in values.items()}


class ProjectsDataTests(unittest.TestCase):
    def setUp(self):
        self.source = {'projects': [{'k': 'Q1', 'n': 'Existing', 't': 'Tower', 's': None}]}

    def test_explicit_ids_not_names(self):
        self.assertIn('wd:Q1', m.query_for(['Q1']))
        with self.assertRaises(ValueError):
            m.query_for(['Name alone'])

    def test_no_stage_invented(self):
        out = m.refresh(self.source, [binding()])['projects'][0]
        self.assertIsNone(out['s'])
        self.assertEqual((out['lo'], out['la']), (-0.1, 51.5))

    def test_closed_excluded(self):
        self.assertEqual(m.refresh(self.source, [binding(end='2020-01-01')])['projects'], [])

    def test_incomplete_does_not_mutate_last_good(self):
        with self.assertRaises(ValueError):
            m.refresh(self.source, [])
        self.assertEqual(self.source['projects'][0]['n'], 'Existing')

    def test_conflicting_coordinates_rejected(self):
        with self.assertRaises(ValueError):
            m.refresh(self.source, [binding(), binding(coord='Point(4 50)')])

    def test_bad_coordinate_rejected(self):
        with self.assertRaises(ValueError):
            m.refresh(self.source, [binding(coord='Point(181 20)')])
