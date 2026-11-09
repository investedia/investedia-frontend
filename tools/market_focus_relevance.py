"""Review-only Market Focus relevance scoring. No history or price inputs.

Not connected to the preview or robots until independent review and integration.
"""
import re

def named(name, text):
    return bool(name and re.search(r'(?<!\w)'+re.escape(name)+r'(?!\w)', text, re.I))

def country_rank(article, country_name, country_code):
    direct = named(country_name, article['headline']) or any(
        i.get('kind') == 'country' and i.get('country') == country_code and
        named(i.get('name'), country_name) for i in article.get('impacts', []))
    policy = article.get('event_type') in ('policy','rates','regulation','monetary-policy') or bool(re.search(
        r'\b(policy rate|interest rates?|capital requirements?|regulation|regulator)\b', article['headline'], re.I))
    score = article.get('importance', 1) + int(direct) + 0.5*policy
    # Spec: regional-only articles below directly relevant country articles.
    return (int(direct), score, article['published_at'], article['id'])

def company_relevance(article, registry):
    """Verified listing identity is distinct from proof of an economic effect.

    Collapse multiple mentions of one issuer; unresolved names never gain a rank.
    This function reports relevance only, never recommends or draws connections.
    """
    result = {}
    for impact in article.get('impacts', []):
        if impact.get('kind') not in ('company','etf') or not impact.get('name'): continue
        resolved=registry.resolve(impact['name'],impact.get('ticker'),impact['kind'],impact.get('country'))
        aid=resolved.get('id')
        if not aid or aid not in registry.assets: continue
        asset=registry.assets[aid]
        if asset.get('class') not in ('equity','fund'): continue
        if impact.get('country') and asset.get('country') != impact['country']: continue
        # Exact display/official/explicit alias mention only: never sector inference.
        names=[asset['name'],asset.get('official','')]+asset.get('names',[])
        in_headline=any(named(n,article['headline']) for n in names)
        key=asset.get('company') or aid
        row={'company_id':key,'registry_id':aid,'article_id':article['id'],
             'headline_mention':in_headline,'score':article.get('importance',1)+int(in_headline),
             'basis':'verified identity in recorded company impact; headline bonus only for exact named issuer'}
        if key not in result or (row['score'],aid)>(result[key]['score'],result[key]['registry_id']):result[key]=row
    return sorted(result.values(),key=lambda r:(-r['score'],r['company_id']))

# Corporate-event significance (Market Overview). Editorial weights, reviewed
# by the owner before production use. Only recorded event types and verified
# registry identities count; no price, return or sector inference.
CORPORATE_EVENT_WEIGHT = {
    'm&a': 1.0,        # change of control or major combination
    'earnings': 0.75,  # reported results
    'guidance': 0.75,  # forward outlook changes
    'capital': 0.5,    # issuance, buybacks, IPOs, debt raises
    'management': 0.25,
    'product': 0.25,
}

def corporate_significance(article, registry=None):
    """Return (score, reasons) for a corporate event; 0 for non-corporate events.

    Score = event-type weight + 0.5 when a verified listed issuer is named in the
    headline + 0.25 when the source flagged the event as market-moving.
    """
    weight = CORPORATE_EVENT_WEIGHT.get(article.get('event_type'))
    if weight is None:
        return 0.0, []
    reasons = ['event:' + article['event_type']]
    score = weight
    if registry is not None and any(r['headline_mention'] for r in company_relevance(article, registry)):
        score += 0.5; reasons.append('verified issuer named in headline')
    if article.get('market_moving'):
        score += 0.25; reasons.append('flagged market-moving by source pipeline')
    return score, reasons

def overview_rank(article, country_name, country_code, registry=None):
    """Market Overview sort key: direct relevance first, then country score
    plus corporate significance, then newest, then id (deterministic)."""
    direct, score, published, aid = country_rank(article, country_name, country_code)
    sig, _ = corporate_significance(article, registry)
    return (direct, score + sig, published, aid)
