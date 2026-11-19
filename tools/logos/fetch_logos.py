"""Logos for companies in data/companies.json that have none (owner, 18 Nov 2026).

Sources, in order (downloadable and checkable; nothing is guessed):
  1. Wikidata P154 "logo image" (a file on Wikimedia Commons), for companies with a Wikidata id in the HQ file;
  2. the company's own website: its high-resolution app icon (apple-touch-icon, or an <link rel=icon> of 64 px or more).
Images smaller than 64 px, or that are not images, are rejected. Each logo is saved as assets/logos/co/<slug>.<ext>
and recorded in data/companies.json ("logo", plus "logo_source" with the URL it came from); then run
tools/logos/build_company_badges.py to make the D-style badge.
Usage: python3 tools/logos/fetch_logos.py [--limit N] [--check]
"""
import argparse, hashlib, html, io, json, pathlib, re, sys, time, urllib.parse, urllib.request
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
DIRECTORY = ROOT / 'data/companies.json'
HQ = ROOT / 'assets/globe/company-hq.json'
OUT = ROOT / 'assets/logos/co'
CACHE = pathlib.Path('/tmp/investedia-logo-cache'); CACHE.mkdir(exist_ok=True)
UA = 'Mozilla/5.0 (compatible; InvestediaBuild/1.0; site data build)'
MIN = 64
# Hand check 18 Nov 2026: the source gave a photo or a plain shape, not the logo.
REJECT = {'china-mobile': 'photo, not a logo', 'oando': 'photo, not a logo', 'aiico-insurance': 'plain red rectangle'}


def get(url, accept='*/*', limit=3_000_000):
    f = CACHE / hashlib.sha256(url.encode()).hexdigest()
    if f.exists(): return f.read_bytes() or None
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept})
        with urllib.request.urlopen(req, timeout=25) as r: data = r.read(limit)
    except Exception: data = b''
    f.write_bytes(data); time.sleep(.4)
    return data or None


def image_ok(data):
    """(ext, width) if the bytes are a usable logo image, else None. SVG is accepted as-is."""
    if not data: return None
    if data.lstrip()[:200].lower().find(b'<svg') >= 0: return ('svg', 999)
    try:
        im = Image.open(io.BytesIO(data)); im.load()
    except Exception: return None
    w, h = im.size
    if min(w, h) < MIN: return None
    return ({'PNG': 'png', 'JPEG': 'jpg', 'WEBP': 'webp', 'ICO': 'png', 'GIF': 'png'}.get(im.format, 'png'), w)


def wikidata_logo(qid):
    d = get(f'https://www.wikidata.org/wiki/Special:EntityData/{qid}.json', 'application/json')
    try: claims = json.loads(d)['entities'][qid]['claims']
    except Exception: return None
    for st in claims.get('P154', []):
        if st.get('rank') == 'deprecated': continue
        name = st['mainsnak'].get('datavalue', {}).get('value')
        if name:
            url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(name.replace(' ', '_')) + '?width=256'
            return url, f'https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(name.replace(" ", "_"))}'
    return None


def website_icon(site):
    page = get(site, 'text/html')
    if not page: return None
    t = page.decode('utf-8', 'ignore')
    cands = []
    for tag in re.findall(r'<link\b[^>]*>', t, re.I):
        rel = (re.search(r'rel=["\']([^"\']+)', tag, re.I) or [None, ''])[1].lower()
        href = (re.search(r'href=["\']([^"\']+)', tag, re.I) or [None, ''])[1]
        if not href or 'icon' not in rel: continue
        size = max([int(x) for x in re.findall(r'(\d+)x\d+', (re.search(r'sizes=["\']([^"\']+)', tag, re.I) or [None, ''])[1])] or [0])
        score = (2 if 'apple-touch' in rel else 1, size)
        cands.append((score, urllib.parse.urljoin(site, html.unescape(href))))
    cands.append(((0, 0), urllib.parse.urljoin(site, '/apple-touch-icon.png')))
    for _, url in sorted(cands, reverse=True):
        if image_ok(get(url, 'image/*')): return url, site
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(); ap.add_argument('--limit', type=int); ap.add_argument('--check', action='store_true')
    a = ap.parse_args(argv)
    d = json.loads(DIRECTORY.read_text(encoding='utf-8')); H = json.loads(HQ.read_text(encoding='utf-8'))['companies']
    todo = [c for c in d['companies'] if not (c.get('logo') and (ROOT / c['logo']).is_file()) and c['slug'] not in REJECT][:a.limit]
    OUT.mkdir(parents=True, exist_ok=True); got = {'wikidata': 0, 'website': 0}
    for i, c in enumerate(todo, 1):
        qid = c.get('qid') or next((H[l['s']].get('qid') for l in c['listings'] if H.get(l['s'], {}).get('qid')), None)
        found, kind = None, None
        if qid:
            w = wikidata_logo(qid)
            if w and image_ok(get(w[0], 'image/*')): found, kind = w, 'wikidata'
        if not found and c.get('website'):
            w = website_icon(c['website'])
            if w: found, kind = w, 'website'
        if found:
            data = get(found[0], 'image/*'); ext = image_ok(data)[0]
            path = f"assets/logos/co/{c['slug']}.{ext}"
            if not a.check:
                (ROOT / path).write_bytes(data)
                c['logo'] = path; c['logo_source'] = {'kind': kind, 'url': found[1]}
            got[kind] += 1
        print(f"{i}/{len(todo)} {c['name']}: {kind or 'no logo found'}", flush=True)
    if not a.check: DIRECTORY.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(json.dumps({'checked': len(todo), **got}))


if __name__ == '__main__':
    sys.exit(main())
