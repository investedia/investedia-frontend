"""Listed companies from the Philippine Stock Exchange's official company directory (owner, 18 Nov 2026: "more companies").

  python3 tools/listings/pse.py --fetch   download the directory (edge.pse.com.ph, all pages) to data/listed-companies/pse-ph.json
  python3 tools/listings/pse.py           add companies not yet in data/companies.json

The directory gives company name, stock symbol, sector, subsector and listing date. ETFs are left out. Sectors are
mapped to the directory's own sector names from PSE's subsector (Banks -> Finance, Food, Beverage & Tobacco ->
Consumer...); where PSE's sector says nothing about the business (Holding Firms, SME Board, Other Services) the sector
stays empty and PSE's subsector is kept as the industry. Companies already in the directory are never changed; new
ones get an untracked listing "PSE:SYMBOL" (kept by the backend directory build) and PSE as their source.
"""
import argparse, datetime, hashlib, html, json, pathlib, re, sys, time, urllib.request
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from ngx import slugify, key

def display(name):  # PSE names are already correctly cased (ABS-CBN, SM Investments): only drop the legal suffix
    n = re.sub(r',?\s+(Inc\.?|Incorporated|Corp\.?)$', '', name.strip()).strip()
    if n.isupper() and ' ' in n: n = ' '.join(w if len(w) <= 4 else w.capitalize() for w in n.split())  # 'ACEN CORPORATION' -> 'ACEN Corporation'
    return n

ROOT = pathlib.Path(__file__).resolve().parents[2]
DIRECTORY = ROOT / 'data/companies.json'; OUT = ROOT / 'data/listed-companies/pse-ph.json'
UA = 'Mozilla/5.0 (compatible; InvestediaBuild/1.0; site data build)'
URL = 'https://edge.pse.com.ph/companyDirectory/search.ax?pageNo={}&companyId=&keyword=&sortType=&dateSortType=DESC&cmpySortType=ASC&symbolSortType=ASC&sector=ALL&subsector=ALL'
PUBLIC = 'https://edge.pse.com.ph/companyDirectory/form.do'
SUB = {'banks': 'Finance', 'other financial institutions': 'Finance', 'property': 'Real Estate', 'food beverage tobacco': 'Consumer',
       'electricity energy power water': 'Utilities', 'mining': 'Materials', 'oil': 'Energy', 'retail': 'Consumer', 'transportation services': 'Industrials',
       'information technology': 'Technology', 'casinos gaming': 'Consumer', 'construction infra allied services': 'Industrials',
       'construction infrastructure allied services': 'Industrials', 'media': 'Communication', 'hotel leisure': 'Consumer',
       'electrical components equipment': 'Industrials', 'education': 'Consumer', 'chemicals': 'Materials', 'telecommunications': 'Communication',
       'other industrials': 'Industrials'}

def norm(s): return ' '.join(re.sub(r'[^a-z ]', ' ', s.lower().replace('&', ' ')).split())

def fetch():
    rows, shas = [], []
    for p in range(1, 30):
        b = urllib.request.urlopen(urllib.request.Request(URL.format(p), headers={'User-Agent': UA}), timeout=60).read(); shas.append(hashlib.sha256(b).hexdigest())
        R = [[html.unescape(re.sub('<[^>]+>', '', c)).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>', r, re.S)] for r in re.findall(r'<tr[^>]*>(.*?)</tr>', b.decode('utf-8', 'replace'), re.S)]
        R = [r for r in R if len(r) >= 5 and r[1]]
        if not R: break
        rows += R; time.sleep(2)
    out = [{'symbol': r[1], 'name': r[0], 'sector': r[2].title(), 'subsector': r[3], 'listed': r[4]} for r in rows if r[2].upper() != 'ETF']
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'schema': 'investedia.listed-companies/v1', 'exchange': 'Philippine Stock Exchange', 'source_url': PUBLIC,
                               'checked_at': datetime.date.today().isoformat(), 'source_sha256': hashlib.sha256(''.join(shas).encode()).hexdigest(),
                               'pages': len(shas), 'count': len(out), 'listings': out}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(len(out), 'PSE listings saved')

def add():
    d = json.loads(DIRECTORY.read_text(encoding='utf-8')); src = json.loads(OUT.read_text(encoding='utf-8'))
    have = {(key(c['name']), c['cc']) for c in d['companies']} | {(key(c.get('legal_name') or ''), c['cc']) for c in d['companies']}
    syms = {l['s'] for c in d['companies'] for l in c['listings']}; slugs = {c['slug'] for c in d['companies']}; n = 0
    for r in src['listings']:
        name, lid = display(r['name']), f"PSE:{r['symbol']}"
        if lid in syms or (key(r['name']), 'ph') in have or (key(name), 'ph') in have: continue
        slug = slugify(name) if slugify(name) not in slugs else f'{slugify(name)}-ph'
        slugs.add(slug); syms.add(lid); have.add((key(name), 'ph'))
        d['companies'].append({'slug': slug, 'name': name, 'legal_name': r['name'], 'country': 'Philippines', 'cc': 'ph', 'region': 'Asia',
                               'sector': SUB.get(norm(r['subsector'])), 'industry': r['subsector'], 'public': True, 'hq': None, 'website': None, 'description': None,
                               'founded': None, 'story': [], 'related': [], 'videos': [],
                               'sources': [{'name': 'Philippine Stock Exchange company directory', 'url': src['source_url'], 'checked_at': src['checked_at']}],
                               'logo': None, 'listings': [{'s': lid, 'name': r['name'], 'exchange': 'Philippine Stock Exchange', 'cur': 'PHP', 'tracked': False}]})
        n += 1
    d['count'] = len(d['companies'])
    DIRECTORY.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(n, 'companies added;', d['count'], 'in the directory')

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--fetch', action='store_true'); a = ap.parse_args()
    fetch() if a.fetch else add()
