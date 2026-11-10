# Globe UI fixes 1–11

Branch: `codex/globe-fixes`. Item12 (company data/API expansion) is deferred by
the owner. No deployment, merge, source acquisition, ingestion or financial job.

Screenshots are labelled **Now** (`before-*`) or **New**, PC1440/phone390,
dark/light. They replay the unchanged saved real feed at8November2026 00:45UTC,
not today's production feed; each image discloses that date. No headline, date,
price or event was invented or rewritten. Files are full viewport captures.

| UI change | New evidence | Before |
|---|---|---|
| 1 Plain region button;2 selected states;3 layout | `overview-{1440,390}-{dark,light}.png`; layout checks1180/1280/1440/1920 in checks.json | `before-overview-*` |
| 4 Back/Follow/close;6 Inter | `country-news-*`, `asset-*`, `markets-*` | `before-country-news-*` |
| 5 Local location marker / visible failure | `location-*`, `location-denied-1440-dark.png` | prior behaviour described in owner screenshots |
| 7 Sector details and article filter | `sector-1440-*` | `before-overview-1440-*` |
| 8 Layers description/switch/legend | `layers-1440-*`; phone `filters-layers-390-*` (existing filter sheet) | `before-layers-1440-*` |
| 9 Top articles | `overview-*` | `before-overview-*` |
| 10 Foreign listings preview/search/filter | `abroad-*`, `abroad-full-*` | `before-abroad-*` |
| 11 Country News topics/days | `country-news-*`, `market-country-news-*` | `before-country-news-*` |

Desktop sector/anchored menus stay desktop; phone retains the existing dock,
filter sheet, article swipe, sheet expansion and drag gestures. Existing
placement hooks remain intact. No new sector pin/drag feature is introduced.

Validation:

```
python tools/globe-news/build.py
python build.py --publish-assets
python -m pytest tests/test_legal_pages.py tests/test_legal_release.py -q
python -m unittest discover -s tests -p 'test_*.py'
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node tests/globe-ui-fixes.mjs
```

Use the development environment's Python with pytest installed; on this runner
that is `/workspace/.setup/venv/bin/python`. The repository structure and font
files are unchanged. Legal9 tests +13 subtests pass; full Python52 pass with11
pre-existing skips. Browser checks assert no page or console errors, no page
horizontal overflow, exclusive menus, real sector filtering, foreign-listing
search, readable detail controls, geolocation success/denial and caching,
News/Markets switching and that closing either panel keeps the canvas visible.

Authored changes: `tools/globe-news/page.html`, `market-mode.js`, font-family
references in18 existing CSS/JS/page source files, and `tests/globe-ui-fixes.mjs`.
Generated root/docs HTML and flat asset copies are rebuilt; their broad diff is
mostly the common cache-version change from the shared font assets. No data,
registry, ledger, V5 or Track Record financial result is changed. Claude-owned
Market Overview sources and AGENTS.md are untouched. Geist Mono's font file and
face declaration remain available but visible UI uses Inter/tabular figures.

Not investment advice.
