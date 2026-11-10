# News article filters

Branch `codex/news-country-filters`. Adds Country, Sector (existing article
categories) and inclusive UTC publication-date range inside the selected rolling
window. Desktop uses a left-column dropdown; phone uses the Filters sheet. Article
fields/timestamps remain unchanged. Sector is the existing category filter, not
an inferred industry. Old presets work; new presets retain country/from/to.
Reset clears them. Pricing marks this implemented item Available only.

Files: `assets/js/news-filters.js`, `tools/globe-news/{news-filters.js,
news-filters.css,page.html,build.py}`, `src/pages/site/pricing.html`, published
asset/root/docs counterparts; unit/browser tests and labelled screenshots.

Checks: builds pass; 4 JS date/predicate tests pass; Python52 pass (11 pre-existing
skips); legal9 +13 subtests pass (existing plugin deprecation warning); browser
1440/390 × dark/light passes source-country/category filtering, date bounds,
save/restore, clear/reset, phone sheet, Layers still opens, no page exceptions or
horizontal overflow. Images replay the saved 8 Nov feed at its original dates.
No fabricated articles, data requests, new secrets, Actions/Gemini costs or deploy.
Tracker: docs branch of same name. Separate branches preserve the queued activity
strip fix, Projects and Economy features; this branch is independently reviewable.
