#!/usr/bin/env python3
"""Validate the top company logo inventory. Never upscale a file to pass this gate."""
import json
import sys
from pathlib import Path
from PIL import Image
from xml.etree import ElementTree
ROOT = Path(__file__).resolve().parents[1]
logos = json.loads((ROOT/'assets/globe/logos.json').read_text())
ranks = json.loads((ROOT/'data/asset-importance.json').read_text())['ranks']
failures = []
for symbol in sorted(ranks, key=ranks.get):
    path = ROOT/'assets/globe'/logos.get(symbol, '__missing__')
    if not path.is_file():
        failures.append(f'{symbol}: missing local logo')
        continue
    try:
        if path.suffix.lower() == '.svg':
            root = ElementTree.parse(path).getroot()
            if not root.attrib.get('viewBox') and not (root.attrib.get('width') and root.attrib.get('height')):
                failures.append(f'{symbol}: SVG has no usable dimensions')
        else:
            with Image.open(path) as im:
                if min(im.size) < 96: failures.append(f'{symbol}: {im.width}×{im.height}, minimum 96 px on both axes')
    except Exception as exc: failures.append(f'{symbol}: invalid logo ({exc})')
coins = json.loads((ROOT/'data/crypto-top30.json').read_text())['coins']
for coin in coins:
    files = [ROOT/'assets/logos'/f"{coin['s']}.{ext}" for ext in ('svg', 'png')]
    found = next((f for f in files if f.is_file()), None)
    if not found: failures.append(f"{coin['s']} ({coin['n']}): missing coin logo"); continue
    if found.suffix == '.png':
        with Image.open(found) as im:
            if min(im.size) < 96: failures.append(f"{coin['s']}: {im.width}×{im.height}, minimum 96 px on both axes")
print(f'Checked {len(ranks)} company logos and {len(coins)} coin logos (SVG vectors or raster ≥96 px).')
print('\n'.join(failures) if failures else 'All logos pass.')
sys.exit(bool(failures))
