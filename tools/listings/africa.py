"""NOTE 19 Nov 2026: only Kenya is used now; Ghana, BRVM and Nigeria were taken off the site (their terms forbid reuse).

Listed companies from official African exchange lists (owner, 17 Nov 2026): Kenya (NSE), Ghana (GSE), BRVM.
Nigeria (NGX) has its own tool, tools/listings/ngx.py; this one shares its directory logic.

  python3 tools/listings/africa.py --fetch   download each list to data/listed-companies/<exchange>.json (URL, date, SHA-256)
  python3 tools/listings/africa.py           add companies not yet in data/companies.json

What each source gives:
  Kenya NSE   name, trading symbol, ISIN. The ISIN's first two letters are the issuer's country, so companies listed in
              Nairobi but based elsewhere (e.g. BK Group, Rwanda) get their own country. Funds (ETF, REIT) are left out.
  Ghana GSE   symbol, name. Cross-listings of companies based abroad are left out (CROSS_LISTED), as are funds and
              preference shares; the bond-issuer table on the same page is ignored.
  BRVM        symbol, name with the country at the end (8 WAEMU countries).
Companies already in the directory are never changed; new ones get an untracked listing and the exchange as source.
"""
import argparse, datetime, hashlib, html, json, pathlib, re, sys, urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from ngx import display, slugify, key  # same name cleaning as Nigeria

ROOT = pathlib.Path(__file__).resolve().parents[2]
DIRECTORY = ROOT / 'data/companies.json'
UA = 'Mozilla/5.0 (compatible; InvestediaBuild/1.0; site data build)'
COUNTRY = {'KE': ('Kenya', 'ke'), 'RW': ('Rwanda', 'rw'), 'UG': ('Uganda', 'ug'), 'TZ': ('Tanzania', 'tz'), 'GH': ('Ghana', 'gh'),
           "COTE D'IVOIRE": ("Côte d'Ivoire", 'ci'), 'SENEGAL': ('Senegal', 'sn'), 'BURKINA FASO': ('Burkina Faso', 'bf'), 'BENIN': ('Benin', 'bj'),
           'MALI': ('Mali', 'ml'), 'NIGER': ('Niger', 'ne'), 'TOGO': ('Togo', 'tg'), 'GUINEE-BISSAU': ('Guinea-Bissau', 'gw')}
CROSS_LISTED = {'AGA': 'AngloGold Ashanti (HQ outside Ghana)', 'ASG': 'Asante Gold (Canada)', 'ETI': 'Ecobank Transnational (Togo)',
                'TBL': 'Trust Bank (The Gambia)', 'TLW': 'Tullow Oil (United Kingdom)', 'ALLGH': 'Atlantic Lithium (Australia)',
                'GLD': 'NewGold (a gold fund)', 'SCB-PREF': 'preference share of Standard Chartered Bank Ghana'}
NSE_HOME = {'BKG': 'RW'}  # cross-listed in Nairobi with a Kenyan ISIN, based abroad: BK Group = Bank of Kigali, Rwanda
FUND = re.compile(r'\b(ETF|REIT|I-REIT|Fund|Feeder|Trust)\b', re.I)
SOURCES = {
    'nse-ke': {'exchange': 'Nairobi Securities Exchange', 'short': 'NSE', 'cur': 'KES', 'url': 'https://www.nse.co.ke/listed-companies/'},
    # Ghana (GSE) and BRVM removed 19 Nov 2026 (owner): their website terms forbid reusing the list without written consent.
}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()


def cells(t):
    return [[html.unescape(re.sub('<[^>]+>', '', c)).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.S)]
            for r in re.findall(r'<tr[^>]*>(.*?)</tr>', t, re.S)]


def parse_ke(t):
    txt = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' | ', re.sub(r'<script.*?</script>|<style.*?</style>', '', t, flags=re.S))))
    out = []
    for name, sym, isin in re.findall(r'\|\s*([^|]{3,90}?)\s*(?:\|\s*)+Trading Symbol:\s*([A-Z0-9.&-]+)\s*(?:\|\s*)+ISIN CODE:\s*([A-Z]{2}[A-Z0-9]{10})', txt):
        name = re.sub(r'\s+(Ord\.?|0rd)\b.*$', '', name, flags=re.I).strip()  # drop the share description ('Ord 5.00 AIMS')
        if FUND.search(name): continue
        out.append({'symbol': sym, 'name': name, 'isin': isin, 'country_key': NSE_HOME.get(sym, isin[:2])})
    return out


def parse_gh(t):
    out = []
    for r in cells(t):
        if len(r) < 3 or not r[0].isdigit() or not re.fullmatch(r'[A-Z][A-Z0-9-]*', r[1]): continue  # listed shares only, not the bond-issuer table
        if r[1] in CROSS_LISTED: continue
        out.append({'symbol': r[1], 'name': r[2], 'listed': r[3] if len(r) > 3 else None, 'country_key': 'GH'})
    return out


def parse_brvm(t):
    rows = cells(t); out = []
    start = next(i for i, r in enumerate(rows) if r[:2] == ['Symbol', 'Name'])
    for r in rows[start + 1:]:
        if len(r) < 7: continue
        name = r[1].replace('’', "'")
        m = re.search(r"\s*\b(COTE D'IVOIRE|SENEGAL|BURKINA FASO|BENIN|MALI|NIGER|TOGO|GUINEE-BISSAU)\s*$", name.upper())
        if not m: continue  # no country stated: not guessed
        # The name keeps its country: BRVM lists Bank of Africa six times (Benin, Mali...), and 'Unilever Cote d'Ivoire' is not Unilever plc
        out.append({'symbol': r[0], 'name': name, 'country_key': m.group(1)})
    return out


PARSE = {'nse-ke': parse_ke, 'gse-gh': parse_gh, 'brvm': parse_brvm}


def fetch():
    for k, s in SOURCES.items():
        raw = get(s['url']); rows = PARSE[k](raw.decode('utf-8', 'ignore'))
        out = ROOT / f'data/listed-companies/{k}.json'; out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps({'schema': 'investedia.listed-companies/v1', 'exchange': s['exchange'], 'source_url': s['url'],
                                   'checked_at': datetime.date.today().isoformat(), 'source_sha256': hashlib.sha256(raw).hexdigest(),
                                   'count': len(rows), 'listings': rows}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(k, len(rows), 'listings saved')


def add():
    d = json.loads(DIRECTORY.read_text(encoding='utf-8'))
    have = {(key(c['name']), c['cc']) for c in d['companies']} | {(key(c.get('legal_name') or ''), c['cc']) for c in d['companies']}
    syms = {l['s'] for c in d['companies'] for l in c['listings']}
    slugs = {c['slug'] for c in d['companies']}
    names_anywhere = {key(c['name']) for c in d['companies']}
    for k, s in SOURCES.items():
        src = json.loads((ROOT / f'data/listed-companies/{k}.json').read_text(encoding='utf-8')); n = 0
        for r in src['listings']:
            if r['country_key'] not in COUNTRY: continue
            country, cc = COUNTRY[r['country_key']]
            name, lid = display(r['name']), f"{s['short']}:{r['symbol']}"
            if key(name) in names_anywhere and r.get('full_name'):  # 'Societe Generale' here is the local bank: keep its country in the name
                name = display(r['full_name'])
            name = re.sub(r"\bCote D'ivoire\b", "Côte d'Ivoire", name, flags=re.I)
            if lid in syms or (key(r['name']), cc) in have or (key(name), cc) in have: continue
            slug = slugify(name) if slugify(name) not in slugs else f'{slugify(name)}-{cc}'
            slugs.add(slug); syms.add(lid); have.add((key(name), cc))
            listing = {'s': lid, 'name': r['name'], 'exchange': s['exchange'], 'cur': s['cur'], 'tracked': False}
            if r.get('isin'): listing['isin'] = r['isin']
            d['companies'].append({'slug': slug, 'name': name, 'legal_name': r['name'], 'country': country, 'cc': cc, 'region': 'Africa',
                                   'sector': None, 'industry': None, 'public': True, 'hq': None, 'website': None, 'description': None, 'founded': None,
                                   'story': [], 'related': [], 'videos': [],
                                   'sources': [{'name': s['exchange'] + ' listed companies', 'url': src['source_url'], 'checked_at': src['checked_at']}],
                                   'logo': None, 'listings': [listing]})
            n += 1
        print(k, n, 'companies added')
    d['count'] = len(d['companies'])
    DIRECTORY.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(d['count'], 'in the directory')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--fetch', action='store_true'); a = ap.parse_args()
    fetch() if a.fetch else add()
