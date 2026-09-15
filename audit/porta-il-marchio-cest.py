# -*- coding: utf-8 -*-
"""Il marchio CETS per la lastra.

Niente scontorno, qui, e non per pigrizia: il marchio E' un cerchio
bianco. Il bordo del cerchio e' verde, dentro c'e' bianco, dentro
ancora lo scudo. Togliere il bianco intorno lascerebbe comunque un
disco bianco su fondo blu — cioe' esattamente quello che si ottiene
mettendolo su una targa bianca, ma con un contorno a scaletta e due
volte il lavoro. Va sulla targa, come il marchio della Locanda.

Quindi: si taglia il margine bianco inutile (il file di partenza ne ha
parecchio), si porta a una misura da schermo e si salva in webp.

uso: python audit/porta-il-marchio-cest.py
"""
import os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from PIL import Image

CASA = os.environ['USERPROFILE']
DA = os.path.join(CASA, 'Desktop', 'Robe varie', 'lavori', 'portfolio', 'Cest', 'logo hd.jpg')
A = os.path.join('site', 'v2', 'cest', 'marchio.webp')

BIANCO = 246          # oltre questo, su tutti e tre i canali, e' fondo
MARGINE = 10          # un filo d'aria intorno, per non tagliare l'antialias
LATO = 760            # la stessa misura del marchio della Locanda

im = Image.open(DA).convert('RGB')
px = im.load()
L, H = im.size

def piena(riga_o_col, orizzontale):
    """Vero se in quella riga (o colonna) c'e' almeno un pixel non bianco."""
    if orizzontale:
        return any(min(px[x, riga_o_col]) < BIANCO for x in range(0, L, 2))
    return any(min(px[riga_o_col, y]) < BIANCO for y in range(0, H, 2))

alto = next(y for y in range(H) if piena(y, True))
basso = next(y for y in range(H - 1, -1, -1) if piena(y, True))
sx = next(x for x in range(L) if piena(x, False))
dx = next(x for x in range(L - 1, -1, -1) if piena(x, False))

box = (max(0, sx - MARGINE), max(0, alto - MARGINE),
       min(L, dx + MARGINE + 1), min(H, basso + MARGINE + 1))
im = im.crop(box)
print('%dx%d → %dx%d  (tagliati %d px in alto, %d a sinistra)'
      % (L, H, im.width, im.height, box[1], box[0]))

if im.width > LATO:
    im = im.resize((LATO, round(im.height * LATO / im.width)), Image.LANCZOS)
os.makedirs(os.path.dirname(A), exist_ok=True)
im.save(A, 'WEBP', quality=88, method=6)
print('%s  %dx%d  %.0f KB' % (A, im.width, im.height, os.path.getsize(A) / 1024))
