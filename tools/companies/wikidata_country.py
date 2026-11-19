"""Notable companies per country from Wikidata (CC0), listed or not (owner, 19 Nov 2026).

Why Wikidata: it is free to reuse for any purpose (CC0). Several stock exchanges' website terms forbid commercial
reuse of their lists (e.g. Malawi), so Wikidata and GLEIF are the main sources; exchange lists are only used where
their terms allow it.

"Notable" = a company item (business, company, public company, state-owned enterprise, bank, ...) located in the
country that has at least one Wikipedia article. That keeps out shell companies and empty items.

For each company it saves only facts: Wikidata id, English label, type, headquarters city and its coordinates,
official website, logo file name, founding year, ISIN, stock exchange + ticker, industry, LEI, English Wikipedia title.
No descriptions or text are copied.

  python3 tools/companies/wikidata_country.py KE NG ZA     # countries by ISO code
  python3 tools/companies/wikidata_country.py --africa      # every African country
Writes data/company-sources/wikidata/<cc>.json.
"""
import argparse, datetime, json, pathlib, sys, time, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'data/company-sources/wikidata'
EP = 'https://query.wikidata.org/sparql'
UA = 'InvestediaBuild/1.0 (company directory build; uses Wikidata CC0 data)'
TYPES = 'wd:Q4830453 wd:Q783794 wd:Q891723 wd:Q270791 wd:Q6881511 wd:Q22687 wd:Q1631129 wd:Q2085381 wd:Q161726 wd:Q431289'
AFRICA = ('DZ AO BJ BW BF BI CV CM CF TD KM CD CG CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW').split()

Q = """SELECT ?co ?coLabel ?type ?hqLabel ?hqc ?web ?logo ?inc ?isin ?exLabel ?tick ?indLabel ?lei ?wp WHERE {
  ?c wdt:P297 "%s" .
  VALUES ?type { %s }
  ?co wdt:P31 ?type ; wdt:P17 ?c .
  ?wpa schema:about ?co ; schema:isPartOf ?w . ?w wikibase:wikiGroup "wikipedia" .
  FILTER NOT EXISTS { ?co wdt:P576 ?dissolved }
  OPTIONAL { ?co wdt:P159 ?hq . OPTIONAL { ?hq wdt:P625 ?hqc } }
  OPTIONAL { ?co wdt:P856 ?web }
  OPTIONAL { ?co wdt:P154 ?logo }
  OPTIONAL { ?co wdt:P571 ?inc }
  OPTIONAL { ?co wdt:P946 ?isin }
  OPTIONAL { ?co p:P414 ?st . ?st ps:P414 ?ex . OPTIONAL { ?st pq:P249 ?tick } }
  OPTIONAL { ?co wdt:P452 ?ind }
  OPTIONAL { ?co wdt:P1278 ?lei }
  OPTIONAL { ?wp schema:about ?co ; schema:isPartOf <https://en.wikipedia.org/> }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,ar,pt". }
}"""


def run(q, tries=4):
    url = EP + '?' + urllib.parse.urlencode({'query': q, 'format': 'json'})
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/sparql-results+json'}), timeout=120) as r:
                return json.load(r)['results']['bindings']
        except Exception as e:
            if i == tries - 1: raise
            time.sleep(70 * (i + 1))  # the query service may allow only 1 request a minute


def country(cc):
    rows = run(Q % (cc, TYPES)); by = {}
    v = lambda r, k: r.get(k, {}).get('value')
    for r in rows:
        qid = v(r, 'co').rsplit('/', 1)[1]; c = by.setdefault(qid, {'qid': qid, 'name': v(r, 'coLabel'), 'cc': cc.lower(), 'types': set(),
                                                                   'listings': set(), 'industries': set(), 'isin': set()})
        if c['name'] == qid: c['name'] = None  # no label in our languages: not usable
        c['types'].add(v(r, 'type').rsplit('/', 1)[1])
        if v(r, 'hqLabel') and not c.get('hq_city'): c['hq_city'] = v(r, 'hqLabel')
        if v(r, 'hqc') and not c.get('hq'):
            lo, la = v(r, 'hqc').replace('Point(', '').rstrip(')').split(); c['hq'] = [round(float(la), 5), round(float(lo), 5)]
        for k, f in (('web', 'website'), ('lei', 'lei'), ('wp', 'enwiki')):
            if v(r, k) and not c.get(f): c[f] = v(r, k)
        if v(r, 'logo') and not c.get('logo_file'): c['logo_file'] = urllib.parse.unquote(v(r, 'logo').rsplit('/', 1)[1])
        if v(r, 'inc') and not c.get('founded'):
            y = v(r, 'inc')[:5].lstrip('+'); c['founded'] = int(y) if y.lstrip('-').isdigit() and 1500 < int(y) <= datetime.date.today().year else None
        if v(r, 'isin'): c['isin'].add(v(r, 'isin'))
        if v(r, 'exLabel'): c['listings'].add((v(r, 'exLabel'), v(r, 'tick') or ''))
        if v(r, 'indLabel') and not v(r, 'indLabel').startswith('Q'): c['industries'].add(v(r, 'indLabel'))
    out = []
    for c in by.values():
        if not c['name']: continue
        c['types'] = sorted(c['types']); c['isin'] = sorted(c['isin']); c['industries'] = sorted(c['industries'])
        c['listings'] = [{'exchange': e, 'ticker': t or None} for e, t in sorted(c['listings'])]
        c['listed'] = bool(c['listings'] or c['isin'] or 'Q891723' in c['types'])
        out.append(c)
    out.sort(key=lambda c: c['name'].lower())
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{cc.lower()}.json').write_text(json.dumps({'schema': 'investedia.company-source/v1', 'source': 'Wikidata', 'licence': 'CC0 1.0',
        'source_url': 'https://www.wikidata.org/', 'checked_at': datetime.date.today().isoformat(), 'country': cc, 'count': len(out),
        'companies': out}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return len(out), sum(c['listed'] for c in out)


def main(argv=None):
    ap = argparse.ArgumentParser(); ap.add_argument('cc', nargs='*'); ap.add_argument('--africa', action='store_true')
    a = ap.parse_args(argv); ccs = AFRICA if a.africa else [x.upper() for x in a.cc]
    tot = 0
    for cc in ccs:
        try: n, l = country(cc); tot += n; print(f'{cc}: {n} companies ({l} listed)', flush=True)
        except Exception as e: print(f'{cc}: failed ({e})', flush=True)
        time.sleep(65)  # stay under the 1 request a minute limit during Wikidata outages
    print('total', tot)


if __name__ == '__main__':
    sys.exit(main())
