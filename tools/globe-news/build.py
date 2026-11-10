"""Build the Globe News concept page (assets/globe/news.html) from tools/globe-news/.
Edit page.html (layout, CSS and behaviour) or news-demo.json (stories), then run:  python3 tools/globe-news/build.py && python3 build.py
Land dots come from tools/globe/dots.json; country shapes from countries-110m.json (overview) and countries-50m.json (detailed, loaded when you zoom in) (world-atlas 2.0.2, Natural Earth, public domain).
news-demo.json is DEMO content: the page loads it from assets/globe/news-demo.json, so a live pipeline only has to write that file."""
import argparse, json, os, shutil
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--markets-preview', action='store_true', help='Explicitly refresh the isolated M1 preview and its data')
args = parser.parse_args()
G = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(os.path.dirname(G))

# TopoJSON -> [name, centroid lon, centroid lat (x Q), ring, ring, ...]; each ring is delta-encoded integers (x Q), simplified (Douglas-Peucker)
def encode(file, Q, tol):
    topo = json.load(open(os.path.join(G, file)))
    sx, sy = topo['transform']['scale']; tx, ty = topo['transform']['translate']
    arcs = []
    for a in topo['arcs']:
        x = y = 0; pts = []
        for dx, dy in a:
            x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    def ring(ix):
        out = []
        for i in ix:
            p = arcs[i] if i >= 0 else arcs[~i][::-1]
            out.extend(p if not out else p[1:])
        return out
    def area_c(r):
        a = cx = cy = 0
        for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1]):
            f = x0 * y1 - x1 * y0; a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f
        return (abs(a) / 2, (cx / (3 * a), cy / (3 * a))) if a else (0, r[0])
    def dp(pts):
        if len(pts) < 5: return pts
        keep = [False] * len(pts); keep[0] = keep[-1] = True; st = [(0, len(pts) - 1)]
        while st:
            i, j = st.pop(); (x0, y0), (x1, y1) = pts[i], pts[j]; dx, dy = x1 - x0, y1 - y0; L = (dx * dx + dy * dy) ** .5 or 1e-12; best, bk = 0, -1
            for k in range(i + 1, j):
                d = abs(dy * (pts[k][0] - x0) - dx * (pts[k][1] - y0)) / L
                if d > best: best, bk = d, k
            if best > tol: keep[bk] = True; st += [(i, bk), (bk, j)]
        return [p for p, k in zip(pts, keep) if k]
    def dpr(pts):  # closed ring: simplify the two halves separately
        if tol <= 0 or len(pts) < 8: return pts
        m = len(pts) // 2
        return dp(pts[:m + 1])[:-1] + dp(pts[m:])
    C = []
    for g in topo['objects']['countries']['geometries']:
        name = g['properties']['name']
        if name == 'Antarctica' or 'arcs' not in g: continue
        polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
        big = max((area_c(ring(p[0])) for p in polys), key=lambda t: t[0])
        row = [name, round(big[1][0] * Q), round(big[1][1] * Q)]
        for p in polys:
            for r in p:
                q, px, py = [], None, None
                for lo, la in dpr(ring(r)):
                    x, y = round(lo * Q), round(la * Q)
                    if (x, y) != (px, py): q.append((x, y)); px, py = x, y
                if len(q) < 3: continue
                flat, lx, ly = [], 0, 0
                for x, y in q: flat += [x - lx, y - ly]; lx, ly = x, y
                row.append(flat)
        C.append(row)
    return C
C = encode('countries-110m.json', 10, 0)
C50 = encode('countries-50m.json', 50, .03)
open(os.path.join(SITE, 'assets/globe/countries-50m.json'), 'w').write(json.dumps(C50, separators=(',', ':')))

page = open(os.path.join(G, 'page.html'), encoding='utf-8').read()
history_dir = os.path.join(SITE, 'assets/globe/connections-history')
page = page.replace('__CONNECTION_DAYS__', json.dumps(sorted(f[:-5] for f in os.listdir(history_dir) if f.endswith('.json')) if os.path.isdir(history_dir) else []))
page = page.replace('/* NEWS_FILTERS_CSS */', open(os.path.join(G, 'news-filters.css'), encoding='utf-8').read())
page = page.replace('/* NEWS_DETAILS_FILTERS */', open(os.path.join(G, 'news-filters.js'), encoding='utf-8').read())
page = page.replace('/* MARKET_MODE */', open(os.path.join(G, 'market-mode.js'), encoding='utf-8').read())
page = page.replace('__MARKET_DAYS__', json.dumps(sorted(f[:-5] for f in os.listdir(os.path.join(SITE, 'assets/globe/events')) if f.endswith('.json'))))
page = page.replace('__DOTS__', open(os.path.join('/'.join([SITE, 'tools/globe']), 'dots.json')).read()).replace('__COUNTRIES__', json.dumps(C, separators=(',', ':')))
# logo index for the image cards: symbol -> path (site logos by Investedia symbol, company logos by exchange ticker)
LG = os.path.join(SITE, 'assets/logos')
logos = {f.rsplit('.', 1)[0]: '../logos/co/' + f for f in sorted(os.listdir(os.path.join(LG, 'co')))}
# site logos win over the exchange-ticker set when both exist (BYDDY, CNQ now have higher-resolution top-level files)
logos.update({f.rsplit('.', 1)[0]: '../logos/' + f for f in sorted(os.listdir(LG)) if '.' in f})
page = page.replace('__LOGOS__', json.dumps(logos, separators=(',', ':')))
# Share the same local fallback paths with the homepage entity chips.
open(os.path.join(SITE, 'assets/globe/logos.json'), 'w').write(json.dumps(logos, separators=(',', ':')))
# country name (as in the map data) -> ISO 3166 two-letter code, for flags and the World Bank economy data
import re, unicodedata
key = lambda t: re.sub(r'[^a-z]', '', unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode().lower())
codes = {}
for c in json.load(open(os.path.join(SITE, 'assets/world-map.json')))['c']: codes[key(c['n'])] = c['id']
for c in json.load(open(os.path.join(G, 'wb-countries.json')))[1]:
    if c['region']['value'] != 'Aggregates': codes.setdefault(key(c['name']), c['iso2Code'])
FIX = {'Vatican': 'VA', 'Marshall Is.': 'MH', 'N. Mariana Is.': 'MP', 'U.S. Virgin Is.': 'VI', 'United States of America': 'US', 'S. Geo. and the Is.': 'GS', 'Br. Indian Ocean Ter.': 'IO',
       'Saint Helena': 'SH', 'Pitcairn Is.': 'PN', 'Falkland Is.': 'FK', 'Cayman Is.': 'KY', 'British Virgin Is.': 'VG', 'Turks and Caicos Is.': 'TC', 'Turkey': 'TR', 'S. Sudan': 'SS',
       'Solomon Is.': 'SB', 'St. Vin. and Gren.': 'VC', 'Cook Is.': 'CK', 'W. Sahara': 'EH', 'Macedonia': 'MK', 'St. Pierre and Miquelon': 'PM', 'Wallis and Futuna Is.': 'WF', 'St-Martin': 'MF',
       'St-Barthélemy': 'BL', 'Fr. Polynesia': 'PF', 'Fr. S. Antarctic Lands': 'TF', 'Åland': 'AX', 'Eq. Guinea': 'GQ', 'Dominican Rep.': 'DO', 'Faeroe Is.': 'FO', 'Dem. Rep. Congo': 'CD',
       'Central African Rep.': 'CF', 'Bosnia and Herz.': 'BA', 'Heard I. and McDonald Is.': 'HM', 'Antigua and Barb.': 'AG', 'Sint Maarten': 'SX'}  # no ISO code: Somaliland, N. Cyprus, Siachen Glacier, Ashmore and Cartier Is., Indian Ocean Ter.
ISO = {}
for row in C50:
    n = row[0]; c = FIX.get(n) or codes.get(key(n))
    if c: ISO[n] = c
page = page.replace('__ISO__', json.dumps(ISO, separators=(',', ':')))
# Reuse the World Bank country/region snapshot and the Globe news robot's region
# conventions. No second country database or extra runtime request is needed.
region_codes = {'North America': 'na', 'Europe & Central Asia': 'eu', 'East Asia & Pacific': 'asia', 'South Asia': 'asia',
                'Middle East & North Africa': 'me', 'Middle East, North Africa, Afghanistan & Pakistan': 'me',
                'Sub-Saharan Africa': 'af', 'Latin America & Caribbean': 'latam'}
country_regions = {c['iso2Code']: region_codes[c['region']['value'].strip()]
                   for c in json.load(open(os.path.join(G, 'wb-countries.json')))[1]
                   if c['region']['value'].strip() in region_codes}
for code in ('AU', 'NZ', 'FJ', 'PG', 'NC', 'SB', 'VU', 'WS', 'TO', 'PF'): country_regions[code] = 'oc'
for code in ('EG', 'LY', 'TN', 'DZ', 'MA'): country_regions[code] = 'af'
for code in ('KZ', 'UZ', 'TM', 'KG', 'TJ', 'AF', 'PK'): country_regions[code] = 'asia'
page = page.replace('__COUNTRY_REGIONS__', json.dumps(country_regions, separators=(',', ':')))
open(os.path.join(G, 'iso.json'), 'w').write(json.dumps(ISO, ensure_ascii=False, indent=0))  # also used by update_globe_news.py
open(os.path.join(SITE, 'assets/globe/iso.json'), 'w').write(json.dumps(ISO, ensure_ascii=False, separators=(',', ':')))  # flags on other pages
# rectangular vector flags (flag-icons, MIT) for the countries on the map
FL = os.path.join(G, 'flags'); os.makedirs(os.path.join(SITE, 'assets/globe/flags'), exist_ok=True)
for f in os.listdir(FL):  # all flags (also used by the homepage: market hours, events)
    if f.endswith('.svg'): shutil.copy(os.path.join(FL, f), os.path.join(SITE, 'assets/globe/flags', f))
out = os.path.join(SITE, 'assets/globe/news.html')
open(out, 'w', encoding='utf-8').write(page)
if args.markets_preview:
    from build_markets_preview import build as build_markets_preview
    build_markets_preview(page)
shutil.copy(os.path.join(G, 'news-demo.json'), os.path.join(SITE, 'assets/globe/news-demo.json'))
# openly licensed story photos (credits live in news-demo.json and are shown on every card)
if os.path.isdir(os.path.join(G, 'img')): shutil.copytree(os.path.join(G, 'img'), os.path.join(SITE, 'assets/globe/img'), dirs_exist_ok=True)
print('built', out, len(page) // 1024, 'KB,', len(C), 'countries; detailed map', os.path.getsize(os.path.join(SITE, 'assets/globe/countries-50m.json')) // 1024, 'KB,', len(C50), 'countries')
