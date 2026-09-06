/* ═══════════════════════════════════════════════════════════════════
 * MOTORE PIXEL
 *
 * Un fotogramma vero a bassa risoluzione: un byte per pixel, e quel
 * byte è l'indice di un pigmento nella tavolozza. È così che
 * funzionavano le macchine a 8 bit, e cambia il modo di disegnare —
 * non si mescola, si sceglie fra quindici colori e si bara col retino.
 *
 * Alla fine il fotogramma viene versato in una ImageData e ingrandito
 * dal browser senza interpolazione: un pixel del disegno diventa un
 * quadrato netto sullo schermo.
 * ═══════════════════════════════════════════════════════════════════ */

import { RGB } from './tavolozza.js';
import { glifo, LARGHEZZA, ALTEZZA } from './alfabeto.js';

/* i retini di Bayer: la scala di grigi dei poveri. Con due pigmenti e
   una di queste matrici si ottengono le vie di mezzo che la tavolozza
   non ha. */
const BAYER4 = [
  [0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5],
];

export class Schermo {
  constructor(larghezza, altezza) {
    this.w = larghezza;
    this.h = altezza;
    this.buf = new Uint8Array(larghezza * altezza);
    this._img = null;
  }

  /* ── inchiostro ───────────────────────────────────────────────── */

  pulisci(c = 0) { this.buf.fill(c); }

  punto(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.buf[y * this.w + x] = c;
  }

  leggi(x, y) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.buf[y * this.w + x];
  }

  rettPieno(x, y, w, h, c) {
    const x0 = Math.max(0, x | 0), y0 = Math.max(0, y | 0);
    const x1 = Math.min(this.w, (x | 0) + (w | 0));
    const y1 = Math.min(this.h, (y | 0) + (h | 0));
    for (let j = y0; j < y1; j++) this.buf.fill(c, j * this.w + x0, j * this.w + x1);
  }

  rett(x, y, w, h, c) {
    for (let i = 0; i < w; i++) { this.punto(x + i, y, c); this.punto(x + i, y + h - 1, c); }
    for (let j = 0; j < h; j++) { this.punto(x, y + j, c); this.punto(x + w - 1, y + j, c); }
  }

  /* Bresenham, perché una retta a pixel non è una retta matematica */
  linea(x0, y0, x1, y1, c) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.punto(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  cerchio(cx, cy, r, c, pieno = false) {
    let x = r, y = 0, err = 1 - r;
    const riga = (a, b, yy) => { for (let i = a; i <= b; i++) this.punto(i, yy, c); };
    while (x >= y) {
      if (pieno) {
        riga(cx - x, cx + x, cy + y); riga(cx - x, cx + x, cy - y);
        riga(cx - y, cx + y, cy + x); riga(cx - y, cx + y, cy - x);
      } else {
        for (const [a, b] of [[x, y], [y, x]])
          for (const sa of [-1, 1]) for (const sb of [-1, 1])
            this.punto(cx + sa * a, cy + sb * b, c);
      }
      y++;
      if (err < 0) err += 2 * y + 1;
      else { x--; err += 2 * (y - x + 1); }
    }
  }

  /* ── retino ───────────────────────────────────────────────────── */

  /* mescola due pigmenti con una matrice di Bayer: `quanto` da 0 a 1
     dice quanta parte del secondo entra. È il modo di ottenere una
     sfumatura con una tavolozza fissa. */
  retino(x, y, w, h, sotto, sopra, quanto) {
    const soglia = Math.max(0, Math.min(16, Math.round(quanto * 16)));
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const b = BAYER4[(y + j) & 3][(x + i) & 3];
        this.punto(x + i, y + j, b < soglia ? sopra : sotto);
      }
  }

  /* Un alone vero: la densità del retino cala col quadrato della
     distanza dal centro. Con rettangoli annidati veniva fuori una
     scatola — si vedevano gli spigoli, ed era il difetto piu' evidente
     della prima versione. */
  alone(cx, cy, raggio, colore, forza = 1) {
    const r2 = raggio * raggio;
    const x0 = Math.max(0, Math.floor(cx - raggio)), x1 = Math.min(this.w, Math.ceil(cx + raggio));
    const y0 = Math.max(0, Math.floor(cy - raggio)), y1 = Math.min(this.h, Math.ceil(cy + raggio));
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d2 > r2) continue;
        const q = (1 - d2 / r2) ** 2 * forza;
        if (BAYER4[y & 3][x & 3] < q * 16) this.buf[y * this.w + x] = colore;
      }
  }

  /* una sfumatura verticale lungo una rampa di pigmenti */
  sfuma(x, y, w, h, rampa, dallAlto = true) {
    const n = rampa.length - 1;
    for (let j = 0; j < h; j++) {
      const t = (dallAlto ? j : h - 1 - j) / Math.max(1, h - 1);
      const p = t * n, i = Math.min(n - 1, Math.floor(p));
      this.retino(x, y + j, w, 1, rampa[i], rampa[i + 1], p - i);
    }
  }

  /* ── parole ───────────────────────────────────────────────────── */

  /* passo 6 = 5 colonne più una di respiro. `scala` moltiplica i pixel
     del carattere, non quelli dello schermo: un titolo a scala 2 resta
     fatto di pixel grossi, come deve essere. */
  testo(x, y, s, c, { scala = 1, passo = LARGHEZZA + 1, ombra = null } = {}) {
    let cx = x;
    for (const ch of String(s)) {
      const col = glifo(ch);
      for (let i = 0; i < LARGHEZZA; i++)
        for (let j = 0; j < ALTEZZA; j++)
          if (col[i] & (1 << j)) {
            if (ombra !== null)
              this.rettPieno(cx + (i + 1) * scala, y + (j + 1) * scala, scala, scala, ombra);
            this.rettPieno(cx + i * scala, y + j * scala, scala, scala, c);
          }
      cx += passo * scala;
    }
    return cx - x;
  }

  misura(s, { scala = 1, passo = LARGHEZZA + 1 } = {}) {
    return String(s).length * passo * scala - scala;
  }

  testoCentrato(y, s, c, opz = {}) {
    return this.testo(Math.round((this.w - this.misura(s, opz)) / 2), y, s, c, opz);
  }

  /* ── consegna ─────────────────────────────────────────────────── */

  presenta(ctx) {
    const n = this.w * this.h;
    if (!this._img || this._img.width !== this.w) {
      this._img = ctx.createImageData(this.w, this.h);
      this._img.data.fill(255);          /* opaco una volta per tutte */
    }
    const d = this._img.data;
    for (let i = 0; i < n; i++) {
      const [r, g, b] = RGB[this.buf[i]] || RGB[0];
      const k = i << 2;
      d[k] = r; d[k + 1] = g; d[k + 2] = b;
    }
    ctx.putImageData(this._img, 0, 0);
  }
}

/* ── caso ──────────────────────────────────────────────────────────
   Un generatore riproducibile: stesso seme, stesso disegno. Serve
   perché le scene sono generate e devono poter essere ritrovate. */
export function caso(seme) {
  let s = seme >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

/* rumore a valore, il mattone di ogni paesaggio generato */
export function rumore1(x, seme = 1) {
  const i = Math.floor(x), f = x - i;
  const g = n => { const r = caso((n * 374761393 + seme * 668265263) >>> 0); r(); return r(); };
  const a = g(i), b = g(i + 1);
  const t = f * f * (3 - 2 * f);
  return a + (b - a) * t;
}
