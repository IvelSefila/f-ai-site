# -*- coding: utf-8 -*-
"""Provini: tre fotogrammi per ogni pezzo finito, messi in fila.

Non si sceglie il meglio leggendo i nomi dei file. "serata fritto misto
finito2", "finito3" e "4" pesano tutti 24,5 MB e durano tutti 27
secondi: la differenza si vede solo guardandoli.

uso: python audit/provini-locanda.py
"""
import os, sys, subprocess, tempfile
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from PIL import Image, ImageDraw

BASE = os.path.join(os.environ['USERPROFILE'], 'Desktop', 'Robe varie', 'Locanda del Castello')
FF = os.path.join(os.environ['USERPROFILE'], 'Desktop', 'Robe varie', 'Progetti AI',
                  'downloader', 'bin', 'ffmpeg.exe')
PROBE = FF.replace('ffmpeg.exe', 'ffprobe.exe')
FUORI = 'audit/provini'
os.makedirs(FUORI, exist_ok=True)

GRUPPI = {
 'champagne': [
   'serata champagne/serata champagne finito.mp4',
   'serata champagne/serate champagne finito.mp4',
   'serata champagne/serate champagne finito_1.mp4',
   'serata champagne/terza degustazione finale.mp4',
   'serata champagne/ultima locandina.mp4',
   'serata champagne/degustazione finita.mp4',
   'serata champagne/primo flute.mp4',
   'serata champagne/seconda degustazione.mp4',
   'serata champagne/prima serata/corretta/locandina animata prima serata degustazione finita.mp4',
   'video/serate champagne.mp4',
 ],
 'fritto': [
   'serata fritto misto/serata fritto misto finito2.mp4',
   'serata fritto misto/serata fritto misto finito3.mp4',
   'serata fritto misto/serata fritto misto4.mp4',
   'serata fritto misto/nuovo/fritto nuovo.mp4',
   'serata fritto misto/serata fritto misto.mp4',
   'serata fritto misto/serata fritto misto 2.mp4',
   'serata fritto misto/video2.mp4',
 ],
 'altri': [
   'Serata Karaoke/serata karaoke corretto.mp4',
   'Serata Karaoke/serata karaoke corretto1.mp4',
   'Serata Karaoke/locandina karaoke generica.mp4',
   'video/comunioni e cresime etc + musica.mp4',
   'video/generica eventi .mp4',
   'video/giornata benessere.mp4',
   'generico/generico.mp4',
   'generico/generico 2.mp4',
 ],
}

ALTO = 230          # altezza di ogni fotogramma nel provino
QUANDO = (0.12, 0.45, 0.82)


def durata(f):
    d = subprocess.run([PROBE, '-v', 'quiet', '-show_entries', 'format=duration',
                        '-of', 'csv=p=0', f], capture_output=True, text=True)
    try:
        return float(d.stdout.strip())
    except Exception:
        return 1.0


def fotogrammi(f, tmp):
    dur = durata(f)
    fuori = []
    for i, q in enumerate(QUANDO):
        p = os.path.join(tmp, '%d.jpg' % i)
        subprocess.run([FF, '-y', '-v', 'quiet', '-ss', '%.2f' % (dur * q), '-i', f,
                        '-frames:v', '1', '-vf', 'scale=-2:%d' % ALTO, p], check=False)
        if os.path.exists(p):
            fuori.append(Image.open(p).convert('RGB'))
    return fuori


for nome, lista in GRUPPI.items():
    righe = []
    with tempfile.TemporaryDirectory() as tmp:
        for rel in lista:
            f = os.path.join(BASE, *rel.split('/'))
            if not os.path.exists(f):
                print('manca:', rel)
                continue
            ims = fotogrammi(f, tmp)
            if not ims:
                print('niente fotogrammi:', rel)
                continue
            larg = sum(i.width for i in ims) + 6 * (len(ims) - 1)
            riga = Image.new('RGB', (larg, ALTO), (16, 16, 16))
            x = 0
            for im in ims:
                riga.paste(im, (x, 0))
                x += im.width + 6
            righe.append((rel, riga))
    if not righe:
        continue
    L = max(r.width for _, r in righe) + 320
    H = sum(r.height for _, r in righe) + 8 * len(righe) + 8
    foglio = Image.new('RGB', (L, H), (12, 14, 12))
    d = ImageDraw.Draw(foglio)
    y = 4
    for i, (rel, riga) in enumerate(righe):
        foglio.paste(riga, (320, y))
        d.text((10, y + 10), str(i + 1), fill=(240, 210, 140))
        d.text((34, y + 10), rel.split('/')[-1][:42], fill=(215, 225, 205))
        d.text((34, y + 26), rel[:46], fill=(110, 130, 105))
        y += riga.height + 8
    p = os.path.join(FUORI, 'locanda-%s.jpg' % nome)
    foglio.save(p, quality=82)
    print('%s  (%d pezzi)  %dx%d' % (p, len(righe), foglio.size[0], foglio.size[1]))
