"""Daily refresh of assets/globe/markets.json (price, day and week change, one-month sparkline) for the globe,
Markets panel, watchlist and Briefing. Owner approved 18 Nov 2026 ("do 1"): keep Yahoo Finance for now, swap later.

Source is in ONE place (fetch_yahoo); to switch provider, replace that function. Assets the source fails to return keep
their last values. If fewer than half refresh, nothing is written (the site keeps the previous day).
Not licensed for redistribution: the site shows delayed/end-of-day figures and says so. Not investment advice.
"""
import concurrent.futures as cf
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [ROOT / 'assets/globe/markets.json', ROOT / 'docs/assets/globe/markets.json']
UA = {'User-Agent': 'Mozilla/5.0'}
MINOR = {'GBp': ('GBP', .01), 'GBX': ('GBP', .01), 'ZAc': ('ZAR', .01), 'USX': ('USD', .01), 'ILA': ('ILS', .01), 'KWF': ('KWD', .001)}


def listing():
    """Globe symbol -> verified Yahoo symbol for stocks whose site code is not a Yahoo symbol (MC = LVMH -> MC.PA)."""
    try:
        reg = json.loads((ROOT / 'data/registry.json').read_text(encoding='utf-8'))['assets']
        return {a['globe_symbol']: a['px'] for a in reg.values() if a.get('globe_symbol') and a.get('px')}
    except Exception:
        return {}


LISTING = listing()


def source_symbol(a):
    if a['t'] == 'stocks' and a['s'] in LISTING:
        return LISTING[a['s']]
    if a['t'] == 'fx':
        return a['s'] if a['s'].endswith('=X') else a['s'] + '=X'
    if a['t'] == 'crypto':
        return a['s'] if a['s'].endswith('-USD') else a['s'] + '-USD'
    return a['s']


def fetch_yahoo(sym):
    """Daily closes for one month, last value = latest price; (closes, currency) or None."""
    for i in range(2):
        try:
            url = f'https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?range=1mo&interval=1d'
            r = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20))['chart']['result'][0]
            c = [x for x in r['indicators']['quote'][0]['close'] if x is not None]
            live = r['meta'].get('regularMarketPrice')
            if live and c:
                c[-1] = live
            cur = r['meta'].get('currency')
            if cur in MINOR:
                cur, k = MINOR[cur]
                c = [x * k for x in c]
            if len(c) >= 6 and c[-1]:
                return c, cur
        except Exception:
            time.sleep(1 + i)
    return None


def main():
    data = json.loads(FILES[0].read_text(encoding='utf-8'))
    assets = data['assets']
    with cf.ThreadPoolExecutor(12) as ex:
        res = list(ex.map(lambda a: fetch_yahoo(source_symbol(a)), assets))
    ok = 0
    for a, rc in zip(assets, res):
        if not rc:
            continue
        c, cur = rc
        if cur:
            a['cur'] = cur
        sign = -1 if a.get('inv') else 1
        a['p'] = round(c[-1], 6)
        a['d'] = round(sign * (c[-1] / c[-2] - 1) * 100, 2)
        a['w'] = round(sign * (c[-1] / c[-6] - 1) * 100, 2)
        a['sp'] = [round(x, 6) for x in c[-22:]]
        ok += 1
    print(f'markets: {ok}/{len(assets)} assets refreshed')
    if ok < len(assets) * .5:
        raise SystemExit('Too many failures; keeping the previous data')
    data['asof'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    out = json.dumps(data, separators=(',', ':'), ensure_ascii=False)
    for f in FILES:
        f.write_text(out, encoding='utf-8')


if __name__ == '__main__':
    main()
