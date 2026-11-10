# News activity return

`codex/news-activity-restore`. Fixes Latest activity / Coming up disappearing after
News → Markets → News. The strip was evaluated before `placeLeft()` restored the
News `lcol-on` layout. Calling layout first makes its visibility correct on the
first return render, with no filter/tab resets or new network calls.

Changed files: `tools/globe-news/page.html`, generated `assets/globe/news.html`
and docs copy; browser regression and labelled PC1440/phone390 dark/light images.
Tracker updated in docs branch of the same name. Independent of Projects/Economy.

Evidence: regression fails on unchanged main with “activity strip must return on
first News render”, passes after the two-line ordering fix. Three round trips,
Coming up remains selected, filters unchanged, phone dock/globe still work.
Python52 pass (11 pre-existing skips), legal9 +13 subtests pass (existing pytest
plugin deprecation warning), Globe build pass, all four browser variants pass.
No new failures, secrets, Actions/Gemini cost, merge or deployment.
