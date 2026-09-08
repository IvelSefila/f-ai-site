# -*- coding: utf-8 -*-
"""Le luci dipinte si muovono, in tutte e otto le stanze.

Non con fotogrammi in piu' — un fotogramma per stanza costa 138 KB
compressi, misurati, e otto stanze per quattro fotogrammi farebbero
4,4 megabyte, cioe' piu' di tre volte tutto il sito. Si fa come lo
facevano le macchine a 16 bit: l'immagine sta ferma e i pigmenti
scorrono lungo la loro rampa. Costo in byte: zero.

Le rampe non sono scelte a occhio. Per ogni zona ho contato quali
pigmenti ci stanno davvero (audit/quali-pigmenti.mjs) e ho preso solo
quelli della luce, non quelli del muro: alla prima prova sulla forgia
ciclava anche l'arco di pietra e sembrava uno stroboscopio.

L'alone della luna, per dire, non e' lapislazzuli come credevo: e'
indaco. Ciclare il lapis non avrebbe fatto niente, e non me ne sarei
accorto — nessun errore, solo una luna ferma.
"""
import io
import re

# ── 1 · le rampe giuste ────────────────────────────────────────────
P = 'site/pixel/tavolozza.js'
s = io.open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s
n = lambda t: t.replace('\n', '\r\n') if crlf else t

VECCHIO = '''  fuoco:   [[37, 9], [41, 10], [11, 46]],       /* la fornace */
  fiamma:  [[10, 11], [46, 47]],                /* candele e lucerne */
  verde:   [[33, 6], [34, 7]],                  /* ampolla e bracieri */
  polvere: [[45, 12], [46, 47], [34, 7]],       /* le scintille sospese */
  chiaro:  [[4, 30], [5, 31]],                  /* lune e aloni freddi */'''
NUOVO = '''  fuoco:   [[37, 9], [41, 10], [11, 46]],       /* la fornace */
  fiamma:  [[10, 11], [46, 47]],                /* candele e lucerne */
  /* il verderame scuro dei bracieri e il verde chiaro dell'ampolla:
     due posti diversi, due gradini diversi, una rampa sola */
  verde:   [[32, 33], [6, 34], [7, 35]],
  polvere: [[45, 12], [46, 47], [34, 7]],       /* le scintille sospese */
  /* L'alone della luna e' indaco, non lapislazzuli come avevo
     creduto. Ciclare il lapis non faceva niente, e non l'avrebbe
     detto nessuno: nessun errore, solo una luna ferma. */
  alone:   [[56, 57], [24, 25]],'''
assert s.count(n(VECCHIO)) == 1, 'cicli non trovati'
s = s.replace(n(VECCHIO), n(NUOVO))
io.open(P, 'w', encoding='utf-8', newline='').write(s)

# ── 2 · ogni stanza dichiara le sue luci ───────────────────────────
P = 'site/pixel/stanze.js'
s = io.open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s
n = lambda t: t.replace('\n', '\r\n') if crlf else t

# via la chiamata piantata a mano nella forgia: ora le fa il ciclo
V = """    /* Il fuoco dipinto si muove senza un fotogramma in piu': i suoi
       pigmenti scorrono lungo la catena calda. E' il trucco delle
       macchine a 16 bit, e qui serve perche' la fornace sta dentro
       l'immagine — senza, era la fotografia di un fuoco. */
    sc.ciclaTavolozza(30, 62, 34, 48, CICLI.fuoco, t * 7);

"""
assert s.count(n(V)) == 1, 'chiamata nella forgia non trovata'
s = s.replace(n(V), '')

# le zone, stanza per stanza: [x, y, w, h, rampa, velocita']
LUCI = {
    'soglia': """  /* l'alone delle due lune respira, e la finestra della torre
     tremola come una candela vista da lontano */
  cicli: [
    [50, 24, 58, 52, CICLI.alone, 1.1],
    [220, 14, 58, 52, CICLI.alone, 0.9],
    [203, 56, 16, 26, CICLI.fiamma, 5],
  ],
""",
    'bilancia': """  /* il braciere nel camino a sinistra e le candele sul banco */
  cicli: [
    [0, 104, 22, 56, CICLI.fuoco, 6],
    [44, 116, 34, 22, CICLI.fiamma, 4],
  ],
""",
    'scriptorium': """  /* le quattro candele del muro, una scatola stretta per ognuna:
     una fascia larga quanto la stanza ciclava soprattutto muro */
  cicli: [
    [23, 30, 11, 14, CICLI.fiamma, 5],
    [95, 24, 11, 14, CICLI.fiamma, 4.3],
    [125, 38, 11, 14, CICLI.fiamma, 5.7],
    [287, 20, 11, 14, CICLI.fiamma, 4.7],
  ],
""",
    'banchi': """  /* le tre lanterne appese */
  cicli: [
    [0, 36, 14, 20, CICLI.fiamma, 4],
    [150, 30, 14, 20, CICLI.fiamma, 4.6],
    [290, 36, 14, 20, CICLI.fiamma, 3.7],
  ],
""",
    'forgia': """  /* la fornace: la scatola sta stretta sulle fiamme, perche' presa
     larga ciclava anche l'arco di pietra e lampeggiava tutto */
  cicli: [[30, 62, 34, 48, CICLI.fuoco, 7]],
""",
    'materia': """  /* le scintille sospese e i due bracieri verdi */
  cicli: [
    [68, 26, 168, 76, CICLI.polvere, 2.4],
    [56, 100, 26, 24, CICLI.verde, 3.4],
    [238, 100, 26, 24, CICLI.verde, 3.1],
  ],
""",
    'scheda': """  /* la candela nella nicchia e la lucerna appesa */
  cicli: [
    [34, 76, 24, 26, CICLI.fiamma, 4.4],
    [256, 82, 26, 26, CICLI.fiamma, 3.8],
  ],
""",
    'alchimista': """  /* la candela sul tavolo e il verde dell'ampolla */
  cicli: [
    [118, 54, 18, 28, CICLI.fiamma, 5],
    [144, 86, 34, 32, CICLI.verde, 2.6],
  ],
""",
}

for stanza, blocco in LUCI.items():
    m = re.search(r"  id: '%s', nome: '[^']*', num: '\d+',\r?\n" % stanza, s)
    if not m:
        m = re.search(r'  id: \'%s\', nome: "[^"]*", num: \'\d+\',\r?\n' % stanza, s)
    assert m, 'stanza non trovata: ' + stanza
    s = s[:m.end()] + n(blocco) + s[m.end():]

io.open(P, 'w', encoding='utf-8', newline='').write(s)

# ── 3 · il ciclo li applica, appena versato il fondale ─────────────
P = 'site/pixel/gioco.js'
s = io.open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s
n = lambda t: t.replace('\n', '\r\n') if crlf else t
V = '  avanzaOnde(dt);'
assert s.count(n(V)) == 1
N = '''  /* Le luci dipinte si muovono qui, subito dopo il fondale e prima
     di tutto il resto: cosi' gli aloni e le fiamme che il codice
     disegna sopra restano loro e non finiscono nel ciclo. */
  if (st.cicli) for (const [x, y, w, h, rampa, vel] of st.cicli)
    sc.ciclaTavolozza(x, y, w, h, rampa, S.t * vel);
  avanzaOnde(dt);'''
s = s.replace(n(V), n(N))
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('le luci dipinte si muovono in tutte e otto le stanze')
