# API-delivered Globe lines

Frontend branch `codex/connections-live`; companion backend branch of the same
name. No live ingestion, merge, deployment, financial job or provider call.

New source: `assets/js/connections-source.js`, Globe source
`tools/globe-news/page.html`; generated flat assets/root HTML/docs rebuilt.
`tests/connections-live.mjs` checks API-first reads, failure/schema fallback,
healthy empty responses, retaining the in-memory last good snapshot, ID dedupe,
24H/48H and7D/30D. No client-side inference fallback is enabled.

Screenshots: `{24h,48h,7d,30d}-{1440,390}-{dark,light}.png`, plus
`freshness-{1440,390}-{dark,light}.png`. Each image states that it is a saved real
generator replay at2026-11-08 00:45UTC. The API response is mocked from unchanged
`assets/globe/connections.json` (generated2026-11-08 00:42:51UTC); no headline,
publication date, event, price or line is invented or uploaded to a live endpoint.

| Window | Drawable connections in replay |
|---|---:|
|24H|47|
|48H|118|
|7D|278|
|30D|380|

Counts matchPC1440/phone390, dark/light. These are offline replay results, not
claimed production counts after a robot run. A production screenshot must wait
for owner-approved backend/frontend releases and a successful scheduled run.

Existing missing event days in the saved30D archive are recorded in `checks.json`:
8Nov;9–14Oct;17–18Oct2026. The existing reader handles404 as no saved file; these
network diagnostics are recorded separately, not hidden or replaced with data.
No other console or page errors occur in the successful API replay.

`Lines updated…` reflects the actual snapshot generation timestamp, with a saved
fallback label when appropriate. API refresh is once per5minutes while visible;
the timestamp label updates each minute. The optional resolved-impact fallback
is not implemented/enabled. Connection retention still needs matching articles
in the existing feed/history; it does not create an article archive API.

Validation:

```
python tools/globe-news/build.py
python build.py --publish-assets
python -m pytest tests/test_legal_pages.py tests/test_legal_release.py -q
python -m unittest discover -s tests -p 'test_*.py'
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node tests/connections-live.mjs
```

Legal9 +13 subtests pass; Python52 pass with11 pre-existing skips. Use a Python
environment with pytest (this runner: `/workspace/.setup/venv/bin/python`).
No data/registry/ledger/Market Overview source is changed. Generated page diffs
mostly reflect the common cache-version change from the new shared JS asset.

Not investment advice.
