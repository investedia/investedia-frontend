# P19 · B1, B2, B6 only · existing interface retained

Backend companion: `investedia/investedia-backend`, branch `codex/p19-projects-data`. New expanded data remains blocked by source/licence access; no draft candidate records have been copied into this frontend. **No new visual design is claimed approved or implemented.** Existing v1 data, panels, filters and Pro behaviour remain; basic verified v2 data needs no Pro flag. No stock-price badge or feed was added.

## Files changed

- `assets/js/projects-data.js` + flat published copies: lazy shared v2 reader, v1 fallback, explicit field provenance, unknown-schema failure/retry, verified-record requirement. Unknown status/cost/capacity stay absent. Inception is not relabelled as construction/commissioning; non-QIDs never become Wikidata identifiers.
- `assets/js/projects-cluster.js` + published copies; `tools/globe-news/projects-mode.js` / `page.html` + generated Globe page: cached vectors/nodes and one-pass screen grid at each zoom. <=60 phone / <=200 desktop visible marker budget; selected marker stays separate; all clustered members retained and zoomable.
- `src/pages/legal/sources.html`, generated sources pages, project page asset-version references: B6 retained Wikidata/Commons attributions, per-file author/licence/crop credits, explicit not-yet-used datasets and price/source limits.
- `tests/projects-v2.test.mjs`, `projects-p19.browser.mjs`, screenshots/results in this folder. No shared auth/navigation/CSS or protected Market Overview changes.

## Tests run

- Globe source build and `python build.py --publish-assets`: pass; unrelated whole-site cache-tag changes excluded.
- `node --test tests/projects-data.test.mjs tests/projects-v2.test.mjs`: 12 pass.
- Full frontend Python: 64 pass, 11 existing skips.
- Legal checks: 9 pass plus 13 subtests (existing installed pytest-plugin deprecation warning).
- Browser assertions for B1 (no data request in News, shared lazy fetch on entering Projects, v1 fallback, re-entry cache), B2 (4,000-point cap, rotating full-frame performance), B6 (credits/unused-source status) at 1440 and 390, both themes: pass; no overflow, page exceptions or console errors.
- External services/coinbase WebSocket isolated in offline fixtures; no live price/auth/provider availability claim. The 4,000-point benchmark expands saved coordinates only inside the test page; fixture points are never published.

## Performance

Two alternating 100-frame runs per condition, same headless Chromium/cloud runner, rotating camera +0.05 degrees per measured frame. Comparison uses the median of the two run medians. It measures actual complete scheduled frame CPU time, not refresh-rate-capped FPS.

| Viewport | Current 637-point median | New 4,000-point median | Change | <=15% |
|---|---:|---:|---:|---|
| PC 1440 | 4.60 ms | 4.35 ms | -5.43% | pass |
| Phone 390 | 4.30 ms | 4.30 ms | approximately 0% | pass |

Full samples' medians/p95 and visible counts: [results.json](results.json). New p95 ranges: PC6.4–7.2ms; phone7.0–7.2ms. Shared-runner measurements are not physical-phone guarantees. The earlier repeated-grid implementation failed a repeat run (+36.6% PC / +18.4% phone); [its evidence](performance-before-optimization.json) is retained. Replacing repeated regrouping and per-point allocation resolved that measured regression; no failing threshold was hidden or weakened.

## Built / mockup table

No P19 visual mockup is selected yet, so design criteria B3–B5/B7–B8 are not claimed done. These labelled screenshots document the existing interface with the B1/B2 plumbing, not a new option.

| Existing design | Dark built | Light built |
|---|---|---|
| PC 1440 | [Built](built-1440-dark.png) | [Built](built-1440-light.png) |
| Phone 390 | [Built](built-390-dark.png) | [Built](built-390-light.png) |

## Build-report table / coverage

The backend companion reports 631 retained-unverified candidates across78 existing-map countries, 0 new verified points; 118 retained statuses (18.7%), 0 status years/capacity/costs; 111 ambiguous inception years withheld. Three merges, one unmapped-country drop. Four inherited featured previews, zero new fully reviewed featured entries. No real verified asset links or human-reviewed project/news matches; match accuracy unknown and connections off. This branch still displays the unchanged v1/featured combination (637), not that draft v2 dataset.

## Asked, not used

OpenStreetMap/ODbL, IAEA PRIS, company/news websites, paid sources and Google Maps. No newly fetched source or stock-price changes.

## Not done

New approved visual layouts, B3–B5/B7–B8, full featured expansion and source-specific new-data ingestion are pending. The backend's 631 draft rows are not verified/publication-ready and intentionally do not replace the frontend snapshot. No physical-device performance or live-service guarantee is claimed.

## Open questions / owner decisions

A-Q1–A-Q3 resolved: meaningful port/airport developments only; free verified locations/basic facts; World Bank only with precise verifiable physical sites. Remaining blockers are primary source/licence access, reviewed data expansion and 100 actual human-checked news matches. No merge/deploy/production write. Not investment advice.
