"""Weekly country briefings (briefing.html / briefings.html), built from real data only:
Investedia articles (assets/globe/library), World Bank (economy.json) and ECB reference rates (fx-ecb.json).
Covers the last complete Monday-Sunday week (UTC). Writes assets/globe/briefs/index.json and one file per country.
"The week in lines" are the first sentences of the week's top articles (their own summaries), each linked to its article."""
import json, pathlib, re, shutil, datetime as dt
ROOT = pathlib.Path(__file__).resolve().parents[1]
G = ROOT / 'assets/globe'
MIN_ARTICLES = 10
CUR = {'BR': 'BRL', 'GB': 'GBP', 'JP': 'JPY', 'CN': 'CNY', 'IN': 'INR', 'CA': 'CAD', 'AU': 'AUD', 'MX': 'MXN', 'ZA': 'ZAR', 'TR': 'TRY',
       'KR': 'KRW', 'ID': 'IDR', 'CH': 'CHF', 'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'PL': 'PLN', 'CZ': 'CZK', 'HU': 'HUF', 'RO': 'RON',
       'IL': 'ILS', 'MY': 'MYR', 'PH': 'PHP', 'SG': 'SGD', 'TH': 'THB', 'HK': 'HKD', 'NZ': 'NZD', 'IS': 'ISK',
       **{c: 'EUR' for c in 'AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES'.split()}}

def week(today):
    mon = today - dt.timedelta(days=today.weekday() + 7)
    return mon, mon + dt.timedelta(days=6)

def first_sentence(s):
    s = (s or '').strip(); m = re.match(r'(.{30,260}?[.!?])(\s|$)', s)
    return m.group(1) if m else s[:200]

def similar(x, y):
    w = lambda t: {v for v in re.findall(r'[a-z0-9.%]{4,}', t.lower())}
    a, b = w(x), w(y); return len(a & b) / (min(len(a), len(b)) or 1)

def build(today=None, lib=None):
    today = today or dt.datetime.now(dt.timezone.utc).date()
    mon, sun = week(today); a, b = mon.isoformat(), sun.isoformat() + 'T23:59:59Z'
    iso = json.loads((G / 'iso.json').read_text())
    eco = json.loads((G / 'economy.json').read_text())
    fx = json.loads((G / 'fx-ecb.json').read_text())
    if lib is None:
        lib = []
        for f in (G / 'library').glob('*.json'):
            try: lib.append(json.loads(f.read_text(encoding='utf-8')))
            except Exception: pass
    by = {}
    for d in lib:
        t, c = d.get('published_at') or '', (d.get('location') or {}).get('country')
        if d.get('demo') or not d.get('headline') or not c or not (a <= t <= b): continue
        by.setdefault(c, []).append(d)
    hist = sorted((fx.get('usd_hist') or {}).items())
    out, idx = {}, []
    for name, arts in by.items():
        cc = iso.get(name)
        if not cc or len(arts) < MIN_ARTICLES: continue
        arts.sort(key=lambda d: (bool(d.get('market_moving')), d.get('importance') or 0, d.get('score') or 0), reverse=True)
        cats = {}
        for d in arts: cats[d.get('category') or 'news'] = cats.get(d.get('category') or 'news', 0) + 1
        top = [{'id': d['id'], 'h': d['headline'], 'c': d.get('category') or 'news', 't': d['published_at'], 's': (d.get('source') or {}).get('name'),
                'mm': bool(d.get('market_moving')), 'i': (d.get('image') or {}).get('file')} for d in arts[:8]]
        lines = []
        for d in arts:
            s = first_sentence(d.get('summary'))
            if s and all(similar(s, l['x']) < 0.3 for l in lines): lines.append({'x': s, 'id': d['id']})
            if len(lines) == 4: break
        r = {'country': name, 'cc': cc.lower(), 'from': a, 'to': sun.isoformat(), 'n': len(arts), 'mm': sum(bool(d.get('market_moving')) for d in arts),
             'sources': len({((d.get('source') or {}).get('name') or '').lower() for d in arts} - {''}), 'cats': sorted(cats.items(), key=lambda x: -x[1]),
             'lines': lines, 'top': top}
        e = (eco.get('countries') or {}).get(cc)
        if e:
            g = [x for x in e.get('growth') or [] if x[1] is not None]
            r['eco'] = {'growth': g[-1] if g else None, 'infl': e.get('infl'), 'unemp': e.get('unemp'), 'gdppc': e.get('gdppc'), 'source': eco.get('source')}
        cur = CUR.get(cc)
        if cur and cur != 'EUR':
            pts = [[d, v[cur]] for d, v in hist if cur in v][-30:]
            wk = [p for p in pts if a <= p[0] <= sun.isoformat()]
            if len(pts) > 2: r['fx'] = {'cur': cur, 'pts': pts, 'week': round((wk[-1][1] / wk[0][1] - 1) * 100, 2) if len(wk) > 1 else None}
        elif cur == 'EUR':
            pts = [[d, round(1 / v['EUR'], 6)] for d, v in hist if v.get('EUR')][-30:]
            wk = [p for p in pts if a <= p[0] <= sun.isoformat()]
            if len(pts) > 2: r['fx'] = {'cur': 'EUR', 'inverse': True, 'pts': pts, 'week': round((wk[-1][1] / wk[0][1] - 1) * 100, 2) if len(wk) > 1 else None}
        out[cc.lower()] = r
        idx.append({'country': name, 'cc': cc.lower(), 'n': r['n'], 'mm': r['mm']})
    idx.sort(key=lambda x: -x['n'])
    return {'from': a, 'to': sun.isoformat(), 'countries': idx}, out

def write():
    index, per = build()
    for base in ('assets/globe', 'docs/assets/globe'):
        if not (ROOT / base).is_dir(): continue
        d = ROOT / base / 'briefs'
        if d.exists(): shutil.rmtree(d)
        d.mkdir(parents=True)
        dump = lambda p, o: p.write_text(json.dumps(o, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        dump(d / 'index.json', index)
        for cc, r in per.items(): dump(d / f'{cc}.json', r)
    return index

if __name__ == '__main__':
    i = write(); print(i['from'], i['to'], len(i['countries']), 'countries', i['countries'][:5])
