"""Write the browser copy of the Projects data from the backend build (investedia-backend assets/globe/projects.json).
Keeps every field's source evidence (licence, date, field list) but drops repetition, so the Globe loads it quickly.
Usage: python tools/projects/slim_projects.py /path/to/investedia-backend"""
import json, sys, pathlib
src = pathlib.Path(sys.argv[1]) / 'assets/globe'
out = pathlib.Path(__file__).resolve().parents[2] / 'assets/globe'
d = json.load(open(src / 'projects.json'))
rows = []
for p in d['projects']:
    r = {k: p[k] for k in ('k', 'n', 'c', 'cc', 't', 's', 'y', 'cap', 'cost', 'aliases', 'validation_status') if k in p}
    r['la'], r['lo'] = round(p['la'], 4), round(p['lo'], 4)
    if p.get('own'): r['own'] = [{'name': o['name'], 'role': o['role']} for o in p['own'][:4]]
    r['src'] = [{k: s[k] for k in ('name', 'url', 'licence', 'checked_at', 'field_list', 'review') if k in s} for s in p['src']]
    rows.append(r)
json.dump({'schema': d['schema'], 'build_date': d['build_date'], 'projects': rows}, open(out / 'projects.json', 'w'), separators=(',', ':'), ensure_ascii=False)
(out / 'projects-featured.json').write_text((src / 'projects-featured.json').read_text())
print(len(rows), 'projects;', round((out / 'projects.json').stat().st_size / 1e6, 2), 'MB')
