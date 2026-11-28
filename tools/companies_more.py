"""Writes the extra company directory (owner, 25 Nov 2026: ~10K company pages, biggest first, every continent, every company in a sector).
Input: the reviewed 10K artifact (Wikidata facts, Wikipedia-sourced descriptions, head-office cities reconciled with Wikipedia).
Output (few files, Cloudflare's 20,000-file limit): data/companies-more.json (compact list for search, directory and globe)
and data/companies-more/<k>.json (full records by first letter). Pages open at company?c=<slug>.
Run: python3 tools/companies_more.py <companies-10k-final.json>"""
import json, os, re, sys, unicodedata, urllib.parse
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def slugify(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:70] or 'company'

def main(src):
    have = json.load(open(os.path.join(ROOT, 'data/companies.json')))['companies']
    used = {c['slug'] for c in have}; names = {c['name'].lower() for c in have}
    base = lambda t: (t or '').split('.')[0].split(':')[-1].upper()
    tick = {(base(l['s']), c.get('country')) for c in have for l in c['listings']}  # same ticker in the same country = same company (e.g. Banco do Brasil)
    rows, full = [], {}
    for x in sorted(json.load(open(src))['companies'], key=lambda x: (not x.get('ticker'), -(x.get('employees') or 0))):
        if x['name'].lower() in names or (x.get('ticker') and (base(x['ticker']), x.get('country')) in tick): continue
        s = slugify(x['name'])
        if s in used: s = f"{s}-{slugify(x.get('country') or '')[:12]}"
        if s in used: s = f"{s}-{x['qid'].lower()}"
        used.add(s)
        logo = ('https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(x['logo_file'].replace(' ', '_')) + '?width=128') if x.get('logo_file') else None
        city = x.get('hq_city')
        place = ', '.join(dict.fromkeys(v for v in [city, x.get('country')] if v))
        lat, lon = x.get('lat'), x.get('lon')
        r = {'slug': s, 'name': x['name'], 'country': x.get('country'), 'region': x.get('continent'), 'sector': x.get('sector'), 'city': city,
             'tk': x.get('ticker'), 'logo': logo, 'lat': round(lat, 4) if isinstance(lat, (int, float)) else None, 'lon': round(lon, 4) if isinstance(lon, (int, float)) else None,
             'emp': x.get('employees')}
        rows.append(r)
        src_list = [{'name': 'Wikipedia', 'url': u} if 'wikipedia' in u else {'name': 'Wikidata', 'url': u} for u in x.get('sources') or []]
        web = x.get('website'); 
        if web: u = urllib.parse.urlsplit(web); web = f'{u.scheme}://{u.netloc}' if u.netloc else None
        fy = x.get('founded'); m = re.search(r'\b(?:founded|established|formed|created)\D{0,25}(\d{4})', x.get('description') or '', re.I)
        if fy and m and m.group(1) != fy: fy = None  # Wikidata and Wikipedia disagree: show only the year in the description
        k = s[0] if s[0].isalpha() else '_'
        full.setdefault(k, {})[s] = {'slug': s, 'name': x['name'], 'legal_name': x['name'], 'country': x.get('country'), 'cc': None, 'region': x.get('continent'),
            'sector': x.get('sector'), 'industry': (x.get('industry') or '')[:1].upper() + (x.get('industry') or '')[1:] or None, 'public': bool(x.get('ticker') or x.get('listed')),
            'hq': place or None, 'city': city, 'lat': r['lat'], 'lon': r['lon'], 'website': web, 'description': x.get('description'), 'founded': fy,
            'story': [], 'related': [], 'videos': [], 'sources': src_list, 'logo': logo, 'employees': x.get('employees'),
            'listings': [{'s': x['ticker'], 'name': x['name'], 'exchange': x.get('exchange') or '', 'cur': None, 'tracked': False}] if x.get('ticker') else []}
    for d in ('data', 'docs/data'):
        os.makedirs(os.path.join(ROOT, d, 'companies-more'), exist_ok=True)
        json.dump({'about': 'Extra company directory from Wikidata (CC0) with Wikipedia-sourced descriptions. Not investment advice.', 'count': len(rows), 'companies': rows},
                  open(os.path.join(ROOT, d, 'companies-more.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
        for k, v in full.items(): json.dump(v, open(os.path.join(ROOT, d, 'companies-more', k + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(rows), 'companies,', len(full), 'detail files')

if __name__ == '__main__':
    main(sys.argv[1])
