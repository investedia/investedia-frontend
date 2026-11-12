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


if __name__ == '__main__':
    detail_check() if sys.argv[1:2] == ['--detail'] else main()
