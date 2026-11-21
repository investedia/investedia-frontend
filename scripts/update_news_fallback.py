"""Refresh the globe's saved news files from Investedia's own API (owner 21 Nov 2026).

The globe loads /v1/news live; if that request fails it falls back to assets/globe/news-live.json and news-48h.json.
Those files were last written on 8 Nov, so a failed API call showed 12-day-old news. This keeps them fresh.
Safety: keeps the previous files if the API answers with fewer than 50 stories or invalid data. No secrets needed.
"""
import json, sys, time, urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRS = [ROOT / 'assets' / 'globe', ROOT / 'docs' / 'assets' / 'globe']
API = 'https://api.investedia.com/v1/news'

def fetch():
    req = urllib.request.Request(API, headers={'User-Agent': 'investedia-news-fallback'})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.load(r)
    data = d.get('data'); stories = data if isinstance(data, list) else (data or {}).get('stories', [])
    return stories, d.get('meta') or {}

def main():
    stories, meta = fetch()
    if len(stories) < 50 or not all(isinstance(s, dict) and s.get('id') and s.get('published_at') for s in stories):
        print(f'API returned {len(stories)} usable stories; keeping the previous files'); return 0
    updated = meta.get('fetched_at') or datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    if isinstance(updated, (int, float)): updated = datetime.fromtimestamp(updated / (1000 if updated > 1e12 else 1), timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    for d in DIRS:
        live = d / 'news-live.json'; old = json.loads(live.read_text()) if live.exists() else {}
        out = {'schema': old.get('schema', 'investedia.globe.news/v1'), 'demo': False, 'updated_at': updated, 'tier': old.get('tier', 'broad'), 'notice': old.get('notice', ''), 'stories': stories}
        live.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
        h48 = d / 'news-48h.json'; prev = json.loads(h48.read_text()) if h48.exists() else {}
        cut = datetime.now(timezone.utc) - timedelta(hours=48); keep = {s['id']: s for s in prev.get('stories', [])}
        keep.update({s['id']: s for s in stories})
        recent = [s for s in keep.values() if datetime.fromisoformat(s['published_at'].replace('Z', '+00:00')) >= cut]
        recent.sort(key=lambda s: s['published_at'], reverse=True)
        h48.write_text(json.dumps({'schema': prev.get('schema', 'investedia.globe.news48/v1'), 'updated_at': updated, 'hours': 48, 'stories': recent}, ensure_ascii=False, separators=(',', ':')))
    print(f'Wrote {len(stories)} live stories, {len(recent)} in 48h, updated {updated}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
