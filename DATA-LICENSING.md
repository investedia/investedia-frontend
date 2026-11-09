# Data sources and licensing (honest status, not legal advice)

| Source | Used for | Status |
|---|---|---|
| ECB, Federal Reserve, BoE, BoJ, BoC, RBA, Riksbank, BoK, SEC, BEA, EIA RSS | headline + link (+ our summary) | Public-sector press feeds; generally reusable with attribution. **Check each site's terms before any commercial launch.** |
| BBC, Guardian, NYT, MarketWatch, SCMP, Straits Times, ABC AU, CoinDesk, OilPrice, Investing.com RSS | headline + link + our own short summary | Publisher RSS is for personal/non-commercial syndication of headlines and links. **Uncertain for a commercial product** (MarketWatch/Dow Jones and NYT terms restrict commercial use; Investing.com is stricter). Needs licences or removal before monetising. |
| Regional publisher feeds (Africa, LatAm, Middle East) | same | Same caveat; terms vary per site. |
| GDELT DOC API | discovery of headlines/links | GDELT data is open; the **linked publisher text is not** — we use only titles/links. |
| Google News / Yahoo Finance RSS (`update_news.py`) | headlines | **Uncertain** — Google/Yahoo terms do not allow general redistribution; candidate for removal. |
| Yahoo Finance prices | delayed quotes | **Not licensed for commercial use.** Needs a licensed provider before revenue. |
| Coinbase public WebSocket/ticker | live crypto | Public market data; keep attribution. |
| faireconomy / ForexFactory calendar | economic calendar | **Uncertain**; FRED + official calendars preferred. |
| SEC EDGAR (company_tickers_exchange.json, submissions) | canonical registry: ticker → CIK, registrant name, exchange, HQ address | US government work, public domain; SEC fair-access rules (≤10 req/s, named User-Agent). |
| GeoNames cities1000 | HQ city → coordinates in `data/registry.json` | **CC BY 4.0: credit required** (on `sources.html`). |
| Yahoo Finance chart meta | registry: official security name/exchange for non-US symbols | Same caveat as Yahoo prices (unofficial, personal use). Only the identity facts are stored. |
| Pixabay | topic photos | Pixabay Content License (OK for commercial use, no hotlinking required; we self-host). |
| Brandfetch logos | company logos | Check Brandfetch terms; fallback to initials. |
| Gemini | AI summaries | Our output is generated from headline + description only; keep "AI-assisted" labelling. |

Rules we follow: no full-text republishing, no paywall bypass, no publisher image hotlinking, always link to the original. Provider adapters are
isolated per source so a licensed feed can replace a risky one without touching the rest.

## What must change before Investedia earns revenue (per provider)
Nothing below has been replaced yet. Each provider sits behind its own adapter, so a swap touches one file.

| Provider | Where in code | Problem | What to change |
|---|---|---|---|
| Yahoo Finance (prices, spark/chart) | `workers/live/providers/yahoo.js`; `update_market.py`, `update_globe.py` and related robots | Free, unofficial endpoints; Yahoo's terms allow personal use only, no redistribution or commercial display. | Licensed market-data provider with a commercial redistribution/display licence (e.g. Polygon, Twelve Data, FMP, EODHD, Finnhub paid, or exchange-direct). Write a new `providers/<name>.js` returning the same `{ p, prev, t }` shape; swap the robots' fetchers. Real-time or exchange data also needs exchange licences: keep the "Delayed" labelling until then. |
| Publisher RSS (BBC, Guardian, NYT, MarketWatch, Investing.com, regional feeds) | `FEEDS`/`NEWS_FEEDS` in `update_globe_news.py` (mirrored into `workers/live/v1/feeds.js`) | RSS is licensed for personal/non-commercial reading; headline-and-link republishing in a commercial product is uncertain, and some publishers forbid it. | Keep only official/public-sector feeds (central banks, SEC, BEA, EIA...) after checking each site's terms, and add a licensed news API (e.g. Marketaux, NewsAPI.ai, Benzinga) or direct publisher agreements for the rest. |
| Google News / Yahoo RSS | `update_news.py` | Not licensed for redistribution. | Remove, or replace with the licensed news API above. |
| GDELT | `gdelt()` in `update_globe_news.py` | Metadata is open; the linked article text is not. We use title and link only. | Fine to keep with attribution; confirm GDELT terms before launch. |
| faireconomy / ForexFactory calendar | `update_calendar.py` | Third-party calendar, terms unclear. | Use official release calendars and FRED (already used for part of the data). |
| Coinbase public market data | `workers/live/index.js` `/ticker` | Public data; attribution required; redistribution terms should be confirmed. | Keep the attribution line; confirm with Coinbase terms or use a licensed crypto data vendor. |
| Brandfetch logos | `assets/globe/logos.json` | Terms need checking for commercial use. | Confirm the plan, or fall back to initials/own icons. |
| Gemini | `update_globe_news.py`, `workers/live/providers/gemini.js` | Commercial use needs the paid API tier's terms, not the free tier's. | Move to the paid tier (or another model) before revenue; keep the "AI-assisted" labelling. |
| Cloudflare Workers/KV | `workers/live` | Free plan is fine for non-commercial; commercial use is allowed but limits (10 ms CPU, 1000 KV writes/day) will bind at scale. | Workers Paid ($5/month) before real traffic. Not enabled. |

## Data served by the Worker API (internal metadata only)
Every `/v1` response carries `meta.provider` and `meta.licensed` (currently `false` for Yahoo and RSS), so an unlicensed source can be found and switched off quickly.
