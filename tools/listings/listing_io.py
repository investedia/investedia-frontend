"""Shared helpers for the official exchange list tools (tools/listings/<exchange>.py), owner task 19 Nov 2026.

Same fetch pattern as tools/listings/africa.py: one request at a time, a pause of at least 2 seconds between requests,
an honest User-Agent, the downloaded bytes hashed (SHA-256), and only list facts saved:
symbol, name, local-script name, ISIN, home country, sector, industry and website when the source gives them.
"""
import datetime, hashlib, html, json, pathlib, re, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'data/listed-companies'
UA = 'Mozilla/5.0 (compatible; InvestediaBuild/1.0; listed-company directory build; low volume)'
_last = [0.0]
# Instruments that are not ordinary shares of a company
NOT_SHARE = re.compile(r'\b(ETF|ETFs|Exchange[- ]Traded|Fund|Funds|REIT|REITs|Real Estate Investment Trust|Trust|Unit Trust|Bond|Bonds|Sukuk|Debenture|'
                       r'Warrant|Warrants|Rights?|Preference|Preferred|Pref|Depositary|Depository|DR|NVDR|Mutual)\b', re.I)


def get(url, data=None, headers=None, pause=2.2):
    """One polite request: waits so that requests are at least `pause` seconds apart."""
    wait = _last[0] + pause - time.time()
    if wait > 0: time.sleep(wait)
    h = {'User-Agent': UA, 'Accept-Language': 'en'}
    h.update(headers or {})
    try:
        return urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=90).read()
    finally:
        _last[0] = time.time()


def text(b):
    """Readable text of an HTML page (for reading terms pages)."""
    s = b.decode('utf-8', 'replace')
    s = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', s, flags=re.S | re.I)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


def clean(v):
    v = re.sub(r'\s+', ' ', html.unescape(str(v or ''))).strip()
    return v or None


def save(key, exchange, source_url, terms_url, raw, rows):
    """Write data/listed-companies/<key>.json in the investedia.listed-companies/v1 format; drops empty fields."""
    keep = ('symbol', 'name', 'name_local', 'isin', 'country_key', 'sector', 'industry', 'website')
    out = []
    for r in rows:
        r = {k: clean(r.get(k)) for k in keep if clean(r.get(k))}
        if r.get('symbol') and r.get('name') and r.get('country_key'): out.append(r)
    syms = [r['symbol'] for r in out]
    dup = {s for s in syms if syms.count(s) > 1}
    if dup: raise ValueError(f'{key}: duplicate symbols {sorted(dup)[:10]}')
    if not out: raise ValueError(f'{key}: no listings parsed')
    OUT.mkdir(parents=True, exist_ok=True)
    sha = hashlib.sha256(raw if isinstance(raw, bytes) else b''.join(raw)).hexdigest()
    (OUT / f'{key}.json').write_text(json.dumps({'schema': 'investedia.listed-companies/v1', 'exchange': exchange, 'source_url': source_url,
        'terms_url': terms_url, 'checked_at': datetime.date.today().isoformat(), 'source_sha256': sha, 'count': len(out), 'listings': out},
        ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(key, len(out), 'listings saved')
    return out


def home(isin, default):
    """Home country from the ISIN prefix when it is a real country other than the exchange's own; else the default.
    XS (international) and the exchange's own prefix keep the default."""
    p = (isin or '')[:2].upper()
    return p if re.fullmatch(r'[A-Z]{2}', p) and p not in ('XS', 'EU', default) else default
