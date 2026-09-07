/* ═══════════════════════════════════════════════════════════════════
 * IL CICLO
 *
 * Una pagina sola. Lo schermo sta fermo dietro, le pagine gli scorrono
 * sopra e si agganciano una alla volta: una passata di dito, una stanza.
 * Nessun menù — la navigazione è il dito, e le frecce per chi ha la
 * tastiera.
 *
 * I comandi delle stanze non stanno sul disegno ma nella carta del
 * testo, come elementi veri. Così il tocco non litiga mai con lo
 * scorrimento: il canvas non riceve puntatori (pointer-events:none) e
 * il dito ci scivola sopra.
 * ═══════════════════════════════════════════════════════════════════ */

import { Schermo } from './motore.js';
import { C } from './tavolozza.js';
import { Scintille } from './scena.js';
import { STANZE, perId } from './stanze.js';

export const LARGO = 320, ALTO = 180;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const cv = $('#schermo');
const ctx = cv.getContext('2d', { alpha: false });
cv.width = LARGO; cv.height = ALTO;
ctx.imageSmoothingEnabled = false;

const sc = new Schermo(LARGO, ALTO);
const scintille = new Scintille();
const lento = matchMedia('(prefers-reduced-motion: reduce)');

/* stanza -1 all'avvio: cosi' la prima chiamata a segnaStanza(0) fa
   davvero il suo lavoro invece di uscire subito perche' "e' gia' li'" */
const S = { t: 0, seme: 4821, stanza: -1 };

/* ── i fondali, uno per stanza, calcolati una volta sola ─────────── */
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

/* ── la barra di stato, in basso nel disegno ─────────────────────── */
function hud(s) {
  const y = ALTO - 11;
  s.rettPieno(0, y - 2, LARGO, 13, C.FONDO);
  s.linea(0, y - 2, LARGO, y - 2, C.PORPORA_CUPA);
  const st = STANZE[Math.max(0, S.stanza)];
  s.testo(4, y + 1, st.num, C.ORO);
  s.testo(20, y + 1, st.nome, C.PERGAMENA);
  s.testo(LARGO - 4 - s.misura('SEME ' + S.seme), y + 1, 'SEME ' + S.seme, C.PORPORA);
}

let raf = 0, ultimo = 0;
function fotogramma(ora) {
  raf = requestAnimationFrame(fotogramma);
  const dt = Math.min((ora - ultimo) / 1000, 0.05);
  ultimo = ora;
  if (!lento.matches) S.t += dt;

  sc.buf.set(fondale(Math.max(0, S.stanza)).buf);
  STANZE[Math.max(0, S.stanza)].disegna(sc, S, S.t);
  scintille.passo(dt);
  scintille.disegna(sc);
  hud(sc);
  sc.presenta(ctx);
}
const avvia = () => { if (!raf) { ultimo = performance.now(); raf = requestAnimationFrame(fotogramma); } };
const ferma = () => { cancelAnimationFrame(raf); raf = 0; };

/* ── le tacche: dove sei, senza niente da cliccare ───────────────── */
const tacche = $('#tacche');
tacche.innerHTML = STANZE.map(() => '<i></i>').join('');
const pezzi = [...tacche.children];

function segnaStanza(i) {
  if (i === S.stanza) return;
  S.stanza = i;
  pezzi.forEach((p, k) => p.classList.toggle('qui', k === i));
  $('#statoStanza').textContent = `Stanza ${STANZE[i].num}: ${STANZE[i].nome}`;
}

/* la stanza segue la pagina che stai sfogliando */
const io = new IntersectionObserver(es => {
  for (const e of es) if (e.isIntersecting) {
    const i = STANZE.findIndex(x => x.id === e.target.dataset.stanza);
    if (i >= 0) segnaStanza(i);
  }
}, { rootMargin: '-40% 0px -40% 0px' });
$$('[data-stanza]').forEach(s => io.observe(s));

/* frecce e pagina su/giù per chi ha la tastiera */
const vaiA = i => {
  i = Math.max(0, Math.min(STANZE.length - 1, i));
  $(`#s-${STANZE[i].id}`)?.scrollIntoView({ behavior: lento.matches ? 'auto' : 'smooth' });
};
addEventListener('keydown', e => {
  if (e.target.matches('input, textarea, select, button, a')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { vaiA(S.stanza + 1); e.preventDefault(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { vaiA(S.stanza - 1); e.preventDefault(); }
});

/* ── i comandi, uno per stanza ───────────────────────────────────── */
const scintillaAl = (x = 160, y = 90, n = 14) =>
  scintille.soffia(x, y, n, (Date.now() + x) | 0);

/* 01 · la leva della bilancia */
const leva = $('#levaMix'), levaVal = $('#levaVal');
function aggiornaLeva() {
  const v = Number(leva.value);
  perId.bilancia.stato.mix = v / 100;
  leva.style.setProperty('--v', v + '%');
  levaVal.textContent = `${v}% macchina · ${100 - v}% mano`;
}
leva.addEventListener('input', aggiornaLeva);
aggiornaLeva();

/* 02 · rigenerare una pagina miniata */
$$('[data-mina]').forEach(b => b.addEventListener('click', () => {
  const i = Number(b.dataset.mina);
  perId.scriptorium.stato.scelta = i;
  perId.scriptorium.stato.semi[i] = 1000 + Math.floor(Math.random() * 8999);
  scintillaAl(60 + i * 100, 80, 16);
}));

/* 03 · i banchi */
const DESC_BANCO = [
  '<b>Pennelli</b> — grafica pubblicitaria: dal key visual alle declinazioni statiche e animate, mantenendo le stesse regole.',
  '<b>Moviola</b> — video e post-produzione: il montaggio decide prima del contenuto. Tagli lunghi respirano, tagli corti spingono.',
  '<b>Araldica</b> — social: lo stesso concetto declinato dove serve. Cambiano zona sicura, peso del testo e densità.',
  '<b>Automi</b> — flussi e prototipi AI: un contenuto guida che alimenta versioni per più canali, con revisione umana prima dell’uscita.',
];
gruppo('[data-banco]', (i, b) => {
  perId.banchi.stato.scelto = i;
  $('#descBanco').innerHTML = DESC_BANCO[i];
  scintillaAl(42 + i * 77, 58, 10);
});

/* 04 · la forgia */
const DESC_FORGIA = [
  '<b>Locale</b> — controllo su file, configurazioni e iterazioni; chiede hardware e manutenzione.',
  '<b>Cloud</b> — i modelli più grandi senza gestire nulla; il costo cresce con l’uso e i dati escono di casa.',
  '<b>Ibrido</b> — prototipo in locale, produco in cloud quando serve potenza. È così che tengo insieme costo, riservatezza e resa.',
];
gruppo('[data-forgia]', (i) => {
  perId.forgia.stato.modo = i;
  $('#descForgia').innerHTML = DESC_FORGIA[i];
  scintillaAl(i === 1 ? 246 : 46, 90, 12);
});

/* 05 · la materia */
const DESC_MATERIA = [
  'La <b>griglia</b> è come si legge una pagina: tutto su un asse, niente profondità.',
  'Il <b>nastro</b> è come scorre un video: una linea che si torce nel tempo.',
  'La <b>rete</b> è come si tiene insieme un sistema: legami, non file.',
];
gruppo('[data-materia]', (i) => {
  perId.materia.stato.forma = i;
  $('#descMateria').innerHTML = DESC_MATERIA[i];
  scintillaAl(160, 92, 18);
});

function gruppo(sel, quando) {
  const bs = $$(sel);
  bs.forEach((b, i) => b.addEventListener('click', () => {
    bs.forEach(x => x.setAttribute('aria-checked', String(x === b)));
    quando(i, b);
  }));
}

/* 07 · le sei domande */
const DOMANDE = [
  ['Che cosa ti serve?',      ['Una campagna', 'Un video', 'I social', 'Un flusso AI']],
  ['Da cosa partiamo?',       ['Da zero', 'Ho del materiale', 'Ho già un marchio']],
  ['Dove deve funzionare?',   ['Stampa', 'Social', 'Sito', 'Dappertutto']],
  ['Quando ti serve?',        ['Subito', 'Fra un mese', 'Non ho fretta']],
  ['Che supporto cerchi?',    ['Un pezzo solo', 'Un percorso', 'Non lo so']],
  ['Come ti ricontatto?',     ['Scrivimi tu', 'Ti scrivo io']],
];
const alch = perId.alchimista;

function disegnaBrief() {
  const { passo, scelte, fatto } = alch.stato;
  const dom = $('#domandaBrief'), risp = $('#risposteBrief'), tit = $('#titoloBrief');
  if (fatto) {
    tit.innerHTML = 'Il brief è pronto.<br><em>Sei risposte, in chiaro.</em>';
    dom.textContent = 'Puoi mandarmelo così com’è, o ricominciare.';
    risp.innerHTML = '';
  } else {
    tit.innerHTML = 'Sei domande.<br><em>Poi costruiamo il quadro.</em>';
    const [d, r] = DOMANDE[passo];
    dom.innerHTML = `<b>${passo + 1} di 6</b> — ${d}`;
    risp.innerHTML = r.map((x, i) =>
      `<button type="button" class="tasto" data-risposta="${i}">${x}</button>`).join('');
    risp.querySelectorAll('[data-risposta]').forEach(b =>
      b.addEventListener('click', () => {
        alch.rispondi(Number(b.dataset.risposta));
        scintillaAl(200, 80, 14);
        disegnaBrief();
      }));
  }
  const ul = $('#riepilogo');
  ul.innerHTML = scelte.length
    ? scelte.map((s, i) => `<li><b>${i + 1}.</b> ${s}</li>`).join('')
    : '<li class="vuoto">Nessuna risposta ancora.</li>';
  const cta = $('#mandaBrief');
  cta.hidden = !fatto;
  if (fatto) cta.href = 'mailto:hello@f-ai.studio?subject='
    + encodeURIComponent('Brief F/AI — la torre')
    + '&body=' + scelte.map((s, i) => `${i + 1}. ${s}`).join('%0D%0A');
}
$('#azzeraBrief').addEventListener('click', () => { alch.azzera(); disegnaBrief(); });
disegnaBrief();

/* il mondo da capo */
$('#rigenera').addEventListener('click', () => {
  S.seme = 1000 + Math.floor(Math.random() * 8999);
  fondali.clear();
  scintillaAl(160, 90, 30);
});

/* ── si ferma quando non lo guardi ───────────────────────────────── */
new IntersectionObserver(es => (es[0].isIntersecting ? avvia() : ferma()),
  { threshold: 0.01 }).observe(cv);
document.addEventListener('visibilitychange',
  () => (document.hidden ? ferma() : avvia()));

segnaStanza(0);
avvia();

export { S, sc, STANZE };
