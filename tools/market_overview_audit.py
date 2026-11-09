"""Re-run the 20-article evidence audit and 8-country comparison (offline, read-only)."""
import json, sys, importlib.util
from collections import Counter
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT))
from registry import Registry
from tools.market_overview_evidence import market_relevance, physical_location
CODES = ['NG', 'US', 'BR', 'IN', 'AR', 'PE', 'GB', 'MY']
def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
def main(before_path=None):
    read = lambda p: json.loads((ROOT/p).read_text())
    news, ex, conn, iso = read('assets/globe/news-48h.json'), read('data/exchanges.json'), read('assets/globe/connections.json'), read('assets/globe/iso.json')
    reg = Registry(); by = {a['id']: a for a in news['stories']}
    after = load(ROOT/'tools/globe-news/build_market_focus.py', 'after').project(news, ex, conn, reg, iso)
    before = load(before_path, 'before').project(news, ex, conn, reg, iso) if before_path else None
    # Sample: round-robin top developments across the 8 countries until 20.
    sample, i = [], 0
    while len(sample) < 20 and i < 60:
        for code in CODES:
            devs = after['countries'].get(code, {}).get('developments', [])
            if i < len(devs) and len(sample) < 20: sample.append((code, devs[i]['id']))
        i += 1
    rows = []
    for code, aid in sample:
        a = by[aid]; name = after['countries'][code]['name']
        rel, loc = market_relevance(a, code, name), physical_location(a)
        rows.append((code, aid, a['headline'][:70], rel['status'], loc['status'] + ('/' + loc['granularity'] if loc['status'] == 'supported' else ''), f"{a['location'].get('place')}, {a['location'].get('country')}"))
    rc = Counter(r[3] for r in rows); pc = Counter(r[4].split('/')[0] for r in rows)
    out = ['# Market Overview evidence audit (local, offline)', f"News snapshot: {news['updated_at']} · {len(news['stories'])} articles. Only headlines are stored, so headline text is the only source text available.", '',
           '## 20-article audit', '| Status | Market relevance | Physical location |', '|---|---:|---:|']
    for s in ('supported', 'unsupported', 'unverifiable'): out.append(f'| {s} | {rc.get(s,0)} | {pc.get(s,0)} |')
    out += ['', '| Country | Article | Headline | Relevance | Physical | Recorded location |', '|---|---|---|---|---|---|'] + [f'| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} |' for r in rows]
    out += ['', '## Eight-country comparison (before = main, after = this branch)', '| Country | Top article changed | Labels before → after | Connections before → after | Top-4 relevance supported |', '|---|---|---|---|---|']
    for code in CODES:
        a, b = after['countries'].get(code), (before or {}).get('countries', {}).get(code) if before else None
        if not a: out.append(f'| {code} | no articles | | | |'); continue
        top = lambda c: c['developments'][0]['id'] if c and c['developments'] else None
        sup = sum(d['relevance'] == 'supported' for d in a['developments'][:4])
        out.append(f"| {code} | {'yes' if b and top(a) != top(b) else 'no'} | {len(b['labels']) if b else '-'} → {len(a['labels'])} | {len(b['connections']) if b else '-'} → {len(a['connections'])} | {sup}/{min(4, len(a['developments']))} |")
    allc = Counter(physical_location(x)['status'] for x in news['stories'])
    out += ['', f"All articles, physical location: supported {allc['supported']}, unverifiable {allc['unverifiable']} (none inferred)."]
    print('\n'.join(out))
if __name__ == '__main__': main(sys.argv[1] if len(sys.argv) > 1 else None)
