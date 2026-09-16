/* ═══════════════════════════════════════════════════════════════════
 * LE QUATTRO SCHEDE DEI SERVIZI, APERTE
 *
 * Le schede dicevano una riga a testa: "Creo la direzione visiva e la
 * porto nei formati che servono alla campagna." E' vero e non basta —
 * e' la stessa frase che scriverebbe chiunque faccia il mestiere. Chi
 * legge non sa cosa gli arriva in mano, come ci si arriva, ne' dove
 * andare a vedere se e' successo davvero.
 *
 * Ogni scheda adesso apre una finestra che risponde a quattro domande
 * separate, e in quest'ordine:
 *
 *   consegno  → COSA TI ARRIVA. Oggetti, non aggettivi: file, formati,
 *               pezzi finiti. E' la prima perche' e' la prima che uno si
 *               fa davvero.
 *   lavoro    → COME CI SI ARRIVA. Tre o quattro passaggi, quelli veri,
 *               compresi quelli scomodi (di cinquanta spezzoni generati
 *               ne entra meno della meta').
 *   con       → CON COSA. Solo nomi che stanno gia' nell'elenco degli
 *               strumenti di questa pagina: se un nome e' qui e non e'
 *               li', uno dei due sta mentendo.
 *   dove      → DOVE SI VEDE. Collegamenti ai lavori veri, nella stessa
 *               pagina. E' la parte che rende le altre tre verificabili
 *               invece che dichiarate.
 *
 * E la finestra finisce con l'invito al brief, con la risposta gia'
 * segnata. L'ordine cambia: prima si spiega, poi si chiede. Prima
 * l'invito stava sulla scheda chiusa e chiedeva a chi non sapeva ancora
 * cosa stesse chiedendo.
 *
 * Il meccanismo della finestra e' lo stesso degli strumenti
 * (strumenti.js): <dialog> vero, modale, Esc chiude, il clic sul fondo
 * pure. Non si reinventa una finestra che il sito ha gia'.
 *
 * Come per le schede degli strumenti: il contenuto qui sotto e' l'unica
 * parte che nessuna misura puo' verificare. Va riletto e corretto dove
 * non corrisponde.
 * ═══════════════════════════════════════════════════════════════════ */

export const SERVIZI = {
  grafica: {
    num: '01', cat: 'Campagne', tit: 'Grafica pubblicitaria',
    lede: 'La direzione visiva di una campagna e tutte le sue declinazioni. Parte da un’idea da difendere, non da un formato da riempire.',
    consegno: [
      'Il key visual, e le varianti che servono a reggerlo',
      'Le declinazioni per ogni formato: stampa, social, digitale',
      'Locandine e manifesti, fermi o animati',
      'Marchi e lettering chiusi in vettoriale, con le versioni per ogni uso',
      'I file sorgente, non solo le esportazioni',
    ],
    lavoro: [
      'Prima capisco il risultato, poi scelgo gli strumenti. È in quest’ordine, e non è una frase: decide tutto il resto.',
      'Il key visual lo verifico su tre proporzioni prima di dichiararlo finito. Se regge solo in una, non è finito.',
      'Le declinazioni non sono ridimensionamenti: cambiano la griglia, la scala tipografica e cosa resta fuori.',
    ],
    con: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'GPT Image 2.5', 'Nano Banana 2'],
    dove: [
      ['#caso-union', 'Union Energia', 'un mondo inventato e nove pezzi di campagna'],
      ['#caso-locanda', 'La Locanda del Castello', 'marchio, nove locandine animate, cinque brani'],
      ['#caso-cest', 'Studio CETS', 'un marchio nato da zero e messo subito al lavoro'],
    ],
  },

  video: {
    num: '02', cat: 'Movimento', tit: 'Video e post-produzione',
    lede: 'Dal materiale grezzo — o da niente — a un pezzo montato sul ritmo. Comprese le scene che non si possono riprendere.',
    consegno: [
      'Il montaggio: tagli, ritmo, durata',
      'Motion graphic, titolazione e sottotitoli',
      'Compositing e correzione del colore',
      'Audio: voce pulita, musica, effetti sotto il parlato',
      'Le versioni che servono davvero — corta e lunga, orizzontale e verticale',
    ],
    lavoro: [
      'Il montaggio decide prima dell’AI: il ritmo si stabilisce sulla timeline, non in fase di generazione.',
      'Quello che non si può riprendere si genera un’inquadratura per volta. Di una cinquantina di spezzoni ne entra in montaggio meno della metà: è il costo di tenere solo quelli buoni.',
      'Il verticale non è l’orizzontale ritagliato. Sono due montaggi, e si vede subito quando non lo sono.',
    ],
    con: ['Adobe Premiere Pro', 'Adobe Audition', 'Gemini Omni', 'Grok Video', 'Seedance 2.5', 'ElevenLabs'],
    dove: [
      ['#lavori', 'Ventiquattro video', 'nei quattro casi qui sotto, tutti apribili'],
      ['#caso-eso', 'Human Robots', 'un prodotto raccontato prima di poterlo riprendere'],
    ],
  },

  social: {
    num: '03', cat: 'Continuità', tit: 'Sistemi per social media',
    lede: 'Non singoli post: un impianto che li produce con continuità anche quando non ci sono io.',
    consegno: [
      'Format riconoscibili, cioè ripetibili senza ridisegnarli ogni volta',
      'Template che si riempiono, non si reinventano',
      'Gli adattamenti per ogni piattaforma e proporzione',
      'Un flusso di revisione: chi guarda cosa, e prima di cosa',
      'Coda e calendario di pubblicazione',
    ],
    lavoro: [
      'Un format è tale se regge la decima volta. Le prime tre riescono a chiunque.',
      'Costruisco prima il sistema e poi i contenuti: se si parte dai contenuti, al terzo mese si ricomincia da capo.',
      'Dove il ripetitivo si può togliere di mezzo, lo tolgo — è esattamente il motivo per cui ho scritto Alfred.',
    ],
    con: ['Alfred', 'Postiz', 'Meta Business Suite', 'Prompt JSON', 'Automazioni AI'],
    dove: [
      ['#banchi', 'Alfred', 'l’applicazione che uso tutti i giorni, spiegata qui sopra'],
      ['#caso-locanda', 'La Locanda del Castello', 'serate diverse, pubblico diverso, stesso sistema'],
    ],
  },

  ai: {
    num: '04', cat: 'Sistemi', tit: 'Flussi e prototipi AI',
    lede: 'Automazioni che tolgono di mezzo il lavoro ripetitivo, e prototipi per provare un’idea prima di pagarla.',
    consegno: [
      'Automazioni che lavorano da sole, anche di notte',
      'Agenti con memoria e strumenti collegati',
      'Applicazioni su misura, quando lo strumento giusto non esiste',
      'Modelli in locale, dove i dati non devono uscire',
      'Prototipi navigabili, per decidere guardando invece che immaginando',
    ],
    lavoro: [
      'Scelgo fra locale e cloud sulle cose che contano: riservatezza, costo, velocità. Non per moda.',
      'Un controllo umano resta sempre dentro il flusso, nel punto in cui un errore costerebbe caro.',
      'Prima il prototipo, e solo se serve davvero l’applicazione. Molte idee muoiono al prototipo, ed è un risparmio.',
    ],
    con: ['n8n', 'ComfyUI', 'Ollama', 'LM Studio', 'Memoria persistente AI / Mem0', 'Agenti AI', 'Webapp su misura'],
    dove: [
      ['#top', 'Questa pagina', 'scritta riga per riga, zero dipendenze esterne'],
      ['#banchi', 'Alfred e Max Video Downloader', 'due applicazioni finite, non dimostrazioni'],
      ['#laboratorio', 'Il laboratorio', 'quattro motori di gioco e un costruttore'],
    ],
  },
};

/* ── la finestra ──────────────────────────────────────────────────── */
let finestra = null;
let apriBrief = null;        /* lo passa app.js: e' brief.apriCon */

function costruisci() {
  const d = document.createElement('dialog');
  d.className = 'serv';
  d.id = 'schedaServizio';
  d.setAttribute('aria-labelledby', 'servTit');
  d.innerHTML = `
    <p class="serv__cat mono"><span class="n"></span><em></em></p>
    <h3 id="servTit"></h3>
    <p class="serv__lede"></p>

    <p class="serv__eti mono">Cosa ti arriva</p>
    <ul class="serv__lista"></ul>

    <p class="serv__eti mono">Come ci arrivo</p>
    <ol class="serv__passi"></ol>

    <p class="serv__eti mono">Con cosa</p>
    <p class="serv__con"></p>

    <p class="serv__eti mono">Dove si vede</p>
    <ul class="serv__dove"></ul>

    <div class="serv__piede">
      <button type="button" class="btn btn--solid btn--sm" data-serv-brief></button>
      <button type="button" class="btn btn--sm" data-serv-chiudi>Chiudi</button>
    </div>`;
  document.body.appendChild(d);
  d.querySelector('[data-serv-chiudi]').addEventListener('click', () => d.close());
  /* il clic sul fondo scuro chiude, come nelle schede degli strumenti */
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  return d;
}

function apri(chiave) {
  const s = SERVIZI[chiave];
  if (!s) return;
  finestra ||= costruisci();

  finestra.querySelector('.serv__cat .n').textContent = s.num;
  finestra.querySelector('.serv__cat em').textContent = s.cat;
  finestra.querySelector('#servTit').textContent = s.tit;
  finestra.querySelector('.serv__lede').textContent = s.lede;

  const riempi = (sel, voci, come) => {
    const e = finestra.querySelector(sel);
    e.textContent = '';
    for (const v of voci) {
      const li = document.createElement('li');
      come ? come(li, v) : (li.textContent = v);
      e.appendChild(li);
    }
  };
  riempi('.serv__lista', s.consegno);
  riempi('.serv__passi', s.lavoro);
  riempi('.serv__dove', s.dove, (li, [ancora, nome, nota]) => {
    const a = document.createElement('a');
    a.href = ancora;
    a.innerHTML = `<b></b><span></span>`;
    a.querySelector('b').textContent = nome;
    a.querySelector('span').textContent = nota;
    /* la finestra e' modale: se resta aperta, il salto non si vede */
    a.addEventListener('click', () => finestra.close());
    li.appendChild(a);
  });
  finestra.querySelector('.serv__con').textContent = s.con.join(' · ');

  const b = finestra.querySelector('[data-serv-brief]');
  b.textContent = 'Parliamone';
  b.onclick = () => { finestra.close(); apriBrief?.(chiave); };

  if (!finestra.open) finestra.showModal();
  /* L'ordine conta, e la prima versione lo aveva sbagliato. Azzerare lo
     scorrimento PRIMA di showModal() non serve a niente: la finestra e'
     ancora display:none e non ha niente da scorrere. E dare il fuoco al
     bottone Chiudi, che sta nel piede appiccicato in fondo, la trascina
     giu' da sola: sul telefono si apriva gia' a meta', col titolo fuori.
     Prima si apre, poi si azzera, poi si prende il fuoco senza muoverla. */
  finestra.scrollTop = 0;
  finestra.querySelector('[data-serv-chiudi]').focus({ preventScroll: true });
}

/* ── le schede diventano apribili ─────────────────────────────────── */
export function initServizi(quandoBrief) {
  apriBrief = quandoBrief || null;
  const schede = [...document.querySelectorAll('.offerta__card')];
  const senza = [];

  schede.forEach((card, i) => {
    const chiave = card.dataset.serv;
    if (!chiave || !SERVIZI[chiave]) { senza.push(chiave || '#' + (i + 1)); return; }

    /* Un <button> vero e non una scheda con role="button": la tastiera,
       il lettore di schermo e il dito si aspettano un bottone. Il nome
       accessibile lo prende dal titolo che sta gia' nella scheda, cosi'
       chi ascolta sente "Grafica pubblicitaria, cosa faccio" e non
       "bottone". */
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'offerta__apri';
    b.innerHTML = '<span>Cosa faccio, nel dettaglio</span><i aria-hidden="true">→</i>';
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-label', `${SERVIZI[chiave].tit}: cosa faccio, nel dettaglio`);
    b.addEventListener('click', () => apri(chiave));
    card.appendChild(b);
  });

  if (senza.length) console.warn('schede servizio senza contenuto:', senza.join(', '));
  return schede.length - senza.length;
}
