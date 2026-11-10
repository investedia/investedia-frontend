# Annual Economy charts

Source: World Bank WDI (CC BY 4.0), six series: NY.GDP.MKTP.CD,
NY.GDP.MKTP.KD.ZG, FP.CPI.TOTL.ZG, SL.UEM.TOTL.ZS, NY.GDP.PCAP.CD,
SP.POP.TOTL. Frequency annual; historical observations since 2000. Charts load one
country file only when an indicator is opened. No charting library is added (the
shared JS is about 9 KB uncompressed).

The checked-in per-country files are a lossless conversion of the existing
`assets/globe/economy.json` snapshot, **retaining its original as-of timestamp**.
Growth history already exists; the other five series currently have only their
latest observation. Those rows show the known value and no chart until at least
three real annual observations exist. No history or current dates were invented.
261 saved country/aggregate files are small and loaded on demand. Only official
EMU (Euro area) and WLD (World) regions are offered in the comparison selector;
other choices are countries from the site's existing country map.

## Refresh, review, publish later

The existing Country data refresh workflow gains `economy_history=true` and a
Sunday 06:12 UTC artifact job. The existing weekday ECB job is unchanged apart
from skipping history-only runs. The history job has read-only contents permission,
no secrets, a 15-minute timeout and uploads raw responses separately from validated
per-country files. It never commits or pushes data to main.

Run locally where World Bank is reachable:
`python scripts/economy_history.py --output out/economy-history`.
Or after review/merge, manually run Country data refresh with `economy_history=true`.
Review the artifact, then copy only `economy-history/*.json` into both
`assets/globe/economy-history/` and `docs/assets/globe/economy-history/` on a new
review branch. Do not publish raw files. Refresh failures retain the checked-in
last good files. No workflow was run or deployed by Codex.

Expected cost: 6 keyless World Bank requests, roughly 2–5 Linux Actions minutes
per weekly run (hard 15-minute limit), zero Gemini calls and no new secrets.
The source domains are blocked in this sandbox; the six-series network refresh
could not be exercised here. Offline parser and chart tests cover null gaps,
conflicting observations, wrong series, original timestamps and change units.

Missing years break lines. Annual percentages compare in percentage points;
levels compare in percent (zero reference gives unavailable). Summary uses only
observed years within the latest ten calendar years; prior change requires the
immediately preceding year. Chart heights use actual values, not index ranks.
