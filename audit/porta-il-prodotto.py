# -*- coding: utf-8 -*-
"""Il dispositivo e la tavola di riferimento.

Il render del prodotto sta su fondo bianco pieno e va scontornato: sulla
lastra scura un rettangolo bianco sarebbe un errore da principiante. Qui
lo scontorno e' facile — l'oggetto e' nero e rosso, il fondo e' bianco a
255 — e basta il riempimento dal bordo con una soglia stretta. Niente a
che vedere con Davide il lama, che era color fondo.

L'ombra sotto l'oggetto: e' grigia su bianco, quindi cade dentro la
soglia e se ne va da sola.

La tavola di riferimento invece resta com'e': e' un documento di lavoro,
nero su nero, e va mostrata come tale.

uso: python audit/porta-il-prodotto.py
"""
import os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from PIL import Image, ImageFilter

CASA = os.environ['USERPROFILE']
DENTRO = os.path.join(CASA, 'Desktop', 'Robe varie', 'Esoscheletro')
FUORI = os.path.join('site', 'v2', 'eso')
PROVA = os.path.join(os.environ.get('SCRATCH', '.'), 'prodotto-prova.png')

SOGLIA = 26        # quanto lontano dal bianco si puo' ancora camminare
os.makedirs(FUORI, exist_ok=True)

# ── il render, scontornato ───────────────────────────────────────────
src = os.path.join(DENTRO, 'esoscheletri', 'medio livello', 'lato 1.png')
im = Image.open(src).convert('RGB')
w, h = im.size
p = im.load()
print('render: %dx%d' % (w, h))

bianco = bytearray(w * h)
for y in range(h):
    ry = y * w
    for x in range(w):
        r, g, b = p[x, y]
        if 255 - r < SOGLIA and 255 - g < SOGLIA and 255 - b < SOGLIA:
            bianco[ry + x] = 1

fondo = bytearray(w * h)
pila = []
def semina(i):
    if bianco[i] and not fondo[i]:
        fondo[i] = 1; pila.append(i)
for x in range(w):
    semina(x); semina((h - 1) * w + x)
for y in range(h):
    semina(y * w); semina(y * w + w - 1)
while pila:
    i = pila.pop()
    x, y = i % w, i // w
    for j in ((i - 1) if x else -1, (i + 1) if x < w - 1 else -1,
              (i - w) if y else -1, (i + w) if y < h - 1 else -1):
        if j >= 0 and not fondo[j] and bianco[j]:
            fondo[j] = 1; pila.append(j)
print('fondo raggiunto dal bordo: %.0f%%' % (sum(fondo) * 100.0 / (w * h)))

# Dentro l'arco del telaio c'e' un'altra area bianca che dal bordo non
# si raggiunge: la chiudono le due gambe della struttura. Stessa cosa
# del cuneo fra le gambe di Davide. Qui pero' non serve nessuna astuzia
# per riconoscerla: il dispositivo e' nero e arancione, il bianco e'
# tutto fondo. Tolgo le isole bianche chiuse sopra i 400 pixel, e sotto
# i 400 le lascio, che sono i riflessi sulla plastica lucida.
visto = bytearray(w * h)
chiuse = 0
for i0 in range(w * h):
    if visto[i0] or fondo[i0] or not bianco[i0]:
        continue
    stack, cel = [i0], []
    visto[i0] = 1
    while stack:
        i = stack.pop(); cel.append(i)
        x, y = i % w, i // w
        for j in ((i - 1) if x else -1, (i + 1) if x < w - 1 else -1,
                  (i - w) if y else -1, (i + w) if y < h - 1 else -1):
            if j >= 0 and not visto[j] and bianco[j] and not fondo[j]:
                visto[j] = 1; stack.append(j)
    if len(cel) >= 400:
        for i in cel:
            fondo[i] = 1
        chiuse += len(cel)
print('bianco chiuso dentro il telaio: %d pixel' % chiuse)

masc = Image.new('L', (w, h), 255)
mp = masc.load()
for i in range(w * h):
    if fondo[i]:
        mp[i % w, i // w] = 0
masc = masc.filter(ImageFilter.GaussianBlur(0.6))

out = im.convert('RGBA')
out.putalpha(masc)
mp = masc.load()
x0, y0, x1, y1 = w, h, 0, 0
for y in range(h):
    for x in range(w):
        if mp[x, y] >= 16:
            if x < x0: x0 = x
            if x > x1: x1 = x
            if y < y0: y0 = y
            if y > y1: y1 = y
out = out.crop((max(0, x0 - 2), max(0, y0 - 2), min(w, x1 + 3), min(h, y1 + 3)))
q = 640.0 / max(out.size)
out = out.resize((round(out.width * q), round(out.height * q)), Image.LANCZOS)
d = os.path.join(FUORI, 'dispositivo.webp')
out.save(d, 'WEBP', quality=88, method=6)
print('%s  %dx%d  %.0f KB' % (d, out.width, out.height, os.path.getsize(d) / 1024))

scuro = Image.new('RGB', out.size, (8, 13, 22))
scuro.paste(out, (0, 0), out)
scuro.save(PROVA)
print('provino: ' + PROVA)

# ── la tavola di riferimento, com'e' ─────────────────────────────────
b = Image.open(os.path.join(DENTRO, 'board esoscheletro.png')).convert('RGB')
q = 1200.0 / b.width
b = b.resize((1200, round(b.height * q)), Image.LANCZOS)
d = os.path.join(FUORI, 'tavola.webp')
b.save(d, 'WEBP', quality=82, method=6)
print('%s  %dx%d  %.0f KB' % (d, b.width, b.height, os.path.getsize(d) / 1024))
