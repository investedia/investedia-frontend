"""Sector, industry and a short description for companies, written by Claude Haiku 5.5 (owner, 19 Nov 2026).

Runs as an overnight Message Batch (half price). No web search: Haiku only sees facts we already hold (name, country,
exchange, the exchange's or Wikidata's industry words, founding year, head-office city, website domain), so it cannot
invent facts it was not given. The description is written in our own words; nothing is copied from anywhere.

  python3 tools/companies/haiku_enrich.py submit [--limit 50] [--only-missing]   # sends a batch, saves its id
  python3 tools/companies/haiku_enrich.py collect                                 # waits for it, writes results

Results go into data/companies.json as:
  sector       one of the 11 sectors in data/sector-taxonomy.json, or null when Haiku is not confident
  industry     a short plain label ("Banks", "Mobile networks"), or null
  description  1-2 neutral sentences: what the company does and where. No opinions, forecasts, ratings or advice.
  ai           {"model", "batch", "date", "confidence"}: so every AI-written field is marked as such on the site.
Only companies whose sector/description are empty are changed; nothing a person wrote is overwritten.
Needs ANTHROPIC_API_KEY (GitHub secret). Cost check: a few hundredths of a cent per company.
"""
import argparse, datetime, json, pathlib, sys, time, urllib.parse

import anthropic
from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request

ROOT = pathlib.Path(__file__).resolve().parents[2]
DIRECTORY = ROOT / 'data/companies.json'
STATE = ROOT / 'data/company-sources/haiku-batch.json'
MODEL = 'claude-haiku-5-5'
SECTORS = json.loads((ROOT / 'data/sector-taxonomy.json').read_text(encoding='utf-8'))['sectors']

SYSTEM = f"""You classify companies for a financial news website and write a short neutral description.
Use ONLY the facts given. Do not add facts you were not given (no revenue, size, rankings, products, owners or dates beyond the input).
sector: exactly one of {SECTORS}, or null if the facts are not enough to be confident.
industry: a short plain label of 1-3 words (e.g. "Banks", "Mobile networks", "Cement", "Oil and gas"), or null.
description: one or two plain sentences, at most 40 words, saying what kind of business it is and where it is based, built only from the facts.
Never give opinions, forecasts, ratings, praise or investment advice. If the facts say almost nothing, set description to null.
confidence: "high", "medium" or "low"."""

SCHEMA = {'type': 'object', 'additionalProperties': False, 'required': ['sector', 'industry', 'description', 'confidence'],
          'properties': {'sector': {'anyOf': [{'type': 'string', 'enum': SECTORS}, {'type': 'null'}]},
                         'industry': {'anyOf': [{'type': 'string'}, {'type': 'null'}]},
                         'description': {'anyOf': [{'type': 'string'}, {'type': 'null'}]},
                         'confidence': {'type': 'string', 'enum': ['high', 'medium', 'low']}}}


def facts(c):
    f = {'name': c['name'], 'country': c.get('country')}
    if c.get('legal_name') and c['legal_name'] != c['name']: f['legal_name'] = c['legal_name']
    if c.get('hq'): f['head_office'] = c['hq']
    ex = [l.get('exchange') for l in c.get('listings', []) if l.get('exchange')]
    f['stock_exchange'] = ex[0] if ex else ('not listed' if c.get('listed') is False else None)
    words = [w for w in [c.get('industry'), *(c.get('wikidata_industries') or [])] if w]
    if words: f['industry_words_from_source'] = words[:4]
    if c.get('sector'): f['existing_sector_hint'] = c['sector']
    if c.get('founded'): f['founded'] = c['founded']
    if c.get('website'): f['website_domain'] = urllib.parse.urlparse(c['website']).netloc
    return {k: v for k, v in f.items() if v}


def todo(d, only_missing):
    return [c for c in d['companies'] if not c.get('description') and (not only_missing or not c.get('ai'))]


def submit(limit, only_missing):
    d = json.loads(DIRECTORY.read_text(encoding='utf-8')); L = todo(d, only_missing)[:limit]
    if not L: print('nothing to do'); return
    client = anthropic.Anthropic()
    reqs = [Request(custom_id=c['slug'][:64], params=MessageCreateParamsNonStreaming(
        model=MODEL, max_tokens=400, system=SYSTEM, output_config={'effort': 'low', 'format': {'type': 'json_schema', 'schema': SCHEMA}},
        messages=[{'role': 'user', 'content': json.dumps(facts(c), ensure_ascii=False)}])) for c in L]
    ids = []
    for i in range(0, len(reqs), 10000):
        b = client.messages.batches.create(requests=reqs[i:i + 10000]); ids.append(b.id); print('batch', b.id, len(reqs[i:i + 10000]), 'companies')
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps({'batches': ids, 'submitted': datetime.date.today().isoformat(), 'count': len(reqs)}, indent=1) + '\n')


def collect():
    st = json.loads(STATE.read_text()); client = anthropic.Anthropic(); out = {}; usage = [0, 0]
    for bid in st['batches']:
        while True:
            b = client.messages.batches.retrieve(bid)
            if b.processing_status == 'ended': break
            print(bid, b.processing_status, b.request_counts.processing, 'left', flush=True); time.sleep(60)
        for r in client.messages.batches.results(bid):
            if r.result.type != 'succeeded': continue
            m = r.result.message; usage[0] += m.usage.input_tokens; usage[1] += m.usage.output_tokens
            if m.stop_reason != 'end_turn': continue
            text = next((x.text for x in m.content if x.type == 'text'), None)
            try: out[r.custom_id] = (json.loads(text), bid)
            except Exception: pass
    d = json.loads(DIRECTORY.read_text(encoding='utf-8')); n = 0; today = datetime.date.today().isoformat()
    for c in d['companies']:
        got = out.get(c['slug'][:64])
        if not got or c.get('description'): continue
        v, bid = got
        if v['confidence'] == 'low': v['sector'] = None
        if not c.get('sector') and v['sector'] in SECTORS: c['sector'] = v['sector']
        if not c.get('industry') and v['industry']: c['industry'] = v['industry'][:40]
        if v['description'] and v['confidence'] != 'low': c['description'] = v['description'].strip()
        c['ai'] = {'model': MODEL, 'batch': bid, 'date': today, 'confidence': v['confidence'], 'fields': ['sector', 'industry', 'description']}
        n += 1
    DIRECTORY.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    cost = (usage[0] * 0.10 + usage[1] * 0.50) / 1e6 / 2  # Haiku 5.5 list price, batch = half
    print(json.dumps({'results': len(out), 'applied': n, 'input_tokens': usage[0], 'output_tokens': usage[1], 'approx_cost_usd': round(cost, 4)}))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('step', choices=['submit', 'collect']); ap.add_argument('--limit', default='')
    ap.add_argument('--only-missing', action='store_true'); a = ap.parse_args()
    if a.step == 'submit':
        req = json.loads((ROOT / 'data/company-sources/haiku-request.json').read_text())
        if req.get('collect_batch'):  # re-collect an earlier batch (already paid for) instead of sending a new one
            STATE.write_text(json.dumps({'batches': [req['collect_batch']], 'submitted': 'earlier'}, indent=1) + '\n'); print('re-collecting', req['collect_batch'])
        else: submit(int(a.limit or req.get('limit', 50)), a.only_missing)
    else: collect()
