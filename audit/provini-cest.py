# -*- coding: utf-8 -*-
"""Cinque fotogrammi per ognuno dei sei pezzi di Cest, messi in fila.

Sei file soltanto, quindi non c'e' da scremare doppioni: c'e' da capire
che cosa mostrano, perche' i nomi ("ced 3", "ced finito") non lo dicono.
"""
import os, sys, subprocess, tempfile
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from PIL import Image, ImageDraw

BASE = os.path.join(os.environ['USERPROFILE'], 'Desktop', 'Robe varie', 'lavori', 'portfolio', 'Cest')
FF = os.path.join(os.environ['USERPROFILE'], 'Desktop', 'Robe varie', 'Progetti AI',
                  'downloader', 'bin', 'ffmpeg.exe')
PROBE = FF.replace('ffmpeg.exe', 'ffprobe.exe')
FUORI = sys.argv[1] if len(sys.argv) > 1 else '.'

ALTO = 250
QUANDO = (0.06, 0.28, 0.5, 0.72, 0.93)

def durata(f):
    d = subprocess.run([PROBE, '-v', 'quiet', '-show_entries', 'format=duration',
                        '-of', 'csv=p=0', f], capture_output=True, text=True)
    try: return float(d.stdout.strip())
    except Exception: return 1.0

lista = sorted(x for x in os.listdir(BASE) if x.lower().endswith('.mp4'))
righe = []
with tempfile.TemporaryDirectory() as tmp:
    for rel in lista:
        f = os.path.join(BASE, rel)
        dur = durata(f)
        ims = []
        for i, q in enumerate(QUANDO):
            p = os.path.join(tmp, '%d.jpg' % i)
            subprocess.run([FF, '-y', '-v', 'quiet', '-ss', '%.2f' % (dur * q), '-i', f,
                            '-frames:v', '1', '-vf', 'scale=-2:%d' % ALTO, p], check=False)
            if os.path.exists(p):
                ims.append(Image.open(p).convert('RGB')); os.remove(p)
        if not ims: continue
        larg = sum(i.width for i in ims) + 6 * (len(ims) - 1)
        riga = Image.new('RGB', (larg, ALTO), (16, 16, 16))
        x = 0
        for im in ims:
            riga.paste(im, (x, 0)); x += im.width + 6
        righe.append((rel, dur, riga))

L = max(r.width for _, _, r in righe) + 300
H = sum(r.height for _, _, r in righe) + 8 * len(righe) + 8
foglio = Image.new('RGB', (L, H), (12, 12, 14))
d = ImageDraw.Draw(foglio)
y = 4
for i, (rel, dur, riga) in enumerate(righe):
    foglio.paste(riga, (300, y))
    d.text((10, y + 10), str(i + 1), fill=(150, 200, 255))
    d.text((34, y + 10), rel[:40], fill=(225, 230, 240))
    d.text((34, y + 26), '%.1f s' % dur, fill=(110, 125, 145))
    y += riga.height + 8
p = os.path.join(FUORI, 'cest-provini.jpg')
foglio.save(p, quality=80)
print(p, foglio.size)
