"""News library index for articles.html: every article in assets/globe/library, newest first, split into small files so the
browser never loads thousands of articles. Written on every site build (and to the docs mirror).
  library-index/meta.json    totals, category and region counts, first date, page count
  library-index/page-N.json  24 rows per page (all articles, newest first)
  library-index/all.json     compact rows for search and filters, loaded only when a filter is used"""
import json, pathlib, shutil
ROOT = pathlib.Path(__file__).resolve().parents[1]
PER = 24

def row(d):
    loc, src, img = d.get('location') or {}, d.get('source') or {}, d.get('image') or {}
    r = {'id': d['id'], 'h': d['headline'], 'c': d.get('category') or 'news', 't': d['published_at'],
         's': src.get('name'), 'n': loc.get('country'), 'g': loc.get('region'), 'k': len(d.get('sources') or []) or 1}
    if img.get('file'): r['i'] = img['file']
    # owner 22 Nov 2026: place + rounded position, for the night-map tile on articles without a photo
    if loc.get('place'): r['p'] = str(loc['place']).split(',')[0][:40]
    if isinstance(loc.get('lat'), (int, float)) and isinstance(loc.get('lon'), (int, float)): r['la'], r['lo'] = round(loc['lat'], 2), round(loc['lon'], 2)
    return r

def roll(days=10):
    """Move single-article files older than `days` into one bundle per day (library-days/), so the site stays under
    Cloudflare's 20,000-file limit. The robot only republishes its last few days, so rolled articles are not re-added."""
    import datetime as dt
    lib, cut, moved = ROOT / 'assets/globe/library', (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)).strftime('%Y-%m-%d'), {}
    for f in lib.glob('*.json'):
        try: d = json.loads(f.read_text(encoding='utf-8'))
        except Exception: continue
        t = str(d.get('published_at') or '')[:10]
        if d.get('id') and len(t) == 10 and t < cut: moved.setdefault(t, {})[d['id']] = (f, d)
    for base in ('assets/globe', 'docs/assets/globe'):
        if not (ROOT / base).is_dir(): continue
        out = ROOT / base / 'library-days'; out.mkdir(exist_ok=True)
        idp = out / 'ids.json'; ids = json.loads(idp.read_text()) if idp.exists() else {}
        for t, items in moved.items():
            bp = out / f'{t}.json'; cur = json.loads(bp.read_text(encoding='utf-8')) if bp.exists() else {}
            for i, (_, d) in items.items(): cur.setdefault(i, d); ids[i] = t
            bp.write_text(json.dumps(cur, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        idp.write_text(json.dumps(ids, separators=(',', ':')))
    for items in moved.values():
        for i, (f, _) in items.items():
            for base in ('assets/globe', 'docs/assets/globe'):
                (ROOT / base / 'library' / f'{i}.json').unlink(missing_ok=True)
    return sum(len(v) for v in moved.values())

def write():
    rows = []
    by = {}  # owner 21 Nov 2026: company pages list every article that names one of the company's tickers, back to 2022
    def tick(d):
        ts = {str(x.get('ticker') or x.get('sym') or '').upper() for x in (d.get('impacts') or []) + (d.get('entities') or []) if isinstance(x, dict)}
        for t in ts - {''}: by.setdefault(t, []).append([d['id'], d['headline'], d['published_at'], (d.get('source') or {}).get('name', '')])
    for f in (ROOT / 'assets/globe/library').glob('*.json'):
        try: d = json.loads(f.read_text(encoding='utf-8'))
        except Exception: continue
        if d.get('demo') or not d.get('id') or not d.get('headline') or not d.get('published_at'): continue
        rows.append(row(d)); tick(d)
    # backfilled articles bundled one file per day (owner 17 Nov 2026: keeps the site under Cloudflare's 20,000-file limit)
    seen = {r['id'] for r in rows}
    for f in sorted((ROOT / 'assets/globe/library-days').glob('????-??-??.json')):
        try: day = json.loads(f.read_text(encoding='utf-8'))
        except Exception: continue
        for d in day.values():
            if isinstance(d, dict) and d.get('id') and d.get('headline') and d.get('published_at') and d['id'] not in seen:
                rows.append(row(d)); seen.add(d['id']); tick(d)
    rows.sort(key=lambda r: (r['t'], r['id']), reverse=True)
    cats, regs = {}, {}
    for r in rows:
        cats[r['c']] = cats.get(r['c'], 0) + 1
        if r['g']: regs[r['g']] = regs.get(r['g'], 0) + 1
    pages = max(1, -(-len(rows) // PER))
    meta = {'total': len(rows), 'sources': len({(r['s'] or '').strip().lower() for r in rows if r['s']}), 'first': rows[-1]['t'] if rows else None,
            'per_page': PER, 'pages': pages, 'categories': dict(sorted(cats.items(), key=lambda x: -x[1])), 'regions': regs}
    # summaries only for the lead article candidates on page 1 (keeps files small)
    for base in ('assets/globe', 'docs/assets/globe'):
        out = ROOT / base / 'library-index'
        if not (ROOT / base).is_dir(): continue
        if out.exists(): shutil.rmtree(out)
        out.mkdir(parents=True)
        dump = lambda name, obj: (out / name).write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        dump('meta.json', meta)
        dump('all.json', rows)
        for p in range(pages): dump(f'page-{p + 1}.json', rows[p * PER:(p + 1) * PER])
        shards = {}
        for t, L in by.items():
            L.sort(key=lambda r: r[2], reverse=True); shards.setdefault(t[0] if t[0].isalpha() else '_', {})[t] = L[:30]
        for k, v in shards.items(): dump(f'tick-{k}.json', v)
    return meta

if __name__ == '__main__':
    import sys
    if '--roll' in sys.argv: print('rolled', roll(int(sys.argv[sys.argv.index('--roll') + 1])), 'articles into day files')
    m = write(); print(m['total'], 'articles,', m['pages'], 'pages')
