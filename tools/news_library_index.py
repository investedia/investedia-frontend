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
    return r

def write():
    rows = []
    for f in (ROOT / 'assets/globe/library').glob('*.json'):
        try: d = json.loads(f.read_text(encoding='utf-8'))
        except Exception: continue
        if d.get('demo') or not d.get('id') or not d.get('headline') or not d.get('published_at'): continue
        rows.append(row(d))
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
    return meta

if __name__ == '__main__': m = write(); print(m['total'], 'articles,', m['pages'], 'pages')
