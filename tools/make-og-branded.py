"""Make 1200x630 share pictures with a small Investedia logo in the top-left.
Run after adding photos:  python3 tools/make-og-branded.py
Reads assets/globe/photos/*.jpg, writes assets/og/<same name>.jpg (skips existing)."""
import os, sys
from PIL import Image, ImageDraw
SRC, DST = 'assets/globe/photos', 'assets/og'
W, H, SZ, M = 1200, 630, 64, 28

def logo(sz):
    k = 8; s = sz * k; f = s / 1086
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(200 * f), fill=(0, 0, 0, 255))
    pts = [(x * f, y * f) for x, y in [(128, 686), (335, 536), (497, 640), (727, 410)]]
    d.line(pts, fill=(255, 255, 255, 255), width=int(70 * f), joint='curve')
    c, r = (842 * f, 318 * f), 83 * f
    d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], fill=(238, 133, 56, 255))
    return im.resize((sz, sz), Image.LANCZOS)

def shadow(sz, pad=14):
    from PIL import ImageFilter
    sh = Image.new('RGBA', (sz + 2 * pad, sz + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([pad, pad + 3, pad + sz, pad + sz + 3], radius=int(sz * .19), fill=(0, 0, 0, 110))
    return sh.filter(ImageFilter.GaussianBlur(7)), pad

def main():
    os.makedirs(DST, exist_ok=True); L = logo(SZ); S, pad = shadow(SZ); n = 0
    for fn in sorted(os.listdir(SRC)):
        if not fn.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')): continue
        out = os.path.join(DST, os.path.splitext(fn)[0] + '.jpg')
        if os.path.exists(out) and '--force' not in sys.argv: continue
        im = Image.open(os.path.join(SRC, fn)).convert('RGB'); w, h = im.size
        sc = max(W / w, H / h); im = im.resize((round(w * sc), round(h * sc)), Image.LANCZOS)
        l, t = (im.width - W) // 2, (im.height - H) // 2; im = im.crop((l, t, l + W, t + H)).convert('RGBA')
        im.alpha_composite(S, (M - pad, M - pad)); im.alpha_composite(L, (M, M))
        im.convert('RGB').save(out, 'JPEG', quality=70, optimize=True, progressive=True); n += 1
    print('made', n)
main()
