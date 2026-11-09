# Published asset paths

Edit **css/** for stylesheets and **js/** for UI scripts. Normal `python build.py` rejects differing flat copies before publishing. Compare both versions and preserve any incoming edits in the source folders. To publish an intentional, reviewed source change, run `python build.py --publish-assets`, then verify with `python build.py`. The source subfolders are not mirrored into docs/.


`quotes.js`, `news.js` and `data.js` are robot-written data, not editable UI sources. They remain here and are never overwritten from the UI source folders. Existing flat files are retained; no assets or historical data have been removed.

See [the folder guide](../docs/FOLDER-STRUCTURE.md).
