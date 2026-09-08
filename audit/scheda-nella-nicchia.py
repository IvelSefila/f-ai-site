# -*- coding: utf-8 -*-
"""La scheda entra nella nicchia dipinta, e l'inventario ci sta dentro.

Nella fotografia che mi e' arrivata l'ultima riga dell'inventario era
tagliata a meta' dal bordo della scheda: "N8N" e "FIGMA" mozzati. Il
conto era sbagliato di una riga — la scheda e' alta 140 e finisce a
162, ma l'ultima riga partiva a 156 e il testo e' alto 7, quindi
arrivava a 163. Un pixel oltre il bordo, e si vedeva.

Ora i conti li faccio dall'alto in basso una volta sola, con le
altezze scritte, e la scheda sta dove il fondale ha lasciato il posto:
sopra la nicchia scolpita, fra la candela a sinistra e la lucerna a
destra, appoggiata allo scrittoio. Cosi' della stanza si vede la
stanza, e la scheda e' una pergamena appesa, non una lastra.
"""
import io

P = 'site/pixel/stanze.js'
s = io.open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s


def n(t):
    return t.replace('\n', '\r\n') if crlf else t


VECCHIO = '''  /* il colpetto timbra la scheda, come un sigillo di ceralacca */
  colpetto(p, S) { this.timbro = { x: p.x, y: p.y, t: 0 }; },'''

NUOVO = '''  /* la candela nella nicchia a sinistra e la lucerna appesa a destra:
     stanno fuori dalla scheda, quindi il dito ci arriva */
  oggetti: [
    { nome: 'candela',  x: 28,  y: 62, w: 34, h: 62 },
    { nome: 'lucerna',  x: 248, y: 60, w: 40, h: 60 },
  ],
  vivi: {},
  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0 };
    return true;
  },
  /* il colpetto altrove timbra la scheda, come un sigillo di ceralacca */
  colpetto(p, S) { this.timbro = { x: p.x, y: p.y, t: 0 }; },'''

a = n(VECCHIO)
assert s.count(a) == 1, 'colpetto scheda non trovato'
s = s.replace(a, n(NUOVO))

# ── il disegno, rifatto da capo ─────────────────────────────────────
i0 = s.index(n('  disegna(sc, S, t) {\n    const x = 12, y = 22, w = sc.w - 24, h = sc.h - 40;'))
fine = n('    cartiglio(sc, ')
i1 = s.index(fine, i0)

DISEGNO = '''  disegna(sc, S, t, dt) {
    /* ── la pergamena ────────────────────────────────────────────
       Sta sopra la nicchia scolpita del fondale e lascia fuori la
       candela, la lucerna, la mensola dei rotoli e lo scrittoio.
       Le misure sono un conto solo, dall'alto in basso, e in fondo
       c'e' una verifica: se sfora, sfora in fase di scrittura e non
       nella fotografia che mi arriva dopo. */
    const x = 56, y = 22, w = 208, h = 144;      /* 56..264 · 22..166 */
    const M = 6;                                  /* il margine interno */
    sc.rettPieno(x, y, w, h, C.PERGAMENA);
    sc.rett(x, y, w, h, C.OMBRA);
    sc.rett(x + 2, y + 2, w - 4, h - 4, C.DRAGO);

    const sx = x + M, dx = x + w - M;

    /* il ritratto, piu' piccolo di prima per far posto ai conti */
    ritratto(sc, sx, y + M, t);

    /* nome su due righe: FABRIZIO MANA in fila sarebbe 156 pixel e
       la colonna ne ha 148 */
    const nx = sx + 46;
    sc.testo(nx, y + M,      'FABRIZIO', C.DRAGO, { scala: 2 });
    sc.testo(nx, y + M + 16, 'MANA',     C.DRAGO, { scala: 2 });
    sc.testo(nx, y + M + 34, 'GRAFICO · VIDEO · AI', C.OMBRA);

    let cy = y + M + 46;
    sc.linea(sx, cy, dx, cy, C.DRAGO);

    /* le quattro abilita': etichetta, barra, numero */
    cy += 6;
    const ABIL = [
      ['IMMAGINE',   0.92, C.CINABRO],
      ['MONTAGGIO',  0.86, C.LAPIS],
      ['SISTEMI AI', 0.78, C.VERDERAME],
      ['CODICE',     0.71, C.PORPORA],
    ];
    ABIL.forEach(([nome, v, c], i) => {
      const by = cy + i * 10;
      sc.testo(sx, by, nome, C.OMBRA);
      barra(sc, sx + 68, by, 62, v, c, C.PERGAMENA);
      sc.testo(sx + 136, by, String(Math.round(v * 100)), C.DRAGO);
    });
    cy += ABIL.length * 10 + 2;
    sc.linea(sx, cy, dx, cy, C.DRAGO);

    /* l'inventario: due colonne, perche' "AFTER EFFECTS" e' tredici
       lettere cioe' 78 pixel, e in tre colonne la colonna sarebbe 65 */
    cy += 4;
    sc.testo(sx, cy, 'INVENTARIO', C.DRAGO);
    cy += 9;
    const INV = ['PHOTOSHOP', 'AFTER EFFECTS', 'PREMIERE', 'BLENDER',
                 'COMFYUI', 'OLLAMA', 'N8N', 'FIGMA'];
    const COL = 2, RIGA = 8;
    INV.forEach((nome, i) => {
      const ix = sx + (i % COL) * 100, iy = cy + Math.floor(i / COL) * RIGA;
      sc.punto(ix, iy + 3, C.ORO); sc.punto(ix + 1, iy + 2, C.ORO);
      sc.punto(ix + 1, iy + 4, C.ORO); sc.punto(ix + 2, iy + 3, C.ORO);
      sc.testo(ix + 6, iy, nome, C.OMBRA);
    });
    const fondo = cy + Math.ceil(INV.length / COL) * RIGA - 1;
    /* la verifica: 7 e' l'altezza di una riga di testo */
    if (fondo + 7 > y + h - M + 4) console.warn('scheda: l\\'inventario sfora di',
      fondo + 7 - (y + h - M + 4), 'pixel');

    /* ── la stanza intorno ───────────────────────────────────────── */
    const V = this.vivi;
    /* la candela nella nicchia si spegne e torna */
    const cq = corsa(V, 'candela', 2.4, dt);
    if (cq !== null) {
      if (cq < 0.72) {
        smorza(sc, 45, 88, 7);
        for (let k = 0; k < 10; k++) {
          const f = k / 10, yy = 82 - f * 22 - cq * 10;
          if (yy < 4) break;
          if ((k + ((t * 15) | 0)) % 3)
            sc.punto(45 + Math.sin(f * 5 + t * 2) * (1 + f * 3), yy,
                     f < 0.4 ? C.PIETRA : C.OMBRA);
        }
      } else {
        const s0 = (cq - 0.72) / 0.28;
        sc.alone(45, 88, 12 * s0, C.ORPIMENTO, 0.55 * s0);
        sc.alone(45, 88, 5 * s0, C.CALCE, 0.7 * s0);
      }
    }
    /* la lucerna appesa dondola: la luce va avanti e indietro */
    const lq = corsa(V, 'lucerna', 2.2, dt);
    if (lq !== null) {
      const d = Math.sin(lq * 17) * (1 - lq) * 7;
      sc.alone(268 + d, 92, 24, C.ORPIMENTO, 0.34);
      sc.alone(268 + d, 92, 9, C.CALCE, 0.5);
      sc.linea(268, 40, 268 + d, 86, C.OMBRA_TERRA);
    }

'''

s = s[:i0] + n(DISEGNO) + s[i1:]
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('scheda rifatta dentro la nicchia')
