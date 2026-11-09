# Cloudflare Pages public configuration

Project `investedia` keeps build command `python build.py` and output `docs/`. The build writes `docs/assets/runtime-config.js` from the four allowlisted environment variables below, after mirroring static assets. It never reads `config.local.json`. No settings or deployment are changed by this code.

Set these in Pages Settings → Variables and Secrets for the intended production/preview environment:

| Variable | Value |
|---|---|
| `INV_API_BASE_URL` | Actual HTTPS Worker base URL, without `/v1/news` or `/v1/prices`; do not guess the account subdomain |
| `INV_SUPABASE_URL` | Existing project's HTTPS Supabase URL |
| `INV_SUPABASE_PUBLISHABLE_KEY` | Existing browser-safe publishable key; never a service-role or `sb_secret_` key |
| `INV_ANALYTICS_ENABLED` | `false` unless analytics has been explicitly approved; accepts only `true` or `false` |

These values reach the public browser configuration. No Gemini, Cloudflare, ingestion or other secret belongs here. `dataMode` becomes `worker` when an API URL is supplied; it is not a separate variable. Existing validation rejects unknown fields and service-role/secret keys. Invalid explicitly supplied values fail the build without echoing their values.

Missing API URL keeps today's empty-URL/static fallback. Missing analytics defaults to false. If either Supabase value is absent, accounts remain unconfigured and a warning names the missing pair without printing values. With all variables absent, the published configuration retains today's safe static defaults. Local `scripts/serve.py` still uses ignored local public configuration for local development.

The owner reports the existing Supabase Site URL and redirect allowlist are already configured. This change does not edit Supabase or DNS. Runtime public config changes require a separately approved Pages rebuild; news articles subsequently update through the Worker API without per-article builds.
