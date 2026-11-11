# Graph Report - frontend  (2026-11-11)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1052 nodes · 2033 edges · 80 communities (51 shown, 29 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 115 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `182003ed`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 67
- Community 68
- Community 69

## God Nodes (most connected - your core abstractions)
1. `launch()` - 50 edges
2. `base` - 42 edges
3. `fixtureExternal()` - 39 edges
4. `viewport()` - 33 edges
5. `widths` - 21 edges
6. `projRender()` - 16 edges
7. `render()` - 15 edges
8. `build()` - 15 edges
9. `esc()` - 14 edges
10. `marketRender()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `draw()` --indirect_call--> `ico()`  [INFERRED]
  assets/js/news-board.js → tools/globe/script.js
- `hero()` --indirect_call--> `company()`  [INFERRED]
  assets/js/news-feed.js → assets/js/home-news.js
- `build()` --calls--> `build_config()`  [EXTRACTED]
  build.py → scripts/runtime_config.py
- `build()` --calls--> `write_build_config()`  [EXTRACTED]
  build.py → scripts/runtime_config.py
- `build()` --calls--> `config()`  [EXTRACTED]
  build.py → tools/legal_check.py

## Import Cycles
- None detected.

## Communities (80 total, 29 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (59): draw(), buildPickers(), CCYISO, chg(), closeDD(), closeWin(), CMDI, CMDOF (+51 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (49): ago(), card(), CAT, company(), confirmedChip(), confirmedFeatured(), confirmedSection(), confirmedSmall() (+41 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (14): art(), Builder, Physical, Relevance, category(), project(), rank(), reserve_corporate_slot() (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (15): rows, base, fixtureExternal(), viewport(), ctx(), rows, out, results (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, if, runs-on, steps, timeout-minutes, default (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (10): CountryRankTests, RelevanceTests, art(), CorporateSlotTests, OverviewTests, company_relevance(), corporate_significance(), country_rank() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (16): assetTable(), closeDrawer(), csChoose(), csClose(), csLabel(), csOpen(), csPlace(), enhanceSelect() (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (33): drawMarketMode(), MARKET, marketClose(), marketControl, marketCountry(), marketInit(), marketNotifyPanel(), marketNum() (+25 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (9): launch(), out, reports, ROOT, saved, results, results, out (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (14): pages, requested, serious, details, optional, pages, requested, economy (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (7): build_config(), write_build_config(), Handler, load_config(), runtime_script(), validate_config(), BuildRuntimeConfig

### Community 11 - "Community 11"
Cohesion: 0.21
Nodes (20): ago(), card(), CAT, company(), countries(), esc(), FLAG, flagSrc() (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.17
Nodes (21): bindProjectControls(), pjFacts(), pjIcon(), pjImage(), pjMilestones(), pjPhoto(), pjStage(), pjStar() (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.21
Nodes (21): article(), close(), connectionCard(), connectionList(), focus(), headline(), investments(), load() (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (21): concurrency, cancel-in-progress, group, jobs, refresh, name, on, workflow_dispatch (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (8): main(), materialise(), parse(), check(), numbers(), km(), load(), main()

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (9): s, s, ctx, markets, rows, story, saved, source (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (6): main(), prepare(), main(), main(), query_for(), refresh()

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (7): build(), code_version(), mirror_docs(), page_sources(), publish_assets(), write_companies(), write_sw()

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (7): chromium, require, {devices}, {devices}, results, {devices}, samples

### Community 21 - "Community 21"
Cohesion: 0.21
Nodes (16): commodities(), connect(), crypto(), disconnect(), draw(), flush(), fx(), indices() (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (18): runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, jobs, build-and-test (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (9): chromiumModule(), pages, protectedPaths, publicUrl(), require, runSmoke(), news, quotes (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (6): widths, results, routes, pages, results, results

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (11): articles(), cases, check(), exchanges, moveCheck(), now, read(), registry (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.17
Nodes (5): encode(), dp(), dpr(), build(), build()

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (7): exchanges, fixture, focus, measurements, news, registry, results

### Community 29 - "Community 29"
Cohesion: 0.24
Nodes (6): ReleaseGate, config(), fields(), issues(), main(), render()

### Community 30 - "Community 30"
Cohesion: 0.42
Nodes (11): bind(), chart(), data(), delta(), fmt(), load(), ranges(), render() (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.20
Nodes (3): LENS, markets, results

### Community 33 - "Community 33"
Cohesion: 0.42
Nodes (9): drawMarketMode(), MARKET, marketClose(), marketInit(), marketNotify(), marketPhone(), marketSelect(), marketSetMode() (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.31
Nodes (5): bench(), benchBlock(), card(), chart(), detail()

### Community 35 - "Community 35"
Cohesion: 0.28
Nodes (5): closeSheet(), hero(), openSheet(), sheet(), steps()

### Community 36 - "Community 36"
Cohesion: 0.44
Nodes (8): emit(), format(), mount(), open(), ownCurrency(), paintOptions(), setRates(), value()

### Community 38 - "Community 38"
Cohesion: 0.43
Nodes (6): get(), shadow(), ssGet(), ssSet(), staticQuotes(), withTimeout()

### Community 39 - "Community 39"
Cohesion: 0.54
Nodes (7): apply(), element(), language(), schedule(), setLanguage(), start(), text()

### Community 40 - "Community 40"
Cohesion: 0.32
Nodes (5): iso, mk(), priced, results, usable()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (6): close(), mount(), open(), panel(), search(), searchUI()

### Community 44 - "Community 44"
Cohesion: 0.52
Nodes (5): card(), chart(), compute(), span(), verdict()

### Community 46 - "Community 46"
Cohesion: 0.47
Nodes (3): chart(), pins(), render()

### Community 47 - "Community 47"
Cohesion: 0.60
Nodes (5): controls(), countdown(), detail(), paint(), related()

### Community 48 - "Community 48"
Cohesion: 0.53
Nodes (4): activate(), mount(), save(), show()

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (4): CAPS, markets, results, WATCH

### Community 52 - "Community 52"
Cohesion: 0.33
Nodes (3): markets, mk(), results

### Community 53 - "Community 53"
Cohesion: 0.33
Nodes (3): GROUPS, markets, results

### Community 57 - "Community 57"
Cohesion: 0.70
Nodes (4): dedupe(), load(), read(), validate()

### Community 58 - "Community 58"
Cohesion: 0.70
Nodes (3): ohlc(), seeded(), series()

### Community 59 - "Community 59"
Cohesion: 0.70
Nodes (4): check(), close(), observe(), show()

### Community 60 - "Community 60"
Cohesion: 0.70
Nodes (4): api(), load(), merge(), mergeStories()

### Community 62 - "Community 62"
Cohesion: 0.83
Nodes (3): body(), mount(), steps()

### Community 64 - "Community 64"
Cohesion: 0.83
Nodes (3): listed(), share(), urlFor()

## Knowledge Gaps
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `frame()` connect `Community 0` to `Community 8`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.057342657342657345 - nodes in this community are weakly interconnected._
- **Why does `company()` connect `Community 1` to `Community 0`, `Community 35`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0880503144654088 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1064102564102564 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.09388335704125178 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.06006006006006006 - nodes in this community are weakly interconnected._