# -*- coding: utf-8 -*-
"""Provini dei pezzi finiti del progetto esoscheletro.

Stessa idea di audit/provini-locanda.py: tre fotogrammi per pezzo, in
fila, con il nome accanto. Qui la cartella e' ancora piu' confusa —
2311 file, dentro ci sono tre copie di un sito web e una ventina di
spezzoni generati — e i nomi non dicono niente: "prova 3", "mp_",
"spot 2a".

uso: python audit/provini-eso.py
"""
import os, sys, subprocess, tempfile
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from PIL import Image, ImageDraw

BASE = os.path.join(os.environ['USERPROFILE'], 'Desktop', 'Robe varie', 'Esoscheletro')
FF = os.path.join(os.environ['USERPROFILE'], 'Desktop', 'Robe varie', 'Progetti AI',
                  'downloader', 'bin', 'ffmpeg.exe')
PROBE = FF.replace('ffmpeg.exe', 'ffprobe.exe')
FUORI = 'audit/provini'
os.makedirs(FUORI, exist_ok=True)

GRUPPI = {
 'eso-finiti': [
   'video/video nuovi/trailer completo.mp4',
   'video/video nuovi/trekking 1.mp4',
   'video/video nuovi/Human_robots_endcard_design_1080p_202608312119.mp4',
   'video/video vecchi/pubblicità esoscheletro.mp4',
   'video/video vecchi/spot 2a.mp4',
   'video/video vecchi/spot 3.mp4',
   'video/video vecchi/mp_.mp4',
   'video/video vecchi/hf_20260526_101421_8ca385ac-d7fe-4379-91be-72f89f59fa6d.mp4',
 ],
 'eso-nuovi': [
   'video/video nuovi/Man_hiking_with_robotic_device_20260912154731.mp4',
   'video/video nuovi/Man_navigating_mountain_ridge_1080p_20260912154720.mp4',
   'video/video nuovi/Man_walking_and_meeting_woman_202608312045.mp4',
   'video/video nuovi/Man_walking_dog_in_park_202608312037.mp4',
   'video/video nuovi/Man_walking_with_mobility_support_202608312037.mp4',
   'video/video nuovi/Woman_walking_with_robotic_device_20260912162738.mp4',
   'video/video nuovi/Man_walking_with_robotic_device_20260912162732.mp4',
   'video/video nuovi/Man_hiking_with_robotic_device_20260912162828.mp4',
 ],
 'eso-lunghi': [
   'documentazione/Creata da me/La_Rivoluzione_E-Legs.mp4',
   'documentazione/Creata da me/Robotica_Indossabile.mp4',
   'documentazione/Creata da me/Economia_ed_Ergonomia.mp4',
   'video/video vecchi/video presentazione sito internet.mp4',
   'esoscheletri/video/creati/prova 1.mp4',
   'esoscheletri/video/creati/prova 4.mp4',
   'esoscheletri/video/creati/prova 6.mp4',
 ],
}

ALTO = 220
QUANDO = (0.10, 0.45, 0.85)


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
            os.remove(p)
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
            righe.append((rel, riga, durata(f)))
    if not righe:
        continue
    L = max(r.width for _, r, _ in righe) + 340
    H = sum(r.height for _, r, _ in righe) + 8 * len(righe) + 8
    foglio = Image.new('RGB', (L, H), (12, 14, 18))
    d = ImageDraw.Draw(foglio)
    y = 4
    for i, (rel, riga, dur) in enumerate(righe):
        foglio.paste(riga, (340, y))
        d.text((10, y + 10), str(i + 1), fill=(0, 255, 140))
        d.text((34, y + 10), rel.split('/')[-1][:44], fill=(215, 225, 235))
        d.text((34, y + 26), '%d:%02d  ·  %s' % (dur // 60, dur % 60, rel.split('/')[0][:30]),
               fill=(110, 130, 150))
        y += riga.height + 8
    p = os.path.join(FUORI, '%s.jpg' % nome)
    foglio.save(p, quality=80)
    print('%s  (%d pezzi)  %dx%d' % (p, len(righe), foglio.size[0], foglio.size[1]))
