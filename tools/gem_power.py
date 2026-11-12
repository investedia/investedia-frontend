"""Convert the private GEM Global Integrated Power Tracker workbook into assets/globe/projects-energy.json.

Usage: python tools/gem_power.py "/path/Global.Integrated.Power.September.2026.V2.xlsx"
The workbook itself stays private (GitHub release gem-2026-11 in the docs repo); only this derived
file is published, with the CC BY 4.0 credit. Real rows only; nothing is estimated.
Units are grouped into plants by GEM location ID. Cancelled and retired plants are left out, and so
are plants under MIN_MW (keeps the Globe fast). Plants already on the Globe from Wikidata within
2 km and of the same energy kind are skipped so nothing is shown twice.
"""
import hashlib, json, math, sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHA256 = '34749042643b15cac4423ae67864ad36c391013aa2d5acc65ae7492c5e33ee27'
MIN_MW = 50
KIND = {'utility-scale solar': 'Solar', 'wind': 'Wind', 'hydropower': 'Hydropower', 'coal': 'Coal',
        'oil/gas': 'Oil & gas', 'nuclear': 'Nuclear', 'bioenergy': 'Bioenergy', 'geothermal': 'Geothermal'}
WIKIDATA_KIND = {'Hydro energy': 'Hydropower', 'Wind energy': 'Wind', 'Solar energy': 'Solar', 'Nuclear energy': 'Nuclear'}
STAGE = {'announced': 'Announced', 'pre-construction': 'Pre-construction', 'construction': 'Under construction',
         'operating': 'Operating', 'shelved': 'Shelved', 'shelved - inferred 2 y': 'Shelved', 'mothballed': 'Mothballed'}
STAGE_ORDER = ['Under construction', 'Pre-construction', 'Announced', 'Operating', 'Shelved', 'Mothballed']
CREDIT = 'Global Energy Monitor, Global Integrated Power Tracker, September 2026 V2 (CC BY 4.0)'


def km(a, b):
    p = math.pi / 180
    h = math.sin((b[0] - a[0]) * p / 2) ** 2 + math.cos(a[0] * p) * math.cos(b[0] * p) * math.sin((b[1] - a[1]) * p / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def convert(path):
    import openpyxl
    digest = hashlib.sha256(Path(path).read_bytes()).hexdigest()
    if digest != SHA256:
        raise SystemExit(f'Unexpected workbook (sha256 {digest}); update SHA256 only after checking the new release.')
    iso = json.loads((ROOT / 'assets/globe/iso.json').read_text())
    ws = openpyxl.load_workbook(path, read_only=True)['Power facilities']
    rows = ws.iter_rows(values_only=True)
    head = next(rows)
    plants = {}
    for r in rows:
        d = dict(zip(head, r))
        stage = STAGE.get(str(d['Status'] or '').strip())
        kind = KIND.get(d['Type'])
        if not stage or not kind or d['Latitude'] in (None, '') or not d['GEM location ID']:
            continue
        mw = float(d['Capacity (MW)'] or 0)
        p = plants.setdefault(d['GEM location ID'], {
            'id': 'gem-' + d['GEM location ID'], 'n': str(d['Plant / Project name']).strip(), 'c': d['Country/area'],
            'la': round(float(d['Latitude']), 4), 'lo': round(float(d['Longitude']), 4), 'k': kind,
            'mw': 0.0, 'by_stage': Counter(), 'y': [], 'own': d['Parent(s)'] or d['Owner(s)'] or '',
            'url': d['GEM.Wiki URL'] or '', 'u': 0})
        p['mw'] += mw; p['by_stage'][stage] += mw or 0.001; p['u'] += 1
        if isinstance(d['Start year'], (int, float)): p['y'].append(int(d['Start year']))
    existing = [(x['la'], x['lo'], WIKIDATA_KIND.get(x.get('t'))) for x in
                json.loads((ROOT / 'assets/globe/projects.json').read_text())['projects'] if WIKIDATA_KIND.get(x.get('t'))]
    grid = {}
    for la, lo, k in existing: grid.setdefault((round(la), round(lo)), []).append((la, lo, k))
    out, skipped = [], Counter()
    for p in plants.values():
        if p['mw'] < MIN_MW: skipped['under_min_mw'] += 1; continue
        near = [e for a in (-1, 0, 1) for b in (-1, 0, 1) for e in grid.get((round(p['la']) + a, round(p['lo']) + b), [])]
        if any(e[2] == p['k'] and km((p['la'], p['lo']), e[:2]) <= 2 for e in near): skipped['already_on_globe'] += 1; continue
        stage = max(p['by_stage'], key=lambda s: (p['by_stage'][s], -STAGE_ORDER.index(s)))
        future = [y for y in p['y'] if stage != 'Operating']
        out.append([p['id'], p['n'], p['c'], iso.get(p['c'], ''), p['la'], p['lo'], p['k'], stage, round(p['mw']),
                    (max(future) if future else min(p['y']) if p['y'] else None), str(p['own'])[:160], p['url'], p['u']])
    out.sort(key=lambda r: -r[8])
    doc = {'schema': 'investedia.energy.v1', 'credit': CREDIT, 'licence': 'CC BY 4.0',
           'source_url': 'https://globalenergymonitor.org/projects/global-integrated-power-tracker/',
           'min_mw': MIN_MW, 'fields': ['id', 'name', 'country', 'cc', 'lat', 'lon', 'kind', 'stage', 'mw', 'year', 'owner', 'gem_wiki', 'units'],
           'counts': {'plants': len(out), 'by_kind': Counter(r[6] for r in out), 'by_stage': Counter(r[7] for r in out), 'skipped': skipped},
           'plants': out}
    (ROOT / 'assets/globe/projects-energy.json').write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n')
    return doc['counts']


if __name__ == '__main__':
    print(json.dumps(convert(sys.argv[1]), indent=1))
