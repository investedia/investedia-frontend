# Current Projects — review

Backend `codex/projects-scale`; frontend `codex/projects-scale-ui`. Draft branches only; Claude opens PRs. No merge/deployment/production write. Not investment advice.

## Result

Existing Projects layout, every-project-dot renderer and News/Markets behavior preserved. Slim public snapshot contains308 source-qualified current records /53 countries /10 types,253,602 bytes. Registry remains draft; sources are not an independent field audit. Approved photographs/satellite:0, so no fake site image is shown. The existing neutral project icon remains. The four old featured previews are not silently reintroduced into the current registry; the standalone page lists four actual current records instead, with an explicit missing-photo label.

Every registry card shows sourced `Under construction`, `In development` or `Completed YYYY`; country/type/status filters stay in the existing controls. Basic capacity and source details stay free. Pro preview says timeline, owners/financing, alerts and CSV export are coming soon and links to the existing waitlist. No payment, account gate or fabricated locked facts. Source-supported image/credit handling is ready for reviewed local photo/satellite assets. No photo licence is inherited from Wikidata.

## Files

- `assets/js/projects-data.js`: current-policy/status/evidence and media mapping, lazy shared load.
- `tools/globe-news/projects-mode.js`, `projects.css`: status filters, capacity, public facts, Pro preview, media credit.
- `assets/js/projects-standalone.js`, `src/pages/site/projects.html`: current-data cards without fabricated photography.
- Slim `assets/globe/projects.json`, empty current-only featured artifact; generated asset/HTML mirrors and service-worker cache version.
- `tools/globe-news/build_projects_ui.py`, tests and these review captures.

## Build preservation issue

The existing full globe builder/template is behind the published `assets/globe/news.html` on main. A full globe rebuild would remove independent HQ links, region/Market Overview controls, article styling and activity wording. This is a **pre-existing source/output drift**, not caused by this feature. Protected Claude-owned files were not edited.

The scoped Projects builder replaces only its CSS/JS blocks from the actual source files and preserves all other globe bytes. Compared those bytes directly to main; they match exactly. It fails on missing/duplicate boundaries and is idempotent. The full main-page build still passes. Unrelated pages whose only generated change was the global cache tag were kept unchanged; the service-worker cache version was updated. Broad globe-template reconciliation should be handled separately by its owner.

```sh
python tools/globe-news/build_projects_ui.py
python build.py --publish-assets
python build.py
python -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.test.mjs
# Serve docs/ locally on8767, then:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node tests/projects-scale.browser.mjs
```

Refresh the public copy explicitly, without copying unrelated financial snapshots:

```sh
python ../projects-scale/tools/projects/slim_projects.py --input ../projects-scale/assets/globe/projects.json --output assets/globe/projects.json
```

No sibling backend is required for a normal frontend build. Future approved media files must be copied with their public snapshot after hash review; none is present in this delivery.

## Validation

Frontend Python87 OK (11 existing skips), Node37 passed. Four browser cases passed:1440/390 ×dark/light, lazy fetching, shared concurrent load, filters, card status, Pro link, no overflow, no runtime exceptions, repeat Projects/Markets/News switches and standalone cards. New unit coverage checks current-only previews, evidence-gated media and preservation of unrelated globe blocks. Both builds passed. No new failing functional check. The default Playwright downloaded executable was missing; using installed `/usr/bin/chromium` succeeded.

Cloud-browser performance observations (not physical-device guarantees):

| View |308 actual records |5,000 synthetic stress points |
|---|---:|---:|
|PC dark|39fps|32fps|
|PC light|38fps|28fps|
|Phone dark|49fps|39fps|
|Phone light|48fps|30fps|

Main's separate baseline capture observed26–29fps PC and33–37fps phone in this same cloud session. Runs shared cloud resources, so these are not controlled hardware comparisons or proof of improvement. **60fps PC remains unverified/unmet in this environment.** The stress fixture is generated only inside the test page and never saved as real project data. No clustering, thinning or changed point rendering was introduced. Real-device performance review remains before launch.

## Screenshots

All captures labelled on-image. Same existing layout; registry/basic-fact/preview updates only.

|View|Now main|New current Projects|
|---|---|---|
|PC dark|[Now](now-1440-dark-detail.png)|[New](new-1440-dark-detail.png)|
|PC light|[Now](now-1440-light-detail.png)|[New](new-1440-light-detail.png)|
|Phone dark|[Now](now-390-dark-detail.png)|[New detail](new-390-dark-detail.png), [list](new-390-dark-list.png)|
|Phone light|[Now](now-390-light-detail.png)|[New detail](new-390-light-detail.png), [list](new-390-light-list.png)|

Remaining: owner GEM files, EIA/version/licence review, exact-site licensed imagery, broader infrastructure coverage and hardware performance. Missing `CODEX-PROMPT-projects-working.md` still limits any broader design interpretation; this branch implements only the explicit approved scale brief in the existing layout. No new redesign was inferred.
