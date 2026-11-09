"""Print an option label on a screenshot so the owner can decide from the image alone.
Usage: python3 tools/label-image.py in.png out.png "A" "Compact card" ["PC"]"""
import sys
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
src, dst, key, name = sys.argv[1:5]; tag = sys.argv[5] if len(sys.argv) > 5 else ''
im = Image.open(src).convert('RGBA'); W, H = im.size; s = max(1, W / 1200)
f1 = ImageFont.truetype(('/usr/share/fonts/opentype/inter/Inter-Bold.otf' if Path('/usr/share/fonts/opentype/inter/Inter-Bold.otf').exists() else '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'), int(30 * s)); f2 = ImageFont.truetype(('/usr/share/fonts/opentype/inter/Inter-SemiBold.otf' if Path('/usr/share/fonts/opentype/inter/Inter-SemiBold.otf').exists() else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'), int(19 * s))
txt = f'{name}' + (f'  ·  {tag}' if tag else ''); pad = int(14 * s); r = int(46 * s)
w2 = ImageDraw.Draw(im).textlength(txt, font=f2); bw = int(r + pad + w2 + pad * 1.4); bh = int(r + pad)
ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov); x0, y0 = int(14 * s), int(14 * s)
d.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=bh // 2, fill=(255, 122, 26, 255))
d.ellipse([x0 + pad // 2, y0 + pad // 2, x0 + pad // 2 + r, y0 + pad // 2 + r], fill=(0, 0, 0, 255))
tw = d.textlength(key, font=f1); d.text((x0 + pad // 2 + (r - tw) / 2, y0 + pad // 2 + (r - 30 * s) / 2 - 2 * s), key, font=f1, fill=(255, 255, 255, 255))
d.text((x0 + pad // 2 + r + pad, y0 + (bh - 19 * s) / 2 - 2 * s), txt, font=f2, fill=(0, 0, 0, 255))
Image.alpha_composite(im, ov).convert('RGB').save(dst)
