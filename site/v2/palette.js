import { PRESET, applicaGriglia, contenitoreDi, nomeContenitore,
         mostraGriglia, grigliaVisibile, initGriglia } from './griglia.js?v=20260908-141406';

/* ═══════════════════════════════════════════════════════════════════
 * PALETTE — tieni premuto su un riquadro e scegli il colore del sito
 *
 * Sette palette, non scelte a occhio. Ogni colore deve reggere otto
 * ruoli: accento e stati attivi sul fondo scuro, testo e stati attivi
 * sulla carta, inchiostro profondo, superficie piena, e la fascia con
 * la scritta bianca sopra. Le luminosità sono state cercate per
 * bisezione fino a centrare il rapporto di contrasto richiesto da
 * ciascun ruolo — nessuna scende sotto 4,5:1 dove c'è del testo.
 * Il calcolo sta in audit/palette-finale.mjs.
 *
 * Cambiare palette scrive nove variabili sulla radice. Il resto del
 * foglio non sa niente di colori: li chiede a quelle.
 * ═══════════════════════════════════════════════════════════════════ */

export const PALETTE = {
  smeraldo: { nome: 'Smeraldo', nota: 'quello di casa',
    'em':'#14c08a','em-bright':'#4fe3b0','em-light':'#7fe3bd','em-deep':'#0a8f63',
    'em-dim':'rgba(20,192,138,.14)','em-vivo':'#14c08a',
    'em-c':'#06714f','em-c-bright':'#056347','em-c-light':'#08805a','em-c-deep':'#04553d',
    'em-c-dim':'rgba(6,113,79,.10)','em-banda':'#08805a' },

  ciano: { nome: 'Ciano', nota: 'freddo, da strumento',
    'em':'#109fb5','em-bright':'#13bed8','em-light':'#25d1ec','em-deep':'#0b7282',
    'em-dim':'rgba(17,173,197,.14)','em-vivo':'#11adc5',
    'em-c':'#0b6d7c','em-c-bright':'#095f6d','em-c-light':'#0c7b8c','em-c-deep':'#08525d',
    'em-c-dim':'rgba(11,109,124,.10)','em-banda':'#0c7b8c' },

  indaco: { nome: 'Indaco', nota: 'il colore con cui si disegna l’AI',
    'em':'#9183ec','em-bright':'#aea4f1','em-light':'#c0b8f4','em-deep':'#624ee5',
    'em-dim':'rgba(145,131,236,.16)','em-vivo':'#6c5ae6',
    'em-c':'#5c47e4','em-c-bright':'#4b34e1','em-c-light':'#6c5ae6','em-c-deep':'#3920d8',
    'em-c-dim':'rgba(92,71,228,.10)','em-banda':'#6c5ae6' },

  magenta: { nome: 'Magenta', nota: 'contemporaneo, da manifesto',
    'em':'#e95cb5','em-bright':'#ef8dcb','em-light':'#f3a9d8','em-deep':'#c11a84',
    'em-dim':'rgba(233,92,181,.16)','em-vivo':'#d01c8e',
    'em-c':'#b8197e','em-c-bright':'#a2166f','em-c-light':'#d01c8e','em-c-deep':'#8c1360',
    'em-c-dim':'rgba(184,25,126,.10)','em-banda':'#d01c8e' },

  corallo: { nome: 'Corallo', nota: 'cinematografico, urgente',
    'em':'#eb6a49','em-bright':'#f1967f','em-light':'#f4af9d','em-deep':'#be3715',
    'em-dim':'rgba(235,106,73,.16)','em-vivo':'#cd3b17',
    'em-c':'#b53414','em-c-bright':'#9f2e12','em-c-light':'#cd3b17','em-c-deep':'#89280f',
    'em-c-dim':'rgba(181,52,20,.10)','em-banda':'#cd3b17' },

  ambra: { nome: 'Ambra', nota: 'caldo, editoriale',
    'em':'#cc800d','em-bright':'#f09a19','em-light':'#f4b353','em-deep':'#925c09',
    'em-dim':'rgba(204,128,13,.16)','em-vivo':'#c97e0d',
    'em-c':'#8c5709','em-c-bright':'#7a4c08','em-c-light':'#9e630a','em-c-deep':'#694207',
    'em-c-dim':'rgba(140,87,9,.10)','em-banda':'#9e630a' },

  lime: { nome: 'Lime', nota: 'acido, il più rumoroso',
    'em':'#6ca014','em-bright':'#81bf18','em-light':'#8fd31a','em-deep':'#4e720e',
    'em-dim':'rgba(129,191,24,.16)','em-vivo':'#81bf18',
    'em-c':'#4a6d0d','em-c-bright':'#415f0c','em-c-light':'#547c0f','em-c-deep':'#38520a',
    'em-c-dim':'rgba(74,109,13,.10)','em-banda':'#547c0f' },
};

const CHIAVE = 'fai-palette';
const RUOLI = ['em','em-bright','em-light','em-deep','em-dim','em-vivo',
               'em-c','em-c-bright','em-c-light','em-c-deep','em-c-dim','em-banda'];

let attiva = 'smeraldo';

export function applica(id, ricorda = true) {
  const p = PALETTE[id];
  if (!p) return;
  attiva = id;
  const r = document.documentElement.style;
  for (const k of RUOLI) r.setProperty(`--${k}`, p[k]);
  document.documentElement.dataset.palette = id;
  if (ricorda) { try { localStorage.setItem(CHIAVE, id); } catch {} }
  /* i motori disegnano su canvas: i colori li tengono in JavaScript e
     vanno riletti a mano. Chi sa ridisegnarsi ascolta questo evento. */
  document.dispatchEvent(new CustomEvent('palette', { detail: { id, ...p } }));
}

export function palettaAttiva() { return attiva; }

/* ── il pannello ─────────────────────────────────────────────────── */
function costruisciPannello() {
  const d = document.createElement('dialog');
  d.className = 'pal';
  d.id = 'palPanel';
  d.setAttribute('aria-label', 'Colore del sito');
  d.innerHTML = `
    <p class="pal__tit mono">Colore del sito</p>
    <p class="pal__sub">Sette palette. Ognuna è calcolata perché ogni testo
      resti leggibile sia sul fondo scuro sia sui blocchi su carta.</p>
    <div class="pal__griglia" role="radiogroup" aria-label="Palette disponibili">
      ${Object.entries(PALETTE).map(([id, p]) => `
        <button type="button" role="radio" data-pal="${id}" aria-checked="false"
                style="--campione:${p['em-vivo']};--campione2:${p['em']}">
          <i aria-hidden="true"></i>
          <b>${p.nome}</b>
          <span>${p.nota}</span>
        </button>`).join('')}
    </div>
    <div class="pal__sez">
      <p class="pal__tit mono">Griglia · <span data-gr-nome>questo gruppo</span></p>
      <p class="pal__sub" style="margin-inline:0">Dodici colonne invisibili sotto tutto il
        sito. Scegli come stanno questo riquadro e quelli sopra e sotto.</p>
      <div class="pal__gr" role="radiogroup" aria-label="Impaginazione del gruppo">
        ${Object.entries(PRESET).map(([id, g]) => `
          <button type="button" role="radio" data-gr-set="${id}" aria-checked="false">
            <i aria-hidden="true">${g.segno}</i><b>${g.nome}</b><span>${g.nota}</span>
          </button>`).join('')}
      </div>
      <label class="pal__vedi">
        <input type="checkbox" data-gr-vedi> Mostra la griglia
      </label>
    </div>
    <div class="pal__piede">
      <span class="mono">Tieni premuto su un riquadro per riaprire</span>
      <button type="button" class="btn btn--sm" data-pal-chiudi>Chiudi</button>
    </div>`;
  document.body.appendChild(d);

  const bottoni = [...d.querySelectorAll('[data-pal]')];
  const segna = () => bottoni.forEach(b =>
    b.setAttribute('aria-checked', String(b.dataset.pal === attiva)));

  bottoni.forEach((b, i) => {
    b.addEventListener('click', () => { applica(b.dataset.pal); segna(); });
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
              : e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = bottoni[(i + d + bottoni.length) % bottoni.length];
      n.focus(); applica(n.dataset.pal); segna();
    });
  });
  const grBottoni = [...d.querySelectorAll('[data-gr-set]')];
  const segnaGr = () => {
    const c = d.contenitore;
    grBottoni.forEach(b => b.setAttribute('aria-checked',
      String(!!c && b.dataset.grSet === (c.dataset.gr || ''))));
    d.querySelector('[data-gr-nome]').textContent = c ? nomeContenitore(c) : 'nessun gruppo';
    d.querySelector('.pal__sez').hidden = !c;
  };
  grBottoni.forEach(b => b.addEventListener('click', () => {
    if (!d.contenitore) return;
    applicaGriglia(d.contenitore, b.dataset.grSet);
    segnaGr();
  }));
  const vedi = d.querySelector('[data-gr-vedi]');
  vedi.addEventListener('change', () => mostraGriglia(vedi.checked));
  d.segnaGr = segnaGr; d.vedi = vedi;

  d.querySelector('[data-pal-chiudi]').addEventListener('click', () => d.close());
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  d.segna = segna;
  return d;
}

let pannello = null;
export function apriPannello(box = null) {
  pannello ||= costruisciPannello();
  pannello.contenitore = contenitoreDi(box);
  pannello.segna();
  pannello.segnaGr();
  pannello.vedi.checked = grigliaVisibile();
  if (!pannello.open) pannello.showModal();
  pannello.querySelector(`[data-pal="${attiva}"]`)?.focus();
}

/* ── la pressione lunga ──────────────────────────────────────────── */
const RIQUADRI = '.work, .offerta__card, .lab__card, .bench__panel, .dossier, .metrics, .formats figure';
const ATTESA = 550;       /* ms: sotto i 400 scatta per sbaglio scorrendo */
const TOLLERANZA = 10;    /* px di scorrimento oltre i quali non è più una pressione */

function armaPressioneLunga() {
  let timer = null, x0 = 0, y0 = 0, bersaglio = null;

  const annulla = () => {
    clearTimeout(timer); timer = null;
    bersaglio?.classList.remove('pal-attesa');
    bersaglio = null;
  };

  addEventListener('pointerdown', e => {
    if (e.button != null && e.button !== 0) return;      /* solo tasto sinistro / dito */
    const box = e.target.closest?.(RIQUADRI);
    if (!box) return;
    /* se il dito è su un comando vero, quello ha la precedenza */
    if (e.target.closest('button, a, input, select, textarea, summary, canvas')) return;
    bersaglio = box; x0 = e.clientX; y0 = e.clientY;
    box.classList.add('pal-attesa');
    timer = setTimeout(() => {
      box.classList.remove('pal-attesa');
      if (navigator.vibrate) navigator.vibrate(12);
      apriPannello(box);
      timer = null; bersaglio = null;
    }, ATTESA);
  }, { passive: true });

  addEventListener('pointermove', e => {
    if (!timer) return;
    if (Math.hypot(e.clientX - x0, e.clientY - y0) > TOLLERANZA) annulla();
  }, { passive: true });

  for (const ev of ['pointerup', 'pointercancel', 'scroll', 'wheel'])
    addEventListener(ev, annulla, { passive: true });

  /* col mouse il gesto naturale è il tasto destro */
  addEventListener('contextmenu', e => {
    const box = e.target.closest?.(RIQUADRI);
    if (!box || matchMedia('(pointer:coarse)').matches) return;
    e.preventDefault();
    apriPannello(box);
  });
}

/* ── un accenno, una volta sola: altrimenti nessuno lo scopre ────── */
function accenno() {
  const VISTO = 'fai-palette-visto';
  try { if (localStorage.getItem(VISTO)) return; } catch { return; }
  const primo = document.querySelector('.work, .offerta__card');
  if (!primo) return;
  new IntersectionObserver((es, ob) => {
    if (!es.some(e => e.isIntersecting)) return;
    ob.disconnect();
    const p = document.createElement('div');
    p.className = 'pal-accenno mono';
    p.innerHTML = `Tieni premuto su un riquadro: colore del sito e impaginazione.
      <button type="button" aria-label="Ho capito">✕</button>`;
    document.body.appendChild(p);
    requestAnimationFrame(() => p.classList.add('in'));
    const via = () => { p.classList.remove('in'); setTimeout(() => p.remove(), 400);
      try { localStorage.setItem(VISTO, '1'); } catch {} };
    p.querySelector('button').addEventListener('click', via);
    setTimeout(via, 9000);
  }, { threshold: .4 }).observe(primo);
}

/* ── i quattro campioni sempre a vista nella testata ─────────────── */
function armaTestata() {
  const veloci = [...document.querySelectorAll('[data-pal-veloce]')];
  const segna = () => veloci.forEach(b =>
    b.setAttribute('aria-checked', String(b.dataset.palVeloce === attiva)));
  veloci.forEach(b => {
    b.style.setProperty('--campione', PALETTE[b.dataset.palVeloce]?.['em-vivo'] || '#14c08a');
    b.addEventListener('click', () => { applica(b.dataset.palVeloce); segna(); });
  });
  document.querySelector('[data-pal-apri]')?.addEventListener('click', () => apriPannello());
  document.addEventListener('palette', segna);
  segna();
}

export function initPalette() {
  let salvata = null;
  try { salvata = localStorage.getItem(CHIAVE); } catch {}
  if (salvata && PALETTE[salvata]) applica(salvata, false);
  else document.documentElement.dataset.palette = 'smeraldo';
  initGriglia();
  armaTestata();
  armaPressioneLunga();
  accenno();
}

/* Gli shader vogliono il colore come tre numeri fra 0 e 1, non come
   testo. Lo leggo dal foglio di stile cosi' segue la palette scelta. */
export function accentoGL(varia = '--em-vivo', ripiego = [.078, .753, .541]) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varia).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(v);
  if (!m) return ripiego;
  const n = parseInt(m[1], 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}
