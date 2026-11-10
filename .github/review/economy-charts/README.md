# Economy charts review

Branch `codex/economy-charts`; independent of Projects (base main963980aa).

Six indicator rows now expand into annual SVG history, one row at a time.
Keyboard buttons, 10Y/5Y/All, hover/tap year/value/change, percentage points for
percentage series, percent changes for levels, observed ten-year summaries and
up to two country or official World Bank region comparisons. Missing years break
the line, <3 observations gives no chart. Shared 9KB module in News/Markets.

**Data limitation:** the saved World Bank snapshot supplies growth history and
latest values for the other five series. Its values and original timestamp are
retained in per-country files; no new annual history was invented. Keyless refresh
for all six series is implemented, but not run because the source is blocked here.
Weekly/manual job produces a versioned artifact only; source review and a separate
branch update are required before publishing refreshed files. No deploy or main push.
See `data/economy-history/README.md` for exact series and run instructions.

Tests: Globe build + site build pass; 58 Python tests pass with 11 pre-existing
skips; 4 JS math/gap/unit tests pass; legal9 +13 subtests pass (existing pytest
plugin deprecation warning). Browser 1440/390 × dark/light passes comparisons,
range, tooltip, one-open-row, value-only fallback and no horizontal overflow or
page exceptions. Screenshots use actual saved observations, not synthetic charts.

Files: `assets/js/economy-charts.js`, `assets/css/economy-charts.css`,
`tools/globe-news/{page.html,market-mode.js}`, `scripts/economy_history.py`,
`.github/workflows/country-data.yml`, country history JSON and docs copies,
three Economy test files, review images, data refresh instructions.

No new secrets, no Gemini calls. Added weekly run estimate2–5 Actions minutes
(hard15), no daily job. Existing weekday ECB publication behavior is unchanged.
Tracker/licensing update on docs `codex/economy-charts`.
