# Pages deployment proposal — owner approval required

Nothing is deployed or switched on by this branch. The existing legal owner-fact gate is still unresolved; build success is not publication approval.

The existing Cloudflare Pages project is `investedia`, connected to `investedia/investedia-frontend`, production branch `main`, with build command `python build.py` and output directory `docs`. Configure these settings in the Cloudflare dashboard; no root `wrangler.toml` is needed. Do not publish the repository root, environment files, tests, tooling, or the backend.

Build from a clean checkout with Python 3.12:

```
python scripts/build-pages.py --config /path/to/public-production.json
```

Supply the public JSON through Pages build configuration (for example, a build command writes it from non-secret Pages variables). It must contain exactly `apiBaseUrl`, `dataMode`, `analyticsEnabled` (boolean), and `supabase` (`url`, `publishableKey`). Use the owner-confirmed HTTPS API URL and keep analytics false until explicitly approved. A Supabase public publishable/anon key is browser-visible by design; no service-role key or other secret is accepted. The generator reuses `scripts/serve.py` validation and runtime serialization and runs after the normal static build so defaults cannot overwrite the production config. Do not put secret values in config.local.json or in this public JSON.

Owner prerequisites: Cloudflare account/zone and Pages project; GitHub app access to this repository; actual API URL; Supabase project URL and publishable key if accounts are wanted; review of legal owner facts, data licences and account redirect origins. Auth remains optional when both public Supabase fields are empty. Production callback URLs must be approved separately in Supabase; this proposal changes no auth settings.

Before any DNS edit, export the zone and identify the current apex and www records. Preserve all mail routing and verification records, especially MX, SPF TXT (only one SPF record per name), every provider DKIM selector TXT/CNAME, and `_dmarc` TXT. Also preserve mail-provider autodiscovery and ownership-verification records. Exact DNS targets come from the actual Pages/Worker projects, not this proposal. Do not replace the zone or guess mail records. Review apex/www web changes separately and keep a rollback copy.

Go-live steps require separate owner approval: create/configure project; approve public config; validate preview privately; approve exact DNS web records; approve production publish; verify Home/News/Globe and optional login; verify MX/SPF/DKIM/DMARC remain identical. No automatic deploy workflow is included.
