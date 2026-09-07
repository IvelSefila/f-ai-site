/* ═══════════════════════════════════════════════════════════════════
 * IL CICLO
 *
 * Risoluzione fissa 320×180: la proporzione degli schermi di oggi con
 * la densità di pixel del 1988. Il browser la ingrandisce senza
 * interpolare, quindi ogni pixel disegnato resta un quadrato.
 *
 * Lo schermo resta appiccicato in alto mentre la pagina scorre, e la
 * stanza cambia quando entra la sezione corrispondente: si legge il
 * sito e si gioca lo stesso schermo. Chi non vuole scorrere ha i tasti
 * sotto e le frecce.
 *
 * Il fondo di ogni stanza si calcola una volta sola e si ricopia: a
 * 57.600 pixel ridisegnare tutto sessanta volte al secondo si potrebbe
 * anche fare, ma il muro di pietra non cambia mai.
 * ═══════════════════════════════════════════════════════════════════ */

import { Schermo } from './motore.js';
import { C } from './tavolozza.js';
import { Scintille } from './scena.js';
import { STANZE, perId } from './stanze.js';

export const LARGO = 320, ALTO = 180;

const cv = document.querySelector('#schermo');
const ctx = cv.getContext('2d', { alpha: false });
cv.width = LARGO; cv.height = ALTO;
ctx.imageSmoothingEnabled = false;

const sc = new Schermo(LARGO, ALTO);
const scintille = new Scintille();
const lento = matchMedia('(prefers-reduced-motion: reduce)');

const S = { t: 0, seme: 4821, evocazioni: 0, stanza: 0, torcia: null };

/* ── i fondali, uno per stanza ────────────────────────────────────
   Ricalcolati solo quando cambia il seme: dentro c'è il muro di pietra,
   il pavimento, la torre. Roba che non si muove. */
const fondali = new Map();
function fondale(i) {
  const st = STANZE[i];
  if (!fondali.has(st.id)) {
    const f = new Schermo(LARGO, ALTO);
    const salva = sc.buf;
    sc.buf = f.buf;
    st.fondo ? st.fondo(sc, S) : sc.pulisci(C.FONDO);
    sc.buf = salva;
    fondali.set(st.id, f);
  }
  return fondali.get(st.id);
}
function rifaiFondali() { fondali.clear(); }

/* ── la barra di stato ────────────────────────────────────────────── */
function hud(s, t) {
  const y = ALTO - 11;
  s.rettPieno(0, y - 2, LARGO, 13, C.FONDO);
  s.linea(0, y - 2, LARGO, y - 2, C.PORPORA_CUPA);
  const st = STANZE[S.stanza];
  s.testo(4, y + 1, st.num, C.ORO);
  s.testo(20, y + 1, st.nome, C.PERGAMENA);
  s.testo(LARGO - 4 - s.misura('SEME ' + S.seme), y + 1, 'SEME ' + S.seme, C.PORPORA);
}

/* ── ciclo ────────────────────────────────────────────────────────── */
let raf = 0, ultimo = 0;

function fotogramma(ora) {
  raf = requestAnimationFrame(fotogramma);
  const dt = Math.min((ora - ultimo) / 1000, 0.05);
  ultimo = ora;
  if (!lento.matches) S.t += dt;

  sc.buf.set(fondale(S.stanza).buf);
  STANZE[S.stanza].disegna(sc, S, S.t);
  if (S.torcia) bagliorePiccolo(sc, S.torcia, S.t);
  scintille.passo(dt);
  scintille.disegna(sc);
  hud(sc, S.t);
  sc.presenta(ctx);
}

function bagliorePiccolo(s, p, t) {
  s.alone(p.x, p.y, 26, C.DRAGO, 0.4);
  s.alone(p.x, p.y, 13, C.MINIO, 0.6);
  const r = 2 + Math.sin(t * 6);
  s.cerchio(p.x, p.y, r + 1, C.ORPIMENTO, true);
  s.cerchio(p.x, p.y, Math.max(1, r - 0.5), C.CALCE, true);
}

const avvia = () => { if (!raf) { ultimo = performance.now(); raf = requestAnimationFrame(fotogramma); } };
const ferma = () => { cancelAnimationFrame(raf); raf = 0; };

/* ── cambio stanza ────────────────────────────────────────────────── */
const tastiStanza = [...document.querySelectorAll('[data-vai]')];

export function vaiA(i, scorri = false) {
  i = (i + STANZE.length) % STANZE.length;
  if (i === S.stanza && !scorri) return;
  S.stanza = i;
  tastiStanza.forEach(b => b.setAttribute('aria-current',
    String(Number(b.dataset.vai) === i)));
  document.querySelector('#nomeStanza').textContent = STANZE[i].nome;
  if (scorri) document.querySelector(`#s-${STANZE[i].id}`)
    ?.scrollIntoView({ behavior: lento.matches ? 'auto' : 'smooth', block: 'start' });
}

tastiStanza.forEach(b => b.addEventListener('click',
  () => vaiA(Number(b.dataset.vai), true)));

/* la stanza segue la sezione che stai leggendo */
const secIO = new IntersectionObserver(es => {
  for (const e of es) if (e.isIntersecting) {
    const id = e.target.id.replace(/^s-/, '');
    const i = STANZE.findIndex(x => x.id === id);
    if (i >= 0) vaiA(i);
  }
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-stanza]').forEach(s => secIO.observe(s));

/* ── comandi ──────────────────────────────────────────────────────── */
const coord = e => {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * LARGO,
           y: (e.clientY - r.top) / r.height * ALTO };
};

cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  const p = coord(e);
  S.torcia = p;
  S.evocazioni++;
  const st = STANZE[S.stanza];
  const preso = st.tocca ? st.tocca(p, sc) : false;
  /* se la stanza non ha usato il tocco, resta una scintilla */
  if (!preso) scintille.soffia(p.x, p.y, 18, (p.x * 977 + p.y * 31 + S.evocazioni) | 0);
  else scintille.soffia(p.x, p.y, 8, S.evocazioni * 131);
  aggiornaRiepilogo();
});
cv.addEventListener('pointermove', e => {
  if (!S.torcia) return;
  const p = coord(e);
  S.torcia = p;
  const st = STANZE[S.stanza];
  if (st.tocca && st.id === 'bilancia') { st.tocca(p, sc); aggiornaRiepilogo(); }
});
for (const ev of ['pointerup', 'pointercancel'])
  cv.addEventListener(ev, () => { S.torcia = null; });

addEventListener('keydown', e => {
  if (e.target.matches('input, textarea, select')) return;
  if (e.key === 'ArrowRight') { vaiA(S.stanza + 1, true); e.preventDefault(); }
  if (e.key === 'ArrowLeft')  { vaiA(S.stanza - 1, true); e.preventDefault(); }
  const st = STANZE[S.stanza];
  if (st.id === 'alchimista' && /^[1-4]$/.test(e.key)) {
    if (st.rispondi(Number(e.key) - 1)) { scintille.soffia(160, 90, 12, Date.now() | 0); aggiornaRiepilogo(); }
  }
});

document.querySelector('#rigenera')?.addEventListener('click', () => {
  S.seme = 1000 + Math.floor(Math.random() * 8999);
  rifaiFondali();
  scintille.soffia(LARGO / 2, ALTO / 2, 34, S.seme);
});

document.querySelector('#azzeraBrief')?.addEventListener('click', () => {
  perId.alchimista.azzera();
  vaiA(STANZE.findIndex(s => s.id === 'alchimista'), true);
  aggiornaRiepilogo();
});

/* ── il riepilogo del brief, in pagina e leggibile ────────────────── */
function aggiornaRiepilogo() {
  const ul = document.querySelector('#riepilogo');
  if (!ul) return;
  const { scelte, fatto } = perId.alchimista.stato;
  ul.innerHTML = scelte.length
    ? scelte.map((s, i) => `<li><b>${i + 1}.</b> ${s}</li>`).join('')
    : '<li class="vuoto">Nessuna risposta ancora. Le domande sono nella stanza dell’alchimista.</li>';
  const cta = document.querySelector('#mandaBrief');
  if (cta) {
    cta.hidden = !fatto;
    if (fatto) {
      const corpo = scelte.map((s, i) => `${i + 1}. ${s}`).join('%0D%0A');
      cta.href = `mailto:hello@f-ai.studio?subject=${encodeURIComponent('Brief F/AI — versione pixel')}&body=${corpo}`;
    }
  }
  const b = document.querySelector('#bilanciaVal');
  if (b) b.textContent = Math.round(perId.bilancia.stato.mix * 100) + '%';
}

new IntersectionObserver(es => (es[0].isIntersecting ? avvia() : ferma()),
  { threshold: 0.02 }).observe(cv);

vaiA(0);
aggiornaRiepilogo();
avvia();

export { S, sc, STANZE };
