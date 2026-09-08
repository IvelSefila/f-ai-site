# -*- coding: utf-8 -*-
"""Le tre stanze disegnate a codice passano sui fondali generati.

Erano le tre brutte, e non per caso: dove c'e' un fondale la stanza e'
un posto, dove non c'e' sono rettangoli e cerchi su un muro finto. Ora
il fondale c'e' per tutte e otto, e il codice torna a fare quello che
sa fare — le cose che si muovono e rispondono al dito.

Le coordinate vengono dalla griglia stampata sui fondali veri
(audit/griglia.mjs). Nessuna e' stimata a occhio.

E lo scriptorium: le tre pagine coprivano il muro, le candele e i
leggii, cioe' tutta la stanza. Rimpicciolite e abbassate sui leggii
dipinti, la stanza si vede e le quattro candele diventano toccabili.
"""
import io

P = 'site/pixel/stanze.js'
s = io.open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s


def n(t):
    return t.replace('\n', '\r\n') if crlf else t


def scambia(v, nu, cosa):
    global s
    a = n(v)
    assert s.count(a) == 1, 'non trovato: ' + cosa
    s = s.replace(a, n(nu))


# ═══ 01 · LA BILANCIA ═══════════════════════════════════════════════
scambia("  fondo(sc) { muro(sc, 12); assi(sc, sc.h - 24); },",
        "  fondo(sc) { if (!versa(sc, 'bilancia')) { muro(sc, 12); assi(sc, sc.h - 24); } },",
        'fondo bilancia')

scambia('''  /* il colpetto sposta la bilancia dove hai toccato, come una mano
     che appoggia un peso sul piatto */
  colpetto(p, S, aggiorna) {
    this.stato.mix = Math.max(0, Math.min(1, (p.x - 20) / (320 - 40)));
    aggiorna();
  },''',
'''  /* I due piatti della bilancia dipinta: quello caldo con i pennelli
     e la penna d'oca, quello freddo con gli ingranaggi e la lente. */
  oggetti: [
    { nome: 'mano',     x: 70,  y: 76, w: 66, h: 52 },
    { nome: 'macchina', x: 174, y: 78, w: 64, h: 50 },
  ],
  vivi: {},
  toccaOggetto(p, S) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    /* toccare un piatto ci appoggia un peso: la bilancia va di la' */
    const passo = 0.18;
    this.stato.mix = Math.max(0, Math.min(1,
      this.stato.mix + (o === 'mano' ? -passo : passo)));
    this.vivi[o] = { t: 0 };
    return 'aggiorna';        /* il tocco e' servito, ma la carta va avvisata */
  },
  /* il colpetto altrove sposta la bilancia dove hai toccato, come una
     mano che appoggia un peso a mezz'aria */
  colpetto(p, S, aggiorna) {
    this.stato.mix = Math.max(0, Math.min(1, (p.x - 20) / (320 - 40)));
    aggiorna();
  },''',
        'oggetti bilancia')

VECCHIO_BIL = '''  disegna(sc, S, t) {
    const q = this.stato.mix;                    /* 0 = tutto umano */
    const cx = sc.w / 2, cy = 54;
    const inc = (q - 0.5) * 20;
    sc.linea(cx, 24, cx, cy, C.PORPORA);
    sc.linea(cx - 58, cy - inc, cx + 58, cy + inc, C.ORO);
    sc.cerchio(cx, cy, 3, C.ORPIMENTO, true);

    /* i due piatti: l'etichetta sta SOTTO il piatto, non addosso */
    for (const [sx, lab, col, val] of [[-58, 'MANO', C.MINIO, 1 - q],
                                       [ 58, 'MACCHINA', C.LAPIS, q]]) {
      const py = cy + (sx < 0 ? -inc : inc) + 14;
      sc.linea(cx + sx, cy + (sx < 0 ? -inc : inc), cx + sx, py, C.PORPORA_CUPA);
      sc.linea(cx + sx - 15, py, cx + sx + 15, py, C.ORO);
      sc.alone(cx + sx, py - 5, 14 + val * 14, col, 0.22 + val * 0.42);
      const nq = Math.round(val * 7);
      for (let i = 0; i < nq; i++)
        sc.cerchio(cx + sx - 11 + (i % 4) * 7, py - 4 - Math.floor(i / 4) * 5, 2, col, true);
      sc.testo(cx + sx - sc.misura(lab) / 2, py + 5, lab, C.PERGAMENA);
    }

    /* l'artefatto, a sinistra, con l'etichetta sopra */
    const ax = 10, ay = 96, aw = 96, ah = 44;'''

NUOVO_BIL = '''  disegna(sc, S, t, dt) {
    const q = this.stato.mix;                    /* 0 = tutto umano */

    /* La bilancia adesso e' dipinta nel fondale, con i due piatti al
       loro posto: il codice non la ridisegna piu' sopra: la accende.
       Il piatto che pesa di piu' brilla, l'altro si spegne. */
    const V = this.vivi;
    const botta = (nome) => {
      const c = corsa(V, nome, 0.9, dt);
      return c === null ? 0 : Math.sin(c * Math.PI);
    };
    const bM = botta('mano'), bA = botta('macchina');
    const respiro = 0.86 + Math.sin(t * 2.4) * 0.14;

    for (const [px, py, col, val, extra] of [[102, 108, C.MINIO, 1 - q, bM],
                                             [206, 110, C.AZZURRITE, q, bA]]) {
      sc.alone(px, py, 26 + val * 20 + extra * 12, col,
               (0.10 + val * 0.34) * respiro + extra * 0.3);
      sc.alone(px, py, 11 + extra * 8, C.CALCE, val * 0.16 + extra * 0.28);
      /* le faville quando ci appoggi un peso */
      if (extra > 0.02) {
        const r = caso(px);
        for (let i = 0; i < 16; i++) {
          const a = -Math.PI * r(), d = (1 - extra) * 34 * (0.4 + r());
          sc.punto(px + Math.cos(a) * d, py + Math.sin(a) * d * 0.7,
                   i % 3 ? col : C.CALCE);
        }
      }
    }

    /* Il grano d'oro che scorre sulla stanga dipinta: e' lui a dire
       dove sta la bilancia, senza ridisegnare la stanga. */
    const gx = 108 + q * 100, gy = 41 + (q - 0.5) * 3;
    sc.linea(108, 41, 208, 41, C.PORPORA_CUPA);
    sc.cerchio(gx, gy, 3, C.ORO, true);
    sc.cerchio(gx, gy, 1, C.CALCE, true);
    sc.alone(gx, gy, 8, C.ORPIMENTO, 0.5);

    /* l'artefatto: appeso al muro nudo fra i due piatti */
    const ax = 128, ay = 48, aw = 66, ah = 44;'''
scambia(VECCHIO_BIL, NUOVO_BIL, 'disegna bilancia')

# la coda del disegno della bilancia: la lettura in basso a sinistra
scambia('''    /* La leva vera sta nella carta del testo, non qui: disegnarla
       due volte era un doppione, e sul largo finiva pure tagliata.
       Nel quadro resta solo la lettura. */''',
'''    /* La leva vera sta nella carta del testo, non qui: disegnarla
       due volte era un doppione, e sul largo finiva pure tagliata.
       Nel quadro resta solo la lettura. */''', 'commento leva')


# ═══ 05 · LA MATERIA ════════════════════════════════════════════════
scambia("  fondo(sc) { sc.rettPieno(0, 0, sc.w, sc.h, C.FONDO); muroScuro(sc); },",
        "  fondo(sc) { if (!versa(sc, 'materia')) { sc.rettPieno(0, 0, sc.w, sc.h, C.FONDO); muroScuro(sc); } },",
        'fondo materia')

scambia('''  /* il colpetto cambia disposizione e sparpaglia i punti dal dito */
  colpetto(p, S, aggiorna) {
    this.stato.forma = (this.stato.forma + 1) % 3;
    this.stato.spinta = { x: p.x, y: p.y, t: 0 };
    aggiorna();
  },''',
'''  /* l'astrolabio, il libro e i due bracieri verdi della stanza */
  oggetti: [
    { nome: 'astrolabio', x: 126, y: 98,  w: 34, h: 34 },
    { nome: 'libro',      x: 160, y: 106, w: 34, h: 26 },
    { nome: 'braciere',   x: 52,  y: 98,  w: 34, h: 30 },
    { nome: 'braciere',   x: 234, y: 98,  w: 34, h: 30 },
  ],
  vivi: {},
  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0 };
    return true;
  },
  /* il colpetto altrove cambia disposizione e sparpaglia i punti */
  colpetto(p, S, aggiorna) {
    this.stato.forma = (this.stato.forma + 1) % 3;
    this.stato.spinta = { x: p.x, y: p.y, t: 0 };
    aggiorna();
  },''',
        'oggetti materia')

VECCHIO_MAT = '''  disegna(sc, S, t) {
    const NOMI = ['GRIGLIA', 'NASTRO', 'RETE'];
    const N = 1400;
    const r = caso(77);
    const f = this.stato.forma;
    const cx = sc.w / 2, cy = 92;
    for (let i = 0; i < N; i++) {
      const u = r(), v = r(), w = r();
      let x, y;
      if (f === 0) {                              /* griglia */
        x = cx - 84 + (i % 48) * 3.5; y = cy - 40 + Math.floor(i / 48) * 2.7;
      } else if (f === 1) {                       /* nastro */
        const a = u * 6.28 * 2;
        x = cx + Math.cos(a) * (88 - v * 10);
        y = cy + Math.sin(a * 0.5 + t * 0.3) * 34 * (0.4 + v * 0.6);
      } else {                                    /* rete */
        const a = u * 6.28, d = Math.sqrt(v) * 82;
        x = cx + Math.cos(a) * d; y = cy + Math.sin(a) * d * 0.46;
      }
      if (y < 18 || y > 148) continue;
      const c = w > 0.86 ? C.ORO : w > 0.66 ? C.MALACHITE
              : w > 0.42 ? C.LAPIS : w > 0.2 ? C.PORPORA : C.MINIO;
      sc.punto(x, y, c);
    }
  },
};'''

NUOVO_MAT = '''  disegna(sc, S, t, dt) {
    /* La nuvola di punti sta dove il fondale la dipinge, sopra il
       ripiano di pietra: prima era piu' in basso, su un muro finto, e
       si vedeva che era un'altra cosa attaccata sopra. */
    const N = 1400;
    const r = caso(77);
    const f = this.stato.forma;
    const cx = 152, cy = 64;
    const V = this.vivi;
    const gira = corsa(V, 'astrolabio', 1.8, dt);
    const sfoglia = corsa(V, 'libro', 1.2, dt);
    const fuoco = corsa(V, 'braciere', 1.6, dt);
    /* toccare l'astrolabio fa respirare tutta la nuvola */
    const soffio = gira === null ? 1 : 1 + Math.sin(gira * Math.PI) * 0.34;

    for (let i = 0; i < N; i++) {
      const u = r(), v = r(), w = r();
      let x, y;
      if (f === 0) {                              /* griglia */
        x = cx - 74 + (i % 48) * 3.1; y = cy - 26 + Math.floor(i / 48) * 1.9;
      } else if (f === 1) {                       /* nastro */
        const a = u * 6.28 * 2;
        x = cx + Math.cos(a) * (78 - v * 9) * soffio;
        y = cy + Math.sin(a * 0.5 + t * 0.3) * 26 * (0.4 + v * 0.6) * soffio;
      } else {                                    /* rete */
        const a = u * 6.28, d = Math.sqrt(v) * 74 * soffio;
        x = cx + Math.cos(a) * d; y = cy + Math.sin(a) * d * 0.42;
      }
      if (y < 12 || y > 104) continue;
      const c = w > 0.86 ? C.ORO : w > 0.66 ? C.MALACHITE
              : w > 0.42 ? C.LAPIS : w > 0.2 ? C.PORPORA : C.MINIO;
      sc.punto(x, y, c);
    }

    /* l'astrolabio gira: l'anello d'ottone si accende e ruota */
    if (gira !== null) {
      const g = gira * 13, vv = Math.sin(gira * Math.PI);
      for (let i = 0; i < 10; i++) {
        const a = g + i * 0.628;
        sc.punto(143 + Math.cos(a) * 12, 114 + Math.sin(a) * 12 * 0.5,
                 i % 2 ? C.ORO : C.ORPIMENTO);
      }
      sc.alone(143, 114, 20 * vv, C.ORO, 0.34 * vv);
    }

    /* il libro si sfoglia: una falda chiara passa sulle pagine */
    if (sfoglia !== null) {
      const larga = (1 - Math.cos(sfoglia * Math.PI)) / 2 * 26;
      sc.rettPieno(176 - larga / 2 + 13 - 13, 112, larga, 13, C.PERGAMENA);
      sc.rettPieno(176 - 13, 112, 1, 13, C.OMBRA_TERRA);
      sc.alone(176, 118, 16, C.CALCE, 0.2 * Math.sin(sfoglia * Math.PI));
    }

    /* i bracieri divampano di verde, tutti e due insieme */
    if (fuoco !== null) {
      const vv = Math.sin(fuoco * Math.PI);
      for (const bx of [68, 250]) {
        sc.alone(bx, 112, 14 + vv * 16, C.MALACHITE, 0.28 + vv * 0.4);
        sc.alone(bx, 110, 5 + vv * 6, C.CALCE, 0.3 + vv * 0.4);
        for (let i = 0; i < 10; i++) {
          const su = ((t * 1.4 + i / 10) % 1);
          sc.punto(bx + Math.sin(su * 7 + i) * (2 + su * 6), 110 - su * 34 * vv,
                   su < 0.4 ? C.CALCE : C.MALACHITE);
        }
      }
    }
  },
};'''
scambia(VECCHIO_MAT, NUOVO_MAT, 'disegna materia')


# ═══ 06 · LA SCHEDA ═════════════════════════════════════════════════
scambia("  fondo(sc) { muro(sc, 55); assi(sc, sc.h - 22); },",
        "  fondo(sc) { if (!versa(sc, 'scheda')) { muro(sc, 55); assi(sc, sc.h - 22); } },",
        'fondo scheda')

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('bilancia, materia e scheda passate sui fondali')
