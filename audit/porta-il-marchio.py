# -*- coding: utf-8 -*-
"""Il marchio della Locanda, nelle due forme che servono al sito.

Il file di partenza e' 5226x5226 e 3,4 MB: e' un master, non un file da
pagina. Sul sito serve a due misure diverse e per due lavori diversi.

1. LA TARGA — il marchio intero, "LA LOCANDA DEL CASTELLO · ROCCA DE'
   BALDI", sulla sua carta color crema. Non lo scontorno: il marchio e'
   bordeaux e oro, e su una lastra bordeaux sparirebbe. Sta su una targa
   crema, come l'insegna di una locanda vera. La carta del file e'
   #f5ecdd e la targa nel CSS e' lo stesso colore, quindi il bordo non
   si vede.

2. IL MONOGRAMMA — la sola "LC" col cancello e la stella, che ha gia' il
   fondo trasparente. Va nella scena come filigrana.

I tre colori del marchio non sono scelti a occhio, sono contati sui
pixel del file: crema #f5ecdd (83% dell'immagine), bordeaux #551a1e
(6%), oro #aa8043.

uso: python audit/porta-il-marchio.py
"""
import os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from PIL import Image

CASA = os.environ['USERPROFILE']
DENTRO = os.path.join(CASA, 'Desktop', 'Robe varie', 'Locanda del Castello', 'grafiche')
FUORI = os.path.join('site', 'v2', 'locanda')
CARTA = (245, 236, 221)

os.makedirs(FUORI, exist_ok=True)


def rifila(im, soglia=8):
    """Il riquadro di quello che non e' carta."""
    p = im.convert('RGB').load()
    w, h = im.size
    x0, y0, x1, y1 = w, h, 0, 0
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            r, g, b = p[x, y]
            if abs(r - CARTA[0]) + abs(g - CARTA[1]) + abs(b - CARTA[2]) > soglia * 3:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
    return x0, y0, x1, y1


# ── 1 · la targa ─────────────────────────────────────────────────────
src = Image.open(os.path.join(DENTRO, 'logo finito normale.png'))
carta = Image.new('RGB', src.size, CARTA)
carta.paste(src, (0, 0), src if src.mode == 'RGBA' else None)
x0, y0, x1, y1 = rifila(carta)
m = int(max(x1 - x0, y1 - y0) * 0.05)
carta = carta.crop((max(0, x0 - m), max(0, y0 - m),
                    min(src.width, x1 + m), min(src.height, y1 + m)))
q = 760.0 / carta.width
targa = carta.resize((760, round(carta.height * q)), Image.LANCZOS)
p = os.path.join(FUORI, 'marchio.webp')
targa.save(p, 'WEBP', quality=88, method=6)
print('%s  %dx%d  %.0f KB' % (p, targa.width, targa.height, os.path.getsize(p) / 1024))

# ── 2 · il monogramma ────────────────────────────────────────────────
mono = Image.open(os.path.join(DENTRO, 'solo logo.png')).convert('RGBA')
mono = mono.crop(mono.getbbox())
q = 520.0 / max(mono.size)
mono = mono.resize((round(mono.width * q), round(mono.height * q)), Image.LANCZOS)
p = os.path.join(FUORI, 'monogramma.webp')
mono.save(p, 'WEBP', quality=86, method=6)
print('%s  %dx%d  %.0f KB' % (p, mono.width, mono.height, os.path.getsize(p) / 1024))
