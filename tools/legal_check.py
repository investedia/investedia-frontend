"""Owner-fact rendering and a fail-closed pre-publication check (no legal sign-off)."""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
MARKER = re.compile(r'\[OWNER:[^\]]+\]')

def fields(root=ROOT):
    return json.loads((root / 'tools/legal-fields.json').read_text())

def config(root=ROOT):
    return json.loads((root / 'legal-config.json').read_text())

def render(text, values, styled=True):
    mapping = fields()
    def replace(match):
        key = mapping.get(match[0]); value = values.get(key)
        if value is not None and str(value).strip():
            return html.escape(str(value), quote=True)
        return '<mark class="owner-placeholder">' + html.escape(match[0]) + '</mark>' if styled else match[0]
    return MARKER.sub(replace, text)

def issues(root=ROOT, values=None):
    values = config(root) if values is None else values
    mapping = fields(root)
    result = [f'legal-config.json: {key} is unresolved' for key in sorted(set(mapping.values()))
              if values.get(key) is None or not str(values[key]).strip() or MARKER.search(str(values[key]))]
    ui = root/'assets/js/ui.js'
    if not ui.exists(): ui = root/'assets/ui.js'
    for path in [*(root/'src/pages').rglob('*.html'), root/'src/security.txt', ui]:
        if ' ' in path.name: continue
        for marker in sorted(set(MARKER.findall(path.read_text()))):
            key = mapping.get(marker)
            if key is None: result.append(f'{path.relative_to(root)}: unmapped {marker}')
    for key,value in values.items():
        if value is not None and not isinstance(value,(str,int,float,bool)):
            result.append(f'legal-config.json: {key} must be a plain value')
    return result

def main():
    problems = issues()
    if problems:
        print('Release blocked — complete and verify these owner facts:')
        print('\n'.join(' - '+p for p in problems))
        return 1
    print('Owner-fact gate passed. This is not legal approval or permission to publish.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
