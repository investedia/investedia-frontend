# Investedia frontend

An independently buildable static frontend recovered from `refactor/frontend-organization` at `65545389f9c0fdf2f8ba4952897927a073e23191`. Existing appearance, public page names, globe and saved financial data are retained. Original provenance/history lives in the workspace archive; this repository has no remote or GitHub deployment automation.

## Run

Python 3.10+ is sufficient; there are no runtime npm dependencies.

```powershell
python build.py
python scripts/serve.py
```

Open http://127.0.0.1:8765/. The server binds only to loopback and serves **docs/**. The backend is optional for static browsing; API overlays use http://127.0.0.1:8080 by default. The normal static build works without a sibling backend or private configuration.

`npm run build`, `npm run dev`, and `npm test` are convenience aliases for the Python commands. No npm installation is required.

## Connections

Copy `config/site.example.json` to ignored `config.local.json` when configuring another machine. Only these public fields are supported: `apiBaseUrl`, `dataMode` (`static`, `shadow`, `worker`), `analyticsEnabled`, and `supabase` with `url` and `publishableKey`. A browser never receives a service-role key, Cloudflare token or environment file. The loader rejects unknown fields and Supabase service-role/secret keys. Keep analytics false locally.

The local server supplies `/assets/runtime-config.js` dynamically. Static builds instead ship safe defaults: saved data, no account connection and no hardcoded former Worker endpoint. Sign-in is optional and explains when it is not configured. This computer's existing Supabase public configuration is in the ignored local file; it is intentionally absent from Git.

If configuring email/Google sign-in on another origin, verify that the exact callback/redirect URL is permitted by your Supabase project's auth settings. No such hosted settings were changed during recovery. Verify a real login yourself before treating account flows as fully tested.

## Edit and build

Edit `src/pages/`, `assets/js/` and `assets/css/`. `python build.py` generates flat root pages and mirrors public output to `docs/`. Existing UI-source guards remain enabled. After an intentional UI source edit, compare the source with its existing flat copy, then use `python build.py --publish-assets`; a normal build must pass afterwards. Do not edit generated copies alone.

`tools/globe-news/page.html` and its builder define the standalone globe; run its builder before the main build only when intentionally editing that component. Saved financial snapshots stay unchanged during this recovery. Do not run update scripts or synthesize replacement data.

To explicitly import saved public snapshots from a separate backend checkout:

```powershell
python scripts/sync-snapshots.py --backend ../backend
python build.py
```

The sync script copies actual files without modifying their content or timestamps and refuses to overwrite a differing frozen V5 file. No automatic backend dependency is introduced into the frontend build.

## Checks and limits

```powershell
python -m unittest discover -s tests -p test_configuration.py
python build.py
```

The workspace recovery browser harness checks Home, Globe, News and AAPL at desktop/phone widths, real local API reads and account-client initialization. Broader historical UI/consent/accessibility tests are preserved for follow-up and are not all claimed passing. No redesign or production deployment occurred. Saved quotes/news have their original timestamps and can be stale. **Not investment advice.**
