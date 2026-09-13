# -*- coding: utf-8 -*-
"""Davide il lama, scontornato bene.

Il problema di questa immagine e' che Davide E' color fondo. Maglione
crema su fondo crema, scarpe bianche su fondo crema, punte delle
orecchie quasi trasparenti. Misurato: il fondo pulito sta a 210,201,194
e una costa chiara del maglione sta a 212,202,194 — due punti di
distanza. Qualunque soglia sul colore, da sola, o si mangia il maglione
o lascia lo sfondo.

Quindi il colore non decide da solo. Decide insieme al RILIEVO: la
differenza fra il pixel piu' chiaro e il piu' scuro in un quadratino di
cinque. Sul fondo vale 1-3, sulla maglia a coste 54. E' la trama, e la
trama e' quello che un fondo di studio non ha.

Il riempimento parte dal bordo e puo' camminare solo dove il rilievo e'
basso: arriva ovunque nel fondo, e si ferma di netto sul maglione, che
e' un muro di trama anche quando ha lo stesso colore. Da li' in poi:

- dove il colore e' identico al fondo, trasparente;
- dove si allontana, il bordo sfuma invece di tagliare (le orecchie
  vivono qui: chiare, ma non quanto il fondo);
- dove e' lo STESSO colore moltiplicato per un numero sotto uno, e'
  l'ombra per terra — luce in meno, non materia in piu' — e va via.
  Questa regola vale solo dentro la zona raggiunta dal riempimento,
  se no si mangerebbe la meta' in ombra del maglione, che pure e'
  crema moltiplicato per poco meno di uno.

uso: python audit/scontorna-davide.py
"""
import os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from PIL import Image, ImageFilter, ImageChops

SRC = os.path.join(os.environ['USERPROFILE'], 'Desktop', 'Robe varie', 'lavori',
                   'portfolio', 'Union Energia per Roberto Baldizzone', 'davide il lama.png')
DST = 'site/v2/lavori/davide-lama.webp'
PROVA = os.path.join(os.environ.get('SCRATCH', '.'), 'davide-prova.png')

RILIEVO = 6  # trama massima perche' un pixel sia attraversabile
VARCO   = 400      # e distanza massima dal colore del fondo
FRANGIA = 7        # larghezza della fascia sfumata sul contorno (dispari)
BASSA   = 10.0     # dentro la fascia: sotto e' fondo, sopra e' Davide
ALTA    = 30.0
SPALLA  = 24       # colonne di bordo da cui leggo il fondo di ogni riga

im = Image.open(SRC).convert('RGB')
w, h = im.size
p = im.load()
print('originale: %dx%d' % (w, h))

# ── il rilievo, cioe' la trama ───────────────────────────────────────
g = im.convert('L')
rng = ImageChops.difference(g.filter(ImageFilter.MaxFilter(5)),
                            g.filter(ImageFilter.MinFilter(5)))
rp = rng.load()

# ── il fondo di ogni riga ────────────────────────────────────────────
# Mediana delle prime e ultime colonne: Davide sta al centro e non le
# tocca mai. Riga per riga perche' il fondo e' una sfumatura: in alto a
# sinistra e' 212,202,195, in basso a destra 217,210,206.
fondo = []
for y in range(h):
    rs, gs, bs = [], [], []
    for x in list(range(SPALLA)) + list(range(w - SPALLA, w)):
        r, gg, b = p[x, y]
        rs.append(r); gs.append(gg); bs.append(b)
    rs.sort(); gs.sort(); bs.sort()
    fondo.append((rs[SPALLA], gs[SPALLA], bs[SPALLA]))

# ── distanza dal fondo, ombra, e cosa si puo' attraversare ───────────
dist = bytearray(w * h)
ombra = bytearray(w * h)
varco = bytearray(w * h)
for y in range(h):
    fr, fg, fb = fondo[y]
    ry = y * w
    for x in range(w):
        r, gg, b = p[x, y]
        dr, dg, db = r - fr, gg - fg, b - fb
        d = (dr * dr + dg * dg + db * db) ** 0.5
        i = ry + x
        dist[i] = 255 if d > 255 else int(d)
        if rp[x, y] < RILIEVO and d < VARCO:
            varco[i] = 1

# ── il riempimento, che cammina solo nei varchi ──────────────────────
sfondo = bytearray(w * h)
pila = []
def semina(i):
    if varco[i] and not sfondo[i]:
        sfondo[i] = 1; pila.append(i)
for x in range(w):
    semina(x); semina((h - 1) * w + x)
for y in range(h):
    semina(y * w); semina(y * w + w - 1)
while pila:
    i = pila.pop()
    x, y = i % w, i // w
    for j in ((i - 1) if x else -1, (i + 1) if x < w - 1 else -1,
              (i - w) if y else -1, (i + w) if y < h - 1 else -1):
        if j >= 0 and not sfondo[j] and varco[j]:
            sfondo[j] = 1; pila.append(j)
print('fondo raggiunto dal bordo: %.0f%%' % (sum(sfondo) * 100.0 / (w * h)))

# ── il fondo chiuso dentro la sagoma ─────────────────────────────────
# Fra le due gambe c'e' un cuneo di fondo che dal bordo non si raggiunge:
# in alto lo chiude il cavallo dei pantaloni, in basso le scarpe con la
# loro ombra. Stessa cosa per una macchia sotto la scarpa destra. Se
# restano, su una lastra lime sono due buchi color crema.
#
# Distinguerli dalle zone lisce che sono Davide e' facile una volta
# misurato. Le isole lisce non raggiunte, sopra i 200 pixel, sono
# diciassette: quindici stanno dentro i pantaloni e distano 243-300 dal
# colore del fondo (il velluto scuro), due distano 2,8 e 12,9 — sono il
# cuneo e la macchia. In mezzo non c'e' niente: fra 13 e 65 il vuoto.
# La soglia a 35 sta comoda in quel vuoto.
CHIUSO, MINIMA = 35.0, 200
visto = bytearray(w * h)
chiuse = 0
for i0 in range(w * h):
    if visto[i0] or sfondo[i0] or not varco[i0]:
        continue
    stack, cel = [i0], []
    visto[i0] = 1
    while stack:
        i = stack.pop(); cel.append(i)
        x, y = i % w, i // w
        for j in ((i - 1) if x else -1, (i + 1) if x < w - 1 else -1,
                  (i - w) if y else -1, (i + w) if y < h - 1 else -1):
            if j >= 0 and not visto[j] and varco[j] and not sfondo[j]:
                visto[j] = 1; stack.append(j)
    if len(cel) < MINIMA:
        continue
    ds = sorted(dist[i] for i in cel)
    if ds[len(ds) // 2] < CHIUSO:
        for i in cel:
            sfondo[i] = 1
        chiuse += len(cel)
print('fondo chiuso dentro la sagoma: %d pixel' % chiuse)

# ── l'ombra per terra ────────────────────────────────────────────────
# Resta una pozza sotto le scarpe. Non e' liscia abbastanza per il
# riempimento (la finestra da cinque la legge a 9-13 di rilievo, e alzare
# la soglia a 14 apre la strada dentro le scarpe, che sono lisce e color
# fondo: provato, e mangia mezza suola).
#
# Ma l'ombra ha una firma che le scarpe non hanno: e' il colore del
# fondo MOLTIPLICATO per un numero sotto uno. Tre canali nella stessa
# proporzione, tutti piu' bassi. Le scarpe bianche stanno a 0,98-1,01
# rispetto al fondo — non passano. E la crescita parte solo da dove il
# fondo e' gia' certo, quindi dentro Davide non puo' nascere.
K_OMBRA, SCARTO, RILIEVO_OMBRA = 0.93, 0.10, 24
pila = [i for i in range(w * h) if sfondo[i]]
cresciuta = 0
while pila:
    i = pila.pop()
    x, y = i % w, i // w
    for j in ((i - 1) if x else -1, (i + 1) if x < w - 1 else -1,
              (i - w) if y else -1, (i + w) if y < h - 1 else -1):
        if j < 0 or sfondo[j]:
            continue
        jx, jy = j % w, j // w
        if rp[jx, jy] >= RILIEVO_OMBRA:
            continue
        fr, fg, fb = fondo[jy]
        r, gg, b = p[jx, jy]
        k1, k2, k3 = r / fr, gg / fg, b / fb
        k = (k1 + k2 + k3) / 3
        if k < K_OMBRA and k > 0.15 and max(k1, k2, k3) - min(k1, k2, k3) < SCARTO:
            sfondo[j] = 1; cresciuta += 1; pila.append(j)
print("ombra per terra: %d pixel" % cresciuta)

# ── la maschera ──────────────────────────────────────────────────────
# Quello che il riempimento ha raggiunto e' fondo e basta: ci e' arrivato
# camminando nel liscio dal bordo dell'immagine, e dentro Davide non si
# entra senza attraversare trama. Vale anche per l'ombra per terra, che
# e' liscia quanto il fondo.
#
# Ma la finestra del rilievo e' cinque pixel, quindi il riempimento si
# ferma due pixel PRIMA del contorno vero, e quei due pixel di crema
# resterebbero attaccati a Davide come un alone. Nella fascia subito
# fuori dal riempimento non decido per connessione ma per colore: quello
# che li' e' ancora color fondo se ne va, quello che e' Davide resta, e
# in mezzo il bordo sfuma invece di tagliare. Le punte delle orecchie
# non passano di qui: hanno trama, il riempimento non le ha mai
# sfiorate, sono piene per definizione.
raggiunto = Image.new('L', (w, h), 0)
rr = raggiunto.load()
for i in range(w * h):
    if sfondo[i]:
        rr[i % w, i // w] = 255
fascia = raggiunto.filter(ImageFilter.MaxFilter(FRANGIA)).load()

masc = Image.new('L', (w, h), 255)
mp = masc.load()
scala = 255.0 / (ALTA - BASSA)
for i in range(w * h):
    x, y = i % w, i // w
    if sfondo[i]:
        mp[x, y] = 0
    elif fascia[x, y]:
        d = dist[i]
        mp[x, y] = 0 if d <= BASSA else min(255, int((d - BASSA) * scala))

# ── una sola macchia: Davide ─────────────────────────────────────────
visto = bytearray(w * h)
migliore, quanti = None, 0
for i0 in range(w * h):
    if visto[i0] or mp[i0 % w, i0 // w] < 12:
        continue
    stack, isola = [i0], []
    visto[i0] = 1
    while stack:
        i = stack.pop(); isola.append(i)
        x, y = i % w, i // w
        for j in ((i - 1) if x else -1, (i + 1) if x < w - 1 else -1,
                  (i - w) if y else -1, (i + w) if y < h - 1 else -1):
            if j >= 0 and not visto[j] and mp[j % w, j // w] >= 12:
                visto[j] = 1; stack.append(j)
    if len(isola) > quanti:
        migliore, quanti = isola, len(isola)
print("Davide e' il %.0f%% dell'immagine" % (quanti * 100.0 / (w * h)))
pulita = Image.new('L', (w, h), 0)
pp = pulita.load()
for i in migliore:
    pp[i % w, i // w] = mp[i % w, i // w]
masc = pulita.filter(ImageFilter.GaussianBlur(0.5))

out = im.convert('RGBA')
out.putalpha(masc)

# rifilo sul serio: getbbox terrebbe anche un alone da 1 su 255
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
print('rifilato: %dx%d' % out.size)
out.save(DST, 'WEBP', quality=86, method=6)
print('%s · %.0f KB' % (DST, os.path.getsize(DST) / 1024))

# il provino sul lime vero della campagna, che e' dove finisce davvero
lime = Image.new('RGB', out.size, (140, 198, 62))
lime.paste(out, (0, 0), out)
lime.save(PROVA)
print('provino: ' + PROVA)
