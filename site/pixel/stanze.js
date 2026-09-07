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

import { C, RAMPE } from './tavolozza.js?v=20260907-183858';
import { caso, rumore1 } from './motore.js?v=20260907-183858';
import { torre, rune, bagliore } from './scena.js?v=20260907-183858';
import { sfondo } from './sfondi.js?v=20260907-183858';

/* ── i fondali generati ───────────────────────────────────────────
   Higgsfield dipinge la scenografia, il codice l'accende. Le immagini
   sono gia' ridotte a 320×180 e ai quindici pigmenti, quindi versarle
   nel fotogramma e' una copia di byte. Se un fondale manca — file non
   rigenerato — si ricade sul disegno a codice di prima. */
function versa(sc, nome) {
  const a = sfondo(nome);
  if (!a || a.length !== sc.buf.length) return false;
  sc.buf.set(a);
  return true;
}

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

/* ── il timbro del clonatore ──────────────────────────────────────
   Per spegnere una fiamma dipinta nel fondale bisogna coprirla: ci
   copio sopra un pezzo di muro preso poco piu' in alto. E' il timbro
   clone dei fotoritocchi, in venti righe e a indici di tavolozza. */
function copri(sc, x, y, w, h, dx, dy) {
  const k = sc.k;
  const sx = Math.round(x * k), sy = Math.round(y * k);
  const sw = Math.round(w * k), sh = Math.round(h * k);
  const ox = Math.round(dx * k), oy = Math.round(dy * k);
  for (let j = 0; j < sh; j++)
    for (let i = 0; i < sw; i++) {
      const ax = sx + i, ay = sy + j, bx = sx + i + ox, by = sy + j + oy;
      if (ax < 0 || ay < 0 || ax >= sc.rw || ay >= sc.rh) continue;
      if (bx < 0 || by < 0 || bx >= sc.rw || by >= sc.rh) continue;
      sc.buf[ay * sc.rw + ax] = sc.buf[by * sc.rw + bx];
    }
}


/* -- gli oggetti che si toccano ----------------------------------
   Un rettangolo in coordinate logiche (320x180) e un nome. Il nome
   entra in `vivi` col suo cronometro, e il disegno lo consuma. */
function preso(lista, p) {
  for (const o of lista)
    if (p.x >= o.x && p.x < o.x + o.w && p.y >= o.y && p.y < o.y + o.h) return o.nome;
  return null;
}

/* Smorzare una luce dipinta: un alone di colore cupo, denso, sopra la
   fiamma. Piu' onesto del timbro clone quando intorno non c'e' un
   pezzo di muro pulito da cui copiare. */
function smorza(sc, x, y, r, forza = 0.92) {
  sc.alone(x, y, r, C.OMBRA, forza);
  sc.alone(x, y, r * 0.6, C.FONDO, forza);
}

/* Il cronometro di un oggetto: avanza col tempo vero e restituisce
   0..1, oppure null quando ha finito.

   Prima avanzava di un sessantesimo a fotogramma, e sembrava giusto:
   sessanta fotogrammi al secondo e' quello che fa uno schermo normale.
   Ma su un centoventi hertz ogni animazione correva al doppio, e nel
   browser di prova, che gira a duecentoquaranta, al quadruplo: la
   nuvola attraversava la luna e spariva prima che l'occhio la
   prendesse. Il tempo lo passa il ciclo, e non si discute. */
function corsa(vivi, nome, durata, dt) {
  const v = vivi[nome];
  if (!v) return null;
  v.t += dt;
  const q = v.t / durata;
  if (q >= 1) { vivi[nome] = null; return null; }
  return q;
}

/* ═══ 1 · LA SOGLIA — il titolo ═══════════════════════════════════ */
const soglia = {
  id: 'soglia', nome: 'LA SOGLIA', num: '00',
  /* la finestra accesa in cima alla torre, e le due lune */
  oggetti: [
    { nome: 'finestra', x: 199, y: 50, w: 28, h: 36 },
    { nome: 'lunaA',    x: 48,  y: 18, w: 64, h: 64 },
    { nome: 'lunaB',    x: 216, y: 8,  w: 64, h: 64 },
  ],
  vivi: {},
  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0 };
    return true;                 /* qui il tocco se lo prende l'oggetto */
  },
  animaOggetti(sc, S, t, dt) {
    const V = this.vivi;

    /* dentro la torre passa qualcuno: l'ombra attraversa la finestra
       e per un istante la luce cala */
    const q = corsa(V, 'finestra', 1.5, dt);
    if (q !== null) {
      const x = 200 + q * 26;
      sc.rettPieno(x, 57, 6, 25, C.FONDO);
      sc.rettPieno(x, 57, 1, 25, C.OMBRA);
      sc.alone(213, 69, 26, C.ORPIMENTO, 0.30 * (1 - Math.sin(q * Math.PI) * 0.85));
    }

    /* una nuvola passa davanti alla luna e se ne va */
    for (const [nome, cx, cy] of [['lunaA', 79, 50], ['lunaB', 248, 40]]) {
      const c = corsa(V, nome, 3.4, dt);
      if (c === null) continue;
      const nx = cx - 122 + c * 244;
      /* Una nuvola in pixel e' piena, non a retino: sopra la luna il
         retino lasciava passare tanti punti chiari che la nuvola
         sembrava una spolverata di sporco. Il retino resta solo sulla
         frangia, dove serve a non fare il bordo di gomma. */
      /* Bozzoli di grandezza disuguale: in fila e tutti uguali
         venivano una cupola, e la cupola non e' una nuvola. */
      const BOZZOLI = [[-42, 5, 7], [-29, -1, 12], [-13, -9, 17],
                       [3, -4, 13], [17, -8, 15], [32, 1, 11], [43, 5, 7]];
      const corpo = (ox, oy, col, base) => {
        sc.rettPieno(nx - 44 + ox, cy + base + oy, 88, 8, col);
        for (const [dx, dy, r] of BOZZOLI) sc.cerchio(nx + dx + ox, cy + dy + oy, r, col, true);
      };
      for (const [dx, dy, r] of BOZZOLI)
        sc.alone(nx + dx, cy + dy, r + 4, C.PORPORA_CUPA, 0.5);   /* frangia */
      /* Il filo di luce sul bordo si fa cosi': la stessa sagoma due
         pixel piu' su a sinistra, chiara, e sopra quella cupa. Restano
         due pixel accesi dove batte la luna. Prima erano tre cerchi
         chiari in mezzo alla nuvola, e sembravano occhi. */
      corpo(-2, -2, C.PORPORA, 3);
      corpo(0, 0, C.PORPORA_CUPA, 3);
      sc.retino(nx - 44, cy + 11, 88, 3, C.PORPORA_CUPA, C.OMBRA, 0.7);
    }
  },

  /* un colpetto accende una stella cadente dove hai toccato */
  colpetto(p, S) { this.stella = { x: p.x, y: p.y, t: 0 }; },
  fondo(sc, S) {
    if (versa(sc, 'soglia')) return;
    /* ripiego: la scena disegnata a codice */
    sc.sfuma(0, 0, sc.w, Math.round(sc.h * 0.62), RAMPE.notte);
    torre(sc, Math.round(sc.w * 0.62), Math.round(sc.h * 0.78), S.seme);
  },
  disegna(sc, S, t) {
    /* le stelle le ha gia' dipinte l'immagine: qui restano le rune,
       che sono l'unica cosa viva della soglia */
    rune(sc, t, 5);
    if (this.stella) {
      this.stella.t += 0.016;
      const q = this.stella.t / 1.1;
      if (q >= 1) { this.stella = null; }
      else {
        const x = this.stella.x + q * 70, y = this.stella.y + q * 34;
        for (let i = 0; i < 16; i++) {
          const f = i / 16;
          sc.punto(x - f * 26, y - f * 13, f < .3 ? C.CALCE : f < .6 ? C.ORPIMENTO : C.PORPORA);
        }
        sc.alone(x, y, 9 * (1 - q), C.CALCE, 0.6 * (1 - q));
      }
    }
  },
};

/* ═══ 2 · LA BILANCIA — la regia, umano contro macchina ══════════ */
const bilancia = {
  id: 'bilancia', nome: 'LA BILANCIA', num: '01',
  /* il colpetto sposta la bilancia dove hai toccato, come una mano
     che appoggia un peso sul piatto */
  colpetto(p, S, aggiorna) {
    this.stato.mix = Math.max(0, Math.min(1, (p.x - 20) / (320 - 40)));
    aggiorna();
  },
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
  /* tocchi una pagina e la riminia */
  colpetto(p, S, aggiorna) {
    const i = Math.max(0, Math.min(2, Math.floor((p.x - 14) / 100)));
    this.stato.scelta = i;
    this.stato.semi[i] = 1000 + Math.floor(Math.random() * 8999);
  },
  stato: { semi: [1207, 3390, 7714], scelta: 0 },
  /* i tre leggii e il candelabro. Le pagine sono dipinte nel fondale:
     quella che si volta la disegna il codice sopra. */
  oggetti: [
    /* Le tre pagine non sono nel fondale: le disegna il codice qui
       sopra, a 14 + i*100, larghe 84 e alte 104. I riquadri seguono
       quelle, non i leggii dipinti che stanno sotto. */
    /* Le tre pagine coprono quasi tutto il muro: delle candele
       dipinte se ne vedono due, nei varchi fra una pagina e l'altra.
       Sono quelle, e solo quelle, che si possono spegnere: animare le
       altre avrebbe mandato il fumo sopra la pergamena. */
    { nome: 'candele', x: 98,  y: 22, w: 16, h: 58 },
    { nome: 'candele', x: 198, y: 38, w: 16, h: 62 },
    { nome: 'libro0',     x: 14,  y: 30, w: 84, h: 104 },
    { nome: 'libro1',     x: 114, y: 30, w: 84, h: 104 },
    { nome: 'libro2',     x: 214, y: 30, w: 84, h: 104 },
  ],
  vivi: {},
  PAGINE: [[14, 30, 84, 104], [114, 30, 84, 104], [214, 30, 84, 104]],
  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0, girata: false };
    /* il tocco su una pagina la sceglie e la volta: il seme nuovo non
       scatta adesso ma a meta' corsa, quando la falda l'ha coperta */
    if (o !== 'candele') this.stato.scelta = +o.slice(5);
    return true;
  },
  animaOggetti(sc, S, t, dt) {
    const V = this.vivi;

    /* La pagina si volta: una falda di pergamena entra da destra e
       attraversa la pagina fino a coprirla tutta, poi sparisce. Il
       bordo davanti si incurva, e davanti al bordo cammina l'ombra. */
    for (let i = 0; i < 3; i++) {
      const q = corsa(V, 'libro' + i, 0.8, dt);
      if (q === null) continue;
      const [px, py, pw, ph] = this.PAGINE[i];
      const v = V['libro' + i];

      /* a meta' corsa, sotto la falda, la miniatura diventa un'altra */
      if (v && !v.girata && q > 0.5) {
        v.girata = true;
        this.stato.semi[i] = 1000 + Math.floor(Math.random() * 8999);
      }

      /* larga da 0 a tutta la pagina, piano all'inizio e alla fine */
      const larga = (1 - Math.cos(Math.min(1, q * 1.15) * Math.PI)) / 2 * (pw - 6);
      if (larga < 1) continue;
      const x0 = px + pw - 3 - larga, y0 = py + 4, h = ph - 8;

      /* l'ombra che la falda getta sulla pagina, davanti al bordo */
      sc.retino(Math.max(px + 3, x0 - 7), y0 + 2, 7, h, C.PERGAMENA, C.OMBRA_TERRA, 0.4);

      sc.rettPieno(x0, y0, larga, h, C.PERGAMENA);
      /* il bordo davanti si incurva: tre scalini di pergamena piu' cupa */
      for (let k = 0; k < 3; k++)
        sc.rettPieno(x0 + k, y0 + k, 1, h - k * 2, k ? C.OMBRA_TERRA : C.SIENA);
      sc.rettPieno(x0, y0, larga, 1, C.CALCE);
      sc.rettPieno(x0, y0 + h - 1, larga, 1, C.OMBRA_TERRA);

      /* il verso della pagina: le righe si vedono in trasparenza */
      for (let r = 0; r < 9; r++) {
        const ry = y0 + 10 + r * 9;
        if (ry > y0 + h - 6) break;
        sc.retino(x0 + 6, ry, Math.max(0, larga - 12), 1, C.PERGAMENA, C.OMBRA_TERRA, 0.45);
      }
    }

    /* le due candele nei varchi si spengono una dopo l'altra, poi
       tornano tutte e due */
    const c = corsa(V, 'candele', 2.8, dt);
    if (c !== null) {
      const FIAMME = [[103, 35], [205, 62]];
      FIAMME.forEach(([x, y], i) => {
        const spegne = 0.10 + i * 0.16, riaccende = 0.70 + i * 0.09;
        if (c > spegne && c < riaccende) {
          smorza(sc, x, y, 5);
          /* il filo di fumo */
          for (let k = 0; k < 9; k++) {
            const f = k / 9, yy = y - 4 - f * 16 - (c - spegne) * 14;
            if (yy < 4) break;
            if ((k + ((t * 16) | 0)) % 3)
              sc.punto(x + Math.sin(f * 5 + t * 2) * (1 + f * 3), yy,
                       f < 0.4 ? C.PIETRA : C.OMBRA);
          }
        } else if (c >= riaccende) {
          const s0 = Math.min(1, (c - riaccende) / 0.14);
          sc.alone(x, y, 9 * s0, C.ORPIMENTO, 0.55 * s0);
          sc.alone(x, y, 4 * s0, C.CALCE, 0.7 * s0);
        }
      });
    }
  },

  fondo(sc) { if (!versa(sc, 'scriptorium')) { muro(sc, 21); assi(sc, sc.h - 26); } },
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
  /* tocchi un banco e diventa quello scelto */
  colpetto(p, S, aggiorna) {
    this.stato.scelto = Math.max(0, Math.min(3, Math.floor(p.x / 80)));
    aggiorna();
  },
  stato: { scelto: 0 },
  /* i quattro banchi, oggetto per oggetto */
  oggetti: [
    { nome: 'pennelli', x: 2,   y: 82, w: 76, h: 42 },
    { nome: 'bobina',   x: 82,  y: 84, w: 46, h: 40 },
    { nome: 'scudi',    x: 166, y: 82, w: 66, h: 46 },
    { nome: 'automi',   x: 248, y: 80, w: 68, h: 44 },
  ],
  vivi: {},
  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0, x: p.x, y: p.y };
    return false;             /* il tocco prosegue e sceglie il banco */
  },
  animaOggetti(sc, S, t, dt) {
    const V = this.vivi;

    /* i pennelli dipingono una pennellata sul banco */
    let q = corsa(V, 'pennelli', 1.9, dt);
    if (q !== null) {
      const COL = [C.CINABRO, C.LAPIS, C.MALACHITE, C.ORPIMENTO, C.PORPORA];
      for (let i = 0; i < 5; i++) {
        const avvio = i * 0.11;
        if (q < avvio) break;
        const f = Math.min(1, (q - avvio) / 0.5);
        const y = 128 + i * 4;
        const larga = f * 62;
        sc.rettPieno(8, y, larga, 3, COL[i]);
        sc.rettPieno(8, y, larga, 1, C.CALCE);
        if (f < 1) sc.alone(8 + larga, y + 1, 4, COL[i], 0.6);
      }
    }

    /* la bobina gira, e la pellicola scorre sotto */
    q = corsa(V, 'bobina', 2.6, dt);
    if (q !== null) {
      const gir = q * 15, spinta = Math.min(1, (1 - q) * 3);
      for (let i = 0; i < 6; i++) {
        const a = gir + i * Math.PI / 3;
        sc.linea(105, 105, 105 + Math.cos(a) * 15, 105 + Math.sin(a) * 15,
                 i % 2 ? C.PIETRA_CHIARA : C.PIETRA);
      }
      sc.cerchio(105, 105, 4, C.CALCE, true);
      sc.alone(105, 105, 22, C.AZZURRITE, 0.20 * spinta);
      /* i fotogrammi che scorrono sul banco */
      for (let i = 0; i < 7; i++) {
        const x = 84 + ((i * 8 + q * 130) % 56);
        sc.rettPieno(x, 126, 6, 7, C.PIETRA);
        sc.rett(x, 126, 6, 7, C.FONDO);
        sc.rettPieno(x + 1, 128, 4, 3, C.LAPIS);
      }
    }

    /* lo scudo toccato squilla: due onde d'oro che si allargano */
    q = corsa(V, 'scudi', 1.5, dt);
    if (q !== null) {
      const mira = V.scudi ? V.scudi.x : 200;
      const cx = [180, 200, 220].reduce((a, b) =>
        Math.abs(b - mira) < Math.abs(a - mira) ? b : a);
      const tremo = Math.sin(q * 40) * (1 - q) * 2;
      for (const r of [q * 34, q * 34 - 11]) {
        if (r <= 0) continue;
        sc.cerchio(cx + tremo, 104, r, C.ORO, false);
      }
      sc.alone(cx + tremo, 104, 16, C.ORPIMENTO, 0.36 * (1 - q));
    }

    /* gli automi si svegliano: occhi accesi e ingranaggio che gira */
    q = corsa(V, 'automi', 2.4, dt);
    if (q !== null) {
      const acceso = q < 0.85 ? (Math.sin(q * 26) > -0.4 ? 1 : 0.25) : (1 - q) / 0.15;
      for (const x of [259, 265, 297, 303]) {
        sc.punto(x, 92, C.CINABRO);
        sc.alone(x, 92, 3.2, C.MINIO, 0.85 * acceso);
      }
      const g = q * 11;
      for (let i = 0; i < 8; i++) {
        const a = g + i * Math.PI / 4;
        sc.rettPieno(281 + Math.cos(a) * 9 - 1, 106 + Math.sin(a) * 9 - 1, 2, 2, C.ORO);
      }
      sc.cerchio(281, 106, 4, C.ORPIMENTO, true);
      sc.alone(281, 106, 14, C.ORO, 0.22 * Math.min(1, (1 - q) * 4));
    }
  },

  fondo(sc) { if (!versa(sc, 'banchi')) { muro(sc, 33); assi(sc, sc.h - 40); } },
  disegna(sc, S, t) {
    /* i quattro banchi sono dipinti nel fondale: il codice illumina
       quello scelto invece di ridisegnarlo sopra */
    const COL = [C.CINABRO, C.LAPIS, C.MALACHITE, C.ORPIMENTO];
    const X = [46, 122, 198, 274];
    const i = this.stato.scelto;
    const respiro = 0.5 + (Math.sin(t * 2.2) + 1) / 2 * 0.5;
    sc.alone(X[i], 104, 46, COL[i], 0.30 * respiro);
    sc.alone(X[i], 104, 26, C.ORO, 0.22 * respiro);
    /* una lucciola sopra il banco acceso, perche' si veda dov'e' */
    const fy = 62 + Math.sin(t * 2) * 2;
    sc.cerchio(X[i], fy, 2, C.CALCE, true);
    sc.alone(X[i], fy, 10, C.ORPIMENTO, 0.5);
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
  /* sinistra la fornace, destra la nuvola, in mezzo l'ibrido */
  colpetto(p, S, aggiorna) {
    this.stato.modo = p.x < 110 ? 0 : p.x > 210 ? 1 : 2;
    aggiorna();
  },
  stato: { modo: 2 },
  /* la fornace, gli utensili appesi e la finestra col temporale */
  oggetti: [
    { nome: 'fornace',  x: 18,  y: 48, w: 66, h: 76 },
    { nome: 'utensili', x: 88,  y: 42, w: 98, h: 56 },
    { nome: 'finestra', x: 214, y: 2,  w: 92, h: 122 },
  ],
  vivi: {},
  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0 };
    return false;             /* il tocco prosegue e sceglie il modo */
  },
  animaOggetti(sc, S, t, dt) {
    const V = this.vivi;

    /* la fornace divampa: il mantice soffia e salgono le faville */
    let q = corsa(V, 'fornace', 2.2, dt);
    if (q !== null) {
      const soffio = Math.sin(q * Math.PI) ** 0.6;
      sc.alone(48, 92, 46 * (0.6 + soffio * 0.7), C.MINIO, 0.42 * soffio);
      sc.alone(48, 92, 24 * (0.6 + soffio * 0.7), C.ORPIMENTO, 0.5 * soffio);
      sc.alone(48, 92, 12, C.CALCE, 0.5 * soffio);
      const r = caso(77);
      for (let i = 0; i < 26; i++) {
        const fase = r(), vel = 0.6 + r() * 1.1;
        const su = (q * vel * 1.6 + fase) % 1;
        const y = 104 - su * 96;
        if (y < 4) continue;
        const x = 48 + (r() - 0.5) * 34 + Math.sin(su * 7 + fase * 9) * 5;
        sc.punto(x, y, su < 0.3 ? C.CALCE : su < 0.6 ? C.ORPIMENTO : C.MINIO);
      }
    }

    /* gli utensili oscillano e il martello batte sull'incudine */
    q = corsa(V, 'utensili', 1.8, dt);
    if (q !== null) {
      const dondolo = Math.sin(q * 19) * (1 - q) * 2.2;
      for (const [x, y, h] of [[100, 48, 30], [116, 46, 34], [132, 50, 26], [150, 46, 32], [166, 50, 28]]) {
        sc.linea(x, y, x + dondolo, y + h, C.PIETRA_CHIARA);
        sc.rettPieno(x + dondolo - 2, y + h - 3, 5, 4, C.PIETRA);
      }
      /* i colpi: tre, a distanza calante */
      for (const colpo of [0.18, 0.44, 0.66]) {
        const d = q - colpo;
        if (d < 0 || d > 0.16) continue;
        const f = 1 - d / 0.16;
        sc.alone(140, 118, 18 * f, C.ORPIMENTO, 0.55 * f);
        const r = caso(31 + Math.round(colpo * 100));
        for (let i = 0; i < 14; i++) {
          const a = -Math.PI * r(), v = (0.4 + r()) * 26 * (1 - f);
          sc.punto(140 + Math.cos(a) * v, 118 + Math.sin(a) * v * 0.7,
                   i % 3 ? C.ORPIMENTO : C.CALCE);
        }
      }
    }

    /* il lampo: tre bagliori, e la stanza intera si illumina */
    q = corsa(V, 'finestra', 1.7, dt);
    if (q !== null) {
      const lampo = (a, b) => q > a && q < b ? 1 - (q - a) / (b - a) : 0;
      const f = Math.max(lampo(0.02, 0.16), lampo(0.24, 0.34) * 0.8, lampo(0.40, 0.62) * 0.55);
      if (f > 0.01) {
        /* Il lampo illumina, non cancella. Un rettangolo di calce
           piena riempiva la finestra e ne mangiava il telaio: sembrava
           un foglio appeso al muro. Un alone a retino lascia passare
           i montanti e i vetri. */
        sc.alone(258, 60, 300, C.AZZURRITE, 0.34 * f);
        sc.alone(258, 60, 96, C.CALCE, 0.62 * f);
        sc.alone(258, 52, 52, C.CALCE, 0.78 * f);
      }
      /* la saetta, cinque segmenti a zigzag */
      if (q < 0.2) {
        let x = 250, y = 10;
        for (let i = 0; i < 5; i++) {
          const nx = x + (i % 2 ? 9 : -7), ny = y + 12;
          sc.linea(x, y, nx, ny, C.CALCE);
          sc.linea(x + 1, y, nx + 1, ny, C.AZZURRITE);
          x = nx; y = ny;
        }
      }
    }
  },
                       /* 0 locale · 1 cloud · 2 ibrido */
  fondo(sc) { if (!versa(sc, 'forgia')) { muro(sc, 44); assi(sc, sc.h - 34); } },
  disegna(sc, S, t) {
    /* la fornace e la finestra col temporale sono dipinte: il codice
       accende l'una, l'altra o tutte e due secondo la scelta */
    const m = this.stato.modo;
    const locale = m === 0 || m === 2, cloud = m === 1 || m === 2;
    if (locale) {
      const f = 0.7 + Math.sin(t * 6) * 0.3;
      sc.alone(42, 118, 54, C.DRAGO, 0.30 * f);
      sc.alone(42, 118, 30, C.MINIO, 0.42 * f);
      sc.alone(42, 118, 16, C.ORPIMENTO, 0.5 * f);
    }
    if (cloud) {
      sc.alone(268, 108, 42, C.LAPIS, 0.26);
      if (Math.sin(t * 2.4) > 0.82) {
        sc.alone(268, 104, 50, C.CALCE, 0.45);
        sc.linea(268, 86, 262, 104, C.CALCE);
        sc.linea(262, 104, 272, 100, C.CALCE);
        sc.linea(272, 100, 264, 122, C.ORPIMENTO);
      }
    }
    /* il condotto fra le due, acceso solo in ibrido */
    if (m === 2) for (let x = 74; x < 246; x += 6) {
      const on = Math.sin(t * 4 - x * 0.08) > 0;
      sc.punto(x, 150, on ? C.ORO : C.PORPORA_CUPA);
      sc.punto(x + 1, 150, on ? C.ORPIMENTO : C.PORPORA_CUPA);
    }
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
  /* il colpetto cambia disposizione e sparpaglia i punti dal dito */
  colpetto(p, S, aggiorna) {
    this.stato.forma = (this.stato.forma + 1) % 3;
    this.stato.spinta = { x: p.x, y: p.y, t: 0 };
    aggiorna();
  },
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
  /* il colpetto timbra la scheda, come un sigillo di ceralacca */
  colpetto(p, S) { this.timbro = { x: p.x, y: p.y, t: 0 }; },
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
    /* il sigillo di ceralacca, dove hai toccato */
    if (this.timbro) {
      this.timbro.t += 0.016;
      const q = Math.min(1, this.timbro.t / 0.35);
      const r = 11 * (0.4 + q * 0.6);
      sc.cerchio(this.timbro.x, this.timbro.y, r, C.DRAGO, true);
      sc.cerchio(this.timbro.x, this.timbro.y, r - 3, C.CINABRO, true);
      sc.cerchio(this.timbro.x, this.timbro.y, r * 0.45, C.ORO);
      if (this.timbro.t > 2.4) this.timbro = null;
    }
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
  /* ── gli oggetti che si possono toccare ───────────────────────
     Coordinate prese dalla griglia sul fondale vero, non a occhio. */
  oggetti: [
    { nome: 'fiamma',  x: 115, y: 58, w: 28,  h: 58 },
    { nome: 'ampolla', x: 141, y: 52, w: 42,  h: 70 },
    { nome: 'libri',   x: 176, y: 38, w: 112, h: 42 },
  ],
  vivi: { fiamma: null, ampolla: null, libri: [] },

  colpetto(p, S, aggiorna) {
    for (const o of this.oggetti)
      if (p.x >= o.x && p.x < o.x + o.w && p.y >= o.y && p.y < o.y + o.h) {
        if (o.nome === 'fiamma')  this.vivi.fiamma  = { t: 0 };
        if (o.nome === 'ampolla') this.vivi.ampolla = { t: 0 };
        if (o.nome === 'libri' && this.vivi.libri.length < 9)
          this.vivi.libri.push({
            x: p.x, y: Math.max(44, p.y), vy: 0,
            vx: (Math.random() - 0.5) * 16, giro: 0, fermo: false,
            c: [C.CINABRO, C.LAPIS, C.VERDERAME, C.PORPORA, C.SIENA][this.vivi.libri.length % 5],
          });
        return true;
      }
    /* fuori dagli oggetti il colpetto risponde alla domanda */
    if (this.stato.fatto) return false;
    const [, risp] = DOMANDE[this.stato.passo];
    const i = Math.max(0, Math.min(risp.length - 1,
      Math.floor((p.y - 30) / (120 / risp.length))));
    if (this.rispondi(i)) { aggiorna(); return true; }
    return false;
  },
  stato: { passo: 0, scelte: [], fatto: false },
  fondo(sc) {
    if (versa(sc, 'alchimista')) return;
    muro(sc, 66); assi(sc, sc.h - 26);
  },
  disegna(sc, S, t, dt) {
    /* dt e' il tempo vero del ciclo. Era un sessantesimo fisso, e su
       uno schermo veloce la fiamma si riaccendeva in mezzo secondo
       invece che in due e mezzo. */
    const V = this.vivi;

    /* ── la candela ──────────────────────────────────────────────
       Spenta: copro la fiamma dipinta col muro di sopra e mando su un
       filo di fumo. Dopo due secondi e mezzo l'alchimista la riaccende
       con l'acciarino, e la fiamma torna. */
    let viva = true;
    if (V.fiamma) {
      V.fiamma.t += dt;
      const q = V.fiamma.t;
      if (q < 2.5) {
        viva = false;
        copri(sc, 123, 61, 11, 19, -27, 0);
        for (let i = 0; i < 22; i++) {
          const f = i / 22, y = 80 - f * 46 - q * 6;
          if (y < 6) break;
          const x = 128 + Math.sin(f * 5 + q * 2.2) * (2 + f * 5);
          if ((i + ((q * 20) | 0)) % 3)
            sc.punto(x, y, f < 0.35 ? C.CALCE : f < 0.7 ? C.PIETRA_CHIARA : C.PIETRA);
        }
      } else if (q < 3.1) {
        viva = false;
        copri(sc, 123, 61, 11, 19, -27, 0);
        const s0 = (q - 2.5) / 0.6;
        for (let i = 0; i < 8; i++) {
          const a = i * 0.9 + q * 9, d = s0 * 10;
          sc.punto(128 + Math.cos(a) * d, 74 + Math.sin(a) * d,
                   i % 2 ? C.CALCE : C.ORPIMENTO);
        }
        sc.alone(128, 74, 11 * s0, C.ORPIMENTO, 0.5);
      } else V.fiamma = null;
    }
    if (viva) {
      const fh = 0.7 + Math.sin(t * 7) * 0.3;
      sc.alone(128, 88, 36, C.MINIO, 0.20 * fh);
      sc.alone(128, 88, 17, C.ORPIMENTO, 0.32 * fh);
    }

    /* ── l'ampolla ───────────────────────────────────────────────
       A riposo pulsa piano. Toccata ribolle: le bolle salgono dentro
       la pancia di vetro e dal collo esce vapore. */
    let bolle = 0;
    if (V.ampolla) {
      V.ampolla.t += dt;
      const q = V.ampolla.t;
      bolle = q < 3.4 ? Math.min(1, q * 3) * (1 - Math.max(0, (q - 2.6) / 0.8)) : 0;
      if (q > 3.6) V.ampolla = null;
    }
    sc.alone(161, 100, 18 + bolle * 11, C.MALACHITE,
             0.20 + bolle * 0.34 + Math.sin(t * 3) * 0.06);
    if (bolle > 0.05) {
      const r = caso(31);
      for (let i = 0; i < 18; i++) {
        const fase = r(), vel = 0.5 + r() * 0.9, dx = (r() - 0.5) * 22;
        const su = (t * vel * 1.8 + fase) % 1;
        if (su > 0.92) continue;
        sc.cerchio(161 + dx * (1 - su * 0.5), 110 - su * 25,
                   su > 0.6 ? 2 : 1, su > 0.75 ? C.CALCE : C.MALACHITE, true);
      }
      for (let i = 0; i < 12; i++) {
        const f = i / 12, y = 56 - f * 34 - bolle * 4;
        if (y < 6) break;
        if ((i + ((t * 14) | 0)) % 3)
          sc.punto(161 + Math.sin(f * 6 + t * 3) * (1 + f * 6), y,
                   f < 0.4 ? C.MALACHITE : C.VERDE_TERRA);
      }
      sc.alone(161, 60, 11 * bolle, C.MALACHITE, 0.3 * bolle);
    }

    /* ── i libri che cadono ──────────────────────────────────────
       Girano a scatti di novanta gradi, come si conviene a un pixel,
       e restano dove sono caduti. */
    for (const L of V.libri) {
      if (!L.fermo) {
        L.vy += 210 * dt; L.y += L.vy * dt; L.x += L.vx * dt;
        L.giro += dt * 7;
        /* 160 e' il pavimento vero: a 146 restavano appiccicati al
           muro e sembravano appesi invece che caduti */
        if (L.y >= 160) { L.y = 160; L.fermo = true; L.vx = 0; }
      }
      const dritto = (Math.round(L.giro / 1.57) % 2) === 0;
      const w = dritto ? 9 : 4, h = dritto ? 4 : 9;
      sc.rettPieno(L.x - w / 2, L.y - h / 2, w, h, L.c);
      sc.rettPieno(L.x - w / 2, L.y - h / 2, dritto ? 9 : 1, dritto ? 1 : 9, C.PERGAMENA);
      sc.rett(L.x - w / 2, L.y - h / 2, w, h, C.FONDO);
      if (!L.fermo) sc.alone(L.x, L.y, 7, C.OCRA, 0.18);
      /* un'ombra sotto, se no galleggia */
      else sc.retino(L.x - w / 2 - 1, L.y + h / 2, w + 2, 2, C.FONDO, C.OMBRA, 0.6);
    }

    if (this.stato.fatto) {
      sc.alone(161, 100, 50, C.MALACHITE, 0.28);
      sc.alone(161, 100, 24, C.CALCE, 0.20);
    }
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
