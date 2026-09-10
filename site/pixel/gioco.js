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

import { Schermo } from './motore.js?v=20260910-133547';
import { C } from './tavolozza.js?v=20260910-133547';
import { Scintille } from './scena.js?v=20260910-133547';
import { STANZE, perId } from './stanze.js?v=20260910-133547';
import { scongela } from './sfondi.js?v=20260910-133547';
import { scongelaBilancia } from './fotogrammi.js?v=20260910-133547';

export const LARGO = 320, ALTO = 180;
/* La scala del fotogramma. Si disegna sempre a 320×180 — le stanze
   parlano quella lingua — ma il fotogramma vero e' tre volte tanto:
   960×540. Su telefono, dove il rapporto pixel del dispositivo e' 3,
   quei 960 diventano piu' nitidi del vero; su desktop la cornice arriva
   a circa 940, cioe' quasi uno a uno. */
export const SCALA = 3;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const cv = $('#schermo');
const ctx = cv.getContext('2d', { alpha: false });
cv.width = LARGO * SCALA; cv.height = ALTO * SCALA;
ctx.imageSmoothingEnabled = false;

const sc = new Schermo(LARGO, ALTO, SCALA);
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
    const f = new Schermo(LARGO, ALTO, SCALA);
    const salva = sc.buf;
    sc.buf = f.buf;
    st.fondo ? st.fondo(sc, S) : sc.pulisci(C.FONDO);
    sc.buf = salva;
    fondali.set(st.id, f);
  }
  return fondali.get(st.id);
}

/* ── IL TOCCO ─────────────────────────────────────────────────────
   Qui c'era la trasmutazione: un'onda d'oro partiva dal dito e
   trasmutava i pigmenti che incontrava. Era nata quando le stanze
   erano disegnate a codice, e li' funzionava — il quadro portava i
   segni di chi ci aveva giocato.

   Sui fondali dipinti no: era una chiazza sulla foto. L'ho prima resa
   passeggera, poi tolta del tutto, perche' anche di passaggio sporcava
   l'immagine mentre l'occhio la guardava. Del tocco restano le
   scintille, che stanno sopra e non toccano i pixel sotto, e le cose
   che rispondono davvero: gli oggetti.

   Se ne sono andati anche mezzo megabyte di mappa per stanza e un
   passaggio su mezzo milione di pixel a fotogramma. */
export function azzeraTrasmutazioni() { /* non c'e' piu' niente da azzerare */ }

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

  const st = STANZE[Math.max(0, S.stanza)];
  sc.buf.set(fondale(Math.max(0, S.stanza)).buf);
  /* Le luci dipinte si muovono qui, subito dopo il fondale e prima
     di tutto il resto: cosi' gli aloni e le fiamme che il codice
     disegna sopra restano loro e non finiscono nel ciclo. */
  if (st.cicli) for (const [x, y, w, h, rampa, vel] of st.cicli)
    sc.ciclaTavolozza(x, y, w, h, rampa, S.t * vel);
  st.disegna(sc, S, S.t, dt);
  /* gli oggetti che si toccano vivono sopra il disegno della stanza,
     come la fiamma che si spegne o la nuvola che copre la luna */
  if (st.animaOggetti) st.animaOggetti(sc, S, S.t, dt);
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

/* ── la stanza segue la pagina che stai sfogliando ────────────────
   Prima scorreva le voci arrivate e teneva l'ultima che risultava in
   vista. Sembra la stessa cosa, e per uno scorrimento lento lo e'; ma
   quando il dito va veloce, o quando si salta di colpo in un punto,
   in una sola chiamata arrivano piu' sezioni insieme, e l'ordine in
   cui arrivano e' quello in cui le osservo, non quello in cui stanno
   sullo schermo. Vinceva una a caso: in cima alla pagina il quadro
   diceva LA BILANCIA mentre la carta diceva LA SOGLIA.

   Ora non mi fido dell'ordine: guardo tutte le sezioni e prendo quella
   il cui centro e' piu' vicino al centro della finestra. E' anche la
   definizione giusta di "quella che stai guardando". */
const sezioni = [...$$('[data-stanza]')];
function quale() {
  const mezzo = innerHeight / 2;
  let vicina = -1, minima = Infinity;
  for (const s of sezioni) {
    const r = s.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= innerHeight) continue;
    const d = Math.abs((r.top + r.bottom) / 2 - mezzo);
    if (d < minima) { minima = d; vicina = STANZE.findIndex(x => x.id === s.dataset.stanza); }
  }
  if (vicina >= 0) segnaStanza(vicina);
}
const io = new IntersectionObserver(quale, { rootMargin: '-40% 0px -40% 0px' });
sezioni.forEach(s => io.observe(s));
/* lo scorrimento puo' finire senza che nessuna soglia venga varcata --
   per esempio quando l'aggancio riporta la pagina dove era gia' */
addEventListener('scrollend', quale);

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
  /* La stadera si inclina dentro il fondale, che e' calcolato una
     volta sola: buttarlo via e' il modo di dire "rifallo con la nuova
     pendenza". Farlo a ogni fotogramma costava, e questa stanza girava
     a 168 fotogrammi contro i 240 delle altre. */
  fondali.delete('bilancia');
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
  testoBrief = fatto
    ? 'Brief F/AI — la torre\n\n' + scelte.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '';
}

/* Il brief si copia, non si spedisce: un indirizzo non c'e' ancora, e
   un pulsante che apre la posta su una casella inventata e' peggio di
   nessun pulsante. Il testo va negli appunti e il visitatore lo porta
   dove vuole. */
let testoBrief = '';
$('#mandaBrief').addEventListener('click', async () => {
  const dove = $('#statoBrief');
  let fatta = false;
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try { await navigator.clipboard.writeText(testoBrief); fatta = true; } catch { /* si ripiega */ }
  }
  if (!fatta) {
    /* il ripiego di sempre, per quando gli appunti non si lasciano
       toccare: una casella fuori campo, seleziona, copia */
    const t = document.createElement('textarea');
    t.value = testoBrief;
    t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.appendChild(t);
    t.select();
    try { fatta = document.execCommand('copy'); } catch { fatta = false; }
    t.remove();
  }
  if (dove) dove.textContent = fatta
    ? 'Brief copiato. Incollalo dove preferisci.'
    : 'Copia non riuscita: seleziona il riepilogo qui sopra e copialo a mano.';
});
$('#azzeraBrief').addEventListener('click', () => { alch.azzera(); disegnaBrief(); });
disegnaBrief();

/* il mondo da capo */
$('#rigenera').addEventListener('click', () => {
  S.seme = 1000 + Math.floor(Math.random() * 8999);
  fondali.clear();
  azzeraTrasmutazioni();
  scintillaAl(160, 90, 30);
});

/* ── il tocco sullo schermo ───────────────────────────────────────
   Un colpetto fa succedere qualcosa; un trascinamento verticale e'
   scorrimento e non deve scattare. Distinguo col movimento: oltre dieci
   pixel non e' piu' un colpetto. */
let giu = null;
cv.addEventListener('pointerdown', e => {
  const r = cv.getBoundingClientRect();
  giu = { x: (e.clientX - r.left) / r.width * LARGO,
          y: (e.clientY - r.top) / r.height * ALTO,
          sx: e.clientX, sy: e.clientY, mosso: false };
});
cv.addEventListener('pointermove', e => {
  if (giu && Math.hypot(e.clientX - giu.sx, e.clientY - giu.sy) > 10) giu.mosso = true;
});
for (const ev of ['pointerup', 'pointercancel'])
  cv.addEventListener(ev, e => {
    if (!giu || giu.mosso) { giu = null; return; }
    const p = giu; giu = null;
    const st = STANZE[Math.max(0, S.stanza)];
    scintille.soffia(p.x, p.y, 16, (p.x * 977 + p.y * 31 + Date.now()) | 0);
    /* Prima gli oggetti. Se uno se lo prende il tocco finisce li';
       altrimenti prosegue e la stanza fa la sua scelta di sempre.
       Chi risponde 'aggiorna' se lo prende ma ha cambiato uno stato che
       la carta accanto deve seguire — i piatti della bilancia muovono
       la leva. */
    const suOggetto = st.toccaOggetto ? st.toccaOggetto(p, S) : false;
    if (suOggetto === 'aggiorna') aggiorna();
    else if (!suOggetto && st.colpetto) st.colpetto(p, S, aggiorna);
  });

/* quando una stanza cambia stato da sé, la carta deve seguirla */
function aggiorna() {
  const b = perId.bilancia.stato.mix;
  if (leva && Math.abs(Number(leva.value) / 100 - b) > 0.001) {
    leva.value = Math.round(b * 100); aggiornaLeva();
  }
  $$('[data-banco]').forEach((x, i) =>
    x.setAttribute('aria-checked', String(i === perId.banchi.stato.scelto)));
  const db = $('#descBanco'); if (db) db.innerHTML = DESC_BANCO[perId.banchi.stato.scelto];
  $$('[data-forgia]').forEach((x, i) =>
    x.setAttribute('aria-checked', String(i === perId.forgia.stato.modo)));
  const df = $('#descForgia'); if (df) df.innerHTML = DESC_FORGIA[perId.forgia.stato.modo];
  $$('[data-materia]').forEach((x, i) =>
    x.setAttribute('aria-checked', String(i === perId.materia.stato.forma)));
  const dm = $('#descMateria'); if (dm) dm.innerHTML = DESC_MATERIA[perId.materia.stato.forma];
  disegnaBrief();
}

/* ── si ferma quando non lo guardi ───────────────────────────────── */
new IntersectionObserver(es => (es[0].isIntersecting ? avvia() : ferma()),
  { threshold: 0.01 }).observe(cv);
document.addEventListener('visibilitychange',
  () => (document.hidden ? ferma() : avvia()));

segnaStanza(0);
avvia();

/* ── i fondali si aprono per strada ───────────────────────────────
   Gli indici dei fondali stanno compressi: crudi erano 5,3 MB e su un
   telefono in giro si sentivano. Srotolarli si puo' fare solo in modo
   asincrono, quindi non aspetto: la pagina parte con le stanze
   disegnate a codice — il ripiego che ogni stanza aveva gia' — e ogni
   fondale entra appena e' pronto. Quello che stai guardando per primo.

   Quando ne arriva uno, butto via il suo fondale in cache: al
   fotogramma dopo fondale() lo rifa', e questa volta con l'immagine. */
/* le pose della bilancia si aprono per prime: e' l'unica stanza che
   senza di loro resta col disegno di ripiego invece del suo fondale */
scongelaBilancia(() => fondali.delete('bilancia'));
scongela(nome => fondali.delete(nome),
         [STANZE[Math.max(0, S.stanza)].id, STANZE[0].id]);

export { S, sc, STANZE };
