# Phone detail panel fixes — 10 November 2026

Before/after: US, Brazil, affected-asset article, Aurora Cannabis; 390 × 844 and 1440 × 1000. Images are labelled Now/New and phone/PC. Scrolled after images show the pinned header.

Validation: 9 legal tests pass; Chromium at both widths verifies scrolling, non-overlapping controls, Back, Close, invalid number fallbacks, fallback-card title and repeated theme switches with no uncaught page errors. Native iPhone Safari is not available here.

Aurora is opened from its real `EQ:XNAS:ACB` registry entry via the existing `assetForImpact` resolver. No price is supplied. Current snapshots have no matching article in the selected window, so its article count is zero. No snapshot data or timestamps were changed. Before images use the unchanged generated page from the branch base.

Run `python3 .github/review/phone-panel/verify.py` with the repository served on localhost:8765 and Python Playwright plus Chromium installed. The script writes after screenshots. Annotated images add a caption outside the original viewport.

Changed: `tools/globe-news/page.html`, `market-mode.js`, generated `assets/globe/news.html` and docs copy; `assets/since-news.js` and docs copy; `assets/js/ui.js`, generated `assets/ui.js` and docs copy. Tracker is in the private planning repository on the matching branch. Claude opens the draft PR; nothing merged or deployed.
