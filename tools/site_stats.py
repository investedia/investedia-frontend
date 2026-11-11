"""Homepage numbers: every article in the permanent library (assets/globe/library), the news sources behind them,
and the projects on the globe. Written to assets/globe/site-stats.json (and the docs mirror) on every site build."""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]

def write():
    arts, sources = 0, set()
    for f in (ROOT / 'assets/globe/library').glob('*.json'):
        try: d = json.loads(f.read_text(encoding='utf-8'))
        except Exception: continue
        if d.get('demo'): continue
        arts += 1
        name = (d.get('source') or {}).get('name')
        if name: sources.add(name.strip().lower())
    try: projects = len(json.loads((ROOT / 'assets/globe/projects.json').read_text())['projects'])
    except Exception: projects = None
    out = json.dumps({'articles': arts, 'sources': len(sources), 'projects': projects}, separators=(',', ':'))
    for d in ('assets/globe', 'docs/assets/globe'):
        p = ROOT / d / 'site-stats.json'
        if p.parent.is_dir() and (not p.exists() or p.read_text() != out): p.write_text(out)
    return out

if __name__ == '__main__': print(write())
