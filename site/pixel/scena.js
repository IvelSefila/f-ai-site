/* ═══════════════════════════════════════════════════════════════════
 * LA SCENA DEL TITOLO
 *
 * Niente immagini: ogni pixel è calcolato. Il cielo è una sfumatura a
 * retino fra quattro pigmenti, le montagne sono rumore, la torre è
 * costruita mattone per mattone da un seme, le rune galleggiano.
 *
 * È lo stesso principio del sito grande — "non è un'immagine caricata,
 * la disegna questa pagina adesso" — portato dove si vede di più.
 * ═══════════════════════════════════════════════════════════════════ */

import { C, RAMPE } from './tavolozza.js?v=20260908-141406';
import { caso, rumore1 } from './motore.js?v=20260908-141406';

/* i sigilli: sette glifi alchemici, 7×7, disegnati a mano.
   Sole, luna, mercurio, sale, zolfo, acqua, fuoco. */
const SIGILLI = [
  '..###../.#...#./#..#..#/#.###.#/#..#..#/.#...#./..###..',   /* sole */
  '..##.../.#..##/#....#/#....#/#....#/.#..##/..##...',        /* luna */
  '.#...#./..###../.#...#./#..#..#/.#...#./..#..../.#.#...',   /* mercurio */
  '.#####./#.....#/#..#..#/#######/#..#..#/#.....#/.#####.',   /* sale */
  '..###../.#...#./#.#.#.#/#..#..#/.#...#./..###../...#...',   /* zolfo */
  '#######/.#####./..###../...#.../......./......./.......',    /* acqua */
  '...#.../..###../..###../.#####./.#####./#######/#######',    /* fuoco */
].map(s => s.split('/'));

function sigillo(sc, x, y, i, c) {
  const g = SIGILLI[i % SIGILLI.length];
  for (let j = 0; j < g.length; j++)
    for (let k = 0; k < g[j].length; k++)
      if (g[j][k] === '#') sc.punto(x + k, y + j, c);
}

/* ── il cielo ─────────────────────────────────────────────────────
   Quattro pigmenti dal ferro-gallico alla porpora, poi una fascia di
   lapislazzuli verso l'orizzonte: è l'ora blu, quando gli alchimisti
   dicevano che la materia è più docile. */
function cielo(sc, t) {
  sc.sfuma(0, 0, sc.w, Math.round(sc.h * 0.62), RAMPE.notte);
  sc.sfuma(0, Math.round(sc.h * 0.44), sc.w, Math.round(sc.h * 0.2),
           [C.PORPORA_CUPA, C.LAPIS, C.PORPORA_CUPA]);

  /* stelle: posizione fissa dal seme, luce che pulsa a tempi diversi */
  const r = caso(20260906);
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(r() * sc.w), y = Math.floor(r() * sc.h * 0.5);
    const fase = r() * 6.28, vel = 0.6 + r() * 1.6;
    const b = Math.sin(t * vel + fase);
    if (b > 0.55) sc.punto(x, y, b > 0.9 ? C.CALCE : C.PERGAMENA);
    else if (b > 0) sc.punto(x, y, C.PORPORA);
  }

  /* la luna, con i suoi mari a retino */
  const lx = Math.round(sc.w * 0.82), ly = Math.round(sc.h * 0.16);
  sc.cerchio(lx, ly, 11, C.PERGAMENA, true);
  sc.cerchio(lx, ly, 11, C.CALCE);
  const rl = caso(7);
  for (let i = 0; i < 9; i++) {
    const a = rl() * 6.28, d = rl() * 8;
    sc.cerchio(lx + Math.cos(a) * d, ly + Math.sin(a) * d, 1 + Math.floor(rl() * 2), C.ORO, true);
  }
  /* alone */
  for (let g = 12; g < 17; g++)
    sc.retino(lx - g, ly - g, g * 2, g * 2, C.FONDO, C.PORPORA, (17 - g) / 22);
}

/* ── le montagne ──────────────────────────────────────────────────
   Due creste di rumore a frequenze diverse: quella dietro più chiara e
   più bassa, quella davanti più scura. La prospettiva aerea, cioè il
   trucco più vecchio che c'è. */
function montagne(sc) {
  const oriz = Math.round(sc.h * 0.66);
  for (const [seme, amp, base, col] of [[11, 22, oriz - 6, C.PORPORA_CUPA],
                                        [29, 34, oriz + 4, C.OMBRA]]) {
    for (let x = 0; x < sc.w; x++) {
      const n = rumore1(x / 46, seme) * 0.7 + rumore1(x / 17, seme + 1) * 0.3;
      const y = Math.round(base - n * amp);
      sc.rettPieno(x, y, 1, sc.h - y, col);
      sc.punto(x, y, col === C.OMBRA ? C.PORPORA_CUPA : C.PORPORA);
    }
  }
}

/* ── la torre ─────────────────────────────────────────────────────
   Costruita da un seme: altezza, merli, finestre e la posizione della
   stanza illuminata cambiano col seme, ma la torre resta una torre. */
export function torre(sc, x, base, seme) {
  const r = caso(seme);
  const larg = 30, alt = 78 + Math.floor(r() * 24);
  const cima = base - alt;

  /* La pietra: tre toni, non una sagoma. La luce viene da destra —
     dalla luna — quindi il fianco destro e' porpora, il centro ombra,
     il sinistro ferro-gallico. Cosi' la torre ha un volume. */
  sc.rettPieno(x, cima, larg, alt, C.OMBRA);
  sc.rettPieno(x + larg - 8, cima, 8, alt, C.PORPORA_CUPA);
  sc.rettPieno(x + larg - 3, cima, 3, alt, C.PORPORA);
  sc.rettPieno(x, cima, 5, alt, C.FONDO);

  /* i conci: sfalsati riga per riga, come si murava davvero */
  for (let y = cima + 5, riga = 0; y < base; y += 6, riga++) {
    sc.linea(x + 1, y, x + larg - 2, y, C.FONDO);
    for (let k = (riga % 2 ? 7 : 0); k < larg - 4; k += 14)
      sc.linea(x + 3 + k, y, x + 3 + k, Math.min(base - 1, y + 5), C.FONDO);
    /* qualche concio piu' chiaro: la pietra non e' uniforme */
    if (r() > 0.55) {
      const cx2 = x + 4 + Math.floor(r() * (larg - 9));
      sc.rettPieno(cx2, y + 1, 5, 4, r() > 0.5 ? C.PORPORA_CUPA : C.OMBRA);
    }
  }

  /* merli */
  for (let i = 0; i < larg - 2; i += 7) {
    sc.rettPieno(x + i, cima - 6, 5, 6, C.OMBRA);
    sc.rettPieno(x + i + 4, cima - 6, 1, 6, C.PORPORA_CUPA);
    sc.rettPieno(x + i, cima - 6, 1, 6, C.FONDO);
  }
  sc.linea(x, cima - 7, x + larg - 1, cima - 7, C.PORPORA);

  /* le finestre. Una sola e' accesa: la stanza dell'alchimista. */
  const accesa = 1 + Math.floor(r() * 2);
  let n = 0, luce = null;
  for (let y = cima + 14; y < base - 16; y += 20, n++) {
    const fx = x + 11 + (n % 2 ? 3 : -3);
    if (n === accesa) {
      luce = { x: fx + 3.5, y: y + 5 };
      sc.alone(luce.x, luce.y, 30, C.MINIO, 0.5);
      sc.alone(luce.x, luce.y, 15, C.ORPIMENTO, 0.8);
      sc.rettPieno(fx, y, 8, 11, C.ORPIMENTO);
      sc.rettPieno(fx + 1, y + 1, 6, 9, C.ORO);
      sc.rettPieno(fx + 2, y + 3, 4, 5, C.CALCE);
      /* la croce del telaio: senza, e' un rettangolo giallo */
      sc.linea(fx + 3, y, fx + 3, y + 10, C.DRAGO);
      sc.linea(fx, y + 5, fx + 7, y + 5, C.DRAGO);
    } else {
      sc.rettPieno(fx, y, 8, 11, C.FONDO);
      sc.rettPieno(fx + 1, y + 1, 6, 3, C.OMBRA);
    }
    sc.rett(fx - 1, y - 1, 10, 13, C.PORPORA_CUPA);
    /* arco a sesto acuto */
    sc.linea(fx - 1, y - 1, fx + 3, y - 5, C.PORPORA_CUPA);
    sc.linea(fx + 8, y - 1, fx + 4, y - 5, C.PORPORA_CUPA);
  }

  /* la porta, ad arco */
  const px = x + 11, py = base - 15;
  sc.rettPieno(px, py, 9, 15, C.FONDO);
  sc.cerchio(px + 4, py, 4, C.FONDO, true);
  sc.cerchio(px + 4, py, 4, C.PORPORA_CUPA);
  sc.linea(px, py, px, base - 1, C.PORPORA_CUPA);
  sc.linea(px + 8, py, px + 8, base - 1, C.PORPORA_CUPA);
  sc.punto(px + 6, base - 8, C.ORO);

  return { cima, larg, luce };
}

/* ── le rune che galleggiano ──────────────────────────────────────── */
/* `evita` sono cerchi in cui le rune non devono cadere, in coordinate
   logiche: [cx, cy, raggio]. Da quando la soglia ha il suo fondale
   dipinto, le posizioni tirate a caso finivano due volte su tre sopra
   una delle due lune, e li' una runa non e' un sigillo che fluttua nel
   buio: e' una macchiolina su un disco bianco. */
export function rune(sc, t, quante = 7, evita = []) {
  const r = caso(4821);
  const libero = (x, y) => evita.every(([cx, cy, rr]) =>
    (x - cx) ** 2 + (y - cy) ** 2 > rr * rr);
  for (let i = 0; i < quante; i++) {
    let bx = 0, by = 0;
    /* al massimo trenta tentativi, poi tengo l'ultimo: meglio una runa
       fuori posto che un ciclo che non finisce */
    for (let prova = 0; prova < 30; prova++) {
      bx = 20 + r() * (sc.w - 46);
      by = 26 + r() * (sc.h * 0.5);
      if (libero(bx, by)) break;
    }
    const vel = 0.25 + r() * 0.5, amp = 5 + r() * 9;
    const x = Math.round(bx + Math.sin(t * vel + i) * amp);
    const y = Math.round(by + Math.cos(t * vel * 0.7 + i * 2) * amp * 0.6);
    const luce = (Math.sin(t * 1.4 + i * 1.7) + 1) / 2;
    const c = luce > 0.75 ? C.CALCE : luce > 0.4 ? C.ORO : C.ORPIMENTO;
    if (luce > 0.5) sc.alone(x + 3, y + 3, 9 + luce * 5, C.PORPORA, luce * 0.5);
    sigillo(sc, x, y, i, c);
  }
}

/* ── il calderone: la fonte di luce che segue il dito ─────────────── */
export function bagliore(sc, x, y, t, forza = 1) {
  /* tre aloni concentrici, dal piu' largo e freddo al piu' stretto e
     caldo: e' cosi' che si rende una fiamma con quindici colori */
  sc.alone(x, y, 40 * forza, C.PORPORA, 0.35 * forza);
  sc.alone(x, y, 24 * forza, C.DRAGO,   0.55 * forza);
  sc.alone(x, y, 14 * forza, C.MINIO,   0.8 * forza);
  const p = 3 + Math.sin(t * 5) * 1.2;
  sc.cerchio(x, y, p + 2, C.ORPIMENTO, true);
  sc.cerchio(x, y, p, C.ORO, true);
  sc.cerchio(x, y, Math.max(1, p - 1.6), C.CALCE, true);
}

/* ── scintille ────────────────────────────────────────────────────── */
export class Scintille {
  constructor(max = 140) { this.p = []; this.max = max; }
  soffia(x, y, quante = 22, seme = Date.now()) {
    const r = caso(seme >>> 0);
    for (let i = 0; i < quante && this.p.length < this.max; i++) {
      const a = r() * 6.28, v = 12 + r() * 46;
      this.p.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 14,
                    vita: 0.6 + r() * 0.9, eta: 0 });
    }
  }
  passo(dt) {
    for (const s of this.p) {
      s.eta += dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.vy += 42 * dt;                       /* le scintille ricadono */
      s.vx *= 0.98;
    }
    this.p = this.p.filter(s => s.eta < s.vita);
  }
  disegna(sc) {
    for (const s of this.p) {
      const q = 1 - s.eta / s.vita;
      const c = q > 0.7 ? C.CALCE : q > 0.45 ? C.ORPIMENTO : q > 0.2 ? C.MINIO : C.DRAGO;
      sc.punto(s.x, s.y, c);
      if (q > 0.8) { sc.punto(s.x + 1, s.y, C.ORO); sc.punto(s.x, s.y + 1, C.ORO); }
    }
  }
}
