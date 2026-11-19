"""Nigerian Exchange (NGX) listed companies, from the exchange's own company directory (owner, 17 Nov 2026).

  python3 tools/listings/ngx.py --fetch   download the official list to data/listed-companies/ngx.json (source URL, date, SHA-256)
  python3 tools/listings/ngx.py           add NGX companies that are not yet in data/companies.json

Companies already in the directory are never changed. New ones get one listing on NGX with "tracked": false (we do
not track their price yet), and only facts the exchange publishes: legal name, ISIN, sector and sub-sector, website,
date of incorporation (as "founded" year), market board. Every new company lists the NGX page as its source.
"""
import argparse, datetime, hashlib, json, pathlib, re, sys, unicodedata, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = 'https://doclib.ngxgroup.com/REST/api/issuers/companydirectory?$orderby=CompanyName'
PAGE = 'https://ngxgroup.com/exchange/data/company-directory/'
OUT = ROOT / 'data/listed-companies/ngx.json'
DIRECTORY = ROOT / 'data/companies.json'
# NGX sector -> Investedia sector (data/sector-taxonomy groups used by the directory). Unclear ones stay unmapped.
SECTOR = {'FINANCIAL SERVICES': 'Finance', 'CONSUMER GOODS': 'Consumer', 'CONSTRUCTION/REAL ESTATE': 'Real Estate', 'INDUSTRIAL GOODS': 'Industrials',
          'ICT': 'Technology', 'HEALTHCARE': 'Healthcare', 'OIL AND GAS': 'Energy', 'CONGLOMERATES': 'Industrials', 'AGRICULTURE': 'Consumer',
          'NATURAL RESOURCES': 'Materials', 'UTILITIES': 'Utilities'}
FORMS = r'(?<![-\w])(PLC|LIMITED|LTD|NIGERIA PLC|INC|CO)\b(?!-)\.?'  # not inside a hyphenated word (Co-operative)


def fetch():
    req = urllib.request.Request(SRC, headers={'User-Agent': 'InvestediaBuild/1.0 (site data build; contact via site)', 'Accept': 'application/json'})
    raw = urllib.request.urlopen(req, timeout=60).read()
    rows = json.loads(raw)
    keep = ['Symbol', 'CompanyName', 'InternationSecIN']  # facts only (owner, 19 Nov 2026)
    listings = sorted(({k: r.get(k) for k in keep} for r in rows if r.get('Symbol') and r.get('CompanyName')), key=lambda r: r['Symbol'])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'schema': 'investedia.listed-companies/v1', 'exchange': 'Nigerian Exchange (NGX)', 'mic': 'XNSA', 'country': 'Nigeria', 'cc': 'ng',
                               'source_url': SRC, 'page_url': PAGE, 'checked_at': datetime.date.today().isoformat(),
                               'source_sha256': hashlib.sha256(raw).hexdigest(), 'count': len(listings), 'listings': listings},
                              ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(len(listings), 'NGX listings saved')


def display(name):
    n = re.sub(FORMS, '', name, flags=re.I)
    n = re.sub(r'\s+', ' ', n).strip(' ,.-')
    # NGX names are in capitals: words of 3 letters or fewer stay as acronyms (MTN, ABC, UAC), longer ones get normal case
    small = {'AND', 'OF', 'THE', 'FOR', 'IN', 'ET', 'LE', 'LA', 'LES', 'DE', 'DU', 'DES', 'POUR', 'AU', 'AUX', 'EN'}  # joining words (English, French) are not acronyms
    while n.split() and n.split()[-1].upper() in small: n = n.rsplit(' ', 1)[0]  # a name cut off by the source ends on 'DU' / 'DE': drop it
    return ' '.join(w.lower() if w.upper() in small and i else w if not w.isupper() or (len(w) <= 3 and w.isalpha() and w not in small) else w.capitalize() for i, w in enumerate(n.split())) or name


def industry(raw):
    """NGX cuts sub-sector names at 30 characters ('Mortgage Carriers, Brokers an'): keep only whole words."""
    t = (raw or '').strip(' "')
    if len(t) >= 29: t = re.sub(r'[\s,]+\S*$', '', t).rstrip(' ,&')
    return t or None


def slugify(name):
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def key(name):
    return re.sub(r'[^a-z0-9]', '', slugify(re.sub(FORMS, '', name, flags=re.I)))


def add():
    src = json.loads(OUT.read_text(encoding='utf-8'))
    d = json.loads(DIRECTORY.read_text(encoding='utf-8'))
    have = {(key(c['name']), c['cc']) for c in d['companies']} | {(key(c.get('legal_name') or ''), c['cc']) for c in d['companies']}
    syms = {l['s'] for c in d['companies'] for l in c['listings']}
    slugs = {c['slug'] for c in d['companies']}
    added = 0
    for r in src['listings']:
        name, sym = display(r['CompanyName']), r['Symbol'].strip()
        if (key(r['CompanyName']), 'ng') in have or (key(name), 'ng') in have or f'{sym}.LG' in syms or f'EQ:XNSA:{sym}' in syms: continue
        slug = slugify(name) if slugify(name) not in slugs else f"{slugify(name)}-ng"
        slugs.add(slug)
        inc = (r.get('DateOfIncorporation') or '')[:4]
        web = (r.get('Website') or '').strip()
        d['companies'].append({
            'slug': slug, 'name': name, 'legal_name': r['CompanyName'].strip(), 'country': 'Nigeria', 'cc': 'ng', 'region': 'Africa',
            # facts only (owner, 19 Nov 2026): the NGX website terms restrict republishing, so no sector, website or dates from NGX
            'sector': None, 'industry': None, 'public': True, 'hq': None, 'website': None, 'description': None, 'founded': None, 'ngx_facts_only': True,
            'story': [], 'related': [], 'videos': [],
            'sources': [{'name': 'Company name, ticker and ISIN as published by the Nigerian Exchange (facts only)', 'url': src['page_url'], 'checked_at': src['checked_at']}],
            'logo': None,
            'listings': [{'s': f'NGX:{sym}', 'name': r['CompanyName'].strip(), 'exchange': 'Nigerian Exchange', 'cur': 'NGN', 'tracked': False,
                          'isin': r.get('InternationSecIN')}],
        })
        added += 1
    d['count'] = len(d['companies'])
    DIRECTORY.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(added, 'NGX companies added;', d['count'], 'in the directory')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--fetch', action='store_true'); a = ap.parse_args()
    fetch() if a.fetch else add()
