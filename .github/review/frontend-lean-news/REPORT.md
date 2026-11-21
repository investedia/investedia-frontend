# Frontend news cleanup

Local branch: `codex/frontend-lean-news`. Comparison after conflict resolution: `a19f1f8b2` (current main, including button and company-page updates).

The article library reuses pending and completed downloads, retries failed downloads, and ignores outdated results and lead summaries after a newer selection. Removed unreachable rendering code. The movers rail sorts articles once, then stops at the first matching article. Biggest-reaction sorting calculates each article's reaction once rather than inside every comparison.

Measured first-page downloads fell from **3 to 1** at both 1440 px and 390 px. Rapid category changes share one large-index download. Initial article content, mover text and all six news-sort results match the baseline. The saved snapshot contains no articles in the day/week windows; month-sort comparisons contain ten visible articles each. No new dependencies.

## Files

- `assets/js/articles-lib.js` and `assets/js/news-feed.js`.
- Published copies in `assets/` and `docs/assets/`.
- Generated root HTML, company pages, mirrored HTML and service worker cache versions from the required build.
- `tests/articles-lib.test.mjs`: six download, retry and stale-response checks.
- `tests/news-efficiency.browser.py`: saved-data browser comparison and screenshots.
- This report, `results.json`, and labeled Now/New screenshots at both widths.

Existing edits to `scripts/serve.py` and `docs/assets/runtime-config.js` are preserved. Existing Graphify files are untouched. Original article and financial data are unchanged. Unrelated data regeneration from the build was reverted, including site statistics and briefing outputs.

## Validation

- 19 Node tests passed: articles library, news source, news filters and page sources.
- 11 Python tests passed: configuration (6), build runtime configuration (4), news library index (1).
- Broader Python suite on Windows: 99 tests ran, with 2 errors and 11 skips. The errors are in unchanged company-HQ code: `test_company_hq` and the `test_company_hq_gleif` module use absolute Linux `/tmp` cache paths that do not exist on Windows. These are separate from the passing cleanup checks; no HQ code was changed.
- Browser checks passed at 1440 px and 390 px against the baseline and built output: content, ordering, category filters, request counts, horizontal overflow and the visible investment-advice disclaimer. Zero page errors. External services were blocked; real saved repository data was used.
- JavaScript syntax checks and `git diff --check` passed. Source, root and docs script copies match byte for byte.
- Both `python -X utf8 build.py --publish-assets` and `python -X utf8 build.py` passed.

Pre-existing build limitation: plain `python build.py --publish-assets` failed on Windows CP1252 decoding. Explicit UTF-8 resolves it without changing build code. Initial new browser-test failures were test-harness issues, corrected before the final passing run. The baseline browser run also reproduced the stale-filter response problem fixed here.

No deployment, push, auth changes or backend changes. This is a targeted news-path cleanup, not a rewrite of the entire frontend. External API availability and real-world network speed were not tested.

## PR conflict resolution

Updated PR #218 with current main in an isolated worktree. All 1,870 conflicts were generated HTML or service-worker cache versions; the source code merged cleanly. Rebuilt the pages and retained incoming article data and company ticker indexes byte for byte. The original checkout and its local server/runtime edits were untouched.

Revalidation: 19 Node checks, 11 targeted Python checks, the UTF-8 build and browser comparisons at 1440 px and 390 px passed. Screenshots and results are refreshed against current main. No PR merge or deployment was performed.
