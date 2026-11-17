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
    out = []
    for para in [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]:
        fly = None
        m = re.match(r'@fly\s+(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\n', para + '\n')
        if m:
            fly = [float(m.group(1)), float(m.group(2))]
            para = para[m.end():].strip()
        out.append({'text': ' '.join(para.split()), 'fly': fly})
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


def main(day):
    src = OUT / 'scripts' / f'{day}.txt'
    ch = chapters(src.read_text(encoding='utf-8'))
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
             'chapters': [{'t': c['text'].replace('//', '').replace(' / ', ' ').replace('/', ''), 's': c['start'], 'f': c['fly']} for c in ch]}
    for c in entry['chapters']:
        c['t'] = ' '.join(c['t'].split())
    idx['days'] = sorted([d for d in idx['days'] if d['date'] != day] + [entry], key=lambda d: d['date'], reverse=True)[:30]
    idx['latest'] = idx['days'][0]['date']
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n')
    print(day, len(ch), 'chapters', round(start, 1), 's', sum(len(c['text']) for c in ch), 'characters')


if __name__ == '__main__':
    for d in sys.argv[1:]:
        main(d)
