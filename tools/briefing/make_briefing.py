"""Make one day's Briefing audio from an approved script.

Script format (assets/briefing/scripts/YYYY-MM-DD.txt), one chapter per paragraph:
    @fly lon,lat          optional first line of a paragraph: the globe flies here while the chapter plays
    Text with / for a short pause and // for a longer pause.
The greeting ("Good morning, <name>.") is NOT in the script; it is a separate short clip made per first name.

Output: assets/briefing/YYYY-MM-DD.mp3 and an entry in assets/briefing/index.json with chapter start times.
Needs AZURE_SPEECH_KEY (or a proxy that injects it) and AZURE_SPEECH_REGION (default germanywestcentral).

    python3 tools/briefing/make_briefing.py 2026-11-16
"""
import json, os, re, subprocess, sys, tempfile, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets' / 'briefing'
VOICE = os.environ.get('BRIEFING_VOICE', 'en-US-NovaTurboMultilingualNeural')
REGION = os.environ.get('AZURE_SPEECH_REGION', 'germanywestcentral')


def chapters(text):
    """Paragraphs = chapters. Lines starting with @ are cues for the globe tour, never spoken:
    @fly lon,lat[,zoom]                      move the globe here
    @from lon,lat Label                      where the event happened (start of the line)
    @to SYMBOL                               the asset it moved (end of the line; companies end at their HQ)
    @move Label | SYMBOL | percent           a move shown while this chapter plays (percent of that day)
    @article Headline | Source | Category | image | SYMBOL | percent   the article card
    @hq SYMBOL                               zoom into the company's headquarters
    """
    out = []
    for para in [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]:
        c, words = {'fly': None, 'moves': []}, []
        for line in para.splitlines():
            line = line.strip()
            if not line.startswith('@'):
                words.append(line)
                continue
            key, _, val = line[1:].partition(' ')
            val = val.strip()
            if key == 'fly':
                c['fly'] = [float(x) for x in val.split(',')]
            elif key == 'from':
                xy, _, label = val.partition(' ')
                lon, lat = (float(x) for x in xy.split(','))
                c['from'] = {'lon': lon, 'lat': lat, 'label': label.strip()}
            elif key in ('to', 'hq'):
                c[key] = val
            elif key == 'move':
                n, sym, v = [x.strip() for x in val.split('|')]
                c['moves'].append([n, sym, float(v)])
            elif key == 'article':
                f = [x.strip() for x in val.split('|')] + [''] * 6
                c['art'] = {'h': f[0], 'src': f[1], 'cat': f[2], 'img': f[3], 'sym': f[4], 'v': float(f[5]) if f[5] else None}
        c['text'] = ' '.join(' '.join(words).split())
        out.append(c)
    return out


def ssml(text):
    t = (text.replace('&', ' and ').replace('<', '').replace('>', '')
         .replace('//', '\x01').replace('/', '\x02')
         .replace('\x01', "<break time='700ms'/>").replace('\x02', "<break time='300ms'/>"))
    return (f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>"
            f"<voice name='{VOICE}'>{t}<break time='500ms'/></voice></speak>")


def speak(text, path):
    req = urllib.request.Request(
        f'https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1', data=ssml(text).encode(),
        headers={'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
                 'User-Agent': 'investedia-briefing', 'Ocp-Apim-Subscription-Key': os.environ.get('AZURE_SPEECH_KEY', 'proxy-injected')})
    with urllib.request.urlopen(req, timeout=60) as r:
        path.write_bytes(r.read())


def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)]).strip())


def main(day, cues_only=False):
    src = OUT / 'scripts' / f'{day}.txt'
    ch = chapters(src.read_text(encoding='utf-8'))
    if cues_only:  # same spoken text: keep the recorded audio and its timings, refresh the tour cues only
        idx = json.loads((OUT / 'index.json').read_text())
        old = next(d for d in idx['days'] if d['date'] == day)
        assert len(old['chapters']) == len(ch), 'chapter count changed: record the audio again'
        for o, c in zip(old['chapters'], ch):
            s0 = o.get('s', 0); o.clear(); o.update(dict({'t': ' '.join(c['text'].replace('//', '').replace(' / ', ' ').replace('/', '').split()), 's': s0, 'f': c['fly']},
                                     **{k: c[k] for k in ('from', 'to', 'hq', 'moves', 'art') if c.get(k)}))
        (OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n')
        print(day, 'cues updated')
        return
    with tempfile.TemporaryDirectory() as tmp:
        parts, start = [], 0.0
        for i, c in enumerate(ch):
            p = Path(tmp) / f'{i:02d}.mp3'
            speak(c['text'], p)
            c['start'] = round(start, 2)
            start += duration(p)
            parts.append(p)
        lst = Path(tmp) / 'list.txt'
        lst.write_text(''.join(f"file '{p}'\n" for p in parts))
        subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(OUT / f'{day}.mp3')])
    idx_path = OUT / 'index.json'
    idx = json.loads(idx_path.read_text()) if idx_path.exists() else {'days': []}
    entry = {'date': day, 'audio': f'{day}.mp3', 'duration': round(start, 1), 'voice': VOICE,
             'chapters': [dict({'t': c['text'].replace('//', '').replace(' / ', ' ').replace('/', ''), 's': c['start'], 'f': c['fly']},
                               **{k: c[k] for k in ('from', 'to', 'hq', 'moves', 'art') if c.get(k)}) for c in ch]}
    for c in entry['chapters']:
        c['t'] = ' '.join(c['t'].split())
    idx['days'] = sorted([d for d in idx['days'] if d['date'] != day] + [entry], key=lambda d: d['date'], reverse=True)[:30]
    idx['latest'] = idx['days'][0]['date']
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n')
    print(day, len(ch), 'chapters', round(start, 1), 's', sum(len(c['text']) for c in ch), 'characters')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    for d in args:
        main(d, cues_only='--cues-only' in sys.argv)
