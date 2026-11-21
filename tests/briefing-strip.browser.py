"""Saved-data checks for the rescued Briefing tab and footer; local server on 8877."""
from datetime import datetime, timezone
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.github/review/retired-prs'
INIT = """for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');
localStorage.setItem('inv-consent',JSON.stringify({version:1,date:'2026-11-21T12:00:00Z',preferences:true,images:false,analytics:false,live:false}));"""

def label(page, text):
    page.evaluate("""text=>{const e=document.createElement('div');e.textContent=text;e.style.cssText='position:fixed;top:4px;left:4px;z-index:2147483647;background:#ff7a1a;color:#111;padding:5px 9px;font:600 12px sans-serif';document.body.append(e)}""", text)

OUT.mkdir(parents=True, exist_ok=True)
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(args=['--enable-unsafe-swiftshader', '--hide-scrollbars'])
    try:
        for theme in ['dark', 'light']:
            for width in [1440, 390]:
                context = browser.new_context(viewport={'width': width, 'height': 900 if width == 1440 else 844}, service_workers='block', reduced_motion='reduce')
                context.add_init_script(INIT)
                context.add_init_script(f"localStorage.setItem('inv-theme','{theme}')")
                context.route('https://**/*', lambda route: route.abort())
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.goto('http://127.0.0.1:8877/about.html')
                assert page.locator('.ftr2-desc').inner_text() == 'News, insights and projects in one place.'
                page.locator('.ftr2-desc').evaluate("e=>e.scrollIntoView({block:'center',behavior:'instant'})")
                page.wait_for_timeout(250)
                label(page, f'New - Footer wording - {"PC 1440" if width == 1440 else "phone 390"}')
                page.screenshot(path=str(OUT/f'footer-{width}-{theme}.png'))
                page.clock.install(time=datetime(2026,11,21,12,tzinfo=timezone.utc))
                page.goto('http://127.0.0.1:8877/assets/globe/news.html')
                page.wait_for_function('window.InvBriefing?.state().ready')
                assert page.locator('.bf-card').count() == 1
                if width == 1440:
                    page.locator('#act [data-at=bf]').click()
                    assert page.locator('#act .bfs').is_visible()
                    assert 'Not investment advice' in page.locator('#act .bfs').inner_text()
                    page.locator('#act [data-bfs=play]').click()
                    page.wait_for_function('InvBriefing.state().playing')
                    page.locator('#act [data-bfs=pause]').click()
                    page.wait_for_function('!InvBriefing.state().playing')
                    page.locator('#act [data-bfs=tr]').click()
                    assert page.locator('.bf-card').is_visible()
                    assert page.locator('.bf-card .bf-list').is_visible()
                    page.locator('.bf-card .bf-x').click()
                    label(page, 'New - Briefing tab - PC 1440')
                    page.screenshot(path=str(OUT/f'news-1440-{theme}.png'))
                    page.locator('#gswitch [data-m=markets]').click()
                    page.locator('.mkd-a [data-mt=bf]').click()
                    assert page.locator('.mkd-a .bfs').is_visible()
                    assert page.locator('.mkd-a [data-mt=co]').count() == 1
                    page.locator('.mkd-a [data-bfs=tr]').click()
                    assert page.locator('.bf-card').is_visible()
                    page.locator('.bf-card .bf-x').click()
                    page.screenshot(path=str(OUT/f'markets-1440-{theme}.png'))
                    page.locator('.mkd-a [data-mt=co]').click()
                    assert page.locator('.mkd-a').evaluate("e=>e.classList.contains('co-on')")
                    page.locator('#gswitch [data-m=news]').click()
                    page.locator('#act [data-at=bf]').wait_for(state='visible')
                else:
                    assert not page.locator('#act').is_visible()
                    assert not page.locator('.mkd-a').is_visible()
                    assert page.locator('.bf-btn').is_visible()
                    label(page, 'New - Briefing kept - phone 390')
                    page.screenshot(path=str(OUT/f'news-390-{theme}.png'))
                assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')
                if width == 1440:
                    page.clock.set_system_time(datetime(2026,12,31,12,tzinfo=timezone.utc))
                    page.goto('http://127.0.0.1:8877/assets/globe/news.html')
                    page.wait_for_function('window.InvBriefing?.state().ready')
                    assert not page.evaluate('InvBriefing.state().recorded')
                    page.locator('#act [data-at=bf]').click()
                    assert 'Recorded voice' not in page.locator('#act').inner_text()
                    assert 'Spoken summary' in page.locator('#act').inner_text()
                page.goto('http://127.0.0.1:8877/assets/globe/news.html?embed=1')
                page.wait_for_load_state('domcontentloaded')
                assert not page.evaluate('!!window.InvBriefing')
                assert not errors, errors
                results.append({'width':width,'theme':theme,'errors':errors,'passed':True})
                context.close()
                print(f'PASS {width} {theme}: footer, shared player, strip controls, Companies, embed and phone behavior')
    finally:
        browser.close()
        (OUT/'results.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
