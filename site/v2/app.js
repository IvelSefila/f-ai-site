/* ═══════════════════════════════════════════════════════════════════
* app.js — la sessione. Tiene il filo fra le prove, parla, misura,
* e alla fine scrive il dossier. Nessuna libreria.
* ═══════════════════════════════════════════════════════════════════ */
import { initHero } from './hero.js?v=20260911-135324';
import { initStrumenti } from './strumenti.js?v=20260911-135324';
import { initUnion } from './union.js?v=20260911-135324';
import { initEso } from './eso.js?v=20260911-135324';
import { initLocanda } from './locanda.js?v=20260911-135324';
import { initCest } from './cest.js?v=20260911-135324';
import { initPalette } from './palette.js?v=20260911-135324';
import { keyVisual, radar, MODES, rng, leggiColori} from './engine.js?v=20260911-135324';
import { initBrief } from './brief.js?v=20260911-135324';
import { initServizi } from './servizi.js?v=20260911-135324';

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
   diceva "Prova 01". Adesso sono gli stessi dell'HTML, e sono cinque
   perche' due sezioni sono diventate blocchi dentro altre due. */
const VOICE = {
  banchi: 'Prova 01. Quattro servizi. Apri ognuno per il dettaglio.',
  lavori: 'Prova 02. Tre lavori veri. I video partono solo se li apri.',
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
let readIx = -1, rTyped = '', rTo = '', rAt = 0;

const hero = initHero($('#gl'), (st, kind) => {
    if (kind === 'grab') { act(); }
    if (kind === 'scene') {
      hScene.textContent = `${pad(st.scene + 1)}/0${3}`;
      segnaScena(st.scene);
      act();
      return;
    }
    const ai = Math.round(st.split * 100);
    hHuman.textContent = `${100 - ai}%`;
    hAi.textContent = `${ai}%`;
    hEr.textContent = st.erode.toFixed(2);
    hFps.textContent = st.fps ? `${st.fps} fps` : '—';
    railFill.style.width = `${ai}%`;
    railKnob.style.left = `${ai}%`;
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
  return list.map(([name, w, h, use]) => {
      const f = document.createElement('figure');
      f.innerHTML = `<canvas width="${w}" height="${h}"></canvas><figcaption><span>${use}</span><b>${name}</b></figcaption>`;
      host.append(f);
      return f.querySelector('canvas');
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
function drawFormats() {
  const wgt = +fmtIdea.value / 100;
  fmtIdea.style.setProperty('--v', `${fmtIdea.value}%`);
  fmtOut.textContent = fmtIdea.value;
  fmtSeedV.textContent = fmtSeed;
  fmtCanvases.forEach((c, i) => {
      keyVisual(c.getContext('2d'), {
          w: c.width, h: c.height, seed: fmtSeed, ai: .3, weight: wgt,
          title: fmtTitolo, kicker: `MF/AI · ${FORMATS[i][0]}`,
        });
    });
}
/* Lo slider spara 'input' molto piu' spesso di un frame durante il
   trascinamento (misurato: fino a decine di eventi al secondo), e ogni
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
$('#fmtNew').addEventListener('click', () => {
  fmtSeed = (Math.random() * 9999) | 0;
  fmtTitolo = FMT_TITOLI[(Math.random() * FMT_TITOLI.length) | 0];
  drawFormats(); act(); proof('banchi');
});

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
   mestiere, e la finestra finisce con l'invito al brief — con la
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

/* Due sezioni possono essere in vista insieme, e prima vinceva quella
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

/* orologio di sessione */
setInterval(() => {
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
    'Sette palette, calcolate per il contrasto',
    'Due applicazioni mie, usate ogni giorno',
    'Trentotto strumenti, uno scelto per ogni lavoro',
    'Dal brief al file finito, senza passare la mano',
    'AI dove serve davvero, mai per riempire uno slide',
  ];
  let i = 0;
  heroScene.textContent = FRASI[0];
  const riduci = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  setInterval(() => {
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
   Senza JavaScript apre e chiude di scatto, e va benissimo — e'
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
    blocco.open ? chiudi() : apri();
  });
})();
/* I quattro casi avvisano quando qualcuno guarda davvero un pezzo: e'
   la prova "Lavori" del dossier, e vale piu' di uno scorrimento. */
const guardato = () => { act(); proof('lavori'); };
initUnion(guardato);
initEso(guardato);
initLocanda(guardato);
initCest(guardato);
