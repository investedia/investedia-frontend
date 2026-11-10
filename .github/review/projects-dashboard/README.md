# Projects dashboard — review

Branch `codex/projects-dashboard`, based on Claude's `claude/projects-dashboard`
WIP commit e90565b1 and main 963980aa. No merge, deployment or workflow run.

Claude's original globe renderer and four local photos are retained. The workspace
adds the approved large Projects switch, list filters/sort/load more, selected map
callouts/glow, clustered registry dots, real computed statistics, sourced timelines,
four detail tabs, source credits and device-local watchlist. Phone gets a Projects
dock entry plus list/detail sheets above the dock. Unknown sample figures are hidden.
The standalone page reads the same source records rather than duplicating facts.

637 records: the 635 recovered Wikidata records plus Noor and The Line, absent
from that original set. 79 countries, 9 source types, 4 profiles with milestones.
The requested 30–50 fully sourced profiles remain incomplete: new source access is
blocked. Noor and The Line each retain only one inherited dated milestone. This
branch is ready for UI review, **not a claim that curation is finished**. Existing
Wikidata stages remain inherited, not newly verified current construction status.

## Validation

- `python tools/globe-news/build.py`, `python build.py --publish-assets`: pass.
- `python -m unittest discover -s tests -p 'test_*.py'`: 58 pass, including 11
  pre-existing skips; no failures. Six new refresh-validation cases.
- `node --test tests/projects-data.test.mjs`: 3 pass (explicit identities,
  source/date gating, retained photo attribution).
- Legal pytest checks: 9 pass + 13 subtests. Existing installed pytest plugin
  emits a deprecation warning; no new test failures.
- `TEST_BASE_URL=http://localhost:8795 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node tests/projects-dashboard.browser.mjs`:
  1440/390 × dark/light pass; filters, empty results recovery, sort/load more,
  watchlist, detail/source tabs, phone back navigation, News/Markets switches,
  shared standalone records, no horizontal overflow or page exceptions.
- Labelled Now/New images accompany this file. Baseline is main963980aa.
- Unrelated generated-page cache-tag rewrites were excluded; financial snapshot
  contents and protected Market Overview files are unchanged.

## Files

Sources: `tools/globe-news/{page.html,build.py,projects-mode.js,projects.css}`,
small mode-switch integration in `market-mode.js`,
`src/pages/site/projects.html`, `assets/js/projects-{data,standalone}.js`.
Data/evidence: `assets/globe/projects-featured.json`, inherited registry from WIP.
Manual artifact refresh: `.github/workflows/projects-data.yml`,
`tools/projects_data.py`, `data/projects/QUERY.md`.
Tests: the three Projects test files; generated root/docs counterparts; review images.
Tracker/licensing updates are on the same branch name in the docs repository.

No new secrets, 0 daily Actions minutes, 0 Gemini calls. Manual registry refresh
estimate 2–8 Actions minutes, with no automatic publish or deployment.
