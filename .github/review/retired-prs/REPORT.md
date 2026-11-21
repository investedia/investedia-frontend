# Preserve useful frontend work from old PRs #114 and #165

Replaces both obsolete drafts with one branch based on current main. The original branches and history remain available.

Kept: the owner-requested footer wording, "News, insights and projects in one place."; the Briefing tab in the News and Markets activity strips; shared play/pause and transcript controls; the visible advice disclaimer. The current Companies controls and newer globe behavior are preserved. Phone controls and the homepage embed keep their existing behavior.

Fixed while rescuing: the strip uses the neutral label "Spoken summary" for either recorded audio or browser speech. The new strip has readable text in dark and light themes. No second player is created. Existing unrelated light-theme contrast issues in other globe panels remain outside this change and are visible in the screenshots.

Source files: `assets/js/ui.js`, `tools/globe-news/briefing.js`, `tools/globe-news/market-mode.js`, `tools/globe-news/page.html`. Required published script copies, globe HTML, generated root/company pages, docs copies and service-worker cache versions are rebuilt. Added `tests/briefing-strip.browser.py` and this review evidence.

Validation: both globe/site builds pass with UTF-8 enabled; 19 Node checks and 11 targeted Python checks pass. The browser test passes at 1440 px and 390 px in dark and light themes: footer wording, one shared player, play/pause, transcript, Companies controls, return from Markets to News, browser-voice fallback, phone width and embedded-globe behavior. No browser page errors. Screenshots and results are included here. Initial test setup/timing problems were corrected before the final passing run.

Original article, price, map, ledger and ticker-index JSON is preserved byte for byte. No auth, schema, secret, schedule or deployment settings are changed. External services were blocked during browser checks; real saved data and recordings were used. Live provider availability was not tested. The main checkout and its local server/runtime changes remain untouched.
