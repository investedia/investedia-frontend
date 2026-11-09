# Deployed website smoke checks

Use Node 20+ and Playwright with Chromium. Reuse an installed Playwright module via `PLAYWRIGHT_MODULE`, or install it outside the checkout (`npm install --prefix /tmp/investedia-smoke playwright`; set `PLAYWRIGHT_MODULE=/tmp/investedia-smoke/node_modules/playwright`). Install Chromium with that Playwright CLI if needed, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an existing Chromium executable. No app secrets are required.

```
node scripts/smoke-deployed.mjs https://investedia.com
node scripts/smoke-deployed.mjs https://investedia.com --api https://ACTUAL-WORKER-URL
```

The default Worker URL comes from the site's public `window.INV_CONFIG.apiBaseUrl`; `--api` lets the owner test an explicit confirmed target before runtime config is published. Do not use an old/guessed Worker hostname. HTTP is allowed only for loopback fixture testing. The runner honors inherited proxy settings and does not disable TLS verification.

The script outputs a short Markdown pass/fail table and exits nonzero if any check fails. It navigates Home, Globe, News and Profile at 1440px and 390px in fresh browser contexts, checks HTTP/HTML content, console errors, uncaught exceptions and horizontal document overflow, and waits 1.5 seconds for initial UI work. It does not log in, click consent controls, run ingestion or change hosted configuration. Optional `--settle-ms` and `--timeout-ms` change observation windows; a passing short smoke does not establish indefinite error-free operation or authenticated account behavior.

It GETs `config.local.json`, `.env` and `AGENTS.md` and accepts 403/404/410 or an exact homepage fallback, never prints response bodies, and fails on other unexpected responses. An exact SPA fallback is not a leaked file. It then fetches Worker `/v1/prices` and `/v1/news` in a browser from the website origin, requiring successful CORS and nonempty expected JSON payloads. Saved Java snapshot responses are not treated as a deployed Worker. Network failures and missing runtime API configuration remain failures, not skipped/passing checks. It does not infer feed freshness from HTTP success.

The browser uses empty storage and blocks service-worker registration to inspect the current network deployment. It does not stub external requests or suppress errors in a production run. The fixture test checks that the runner detects console exceptions, overflow, protected-file exposure and API failure; fixtures use the repository's actual saved feed/quotes rather than invented financial records.
