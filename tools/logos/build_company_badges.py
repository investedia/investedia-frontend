"""Company logo badges for the globe Companies tab, style D "Tint" (owner choice, 17 Nov 2026).

For every company in data/companies.json with a PNG/JPG/WebP logo:
  - removes a solid background baked into the file (white always; black or coloured only if it is not most of the logo),
  - detects the brand colour (most common saturated colour, if it covers enough of the logo),
  - writes assets/logos/badge/<slug>.png (logo on transparent) and <slug>-w.png (white version for dark logos).
SVG logos are used as they are. Companies without a logo show their initial (done in the page).
Writes assets/logos/badges.json: {slug: {"c": "#rrggbb" or null, "m": "color" | "white", "f": path}}.
  m = which image sits on the grey tile: the colour logo when the brand has a colour or a white version would be a
  solid shape (e.g. Bayer, Mercedes badges), otherwise the white version (black wordmarks like adidas, BASF).
Usage: python3 tools/logos/build_company_badges.py
"""
import colorsys, json, pathlib
from collections import Counter, deque
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/logos/badge'
MAX = 96  # pixels; badges are shown at 40-60 px


def pixels(im):
    return list(im.get_flattened_data()) if hasattr(im, 'get_flattened_data') else list(im.getdata())


def opaque(im):
    return sum(1 for p in pixels(im) if p[3] > 40)


def clean(im):
    """Remove the background colour touching the corners."""
    W, H = im.size
    for cx, cy in ((0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)):
        r0, g0, b0, a0 = im.getpixel((cx, cy))
        if a0 < 20: continue
        trial = im.copy(); t = trial.load(); seen = set(); q = deque([(cx, cy)])
        while q:
            x, y = q.popleft()
            if (x, y) in seen or not (0 <= x < W and 0 <= y < H): continue
            seen.add((x, y)); r, g, b, a = t[x, y]
            if a > 20 and abs(r - r0) + abs(g - g0) + abs(b - b0) < 70:
                t[x, y] = (r, g, b, 0); q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
        if min(r0, g0, b0) > 225 or opaque(trial) >= opaque(im) * .45: im = trial  # never strip most of a logo
    box = im.getbbox()
    return im.crop(box) if box else im


def brand_colour(im):
    P = [p for p in pixels(im) if p[3] > 160]
    cols = Counter()
    for r, g, b, a in P:
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if s > .35 and .15 < l < .8: cols[(r // 16 * 16 + 8, g // 16 * 16 + 8, b // 16 * 16 + 8)] += 1
    if not cols or sum(cols.values()) <= len(P) * .12: return None
    return cols.most_common(1)[0][0]


def white_version(im, brand):
    """Brand-coloured pixels transparent, everything else white."""
    k = im.copy(); p = k.load()
    for y in range(k.size[1]):
        for x in range(k.size[0]):
            r, g, b, a = p[x, y]
            if a < 40: continue
            near = brand and abs(r - brand[0]) + abs(g - brand[1]) + abs(b - brand[2]) < 110
            p[x, y] = (255, 255, 255, 0) if near else (255, 255, 255, a)
    return k


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    companies = json.loads((ROOT / 'data/companies.json').read_text(encoding='utf-8'))['companies']
    out = {}
    for c in companies:
        src = ROOT / (c.get('logo') or '')
        if not c.get('logo') or not src.is_file(): continue
        if src.suffix.lower() == '.svg':
            out[c['slug']] = {'c': None, 'm': 'color', 'f': c['logo']}
            continue
        try: im = Image.open(src).convert('RGBA')
        except Exception: continue
        im.thumbnail((MAX * 2, MAX * 2))
        im = clean(im); im.thumbnail((MAX, MAX))
        b = brand_colour(im)
        w = white_version(im, b)
        blob = opaque(w) / max(1, w.size[0] * w.size[1]) > .7
        im.save(OUT / f"{c['slug']}.png", optimize=True)
        dark = b is not None and colorsys.rgb_to_hls(b[0] / 255, b[1] / 255, b[2] / 255)[1] < .45
        P = [q for q in pixels(im) if q[3] > 160]
        light_inside = sum(1 for r_, g_, b_, a_ in P if min(r_, g_, b_) > 215) / max(1, len(P))
        dark = dark and light_inside < .06  # white letters or symbols inside (Allianz, Ford): keep the colour logo
        # colour logo on the grey tile, unless it is a solid badge (Bayer, Mercedes); a dark brand colour would vanish
        # on its own tinted tile (Allstate, Lockheed), so those show in white (owner check, 18 Nov 2026)
        mode = 'color' if blob or (b and not dark) else 'white'
        if mode == 'white' and dark:  # a dark one-colour logo: the whole logo in white (removing the brand colour would leave nothing)
            w = im.copy(); px = w.load()
            for y in range(w.size[1]):
                for x in range(w.size[0]):
                    r_, g_, b_, a_ = px[x, y]
                    px[x, y] = (255, 255, 255, a_ if a_ > 40 else 0)
            if opaque(w) / max(1, w.size[0] * w.size[1]) > .7: mode = 'color'  # a solid square or disc in white would hide the logo
        if mode == 'white': w.save(OUT / f"{c['slug']}-w.png", optimize=True)
        out[c['slug']] = {'c': '#%02x%02x%02x' % b if b else None, 'm': mode,
                          'f': f"assets/logos/badge/{c['slug']}{'-w' if mode == 'white' else ''}.png"}
    (ROOT / 'assets/logos/badges.json').write_text(json.dumps(out, separators=(',', ':')) + '\n', encoding='utf-8')
    return out


if __name__ == '__main__':
    o = build()
    print(len(o), 'badges;', sum(1 for v in o.values() if v['c']), 'with a brand colour;', sum(1 for v in o.values() if v['m'] == 'white'), 'white')
