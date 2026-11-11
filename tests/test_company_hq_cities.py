"""Offline city-containment evidence, ambiguity and holdout tests. No provider calls."""
import copy
import importlib.util
from pathlib import Path
import re
import unittest
from tools.hq.city_resolution import resolve_city_paths

spec=importlib.util.spec_from_file_location('review_hq',Path(__file__).parents[1]/'tools/hq/build_company_hq.py')
hq=importlib.util.module_from_spec(spec);spec.loader.exec_module(hq)


def binding(**kwargs):
    return {k:{'value':v} for k,v in kwargs.items()}


def fixture(graph=None, classes=None, capitals=None):
    graph=graph or {'Q1':('Fixture Tower',['Q2'],['Q100']),
                    'Q2':('Fixture district',['Q3'],['Q200']),
                    'Q3':('Fixture City',[],['Q300'])}
    classes=classes or {'Q300':['Q301'],'Q301':['Q515']}
    capitals=capitals or {}
    def fetch(query,limit):
        keys=re.search(r'VALUES \?\w+ \{ (.*?) \}',query).group(1).split()
        keys=[k.removeprefix('wd:') for k in keys]
        if '?node ?nodeLabel' in query:
            return [binding(node='http://www.wikidata.org/entity/'+k,nodeLabel=graph[k][0],rel=rel,value='http://www.wikidata.org/entity/'+value)
                    for k in keys if k in graph for rel,values in [('parent',graph[k][1]),('type',graph[k][2])] for value in values]
        if '?type ?parent' in query:
            return [binding(type='http://www.wikidata.org/entity/'+k,**({'parent':'http://www.wikidata.org/entity/'+p} if p else {}))
                    for k in keys for p in classes.get(k,[None])]
        if '?city ?country' in query:
            return [binding(city='http://www.wikidata.org/entity/'+k,country='http://www.wikidata.org/entity/'+capitals[k],code='ES')
                    for k in keys if k in capitals]
        raise AssertionError(query)
    return fetch


class HQCityResolutionTests(unittest.TestCase):
    def test_exact_containment_and_subclass_path(self):
        out=resolve_city_paths({'Q1'},fixture(),sleep_fn=lambda _:None)
        self.assertEqual(out['Q1'][0]['label'],'Fixture City')
        self.assertEqual(out['Q1'][0]['path'],['Q1','Q2','Q3'])

    def test_two_nearest_cities_are_not_arbitrarily_selected(self):
        graph={'Q1':('HQ',['Q2','Q3'],['Q100']),'Q2':('City A',[],['Q515']),'Q3':('City B',[],['Q515'])}
        out=resolve_city_paths({'Q1'},fixture(graph),sleep_fn=lambda _:None)
        self.assertEqual(len(out['Q1']),2)

    def test_nearest_city_wins_over_broader_parent(self):
        graph={'Q1':('HQ',['Q2'],['Q100']),'Q2':('Local city',['Q3'],['Q515']),'Q3':('Parent city',[],['Q515'])}
        out=resolve_city_paths({'Q1'},fixture(graph),sleep_fn=lambda _:None)
        self.assertEqual(out['Q1'][0]['city'],'Q2')

    def test_cycle_and_noncity_do_not_invent_a_city(self):
        graph={'Q1':('City in its name',['Q2'],['Q100']),'Q2':('County',['Q1'],['Q200'])}
        out=resolve_city_paths({'Q1'},fixture(graph,capitals={'Q9':'Q4'}),sleep_fn=lambda _:None)
        self.assertEqual(out['Q1'],[])

    def test_country_capital_only_classifies_a_node_already_on_the_path(self):
        graph={'Q1':('HQ',['Q2'],['Q100']),'Q2':('Sourced capital',[],['Q200'])}
        out=resolve_city_paths({'Q1'},fixture(graph,capitals={'Q2':'Q4'}),sleep_fn=lambda _:None)
        self.assertEqual(out['Q1'][0]['path'],['Q1','Q2'])
        self.assertEqual(out['Q1'][0]['classification'],'P36 country capital')

    def test_root_input_budget_and_identifier_validation(self):
        with self.assertRaises(ValueError):resolve_city_paths({'not an entity'},fixture())
        with self.assertRaises(ValueError):resolve_city_paths({'Q'+str(i+1) for i in range(31)},fixture())

    def test_resolved_label_preserves_source_hq_coordinates(self):
        row={'qid':'Q101','hq_qid':'Q1','hq_city':'Fixture Tower','hq_lat':52.1234,'hq_lon':1.5678,'source':'Fixture P159/P625'}
        original=copy.deepcopy(row)
        doc={'asked':1,'companies':{'FCT':row},'not_matched':[]}
        hq.resolve_and_hold_review_rows(doc,resolver=lambda _: {'Q1':[{'city':'Q3','label':'Fixture City','path':['Q1','Q2','Q3']}]})
        self.assertEqual(row['hq_city'],'Fixture City');self.assertEqual(row['hq_site_label'],'Fixture Tower')
        for field in ('qid','hq_qid','hq_lat','hq_lon'):self.assertEqual(row[field],original[field])
        self.assertNotIn('review_notes',row);self.assertEqual(doc['matched'],1)

    def test_ambiguous_or_stale_rows_are_held_out_with_original_evidence(self):
        for row in [dict(qid='Q101',hq_qid='Q1',hq_city='Fixture Tower',source='Fixture source'),
                    dict(qid='Q66',hq_qid='Q1297',hq_city='Chicago',source='Fixture source')]:
            original=copy.deepcopy(row);doc={'asked':1,'companies':{'FCT':row},'not_matched':[]}
            hq.resolve_and_hold_review_rows(doc,resolver=lambda _: {})
            self.assertEqual(doc['matched'],0);self.assertEqual(len(doc['not_matched']),1)
            self.assertEqual(doc['not_matched'][0]['candidate']['hq_city'],original['hq_city'])
            self.assertIn('review required:',doc['not_matched'][0]['why'])
