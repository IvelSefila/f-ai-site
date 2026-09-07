# -*- coding: utf-8 -*-
"""Tre difetti visti guardando le fotografie, non i numeri.

1 · La nuvola davanti alla luna era una macchia tonda piu' piccola
    della luna: non leggeva come nuvola. Ora e' larga il doppio, con
    il fondo piatto e la cimasa a bozzoli, come si disegna una nuvola
    in pixel.

2 · Nello scriptorium le tre pagine non stanno nel fondale: le disegna
    il codice, sopra, in un altro posto. I miei riquadri erano sui
    leggii dipinti, che le pagine coprono. Ora seguono le pagine vere.

3 · Il lampo riempiva la finestra di bianco pieno e ne cancellava il
    telaio: sembrava un foglio di carta appeso al muro. Un alone a
    retino lascia passare la struttura.
"""
import io

P = 'site/pixel/stanze.js'
s = io.open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s


def n(t):
    return t.replace('\n', '\r\n') if crlf else t


def scambia(vecchio, nuovo, cosa):
    global s
    v = n(vecchio)
    assert s.count(v) == 1, 'non trovato: ' + cosa
    s = s.replace(v, n(nuovo))


# === 1 · la nuvola ==================================================
scambia('''      const nx = cx - 80 + c * 160;
      const d = Math.sin(c * Math.PI);            /* entra e esce piano */
      for (const [dx, dy, r] of [[-22, 4, 9], [-10, -4, 13], [2, -7, 15], [14, -3, 12], [24, 4, 9]])
        sc.alone(nx + dx, cy + dy, r * (0.6 + d * 0.4), C.PORPORA_CUPA, 0.95);
      for (const [dx, dy, r] of [[-8, -8, 7], [4, -11, 8]])
        sc.alone(nx + dx, cy + dy, r * (0.6 + d * 0.4), C.PORPORA, 0.5);''',
'''      const nx = cx - 118 + c * 236;
      const d = 0.55 + Math.sin(c * Math.PI) * 0.45;   /* entra e esce piano */
      /* Una nuvola in pixel si disegna cosi': il fondo piatto, perche'
         e' li' che l'aria smette di salire, e sopra una fila di
         bozzoli di grandezza diversa. Tonda e sola era una macchia. */
      sc.rettPieno(nx - 44 * d, cy + 3, 88 * d, 7 * d + 2, C.PORPORA_CUPA);
      for (const [dx, dy, r] of [[-38, 3, 8], [-25, -3, 13], [-9, -9, 18],
                                 [9, -6, 15], [25, 0, 12], [38, 4, 8]])
        sc.alone(nx + dx * d, cy + dy * d, r * d, C.PORPORA_CUPA, 0.96);
      /* la cimasa presa dalla luna che sta coprendo */
      for (const [dx, dy, r] of [[-11, -14, 8], [8, -11, 7], [-27, -8, 5]])
        sc.alone(nx + dx * d, cy + dy * d, r * d, C.PORPORA, 0.55);
      sc.retino(nx - 44 * d, cy + 8 * d + 2, 88 * d, 4, C.FONDO, C.OMBRA, 0.5);''',
        'nuvola')

# === 2 · le pagine dello scriptorium ================================
scambia('''    { nome: 'libro0',     x: 30,  y: 76, w: 70, h: 40 },
    { nome: 'libro1',     x: 142, y: 76, w: 64, h: 40 },
    { nome: 'libro2',     x: 240, y: 76, w: 70, h: 40 },
    { nome: 'candelabro', x: 196, y: 48, w: 40, h: 62 },''',
'''    /* Le tre pagine non sono nel fondale: le disegna il codice qui
       sopra, a 14 + i*100, larghe 84 e alte 104. I riquadri seguono
       quelle, non i leggii dipinti che stanno sotto. */
    { nome: 'libro0',     x: 14,  y: 30, w: 84, h: 104 },
    { nome: 'libro1',     x: 114, y: 30, w: 84, h: 104 },
    { nome: 'libro2',     x: 214, y: 30, w: 84, h: 104 },
    { nome: 'candelabro', x: 199, y: 48, w: 34, h: 30 },''',
        'riquadri scriptorium')

scambia("  LEGGII: [[65, 96, 64], [174, 96, 58], [275, 96, 64]],",
        "  LEGGII: [[56, 82, 80], [156, 82, 80], [256, 82, 80]],",
        'centri delle pagine')

# === 3 · il lampo ===================================================
scambia('''        sc.alone(258, 60, 300, C.AZZURRITE, 0.30 * f);
        sc.alone(258, 60, 120, C.CALCE, 0.45 * f);
        sc.retino(216, 6, 88, 116, C.CALCE, C.CALCE, f * 0.9);''',
'''        /* Il lampo illumina, non cancella. Un rettangolo di calce
           piena riempiva la finestra e ne mangiava il telaio: sembrava
           un foglio appeso al muro. Un alone a retino lascia passare
           i montanti e i vetri. */
        sc.alone(258, 60, 300, C.AZZURRITE, 0.34 * f);
        sc.alone(258, 60, 96, C.CALCE, 0.62 * f);
        sc.alone(258, 52, 52, C.CALCE, 0.78 * f);''',
        'lampo')

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('ritoccati: nuvola, pagine, lampo')
