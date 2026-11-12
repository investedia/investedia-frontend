"""Pick a recent, cloud-free NASA HLS (Sentinel-2) satellite date for each plant in projects-energy.json.

The browser then loads that one NASA GIBS tile (public, free) and rings the exact plant point.
Only real dated imagery is used: a plant without a clear image in the window gets no satellite view.
Credit: Contains modified Copernicus Sentinel data, processed by NASA HLS; imagery via NASA GIBS.
"""
import io, json, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LAYER = 'HLS_S30_Nadir_BRDF_Adjusted_Reflectance'
URL = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{l}/default/{d}/31.25m/11/{r}/{c}.png'
DEG = 360 / 2560  # level 11 tile width in degrees


def tile(lat, lon): return int((lon + 180) // DEG), int((90 - lat) // DEG)


def clear(raw):
    im = Image.open(io.BytesIO(raw)).convert('RGBA').resize((128, 128))
    px = list(im.getdata())
    cover = sum(1 for p in px if p[3] > 0) / len(px)
    cloud = sum(1 for p in px if p[3] > 0 and min(p[:3]) > 190) / max(1, sum(1 for p in px if p[3] > 0))
    return cover >= .97 and cloud <= .08


def search(key, start, days):
    c, r = key
    for i in range(days):
        d = (start - timedelta(days=i)).isoformat()
        try:
            with urllib.request.urlopen(URL.format(l=LAYER, d=d, r=r, c=c), timeout=30) as resp: raw = resp.read()
        except Exception: continue
        if len(raw) > 20000 and clear(raw): return key, d
    return key, None


def main(days=75):
    p = ROOT / 'assets/globe/projects-energy.json'
    doc = json.loads(p.read_text())
    start = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else date.today() - timedelta(days=6)
    keys = sorted({tile(r[4], r[5]) for r in doc['plants']})
    print(len(keys), 'tiles', flush=True)
    found = {}
    with ThreadPoolExecutor(24) as ex:
        for n, (k, d) in enumerate(ex.map(lambda k: search(k, start, days), keys)):
            found[k] = d
            if n % 250 == 0: print(n, sum(1 for v in found.values() if v), flush=True)
    for r in doc['plants']:
        k = tile(r[4], r[5]); r[14] = [found[k], k[0], k[1]] if found.get(k) else None
    doc['satellite'] = {'layer': LAYER, 'level': 11, 'tile_deg': DEG, 'url': URL.replace('{l}', LAYER),
                        'credit': 'Contains modified Copernicus Sentinel data, processed by NASA HLS; imagery NASA GIBS',
                        'searched_from': start.isoformat(), 'days': days}
    doc['counts']['with_satellite'] = sum(1 for r in doc['plants'] if r[14])
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n')
    print('done', doc['counts']['with_satellite'], 'of', len(doc['plants']))




def detail_check(threshold=8.0):
    """Owner rule (12 Nov 2026): drop a satellite view when it shows too little (flat desert, sea, haze).
    Measures brightness variation in a ~6 km box around the plant; below the threshold the plant shows no picture."""
    from PIL import ImageStat
    p = ROOT / 'assets/globe/projects-energy.json'
    doc = json.loads(p.read_text()); U = doc['satellite']['url']
    def score(r):
        s = r[14]
        try:
            with urllib.request.urlopen(U.replace('{d}', s[0]).replace('{r}', str(s[2])).replace('{c}', str(s[1])), timeout=30) as resp: raw = resp.read()
        except Exception: return r, None
        im = Image.open(io.BytesIO(raw)).convert('L'); x = ((r[5] + 180) / DEG - s[1]) * 512; y = ((90 - r[4]) / DEG - s[2]) * 512
        return r, ImageStat.Stat(im.crop((max(0, x - 96), max(0, y - 96), min(512, x + 96), min(512, y + 96)))).stddev[0]
    with ThreadPoolExecutor(24) as ex:
        for r, sd in ex.map(score, [r for r in doc['plants'] if r[14]]):
            if sd is None or sd < threshold: r[14] = None
    doc['satellite']['min_detail'] = threshold
    doc['counts']['with_satellite'] = sum(1 for r in doc['plants'] if r[14])
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n')
    print('kept', doc['counts']['with_satellite'])




def before_pass(threshold=None):
    """Owner request (12 Nov 2026): a 2020 <-> now comparison for plants being built.
    For Under construction / Pre-construction plants with a satellite view, find a clear Oct-Nov image on the
    same tile (Oct-Nov 2025, else Mar-Jun 2026) and measure how much the ~6 km box around the plant changed.
    Field 15 = [before_date, change_score]; the site shows the slider only when score >= doc.satellite.min_change."""
    from PIL import ImageChops, ImageStat
    p = ROOT / 'assets/globe/projects-energy.json'
    doc = json.loads(p.read_text()); U = doc['satellite']['url']
    def grab(d, c, r):
        with urllib.request.urlopen(U.replace('{d}', d).replace('{r}', str(r)).replace('{c}', str(c)), timeout=30) as resp:
            return Image.open(io.BytesIO(resp.read())).convert('L')
    def work(r):
        s = r[14]; c, row = s[1], s[2]
        # Owner (12 Nov 2026): compare with a recent image, about a year back: Oct-Nov 2025, else Mar-Jun 2026.
        for end, days in ((date(2025, 11, 30), 61), (date(2026, 6, 30), 120)):
            _, d = search((c, row), end, days)
            if d: break
        else: return r, None
        try: a, b = grab(d, c, row), grab(s[0], c, row)
        except Exception: return r, None
        x = ((r[5] + 180) / DEG - c) * 512; yy = ((90 - r[4]) / DEG - row) * 512
        box = (max(0, x - 96), max(0, yy - 96), min(512, x + 96), min(512, yy + 96))
        diff = ImageStat.Stat(ImageChops.difference(a.crop(box), b.crop(box))).mean[0]
        return r, [d, round(diff, 1)]
    todo = [r for r in doc['plants'] if r[14] and r[7] in ('Under construction', 'Pre-construction')]
    for r in doc['plants']:
        while len(r) < 16: r.append(None)
    print(len(todo), 'plants', flush=True)
    with ThreadPoolExecutor(24) as ex:
        for n, (r, v) in enumerate(ex.map(work, todo)):
            r[15] = v
            if n % 500 == 0: print(n, flush=True)
    if threshold is not None: doc['satellite']['min_change'] = threshold
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n')
    print('done', sum(1 for r in doc['plants'] if r[15]))


def change_pass():
    """Rescore before/after pairs by new built structure, not colour: both crops must be fully covered and
    cloud-free; score = rise in edge density (after autocontrast) around the plant. Seasons, haze and sea
    barely change edges; new solar blocks, roads, dams and pads do. Field 15 becomes [before_date, score]."""
    from PIL import ImageFilter, ImageOps, ImageStat
    p = ROOT / 'assets/globe/projects-energy.json'
    doc = json.loads(p.read_text()); U = doc['satellite']['url']
    def crop(d, r, s):
        with urllib.request.urlopen(U.replace('{d}', d).replace('{r}', str(s[2])).replace('{c}', str(s[1])), timeout=30) as resp:
            im = Image.open(io.BytesIO(resp.read())).convert('RGBA')
        x = ((r[5] + 180) / DEG - s[1]) * 512; y = ((90 - r[4]) / DEG - s[2]) * 512
        return im.crop((int(x) - 96, int(y) - 96, int(x) + 96, int(y) + 96))
    def ok(c):
        px = list(c.getdata()); n = len(px)
        if sum(1 for q in px if q[3] == 0 or max(q[:3]) < 8) > n * .01: return False      # outside image / empty
        if sum(1 for q in px if min(q[:3]) > 215 and max(q[:3]) - min(q[:3]) < 22) > n * .02: return False  # cloud: near-white, colourless
        g = c.convert('L'); return ImageStat.Stat(g).stddev[0] >= 6                         # not open sea / flat
    def edges(c): return ImageStat.Stat(ImageOps.autocontrast(c.convert('L'), cutoff=1).filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)).mean[0] / 255
    def work(r):
        try: a, b = crop(r[15][0], r, r[14]), crop(r[14][0], r, r[14])
        except Exception: return r, None
        if not (ok(a) and ok(b)): return r, None
        return r, [r[15][0], round((edges(b) - edges(a)) * 100, 2)]
    todo = [r for r in doc['plants'] if r[15]]
    with ThreadPoolExecutor(24) as ex:
        for r, v in ex.map(work, todo): r[15] = v
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n')
    print('scored', sum(1 for r in doc['plants'] if r[15]), 'of', len(todo))


if __name__ == '__main__':
    {'--detail': detail_check, '--before': before_pass, '--change': change_pass}.get(sys.argv[1] if len(sys.argv) > 1 else '', main)()
