"""Package screenshots with approved references outside the repository."""
import argparse
import html
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--ref', default='origin/docs/markets-handoff')
parser.add_argument('--output', default='/tmp/markets-m1-evidence')
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
names = ['1-default', '2-country', '3-centre', '4a-focus-editorial', '4b-focus-structured', '5-invest', '6-limited', '7-noprice', '8-connection']
cards = []
for device in ['phone', 'pc']:
    for name in names:
        base = f'MF-{device}-{name}'
        source = subprocess.check_output(['git', 'show', f'{args.ref}:design/markets-focus/{base}.png'])
        (out / f'{base}-mockup.png').write_bytes(source)
        label = html.escape(f'{name} · {device}')
        detail = f'<details><summary>{label} · Built lower panel</summary><img style="max-width:100%" src="{base}-details-built.png"></details>' if (out / f'{base}-details-built.png').exists() else ''
        cards.append(f'<section id="{device}-{name}"><h2>{label}</h2><div class="pair"><figure><figcaption>{label} · Mockup</figcaption><img src="{base}-mockup.png"></figure><figure><figcaption>{label} · Built</figcaption><img src="{base}-built.png"></figure></div>{detail}</section>')
body = '''<!doctype html><meta charset="utf-8"><title>M1 approved vs built</title>
<style>body{background:#101012;color:#eee;font:16px Arial;margin:24px}section{margin-bottom:40px}.pair{display:flex;align-items:flex-start;gap:16px}figure{margin:0;width:48%;max-width:1440px}figure img{width:100%;display:block}figcaption{padding:10px;background:#ff7a1a;color:#111;font-weight:bold}section[id^=phone] figure{max-width:390px}a{color:#ffad70}</style>
<h1>M1 · Markets previews · Mockup / Built</h1><p>Built screenshots use the real branch news snapshot; their clock is pinned to that snapshot timestamp for repeatable relative ages. Current coverage, exact sourced headlines and ages differ from the approved reference snapshot. View results.json for measured acceptance results. Phone panel content scrolls internally.</p><a href="results.json">Measured results</a>'''
(out / 'comparison.html').write_text(body + ''.join(cards))
print('Packaged 18 comparisons in', out / 'comparison.html')
