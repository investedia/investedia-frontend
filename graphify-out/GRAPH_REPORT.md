# Graph Report - investedia-schedule-handoff-20261124  (2026-11-24)

## Corpus Check
- 12946 files · ~7,957,607 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 65 file(s) not represented in the graph (top: .css 55, (none) 6, .woff2 2)

## Summary
- 1983 nodes · 3583 edges · 181 communities (110 shown, 71 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 269 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `51c931eb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- script.js
- js/home-news.js
- connections-live.mjs
- globe-dropdowns.spec.mjs
- economy-history
- test_market_overview_evidence.py
- js/ui.js
- market-mode.js
- browser-support.mjs
- ref_node_fs
- gem_satellite.py
- home.js
- projects-mode.js
- market-focus-preview.js
- projects-data.yml
- economy_history.py
- ref_node_assert
- make_briefing.py
- pathlib
- p0-timeline.spec.mjs
- js/markets-heat.js
- ci.yml
- smoke-deployed.mjs
- assets/home-news.js
- p1-global-markets.spec.mjs
- re
- json
- markets-m1.spec.mjs
- build.py
- js/economy-charts.js
- LegalPages
- globe-ideas.spec.mjs
- market-focus-mode.js
- js/calls-ui.js
- js/news-feed.js
- js/prefs.js
- ProjectsDataTests
- js/live-data.js
- js/locale.js
- redesign.spec.mjs
- p4-markets-globe.spec.mjs
- EconomyHistoryTests
- js/peek.js
- js/since-news.js
- globe-light-mode.spec.mjs
- js/asset-page.js
- js/calendar.js
- js/consent.js
- boot
- assets/ui.js
- article-index-r2-reader.test.mjs
- SecondPass
- markets.json.js
- build_company_hq.py
- site-stats.js
- coStart
- js/connections-source.js
- js/mock.js
- js/news-alerts.js
- js/news-source.js
- src/sw.js
- js/price-rail.js
- js/projects-data.js
- js/share-link.js
- js/implications.js
- globe-news/news-filters.js
- steps
- env
- second_pass.py
- country_briefs.py
- p0b-history-connections.spec.mjs
- test_market_overview.py
- markets-data.yml
- news-fallback.yml
- briefing.js
- gleif_pass.py
- assets/markets-heat.js
- boot
- build_market_focus.py
- serve.py
- CompanyHQTests
- assets/globe-companies.js
- js/globe-companies.js
- argparse
- assets/economy-charts.js
- js/push-alerts.js
- assets/push-alerts.js
- globe-phone.spec.mjs
- since-news.spec.mjs
- P19 · B1, B2, B6 only · existing interface retained
- globe-select.spec.mjs
- assets/calls-ui.js
- assets/news-feed.js
- assets/prefs.js
- assets/projects-data.js
- assets/live-data.js
- assets/locale.js
- package.json
- assets/peek.js
- assets/since-news.js
- globe-ui-fixes.mjs
- initArticles
- assets/asset-page.js
- assets/briefings.js
- assets/calendar.js
- coStart
- assets/consent.js
- initArticles
- js/briefings.js
- README.md
- assets/connections-source.js
- assets/mock.js
- assets/news-alerts.js
- assets/news-source.js
- Frontend news cleanup
- sw.js
- encode
- Investedia frontend
- js/live-news.js
- assets/live-news.js
- assets/price-rail.js
- assets/share-link.js
- Data sources and licensing (honest status, not legal advice)
- Projects dashboard — review
- assets/implications.js
- js/markets-layout.js
- assets/markets-layout.js
- Annual Economy charts
- ASSET-OUTPUT.md
- CLAUDE.md
- connections-live/README.md
- economy-charts/README.md
- globe-fixes/README.md
- header-nav/README.md
- markets-favourites/README.md
- news-activity-restore/README.md
- news-country-filters/README.md
- phone-panel/README.md
- retired-prs/REPORT.md
- LEGAL-TODO.md
- PAGES-RUNTIME-CONFIG.md
- REGISTRY-BUILDER.md
- Deployed website smoke checks
- a11y-report.md

## God Nodes (most connected - your core abstractions)
1. `launch()` - 52 edges
2. `base` - 42 edges
3. `fixtureExternal()` - 39 edges
4. `viewport()` - 33 edges
5. `widths` - 21 edges
6. `projRender()` - 21 edges
7. `render()` - 15 edges
8. `build()` - 15 edges
9. `esc()` - 14 edges
10. `esc()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `draw()` --indirect_call--> `ico()`  [INFERRED]
  assets/js/news-board.js → tools/globe/script.js
- `draw()` --indirect_call--> `ico()`  [INFERRED]
  assets/news-board.js → tools/globe/script.js
- `Projects source and refresh` --references--> `query_for()`  [EXTRACTED]
  data/projects/QUERY.md → tools/projects_data.py
- `build()` --calls--> `build_config()`  [EXTRACTED]
  build.py → scripts/runtime_config.py
- `build()` --calls--> `write_build_config()`  [EXTRACTED]
  build.py → scripts/runtime_config.py

## Import Cycles
- None detected.

## Communities (181 total, 71 thin omitted)

### Community 0 - "script.js"
Cohesion: 0.05
Nodes (60): draw(), draw(), buildPickers(), CCYISO, chg(), closeDD(), closeWin(), CMDI (+52 more)

### Community 1 - "js/home-news.js"
Cohesion: 0.09
Nodes (49): ago(), card(), CAT, company(), confirmedChip(), confirmedFeatured(), confirmedSection(), confirmedSmall() (+41 more)

### Community 2 - "connections-live.mjs"
Cohesion: 0.33
Nodes (4): out, reports, ROOT, saved

### Community 3 - "globe-dropdowns.spec.mjs"
Cohesion: 0.33
Nodes (4): CAPS, markets, results, WATCH

### Community 4 - "economy-history"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, if, runs-on, steps, timeout-minutes, default (+28 more)

### Community 5 - "test_market_overview_evidence.py"
Cohesion: 0.15
Nodes (10): art(), Builder, Physical, Relevance, load(), main(), geo_allowed(), market_relevance() (+2 more)

### Community 6 - "js/ui.js"
Cohesion: 0.07
Nodes (16): assetTable(), closeDrawer(), csChoose(), csClose(), csLabel(), csOpen(), csPlace(), enhanceSelect() (+8 more)

### Community 7 - "market-mode.js"
Cohesion: 0.13
Nodes (33): drawMarketMode(), MARKET, marketClose(), marketControl, marketCountry(), marketInit(), marketNotifyPanel(), marketNum() (+25 more)

### Community 8 - "browser-support.mjs"
Cohesion: 0.07
Nodes (25): rows, base, chromium, fixtureExternal(), launch(), viewport(), widths, ctx() (+17 more)

### Community 9 - "ref_node_fs"
Cohesion: 0.10
Nodes (13): pages, requested, serious, results, routes, details, optional, pages (+5 more)

### Community 10 - "gem_satellite.py"
Cohesion: 0.15
Nodes (13): before_pass(), grab(), work(), change_pass(), crop(), edges(), ok(), work() (+5 more)

### Community 11 - "home.js"
Cohesion: 0.21
Nodes (20): ago(), card(), CAT, company(), countries(), esc(), FLAG, flagSrc() (+12 more)

### Community 12 - "projects-mode.js"
Cohesion: 0.10
Nodes (35): place(), size(), snap(), sync(), bindProjectControls(), PJ_MON, pjBindSlider(), pjDay() (+27 more)

### Community 13 - "market-focus-preview.js"
Cohesion: 0.21
Nodes (21): article(), close(), connectionCard(), connectionList(), focus(), headline(), investments(), load() (+13 more)

### Community 14 - "projects-data.yml"
Cohesion: 0.09
Nodes (21): concurrency, cancel-in-progress, group, jobs, refresh, name, on, workflow_dispatch (+13 more)

### Community 15 - "economy_history.py"
Cohesion: 0.11
Nodes (12): main(), materialise(), parse(), build(), generate(), check(), numbers(), convert() (+4 more)

### Community 16 - "ref_node_assert"
Cohesion: 0.07
Nodes (17): body, response(), rows, setup(), source, s, s, ctx (+9 more)

### Community 18 - "make_briefing.py"
Cohesion: 0.15
Nodes (6): run(), chapters(), duration(), main(), speak(), ssml()

### Community 19 - "pathlib"
Cohesion: 0.10
Nodes (3): HistoryConnections, NewsLibraryIndex, RegistryBuilder

### Community 20 - "p0-timeline.spec.mjs"
Cohesion: 0.11
Nodes (6): require, {devices}, {devices}, results, {devices}, samples

### Community 21 - "js/markets-heat.js"
Cohesion: 0.21
Nodes (16): commodities(), connect(), crypto(), disconnect(), draw(), flush(), fx(), indices() (+8 more)

### Community 22 - "ci.yml"
Cohesion: 0.10
Nodes (19): runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, jobs, build-and-test (+11 more)

### Community 23 - "smoke-deployed.mjs"
Cohesion: 0.14
Nodes (9): chromiumModule(), pages, protectedPaths, publicUrl(), require, runSmoke(), news, quotes (+1 more)

### Community 24 - "assets/home-news.js"
Cohesion: 0.09
Nodes (49): ago(), card(), CAT, company(), confirmedChip(), confirmedFeatured(), confirmedSection(), confirmedSmall() (+41 more)

### Community 25 - "p1-global-markets.spec.mjs"
Cohesion: 0.13
Nodes (11): articles(), cases, check(), exchanges, moveCheck(), now, read(), registry (+3 more)

### Community 26 - "re"
Cohesion: 0.26
Nodes (12): add(), cells(), fetch(), get(), parse_brvm(), parse_gh(), parse_ke(), add() (+4 more)

### Community 27 - "json"
Cohesion: 0.11
Nodes (10): main(), fetch_yahoo(), listing(), main(), source_symbol(), fetch(), main(), img() (+2 more)

### Community 28 - "markets-m1.spec.mjs"
Cohesion: 0.15
Nodes (7): exchanges, fixture, focus, measurements, news, registry, results

### Community 29 - "build.py"
Cohesion: 0.11
Nodes (13): build(), code_version(), mirror_docs(), page_sources(), publish_assets(), write_companies(), write_sw(), ReleaseGate (+5 more)

### Community 30 - "js/economy-charts.js"
Cohesion: 0.42
Nodes (11): bind(), chart(), data(), delta(), fmt(), load(), ranges(), render() (+3 more)

### Community 32 - "globe-ideas.spec.mjs"
Cohesion: 0.20
Nodes (3): LENS, markets, results

### Community 33 - "market-focus-mode.js"
Cohesion: 0.42
Nodes (9): drawMarketMode(), MARKET, marketClose(), marketInit(), marketNotify(), marketPhone(), marketSelect(), marketSetMode() (+1 more)

### Community 34 - "js/calls-ui.js"
Cohesion: 0.31
Nodes (5): bench(), benchBlock(), card(), chart(), detail()

### Community 35 - "js/news-feed.js"
Cohesion: 0.28
Nodes (4): closeSheet(), openSheet(), sheet(), steps()

### Community 36 - "js/prefs.js"
Cohesion: 0.44
Nodes (8): emit(), format(), mount(), open(), ownCurrency(), paintOptions(), setRates(), value()

### Community 38 - "js/live-data.js"
Cohesion: 0.43
Nodes (6): get(), shadow(), ssGet(), ssSet(), staticQuotes(), withTimeout()

### Community 39 - "js/locale.js"
Cohesion: 0.54
Nodes (7): apply(), element(), language(), schedule(), setLanguage(), start(), text()

### Community 40 - "redesign.spec.mjs"
Cohesion: 0.32
Nodes (5): iso, mk(), priced, results, usable()

### Community 41 - "p4-markets-globe.spec.mjs"
Cohesion: 0.22
Nodes (4): economy, registry, results, root

### Community 43 - "js/peek.js"
Cohesion: 0.67
Nodes (6): close(), mount(), open(), panel(), search(), searchUI()

### Community 44 - "js/since-news.js"
Cohesion: 0.52
Nodes (5): card(), chart(), compute(), span(), verdict()

### Community 45 - "globe-light-mode.spec.mjs"
Cohesion: 0.15
Nodes (8): original, results, context(), draw(), html, newMode, oldMode, results

### Community 46 - "js/asset-page.js"
Cohesion: 0.47
Nodes (3): chart(), pins(), render()

### Community 47 - "js/calendar.js"
Cohesion: 0.60
Nodes (5): controls(), countdown(), detail(), paint(), related()

### Community 48 - "js/consent.js"
Cohesion: 0.53
Nodes (4): activate(), mount(), save(), show()

### Community 49 - "boot"
Cohesion: 0.18
Nodes (13): html(), mark(), results(), boot(), card(), load(), render(), row() (+5 more)

### Community 50 - "assets/ui.js"
Cohesion: 0.07
Nodes (16): assetTable(), closeDrawer(), csChoose(), csClose(), csLabel(), csOpen(), csPlace(), enhanceSelect() (+8 more)

### Community 51 - "article-index-r2-reader.test.mjs"
Cohesion: 0.22
Nodes (8): all, fixture(), meta, real, sha(), fixture(), records, sha()

### Community 53 - "markets.json.js"
Cohesion: 0.48
Nodes (5): onRequest(), FILES, onRequest(), readSnapshot(), stamp()

### Community 54 - "build_company_hq.py"
Cohesion: 0.11
Nodes (18): binding(), fixture(), fetch(), HQCityResolutionTests, active_rows(), annotate_review(), check_reference_rows(), collect() (+10 more)

### Community 55 - "site-stats.js"
Cohesion: 0.62
Nodes (4): indexHeaders(), onRequest(), publishedIndex(), onRequest()

### Community 57 - "js/connections-source.js"
Cohesion: 0.70
Nodes (4): dedupe(), load(), read(), validate()

### Community 58 - "js/mock.js"
Cohesion: 0.70
Nodes (3): ohlc(), seeded(), series()

### Community 59 - "js/news-alerts.js"
Cohesion: 0.70
Nodes (4): check(), close(), observe(), show()

### Community 60 - "js/news-source.js"
Cohesion: 0.70
Nodes (4): api(), load(), merge(), mergeStories()

### Community 62 - "js/price-rail.js"
Cohesion: 0.83
Nodes (3): body(), mount(), steps()

### Community 63 - "js/projects-data.js"
Cohesion: 0.28
Nodes (4): datacenters(), invest(), load(), loadDatacenters()

### Community 64 - "js/share-link.js"
Cohesion: 0.83
Nodes (3): listed(), share(), urlFor()

### Community 80 - "steps"
Cohesion: 0.07
Nodes (28): default, description, required, concurrency, cancel-in-progress, group, if, runs-on (+20 more)

### Community 81 - "env"
Cohesion: 0.07
Nodes (28): concurrency, cancel-in-progress, group, runs-on, steps, timeout-minutes, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (+20 more)

### Community 82 - "second_pass.py"
Cohesion: 0.13
Nodes (17): chunks(), current(), decide(), same_name(), entities(), get(), item_rows(), main() (+9 more)

### Community 83 - "country_briefs.py"
Cohesion: 0.21
Nodes (7): art(), T, build(), first_sentence(), similar(), week(), write()

### Community 85 - "test_market_overview.py"
Cohesion: 0.10
Nodes (10): CountryRankTests, RelevanceTests, art(), CorporateSlotTests, OverviewTests, company_relevance(), corporate_significance(), country_rank() (+2 more)

### Community 86 - "markets-data.yml"
Cohesion: 0.09
Nodes (21): concurrency, cancel-in-progress, group, jobs, refresh, name, on, schedule (+13 more)

### Community 87 - "news-fallback.yml"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, refresh, name, on, schedule (+12 more)

### Community 88 - "briefing.js"
Cohesion: 0.23
Nodes (15): build(), draw(), mCard(), paintBtn(), paintCard(), pause(), pauseOnly(), place() (+7 more)

### Community 89 - "gleif_pass.py"
Cohesion: 0.19
Nodes (11): by_isin(), candidates(), decide(), fold(), geonames(), get_json(), located(), main() (+3 more)

### Community 90 - "assets/markets-heat.js"
Cohesion: 0.21
Nodes (16): commodities(), connect(), crypto(), disconnect(), draw(), flush(), fx(), indices() (+8 more)

### Community 91 - "boot"
Cohesion: 0.18
Nodes (13): html(), mark(), results(), boot(), card(), load(), render(), row() (+5 more)

### Community 92 - "build_market_focus.py"
Cohesion: 0.12
Nodes (11): build(), category(), project(), rank(), reserve_corporate_slot(), build(), fetch(), fingerprint() (+3 more)

### Community 93 - "serve.py"
Cohesion: 0.12
Nodes (8): build_config(), write_build_config(), Handler, load_config(), runtime_script(), validate_config(), BuildRuntimeConfig, PublicConfigurationTest

### Community 94 - "CompanyHQTests"
Cohesion: 0.07
Nodes (11): binding(), CompanyHQTests, Gleif, rec(), SnapshotExportTest, brand_colour(), build(), clean() (+3 more)

### Community 95 - "assets/globe-companies.js"
Cohesion: 0.28
Nodes (10): active(), badgeHTML(), draw(), filtered(), floatCard(), img(), panelHTML(), refresh() (+2 more)

### Community 96 - "js/globe-companies.js"
Cohesion: 0.28
Nodes (10): active(), badgeHTML(), draw(), filtered(), floatCard(), img(), panelHTML(), refresh() (+2 more)

### Community 97 - "argparse"
Cohesion: 0.13
Nodes (12): Curated profiles: partial, Projects source and refresh, main(), prepare(), get(), image_ok(), main(), website_icon() (+4 more)

### Community 99 - "assets/economy-charts.js"
Cohesion: 0.42
Nodes (11): bind(), chart(), data(), delta(), fmt(), load(), ranges(), render() (+3 more)

### Community 100 - "js/push-alerts.js"
Cohesion: 0.35
Nodes (10): chips(), createSmart(), listView(), load(), newView(), paint(), quota(), removeSmart() (+2 more)

### Community 101 - "assets/push-alerts.js"
Cohesion: 0.35
Nodes (10): chips(), createSmart(), listView(), load(), newView(), paint(), quota(), removeSmart() (+2 more)

### Community 102 - "globe-phone.spec.mjs"
Cohesion: 0.33
Nodes (3): markets, mk(), results

### Community 105 - "P19 · B1, B2, B6 only · existing interface retained"
Cohesion: 0.20
Nodes (9): Asked, not used, Build-report table / coverage, Built / mockup table, Files changed, Not done, Open questions / owner decisions, P19 · B1, B2, B6 only · existing interface retained, Performance (+1 more)

### Community 108 - "assets/calls-ui.js"
Cohesion: 0.31
Nodes (5): bench(), benchBlock(), card(), chart(), detail()

### Community 109 - "assets/news-feed.js"
Cohesion: 0.28
Nodes (4): closeSheet(), openSheet(), sheet(), steps()

### Community 110 - "assets/prefs.js"
Cohesion: 0.44
Nodes (8): emit(), format(), mount(), open(), ownCurrency(), paintOptions(), setRates(), value()

### Community 111 - "assets/projects-data.js"
Cohesion: 0.28
Nodes (4): datacenters(), invest(), load(), loadDatacenters()

### Community 118 - "assets/live-data.js"
Cohesion: 0.43
Nodes (6): get(), shadow(), ssGet(), ssSet(), staticQuotes(), withTimeout()

### Community 119 - "assets/locale.js"
Cohesion: 0.54
Nodes (7): apply(), element(), language(), schedule(), setLanguage(), start(), text()

### Community 122 - "package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, dev, test, version

### Community 123 - "assets/peek.js"
Cohesion: 0.67
Nodes (6): close(), mount(), open(), panel(), search(), searchUI()

### Community 124 - "assets/since-news.js"
Cohesion: 0.52
Nodes (5): card(), chart(), compute(), span(), verdict()

### Community 128 - "initArticles"
Cohesion: 0.53
Nodes (5): initArticles(), options(), pager(), render(), rows()

### Community 129 - "assets/asset-page.js"
Cohesion: 0.47
Nodes (3): chart(), pins(), render()

### Community 130 - "assets/briefings.js"
Cohesion: 0.53
Nodes (5): card(), init(), list(), page(), spark()

### Community 131 - "assets/calendar.js"
Cohesion: 0.60
Nodes (5): controls(), countdown(), detail(), paint(), related()

### Community 133 - "assets/consent.js"
Cohesion: 0.53
Nodes (4): activate(), mount(), save(), show()

### Community 134 - "initArticles"
Cohesion: 0.53
Nodes (5): initArticles(), options(), pager(), render(), rows()

### Community 135 - "js/briefings.js"
Cohesion: 0.53
Nodes (5): card(), init(), list(), page(), spark()

### Community 142 - "README.md"
Cohesion: 0.33
Nodes (5): Checks and limits, Connections, Edit and build, Repaired news source, Run

### Community 144 - "assets/connections-source.js"
Cohesion: 0.70
Nodes (4): dedupe(), load(), read(), validate()

### Community 145 - "assets/mock.js"
Cohesion: 0.70
Nodes (3): ohlc(), seeded(), series()

### Community 146 - "assets/news-alerts.js"
Cohesion: 0.70
Nodes (4): check(), close(), observe(), show()

### Community 147 - "assets/news-source.js"
Cohesion: 0.70
Nodes (4): api(), load(), merge(), mergeStories()

### Community 153 - "Frontend news cleanup"
Cohesion: 0.40
Nodes (4): Files, Frontend news cleanup, PR conflict resolution, Validation

### Community 155 - "encode"
Cohesion: 0.50
Nodes (3): encode(), dp(), dpr()

### Community 156 - "Investedia frontend"
Cohesion: 0.50
Nodes (3): Investedia frontend, Owner rules (all agents: Claude, Codex, others), Who does what

### Community 157 - "js/live-news.js"
Cohesion: 0.83
Nodes (3): check(), ids(), show()

### Community 158 - "assets/live-news.js"
Cohesion: 0.83
Nodes (3): check(), ids(), show()

### Community 159 - "assets/price-rail.js"
Cohesion: 0.83
Nodes (3): body(), mount(), steps()

### Community 160 - "assets/share-link.js"
Cohesion: 0.83
Nodes (3): listed(), share(), urlFor()

### Community 161 - "Data sources and licensing (honest status, not legal advice)"
Cohesion: 0.50
Nodes (3): Data served by the Worker API (internal metadata only), Data sources and licensing (honest status, not legal advice), What must change before Investedia earns revenue (per provider)

### Community 165 - "Projects dashboard — review"
Cohesion: 0.50
Nodes (3): Files, Projects dashboard — review, Validation

## Knowledge Gaps
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `frame()` connect `script.js` to `globe-select.spec.mjs`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `script.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05487269534679543 - nodes in this community are weakly interconnected._
- **Should `js/home-news.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0880503144654088 - nodes in this community are weakly interconnected._
- **Should `economy-history` be split into smaller, more focused modules?**
  _Cohesion score 0.06006006006006006 - nodes in this community are weakly interconnected._
- **Should `test_market_overview_evidence.py` be split into smaller, more focused modules?**
  _Cohesion score 0.1455026455026455 - nodes in this community are weakly interconnected._
- **Should `js/ui.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07301587301587302 - nodes in this community are weakly interconnected._
- **Should `market-mode.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13015873015873017 - nodes in this community are weakly interconnected._