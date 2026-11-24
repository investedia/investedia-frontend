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


The existing `ARTICLE_STORE` private R2 binding also supports exactly `/assets/globe/markets.json` and `/assets/globe/fx-ecb.json`. Their readers retain the deployed static file when R2 is absent, invalid, equal-dated or older; market universes must match the deployed static universe. Only complete checksummed `published/data/` objects written by the backend's separately enabled data publisher are eligible. GET preserves every byte and source date; HEAD has matching headers and no body. Private trial/state paths are never routed. Missing storage needs no owner action while static fallback is intended. No data schedules change in this frontend patch.

The exact `/assets/globe/site-stats.json` route forwards to the existing guarded article-total reader; the earlier extensionless route remains available.


For the reviewed Cloudflare data timer handoff, repository variables `CLOUDFLARE_MARKETS_ENABLED`, `CLOUDFLARE_FX_ENABLED` and `CLOUDFLARE_ECONOMY_HISTORY_ENABLED` independently skip only their matching GitHub **scheduled** job when exactly `true`. Missing/false values preserve existing execution. Manual dispatch and the existing weekly-history/ECB selection remain unchanged. Source cron times, scripts, financial data and review-only artifact behavior are unchanged. The backend provides the matching default-off timers and private run-status records. Activate each GitHub gate only after that Cloudflare job/timer is verified; reset the gate before pausing Cloudflare for rollback. Merge alone does not set any handoff variable.
