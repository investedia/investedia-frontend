"""Real saved-data browser checks; run with --compare-base <git-ref> for before/after evidence."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.github/review/frontend-lean-news'


def run(browser, width, ref=None):
    label = 'Now' if ref else 'New'
    context = browser.new_context(viewport={'width': width, 'height': 900 if width == 1440 else 844}, service_workers='block')
    context.add_init_script("""localStorage.setItem('inv-auth-seen','1');localStorage.setItem('inv-pop','1');
      localStorage.setItem('inv-consent',JSON.stringify({version:1,date:'2026-11-21T12:00:00Z',preferences:true,images:false,analytics:false,live:false}));""")
    context.route('https://**/*', lambda route: route.abort())
    if ref:
        for name in ['articles-lib.js', 'news-feed.js']:
            source = subprocess.check_output(['git', 'show', f'{ref}:assets/js/{name}'], cwd=ROOT)
            context.route(f'**/assets/{name}*', lambda route, request, source=source: route.fulfill(content_type='application/javascript', body=source))
    page = context.new_page()
    requests, errors = [], []
    page.on('request', lambda request: requests.append(request.url))
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.clock.install(time=datetime(2026, 11, 21, 12, tzinfo=timezone.utc))
    page.goto('http://127.0.0.1:8877/news.html')
    page.locator('#al-list .al-row').first.wait_for()
    page.locator('#nf-hero h2').wait_for()
    page.wait_for_function("document.getElementById('nf-strip').children.length > 0")
    initial = {
        'headlines': page.locator('#al-list h3').all_text_contents(),
        'hero': page.locator('#nf-hero h2').inner_text(),
        'movers': page.locator('#nf-strip').inner_text(),
        'count': page.locator('#al-count').inner_text(),
    }
    downloads = sum('/library-index/page-1.json' in url for url in requests)
    if not ref:
        assert downloads == 1, f'First page downloaded {downloads} times'
    assert page.locator('body').evaluate('(e) => e.scrollWidth <= innerWidth'), f'Horizontal overflow at {width}'
    assert 'Not investment advice' in page.locator('body').inner_text()
    page.evaluate("""label => { const tag=document.createElement('div');tag.textContent=label;
      tag.style.cssText='position:fixed;top:4px;left:4px;z-index:2147483647;background:#ff7a1a;color:#111;padding:5px 9px;font:600 12px sans-serif';
      document.body.append(tag); }""", f'{label} · Lean news · {"PC 1440" if width == 1440 else "phone 390"}')
    page.screenshot(path=str(OUT / f'{label.lower()}-{width}.png'))
    ordering = {}
    for window in ['d', 'w', 'm']:
        for sort in ['new', 'big']:
            page.evaluate("""([win, sort]) => {
              document.querySelector(`#nf-win [data-k="${win}"]`).click();
              document.querySelector(`#nf-sort [data-k="${sort}"]`).click();
            }""", [window, sort])
            ordering[f'{window}-{sort}'] = page.locator('#nf-list h3 a').evaluate_all('(links) => links.map(a => a.getAttribute("href"))')
    # Both filters run before the large index returns. The final selection must win.
    page.evaluate("""() => {
      document.querySelector('#al-cat [data-v="economy"]').click();
      document.querySelector('#al-cat [data-v="companies"]').click();
    }""")
    page.wait_for_function("document.querySelector('#al-list .al-ct')?.textContent.startsWith('Companies')")
    if not ref:
        assert sum('/library-index/all.json' in url for url in requests) == 1, 'Filters downloaded the large index twice'
    if not ref:
        assert all(text.startswith('Companies') for text in page.locator('#al-list .al-ct').all_text_contents())
    context.close()
    return {'initial': initial, 'ordering': ordering, 'first_page_downloads': downloads, 'errors': errors}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--compare-base')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    results = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        try:
            for width in [1440, 390]:
                before = run(browser, width, args.compare_base) if args.compare_base else None
                after = run(browser, width)
                results[str(width)] = {'before': before, 'after': after}
                if before:
                    assert before['initial'] == after['initial'], f'Article content changed at {width}'
                    assert before['ordering'] == after['ordering'], f'Article ranking changed at {width}'
                    assert after['errors'] == before['errors'], f'New browser errors at {width}: {after["errors"]}'
                else:
                    assert not after['errors'], after['errors']
                print(f'PASS {width}: content, sorting, filters, downloads and phone width')
        finally:
            browser.close()
            (OUT / 'results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
