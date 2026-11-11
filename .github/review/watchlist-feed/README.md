# Watchlist C · News feed

Replaces the watchlist price tables with one sourced article feed. Desktop uses a 280px follow column; phone uses horizontally scrolling follow chips. Includes last-24-hour counts, date groups, original article links, 4:3 thumbnails, genuine same-day price moves only, filtering, unfollow and an empty state. Reuses `inv-watch`, `inv-follow` and existing account mutations. Existing sign-in gate remains intact. Not investment advice.

## Review images

All images are labelled on-image. Filled views replay the real saved 7 November articles and price snapshot at a fixed clock; the account UI is a browser fixture, not a live signed-in account. No article timestamps or production data changed.

| | Dark | Light |
|---|---|---|
| PC filled | [1440](filled-1440-dark.png) | [1440](filled-1440-light.png) |
| Phone filled | [390](filled-390-dark.png) | [390](filled-390-light.png) |
| PC empty | [1440](empty-1440-dark.png) | [1440](empty-1440-light.png) |
| Phone empty | [390](empty-390-dark.png) | [390](empty-390-light.png) |

## Files and verification

Sources: `src/pages/account/watchlist.html`, `assets/js/watchlist-feed.js`, `assets/css/watchlist-feed.css`; generated watchlist pages and published flat assets retained. No shared navigation, auth, schema, or Market Overview changes.

- `python build.py --publish-assets`: passes. Unrelated generated cache-tag rewrites excluded from this feature branch.
- `node --test tests/watchlist-feed.test.mjs`: 5 pass (matching, existing-key dedupe, date window, article dedupe, genuine quote validation).
- `python -m unittest discover -s tests -p 'test_*.py'`: 64 tests, passes with 11 existing skips.
- `python -m pytest -q tests/test_legal_pages.py tests/test_legal_release.py`: 9 pass, 13 subtests pass.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node tests/watchlist-feed.browser.mjs`: eight viewport/theme/state combinations pass; existing guest gate retained. Checks filtering, unfollow, 4:3 images, overflow and console/page errors.

Pre-existing environment limitation: the site's shared Coinbase WebSocket cannot connect through this sandbox proxy. Browser tests isolate external requests and that socket; they do not verify live prices or real account authentication. No new failing checks. No deployment.
