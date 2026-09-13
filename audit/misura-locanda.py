# -*- coding: utf-8 -*-
"""Che cosa c'e' davvero nella cartella della Locanda del Castello.

247 file, quasi tutti materiale di lavorazione: anteprime di Premiere,
salvataggi automatici, spezzoni generati da usare in montaggio. Quello
che si puo' mettere in un portfolio e' un'altra cosa, e per sceglierlo
serve prima vedere durata, forma e peso di ognuno.

uso: python audit/misura-locanda.py
"""
import os, sys, json, subprocess
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = os.path.join(os.environ['USERPROFILE'], 'Desktop', 'Robe varie', 'Locanda del Castello')
PROBE = os.path.join(os.environ['USERPROFILE'], 'Desktop', 'Robe varie', 'Progetti AI',
                     'downloader', 'bin', 'ffprobe.exe')
SALTA = ('Adobe Premiere', 'Auto-Save', 'Previews')

def sonda(f):
    out = subprocess.run([PROBE, '-v', 'quiet', '-print_format', 'json',
                          '-show_format', '-show_streams', f],
                         capture_output=True, text=True, encoding='utf-8', errors='replace')
    try:
        return json.loads(out.stdout)
    except Exception:
        return None

video, audio = [], []
for radice, _, files in os.walk(BASE):
    if any(s in radice for s in SALTA):
        continue
    for n in files:
        f = os.path.join(radice, n)
        est = n.rsplit('.', 1)[-1].lower()
        if est not in ('mp4', 'mov', 'mp3', 'wav', 'm4a'):
            continue
        d = sonda(f)
        if not d:
            continue
        dur = float(d.get('format', {}).get('duration', 0) or 0)
        mb = os.path.getsize(f) / 1e6
        rel = os.path.relpath(f, BASE)
        vs = next((s for s in d['streams'] if s['codec_type'] == 'video'), None)
        if vs:
            video.append((rel, dur, vs.get('width', 0), vs.get('height', 0), mb,
                          mb * 8 / dur if dur else 0))
        else:
            audio.append((rel, dur, mb))

video.sort(key=lambda r: r[0])
print('══ VIDEO (%d) ══' % len(video))
print('%-62s %7s %10s %8s %7s' % ('file', 'durata', 'forma', 'MB', 'Mbit/s'))
tot = 0
for rel, dur, w, h, mb, br in video:
    tot += mb
    print('%-62s %4d:%02d %10s %8.1f %7.1f'
          % (rel[-62:], dur // 60, dur % 60, '%dx%d' % (w, h), mb, br))
print('totale video: %.0f MB' % tot)

print('\n══ AUDIO (%d) ══' % len(audio))
audio.sort(key=lambda r: r[0])
for rel, dur, mb in audio:
    print('%-62s %4d:%02d %8.1f MB' % (rel[-62:], dur // 60, dur % 60, mb))
print('totale audio: %.0f MB' % sum(r[2] for r in audio))
