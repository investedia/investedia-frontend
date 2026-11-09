# Offline projection dependency

The backend owns `registry.py`; the frontend retains its own saved public registry dataset. Do not copy the Python implementation or require a sibling repository for the normal static build.

For intentional projection builds, use an explicit backend checkout:

```
python scripts/build-market-focus.py --backend ../investedia-backend --check
python scripts/build-market-focus.py --backend ../investedia-backend
```

The launcher loads the canonical backend implementation and refuses mismatched registry snapshots. Review differences before using the existing `scripts/sync-snapshots.py --backend PATH` export; that export copies saved files only and preserves the frozen V5 guard. No providers or backfills run. The check mode imports the real builder without regenerating its outputs. The regular mode writes its existing projection outputs and should only be used for an intentional projection update coordinated with its owner.
