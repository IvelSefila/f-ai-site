/* ═══════════════════════════════════════════════════════════════════
 * GLI STRUMENTI, UNO PER UNO
 *
 * L'elenco degli strumenti diceva soltanto dei nomi. Un nome non e' una
 * competenza: "Photoshop" lo scrivono tutti, e chi legge non sa se ci
 * ritocco una foto o ci costruisco un key visual. Qui ogni voce si apre
 * e dice cosa ci faccio io.
 *
 * I nomi restano scritti nell'HTML e non qui: sono trentacinque parole
 * che un motore di ricerca deve poter leggere, e senza JavaScript la
 * lista si legge lo stesso — semplicemente non si apre. Questo file
 * aggiunge le schede e trasforma le pastiglie in bottoni veri, non in
 * finti bottoni con role="button": la tastiera, il lettore di schermo e
 * il dito si aspettano un <button> e conviene darglielo.
 *
 * Le descrizioni le ho scritte partendo da cosa fa lo strumento e da
 * cosa il sito dichiara gia' altrove. Vanno lette e corrette dove non
 * corrispondono: sono l'unica parte di questa pagina che nessuna misura
 * puo' verificare al posto mio.
 * ═══════════════════════════════════════════════════════════════════ */

export const SCHEDE = {
  /* ── 01 · grafica e video ─────────────────────────────────────── */
  'Adobe Photoshop':
    'È dove un’immagine diventa un pezzo di campagna: maschere, colore, dettaglio, ' +
    'composizione del key visual. Ci passa tutto, anche quello che nasce generato — ' +
    'un’immagine AI senza questo passaggio si riconosce.',
  'Adobe Illustrator':
    'Marchi, icone e tutto quello che deve restare nitido da un bottone a un cartellone. ' +
    'Qui nascono le declinazioni vettoriali che poi entrano in ogni formato.',
  'Adobe Premiere Pro':
    'Il montaggio: dove decido il ritmo. Tagli, durate, versioni corte e lunghe dello ' +
    'stesso video, e le esportazioni per ogni piattaforma.',
  'Adobe Audition':
    'Pulizia dell’audio: voce, rumore di fondo, livelli. Serve soprattutto sulle voci ' +
    'sintetiche, che senza una passata qui si sentono per quello che sono.',
  'Adobe InDesign':
    'Gli impaginati lunghi — cataloghi, brochure, presentazioni — e tutto quello che va ' +
    'in stampa con una griglia da rispettare pagina dopo pagina.',

  /* ── 02 · assistenti e coding ─────────────────────────────────── */
  'ChatGPT':
    'Prime stesure, revisione di testi, ricerca veloce. Lo uso come una spalla che ' +
    'propone, non come una firma: quello che esce lo riscrivo.',
  'Claude / Code / Design':
    'Ci scrivo codice. Questo sito è costruito così: ogni interazione, ogni animazione e ' +
    'ogni prova automatica che lo controlla. È anche quello con cui rileggo e semplifico ' +
    'il codice già scritto.',
  'Gemini / Antigravity':
    'Il confronto sulla stessa richiesta fatta a un modello diverso, e i documenti lunghi ' +
    'da leggere tutti insieme.',
  'xAI Grok':
    'Un secondo parere con un tono diverso, quando un testo o un’idea mi sembrano già ' +
    'sentiti e voglio sapere se lo sono davvero.',
  'Perplexity':
    'Ricerca con le fonti in chiaro. Lo uso quando mi serve un dato verificabile e non ' +
    'un’opinione ben scritta.',

  /* ── 03 · immagine, video e audio generati ────────────────────── */
  'GPT Image 2.0':
    'Immagini su brief preciso: mockup, varianti di un key visual, prove di direzione ' +
    'prima di impegnare una giornata di lavoro.',
  'Nano Banana 2':
    'Modifiche puntuali su un’immagine che esiste già — cambiare un oggetto, un colore, ' +
    'uno sfondo — lasciando identico tutto il resto. È la cosa più difficile da ottenere.',
  'Grok Image':
    'Generazione rapida per esplorare direzioni diverse quando ancora non so dove voglio ' +
    'andare a parare.',
  'Seedance 2.0':
    'Fa muovere un fotogramma fermo: da un’immagine tira fuori una clip, con il ' +
    'movimento di camera che chiedo.',
  'Gemini Omni':
    'Testo, immagine e audio nello stesso passaggio, quando un contenuto deve nascere ' +
    'già coerente su tutti e tre.',
  'Grok Video':
    'Clip brevi per i social, dove conta arrivare in fretta con qualcosa che si guarda ' +
    'fino in fondo.',
  'HeyGen':
    'Avatar che parlano: video formativi, annunci e messaggi ripetitivi senza montare ' +
    'una troupe per ogni versione.',
  'Higgsfield':
    'Video generato con il controllo sulla camera. È quello con cui ho fatto i ' +
    'fotogrammi della versione in pixel art di questo portfolio: un filmato vero, poi ' +
    'spezzato fotogramma per fotogramma.',
  'ElevenLabs':
    'Voce narrante sintetica e doppiaggio. Con una voce clonata una serie di contenuti ' +
    'resta riconoscibile anche se la registro in giorni diversi.',
  'Avatar AI':
    'Presentatori digitali per i contenuti che vanno rifatti spesso e uguali: cambia il ' +
    'testo, non serve rigirare.',
  'Voice Cloning':
    'Una voce sola su tutta una serie. Serve alla continuità: la stessa voce, la stessa ' +
    'cadenza, in tutti gli episodi.',

  /* ── 04 · workflow e AI in locale ─────────────────────────────── */
  'n8n':
    'Le automazioni: collego servizi fra loro, decido l’ordine dei passaggi e ci metto un ' +
    'controllo umano dove sbagliare costa. È qui che un flusso smette di essere un ' +
    'disegno e comincia a girare.',
  'ComfyUI':
    'Le pipeline di generazione immagine costruite nodo per nodo. Il vantaggio è che si ' +
    'ripetono: lo stesso schema dà lo stesso tipo di risultato la settimana dopo.',
  'Stable Diffusion':
    'Generazione sul mio computer, senza che i materiali di un cliente escano da qui. ' +
    'Quando c’è un vincolo di riservatezza è l’unica strada.',
  'Ollama':
    'Modelli che girano in locale: nessun costo per richiesta e nessun dato che parte. ' +
    'Per i lavori ripetitivi cambia il conto a fine mese.',
  'LM Studio':
    'Il banco di prova dei modelli locali: li installo, li confronto su qualità, velocità ' +
    'e memoria, e poi scelgo. I numeri della sezione Tecnologia vengono da qui.',
  'Hooks Engineering':
    'Agganci che fanno partire un controllo automatico a ogni passaggio di un flusso, ' +
    'così un errore si ferma dove nasce invece di arrivare in fondo.',

  /* ── 05 · AI engineering e automazioni ────────────────────────── */
  'Prompt Engineering':
    'Scrivere istruzioni che danno lo stesso risultato anche domani. È la differenza fra ' +
    'un colpo fortunato e qualcosa su cui si può costruire un lavoro.',
  'Prompt JSON':
    'Richieste strutturate, quando la risposta non deve essere letta da una persona ma ' +
    'entrare dritta dentro un altro programma.',
  'Skills Engineering':
    'Impacchettare un metodo di lavoro perché un assistente lo ripeta uguale ogni volta, ' +
    'invece di rispiegarglielo da capo a ogni sessione.',
  'Memoria persistente AI / Mem0':
    'Far ricordare a un assistente il progetto fra una sessione e l’altra: cosa si è ' +
    'deciso, cosa si è scartato e perché.',
  'Agenti AI':
    'Assistenti che portano avanti più passaggi da soli e si fermano dove serve una ' +
    'firma umana. Il mestiere sta nel decidere dove metterla, quella firma.',
  'Automazioni AI':
    'Togliere di mezzo il lavoro ripetitivo — rinomina, ritaglio, adattamento ai formati, ' +
    'pubblicazione — per tenere le ore sulle decisioni.',

  /* ── 06 · social e pubblicazione ──────────────────────────────── */
  'Meta Business Suite':
    'Programmazione e pubblicazione su Facebook e Instagram, e i numeri dopo: cosa ha ' +
    'funzionato, su quale formato, a che ora.',
  'Postiz':
    'Un calendario editoriale solo, da cui esce tutto su più piattaforme. Serve alla ' +
    'continuità, che sui social è quasi tutto.',
};

/* ── la scheda ────────────────────────────────────────────────────── */
let scheda = null;

function costruisci() {
  const d = document.createElement('dialog');
  d.className = 'scheda';
  d.id = 'schedaStrumento';
  d.setAttribute('aria-labelledby', 'schedaTit');
  d.innerHTML = `
    <p class="scheda__cat mono"></p>
    <h3 id="schedaTit"></h3>
    <p class="scheda__testo"></p>
    <div class="scheda__piede">
      <!-- La scheda e' modale: finche' e' aperta, gli strumenti dietro non
           si toccano. La prima versione di questa riga prometteva il
           contrario, e una promessa che non si mantiene e' peggio del
           silenzio. -->
      <span class="mono">Uno alla volta · Esc per chiudere</span>
      <button type="button" class="btn btn--sm" data-scheda-chiudi>Chiudi</button>
    </div>`;
  document.body.appendChild(d);
  d.querySelector('[data-scheda-chiudi]').addEventListener('click', () => d.close());
  /* il clic sul fondo scuro chiude, come nel pannello del colore */
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  return d;
}

function apri(nome, testo, categoria, colore) {
  scheda ||= costruisci();
  scheda.style.setProperty('--tool', colore || 'var(--em)');
  scheda.querySelector('.scheda__cat').textContent = categoria;
  scheda.querySelector('#schedaTit').textContent = nome;
  scheda.querySelector('.scheda__testo').textContent = testo;
  if (!scheda.open) scheda.showModal();
  scheda.querySelector('[data-scheda-chiudi]').focus();
}

/* ── le pastiglie diventano bottoni ───────────────────────────────── */
export function initStrumenti() {
  const senza = [];
  for (const gruppo of document.querySelectorAll('.stack__group')) {
    const eti = gruppo.querySelector('b');
    /* "01 GRAFICA + VIDEO" → "Grafica + video": il numero e' ordine, non nome */
    const categoria = (eti ? eti.textContent : '').replace(/^\s*\d+\s*/, '').trim();
    const colore = getComputedStyle(gruppo).getPropertyValue('--tool').trim();

    for (const vecchio of [...gruppo.querySelectorAll('div > span')]) {
      const nome = vecchio.textContent.trim();
      const testo = SCHEDE[nome];
      if (!testo) { senza.push(nome); continue; }   /* senza scheda resta com'e' */

      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = nome;
      b.setAttribute('aria-haspopup', 'dialog');
      b.title = `Cosa faccio con ${nome}`;
      b.addEventListener('click', () => apri(nome, testo, categoria, colore));
      vecchio.replaceWith(b);
    }
  }
  /* Un nome nuovo nell'elenco senza la sua scheda resterebbe una
     pastiglia morta in mezzo a trentaquattro vive, e nessuno se ne
     accorgerebbe guardando. Lo dico qui e lo controlla audit/strumenti.mjs. */
  if (senza.length) console.warn('strumenti senza scheda:', senza.join(', '));
  return senza;
}
