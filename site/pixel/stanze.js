/* ═══════════════════════════════════════════════════════════════════
 * LE STANZE
 *
 * Otto stanze della torre. Ognuna è una funzione che disegna e una che
 * risponde al dito: nessuna immagine, tutto calcolato al momento.
 *
 * Il contenuto è lo stesso del sito grande — regia, lavori, banchi,
 * tecnologia, materia, profilo, brief — tradotto in oggetti che si
 * possono manovrare invece che in paragrafi da leggere. La bilancia è
 * la testina umano/AI. Lo scriptorium sono i tre lavori generati. La
 * scheda del personaggio è il profilo. L'alchimista fa le sei domande
 * del brief.
 * ═══════════════════════════════════════════════════════════════════ */

import { C, RAMPE } from './tavolozza.js';
import { caso, rumore1 } from './motore.js';
import { torre, rune, bagliore } from './scena.js';

/* ── mattoni comuni ──────────────────────────────────────────────── */

/* la pietra della torre: fondale di quasi tutte le stanze interne */
function muro(sc, seme = 3) {
  sc.rettPieno(0, 0, sc.w, sc.h, C.OMBRA);
  const r = caso(seme);
  for (let y = 0, riga = 0; y < sc.h; y += 9, riga++) {
    sc.linea(0, y, sc.w, y, C.FONDO);
    for (let k = (riga % 2 ? 11 : 0); k < sc.w; k += 22)
      sc.linea(k, y, k, y + 8, C.FONDO);
    for (let k = (riga % 2 ? 11 : 0); k < sc.w; k += 22)
      if (r() > 0.72) sc.rettPieno(k + 2, y + 2, 17, 5, C.PORPORA_CUPA);
  }
  /* la luce cala verso il basso: sopra c'è la finestra */
  sc.sfuma(0, 0, sc.w, 26, [C.PORPORA_CUPA, C.OMBRA]);
  sc.sfuma(0, sc.h - 34, sc.w, 34, [C.OMBRA, C.FONDO]);
}

/* il pavimento in assi */
function assi(sc, y0) {
  sc.rettPieno(0, y0, sc.w, sc.h - y0, C.PORPORA_CUPA);
  for (let x = -8; x < sc.w; x += 19) sc.linea(x, y0, x + 8, sc.h, C.FONDO);
  sc.linea(0, y0, sc.w, y0, C.PORPORA);
}

/* un cartiglio: la targhetta con il nome della stanza */
export function cartiglio(sc, testo, colore = C.ORO) {
  const l = sc.misura(testo) + 12;
  const x = 4, y = 4;
  sc.rettPieno(x, y, l, 13, C.FONDO);
  sc.rett(x, y, l, 13, C.PORPORA_CUPA);
  sc.punto(x + 2, y + 2, colore); sc.punto(x + l - 3, y + 2, colore);
  sc.punto(x + 2, y + 10, colore); sc.punto(x + l - 3, y + 10, colore);
  sc.testo(x + 6, y + 3, testo, colore);
}

/* una barra da gioco di ruolo */
function barra(sc, x, y, l, quota, colore, fondo = C.PORPORA_CUPA) {
  sc.rettPieno(x, y, l, 5, fondo);
  sc.rettPieno(x, y, Math.round(l * Math.max(0, Math.min(1, quota))), 5, colore);
  sc.rett(x - 1, y - 1, l + 2, 7, C.FONDO);
}

/* il riquadro del dialogo, come nei giochi a turni */
function fumetto(sc, x, y, w, h, righe, colore = C.PERGAMENA) {
  sc.rettPieno(x, y, w, h, C.FONDO);
  sc.rett(x, y, w, h, C.ORO);
  sc.rett(x + 2, y + 2, w - 4, h - 4, C.PORPORA_CUPA);
  righe.forEach((r, i) => sc.testo(x + 6, y + 6 + i * 9, r, i === 0 ? C.ORPIMENTO : colore));
}

/* ═══ 1 · LA SOGLIA — il titolo ═══════════════════════════════════ */
const soglia = {
  id: 'soglia', nome: 'LA SOGLIA', num: '00',
  fondo(sc, S) {
    sc.sfuma(0, 0, sc.w, Math.round(sc.h * 0.62), RAMPE.notte);
    sc.sfuma(0, Math.round(sc.h * 0.44), sc.w, Math.round(sc.h * 0.2),
             [C.PORPORA_CUPA, C.LAPIS, C.PORPORA_CUPA]);
    const lx = Math.round(sc.w * 0.82), ly = Math.round(sc.h * 0.16);
    sc.alone(lx, ly, 30, C.PORPORA, 0.5);
    sc.alone(lx, ly, 18, C.LAPIS, 0.35);
    sc.cerchio(lx, ly, 11, C.PERGAMENA, true);
    sc.cerchio(lx, ly, 11, C.CALCE);
    const rl = caso(7);
    for (let i = 0; i < 9; i++) {
      const a = rl() * 6.28, d = rl() * 8;
      sc.cerchio(lx + Math.cos(a) * d, ly + Math.sin(a) * d, 1 + Math.floor(rl() * 2), C.ORO, true);
    }
    const oriz = Math.round(sc.h * 0.66);
    for (const [sm, amp, base, col, cresta] of
         [[S.seme + 11, 22, oriz - 6, C.PORPORA_CUPA, C.PORPORA],
          [S.seme + 29, 34, oriz + 4, C.OMBRA, C.PORPORA_CUPA]])
      for (let x = 0; x < sc.w; x++) {
        const n = rumore1(x / 46, sm) * 0.7 + rumore1(x / 17, sm + 1) * 0.3;
        const y = Math.round(base - n * amp);
        sc.rettPieno(x, y, 1, sc.h - y, col);
        sc.punto(x, y, cresta);
      }
    sc.rettPieno(0, Math.round(sc.h * 0.86), sc.w, sc.h, C.FONDO);
    sc.sfuma(0, Math.round(sc.h * 0.86), sc.w, 8, [C.OMBRA, C.FONDO]);
    torre(sc, Math.round(sc.w * 0.62), Math.round(sc.h * 0.78), S.seme);
  },
  disegna(sc, S, t) {
    const r = caso(20260906);
    for (let i = 0; i < 60; i++) {
      const x = Math.floor(r() * sc.w), y = Math.floor(r() * sc.h * 0.5);
      const fase = r() * 6.28, vel = 0.6 + r() * 1.6;
      const b = Math.sin(t * vel + fase);
      if (b > 0.55) sc.punto(x, y, b > 0.9 ? C.CALCE : C.PERGAMENA);
      else if (b > 0) sc.punto(x, y, C.PORPORA);
    }
    rune(sc, t);
  },
};

/* ═══ 2 · LA BILANCIA — la regia, umano contro macchina ══════════ */
const bilancia = {
  id: 'bilancia', nome: 'LA BILANCIA', num: '01',
  stato: { mix: 0.3 },
  fondo(sc) { muro(sc, 12); assi(sc, sc.h - 24); },
  disegna(sc, S, t) {
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
    const ax = 10, ay = 96, aw = 96, ah = 44;
    sc.rettPieno(ax, ay, aw, ah, C.FONDO);
    sc.rett(ax - 1, ay - 1, aw + 2, ah + 2, C.PORPORA);
    const ra = caso(1000 + Math.round(q * 20));
    const forme = 3 + Math.round(q * 9);
    for (let i = 0; i < forme; i++) {
      const w = 6 + ra() * 30 * (1 - q * 0.5), h = 4 + ra() * 15;
      const x = ax + 3 + ra() * (aw - w - 6), y = ay + 3 + ra() * (ah - h - 6);
      const c = i % 3 === 0 ? C.MINIO : q > 0.5 ? C.LAPIS : C.VERDERAME;
      if (ra() > 0.5) sc.rett(x, y, w, h, c); else sc.rettPieno(x, y, w, h, c);
    }

    /* La leva vera sta nella carta del testo, non qui: disegnarla
       due volte era un doppione, e sul largo finiva pure tagliata.
       Nel quadro resta solo la lettura. */
  },
};

/* ═══ 3 · LO SCRIPTORIUM — i lavori, tre pagine miniate ══════════ */
const scriptorium = {
  id: 'scriptorium', nome: 'LO SCRIPTORIUM', num: '02',
  stato: { semi: [1207, 3390, 7714], scelta: 0 },
  fondo(sc) { muro(sc, 21); assi(sc, sc.h - 26); },
  disegna(sc, S, t) {
    const titoli = ['GRAFICA', 'MOVIMENTO', 'SISTEMI'];
    this.stato.semi.forEach((seme, i) => {
      const x = 14 + i * 100, y = 30, w = 84, h = 104;
      const sel = i === this.stato.scelta;
      if (sel) sc.alone(x + w / 2, y + h / 2, 70, C.ORO, 0.22);
      pagina(sc, x, y, w, h, seme, sel, t);
      sc.testo(x + (w - sc.misura(titoli[i])) / 2, y + h + 5, titoli[i],
               sel ? C.ORO : C.PORPORA);
      sc.testo(x + (w - sc.misura('SEME ' + seme)) / 2, y + h + 15, 'SEME ' + seme,
               sel ? C.ORPIMENTO : C.PORPORA_CUPA);
    });
    sc.testo(4, sc.h - 11, 'TOCCA UNA PAGINA PER RIMINIARLA', C.PERGAMENA);
  },
};

/* una pagina miniata: cornice a nodi, capolettera, righe di scrittura */
function pagina(sc, x, y, w, h, seme, viva, t) {
  const r = caso(seme);
  sc.rettPieno(x, y, w, h, C.PERGAMENA);
  sc.rett(x, y, w, h, C.OMBRA);
  /* la cornice: nodi che cambiano col seme */
  const c1 = [C.CINABRO, C.LAPIS, C.VERDERAME, C.PORPORA][Math.floor(r() * 4)];
  const c2 = [C.ORO, C.ORPIMENTO, C.MINIO][Math.floor(r() * 3)];
  sc.rett(x + 2, y + 2, w - 4, h - 4, c1);
  for (let i = x + 4; i < x + w - 5; i += 4) {
    sc.punto(i, y + 4, c2); sc.punto(i, y + h - 5, c2);
  }
  for (let j = y + 4; j < y + h - 5; j += 4) {
    sc.punto(x + 4, j, c2); sc.punto(x + w - 5, j, c2);
  }
  /* il capolettera, in un riquadro d'oro */
  const cap = 'FAIMVS'[Math.floor(r() * 6)];
  sc.rettPieno(x + 8, y + 9, 20, 22, c1);
  sc.rett(x + 8, y + 9, 20, 22, C.ORO);
  sc.testo(x + 13, y + 15, cap, C.ORO, { scala: 2 });
  /* le righe di scrittura: trattini di lunghezza variabile */
  let ry = y + 11;
  for (let riga = 0; riga < 9; riga++) {
    const dax = riga < 3 ? x + 32 : x + 8;
    let px = dax;
    while (px < x + w - 9) {
      const l = 3 + Math.floor(r() * 7);
      if (px + l > x + w - 9) break;
      sc.linea(px, ry, px + l - 1, ry, C.OMBRA);
      px += l + 2;
    }
    ry += 5;
    if (ry > y + h - 22) break;
  }
  /* la miniatura in basso: una forma generata */
  const mx = x + 10, my = y + h - 20, mw = w - 20, mh = 13;
  sc.rettPieno(mx, my, mw, mh, C.FONDO);
  for (let i = 0; i < 5; i++) {
    const bw = 3 + r() * 12, bx = mx + 1 + r() * (mw - bw - 2);
    const bh = 2 + r() * (mh - 3), by = my + mh - 1 - bh;
    sc.rettPieno(bx, by, bw, bh, [c2, c1, C.MALACHITE][i % 3]);
  }
  if (viva) {
    const s = (Math.sin(t * 3) + 1) / 2;
    sc.rett(x - 1, y - 1, w + 2, h + 2, s > 0.5 ? C.ORO : C.ORPIMENTO);
  }
}

/* ═══ 4 · I QUATTRO BANCHI — i servizi ═══════════════════════════ */
const banchi = {
  id: 'banchi', nome: 'I QUATTRO BANCHI', num: '03',
  stato: { scelto: 0 },
  fondo(sc) { muro(sc, 33); assi(sc, sc.h - 40); },
  disegna(sc, S, t) {
    const NOMI = ['PENNELLI', 'MOVIOLA', 'ARALDICA', 'AUTOMI'];
    const SOTTO = ['grafica pubblicitaria', 'video e montaggio',
                   'social e declinazioni', 'flussi e prototipi AI'];
    const COL = [C.CINABRO, C.LAPIS, C.MALACHITE, C.PORPORA];
    for (let i = 0; i < 4; i++) {
      const x = 8 + i * 77, y = 26, w = 68, h = 62;
      const sel = i === this.stato.scelto;
      if (sel) sc.alone(x + w / 2, y + h / 2, 56, COL[i], 0.3);
      sc.rettPieno(x, y, w, h, C.FONDO);
      sc.rett(x, y, w, h, sel ? C.ORO : C.PORPORA_CUPA);
      banco(sc, x, y, w, h, i, t, sel);
      sc.testo(x + 4, y + h + 5, NOMI[i], sel ? C.ORO : C.PERGAMENA);
    }
    /* il nome esteso del banco scelto: la scelta si fa nella carta */
    const i = this.stato.scelto;
  },
};

/* ogni banco disegna il suo mestiere */
function banco(sc, x, y, w, h, tipo, t, viva) {
  const cx = x + w / 2, cy = y + h / 2;
  const r = caso(70 + tipo);
  if (tipo === 0) {                       /* pennelli e pigmenti */
    for (let i = 0; i < 5; i++) {
      const px = x + 9 + i * 11, ph = 14 + r() * 16;
      sc.rettPieno(px, cy + 12 - ph, 3, ph, C.OMBRA);
      sc.rettPieno(px - 1, cy + 12 - ph - 5, 5, 6,
                   [C.CINABRO, C.LAPIS, C.ORO, C.MALACHITE, C.MINIO][i]);
    }
    sc.linea(x + 4, cy + 13, x + w - 5, cy + 13, C.PORPORA);
  } else if (tipo === 1) {                /* moviola: fotogrammi che scorrono */
    const off = viva ? Math.floor(t * 14) % 12 : 0;
    for (let i = -1; i < 5; i++) {
      const fx = x + 5 + i * 12 - off;
      if (fx < x + 2 || fx > x + w - 12) continue;
      sc.rettPieno(fx, cy - 10, 10, 20, C.OMBRA);
      sc.rettPieno(fx + 1, cy - 8, 8, 12, i % 2 ? C.LAPIS : C.PORPORA_CUPA);
      sc.punto(fx + 1, cy + 7, C.PERGAMENA); sc.punto(fx + 8, cy + 7, C.PERGAMENA);
    }
    sc.linea(x + 2, cy - 12, x + w - 3, cy - 12, C.ORO);
    sc.linea(x + 2, cy + 12, x + w - 3, cy + 12, C.ORO);
  } else if (tipo === 2) {                /* araldica: tre scudi, tre formati */
    const F = [[10, 26], [16, 20], [20, 20]];
    F.forEach(([sw, sh], i) => {
      const sx = x + 8 + i * 19, sy = cy - sh / 2;
      sc.rettPieno(sx, sy, sw, sh - 5, C.MALACHITE);
      for (let k = 0; k < sw; k++)
        sc.linea(sx + k, sy + sh - 5, sx + sw / 2, sy + sh, C.MALACHITE);
      sc.rett(sx, sy, sw, sh - 5, C.ORO);
      sc.rettPieno(sx + 2, sy + 2, sw - 4, 3, C.ORPIMENTO);
    });
  } else {                                /* automi: un grafo che si accende */
    const nodi = [[0.2, 0.3], [0.5, 0.2], [0.8, 0.35], [0.35, 0.7], [0.7, 0.72]];
    const vivo = viva ? Math.floor(t * 2) % 5 : -1;
    for (let i = 0; i < nodi.length - 1; i++)
      sc.linea(x + nodi[i][0] * w, y + nodi[i][1] * h,
               x + nodi[i + 1][0] * w, y + nodi[i + 1][1] * h, C.PORPORA_CUPA);
    nodi.forEach(([nx, ny], i) => {
      const px = x + nx * w, py = y + ny * h;
      if (i === vivo) sc.alone(px, py, 12, C.PORPORA, 0.6);
      sc.cerchio(px, py, 3, i === vivo ? C.CALCE : C.PORPORA, true);
    });
  }
}

/* ═══ 5 · LA FORGIA — la tecnologia, locale contro cloud ═════════ */
const forgia = {
  id: 'forgia', nome: 'LA FORGIA', num: '04',
  stato: { modo: 2 },                       /* 0 locale · 1 cloud · 2 ibrido */
  fondo(sc) { muro(sc, 44); assi(sc, sc.h - 34); },
  disegna(sc, S, t) {
    const MODI = ['LOCALE', 'CLOUD', 'IBRIDO'];
    const NOTE = [
      ['CONTROLLO SU FILE E ITERAZIONI', 'CHIEDE FERRO E MANUTENZIONE'],
      ['I MODELLI PIU GRANDI, SUBITO', 'IL COSTO CRESCE COL CONSUMO'],
      ['PROTOTIPO QUI, PRODUCO LA', 'E COSI CHE TENGO INSIEME I CONTI'],
    ];
    const m = this.stato.modo;
    /* la fornace di sinistra: il ferro in casa */
    const f1 = m === 0 || m === 2 ? 1 : 0.18;
    fornace(sc, 46, 92, t, f1, C.MINIO);
    sc.testo(30, 116, 'FERRO IN CASA', f1 > 0.5 ? C.ORPIMENTO : C.PORPORA);
    /* la nuvola di destra: il fuoco lontano */
    const f2 = m === 1 || m === 2 ? 1 : 0.18;
    nuvola(sc, 246, 74, t, f2);
    sc.testo(226, 116, 'FUOCO LONTANO', f2 > 0.5 ? C.AZZURRITE || C.LAPIS : C.PORPORA);
    /* il condotto fra le due */
    for (let x = 74; x < 226; x += 6) {
      const on = m === 2 && Math.sin(t * 4 - x * 0.08) > 0;
      sc.punto(x, 96, on ? C.ORO : C.PORPORA_CUPA);
      sc.punto(x + 1, 96, on ? C.ORPIMENTO : C.PORPORA_CUPA);
    }
    /* la scelta si fa nella carta: qui resta il nome acceso */
  },
};

function fornace(sc, x, y, t, forza, colore) {
  sc.rettPieno(x - 22, y - 26, 44, 30, C.OMBRA);
  sc.rett(x - 22, y - 26, 44, 30, C.PORPORA_CUPA);
  sc.cerchio(x, y - 10, 11, C.FONDO, true);
  if (forza > 0.3) {
    sc.alone(x, y - 10, 26 * forza, C.DRAGO, 0.5 * forza);
    sc.alone(x, y - 10, 14 * forza, colore, 0.8 * forza);
  }
  /* le fiamme, tre lingue che ballano */
  for (let i = -1; i <= 1; i++) {
    const h = (5 + Math.sin(t * 6 + i * 2) * 3) * forza;
    for (let k = 0; k < h; k++)
      sc.punto(x + i * 4, y - 6 - k, k > h - 2 ? C.ORPIMENTO : colore);
  }
  sc.rettPieno(x - 26, y + 4, 52, 4, C.PORPORA_CUPA);
}

function nuvola(sc, x, y, t, forza) {
  const r = caso(9);
  for (let i = 0; i < 9; i++) {
    const cx = x + (r() - 0.5) * 52, cy = y + (r() - 0.5) * 16;
    sc.cerchio(cx, cy, 6 + r() * 7, forza > 0.5 ? C.LAPIS : C.PORPORA_CUPA, true);
  }
  if (forza > 0.5) {
    for (let i = 0; i < 9; i++) {
      const cx = x + (r() - 0.5) * 40, cy = y + (r() - 0.5) * 10;
      sc.cerchio(cx, cy - 3, 3 + r() * 4, C.AZZURRITE || C.LAPIS, true);
    }
    /* la saetta */
    if (Math.sin(t * 2.2) > 0.86) {
      sc.linea(x, y + 12, x - 5, y + 22, C.CALCE);
      sc.linea(x - 5, y + 22, x + 3, y + 20, C.CALCE);
      sc.linea(x + 3, y + 20, x - 2, y + 34, C.ORPIMENTO);
      sc.alone(x, y + 24, 22, C.CALCE, 0.3);
    }
  }
}

/* ═══ 6 · LA MATERIA — dodicimila punti, tre disposizioni ════════ */
const materia = {
  id: 'materia', nome: 'LA MATERIA', num: '05',
  stato: { forma: 0, mescola: 0 },
  fondo(sc) { sc.rettPieno(0, 0, sc.w, sc.h, C.FONDO); muroScuro(sc); },
  disegna(sc, S, t) {
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
};

function muroScuro(sc) {
  for (let y = 0; y < sc.h; y += 11)
    for (let x = 0; x < sc.w; x += 11)
      if ((x + y) % 22 === 0) sc.punto(x, y, C.OMBRA);
}

/* ═══ 7 · LA SCHEDA — il profilo, come in un gioco di ruolo ══════ */
const scheda = {
  id: 'scheda', nome: 'LA SCHEDA', num: '06',
  fondo(sc) { muro(sc, 55); assi(sc, sc.h - 22); },
  disegna(sc, S, t) {
    const x = 12, y = 22, w = sc.w - 24, h = sc.h - 40;
    sc.rettPieno(x, y, w, h, C.PERGAMENA);
    sc.rett(x, y, w, h, C.OMBRA);
    sc.rett(x + 2, y + 2, w - 4, h - 4, C.DRAGO);

    /* il ritratto: una figura di tre quarti, generata */
    ritratto(sc, x + 12, y + 12, t);

    sc.testo(x + 70, y + 12, 'FABRIZIO MANA', C.DRAGO, { scala: 2 });
    sc.testo(x + 70, y + 30, 'GRAFICO · VIDEO EDITOR · AI BUILDER', C.OMBRA);
    sc.linea(x + 70, y + 40, x + w - 12, y + 40, C.DRAGO);

    const ABIL = [
      ['IMMAGINE',   0.92, C.CINABRO],
      ['MONTAGGIO',  0.86, C.LAPIS],
      ['SISTEMI AI', 0.78, C.VERDERAME],
      ['CODICE',     0.71, C.PORPORA],
    ];
    ABIL.forEach(([n, v, c], i) => {
      const by = y + 48 + i * 14;
      sc.testo(x + 70, by, n, C.OMBRA);
      barra(sc, x + 138, by, 82, v, c, C.PERGAMENA);
      sc.testo(x + 226, by, String(Math.round(v * 100)), C.DRAGO);
    });

    /* l'inventario: gli strumenti veri */
    sc.testo(x + 12, y + 104, 'INVENTARIO', C.DRAGO);
    const INV = ['PHOTOSHOP', 'AFTER EFFECTS', 'PREMIERE', 'BLENDER',
                 'COMFYUI', 'OLLAMA', 'N8N', 'FIGMA'];
    /* tre colonne e non quattro: a quattro "AFTER EFFECTS" finiva
       addosso a "PREMIERE" — tredici lettere sono 78px, la colonna 68 */
    INV.forEach((n, i) => {
      /* tre righe da 10px a partire da y+114: cosi' l'ultima riga
         finisce a y+134, dentro la scheda alta 140 — prima l'ultima
         coppia di strumenti restava tagliata dal bordo */
      const ix = x + 12 + (i % 3) * 88, iy = y + 114 + Math.floor(i / 3) * 10;
      sc.punto(ix, iy + 3, C.ORO); sc.punto(ix + 1, iy + 2, C.ORO);
      sc.punto(ix + 1, iy + 4, C.ORO); sc.punto(ix + 2, iy + 3, C.ORO);
      sc.testo(ix + 6, iy, n, C.OMBRA);
    });
    cartiglio(sc, 'PROFILO · CHI STA NELLA TORRE', C.ORPIMENTO);
  },
};

function ritratto(sc, x, y, t) {
  sc.rettPieno(x, y, 50, 62, C.OMBRA);
  sc.rett(x, y, 50, 62, C.DRAGO);
  /* cappuccio */
  for (let j = 0; j < 30; j++) {
    const w = 30 - Math.abs(j - 14) * 0.6;
    sc.linea(x + 25 - w / 2, y + 8 + j, x + 25 + w / 2, y + 8 + j, C.PORPORA_CUPA);
  }
  /* volto in ombra, due occhi accesi */
  for (let j = 0; j < 16; j++)
    sc.linea(x + 15, y + 18 + j, x + 35, y + 18 + j, C.FONDO);
  const b = Math.sin(t * 2.4) > -0.9 ? C.ORPIMENTO : C.FONDO;
  sc.rettPieno(x + 19, y + 25, 4, 2, b);
  sc.rettPieno(x + 27, y + 25, 4, 2, b);
  /* spalle */
  sc.rettPieno(x + 10, y + 40, 30, 22, C.PORPORA_CUPA);
  sc.rettPieno(x + 22, y + 40, 6, 22, C.PORPORA);
  /* il sigillo sul petto */
  sc.cerchio(x + 25, y + 50, 5, C.ORO);
  sc.punto(x + 25, y + 50, C.ORPIMENTO);
}

/* ═══ 8 · L'ALCHIMISTA — il brief in sei domande ═════════════════ */
const DOMANDE = [
  ['CHE COSA TI SERVE?',      ['UNA CAMPAGNA', 'UN VIDEO', 'I SOCIAL', 'UN FLUSSO AI']],
  ['DA COSA PARTIAMO?',       ['DA ZERO', 'HO DEL MATERIALE', 'HO GIA UN MARCHIO']],
  ['DOVE DEVE FUNZIONARE?',   ['STAMPA', 'SOCIAL', 'SITO', 'DAPPERTUTTO']],
  ['QUANDO TI SERVE?',        ['SUBITO', 'FRA UN MESE', 'NON HO FRETTA']],
  ['CHE SUPPORTO CERCHI?',    ['UN PEZZO SOLO', 'UN PERCORSO', 'NON LO SO']],
  ['COME TI RICONTATTO?',     ['SCRIVIMI TU', 'TI SCRIVO IO']],
];

const alchimista = {
  id: 'alchimista', nome: "L'ALCHIMISTA", num: '07',
  stato: { passo: 0, scelte: [], fatto: false },
  fondo(sc) {
    muro(sc, 66); assi(sc, sc.h - 26);
    /* Lo scrittoio sta a sinistra e il dialogo a destra. Prima erano
       sovrapposti: il personaggio spariva dietro le sue stesse
       risposte, cioe' proprio la cosa che rende viva la stanza. */
    sc.rettPieno(92, 108, 136, 6, C.PORPORA);
    sc.rettPieno(100, 114, 6, 32, C.PORPORA_CUPA);
    sc.rettPieno(214, 114, 6, 32, C.PORPORA_CUPA);
    /* la libreria dietro */
    for (let r = 0; r < 3; r++) {
      const y = 30 + r * 22;
      sc.rettPieno(24, y + 16, 40, 3, C.PORPORA_CUPA);
      sc.rettPieno(252, y + 16, 40, 3, C.PORPORA_CUPA);
      for (let i = 0; i < 7; i++)
        for (const bx of [25 + i * 5, 253 + i * 5])
        sc.rettPieno(bx, y + 16 - (7 + (i * 3 + r * 5) % 8), 4,
                     7 + (i * 3 + r * 5) % 8,
                     [C.DRAGO, C.LAPIS, C.VERDERAME, C.PORPORA][(i + r) % 4]);
    }
  },
  disegna(sc, S, t) {
    /* l'alchimista, di tre quarti allo scrittoio */
    ritratto(sc, 135, 44, t);

    /* la candela */
    sc.rettPieno(108, 96, 4, 12, C.PERGAMENA);
    const fh = 4 + Math.sin(t * 7) * 1.5;
    sc.alone(110, 94, 26, C.MINIO, 0.4);
    sc.alone(110, 94, 12, C.ORPIMENTO, 0.7);
    for (let k = 0; k < fh; k++) sc.punto(110, 94 - k, k > fh - 2 ? C.CALCE : C.ORPIMENTO);

    /* l'alambicco che bolle */
    sc.cerchio(206, 100, 8, C.LAPIS, true);
    sc.cerchio(206, 100, 8, C.AZZURRITE);
    sc.rettPieno(204, 86, 4, 10, C.PORPORA_CUPA);
    for (let i = 0; i < 4; i++)
      sc.punto(206 + Math.sin(t * 3 + i) * 2, 84 - ((t * 20 + i * 6) % 24), C.MALACHITE);

    /* Le domande e le risposte stanno nella carta del testo: qui
       resta la scena, con un fumetto corto che dice a che punto sei.
       Prima il dialogo copriva il personaggio, cioe' la cosa viva. */
    /* Le parole stanno tutte nella carta del testo. Qui resta la
       scena: quando il brief e' finito, la stanza si illumina. */
    if (this.stato.fatto) sc.alone(160, 74, 74, C.MALACHITE, 0.26);
  },
  rispondi(i) {
    const [, risp] = DOMANDE[this.stato.passo];
    if (i < 0 || i >= risp.length) return false;
    this.stato.scelte.push(risp[i]);
    this.stato.passo++;
    if (this.stato.passo >= DOMANDE.length) this.stato.fatto = true;
    return true;
  },
  azzera() { this.stato = { passo: 0, scelte: [], fatto: false }; },
};

export const STANZE = [soglia, bilancia, scriptorium, banchi, forgia, materia, scheda, alchimista];
export const perId = Object.fromEntries(STANZE.map(s => [s.id, s]));
