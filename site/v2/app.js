/* ═══════════════════════════════════════════════════════════════════
* app.js — la sessione. Tiene il filo fra le prove, parla, misura,
* e alla fine scrive il dossier. Nessuna libreria.
* ═══════════════════════════════════════════════════════════════════ */
import { initTipografia } from './tipografia.js?v=20260928-143';
initTipografia();
// cursore a mirino tolto su richiesta (mirino.js resta nel progetto)
import { initHero } from './hero.js?v=20260928-143';
import { initStrumenti } from './strumenti.js?v=20260928-143';
import { initUnion } from './union.js?v=20260928-143';
import { initEso } from './eso.js?v=20260928-143';
import { initLocanda } from './locanda.js?v=20260928-143';
import { initCest } from './cest.js?v=20260928-143';
import { initPalette } from './palette.js?v=20260928-143';
import { keyVisual, radar, MODES, rng, leggiColori} from './engine.js?v=20260928-143';
import { initBrief } from './brief.js?v=20260928-143';
import { initServizi } from './servizi.js?v=20260928-143';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const mmss = ms => `${pad(Math.floor(ms / 60000))}:${pad(Math.floor(ms / 1000) % 60)}`;

/* ── stato di sessione ─────────────────────────────────────────── */
/* nell'ordine in cui si incontrano scendendo, che da oggi comincia dai
   servizi: e' la prima cosa che un cliente deve trovare */
const PROOFS = [
  ['banchi', 'Servizi — hai rigenerato i formati'],
  /* "Lavori" adesso vuol dire i lavori veri: prima era il mazzo di
     immagini generative, che si chiamava cosi' senza esserlo. Quelle
     hanno la loro riga, sotto la control room, dove sono finite. */
  ['lavori', 'Lavori — hai aperto un lavoro fatto per un cliente'],
  ['immagini', 'Immagini — hai rigenerato un sistema visivo'],
  ['metodo', 'Metodo — hai percorso la pipeline'],
  ['tecnologia', 'Tecnologia — hai confrontato le modalità'],
  ['laboratorio', 'Playlab — hai visto i motori di gioco'],
  ['materia', 'Materia — hai riorganizzato la stessa sostanza'],
];
const S = {
  t0: performance.now(),
  proofs: new Set(),
  actions: 0,
  fps: [],
  seen: new Set(),
};
const act = () => { S.actions++; };
const proof = id => { if (!S.proofs.has(id)) { S.proofs.add(id); renderDossier(); } };

/* ── voce del sistema ──────────────────────────────────────────── */
const voice = $('#voice'), voiceText = $('#voiceText'), voiceCount = $('#voiceCount');
let voiceTimer = 0, typing = null;
function say(text, sticky = false) {
  if (typing) clearInterval(typing);
  voice.classList.add('on');
  let i = 0; voiceText.textContent = '';
  typing = setInterval(() => {
      voiceText.textContent = text.slice(0, ++i);
      if (i >= text.length) { clearInterval(typing); typing = null; }
    }, 14);
  clearTimeout(voiceTimer);
  if (!sticky) voiceTimer = setTimeout(() => voice.classList.remove('on'), 7000);
}
/* Questi numeri erano rimasti a una versione precedente: arrivando sui
   servizi il messaggio diceva "Prova 03" e l'intestazione della sezione
   diceva "Prova 01". Adesso sono gli stessi dell'HTML e sono cinque
   perche' due sezioni sono diventate blocchi dentro altre due. */
const VOICE = {
  banchi: 'Prova 01. Otto servizi. Apri ognuno per il dettaglio.',
  lavori: 'Prova 02. Cinque lavori veri. I video partono solo se li apri.',
  regia: 'Prova 03. Cinque fasi, in fila: guarda l’input attraversarle.',
  tecnologia: 'Prova 04. Locale, cloud o ibrido: stime dichiarate, non promesse.',
  laboratorio: 'Prova 05. Quattro motori di gioco scritti da zero.',
  /* il brief non e' piu' una sezione: sta dentro il contatto */
  contatto: 'Sei domande. Il riepilogo si costruisce qui, nel tuo browser.',
  verdetto: 'Sessione chiusa. Il dossier qui sotto lo hai scritto tu.',
};

/* ══════════ 00 · HERO ══════════ */
const hHuman = $('#hHuman'), hAi = $('#hAi'), hEr = $('#hEr'), hFps = $('#hFps'),
hScene = $('#hScene'), railFill = $('#railFill'), railKnob = $('#railKnob'),
heroRead = $('#heroRead'), heroScene = $('#heroScene'), barTime = $('#barTime');

const READS = [
  [0,   'Direzione quasi interamente umana. Il sistema osserva e non interviene.'],
  [.28, 'La macchina assiste sui formati. Le decisioni di ritmo restano tue.'],
  [.52, 'Regia condivisa. Tu scegli l’intenzione, il sistema moltiplica le varianti.'],
  [.74, 'Il sistema guida la produzione. Tu tieni il controllo qualità.'],
  [.9,  'Automazione spinta. Serve una revisione umana prima dell’output.'],
];
let readIx = -1, rTyped = '', rTo = '', rAt = 0, cAi = -1, cEr = '', cFps = '';

const hero = initHero($('#gl'), (st, kind) => {
    if (kind === 'grab') { act(); }
    if (kind === 'scene') {
      hScene.textContent = `${pad(st.scene + 1)}/0${3}`;
      segnaScena(st.scene);
      act();
      return;
    }
    const ai = Math.round(st.split * 100);
    /* si scrive nel DOM solo quando il valore cambia davvero */
    if (ai !== cAi) {
      cAi = ai;
      hHuman.textContent = `${100 - ai}%`;
      hAi.textContent = `${ai}%`;
      railFill.style.width = `${ai}%`;
      railKnob.style.left = `${ai}%`;
    }
    const er = st.erode.toFixed(2);
    if (er !== cEr) { cEr = er; hEr.textContent = er; }
    const fp = st.fps ? `${st.fps} fps` : '—';
    if (fp !== cFps) { cFps = fp; hFps.textContent = fp; }
    if (st.fps) { S.fps.push(st.fps); if (S.fps.length > 400) S.fps.shift(); }

    let i = 0;
    for (let k = 0; k < READS.length; k++) if (st.split >= READS[k][0]) i = k;
    if (i !== readIx) { readIx = i; rTo = READS[i][1]; rTyped = ''; rAt = performance.now(); }
    if (rTyped.length < rTo.length && performance.now() - rAt > 16) {
      rTyped = rTo.slice(0, rTyped.length + 1); rAt = performance.now();
      heroRead.textContent = rTyped;
    }
  });
if (!hero) { heroRead.textContent = READS[2][1]; }

/* Il cambio scena esisteva solo come doppio clic e barra spaziatrice:
   due gesti che sul telefono non si possono fare. Ora c’è un comando
   visibile, con bersagli da 44px, che resta buono anche col mouse. */
const scenaBtn = [...document.querySelectorAll('.scene-pick button')];
scenaBtn.forEach(b => b.addEventListener('click', () => {
  hero?.vaiAScena(Number(b.dataset.scena));
}));
function segnaScena(i) {
  scenaBtn.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.scena) === i)));
}

/* Lo spot di apertura ha lo stesso tasto play delle copertine dei
   lavori: parte al clic, preload="none" resta cosi' finche' non lo
   tocchi — vedi union.js per la stessa idea. */
(() => {
  const figura = document.querySelector('.hero__spot');
  const v = figura?.querySelector('video');
  const play = figura?.querySelector('.hero__spot__play');
  if (!figura || !v || !play) return;
  play.addEventListener('click', () => { v.play().catch(() => {}); });
  v.addEventListener('play', () => figura.classList.add('in-onda'));
  v.addEventListener('pause', () => figura.classList.remove('in-onda'));
})();

/* ══════════ 01 · FORMATI ══════════ */
const FORMATS = [['9:16', 405, 720, 'Storia'], ['4:5', 576, 720, 'Feed'], ['1:1', 640, 640, 'Quadrato'], ['3:2', 720, 480, 'Stampa'], ['16:9', 720, 405, 'Copertina'], ['21:9', 840, 360, 'Cinema']];
function buildFormats(host, list) {
  host.innerHTML = '';
  return list.map(([name, w, h, use], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fmt__tasto';
      b.setAttribute('aria-label', `Scrivi il tuo testo per il formato ${use}, ${name}`);
      b.innerHTML = `
        <figure>
          <canvas width="${w}" height="${h}"></canvas>
          <figcaption><span>${use}</span><b>${name}</b></figcaption>
        </figure>
        <span class="fmt__hint"><i aria-hidden="true">✎</i> Scrivi il tuo testo</span>`;
      b.addEventListener('click', () => apriEditorFormati(i));
      host.append(b);
      return b.querySelector('canvas');
    });
}
const fmtCanvases = buildFormats($('#formats'), FORMATS);
const fmtIdea = $('#fmtIdea'), fmtOut = $('#fmtOut'), fmtSeedV = $('#fmtSeedV');
let fmtSeed = 1908;
const FMT_TITOLI = [
  'Un’idea,\npiù formati', 'Stessa idea,\nsei tagli', 'Una regia,\nogni schermo',
  'Un concept,\nmille misure', 'Stesso messaggio,\naltra griglia', 'Un formato\nnon basta mai',
];
let fmtTitolo = FMT_TITOLI[0];
let fmtPos = 'basso', fmtAllinea = 'sinistra', fmtFont = null, fmtColore = null, fmtPeso = null;
function drawFormats() {
  const wgt = +fmtIdea.value / 100;
  fmtIdea.style.setProperty('--v', `${fmtIdea.value}%`);
  if (fmtOut) fmtOut.textContent = fmtIdea.value;
  fmtSeedV.textContent = fmtSeed;
  fmtCanvases.forEach((c, i) => {
      keyVisual(c.getContext('2d'), {
          w: c.width, h: c.height, seed: fmtSeed, ai: .3, weight: wgt,
          title: fmtTitolo, kicker: `MF/AI · ${FORMATS[i][0]}`,
          pos: fmtPos, align: fmtAllinea, font: fmtFont, color: fmtColore, peso: fmtPeso || undefined,
        });
    });
}
/* Lo slider spara 'input' molto piu' spesso di un frame durante il
   trascinamento (misurato: fino a decine di eventi al secondo) e ogni
   volta ridisegna sei canvas col motore key visual — grana inclusa.
   Il valore intermedio non e' percepibile a quella frequenza: si
   raggruppano gli eventi nello stesso frame con requestAnimationFrame,
   che resta comunque "dal vivo" (un ridisegno per frame, non uno ogni
   200ms) ma smette di ridisegnare piu' volte nello stesso frame. */
let fmtRaf = 0;
fmtIdea.addEventListener('input', () => {
  act(); proof('banchi');
  if (fmtRaf) return;
  fmtRaf = requestAnimationFrame(() => { fmtRaf = 0; drawFormats(); });
});
$('#fmtNew').addEventListener('click', async () => {
  /* stessa rigenerazione dell'editor: composizione nuova intera, non solo
     la texture — dove va il titolo, cosa dice, font e colori */
  fmtSeed = (Math.random() * 9999) | 0;
  fmtTitolo = FMT_TITOLI[(Math.random() * FMT_TITOLI.length) | 0];
  fmtPos = scegli(EDITOR_POSIZIONI)[0];
  fmtAllinea = scegli(EDITOR_ALLINEI)[0];
  const f = scegli(FONT_CASUALI);
  fmtFont = f.css;
  fmtPeso = PESO_CASUALE;
  fmtColore = scegli(EDITOR_COLORI);
  drawFormats(); act(); proof('banchi');
  await caricaGoogleFont(f);
  drawFormats();
});

/* ── l'editor: scrivi il tuo testo, scegli dove va e con che carica ──
   Le sei miniature restano la vetrina; qui dentro si lavora davvero,
   su un'anteprima grande e sola. Non serve un'altra scelta di formato
   — quella si fa cliccando la miniatura giusta — serve poter decidere
   DOVE va il titolo dentro quel formato, non solo cosa dice. */
const EDITOR_POSIZIONI = [
  ['basso', 'In basso', 'il taglio classico, sotto lo sguardo'],
  ['alto', 'In alto', 'per lasciare il soggetto scoperto sotto'],
  ['centro', 'A metà', 'una fascia che taglia il centro'],
  ['sinistra', 'A sinistra', 'colonna stretta sul lato sinistro'],
  ['destra', 'A destra', 'colonna stretta sul lato destro'],
  ['diagonale', 'In diagonale', 'ruotato sull’asse della composizione'],
];
const EDITOR_ALLINEI = [
  ['sinistra', '<svg viewBox="0 0 20 14" width="18" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="1" y1="2" x2="19" y2="2"/><line x1="1" y1="7" x2="13" y2="7"/><line x1="1" y1="12" x2="17" y2="12"/></svg>'],
  ['centro', '<svg viewBox="0 0 20 14" width="18" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="1" y1="2" x2="19" y2="2"/><line x1="4" y1="7" x2="16" y2="7"/><line x1="2" y1="12" x2="18" y2="12"/></svg>'],
  ['destra', '<svg viewBox="0 0 20 14" width="18" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="1" y1="2" x2="19" y2="2"/><line x1="7" y1="7" x2="19" y2="7"/><line x1="3" y1="12" x2="19" y2="12"/></svg>'],
];
/* font veri, presi da Google Fonts e caricati solo quando servono */
const EDITOR_FONT = [
  { nome: 'Condensato', css: '"Barlow Condensed","Arial Narrow",sans-serif', google: null },
  { nome: 'Manrope', css: '"Manrope",system-ui,Arial,sans-serif', google: null },
  { nome: 'Bebas Neue', css: '"Bebas Neue",sans-serif', google: 'Bebas+Neue' },
  { nome: 'Anton', css: '"Anton",sans-serif', google: 'Anton' },
  { nome: 'Oswald', css: '"Oswald",sans-serif', google: 'Oswald:wght@400;600' },
  { nome: 'Archivo Black', css: '"Archivo Black",sans-serif', google: 'Archivo+Black' },
  { nome: 'Poppins', css: '"Poppins",sans-serif', google: 'Poppins:wght@400;700' },
  { nome: 'Playfair Display', css: '"Playfair Display",serif', google: 'Playfair+Display:wght@400;700' },
  { nome: 'Space Mono', css: '"Space Mono",monospace', google: 'Space+Mono:wght@400;700' },
  { nome: 'JetBrains Mono', css: '"JetBrains Mono",monospace', google: 'JetBrains+Mono:wght@400;700' },
];
/* Le generazioni casuali non devono mai uscire in grassetto: si escludono i font che sono
   grassi di natura (un solo peso, pesante) e si disegna in peso normale (400). */
const FONT_CASUALI = EDITOR_FONT.filter(f => !['Anton', 'Archivo Black', 'Bebas Neue'].includes(f.nome));
const PESO_CASUALE = 400;
const fontGoogleCaricati = new Set();
function caricaGoogleFont(f) {
  if (!f.google || fontGoogleCaricati.has(f.google)) return Promise.resolve();
  fontGoogleCaricati.add(f.google);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`;
  document.head.appendChild(link);
  return new Promise(risolvi => {
    const fine = () => Promise.all([document.fonts.load(`400 40px "${f.nome}"`), document.fonts.load(`700 40px "${f.nome}"`)]).catch(() => {}).then(risolvi);
    link.addEventListener('load', fine);
    link.addEventListener('error', risolvi);
    setTimeout(risolvi, 1500);
  });
}
const EDITOR_COLORI = ['#14c08a', '#109fb5', '#9183ec', '#e95cb5', '#eb6a49', '#cc800d', '#6ca014', '#3f8cff', '#f0506e'];
const EDITOR_TESTO_CASUALE = ['#f2f4f7', '#ffffff', '#ffe9a8', '#d7f5e8', '#e8e1ff', '#ffd6e8'];
const EDITOR_SFONDO_CASUALE = ['#040708', '#0b0f16', '#160b22', '#001018', '#1a0b2e', '#06120c', '#12060a', '#081018'];
const scegli = arr => arr[(Math.random() * arr.length) | 0];
/* "infinito" nel senso che conta: non un numero fisso di varianti che
   prima o poi si ripetono, ma l'intero spazio di un intero a 32 bit —
   a occhio, non si vede mai due volte la stessa combinazione */
const semeInfinito = () => Math.floor(Math.random() * 4294967296);
/* zoom a due dita sull'anteprima: pizzica per ingrandire proprio nel
   punto toccato, trascina con un dito quando sei ingrandito, doppio
   tap per tornare a schermo intero. Zoom solo visivo (CSS transform
   sul canvas), il PNG scaricato resta sempre alla risoluzione piena. */
function installaPinchZoom(box, canvas) {
  let scala = 1, tx = 0, ty = 0;
  const puntatori = new Map();
  let distanzaPrec = 0, centroPrec = null;

  function applica() {
    canvas.style.transform = `translate(${tx}px,${ty}px) scale(${scala})`;
    box.dataset.zoomed = String(scala > 1.02);
    box.style.cursor = scala > 1.02 ? 'grab' : 'zoom-in';
  }
  function reset() { scala = 1; tx = 0; ty = 0; applica(); }
  box._resetZoom = reset;

  function limita() {
    /* il bordo vero e' quello del canvas, non del riquadro che lo
       contiene: se l'immagine e' piu' stretta o piu' bassa del box
       (lettera-box), calcolare il margine sul box la bloccava prima
       di arrivare davvero al bordo dell'immagine */
    const maxTx = (canvas.offsetWidth * (scala - 1)) / 2;
    const maxTy = (canvas.offsetHeight * (scala - 1)) / 2;
    tx = Math.min(maxTx, Math.max(-maxTx, tx));
    ty = Math.min(maxTy, Math.max(-maxTy, ty));
  }
  function zoomIntorno(px, py, fattore) {
    const r = box.getBoundingClientRect();
    const cx = px - r.left - r.width / 2, cy = py - r.top - r.height / 2;
    const nuova = Math.min(4, Math.max(1, scala * fattore));
    const rapporto = nuova / scala;
    tx = cx - (cx - tx) * rapporto;
    ty = cy - (cy - ty) * rapporto;
    scala = nuova;
    if (scala <= 1.001) { tx = 0; ty = 0; }
    limita();
    applica();
  }

  box.addEventListener('pointerdown', e => {
    try { box.setPointerCapture(e.pointerId); } catch {}
    puntatori.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (puntatori.size === 2) {
      const [a, b] = [...puntatori.values()];
      distanzaPrec = Math.hypot(a.x - b.x, a.y - b.y);
      centroPrec = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    } else if (puntatori.size === 1) {
      /* la base per il trascinamento va fissata SUBITO al clic, non al
         primo movimento: altrimenti un trascinamento corto e deciso
         (un solo evento pointermove prima del rilascio, frequente col
         mouse) non spostava nulla — sembrava che il trascinamento non
         funzionasse affatto. */
      centroPrec = { x: e.clientX, y: e.clientY };
    }
  });
  box.addEventListener('pointermove', e => {
    if (!puntatori.has(e.pointerId)) return;
    puntatori.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (puntatori.size === 2) {
      const [a, b] = [...puntatori.values()];
      const distanza = Math.hypot(a.x - b.x, a.y - b.y);
      const centro = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (distanzaPrec) zoomIntorno(centro.x, centro.y, distanza / distanzaPrec);
      distanzaPrec = distanza; centroPrec = centro;
    } else if (puntatori.size === 1 && scala > 1.02) {
      const p = [...puntatori.values()][0];
      if (centroPrec) { tx += p.x - centroPrec.x; ty += p.y - centroPrec.y; limita(); applica(); }
      centroPrec = p;
    }
  });
  function fine(e) {
    puntatori.delete(e.pointerId);
    if (puntatori.size < 2) distanzaPrec = 0;
    if (puntatori.size === 1) centroPrec = [...puntatori.values()][0];
    if (puntatori.size === 0) centroPrec = null;
  }
  box.addEventListener('pointerup', fine);
  box.addEventListener('pointercancel', fine);
  box.addEventListener('pointerleave', e => { if (puntatori.size <= 1) fine(e); });
  /* la rotella del mouse zooma da sola, senza bisogno di ctrl: qui
     dentro non c'e' nient'altro da scorrere, quindi la rotella puo'
     fare solo questo */
  box.addEventListener('wheel', e => {
    e.preventDefault();
    const fattore = e.ctrlKey ? (e.deltaY < 0 ? 1.12 : 0.89) : (e.deltaY < 0 ? 1.08 : 0.92);
    zoomIntorno(e.clientX, e.clientY, fattore);
  }, { passive: false });
  box.addEventListener('dblclick', () => reset());
  reset();
}
let editorDialog = null;
function costruisciEditor() {
  const d = document.createElement('dialog');
  d.className = 'fmtEdit';
  d.setAttribute('aria-labelledby', 'fmtEditTit');
  d.innerHTML = `
    <button type="button" class="fmtEdit__chiudiX" data-fmt-chiudi aria-label="Chiudi">×</button>
    <p class="fmtEdit__cat mono">Editor · key visual</p>
    <h3 id="fmtEditTit">Scrivi il tuo titolo</h3>
    <div class="fmtEdit__corpo">
      <div class="fmtEdit__anteprima">
        <div class="fmtEdit__zoomBox">
          <canvas width="720" height="720"></canvas>
          <span class="fmtEdit__zoomHint">Doppio tap per tornare a schermo intero</span>
        </div>
        <p class="fmtEdit__formatoNome mono"></p>
      </div>
      <div class="fmtEdit__lato">
        <div class="fmtEdit__campo">
          <label for="fmtEditTxt">Il tuo titolo</label>
          <textarea id="fmtEditTxt" maxlength="80"></textarea>
        </div>
        <div class="fmtEdit__campo">
          <label for="fmtEditKick">Sopratitolo</label>
          <input id="fmtEditKick" type="text" maxlength="40" class="fmtEdit__input" />
        </div>
        <div class="fmtEdit__campo">
          <label>Dove va il titolo</label>
          <div class="fmtEdit__formati" role="radiogroup" aria-label="Posizione del titolo"></div>
        </div>
        <div class="fmtEdit__riga2 fmtEdit__riga2--stile">
          <div class="fmtEdit__campo">
            <label>Allineamento del testo</label>
            <div class="fmtEdit__allinei" role="radiogroup" aria-label="Allineamento del testo"></div>
          </div>
          <div class="fmtEdit__campo">
            <label>Stile del testo</label>
            <div class="fmtEdit__stile">
              <button type="button" class="fmtEdit__pillo" data-stile="grassetto" aria-pressed="false" aria-label="Grassetto"><b>B</b></button>
              <button type="button" class="fmtEdit__pillo" data-stile="corsivo" aria-pressed="false" aria-label="Corsivo"><i>I</i></button>
              <button type="button" class="fmtEdit__pillo" data-stile="maiuscolo" aria-pressed="true" aria-label="Maiuscolo/minuscolo">Aa</button>
            </div>
          </div>
        </div>
        <div class="fmtEdit__campo">
          <label for="fmtEditFont">Font del titolo · Google Fonts</label>
          <select id="fmtEditFont" class="fmtEdit__input fmtEdit__select"></select>
        </div>
        <div class="fmtEdit__campo">
          <label>Colore dell'accento</label>
          <div class="fmtEdit__colori" role="radiogroup" aria-label="Colore dell'accento"></div>
        </div>
        <div class="fmtEdit__riga2">
          <div class="fmtEdit__campo">
            <label for="fmtEditColTesto">Colore testo</label>
            <input id="fmtEditColTesto" type="color" class="fmtEdit__pickerColore" value="#f2f4f7" />
          </div>
          <div class="fmtEdit__campo">
            <label for="fmtEditColSfondo">Colore sfondo</label>
            <input id="fmtEditColSfondo" type="color" class="fmtEdit__pickerColore" value="#040708" />
          </div>
          <div class="fmtEdit__campo">
            <label for="fmtEditColAccento">Colore grafica</label>
            <input id="fmtEditColAccento" type="color" class="fmtEdit__pickerColore" value="#14c08a" />
          </div>
        </div>
        <div class="fmtEdit__campo">
          <label for="fmtEditDim">Grandezza testo · <output id="fmtEditDimV">100%</output></label>
          <input id="fmtEditDim" type="range" min="50" max="160" value="100" />
        </div>
        <div class="fmtEdit__campo">
          <label for="fmtEditSpazio">Spaziatura lettere · <output id="fmtEditSpazioV">0px</output></label>
          <input id="fmtEditSpazio" type="range" min="0" max="16" value="0" />
        </div>
        <div class="fmtEdit__campo">
          <label for="fmtEditInterlinea">Spaziatura righe · <output id="fmtEditInterlineaV">100%</output></label>
          <input id="fmtEditInterlinea" type="range" min="80" max="170" value="100" />
        </div>
        <div class="fmtEdit__campo">
          <label for="fmtEditAi">Rumore generativo · <output id="fmtEditAiV">30%</output></label>
          <input id="fmtEditAi" type="range" min="0" max="100" value="30" />
        </div>
        <div class="fmtEdit__campo">
          <label for="fmtEditPeso">Peso del titolo · <output id="fmtEditPesoV">55%</output></label>
          <input id="fmtEditPeso" type="range" min="0" max="100" value="55" />
        </div>
        <button type="button" class="btn btn--sm fmtEdit__rigenera" data-fmt-rigenera>Rigenera composizione infinita <i aria-hidden="true">∞</i></button>
      </div>
    </div>
    <div class="fmtEdit__piede">
      <button type="button" class="btn btn--sm" data-fmt-chiudi>Chiudi</button>
      <button type="button" class="btn btn--sm" data-fmt-scarica>Scarica PNG <i aria-hidden="true">↓</i></button>
    </div>`;
  document.body.appendChild(d);

  const canvas = d.querySelector('.fmtEdit__anteprima canvas');
  const zoomBox = d.querySelector('.fmtEdit__zoomBox');
  installaPinchZoom(zoomBox, canvas);
  const nomeFormato = d.querySelector('.fmtEdit__formatoNome');
  const txt = d.querySelector('#fmtEditTxt');
  const kick = d.querySelector('#fmtEditKick');
  const aiRange = d.querySelector('#fmtEditAi'), aiOut = d.querySelector('#fmtEditAiV');
  const pesoRange = d.querySelector('#fmtEditPeso'), pesoOut = d.querySelector('#fmtEditPesoV');
  const dimRange = d.querySelector('#fmtEditDim'), dimOut = d.querySelector('#fmtEditDimV');
  const spazioRange = d.querySelector('#fmtEditSpazio'), spazioOut = d.querySelector('#fmtEditSpazioV');
  const interlineaRange = d.querySelector('#fmtEditInterlinea'), interlineaOut = d.querySelector('#fmtEditInterlineaV');
  const colTesto = d.querySelector('#fmtEditColTesto');
  const colSfondo = d.querySelector('#fmtEditColSfondo');
  const colAccento = d.querySelector('#fmtEditColAccento');
  const formatiHost = d.querySelector('.fmtEdit__formati');
  const alliineiHost = d.querySelector('.fmtEdit__allinei');
  const fontSel = d.querySelector('#fmtEditFont');
  const coloriHost = d.querySelector('.fmtEdit__colori');
  let seedEditor = fmtSeed;
  const bottoniPos = EDITOR_POSIZIONI.map(([id, nome, nota]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    b.innerHTML = `<b>${nome}</b><span>${nota}</span>`;
    b.addEventListener('click', () => { d.pos = id; ridisegna(); });
    formatiHost.appendChild(b);
    return b;
  });
  const bottoniAllinei = EDITOR_ALLINEI.map(([id, segno]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fmtEdit__pillo';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    b.setAttribute('aria-label', 'Allinea ' + id);
    b.innerHTML = segno;
    b.addEventListener('click', () => { d.allinea = id; ridisegna(); });
    alliineiHost.appendChild(b);
    return b;
  });
  d.querySelectorAll('.fmtEdit__stile [data-stile]').forEach(b => {
    b.addEventListener('click', () => {
      const chiave = b.dataset.stile;
      const nuovo = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(nuovo));
      d[chiave] = nuovo;
      ridisegna();
    });
  });
  EDITOR_FONT.forEach((f, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = f.nome;
    o.style.fontFamily = f.css;
    fontSel.appendChild(o);
  });
  fontSel.addEventListener('change', async () => {
    const f = EDITOR_FONT[+fontSel.value];
    d.font = f.css;
    ridisegna();
    await caricaGoogleFont(f);
    ridisegna();
  });
  const bottoniColori = EDITOR_COLORI.map(hex => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fmtEdit__tinta';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    b.setAttribute('aria-label', 'Colore ' + hex);
    b.style.setProperty('--tinta', hex);
    b.addEventListener('click', () => { d.colore = hex; ridisegna(); });
    coloriHost.appendChild(b);
    return b;
  });
  colAccento.addEventListener('input', () => { d.grafica = colAccento.value; ridisegna(); });

  function ridisegna() {
    const [, w, h, use] = d.formato;
    canvas.width = w; canvas.height = h;
    nomeFormato.textContent = `${use} · ${d.formato[0]}`;
    bottoniPos.forEach((b, i) => {
      const attivo = EDITOR_POSIZIONI[i][0] === d.pos;
      b.setAttribute('aria-pressed', String(attivo));
      b.setAttribute('aria-checked', String(attivo));
    });
    bottoniAllinei.forEach((b, i) => {
      const attivo = EDITOR_ALLINEI[i][0] === d.allinea;
      b.setAttribute('aria-pressed', String(attivo));
      b.setAttribute('aria-checked', String(attivo));
    });
    bottoniColori.forEach((b, i) => {
      const attivo = EDITOR_COLORI[i] === d.colore;
      b.setAttribute('aria-pressed', String(attivo));
      b.setAttribute('aria-checked', String(attivo));
    });
    aiOut.textContent = `${aiRange.value}%`;
    pesoOut.textContent = `${pesoRange.value}%`;
    dimOut.textContent = `${dimRange.value}%`;
    spazioOut.textContent = `${spazioRange.value}px`;
    interlineaOut.textContent = `${interlineaRange.value}%`;
    keyVisual(canvas.getContext('2d'), {
      w, h, seed: seedEditor, ai: +aiRange.value / 100, weight: +pesoRange.value / 100,
      title: (txt.value || fmtTitolo), kicker: (kick.value || `MF/AI · ${d.formato[0]}`),
      pos: d.pos, align: d.allinea, font: d.font, color: d.colore, grafica: d.grafica,
      grassetto: d.grassetto, peso: d.peso || undefined, corsivo: d.corsivo, maiuscolo: d.maiuscolo,
      fontScale: +dimRange.value / 100, letterSpacing: +spazioRange.value,
      lineHeight: +interlineaRange.value / 100, textColor: colTesto.value, bgColor: colSfondo.value,
    });
  }
  [txt, kick].forEach(el => el.addEventListener('input', ridisegna));
  [aiRange, pesoRange, dimRange, spazioRange, interlineaRange].forEach(el => el.addEventListener('input', ridisegna));
  [colTesto, colSfondo].forEach(el => el.addEventListener('input', ridisegna));
  d.ridisegna = ridisegna;

  d.querySelector('[data-fmt-rigenera]').addEventListener('click', async () => {
    /* rigenera tutto da sola: non solo la texture, anche dove va il
       titolo, cosa dice, che font e che colori — una proposta nuova
       intera, come se l'avesse scelta un art director e non un dado */
    seedEditor = semeInfinito();
    d.pos = EDITOR_POSIZIONI[(Math.random() * EDITOR_POSIZIONI.length) | 0][0];
    d.allinea = EDITOR_ALLINEI[(Math.random() * EDITOR_ALLINEI.length) | 0][0];
    const f = scegli(FONT_CASUALI);
    const fIdx = EDITOR_FONT.indexOf(f);
    d.font = f.css;
    d.grassetto = false;
    d.peso = PESO_CASUALE;
    d.querySelector('[data-stile="grassetto"]')?.setAttribute('aria-pressed', 'false');
    fontSel.value = String(fIdx);
    d.colore = scegli(EDITOR_COLORI);
    d.grafica = scegli(EDITOR_COLORI);
    colAccento.value = d.grafica;
    txt.value = scegli(FMT_TITOLI);
    kick.value = '';
    aiRange.value = Math.round(Math.random() * 100);
    pesoRange.value = Math.round(Math.random() * 100);
    dimRange.value = Math.round(75 + Math.random() * 55);
    spazioRange.value = Math.round(Math.random() * 10);
    interlineaRange.value = Math.round(90 + Math.random() * 45);
    colTesto.value = scegli(EDITOR_TESTO_CASUALE);
    colSfondo.value = scegli(EDITOR_SFONDO_CASUALE);
    ridisegna();
    await caricaGoogleFont(f);
    ridisegna();
  });
  d.querySelector('[data-fmt-scarica]').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `mf-ai-key-visual-${d.formato[0].replace(':', 'x')}.png`;
    a.click();
  });
  d.querySelectorAll('[data-fmt-chiudi]').forEach(b => b.addEventListener('click', () => d.close()));
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  return d;
}
function apriEditorFormati(indice) {
  editorDialog ||= costruisciEditor();
  const d = editorDialog;
  d.formato = FORMATS[indice];
  d.pos = 'basso';
  d.allinea = 'sinistra';
  d.grassetto = false;
  d.peso = null;
  d.corsivo = false;
  d.maiuscolo = true;
  d.querySelectorAll('.fmtEdit__stile [data-stile]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.stile === 'maiuscolo'));
  });
  d.font = EDITOR_FONT[0].css;
  d.querySelector('#fmtEditFont').value = '0';
  d.colore = null;
  d.grafica = null;
  d.querySelector('#fmtEditColAccento').value = '#14c08a';
  d.querySelector('#fmtEditTxt').value = fmtTitolo;
  d.querySelector('#fmtEditKick').value = '';
  d.querySelector('#fmtEditAi').value = 30;
  d.querySelector('#fmtEditPeso').value = fmtIdea.value;
  d.querySelector('#fmtEditDim').value = 100;
  d.querySelector('#fmtEditSpazio').value = 0;
  d.querySelector('#fmtEditInterlinea').value = 100;
  d.querySelector('#fmtEditColTesto').value = '#f2f4f7';
  d.querySelector('#fmtEditColSfondo').value = '#040708';
  d.querySelector('.fmtEdit__zoomBox')._resetZoom();
  d.ridisegna();
  if (!d.open) d.showModal();
  d.querySelector('.fmtEdit__lato').scrollTop = 0;
  d.querySelector('#fmtEditTxt').focus();
}

/* ══════════ 02 · LAVORI GENERATIVI ══════════ */
const WORKS = [
  {
    titolo: 'Grafica pubblicitaria', ai: 0.25, seed: 1207, headline: 'Una direzione,\npiù formati',
    copy: 'Esercizio visivo non commissionato: dal key visual alle declinazioni statiche e animate, mantenendo le stesse regole grafiche.',
    tag: 'Key visual · Declinazioni · Motion',
    breakdown: [
      ['Contesto', 'dimostrazione autoprodotta, senza cliente.'],
      ['Obiettivo simulato', 'costruire un linguaggio riconoscibile e adattabile.'],
      ['Metodo mostrato', 'concept, gerarchia, composizione, movimento e controllo finale umano.'],
    ],
  },
  {
    titolo: 'Video e post-produzione', ai: 0.5, seed: 3390, headline: 'Il ritmo\nprima del tool',
    copy: 'Il montaggio decide prima dell’AI. La control room del sito mostra come brief, direzione, produzione assistita e rifinitura diventano un unico processo.',
    tag: 'Montaggio · Motion · Post-produzione',
    breakdown: [
      ['Contesto', 'prototipo interattivo realizzato per questo portfolio.'],
      ['Obiettivo', 'rendere visibile il ragionamento dietro un montaggio ibrido.'],
      ['Uso dell’AI', 'entra solo nelle fasi in cui aggiunge possibilità; scelta, ritmo e controllo restano responsabilità umane.'],
    ],
  },
  {
    titolo: 'Flussi e prototipi AI', ai: 0.82, seed: 7714, headline: 'Un’idea,\nun sistema',
    copy: 'Un modello di flusso in cui un contenuto guida alimenta versioni per più canali, con revisione umana prima dell’uscita.',
    tag: 'Format · Automazione · Revisione',
    breakdown: [
      ['Contesto', 'architettura dimostrativa, non un risultato commerciale.'],
      ['Obiettivo simulato', 'mantenere una direzione coerente su canali diversi.'],
      ['Controllo umano', 'approvazione di tono, immagine e formato prima di ogni output.'],
    ],
  },
];
/* ogni motore che disegna su canvas registra qui il suo ridisegno:
   al cambio di palette vanno rifatti tutti, i colori li tengono in JS */
const RIDISEGNI = [];
const deck = $('#deck');
WORKS.forEach((w, i) => {
    const el = document.createElement('article');
    el.className = 'work rv';
    el.innerHTML = `
    <div class="work__meta"><span>Dimostrazione autoprodotta</span><b>${pad(i + 1)}</b></div>
    <canvas width="820" height="640"></canvas>
    <div class="work__body">
      <h3>${w.titolo}</h3>
      <p>${w.copy}</p>
      <p class="work__tag mono">${w.tag}</p>
      <details class="work__break">
        <summary class="mono">Apri il breakdown</summary>
        <dl>${w.breakdown.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
      </details>
      <div class="work__seed"><span>seed <b class="sv">${w.seed}</b></span>
        <button class="btn btn--sm" type="button">Rigenera ↻</button></div>
    </div>`;
    deck.append(el);
    const c = el.querySelector('canvas'), ctx = c.getContext('2d');
    let sd = w.seed;
    const draw = () => {
      keyVisual(ctx, { w: c.width, h: c.height, seed: sd, ai: w.ai, weight: .5,
          title: w.headline, kicker: `MF/AI · ${pad(i + 1)}` });
      el.querySelector('.sv').textContent = sd;
    };
    el.querySelector('.work__seed button').addEventListener('click', () => {
        sd = (Math.random() * 9999) | 0; draw(); act(); proof('immagini');
        say('Stesso linguaggio, composizione nuova. È questa la differenza fra un sistema e un colpo di fortuna.');
      });
    el.querySelector('details').addEventListener('toggle', e => { if (e.target.open) { act(); proof('immagini'); } });
    RIDISEGNI.push(draw);
    queueMicrotask(draw);
  });

/* ══════════ 04 · PIPELINE ══════════ */
const pipeItems = $$('#pipe li');
const pipeIO = new IntersectionObserver(es => {
    es.forEach(e => {
        if (!e.isIntersecting) return;
        const i = pipeItems.indexOf(e.target);
        pipeItems.forEach((li, k) => {
            li.classList.toggle('on', k === i);
            li.classList.toggle('done', k < i);
            li.querySelector('.pipe__st').textContent = k < i ? 'Completata' : k === i ? 'In corso' : 'In attesa';
          });
        proof('metodo');
      });
  }, { threshold: .55, rootMargin: '-25% 0px -25% 0px' });
pipeItems.forEach(li => pipeIO.observe(li));

/* ══════════ 05 · TECNOLOGIA ══════════ */
const radarC = $('#radar'), radarCtx = radarC.getContext('2d');
const MODE_COPY = [
  ['Più controllo sul flusso', 'Il lavoro locale offre controllo su file, configurazioni e iterazioni; richiede hardware e gestione tecnica.'],
  ['Più potenza a chiamata', 'Il cloud dà accesso ai modelli più grandi senza gestire nulla; il costo cresce con l’uso e i dati escono di casa.'],
  ['Il compromesso che uso', 'Prototipo in locale, produco in cloud quando serve potenza. È così che tengo insieme costo, riservatezza e resa.'],
];
function drawRadar(i) {
  const m = radar(radarCtx, { w: radarC.width, h: radarC.height, mode: i });
  $('#radarMode').textContent = m.name;
  $('#modeTitle').textContent = MODE_COPY[i][0];
  $('#modeCopy').textContent = MODE_COPY[i][1];
}
$$('.modes button[data-mode]').forEach(b => b.addEventListener('click', () => {
      $$('.modes button[data-mode]').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      drawRadar(+b.dataset.mode); act(); proof('tecnologia');
    }));

/* ══════════ 06 · LAB ══════════ */
/* la prova 06 si sblocca aprendo davvero il laboratorio, non passandoci sopra */



/* ══════════ 06 · LABORATORIO GIOCHI ══════════
Quattro motori scritti da zero, un costruttore in sedici domande e venti
regole modificabili. Sono file autonomi (IIFE, nessuna dipendenza dal
  resto della pagina): si caricano al primo clic, non prima. */
const PLAYLAB_FILES = [
  'playlab-dna.js', 'playlab-loom.js', 'playlab-fold.js',
  'playlab-drift.js', 'playlab-choir.js', 'playlab-app.js',
];
const labBtn = $('#open-playlab');
const labDialog = $('#original-playlab');
let labPromise = null;

function caricaFile(tag, attrs) {
  return new Promise((ok, ko) => {
      const el = Object.assign(document.createElement(tag), attrs);
      el.addEventListener('load', ok, { once: true });
      el.addEventListener('error', () => ko(new Error(attrs.href || attrs.src)), { once: true });
      document.head.append(el);
    });
}

function caricaLaboratorio() {
  if (labPromise) return labPromise;
  labPromise = (async () => {
      await caricaFile('link', { rel: 'stylesheet', href: '../playlab.css' });
      /* in sequenza: i motori si registrano su window prima dell'app */
      for (const f of PLAYLAB_FILES) await caricaFile('script', { src: '../' + f, async: false });
    })().catch(e => { labPromise = null; throw e; });
  return labPromise;
}

let labPronto = false;
if (labBtn && labDialog) {
  /* playlab-app.js si aggancia da solo a #open-playlab e apre il dialog con la
  propria routine, che è quella che popola i motori e gli stili. Qui si
  intercetta solo il PRIMO clic in fase di cattura per caricare i file, poi
  si ridà il comando al laboratorio ripetendo il clic. */
  labBtn.addEventListener('click', async (event) => {
      if (labPronto) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (labPromise) return;

      const etichetta = labBtn.querySelector('span') || labBtn;
      const originale = etichetta.textContent;
      labBtn.setAttribute('aria-busy', 'true');
      etichetta.textContent = 'Preparo il laboratorio…';
      try {
        await caricaLaboratorio();
        if (!globalThis.FAIPlaylabDNA || !globalThis.FAIPlaylab)
        throw new Error('inizializzazione incompleta');
        labPronto = true;
        etichetta.textContent = originale;
        labBtn.setAttribute('aria-busy', 'false');
        act(); proof('laboratorio');
        say('Quattro motori, venti regole. Cambiale e guarda cosa succede al gioco.');
        requestAnimationFrame(() => labBtn.click());
      } catch {
        labPromise = null;
        labBtn.setAttribute('aria-busy', 'false');
        etichetta.textContent = 'Riprova il caricamento';
        setTimeout(() => { etichetta.textContent = originale; }, 2600);
      }
    }, true);
}

/* ══════════ 07 · MATERIA (OGL, caricato solo qui) ══════════ */
const MAT_COPY = [
  ['Il piano editoriale', 'Tutto su un asse, niente profondità: è così che si legge una pagina. La griglia decide dove va l’occhio.'],
  ['La pellicola', 'Lo stesso piano si arrotola nel tempo. Da qui in poi non conta più dove guardi, conta quando.'],
  ['Il sistema', 'La materia si distribuisce nello spazio e ogni punto tiene una relazione con gli altri. Non è più una pagina: è una rete che gira.'],
];
let matApi = null, matLoading = false;
async function loadMateria() {
  if (matApi || matLoading) return;
  matLoading = true;
  const stage = $('.bench__stage--materia');
  const note = document.createElement('div');
  note.className = 'mat--loading';
  note.textContent = 'Carico il motore · 15 KB';
  const cnv = $('#matCanvas');
  cnv.style.display = 'none';
  stage.prepend(note);
  try {
    const { initMateria } = await import('./materia.js');
    matApi = await initMateria(cnv, (st, kind) => {
        if (kind === 'grab') { act(); proof('materia'); }
        $('#matName').textContent = st.name;
        if (st.points) $('#matMeta').textContent = `${st.points.toLocaleString('it-IT')} punti · ${st.fps || '—'} fps`;
        if (st.fps) S.fps.push(st.fps);
      });
    $('#matDecisions').innerHTML = [
      `<b>${matApi.points.toLocaleString('it-IT')}</b> punti campionati da un’immagine`,
      'colore preso dal pixel, non generato',
      'tre disposizioni sugli stessi vertici',
      '<b>OGL</b> · 15 KB gzip, caricato ora',
      'nessun motore di scena: solo camera e geometria',
    ].map(x => `<li>${x}</li>`).join('');
  } catch (e) {
    note.textContent = 'Motore non disponibile su questo browser';
    matLoading = false;
    return;
  }
  note.remove();
  cnv.style.display = '';
  matLoading = false;
  setTimeout(refreshMetrics, 300);   /* il pannello include il chunk differito */
}
$$('.modes button[data-mat]').forEach(b => b.addEventListener('click', () => {
      $$('.modes button[data-mat]').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      const i = +b.dataset.mat;
      matApi?.setMode(i);
      $('#matTitle').textContent = MAT_COPY[i][0];
      $('#matCopy').textContent = MAT_COPY[i][1];
      act(); proof('materia');
    }));
new IntersectionObserver((es, ob) => {
    if (es.some(e => e.isIntersecting)) { loadMateria(); ob.disconnect(); }
  }, { rootMargin: '400px' }).observe($('#materia'));

/* ══════════ 08 · DOSSIER ══════════ */
const dsList = $('#dsList');
dsList.innerHTML = PROOFS.map(([id, label]) => `<li data-p="${id}">${label}</li>`).join('');
function renderDossier() {
  const el = performance.now() - S.t0;
  $('#dsTime').textContent = mmss(el);
  $('#dsProofs').textContent = `${S.proofs.size} / ${PROOFS.length}`;
  $('#dsActions').textContent = S.actions;
  const avg = S.fps.length ? Math.round(S.fps.reduce((a, b) => a + b, 0) / S.fps.length) : 0;
  $('#dsFps').textContent = avg ? `${avg} fps` : '—';
  $('#dsDate').textContent = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  voiceCount.textContent = S.proofs.size;
  /* Il totale stava scritto a mano in due posti e in uno era rimasto a
     sette: adesso lo dice l'elenco delle prove, che e' l'unico posto
     dove esiste davvero. */
  const tot = $('#voiceTot'); if (tot) tot.textContent = PROOFS.length;
  $$('#dsList li').forEach(li => li.classList.toggle('seen', S.proofs.has(li.dataset.p)));
  const n = S.proofs.size;
  $('#dsVerdict').textContent =
  n === 0 ? 'Sessione appena aperta: non hai ancora toccato nulla. Ogni sezione qui sopra si manovra.'
  : n < 3 ? `Hai aperto ${n} ${n === 1 ? 'prova' : 'prove'} su ${PROOFS.length}. Quello che hai visto è generato dal vivo dalla pagina, non caricato.`
  : n < PROOFS.length ? `${n} prove su ${PROOFS.length}, ${S.actions} manovre. Hai visto che le competenze qui non sono elencate: sono eseguite.`
  : `Tutte e ${PROOFS.length} le prove aperte, ${S.actions} manovre in ${mmss(el)}. Hai visto un portfolio che dimostra invece di dichiarare — e questo è il lavoro che faccio.`;
}
$('#dsPrint').addEventListener('click', () => { renderDossier(); act(); print(); });


/* ══════════ BRIEF · le sei domande ══════════
Il modulo che il cliente compila. Il controller è quello originale,
estratto in brief.js: i dati restano nel browser e finiscono in una
email solo se è lui ad aprirla. */
const brief = initBrief();
/* Le quattro schede dei servizi si aprono in una finestra che spiega il
   mestiere e la finestra finisce con l'invito al brief — con la
   risposta gia' segnata. Prima si spiega, poi si chiede. */
initServizi((tipo) => { brief?.apriCon?.(tipo); act(); });

/* Gli altri inviti col brief gia' scelto, ovunque siano. La delega sta
   sul documento e non sui singoli collegamenti perche' adesso alcuni
   nascono dentro una finestra che non esiste ancora quando questa riga
   viene letta. */
document.addEventListener('click', (e) => {
  const a = e.target.closest?.('[data-brief]');
  if (!a || !brief?.apriCon) return;  /* il modulo non c'e': vale l'ancora */
  e.preventDefault();
  brief.apriCon(a.dataset.brief);
  act();
});
$$('#brief-form input, #brief-form textarea, #brief-form select').forEach(el =>
  el.addEventListener('change', act, { once: true }));
$('#brief-next')?.addEventListener('click', act);
$('#brief-mail')?.addEventListener('click', () => {
    act();
    say('Il riepilogo è nella tua email. Non è passato da nessun server.');
  });

/* ══════════ METRICHE VERE ══════════ */
function metrics() {
  try {
    /* LCP vuol dire "quanto ci ha messo a comparire la prima schermata".
       Lasciando correre l'osservatore, questo numero risponde a un'altra
       domanda — "qual e' la cosa piu' grande che ho incontrato finora" —
       e cresce a ogni schermata nuova: misurato, oscillava fra 236 e
       3388 ms per la stessa identica pagina. E chi legge il dossier lo
       trova in fondo, cioe' dopo aver scorso tutto, cioe' sempre al
       valore peggiore.

       Si ferma dove si ferma la misura vera: al primo gesto. Lo
       scorrimento conta come gesto solo dopo un secondo e mezzo, il
       tempo di lasciar dipingere la prima schermata a chi scorre
       subito. */
    let fermo = false;
    new PerformanceObserver(l => {
        if (fermo) return;
        const e = l.getEntries().at(-1);
        if (e) $('#mLcp').textContent = `${Math.round(e.startTime)} ms`;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    const fermaLcp = () => { fermo = true; };
    addEventListener('pointerdown', fermaLcp, { once: true, passive: true });
    addEventListener('keydown', fermaLcp, { once: true });
    setTimeout(() => addEventListener('scroll', fermaLcp, { once: true, passive: true }), 1500);

    let cls = 0;
    new PerformanceObserver(l => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value;
        $('#mCls').textContent = cls.toFixed(3);
      }).observe({ type: 'layout-shift', buffered: true });

    let inp = 0;
    new PerformanceObserver(l => {
        for (const e of l.getEntries()) inp = Math.max(inp, e.duration);
        $('#mInp').textContent = `${Math.round(inp)} ms`;
      }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  } catch { /* browser senza PerformanceObserver: i campi restano a — */ }

  const upd = () => {
    const res = performance.getEntriesByType('resource');
    const bytes = res.reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0);
    $('#mKb').textContent = `${Math.round(bytes / 1024)} KB`;
    $('#mReq').textContent = res.length + 1;
  };
  upd(); addEventListener('load', () => setTimeout(upd, 400));
  return upd;
}
const refreshMetrics = metrics();

/* ══════════ REVEAL · NAV · VOCE ══════════ */
$$(`.sec__head, .bench, .deck, .pipe, .lab, .dossier, .metrics,
    .offerta__card, .appmie__card, .stack__group,
    .union__piede, .eso__piede, .locanda__piede, .cest__piede,
    .union__come, .eso__come, .locanda__come, .cest__come,
    .union__testa, .eso__testa, .locanda__testa, .cest__testa, .appmie__testa,
    .profilo__testo, .brief__capo`).forEach(el => el.classList.add('rv'));
/* Le schede dentro una griglia entrano una dopo l'altra, non tutte
   insieme: un piccolo ritardo per posizione, letto dall'indice fra i
   fratelli dello stesso genitore — leggero, non un motion designer a
   parte per ogni griglia. */
$$('.offerta__grid, .appmie__grid, .stack__grid').forEach(grid => {
    [...grid.children].forEach((el, i) => {
        el.classList.add('rv');
        el.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
      });
  });
const rvIO = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
$$('.rv').forEach(el => rvIO.observe(el));

/* Due sezioni possono essere in vista insieme e prima vinceva quella
   che arrivava per ultima nella lista: arrivando sul laboratorio la
   testata accendeva ancora il numero della tecnologia. Adesso vince
   quella che sta piu' in alto fra quelle visibili — che e' quella che
   si sta guardando. */
const inVista = new Set();
const secIO = new IntersectionObserver(es => {
      for (const e of es) {
        const id = e.target.id;
        e.isIntersecting ? inVista.add(id) : inVista.delete(id);
        if (!e.isIntersecting) continue;
        if (VOICE[id] && !S.seen.has(id)) { S.seen.add(id); say(VOICE[id], id === 'verdetto'); }
        if (id === 'verdetto') renderDossier();
      }
      let sopra = null, quota = Infinity;
      for (const id of inVista) {
        const el = document.getElementById(id);
        if (!el) continue;
        const y = el.getBoundingClientRect().top;
        if (y < quota) { quota = y; sopra = id; }
      }
      $$('.bar__nav a').forEach(a => a.classList.toggle('on', !!sopra &&
        a.getAttribute('href') === '#' + sopra));
    }, { threshold: .3 });
$$('main > section[id]').forEach(s => secIO.observe(s));

/* Il dock in basso segue la stessa idea: si accende la voce del blocco
   che si sta guardando adesso, non solo al passaggio del dito. Osserva
   elementi suoi propri e non le sezioni di sopra, perche' "Profilo" e
   "Contatto" oggi stanno nella STESSA <section> (unita in un blocco
   solo) e quell'osservatore li tratterebbe come un unico blocco enorme
   sempre acceso insieme — qui invece ognuno guarda solo il pezzo di
   contenuto che gli appartiene davvero. */
const navdockBersagli = [
      ['#banchi', '#banchi'], ['#lavori', '#lavori'], ['#strumenti', '#strumenti'],
      ['.profilo', '#profilo'], ['#contatto', '#contatto'],
    ].map(([sel, href]) => [$(sel), href]).filter(([el]) => el);
if (navdockBersagli.length) {
  const navdockLinks = $$('.navdock a');
  const navdockVisti = new Map();
  const navdockIO = new IntersectionObserver(es => {
        for (const e of es) navdockVisti.set(e.target, e.isIntersecting);
        /* Le voci sono sezioni una dopo l'altra: se piu' di una e' nella
           fascia, vince l'ultima della lista. */
        let sopra = null;
        for (const [el, href] of navdockBersagli)
          if (navdockVisti.get(el)) sopra = href;
        navdockLinks.forEach(a => a.classList.toggle('qui', !!sopra &&
          a.getAttribute('href') === sopra));
      }, { threshold: 0, rootMargin: '-35% 0px -55% 0px' });
  navdockBersagli.forEach(([el]) => navdockIO.observe(el));
}

/* orologio di sessione */
setInterval(() => {
    if (document.hidden) return;
    barTime.textContent = mmss(performance.now() - S.t0);
    if (!$('#verdetto').hidden) renderDossier();
  }, 1000);

/* ══════════ AVVIO ══════════ */
await document.fonts?.ready;
drawFormats();
drawRadar(0);
renderDossier();
setTimeout(() => say('Sessione aperta. Ti mostro cosa so fare, non te lo racconto.'), 900);

/* ══════════ ETICHETTA HERO: frasi a rotazione ══════════
   Sotto il titolo, invece di un'unica etichetta statica, ruotano
   poche frasi in prima persona — misurabili, non promesse. */
(() => {
  if (!heroScene) return;
  const FRASI = [
    'Grafico, fotografo, video editor, AI engineering, in una persona sola',
    'Le competenze si eseguono, non si elencano',
    'Nove palette, calcolate per il contrasto',
    'Due applicazioni mie, usate ogni giorno',
    'Quarantaquattro strumenti, uno scelto per ogni lavoro',
    'Dal brief al file finito, senza passare la mano',
    'AI dove serve davvero, mai per riempire uno slide',
  ];
  let i = 0;
  heroScene.textContent = FRASI[0];
  const riduci = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % FRASI.length;
    if (riduci()) { heroScene.textContent = FRASI[i]; return; }
    heroScene.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 260, easing: 'ease' }
    ).onfinish = () => {
      heroScene.textContent = FRASI[i];
      heroScene.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease' });
    };
  }, 4200);
})();

/* ══════════ COLORE DEL SITO ══════════
   Pressione lunga su un riquadro (o tasto destro col mouse) per
   scegliere fra sette palette. La scelta resta nel browser.

   Il foglio di stile si ribalta da solo: tutto chiede il colore alle
   variabili. I canvas no — i loro colori stanno in JavaScript, quindi
   vanno riletti e i disegni rifatti. */
document.addEventListener('palette', () => {
  leggiColori();
  const modo = $$('.modes button[data-mode]').findIndex(b => b.getAttribute('aria-pressed') === 'true');
  try { drawFormats(); } catch {}
  try { drawRadar(Math.max(0, modo)); } catch {}
  RIDISEGNI.forEach(f => { try { f(); } catch {} });
});
initPalette();
initStrumenti();

/* Il manifesto (site/v2/v2.css): un <details> che apre le istruzioni.
   Senza JavaScript apre e chiude di scatto e va benissimo — e'
   corretto sempre, il browser gestisce lui la visibilita'.
   Con JavaScript, l'apertura si anima. Il come conta piu' del perche':
   due tecniche via CSS pura (grid-template-rows 0fr/1fr, poi
   max-height) aprivano lisce e non si richiudevano MAI — un secondo
   clic toglieva [open] ma il valore restava fermo su quello aperto.
   Misurato a fondo (audit/manifesto.mjs): il motore, chiudendo
   nativamente un <details>, congela lo stile del suo contenuto diretto
   invece di ricalcolarlo. Non e' un difetto della regola, e' un limite
   del browser che nessuna sintassi CSS aggira.

   La via che regge: mai lasciare che sia [open] a guidare una
   transizione. L'animazione la guida la Web Animations API — che scrive
   l'altezza direttamente sull'elemento, frame per frame, senza passare
   dalla cascata — e l'attributo open si tocca SOLO agli estremi: true
   prima di aprire, false solo a chiusura gia' finita. Il motore non
   vede mai un <details> chiuso a meta' con del CSS scomodo da
   ricalcolare, perche' quello stato non esiste piu'. */
(() => {
  const blocco = document.querySelector('details.manifesto');
  const corpo = blocco?.querySelector('.manifesto__corpo');
  const lista = blocco?.querySelector('.manifesto__lista');
  if (!blocco || !corpo || !lista) return;

  const riduci = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cta = blocco.querySelector('.manifesto__cta');
  let inCorso = null;

  function apri() {
    inCorso?.cancel();
    blocco.open = true;
    if (cta) cta.innerHTML = 'Chiudi <i>↑</i>';
    const alto = lista.scrollHeight;
    inCorso = corpo.animate(
      [{ maxHeight: '0px' }, { maxHeight: alto + 'px' }],
      { duration: riduci() ? 1 : 420, easing: 'cubic-bezier(.22,.72,.18,1)' });
  }

  function chiudi() {
    inCorso?.cancel();
    if (cta) cta.innerHTML = 'Vedi come funziona <i>↓</i>';
    const alto = corpo.getBoundingClientRect().height;
    inCorso = corpo.animate(
      [{ maxHeight: alto + 'px' }, { maxHeight: '0px' }],
      { duration: riduci() ? 1 : 320, easing: 'cubic-bezier(.22,.72,.18,1)' });
    /* open resta true per tutta l'animazione: e' il momento in cui il
       contenuto e' ancora quello che il motore gestisce senza problemi.
       Si tocca solo alla fine, quando in schermo non c'e' piu' niente
       da mostrare — e il salto e' invisibile perche' e' gia' a zero. */
    inCorso.onfinish = () => { blocco.open = false; };
  }

  blocco.querySelector('summary').addEventListener('click', (e) => {
    e.preventDefault();
    /* sul telefono le istruzioni non servono: la scheda resta chiusa */
    if (matchMedia('(max-width:640px)').matches) return;
    blocco.open ? chiudi() : apri();
  });
})();
/* I quattro casi avvisano quando qualcuno guarda davvero un pezzo: e'
   la prova "Lavori" del dossier e vale piu' di uno scorrimento. */
const guardato = () => { act(); proof('lavori'); };
initUnion(guardato);
initEso(guardato);
initLocanda(guardato);
initCest(guardato);

/* l'iframe del caso CDI resta spento finché non lo attivi tu: prima del
   clic il dito o la rotella sopra la finestra scorrono il portfolio,
   non il sito incorporato. Il tasto nella barra fa la stessa cosa del
   velo, nei due sensi — attiva e RIdisattiva — cosi' chi ha finito di
   guardare puo' tornare a scorrere il portfolio senza uscire dal caso. */
const cdiFrame = $('.cdi__frame');
const cdiOverlay = $('[data-cdi-attiva]');
const cdiToggle = $('[data-cdi-toggle]');
if (cdiFrame && cdiOverlay && cdiToggle) {
  const stato = attivo => {
    cdiOverlay.classList.toggle('cdi__attiva--via', attivo);
    cdiToggle.setAttribute('aria-pressed', String(attivo));
    cdiToggle.innerHTML = attivo
      ? '<i aria-hidden="true">⏻</i> Navigazione ON'
      : '<i aria-hidden="true">⏻</i> Navigazione OFF';
  };
  cdiOverlay.addEventListener('click', () => stato(true));
  cdiToggle.addEventListener('click', () => stato(cdiToggle.getAttribute('aria-pressed') !== 'true'));

  /* indietro/avanti sulla cronologia dell'iframe restano permessi anche
     dal browser cross-origin — solo LEGGERE l'indirizzo dentro non lo è.
     La ricarica invece va rifatta a mano: location.reload() dall'esterno
     è bloccato, riassegnare la src no. */
  /* Avanti e indietro. Il browser non lascia toccare la cronologia di un
     sito di un altro dominio (contentWindow.history lancia un errore),
     ma le navigazioni dell'iframe finiscono nella cronologia della
     pagina: history.back() della pagina le ripercorre. Si conta quante
     volte l'iframe ha cambiato pagina per sapere fin dove si puo' andare;
     un caricamento causato da noi (indietro, avanti, ricarica) non conta. */
  const tastoIndietro = $('[data-cdi-back]');
  const tastoAvanti = $('[data-cdi-avanti]');
  let posizione = 0, massimo = 0, primoCaricamento = true, atteso = 0;
  const aggiornaTasti = () => {
    if (tastoIndietro) tastoIndietro.disabled = posizione <= 0;
    if (tastoAvanti) tastoAvanti.disabled = posizione >= massimo;
  };
  cdiFrame.addEventListener('load', () => {
    if (primoCaricamento) { primoCaricamento = false; return; }
    if (atteso > 0) { atteso--; return; }
    posizione++; massimo = posizione; aggiornaTasti();
  });
  tastoIndietro?.addEventListener('click', () => {
    if (posizione <= 0) return;
    posizione--; atteso++; aggiornaTasti(); history.back();
  });
  tastoAvanti?.addEventListener('click', () => {
    if (posizione >= massimo) return;
    posizione++; atteso++; aggiornaTasti(); history.forward();
  });
  aggiornaTasti();
  $('[data-cdi-ricarica]')?.addEventListener('click', () => { atteso++; cdiFrame.src = cdiFrame.src; });
}

/* la tavola di riferimento del prodotto (eso) si legge da vicino:
   un click e si apre ingrandita, stessa lastra degli altri popup */
const tavolaImg = $('.eso__tavola img');
if (tavolaImg) {
  let tavolaDialog = null;
  function apriTavola() {
    if (!tavolaDialog) {
      tavolaDialog = document.createElement('dialog');
      tavolaDialog.className = 'img-lightbox';
      tavolaDialog.innerHTML = `
        <button type="button" class="img-lightbox__chiudi" aria-label="Chiudi">×</button>
        <img src="${tavolaImg.src}" alt="${tavolaImg.alt}">`;
      document.body.append(tavolaDialog);
      tavolaDialog.querySelector('.img-lightbox__chiudi').addEventListener('click', () => tavolaDialog.close());
      tavolaDialog.addEventListener('click', e => { if (e.target === tavolaDialog) tavolaDialog.close(); });
    }
    tavolaDialog.showModal();
  }
  tavolaImg.setAttribute('role', 'button');
  tavolaImg.setAttribute('tabindex', '0');
  tavolaImg.setAttribute('aria-label', 'Ingrandisci la tavola di riferimento del prodotto');
  tavolaImg.addEventListener('click', apriTavola);
  tavolaImg.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apriTavola(); }
  });
}

/* la copertina "Il dispositivo" nella griglia eso e' una vista a 360°
   che si trascina per girarla: i 120 fotogrammi si scaricano solo
   quando la scheda entra in vista, mai prima. Per non fare "scatti
   bianchi" mentre gira, ogni fotogramma resta decodificato in memoria
   (niente rete a metà trascinamento) e lo sfondo della lastra e' scuro
   come le altre copertine, non bianco. */
$$('.eso__360-stage').forEach(stage360 => {
  const img360 = stage360.querySelector('.eso__360-img');
  const TOT = Number(stage360.dataset.frame360) || 120;
  const cartella360 = stage360.dataset.cartella360 || '';
  const PX_PER_FRAME = 5;
  const src360 = i => `${cartella360}frame_${String(i).padStart(3, '0')}.webp?v=4`;
  const cache360 = new Array(TOT);
  const pronti = new Array(TOT).fill(false);
  let pronto = false, frame = 0, mostrato = 0, trascinando = false, xInizio = 0, frameInizio = 0;
  let velocita = 0, inerziaId = 0, campioni = [];
  /* il fotogramma 0 è già scaricato (è quello scritto nell'HTML): un
     oggetto a parte, non l'immagine visibile, che cambia src mentre gira */
  cache360[0] = new Image(); cache360[0].src = img360.src; pronti[0] = true;

  /* I fotogrammi si disegnano su un canvas invece di cambiare src all'immagine:
     cambiare src puo' mostrare un attimo di vuoto (lampo bianco) mentre il browser
     decodifica. Col canvas il fotogramma gia' decodificato si copia e basta. */
  const cv360 = document.createElement('canvas');
  cv360.className = 'eso__360-canvas';
  cv360.setAttribute('aria-hidden', 'true');
  stage360.insertBefore(cv360, img360.nextSibling);
  const cx360 = cv360.getContext('2d', { alpha: true });
  let disegnato360 = -1;
  function misura360() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(stage360.clientWidth * dpr), h = Math.round(stage360.clientHeight * dpr);
    if (w && h && (cv360.width !== w || cv360.height !== h)) { cv360.width = w; cv360.height = h; disegnato360 = -1; disegna360(frame); }
  }
  function disegna360(i) {
    const im = cache360[i];
    if (!im || !pronti[i] || !cv360.width || disegnato360 === i) return;
    const r = Math.min(cv360.width / im.naturalWidth, cv360.height / im.naturalHeight);
    const w = im.naturalWidth * r, h = im.naturalHeight * r;
    cx360.clearRect(0, 0, cv360.width, cv360.height);
    cx360.drawImage(im, (cv360.width - w) / 2, (cv360.height - h) / 2, w, h);
    disegnato360 = i;
    if (!stage360.classList.contains('eso__360-stage--canvas')) stage360.classList.add('eso__360-stage--canvas');
  }
  new ResizeObserver(misura360).observe(stage360);
  misura360();
  cache360[0].decode?.().then(() => { disegna360(frame); }).catch(() => {});

  /* "completo" (evento load) non basta: un'immagine puo' essere
     scaricata e non ancora decodificata e assegnarla comunque a
     .src forza il browser a decodificarla li' per li' — un istante di
     vuoto bianco proprio mentre si trascina. decode() risolve solo
     quando il bitmap e' davvero pronto da disegnare, senza scatti. */
  function precarica360() {
    if (pronto) return;
    pronto = true;
    for (let i = 1; i < TOT; i++) {
      const im = new Image();
      im.src = src360(i);
      cache360[i] = im;
      const segnaPronto = () => {
        pronti[i] = true;
        if (frame === i && mostrato !== i) { disegna360(i); mostrato = i; }
      };
      if (im.decode) im.decode().then(segnaPronto).catch(segnaPronto);
      else im.addEventListener('load', segnaPronto);
    }
  }
  const io360 = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { precarica360(); io360.disconnect(); } });
  }, { rootMargin: '600px' });
  io360.observe(stage360);

  /* mai passare a un fotogramma non ancora decodificato: si resta
     fermi sull'ultimo buono e si aggiorna da solo appena e' pronto
     (dentro segnaPronto, se nel frattempo il dito e' rimasto li'). */
  function vaAFrame(i) {
    frame = ((i % TOT) + TOT) % TOT;
    if (pronti[frame] && mostrato !== frame) { disegna360(frame); mostrato = frame; }
  }
  /* Due maniglie piccole ai lati che pulsano, e un leggero dondolio del dispositivo:
     dicono che si puo' girare. Spariscono al primo tocco; con "riduci movimento" niente dondolio. */
  for (const lato of ['sx', 'dx']) {
    const m = document.createElement('span');
    m.className = `eso__360-maniglia eso__360-maniglia--${lato}`;
    m.setAttribute('aria-hidden', 'true');
    m.innerHTML = lato === 'sx' ? '<i>‹</i>' : '<i>›</i>';
    stage360.append(m);
  }
  let toccato = false, dondolaId = 0, inVista360 = false, t0dondolo = 0;
  const riduci = matchMedia('(prefers-reduced-motion: reduce)');
  function dondola(now) {
    if (toccato || !inVista360 || riduci.matches || document.hidden) { dondolaId = 0; return; }
    if (pronto && pronti.slice(0, 12).every(Boolean) && pronti.slice(TOT - 11).every(Boolean)) {
      if (!t0dondolo) t0dondolo = now;
      /* parte da fermo (seno) e sale piano: nessuno scatto a inizio movimento */
      const salita = Math.min(1, (now - t0dondolo) / 1200);
      vaAFrame(Math.round(Math.sin((now - t0dondolo) / 520) * 11 * salita));
    }
    dondolaId = requestAnimationFrame(dondola);
  }
  new IntersectionObserver(es => {
    inVista360 = es[0].isIntersecting;
    if (inVista360 && !dondolaId && !toccato) dondolaId = requestAnimationFrame(dondola);
  }, { rootMargin: '40px' }).observe(stage360);
  const finitoDondolio = () => { if (toccato) return; toccato = true; cancelAnimationFrame(dondolaId); stage360.classList.add('eso__360-stage--via'); };
  stage360.addEventListener('pointerdown', finitoDondolio, { capture: true });
  stage360.addEventListener('keydown', finitoDondolio, { capture: true });
  stage360.setAttribute('role', 'slider');
  stage360.setAttribute('tabindex', '0');
  stage360.setAttribute('aria-label', 'Vista a 360 gradi del dispositivo, trascina o usa le frecce per ruotarlo');
  stage360.setAttribute('aria-valuemin', '0');
  stage360.setAttribute('aria-valuemax', String(TOT - 1));
  stage360.addEventListener('pointerdown', e => {
    cancelAnimationFrame(inerziaId); /* un nuovo tocco ferma il giro libero */
    precarica360();
    trascinando = true; xInizio = e.clientX; frameInizio = frame;
    campioni = [{ x: e.clientX, t: performance.now() }];
    stage360.setPointerCapture(e.pointerId);
    stage360.classList.add('eso__360-stage--via');
  });
  stage360.addEventListener('pointermove', e => {
    if (!trascinando) return;
    const dx = e.clientX - xInizio;
    vaAFrame(frameInizio - Math.round(dx / PX_PER_FRAME));
    stage360.setAttribute('aria-valuenow', String(frame));
    /* una finestra di campioni, non solo l'ultimo movimento: un gesto
       che rallenta un attimo proprio alla fine (capita spesso quando
       si arriva a fondo corsa da un lato) non deve azzerare la
       velocita' — conta la media su un decimo di secondo, non l'ultimo
       istante */
    const ora = performance.now();
    campioni.push({ x: e.clientX, t: ora });
    while (campioni.length > 1 && ora - campioni[0].t > 100) campioni.shift();
  });
  /* se il dito o il mouse escono veloci, il dispositivo continua a
     girare e rallenta da solo — un attrito che dimezza la velocita'
     ogni frame finche' non scende sotto la soglia che si nota */
  function giroLibero() {
    vaAFrame(frame - Math.round(velocita * 16 / PX_PER_FRAME));
    stage360.setAttribute('aria-valuenow', String(frame));
    velocita *= 0.94;
    if (Math.abs(velocita) > 0.02) inerziaId = requestAnimationFrame(giroLibero);
  }
  const fine360 = () => {
    if (!trascinando) return;
    trascinando = false;
    const primo = campioni[0], ultimo = campioni[campioni.length - 1];
    const dt = ultimo ? ultimo.t - primo.t : 0;
    velocita = dt > 0 ? (ultimo.x - primo.x) / dt : 0;
    if (Math.abs(velocita) > 0.05) inerziaId = requestAnimationFrame(giroLibero);
  };
  stage360.addEventListener('pointerup', fine360);
  stage360.addEventListener('pointercancel', fine360);
  stage360.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); precarica360();
    vaAFrame(frame + (e.key === 'ArrowLeft' ? -3 : 3));
    stage360.setAttribute('aria-valuenow', String(frame));
  });
});

/* Luce sul bordo delle schede che segue il mouse (solo dove c'e' un
   mouse). Un solo ascoltatore, al massimo un aggiornamento per frame, e
   scrive due variabili su UNA scheda: quella sotto il puntatore. */
if (matchMedia('(hover:hover)').matches) {
  let scheda = null, px = 0, py = 0, attesa = false;
  document.addEventListener('pointermove', e => {
    scheda = e.target.closest?.('.offerta__card, .bench__panel') || null;
    if (!scheda || attesa) return;
    px = e.clientX; py = e.clientY; attesa = true;
    requestAnimationFrame(() => {
      attesa = false;
      if (!scheda) return;
      const r = scheda.getBoundingClientRect();
      scheda.style.setProperty('--mx', px - r.left + 'px');
      scheda.style.setProperty('--my', py - r.top + 'px');
    });
  }, { passive: true });
}

/* La scena degli infissi nella scheda CDI si muove solo mentre la scheda
   e' in vista: fuori schermo le sue animazioni restano in pausa. */
(() => {
  const cdi = $('.cdi');
  if (!cdi) return;
  cdi.classList.add('cdi--fermo');
  new IntersectionObserver(es => {
    cdi.classList.toggle('cdi--fermo', !es[0].isIntersecting);
  }, { rootMargin: '80px' }).observe(cdi);
})();

/* La scena animata di Studio CETS gira solo mentre la scheda e' in vista. */
(() => {
  const cest = $('.cest');
  if (!cest) return;
  cest.classList.add('cest--fermo');
  new IntersectionObserver(es => {
    cest.classList.toggle('cest--fermo', !es[0].isIntersecting);
  }, { rootMargin: '80px' }).observe(cest);
})();

/* La scena animata di Human Robots gira solo mentre la scheda e' in vista. */
(() => {
  const eso = $('.eso');
  if (!eso) return;
  eso.classList.add('eso--fermo');
  new IntersectionObserver(es => {
    eso.classList.toggle('eso--fermo', !es[0].isIntersecting);
  }, { rootMargin: '80px' }).observe(eso);
})();

/* Sezione delle skill: agli incroci della griglia compaiono e spariscono
   dei punti, ognuno col suo ritmo, come una luce che si accende a caso.
   Ne bastano una novantina fra i circa cinquecento incroci: di piu'
   sarebbe rumore e ogni punto e' un'animazione in piu' da tenere
   accesa. Si animano solo mentre la sezione e' in vista. */
(() => {
  const sez = $('#strumenti');
  const gruppo = sez?.querySelector('.strumenti__punti');
  if (!sez || !gruppo) return;
  const PASSO = 52, COL = 25, RIGHE = 20, QUANTI = 90;
  const incroci = [];
  for (let r = 1; r < RIGHE; r++) for (let c = 1; c < COL; c++) incroci.push([c * PASSO, r * PASSO]);
  for (let i = incroci.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [incroci[i], incroci[j]] = [incroci[j], incroci[i]];
  }
  const NS = 'http://www.w3.org/2000/svg';
  for (const [x, y] of incroci.slice(0, QUANTI)) {
    const p = document.createElementNS(NS, 'circle');
    p.setAttribute('cx', x); p.setAttribute('cy', y); p.setAttribute('r', 2.4);
    p.style.setProperty('--dur', (3.6 + Math.random() * 4.4).toFixed(2) + 's');
    p.style.setProperty('--rit', (-Math.random() * 8).toFixed(2) + 's');
    gruppo.append(p);
  }
  new IntersectionObserver(es => {
    sez.classList.toggle('strumenti--attivi', es[0].isIntersecting);
  }, { rootMargin: '80px' }).observe(sez);
})();

/* La striscia dei cinque marchi gira in tondo: finita da un lato
   ricomincia dall'altro, va da sola piano e si trascina col dito o col
   mouse, con la stessa inerzia della vista a 360°. Prima scorreva solo
   con lo scroll nativo: col mouse non si trascinava e su uno schermo
   stretto l'ultima copertina restava tagliata, irraggiungibile. */
const filaVetrina = $('.vetrina__fila');
if (filaVetrina) {
  const originali = [...filaVetrina.children];
  const binario = document.createElement('div');
  binario.className = 'vetrina__binario';
  binario.append(...originali);
  filaVetrina.append(binario);
  filaVetrina.classList.add('vetrina__fila--giro');

  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AUTO = calmo ? 0 : 0.03; /* px al millisecondo, circa 30px al secondo */
  let giro = 0, larghezzaSet = 1, verso = 1, velocita = AUTO, inerzia = false;
  let tenuto = false, sopra = false, fuoco = false, visibile = false;
  let xPrec = 0, mosso = 0, campioni = [], ultimo = 0, rafId = 0;

  const copia = el => {
    const c = el.cloneNode(true);
    c.dataset.copia = '';
    c.setAttribute('aria-hidden', 'true');
    c.tabIndex = -1;
    return c;
  };
  /* tante copie quante ne servono a riempire la fila piu' un giro intero,
     cosi' mentre scorre non si vede mai il vuoto in fondo */
  function costruisciCopie() {
    binario.querySelectorAll('[data-copia]').forEach(c => c.remove());
    originali.forEach(o => binario.append(copia(o)));
    const primaCopia = binario.querySelector('[data-copia]');
    larghezzaSet = (primaCopia.offsetLeft - originali[0].offsetLeft) || 1;
    const servono = Math.ceil(filaVetrina.clientWidth / larghezzaSet);
    for (let n = 0; n < servono; n++) originali.forEach(o => binario.append(copia(o)));
  }
  function disegna() {
    const x = ((giro % larghezzaSet) + larghezzaSet) % larghezzaSet;
    binario.style.transform = `translate3d(${-x}px,0,0)`;
  }
  /* la velocita' tende sempre a un bersaglio: il giro automatico nel
     verso dell'ultima spinta, oppure zero se il mouse ci sta sopra o una
     copertina ha il fuoco. Dopo una spinta ci arriva piano (inerzia),
     altrimenti in fretta: ferma e riparte senza scatti. */
  function passo(ora) {
    const dt = Math.min(50, ora - (ultimo || ora));
    ultimo = ora;
    if (!tenuto) {
      const bersaglio = (sopra || fuoco) ? 0 : verso * AUTO;
      const attrito = inerzia ? 0.94 : 0.88;
      velocita = bersaglio + (velocita - bersaglio) * Math.pow(attrito, dt / 16.7);
      if (inerzia && Math.abs(velocita - bersaglio) < 0.004) inerzia = false;
      giro += velocita * dt;
      disegna();
    }
    rafId = visibile ? requestAnimationFrame(passo) : 0;
  }

  filaVetrina.addEventListener('pointerdown', e => {
    if (e.button) return;
    tenuto = true; mosso = 0; xPrec = e.clientX; inerzia = false; velocita = 0;
    campioni = [{ x: e.clientX, t: performance.now() }];
  });
  filaVetrina.addEventListener('pointermove', e => {
    if (!tenuto) return;
    const dx = e.clientX - xPrec;
    xPrec = e.clientX;
    mosso += Math.abs(dx);
    /* la cattura solo oltre qualche pixel: un tocco fermo resta un clic
       sulla copertina e porta al suo caso */
    if (mosso > 6 && !filaVetrina.classList.contains('vetrina__fila--tira')) {
      try { filaVetrina.setPointerCapture(e.pointerId); } catch {}
      filaVetrina.classList.add('vetrina__fila--tira');
    }
    giro -= dx;
    disegna();
    const ora = performance.now();
    campioni.push({ x: e.clientX, t: ora });
    while (campioni.length > 1 && ora - campioni[0].t > 100) campioni.shift();
  });
  const lascia = e => {
    if (!tenuto) return;
    tenuto = false;
    filaVetrina.classList.remove('vetrina__fila--tira');
    const a = campioni[0], b = campioni[campioni.length - 1];
    const dt = b.t - a.t;
    /* tetto a 3 px/ms: uno strattone brusco non deve lanciare la fila
       per migliaia di pixel */
    const v = (e.type === 'pointerup' && dt > 0)
      ? Math.max(-3, Math.min(3, -(b.x - a.x) / dt)) : 0;
    if (Math.abs(v) > 0.05) verso = Math.sign(v);
    velocita = calmo ? 0 : v;
    inerzia = !calmo;
    /* il clic del rilascio arriva subito dopo: il contatore va tenuto
       finche' non e' passato, altrimenti il trascinamento apre un caso */
    setTimeout(() => { mosso = 0; }, 80);
  };
  filaVetrina.addEventListener('pointerup', lascia);
  filaVetrina.addEventListener('pointercancel', lascia);
  /* dopo un trascinamento il clic non deve aprire il caso sotto il dito */
  filaVetrina.addEventListener('click', e => {
    if (mosso > 6 && e.detail > 0) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  filaVetrina.addEventListener('dragstart', e => e.preventDefault());
  filaVetrina.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') sopra = true; });
  filaVetrina.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') sopra = false; });
  /* con la tastiera la copertina che prende il fuoco viene portata in
     vista e il giro si ferma finche' il fuoco resta nella fila */
  filaVetrina.addEventListener('focusin', e => {
    fuoco = true;
    const el = e.target.closest('.vetrina__caso');
    if (!el) return;
    const pos = el.offsetLeft - originali[0].offsetLeft;
    const x = ((giro % larghezzaSet) + larghezzaSet) % larghezzaSet;
    const inVista = pos - x;
    if (inVista < 0 || inVista + el.offsetWidth > filaVetrina.clientWidth) {
      giro = pos - 8;
      velocita = 0;
      disegna();
    }
  });
  filaVetrina.addEventListener('focusout', e => { fuoco = filaVetrina.contains(e.relatedTarget); });

  costruisciCopie();
  disegna();
  new IntersectionObserver(es => {
    visibile = es[0].isIntersecting;
    if (visibile && !rafId) { ultimo = 0; rafId = requestAnimationFrame(passo); }
  }).observe(filaVetrina);
  let attesaResize = 0;
  window.addEventListener('resize', () => {
    clearTimeout(attesaResize);
    attesaResize = setTimeout(() => { costruisciCopie(); disegna(); }, 150);
  });
}

/* "Un po' di più su di me" si scrive e si cancella a macchina, in
   loop, da quando entra in vista la prima volta — il cursore resta
   sempre acceso, non solo mentre batte. */
const macchinaSpan = $('.profilo__extra summary span');
if (macchinaSpan && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const testoIntero = macchinaSpan.textContent;
  macchinaSpan.textContent = '';
  macchinaSpan.classList.add('macchina-cursore');
  const macchinaIO = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      macchinaIO.disconnect();
      let i = 0, cancella = false;
      const battuta = () => {
        i += cancella ? -1 : 1;
        macchinaSpan.textContent = testoIntero.slice(0, i);
        let attesa = 38 + Math.random() * 42;
        if (!cancella && i >= testoIntero.length) { cancella = true; attesa = 1800; }
        else if (cancella && i <= 0) { cancella = false; attesa = 500; }
        setTimeout(battuta, attesa);
      };
      battuta();
    });
  }, { threshold: .8 });
  macchinaIO.observe(macchinaSpan);
}


/* La barra dei dati e il confine dell'eroe stanno in basso, fissi, solo nella prima
   schermata: dopo, lascerebbero il video e la lista sotto una fascia. */
(() => {
  const aggiorna = () => document.body.classList.toggle('hero-vivo', scrollY < innerHeight * .6);
  aggiorna();
  addEventListener('scroll', aggiorna, { passive: true });
  addEventListener('resize', aggiorna);
})();


/* Barra di navigazione in basso, su desktop: si chiude, scivola a destra e si rimette dal
   pulsante "Menu". Il pulsante di chiusura esiste solo sopra i 900 px. La scelta si ricorda. */
(() => {
  const dock = document.querySelector('.navdock');
  const chiudi = dock?.querySelector('.navdock__chiudi');
  const apri = document.querySelector('.navdock-apri');
  if (!dock || !chiudi || !apri) return;
  const chiave = 'navdock_chiuso';
  const imposta = (chiuso, dalUtente) => {
    dock.classList.toggle('chiuso', chiuso);
    chiudi.setAttribute('aria-expanded', String(!chiuso));
    apri.setAttribute('aria-expanded', String(!chiuso));
    try { localStorage.setItem(chiave, chiuso ? '1' : '0'); } catch (e) {}
    if (dalUtente) (chiuso ? apri : chiudi).focus({ preventScroll: true });
  };
  chiudi.addEventListener('click', () => imposta(true, true));
  apri.addEventListener('click', () => imposta(false, true));
  let ricordato = false;
  try { ricordato = localStorage.getItem(chiave) === '1'; } catch (e) {}
  if (ricordato) imposta(true, false);
})();


/* Le animazioni infinite delle sezioni si fermano quando la sezione e' fuori schermo: stesso aspetto, meno lavoro. */
(() => {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(voci => {
    for (const v of voci) v.target.classList.toggle('fuori', !v.isIntersecting);
  }, { rootMargin: '120px 0px' });
  document.querySelectorAll('main section, main .sec').forEach(el => io.observe(el));
})();
