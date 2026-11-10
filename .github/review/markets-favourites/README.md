# Favourite markets

`codex/markets-favourites`, based on main922c12bf. Stars on the country inspector,
desktop sessions list and phone session cards. Favourites appear first in desktop
Markets overview and phone Markets sheet. Uses `inv-watch.c`, preserves assets
and unrelated watchlist fields, supports existing explicit country display aliases.
Labelled “this device only”; no new account sync is claimed or implemented.
Selecting a phone country closes the overview sheet so it cannot obscure the
inspector. Clicking a star does not navigate. Stars and close remain separate.
Pricing marks the now-implemented favourites item Available.

Files: `tools/globe-news/{page.html,market-mode.js}`, `src/pages/site/pricing.html`,
generated Globe/Pricing root/docs counterparts; browser test and labelled images.
No protected Market Overview sources or financial snapshots changed.

Checks: Globe/site builds, Python52 pass (11 existing skips), legal9 +13 subtests
pass (existing installed pytest plugin warning), browser1440/390 × dark/light:
session star, country star, first-position overview, phone inspector visibility,
reload persistence, removal, Apple asset entry preserved, no overflow/page errors.
Screens replay saved news dates; ECB panels retain their own actual snapshot date.
No new secrets, Actions minutes, Gemini calls, merge, deployment or live writes.
Tracker in docs branch of same name.
