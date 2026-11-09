"""Build the world-globe page (assets/globe/index.html) from tools/globe/.
Edit head.html (CSS + layout) or script.js (behaviour), then run:  python3 tools/globe/build.py && python3 build.py
Prices inside the page are refreshed every 10 minutes by update_globe.py (GitHub Action), which rewrites the data between the /*MK*/ markers.
markets.json is the starting asset list (names, places, symbols); the live page keeps its own latest prices."""
import json, os, re
G = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(os.path.dirname(G))
h = open(os.path.join(G, 'head.html')).read(); s = open(os.path.join(G, 'script.js')).read()
D = open(os.path.join(G, 'dots.json')).read()
out = os.path.join(SITE, 'assets/globe/index.html')
# keep the latest live prices if the page already exists
M = json.dumps(json.load(open(os.path.join(G, 'markets.json'))), separators=(',', ':'))
ASOF = None
if os.path.exists(out):
    old = open(out, encoding='utf-8').read()
    m = re.search(r'/\*MK\*/(.*?)/\*MK\*/', old, re.S)
    if m: M = m.group(1)
    a = re.search(r'/\*ASOF\*/(.*?)/\*ASOF\*/', old)
    if a: ASOF = a.group(1)
LG = os.path.join(SITE, 'assets/logos/')
brand = {}
for f in os.listdir(LG):
    if '.' in f: brand.setdefault(f.rsplit('.', 1)[0], f)
used = {x.get('site') for x in json.loads(M)} | {x['s'] for x in json.loads(M)}
brand = {k: v for k, v in brand.items() if k in used and k not in ('BTC', 'ETH')}
for f in os.listdir(LG + 'co'):
    k = f[:-4]
    if k in used and k not in brand: brand[k] = 'co/' + f
CSS = "\n.hero-mode body{background:transparent}\n.hero-mode .app{display:block;padding:0;max-width:none}\n.hero-mode header,.hero-mode aside,.hero-mode .note,.hero-mode .secs{display:none}\n.hero-mode .stage{height:100vh;height:100dvh}\n.hero-mode .hint{bottom:12px}\n.hero-mode .full{display:inline-flex}\n.full{display:none;position:absolute;right:12px;top:12px;z-index:3;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;border:1px solid var(--line);background:rgba(17,17,19,.85);color:var(--fg);font:500 12.5px var(--sans);text-decoration:none}\n.full:hover{border-color:var(--fg-3)}\n.hero-stats{display:none;position:absolute;left:14px;top:12px;z-index:3;gap:14px;font:500 12px var(--sans);color:var(--fg-3)}\n.hero-mode .hero-stats{display:flex}\n.hero-stats b{font:500 13px var(--mono);margin-right:4px}\n.hero-stats{align-items:center;flex-wrap:wrap;row-gap:8px;max-width:calc(100% - 190px)}\n.live{display:inline-flex;align-items:center;gap:7px;padding:5px 11px 5px 9px;border:1px solid var(--line);border-radius:999px;background:rgba(17,17,19,.85);color:var(--fg);font-weight:550}\n.live i{position:relative;width:7px;height:7px;border-radius:50%;background:var(--up)}\n.live i::after{content:'';position:absolute;inset:0;border-radius:50%;background:var(--up);animation:livep 1.8s ease-out infinite}\n@keyframes livep{from{transform:scale(1);opacity:.7}to{transform:scale(2.8);opacity:0}}\n@media (prefers-reduced-motion:reduce){.live i::after{animation:none}}\n.ud{display:inline-flex;gap:14px;white-space:nowrap}\n"
hh = h.replace('</style>', CSS + '</style>', 1).replace('<p class="hint" id="hint">', '<a class="full" href="/globe.html" target="_top">Open world map →</a><div class="hero-stats"><span class="live"><i></i>Live markets</span><span class="ud"><span><b style="color:var(--up)" id="hsUp"></b>up</span><span><b style="color:var(--down)" id="hsDn"></b>down</span></span></div>\n    <p class="hint" id="hint">', 1)
ss = s.replace("<script>\n", "<script>\nif (/[?&]mode=hero/.test(location.search)) document.documentElement.classList.add('hero-mode');\n", 1)
ss = ss.replace("$('nUp').textContent = up; $('nDn').textContent = xs.length - up;", "$('nUp').textContent = up; $('nDn').textContent = xs.length - up; if ($('hsUp')) { $('hsUp').textContent = up; $('hsDn').textContent = xs.length - up; }", 1)
ss = ss.replace('target="_blank" rel="noopener">Jump to chart →', 'target="_top">Jump to chart →').replace("'https://investedia.com/asset.html?s=' + encodeURIComponent(m.site) : 'https://investedia.com/markets.html'", "'/asset.html?s=' + encodeURIComponent(m.site) : '/markets.html'")
page = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + hh.replace('</style>', '</style></head><body>', 1) + ss.replace('__DOTS__', D).replace('__MARKETS__', M).replace('__LOGOS__', 'null').replace('__BRAND__', json.dumps(brand)) + '</body></html>'
if ASOF: page = re.sub(r'/\*ASOF\*/.*?/\*ASOF\*/', lambda _: '/*ASOF*/' + ASOF + '/*ASOF*/', page, count=1)
open(out, 'w', encoding='utf-8').write(page)
print('built', out)
