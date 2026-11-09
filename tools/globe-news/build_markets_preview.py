"""Generate isolated approved M1 previews using the unchanged homepage/renderer.

No default route changes. Price bootstraps are omitted from this preview only.
Assertions deliberately fail if the source anchors change: never silently ship
a preview that accidentally loads quotes or substitutes a different renderer.
"""
import re
import hashlib
from pathlib import Path
from build_market_focus import build as build_focus

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent


def build(page):
    build_focus()
    start = page.index('// P4: an optional layer')
    end = page.index('\nrequestAnimationFrame(frame);', start)
    preview = page[:start] + (HERE / 'market-focus-mode.js').read_text() + page[end:]
    assert preview.count('const n = activity[c.name];') == 1
    preview = preview.replace('const n = activity[c.name];', 'const n = MARKET.on ? MARKET.focus?.countries[ISO[c.name]]?.counts.articles_48h : activity[c.name];')
    # Isolated entrypoint: omit external quote/live/preferences/peek bootstraps.
    preview = re.sub(r'<script\b[^>]*\bsrc=[^>]+>\s*</script>', '', preview)
    start = preview.index("Promise.all([fetch('markets.json')")
    end = preview.index('}).catch(() => {});', start) + len('}).catch(() => {});')
    preview = preview[:start] + preview[end:]
    preview = preview.replace('.catch(() => load(DEMO_URL))', '')
    # No fabricated fallback when the live source is unavailable.
    assert "fetch('markets.json')" not in preview
    assert '/* MARKET_MODE */' not in preview
    (ROOT / 'assets/globe/market-preview.html').write_text(preview)
    home = (ROOT / 'src/pages/index.html').read_text()
    css = home[home.index('<style>') + 7:home.index('</style>')]
    hero = home[home.index('<section class="hn-hero"'):home.index('</section>') + 10]
    hero = hero.replace('class="hn-hero"', 'class="hn-hero hv-a"')
    hero = hero.replace('aria-label="Live news globe"', 'aria-label="Markets preview globe"')
    hero = hero.replace('title="Live news globe"', 'title="News and Markets globe preview"')
    hero = hero.replace('Search assets, countries &amp; articles', 'Search countries, exchanges, indices &amp; companies')
    shell = (HERE / 'markets-preview-shell.html').read_text()
    shell = shell.replace('<!-- HOME_CSS -->', '<style>' + css + '</style>')
    shell = shell.replace('<!-- HOME_HERO -->', hero)
    version = hashlib.sha256((preview + shell).encode() + (ROOT / 'assets/market-focus-preview.js').read_bytes() + (ROOT / 'assets/market-focus-preview.css').read_bytes()).hexdigest()[:12]
    shell = shell.replace('<!-- PREVIEW_BUILD -->', f'<meta name="m1-build" content="{version}">')
    shell = shell.replace('href="assets/market-focus-preview.css"', f'href="assets/market-focus-preview.css?v={version}"')
    shell = shell.replace('src="assets/market-focus-preview.js"', f'src="assets/market-focus-preview.js?v={version}"')
    (ROOT / 'markets-preview.html').write_text(shell)
    (ROOT / 'docs/markets-preview.html').write_text(shell)
    print('Built isolated Markets preview: markets-preview.html')
