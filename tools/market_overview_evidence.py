"""Market Overview evidence: market relevance vs physical event location.

Two separate claims, never substituted for each other:
- market_relevance(article, code): is the article about this country's market?
  Supported only by explicit article text (country, demonym, its central bank /
  regulator / exchange named in the headline). A model-recorded country impact
  without text support is 'unverifiable'. Otherwise 'unsupported'.
- physical_location(article): did the event happen at the recorded place?
  Supported only when the original source text available to us (the headline;
  no article bodies are stored) names the recorded place or country.
  Headquarters, listing jurisdiction, dateline and robot-assigned coordinates
  are never evidence. Otherwise 'unverifiable' (no text) - never inferred.
Inputs are read-only; the original location and evidence are preserved.
"""
import json
import re
from pathlib import Path
_ISO = json.loads((Path(__file__).resolve().parents[1] / 'assets/globe/iso.json').read_text())

# Explicit names only. Extend by review, never by inference.
COUNTRY_TERMS = {
    'NG': ['Nigeria', 'Nigerian', 'CBN', 'Central Bank of Nigeria', 'NGX', 'Naira'],
    'US': ['US', 'U.S.', 'United States', 'American', 'Federal Reserve', 'Fed', 'SEC', 'Wall Street', 'Treasury', 'NYSE', 'Nasdaq'],
    'BR': ['Brazil', 'Brazilian', 'Banco Central do Brasil', 'B3', 'Ibovespa', 'Real'],
    'IN': ['India', 'Indian', 'RBI', 'Reserve Bank of India', 'SEBI', 'Sensex', 'Nifty', 'Rupee'],
    'AR': ['Argentina', 'Argentine', 'Argentinian', 'BCRA', 'Merval', 'Peso'],
    'PE': ['Peru', 'Peruvian', 'BCRP', 'Sol'],
    'GB': ['UK', 'U.K.', 'United Kingdom', 'Britain', 'British', 'Bank of England', 'BoE', 'FTSE', 'Sterling', 'London'],
    'MY': ['Malaysia', 'Malaysian', 'Bank Negara', 'Bursa Malaysia', 'Ringgit'],
}
# Ambiguous currency words count only with the country name present.
AMBIGUOUS = {'Real', 'Peso', 'Sol', 'Fed', 'Treasury', 'SEC'}

def _named(term, text):
    return re.search(r'(?<![\w.])' + re.escape(term) + r'(?![\w])', text) is not None

def market_relevance(article, code, country_name=None):
    head = article['headline']
    terms = COUNTRY_TERMS.get(code, []) + ([country_name] if country_name else [])
    hits = [t for t in terms if t and t not in AMBIGUOUS and _named(t, head)]
    if hits:
        return {'status': 'supported', 'basis': 'explicit article text', 'evidence': hits}
    if any(_named(t, head) for t in terms if t in AMBIGUOUS):
        return {'status': 'unverifiable', 'basis': 'ambiguous term only', 'evidence': [t for t in terms if t in AMBIGUOUS and _named(t, head)]}
    if any(i.get('kind') == 'country' and i.get('country') == code for i in article.get('impacts', [])):
        return {'status': 'unverifiable', 'basis': 'model-recorded country impact without text support', 'evidence': []}
    return {'status': 'unsupported', 'basis': 'no country association in article evidence', 'evidence': []}

def physical_location(article):
    loc = article.get('location') or {}
    head = article['headline']
    place, country = loc.get('place'), loc.get('country')
    if place and _named(place, head):
        return {'status': 'supported', 'granularity': 'place', 'basis': 'place named in source headline', 'evidence': [place], 'recorded': loc}
    code = _ISO.get(country)
    aliases = [country] + [t for t in COUNTRY_TERMS.get(code, []) if t not in AMBIGUOUS]
    named = [t for t in aliases if t and _named(t, head)]
    if named:
        country = named[0]
        return {'status': 'supported', 'granularity': 'country', 'basis': 'country named in source headline; exact place unverified', 'evidence': [country], 'recorded': loc}
    return {'status': 'unverifiable', 'basis': 'no source text names the recorded place; not inferred', 'evidence': [], 'recorded': loc}

# Owner decision 9 Nov 2026: the limited Market Overview preview is relevance-only.
# A headline naming a country shows what an article is about, not where an event
# physically happened, so no physical claim is accepted from headlines alone.
GEO_FEATURES_ENABLED = False

def geo_allowed(article, granularity='country'):
    """Physical markers / cross-border lines. Disabled until verified source-text
    location evidence exists (article bodies are not stored)."""
    if not GEO_FEATURES_ENABLED:
        return False
    r = physical_location(article)
    return r['status'] == 'supported' and (granularity == 'country' or r['granularity'] == 'place')
