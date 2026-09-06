/* ═══════════════════════════════════════════════════════════════════
 * IL CICLO
 *
 * Risoluzione fissa 320×180: la stessa proporzione degli schermi di
 * oggi con la densità di pixel del 1988. Il browser la ingrandisce
 * senza interpolare, quindi ogni pixel disegnato resta un quadrato.
 *
 * Il fotogramma si ridisegna intero ogni volta — a 57.600 pixel si può
 * fare, e semplifica tutto: niente stato sporco, niente rettangoli da
 * invalidare. Il ciclo si ferma quando la finestra non è a vista.
 * ═══════════════════════════════════════════════════════════════════ */

import { Schermo } from './motore.js';
import { C } from './tavolozza.js';
import { torre, rune, bagliore, Scintille } from './scena.js';

export const LARGO = 320, ALTO = 180;

const cv = document.querySelector('#schermo');
const ctx = cv.getContext('2d', { alpha: false });
cv.width = LARGO; cv.height = ALTO;
ctx.imageSmoothingEnabled = false;

const sc = new Schermo(LARGO, ALTO);
const scintille = new Scintille();
const lento = matchMedia('(prefers-reduced-motion: reduce)');

/* ── stato ─────────────────────────────────────────────────────── */
const S = {
  t: 0,
  torcia: { x: LARGO * 0.24, y: ALTO * 0.52, viva: false },
  seme: 4821,
  evocazioni: 0,
  avviato: false,
};

/* ── il fondo, ridisegnato solo quando cambia il seme ─────────────
   Il cielo e le montagne non si muovono: calcolarli sessanta volte al
   secondo sarebbe sprecato. Li tengo in un fotogramma a parte e li
   ricopio. */
let fondo = null;
function preparaFondo() {
  fondo = new Schermo(LARGO, ALTO);
  const salva = sc.buf;
  sc.buf = fondo.buf;
  import('./scena.js').then(() => {});
  cieloEMonti(sc, S.seme);
  S.torre = torre(sc, Math.round(LARGO * 0.62), Math.round(ALTO * 0.78), S.seme);
  sc.buf = salva;
}

/* cielo e monti stanno in scena.js ma non sono esportati: li richiamo
   attraverso una funzione che li mette insieme */
import { RAMPE } from './tavolozza.js';
import { caso, rumore1 } from './motore.js';
function cieloEMonti(s, seme) {
  s.sfuma(0, 0, s.w, Math.round(s.h * 0.62), RAMPE.notte);
  s.sfuma(0, Math.round(s.h * 0.44), s.w, Math.round(s.h * 0.2),
          [C.PORPORA_CUPA, C.LAPIS, C.PORPORA_CUPA]);
  const lx = Math.round(s.w * 0.82), ly = Math.round(s.h * 0.16);
  s.alone(lx, ly, 30, C.PORPORA, 0.5);
  s.alone(lx, ly, 18, C.LAPIS, 0.35);
  s.cerchio(lx, ly, 11, C.PERGAMENA, true);
  s.cerchio(lx, ly, 11, C.CALCE);
  const rl = caso(7);
  for (let i = 0; i < 9; i++) {
    const a = rl() * 6.28, d = rl() * 8;
    s.cerchio(lx + Math.cos(a) * d, ly + Math.sin(a) * d, 1 + Math.floor(rl() * 2), C.ORO, true);
  }
  const oriz = Math.round(s.h * 0.66);
  for (const [sm, amp, base, col, cresta] of
       [[seme + 11, 22, oriz - 6, C.PORPORA_CUPA, C.PORPORA],
        [seme + 29, 34, oriz + 4, C.OMBRA, C.PORPORA_CUPA]]) {
    for (let x = 0; x < s.w; x++) {
      const n = rumore1(x / 46, sm) * 0.7 + rumore1(x / 17, sm + 1) * 0.3;
      const y = Math.round(base - n * amp);
      s.rettPieno(x, y, 1, s.h - y, col);
      s.punto(x, y, cresta);
    }
  }
  s.rettPieno(0, Math.round(s.h * 0.86), s.w, s.h, C.FONDO);
  s.sfuma(0, Math.round(s.h * 0.86), s.w, 8, [C.OMBRA, C.FONDO]);
}

/* le stelle pulsano, quindi vanno sopra il fondo a ogni fotogramma */
function stelle(s, t) {
  const r = caso(20260906);
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(r() * s.w), y = Math.floor(r() * s.h * 0.5);
    const fase = r() * 6.28, vel = 0.6 + r() * 1.6;
    const b = Math.sin(t * vel + fase);
    if (b > 0.55) s.punto(x, y, b > 0.9 ? C.CALCE : C.PERGAMENA);
    else if (b > 0) s.punto(x, y, C.PORPORA);
  }
}

/* ── il titolo ────────────────────────────────────────────────────── */
function titolo(s, t) {
  const y = 26;
  const scala = 4;
  const larg = s.misura('F/AI', { scala });
  const x = 22;
  /* L'alone respira. Con rettangoli annidati si vedeva la scatola e
     copriva il sottotitolo: ora e' radiale, centrato sulle lettere. */
  const respiro = (Math.sin(t * 1.6) + 1) / 2;
  s.alone(x + larg / 2, y + 7 * scala / 2, larg * 0.62,
          C.PORPORA, 0.30 + respiro * 0.22);
  s.testo(x, y, 'F/AI', C.ORO, { scala, ombra: C.FONDO });
  s.testo(x, y + 7 * scala + 8, 'GRAFICA · MOVIMENTO · SISTEMI', C.PERGAMENA, { scala: 1 });
  s.testo(x, y + 7 * scala + 20, 'UN PORTFOLIO CHE SI GIOCA', C.ORPIMENTO, { scala: 1 });
}

/* ── la barra di stato, come in un gioco di ruolo ─────────────────── */
function hud(s, t) {
  const y = ALTO - 13;
  s.rettPieno(0, y - 1, LARGO, 14, C.FONDO);
  s.linea(0, y - 1, LARGO, y - 1, C.PORPORA_CUPA);
  s.testo(4, y + 3, 'EVOCAZIONI', C.PORPORA, { scala: 1 });
  s.testo(70, y + 3, String(S.evocazioni).padStart(3, '0'), C.ORPIMENTO, { scala: 1 });
  s.testo(110, y + 3, 'SEME', C.PORPORA, { scala: 1 });
  s.testo(140, y + 3, String(S.seme), C.ORO, { scala: 1 });
  if (!S.avviato && Math.sin(t * 3) > -0.3)
    s.testo(LARGO - 4 - s.misura('TOCCA PER EVOCARE'), y + 3,
            'TOCCA PER EVOCARE', C.CALCE, { scala: 1 });
  else if (S.avviato)
    s.testo(LARGO - 4 - s.misura('TIENI PREMUTO: TORCIA'), y + 3,
            'TIENI PREMUTO: TORCIA', C.PERGAMENA, { scala: 1 });
}

/* ── ciclo ────────────────────────────────────────────────────────── */
let raf = 0, ultimo = 0, aVista = true;

function fotogramma(ora) {
  raf = requestAnimationFrame(fotogramma);
  const dt = Math.min((ora - ultimo) / 1000, 0.05);
  ultimo = ora;
  S.t += lento.matches ? 0 : dt;

  sc.buf.set(fondo.buf);
  stelle(sc, S.t);
  rune(sc, S.t);
  if (S.torcia.viva) bagliore(sc, S.torcia.x, S.torcia.y, S.t);
  scintille.passo(dt);
  scintille.disegna(sc);
  titolo(sc, S.t);
  hud(sc, S.t);
  sc.presenta(ctx);
}

function avvia() { if (!raf) { ultimo = performance.now(); raf = requestAnimationFrame(fotogramma); } }
function ferma() { cancelAnimationFrame(raf); raf = 0; }

/* ── comandi ──────────────────────────────────────────────────────── */
function coord(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * LARGO,
           y: (e.clientY - r.top) / r.height * ALTO };
}

cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  const p = coord(e);
  S.torcia = { ...p, viva: true };
  S.avviato = true;
  S.evocazioni++;
  scintille.soffia(p.x, p.y, 26, (p.x * 977 + p.y * 31 + S.evocazioni) | 0);
});
cv.addEventListener('pointermove', e => { if (S.torcia.viva) Object.assign(S.torcia, coord(e)); });
for (const ev of ['pointerup', 'pointercancel'])
  cv.addEventListener(ev, () => { S.torcia.viva = false; });

document.querySelector('#rigenera')?.addEventListener('click', () => {
  S.seme = 1000 + Math.floor(Math.random() * 8999);
  preparaFondo();
  scintille.soffia(LARGO / 2, ALTO / 2, 40, S.seme);
});

addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    S.avviato = true; S.evocazioni++;
    scintille.soffia(LARGO * 0.5, ALTO * 0.5, 30, Date.now() | 0);
  }
});

new IntersectionObserver(es => {
  aVista = es[0].isIntersecting;
  aVista ? avvia() : ferma();
}, { threshold: 0.05 }).observe(cv);

preparaFondo();
avvia();

export { S, sc };
