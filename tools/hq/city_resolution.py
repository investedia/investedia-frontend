"""Resolve cities using P131 containment and sourced city/country-capital facts.

No reverse geocoding or capital-seat inference. Incomplete, cyclic or ambiguous
hierarchies stay unresolved. HQ coordinates are never changed.
"""
from collections import deque
import re
import time


def qid(value):
    key = value.rsplit('/', 1)[-1]
    if not re.fullmatch(r'Q[1-9]\d*', key):
        raise ValueError('Invalid geographic entity')
    return key


def resolve_city_paths(roots, fetch_rows, sleep_fn=time.sleep):
    roots = set(roots)
    if len(roots) > 30 or any(qid(q) != q for q in roots):
        raise ValueError('Use at most 30 explicit HQ QIDs')
    nodes, frontier = {}, roots
    for _ in range(5):
        missing = frontier - set(nodes)
        if not missing:
            break
        if len(nodes) + len(missing) > 300:
            raise ValueError('Administrative-node budget exceeded')
        values = ' '.join('wd:' + x for x in sorted(missing))
        query = f'''SELECT DISTINCT ?node ?nodeLabel ?rel ?value WHERE {{ VALUES ?node {{ {values} }} {{ ?node wdt:P131 ?value BIND("parent" AS ?rel) }} UNION {{ ?node wdt:P31 ?value BIND("type" AS ?rel) }} SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" }} }} LIMIT 3000'''
        rows = fetch_rows(query, 3000)
        for key in missing:
            nodes[key] = {'label': None, 'parents': set(), 'types': set()}
        for row in rows:
            key, value = qid(row['node']['value']), qid(row['value']['value'])
            relation = row['rel']['value']
            if key not in missing or relation not in ('parent', 'type'):
                raise ValueError('Unexpected administrative response')
            nodes[key]['label'] = row.get('nodeLabel', {}).get('value')
            nodes[key]['parents' if relation == 'parent' else 'types'].add(value)
        frontier = {v for key in missing for v in nodes[key]['parents']}
        sleep_fn(1.1)

    # Follow only bounded, explicit superclass edges; do not run a graph-wide path query.
    classes = {}
    frontier = {t for node in nodes.values() for t in node['types']}
    for _ in range(7):
        missing = frontier - set(classes) - {'Q515'}
        if not missing:
            break
        if len(set(classes) | missing) > 400:
            raise ValueError('City-class budget exceeded')
        values = ' '.join('wd:' + x for x in sorted(missing))
        query = f'''SELECT DISTINCT ?type ?parent WHERE {{ VALUES ?type {{ {values} }} OPTIONAL {{ ?type wdt:P279 ?parent }} }} LIMIT 3000'''
        for key in missing:
            classes[key] = set()
        for row in fetch_rows(query, 3000):
            key = qid(row['type']['value'])
            if key not in missing:
                raise ValueError('Unexpected class response')
            if row.get('parent'):
                classes[key].add(qid(row['parent']['value']))
        frontier = {v for key in missing for v in classes[key]}
        sleep_fn(1.1)

    def is_city_type(key):
        pending, seen = [key], set()
        while pending:
            key = pending.pop()
            if key == 'Q515':
                return True
            if key not in seen:
                seen.add(key)
                pending.extend(classes.get(key, set()))
        return False

    # A country capital is also a sourced locality. This classifies an existing
    # P131 ancestor; it never infers the HQ city from the capital of its region.
    capitals = {}
    if nodes:
        values = ' '.join('wd:' + x for x in sorted(nodes))
        query = f'''SELECT DISTINCT ?city ?country ?code WHERE {{ VALUES ?city {{ {values} }} ?country wdt:P36 ?city; wdt:P297 ?code }} LIMIT 3000'''
        for row in fetch_rows(query, 3000):
            city = qid(row['city']['value'])
            if city not in nodes: raise ValueError('Capital is outside the administrative path')
            if re.fullmatch('[A-Z]{2}', row['code']['value']):
                capitals.setdefault(city, set()).add(qid(row['country']['value']))
        sleep_fn(1.1)

    result = {}
    for root in sorted(roots):
        queue, seen, hits = deque([(root, [root])]), set(), []
        while queue:
            key, path = queue.popleft()
            if key in seen:
                continue
            seen.add(key)
            node = nodes.get(key)
            if not node:
                continue
            typed_city = any(is_city_type(t) for t in node['types'])
            if typed_city or key in capitals:
                hits.append({'city': key, 'label': node['label'], 'path': path,
                             'classification': 'P31/P279 city' if typed_city else 'P36 country capital',
                             'capital_of': sorted(capitals.get(key, set()))})
                continue
            if len(path) <= 4:
                queue.extend((p, path + [p]) for p in sorted(node['parents']))
        if hits:
            nearest = min(len(hit['path']) for hit in hits)
            hits = [hit for hit in hits if len(hit['path']) == nearest]
        result[root] = hits
    return result
