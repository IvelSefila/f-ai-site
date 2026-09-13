/* ═══════════════════════════════════════════════════════════════════
* app.js — la sessione. Tiene il filo fra le prove, parla, misura,
* e alla fine scrive il dossier. Nessuna libreria.
* ═══════════════════════════════════════════════════════════════════ */
import { initHero } from './hero.js?v=20260911-135324';
import { initStrumenti } from './strumenti.js?v=20260911-135324';
import { initUnion } from './union.js?v=20260911-135324';
import { initLocanda } from './locanda.js?v=20260911-135324';
import { initPalette } from './palette.js?v=20260911-135324';
import { keyVisual, timeline, radar, MODES, rng, leggiColori} from './engine.js?v=20260911-135324';
import { initBrief } from './brief.js?v=20260911-135324';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const mmss = ms => `${pad(Math.floor(ms / 60000))}:${pad(Math.floor(ms / 1000) % 60)}`;

/* ── stato di sessione ─────────────────────────────────────────── */
/* nell'ordine in cui si incontrano scendendo, che da oggi comincia dai
   servizi: e' la prima cosa che un cliente deve trovare */
const PROOFS = [
  ['banchi', 'Servizi — hai manovrato uno degli strumenti'],
  ['lavori', 'Lavori — hai rigenerato un sistema visivo'],
  ['regia', 'Control room — hai deciso dove entra la macchina'],
  ['metodo', 'Metodo — hai percorso la pipeline'],
  ['tecnologia', 'Tecnologia — hai confrontato le modalità'],
  ['laboratorio', 'Playlab — hai visto i motori di gioco'],
  ['materia', 'Materia — hai riorganizzato la stessa sostanza'],
];
const S = {
  t0: performance.now(),
  proofs: new Set(),
  actions: 0,
  mix: 0.3,
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
const VOICE = {
  regia: 'Prova 01. Sposta la testina: cambia l’artefatto, non una barra.',
  lavori: 'Prova 02. Queste immagini le disegna la pagina. Cambia il seed.',
  banchi: 'Prova 03. Quattro strumenti veri, uno per servizio.',
  metodo: 'Prova 04. L’input entra in cima e attraversa le cinque fasi.',
  tecnologia: 'Prova 05. Locale, cloud o ibrido: stime dichiarate, non promesse.',
  laboratorio: 'Prova 06. Quattro motori di gioco scritti da zero.',
  materia: 'Prova 07. Dodicimila punti, una sola materia, tre disposizioni.',
  brief: 'Sei domande. Il riepilogo si costruisce qui, nel tuo browser.',
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
      heroScene.textContent = `Sistema di verifica · ${st.sceneName}`;
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

/* ══════════ 01 · CONTROL ROOM ══════════ */
const kv = $('#kvCanvas'), kvCtx = kv.getContext('2d');
const mix = $('#mix'), mixOut = $('#mixOut'), kvLabel = $('#kvLabel'), kvSeed = $('#kvSeed'),
kvDecisions = $('#kvDecisions'), phaseNote = $('#phaseNote');
const PHASES = [
  ['Brief', 'Definisco obiettivo, pubblico, canali e vincoli. L’AI non parte ancora.', 0.05, 'Un’idea,\nun vincolo'],
  ['Direzione', 'Costruisco concept, riferimenti, tono e ritmo. Decido quali parti richiedono lavoro tradizionale e quali possono beneficiare dell’AI.', 0.2, 'Una direzione,\nnon un’opzione'],
  ['Produzione', 'Creo, monto e genero solo ciò che serve. Ogni output entra in una sequenza progettata, non in una raccolta casuale di prove.', 0.72, 'Molte varianti,\nuna voce'],
  ['Controllo', 'Seleziono, correggo e confronto. Coerenza, ritmo, leggibilità e qualità finale restano sotto supervisione umana.', 0.45, 'Scelgo io\nquale resta'],
  ['Consegna', 'Preparo versioni, formati e indicazioni d’uso: il risultato deve funzionare davvero nei canali previsti.', 0.15, 'Pronto\nper la stampa'],
];
let kvSeedV = 4821, phase = 0;

function drawKv() {
  const ai = +mix.value / 100;
  S.mix = ai;
  mix.style.setProperty('--v', `${mix.value}%`);
  const d = keyVisual(kvCtx, {
      w: kv.width, h: kv.height, seed: kvSeedV, ai,
      weight: 0.55, title: PHASES[phase][3], kicker: `F/AI · ${PHASES[phase][0]}`,
    });
  mixOut.textContent = `${mix.value}% sistema`;
  kvLabel.textContent = ai < .25 ? 'Regia umana' : ai < .6 ? 'Regia condivisa' : 'Guida del sistema';
  kvSeed.textContent = `seed ${kvSeedV}`;
  kvDecisions.innerHTML = d.map(x => `<li>${x}</li>`).join('');
}
mix.addEventListener('input', () => { drawKv(); act(); proof('regia'); });
$$('.phases button').forEach(b => b.addEventListener('click', () => {
      $$('.phases button').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      phase = +b.dataset.phase;
      phaseNote.textContent = PHASES[phase][1];
      mix.value = Math.round(PHASES[phase][2] * 100);
      drawKv(); act(); proof('regia');
      say(`Fase ${pad(phase + 1)} — ${PHASES[phase][0]}. ${PHASES[phase][1]}`);
    }));
$('#kvNew').addEventListener('click', () => { kvSeedV = (Math.random() * 9999) | 0; drawKv(); act(); proof('regia'); });
$('#kvPng').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `fai-keyvisual-${kvSeedV}.png`;
    a.href = kv.toDataURL('image/png');
    a.click(); act();
    say('Esportato. Lo stesso seed rigenera esattamente questa immagine.');
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
          title: w.headline, kicker: `F/AI · ${pad(i + 1)}` });
      el.querySelector('.sv').textContent = sd;
    };
    el.querySelector('.work__seed button').addEventListener('click', () => {
        sd = (Math.random() * 9999) | 0; draw(); act(); proof('lavori');
        say('Stesso linguaggio, composizione nuova. È questa la differenza fra un sistema e un colpo di fortuna.');
      });
    el.querySelector('details').addEventListener('toggle', e => { if (e.target.open) { act(); proof('lavori'); } });
    RIDISEGNI.push(draw);
    queueMicrotask(draw);
  });

/* ══════════ 03 · BANCHI ══════════ */
$$('.tabs button').forEach(b => b.addEventListener('click', () => {
      $$('.tabs button').forEach(x => { x.setAttribute('aria-selected', 'false'); $('#' + x.getAttribute('aria-controls')).hidden = true; });
      b.setAttribute('aria-selected', 'true');
      const panel = $('#' + b.getAttribute('aria-controls'));
      panel.hidden = false;
      act(); proof('banchi');
      if (panel.id === 'b-video') drawTl();
      if (panel.id === 'b-grafica') drawFormats();
      if (panel.id === 'b-social') drawSocial();
    }));

/* — grafica: un’idea, tre proporzioni — */
const FORMATS = [['9:16', 405, 720, 'Storia'], ['4:5', 576, 720, 'Feed'], ['1:1', 640, 640, 'Quadrato']];
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
const fmtIdea = $('#fmtIdea'), fmtOut = $('#fmtOut'), fmtDecisions = $('#fmtDecisions');
function drawFormats() {
  const wgt = +fmtIdea.value / 100;
  fmtIdea.style.setProperty('--v', `${fmtIdea.value}%`);
  fmtOut.textContent = fmtIdea.value;
  let last = [];
  fmtCanvases.forEach((c, i) => {
      last = keyVisual(c.getContext('2d'), {
          w: c.width, h: c.height, seed: 1908 + i, ai: .3, weight: wgt,
          title: 'Un’idea,\npiù formati', kicker: `F/AI · ${FORMATS[i][0]}`,
        });
    });
  const cut = Math.round(lerpPct(wgt));
  fmtDecisions.innerHTML = [
    `titolo su <b>${(1 + wgt * 2).toFixed(1)}×</b> il corpo`,
    `zona sicura verticale <b>${Math.round(8 + wgt * 10)}%</b>`,
    `elementi tagliati in 9:16: <b>${cut}</b>`,
    `stessa griglia su <b>3</b> proporzioni`,
    ...last.slice(0, 1),
  ].map(x => `<li>${x}</li>`).join('');
}
const lerpPct = w => 1 + w * 5;
fmtIdea.addEventListener('input', () => { drawFormats(); act(); proof('banchi'); });

/* — video: il ritmo si vede — */
const tl = $('#tlCanvas'), tlCtx = tl.getContext('2d');
const tlPace = $('#tlPace'), tlOut = $('#tlOut'), tlTc = $('#tlTc'), tlRhythm = $('#tlRhythm'), tlDecisions = $('#tlDecisions');
let tlHead = .35;
function drawTl() {
  tlPace.style.setProperty('--v', `${tlPace.value}%`);
  const res = timeline(tlCtx, { w: tl.width, h: tl.height, pace: +tlPace.value / 100, head: tlHead, seed: 91 });
  tlTc.textContent = res.tc;
  tlRhythm.textContent = `Taglio ${pad(res.cut)}/${pad(res.n)}`;
  tlOut.textContent = res.label;
  tlDecisions.innerHTML = res.decisions.map(x => `<li>${x}</li>`).join('');
}
tlPace.addEventListener('input', () => { drawTl(); act(); proof('banchi'); });
let tlDrag = false;
const tlFrom = e => {
  const r = tl.getBoundingClientRect();
  tlHead = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  drawTl();
};
tl.addEventListener('pointerdown', e => { tl.setPointerCapture(e.pointerId); tlDrag = true; tlFrom(e); act(); proof('banchi'); });
tl.addEventListener('pointermove', e => { if (tlDrag) tlFrom(e); });
tl.addEventListener('pointerup', () => { tlDrag = false; });

/* — social: stesso concetto, tre piazze — */
const SOCIALS = [['Reel', 405, 720, 'TikTok / Reels'], ['Post', 576, 720, 'Instagram'], ['Cover', 720, 405, 'YouTube']];
const socCanvases = buildFormats($('#socials'), SOCIALS);
const socDens = $('#socDens'), socOut = $('#socOut'), socDecisions = $('#socDecisions');
function drawSocial() {
  const d = +socDens.value / 100;
  socDens.style.setProperty('--v', `${socDens.value}%`);
  socOut.textContent = socDens.value;
  socCanvases.forEach((c, i) => keyVisual(c.getContext('2d'), {
        w: c.width, h: c.height, seed: 640 + i * 31, ai: .25 + d * .5, weight: .4 + d * .4,
        title: 'Un format,\nogni piazza', kicker: `F/AI · ${SOCIALS[i][3]}`,
      }));
  socDecisions.innerHTML = [
    `zona sicura alta <b>${Math.round(12 + d * 8)}%</b> per la UI`,
    `titolo leggibile a <b>${Math.round(320 - d * 90)}px</b> di larghezza`,
    `elementi per frame: <b>${Math.round(3 + d * 9)}</b>`,
    `stessa palette su <b>3</b> piattaforme`,
  ].map(x => `<li>${x}</li>`).join('');
}
socDens.addEventListener('input', () => { drawSocial(); act(); proof('banchi'); });

/* — flussi: un grafo che gira davvero — */
const NODES = [
  ['Brief', 'ingresso', 'obiettivo + vincoli'],
  ['Materiali', 'raccolta', '18 asset indicizzati'],
  ['Generazione', 'modello', '12 varianti prodotte'],
  ['Revisione umana', 'controllo', '3 tenute, 9 scartate'],
  ['Consegna', 'uscita', 'pacchetto pronto'],
];
const graph = $('#graph'), grLog = $('#grLog'), grState = $('#grState'), grTime = $('#grTime');
NODES.forEach(([name, kind], i) => {
    const n = document.createElement('div');
    n.className = 'node' + (i === 3 ? ' human' : '');
    n.innerHTML = `<span class="mono">${pad(i + 1)} · ${kind}</span><b>${name}</b><span class="out"></span>`;
    graph.append(n);
  });
let running = false;
$('#grRun').addEventListener('click', async () => {
    if (running) return;
    running = true; act(); proof('banchi');
    const nodes = $$('.node', graph);
    nodes.forEach(n => { n.className = n.className.replace(/ (run|ok)/g, ''); n.querySelector('.out').textContent = ''; });
    grLog.innerHTML = ''; grState.textContent = 'In esecuzione';
    const t0 = performance.now();
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].classList.add('run');
      grState.textContent = `Nodo ${pad(i + 1)} · ${NODES[i][0]}`;
      await new Promise(r => setTimeout(r, 520));
      nodes[i].classList.remove('run'); nodes[i].classList.add('ok');
      nodes[i].querySelector('.out').textContent = NODES[i][2];
      grLog.insertAdjacentHTML('beforeend', `<li>${pad(i + 1)} <b>${NODES[i][0]}</b> — ${NODES[i][2]}</li>`);
      grTime.textContent = `${Math.round(performance.now() - t0)} ms`;
    }
    grState.textContent = 'Completato';
    say('Il flusso è passato dalla revisione umana prima di uscire. È il punto che non tolgo mai.');
    running = false;
  });
$('#grReset').addEventListener('click', () => {
    $$('.node', graph).forEach(n => { n.className = n.className.replace(/ (run|ok)/g, ''); n.querySelector('.out').textContent = ''; });
    grLog.innerHTML = ''; grState.textContent = 'Fermo'; grTime.textContent = '—'; act();
  });

/* i banchi sono tab veri: tabindex mobile e frecce, come da pattern ARIA */
const benchTabs = $$('.tabs button');
function focusTab(i) {
  const t = benchTabs[(i + benchTabs.length) % benchTabs.length];
  benchTabs.forEach(x => x.tabIndex = -1);
  t.tabIndex = 0; t.focus(); t.click();
}
benchTabs.forEach((t, i) => {
    t.addEventListener('click', () => benchTabs.forEach((x, k) => x.tabIndex = k === i ? 0 : -1));
    t.addEventListener('keydown', e => {
        const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: benchTabs.length - 1 };
        if (!(e.key in map)) return;
        e.preventDefault(); focusTab(map[e.key]);
      });
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
  $('#dsMix').textContent = `${Math.round(S.mix * 100)}% AI`;
  const avg = S.fps.length ? Math.round(S.fps.reduce((a, b) => a + b, 0) / S.fps.length) : 0;
  $('#dsFps').textContent = avg ? `${avg} fps` : '—';
  $('#dsDate').textContent = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  voiceCount.textContent = S.proofs.size;
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
initBrief();
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
$$('.sec__head, .bench, .deck, .pipe, .lab, .dossier, .metrics').forEach(el => el.classList.add('rv'));
const rvIO = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
$$('.rv').forEach(el => rvIO.observe(el));

const secIO = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      $$('.bar__nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
      if (VOICE[id] && !S.seen.has(id)) { S.seen.add(id); say(VOICE[id], id === 'verdetto'); }
      if (id === 'verdetto') renderDossier();
    }), { threshold: .3 });
$$('main > section[id]').forEach(s => secIO.observe(s));

/* orologio di sessione */
setInterval(() => {
    barTime.textContent = mmss(performance.now() - S.t0);
    if (!$('#verdetto').hidden) renderDossier();
  }, 1000);

/* ══════════ AVVIO ══════════ */
await document.fonts?.ready;
drawKv();
drawFormats();
drawTl();
drawSocial();
drawRadar(0);
renderDossier();
setTimeout(() => say('Sessione aperta. Ti mostro cosa so fare, non te lo racconto.'), 900);

/* ══════════ COLORE DEL SITO ══════════
   Pressione lunga su un riquadro (o tasto destro col mouse) per
   scegliere fra sette palette. La scelta resta nel browser.

   Il foglio di stile si ribalta da solo: tutto chiede il colore alle
   variabili. I canvas no — i loro colori stanno in JavaScript, quindi
   vanno riletti e i disegni rifatti. */
document.addEventListener('palette', () => {
  leggiColori();
  const modo = $$('.modes button[data-mode]').findIndex(b => b.getAttribute('aria-pressed') === 'true');
  try { drawKv(); } catch {}
  try { drawFormats(); } catch {}
  try { drawTl(); } catch {}
  try { drawSocial(); } catch {}
  try { drawRadar(Math.max(0, modo)); } catch {}
  RIDISEGNI.forEach(f => { try { f(); } catch {} });
});
initPalette();
initStrumenti();
initUnion();
initLocanda();
