"""Offline M1 preview projection. No network, robot edits, or price inputs.

Keep the last good output on failure. Production scheduling is intentionally
deferred: this milestone builds approved previews, not a production rollout.
"""
import json
import hashlib
import re
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from registry import Registry
from tools.market_focus_relevance import overview_rank, corporate_significance

GROUPS = ['Policy', 'Economic activity', 'Corporate', 'Energy & commodities', 'International impact']


def category(article, verified_events=None):
    event = article.get('event_type', '')
    if event in ('policy', 'rates', 'regulation', 'monetary-policy') or re.search(r'\b(capital rule|capital requirement|policy rate|interest rate|regulation|regulator)\b', article['headline'], re.I): return 'Policy'
    if event in ('macro-data', 'economic-data'): return 'Economic activity'
    if article.get('category') == 'commodities': return 'Energy & commodities'
    if article.get('category') == 'geopolitics': return 'International impact' if verified_events is None or article['id'] in verified_events else 'Policy'
    if article.get('category') in ('companies', 'technology') or event in ('earnings', 'm&a', 'capital', 'product', 'management'): return 'Corporate'
    return 'Economic activity'


def rank(article, name, code, classify=category, registry=None):
    """Market Overview order (spec §6 + corporate-event significance).

    `classify` is kept for call compatibility; policy weighting now comes from
    tools/market_focus_relevance.country_rank."""
    return overview_rank(article, name, code, registry)


def reserve_corporate_slot(articles, group_for, registry=None, slots=4):
    """Option A (owner, 8 Nov): the first `slots` items (Most significant +
    Also developing) keep one place for the highest-scoring corporate event."""
    top = articles[:slots]
    if len(articles) <= slots or any(group_for(a) == 'Corporate' for a in top): return articles
    corp = [a for a in articles[slots:] if group_for(a) == 'Corporate' and corporate_significance(a, registry)[0] > 0]
    if not corp: return articles
    best = max(corp, key=lambda a: (corporate_significance(a, registry)[0], a['published_at']))
    rest = [a for a in articles if a is not best]
    return rest[:slots - 1] + [best] + rest[slots - 1:]


def project(news, exchanges, connections, registry, iso):
    countries = {}
    by_code = {v: k for k, v in iso.items()}
    article_ids = {a['id'] for a in news['stories']}
    verified_events = {c['event'] for c in connections['connections'] if c.get('cross_border') and c.get('event') in article_ids}
    group_for = lambda a: category(a, verified_events)
    for code, name in sorted(by_code.items()):
        articles = [a for a in news['stories'] if iso.get(a['location']['country']) == code]
        articles.sort(key=lambda a: rank(a, name, code, group_for, registry), reverse=True)
        articles = reserve_corporate_slot(articles, group_for, registry)
        # Two per group plus the leading items, within the 60-item schema cap.
        keep = {a['id'] for a in articles[:4]}
        for group in GROUPS: keep.update(a['id'] for a in [a for a in articles if group_for(a) == group][:2])
        selected = [a for a in articles if a['id'] in keep]
        developments = []
        for a in selected:
            impacts = a.get('impacts', [])
            why = next((i['why'] for i in impacts if i.get('why') and i.get('country') == code), next((i['why'] for i in impacts if i.get('why')), 'No analysis in the source data yet.'))
            developments.append({k: a[k] for k in ('id', 'headline', 'event_type', 'importance', 'published_at', 'source') if k in a} | {'category': group_for(a), 'why': why})
        companies, sectors = {}, Counter()
        for a in articles:
            seen, sector_seen = set(), set()
            for impact in a.get('impacts', []):
                if impact.get('kind') == 'sector' and impact.get('name'): sector_seen.add(impact['name'])
                if impact.get('kind') not in ('company', 'etf') or not impact.get('name'): continue
                name_key = impact['name'].casefold()
                if name_key in seen: continue
                seen.add(name_key)
                resolved = registry.resolve(impact['name'], impact.get('ticker'), impact['kind'], impact.get('country')).get('id')
                asset = registry.assets.get(resolved, {})
                if asset.get('class') not in ('equity', 'etf'): resolved, asset = None, {}
                company = companies.setdefault(name_key, {'name': impact['name'], 'registry_id': resolved,
                    'ticker': asset.get('ticker') or (resolved.split(':')[-1] if resolved else None),
                    'mic': asset.get('mic'), 'site': asset.get('site'), 'article_ids': [], 'count': 0, 'latest_published_at': a['published_at'],
                    'evidence': {'article_id': a['id'], 'headline': a['headline'], 'source': a['source'], 'published_at': a['published_at'], 'why': impact.get('why', ''), 'category': category(a)}})
                company['article_ids'].append(a['id']); company['count'] += 1
                company['latest_published_at'] = max(company['latest_published_at'], a['published_at'])
            sectors.update(sector_seen)
        investments = sorted(companies.values(), key=lambda c: (-c['count'], -datetime.fromisoformat(c['latest_published_at'].replace('Z', '+00:00')).timestamp(), c['name']))
        # Keep all company mentions. Evidence references the original article
        # already loaded by the preview, rather than duplicating headlines/URLs.
        for item in investments:
            item['evidence_article_id'] = item.pop('evidence')['article_id']
        label_counts = Counter(group_for(a) for a in articles if a.get('importance', 1) >= 2)
        venues = [mic for mic, e in exchanges.items() if e['country'] == code]
        primary = next((mic for mic in venues if exchanges[mic].get('benchmark_name')), venues[0] if venues else None)
        links = [c['id'] for c in connections['connections'] if c.get('event') in article_ids and c.get('cross_border') and code in (c['origin']['country'], c['dest']['country'])]
        countries[code] = {'name': name, 'region': next((a['location'].get('region') for a in articles), None),
            'exchange': primary, 'labels': [('International' if g == 'International impact' else g) for g, n in label_counts.most_common() if n >= 2],
            'significant': {'article_id': developments[0]['id']} if developments else None,
            'developments': developments, 'group_counts': dict(Counter(group_for(a) for a in articles)),
            'sectors': [{'name': n, 'count': count} for n, count in sectors.most_common(12)],
            'investments': investments, 'connections': links,
            'counts': {'articles_48h': len(articles), 'important': sum(a.get('importance', 1) >= 2 for a in articles)}}
    return {'schema': 'investedia.market-focus/v1', 'status': 'ok', 'updated_at': news['updated_at'],
        'article_categories': {a['id']: group_for(a) for a in news['stories']},
        'scope': 'preview', 'countries': countries}


def build():
    read = lambda p: json.loads((ROOT / p).read_text())
    news, exchanges, connections = read('assets/globe/news-48h.json'), read('data/exchanges.json'), read('assets/globe/connections.json')
    country_facts = read('data/market-country-facts.json')
    output = project(news, exchanges, connections, Registry(), read('assets/globe/iso.json'))
    for code, facts in country_facts.items():
        if code in output['countries']: output['countries'][code]['currency_facts'] = facts
    # The preview must not mix its projection with robot-mutated live files.
    # Keep only the reported fields needed by the preview; never the registry.
    articles = []
    for a in news['stories']:
        row = {k: a[k] for k in ('id', 'headline', 'published_at', 'source', 'importance', 'event_type') if k in a}
        row['location'] = {'country': a['location']['country']}
        row['impacts'] = [{k: i[k] for k in ('name', 'kind', 'why') if k in i}
                          for i in a.get('impacts', []) if i.get('kind') in ('company', 'etf')]
        articles.append(row)
    used = {lid for c in output['countries'].values() for lid in c['connections']}
    snapshot = {'schema': 'investedia.market-focus-source/v1', 'updated_at': news['updated_at'],
                'articles': articles, 'connections': [c for c in connections['connections'] if c['id'] in used],
                'exchanges': exchanges, 'country_facts': country_facts}
    snapshot['globe_focus'] = {'updated_at': output['updated_at'], 'countries': {
        code: {k: c[k] for k in ('name', 'exchange', 'labels', 'connections', 'counts')}
        for code, c in output['countries'].items()}}
    source = json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')) + '\n'
    name = 'market-focus-source-' + hashlib.sha256(source.encode()).hexdigest()[:12] + '.json'
    source_path = ROOT / 'assets/globe' / name
    if source_path.exists() and source_path.read_text() != source: raise ValueError('Snapshot hash collision')
    source_path.write_text(source)
    output['source_file'] = name
    content = json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n'
    if len(content.encode()) >= 300_000: raise ValueError('market-focus.json exceeds 300 KB')
    target = ROOT / 'assets/globe/market-focus.json'
    temp = target.with_suffix('.tmp')
    temp.write_text(content)
    temp.replace(target)
    print(f'Built preview market-focus.json: {len(content.encode())} bytes')


if __name__ == '__main__': build()
