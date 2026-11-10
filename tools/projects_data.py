"""Manual Wikidata refresh: explicit entity ids, raw response kept apart from output.
Never interprets missing dates as operational status or imports unchecked photos.
"""
import argparse
import datetime as dt
import json
import pathlib
import re
import urllib.parse
import urllib.request

UA = 'InvestediaRobot/1.0'
ENDPOINT = 'https://query.wikidata.org/sparql'


def query_for(ids):
    if not ids or any(not re.fullmatch(r'Q[1-9]\d*', q) for q in ids):
        raise ValueError('Explicit Wikidata ids required')
    return '''SELECT ?item ?itemLabel ?countryLabel ?coord ?article ?start ?end WHERE {
VALUES ?item { %s }
?item wdt:P625 ?coord; wdt:P17 ?country.
OPTIONAL { ?item wdt:P571 ?start }
OPTIONAL { ?item wdt:P576 ?end }
OPTIONAL { ?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/> }
SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}''' % ' '.join('wd:' + q for q in ids)


def refresh(existing, bindings):
    rows = {p['k']: dict(p) for p in existing['projects']}
    found, dropped = set(), set()
    for binding in bindings:
        value = lambda k: binding.get(k, {}).get('value')
        key = (value('item') or '').rsplit('/', 1)[-1]
        if key not in rows:
            raise ValueError('Unexpected entity')
        if value('end'):
            dropped.add(key)
            continue
        coord = re.fullmatch(r'Point\((-?[\d.]+) (-?[\d.]+)\)', value('coord') or '')
        if not coord or not value('countryLabel') or not value('itemLabel'):
            raise ValueError('Incomplete source record')
        lon, lat = map(float, coord.groups())
        if not -180 <= lon <= 180 or not -90 <= lat <= 90:
            raise ValueError('Invalid coordinate')
        found.add(key)
        # A source may have several coordinates. Conflicts require review, never last-row wins.
        if '_refreshed' in rows[key] and (rows[key]['lo'], rows[key]['la']) != (lon, lat):
            raise ValueError('Conflicting coordinates: ' + key)
        rows[key].update(n=value('itemLabel'), c=value('countryLabel'), lo=lon, la=lat,
                         wiki=value('article'), y=(value('start') or '')[:4] or None,
                         _refreshed=True)
    if len(found | dropped) != len(rows):
        raise ValueError('Incomplete refresh; last good registry remains untouched')
    out = {**existing, 'projects': [{k: v for k, v in row.items() if k != '_refreshed'}
                                  for key, row in rows.items() if key not in dropped],
           'retrieved_at': dt.datetime.now(dt.timezone.utc).isoformat()}
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='assets/globe/projects.json')
    parser.add_argument('--output', default='out/projects')
    args = parser.parse_args()
    source = json.loads(pathlib.Path(args.input).read_text())
    out = pathlib.Path(args.output)
    raw = out / 'raw'
    raw.mkdir(parents=True, exist_ok=True)
    ids = [p['k'] for p in source['projects']]
    bindings = []
    for offset in range(0, len(ids), 40):
        query = query_for(ids[offset:offset + 40])
        request = urllib.request.Request(ENDPOINT + '?' + urllib.parse.urlencode(
            {'query': query, 'format': 'json'}), headers={'User-Agent': UA, 'Accept': 'application/sparql-results+json'})
        with urllib.request.urlopen(request, timeout=90) as response:
            payload = json.load(response)
        (raw / f'batch-{offset // 40:03}.json').write_text(json.dumps(payload))
        bindings.extend(payload['results']['bindings'])
    result = refresh(source, bindings)
    validated = out / 'validated'
    validated.mkdir(exist_ok=True)
    (validated / 'projects.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f"Validated {len(result['projects'])} projects; artifact only, no publication.")


if __name__ == '__main__':
    main()
