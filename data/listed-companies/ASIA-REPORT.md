# Asian and Middle-Eastern exchange lists: report (19 Nov 2026)

Branch `claude/companies-asia`. Task: download each exchange's official listed-company list, only where the exchange's
website terms allow automated download and reuse, and never get around a block.

**Result: 2 of 24 exchange lists saved, 1,986 companies, both in Taiwan.** The other 22 were skipped: 11 because their
website terms forbid automated download or reuse without written permission, and 11 because the site blocks automated
access, cannot be reached, or its terms or list could not be read without getting around a protection.

## Saved

| Exchange | File | Companies | Source | Terms checked | Date |
|---|---|---|---|---|---|
| Taiwan Stock Exchange (TWSE) | `twse.json` | 1,088 | https://openapi.twse.com.tw/v1/opendata/t187ap03_L (TWSE official OpenAPI) | yes: https://www.twse.com.tw/en/terms/use.html | 2026-11-19 |
| Taipei Exchange (TPEx), main market | `tpex.json` | 898 | https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap03_O (TPEx official OpenAPI) | yes: https://www.tpex.org.tw/zh-tw/gtsm_disclaimer.html | 2026-11-19 |
| **Total** | | **1,986** | | | |

Why Taiwan is allowed: both exchanges' terms forbid downloading with crawlers or scrapers "unless by a means that the
exchange has agreed to", and exempt material authorised for the government open-data platform. Each exchange's OpenAPI is
its own published channel for that open data. Nothing else from their websites was downloaded.

Fields saved: code (`symbol`), the official English short name (`name`, e.g. "TCC", "T.S.M.C.", "55688" for Taiwan Taxi;
these are the companies' registered English abbreviations, not full names), the Chinese full name (`name_local`) and the
website when well-formed (2 malformed addresses in the source were dropped, not repaired). Not saved: the industry field
(only a numeric code), prices, addresses, people or any other text. Left out: Taiwan Depositary Receipts (codes 91xx,
foreign companies' receipts); TPEx's emerging board is a separate dataset and was not used. Country is TW for all: the
"foreign registration" field is the place of incorporation (often the Cayman Islands), not where a company is based.

## Skipped: terms forbid it (written permission needed)

| Exchange | Terms page | Reason (quoted or summarised from the terms) |
|---|---|---|
| Philippine Stock Exchange (PSE) | https://www.pse.com.ph/disclaimer/ | "You may NOT COPY, STORE ... REPRODUCE ... any of the Contents ... without prior written consent of PSE"; downloads "only for personal, non-commercial use". |
| Pakistan Stock Exchange (PSX) | https://www.psx.com.pk/psx/terms-of-use | No copying or compiling "through ... systematic retrieval to create collections, compilations, databases or directories"; "spiders, robots ... strictly prohibited" without prior written permission. |
| Dhaka Stock Exchange (DSE) | https://www.dsebd.org/terms | "Reproduction is prohibited ... unless prior permission is obtained"; storage for personal use only. |
| Colombo Stock Exchange (CSE) | https://www.cse.lk/disclaimer | Personal, non-commercial use only; may not "copy, store ... in an electronic retrieval system ... without the prior written permission of CSE". |
| Nepal Stock Exchange (NEPSE) | https://www.nepalstock.com/terms-of-use | Same wording as CSE: no copying or storing without NEPSE's prior written permission. |
| Borsa Istanbul | https://www.borsaistanbul.com/en/copyright-and-disclaimer-notice | May not be "copied ... stored for subsequent use ... in any manner without Borsa İstanbul's prior written consent". |
| Korea Exchange (KRX: KOSPI, KOSDAQ) | https://data.krx.co.kr/contents/MDC/INFO/informationController/MDCINFO003.cmd | Article 10: no "collecting, copying or distributing information without permission by automated means"; Article 12: no copying without prior consent. |
| Hong Kong Exchanges (HKEX: Main Board, GEM) | https://www.hkex.com.hk/Global/Exchange/Terms-of-Use?sc_lang=en | No "robot, bot, spider, scraper or other automated device", no "programmatic, scripted or other mechanical means", no compiling "databases or directories". |
| Japan Exchange Group (JPX / Tokyo Stock Exchange) | https://www.jpx.co.jp/english/term-of-use/index.html | "The collection of data or secondary use of information from this website for commercial purposes is strictly prohibited, unless JPX has granted prior permission." |
| Dubai Financial Market (DFM) | https://www.dfm.ae/other/disclaimer | Terms do not forbid it, but there is no public download file: the list comes only from the page's internal data API. Calling that API directly from a script was refused by this session's safety check, so it was not used. Needs DFM's permission or an official download. |

## Skipped: site blocks automated access, cannot be reached, or terms could not be read

| Exchange | Reason |
|---|---|
| National Stock Exchange of India (NSE) | Website (including its terms) answers automated requests with HTTP 403. |
| BSE India | Website answers browser access with HTTP 403; terms page cannot be read. |
| Indonesia Stock Exchange (IDX) | Cloudflare bot challenge (HTTP 403). |
| Bursa Malaysia | Cloudflare bot challenge (HTTP 403). |
| Stock Exchange of Thailand (SET, mai) | Terms page sends automated requests into an endless redirect (bot check), so the terms could not be read. |
| Ho Chi Minh City Stock Exchange (HOSE) | JavaScript-only site that does not load for an automated browser; terms not readable. |
| Hanoi Stock Exchange (HNX, UPCoM) | Connection fails. |
| Saudi Exchange (Tadawul: Main Market, Nomu) | HTTP 403 to automated requests. |
| Abu Dhabi Securities Exchange (ADX) | HTTP 403 to automated requests. |
| Qatar Stock Exchange (QSE) | Connection fails. |
| Boursa Kuwait | HTTP 403 to automated requests. |

## For the session that merges these into the site

- Files: `data/listed-companies/twse.json`, `tpex.json` (format `investedia.listed-companies/v1`, with `terms_url`).
  Tools: `tools/listings/twse.py`, `tpex.py` (shared helpers in `listing_io.py`). Test: `tests/test_listings_asia.py`.
- `name` is the English short name; the Chinese full name is in `name_local`. A display name for the site may need the
  Chinese name or a later English full-name source; do not invent one.
- **Important, outside this branch:** branch `claude/company-logos` (18 Nov) added 283 Philippine companies from the PSE
  company directory (`tools/listings/pse.py`, `data/listed-companies/pse-ph.json`). PSE's terms (above) forbid storing or
  reusing that content without PSE's written consent, which was not checked at the time. Those companies should be removed
  from that branch, or kept out until PSE gives permission. The Botswana list on the same branch was taken from the BSE
  website without a terms check either and should be checked before merging.
- To add more exchanges, the path is permission: most terms above invite written requests (PSE, PSX, CSE, NEPSE, HKEX, JPX,
  KRX and Borsa Istanbul name a contact or process), or a licensed data feed.

## Japan (added 19 Nov 2026)

- Saved: 3,406 Japanese listed companies in `edinet-jp.json` (code, English name, Japanese name, industry).
- Source: the government's EDINET code list (Financial Services Agency), not the stock exchange site (JPX terms forbid commercial collection).
- Terms: EDINET content is under the Public Data License 1.0 — commercial reuse allowed with credit and an "edited" note.
- Credit to show: 出典：EDINET閲覧（提出）サイト, PDL1.0; edited by Investedia (filtered to listed companies).
- Left out: about 334 listed companies with no English name in the file, foreign companies, and J-REITs/funds.
