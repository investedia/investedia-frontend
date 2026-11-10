# Shared header review

Branch `codex/header-nav`, base main963980aa. Globe's independent source/top bar
is unchanged. Shared nav: Globe, News with existing dropdown, Markets, Pricing,
More. More preserves Learn, tool groups, About/Contact and active state. All tool
routes remain in the footer too. Owner Analytics moves from header to profile.
Settings reuses existing preferences; profile offers Light/Dark/System on inv-theme.
Guest Log in/Sign up behavior remains; guest display controls are under More.
Phone drawer mirrors the order and retains bell/profile. PRO_CTA default false.

Keyboard: ArrowDown opens More and focuses first link, menu arrows/Home/End,
Escape closes and returns focus. Profile/settings close and restore focus.
System follows OS changes on shared-header pages. No auth/schema changes.

Tests: `python build.py --publish-assets`, Python52 pass with11 existing skips,
legal9 +13 subtests pass (existing installed pytest-plugin deprecation warning).
`TEST_BASE_URL=http://localhost:8802 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node tests/header-nav.browser.mjs`:
1440/1024/390 × dark/light, guest More/drawer + fixture account profile screenshots,
keyboard/focus, Settings, System theme changes, menu geometry, no header overflow
or page exceptions; all distinct header/footer link paths resolved from home,
news, markets, pricing and Apple company page. Account is a browser UI fixture,
not a live sign-in or account mutation.

Pre-existing issue: Pricing's decorative `.pr-bg` makes document width1480 at
viewport1440, reproduced on unchanged main too. Header/menu geometry is checked
separately; this pre-existing page overflow is queued. No new failures.

Sources changed: `assets/js/ui.js`, `assets/css/app.css`, `assets/js/prefs.js`,
`build.py` (resolve System theme before paint); published asset copies, generated
root/docs pages with new shared asset cache tags; browser test and review images.
No financial snapshot/ledger values or protected Market Overview files changed.
No new secrets, schedules, Actions minutes, Gemini calls, merge or deployment.
Tracker update: docs branch `codex/header-nav`.
