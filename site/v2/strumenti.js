/* ═══════════════════════════════════════════════════════════════════
 * GLI STRUMENTI, UNO PER UNO
 *
 * L'elenco diceva soltanto dei nomi. Un nome non e' una competenza:
 * "Photoshop" lo scrivono tutti, e chi legge non sa se ci ritocco una
 * foto o ci costruisco un key visual — e se non e' del mestiere, non sa
 * nemmeno cosa sia "Postiz" o "ComfyUI".
 *
 * Ogni scheda risponde quindi a due domande separate, in quest'ordine:
 *   cos  → CHE COS'E': che tipo di strumento e', di chi e', a cosa
 *          serve in generale. Vale per chiunque, anche per chi non ha
 *          mai aperto un programma di grafica.
 *   io   → COSA CI FACCIO: un elenco di cose concrete, non un
 *          paragrafo. Le prime versioni erano scritte bene e dicevano
 *          poco ("e' qui che un'immagine diventa un pezzo di
 *          campagna"): una riga che si fa ammirare e non si fa usare.
 *          Voci brevi, verbi, niente metafore.
 *
 * I nomi restano scritti nell'HTML e non qui: sono trentacinque parole
 * che un motore di ricerca deve poter leggere, e senza JavaScript la
 * lista si legge lo stesso — semplicemente non si apre. Questo file
 * aggiunge le schede e trasforma le pastiglie in bottoni veri, non in
 * finti bottoni con role="button": la tastiera, il lettore di schermo e
 * il dito si aspettano un <button> e conviene darglielo.
 *
 * Il contenuto e' l'unica parte di questa pagina che nessuna misura
 * puo' verificare: va riletto e corretto dove non corrisponde.
 * ═══════════════════════════════════════════════════════════════════ */

export const SCHEDE = {
  /* ── 01 · grafica e video ─────────────────────────────────────── */
  'Adobe Photoshop': {
    cos: 'Editor di immagini a pixel, di Adobe. Lo standard per fotoritocco e fotomontaggio.',
    io: ['Scontorni, maschere e fotomontaggi',
         'Composizione del key visual di una campagna',
         'Correzione del colore e finitura',
         'Ripulitura delle immagini generate con l’AI',
         'Esportazione nei formati per stampa e digitale'],
  },
  'Adobe Illustrator': {
    cos: 'Editor di grafica vettoriale, di Adobe. I disegni sono curve e non pixel, quindi si ingrandiscono senza sgranare.',
    io: ['Marchi e loghi',
         'Icone e pittogrammi',
         'Lettering e titoli costruiti a mano',
         'Esecutivi per la stampa grande'],
  },
  'Adobe Premiere Pro': {
    cos: 'Programma di montaggio video, di Adobe.',
    io: ['Montaggio e ritmo dei tagli',
         'Sottotitoli e titolazione',
         'Versioni corte e lunghe dello stesso video',
         'Esportazione per ogni piattaforma e proporzione'],
  },
  'Adobe Audition': {
    cos: 'Editor audio multitraccia, di Adobe.',
    io: ['Pulizia della voce e riduzione del rumore',
         'Livelli e volume uniforme fra le clip',
         'Musica e effetti sotto il parlato',
         'Sistemazione delle voci sintetiche, che grezze si riconoscono'],
  },
  'Adobe InDesign': {
    cos: 'Programma di impaginazione per documenti a più pagine, di Adobe.',
    io: ['Cataloghi, brochure e listini',
         'Presentazioni e documenti lunghi',
         'Griglie e stili che tengono su tutte le pagine',
         'Esecutivi di stampa con abbondanze e crocini'],
  },

  /* ── 02 · assistenti e coding ─────────────────────────────────── */
  'ChatGPT': {
    cos: 'Assistente conversazionale di OpenAI. Scrive, riassume e ragiona su testo.',
    io: ['Prime stesure e riscritture',
         'Sintesi di documenti lunghi',
         'Liste di titoli e varianti di copy',
         'Traduzioni da rileggere'],
  },
  'Claude / Code / Design': {
    cos: 'Assistente di Anthropic. Claude Code lavora dentro il terminale sui file di un progetto, Claude Design sulle interfacce.',
    io: ['Il codice di questo sito, riga per riga',
         'Le prove automatiche che lo controllano',
         'Revisione e semplificazione di codice esistente',
         'Documentazione dei progetti'],
  },
  'Gemini / Antigravity': {
    cos: 'Assistente di Google; Antigravity è il suo ambiente per scrivere codice.',
    io: ['Confronto sulla stessa richiesta fatta a un altro modello',
         'Lettura di documenti molto lunghi in un colpo solo',
         'Analisi di immagini e schermate'],
  },
  'xAI Grok': {
    cos: 'Assistente di xAI, collegato in tempo reale a X.',
    io: ['Secondo parere su un testo',
         'Che cosa si sta dicendo adesso su un tema',
         'Controllo del tono quando un testo suona già sentito'],
  },
  'Perplexity': {
    cos: 'Motore di ricerca che risponde a domande citando le fonti.',
    io: ['Verifica di un dato prima di scriverlo',
         'Ricerca di riferimenti e casi',
         'Confronto rapido fra prodotti o servizi'],
  },

  /* ── 03 · immagine, video e audio generati ────────────────────── */
  'GPT Image 2.5': {
    cos: 'Generatore di immagini di OpenAI: da una descrizione scritta produce un’immagine.',
    io: ['Mockup e prove di direzione visiva',
         'Varianti di un key visual',
         'Illustrazioni e sfondi su misura',
         'Bozze da mostrare prima di impegnare una giornata'],
  },
  'Nano Banana 2': {
    cos: 'Modello di Google specializzato nel MODIFICARE un’immagine che esiste già, invece di crearne una nuova.',
    io: ['Cambiare un oggetto, un colore o uno sfondo',
         'Togliere elementi di troppo',
         'Allargare un’immagine per farla entrare in un altro formato',
         'Ritocchi mirati lasciando identico il resto'],
  },
  'Grok Image': {
    cos: 'Generatore di immagini di xAI.',
    io: ['Molte varianti in poco tempo',
         'Esplorazione di direzioni diverse a inizio progetto'],
  },
  'Seedance 2.5': {
    cos: 'Modello di ByteDance che genera video: da un’immagine ferma o da una descrizione tira fuori una clip.',
    io: ['Far muovere un fotogramma fermo',
         'Movimenti di camera su un’immagine statica',
         'Clip di raccordo fra due scene'],
  },
  'Gemini Omni': {
    cos: 'Modello multimodale di Google: tratta testo, immagini e audio nello stesso passaggio.',
    io: ['Contenuti che devono nascere coerenti su più media',
         'Analisi di materiali misti (testo + immagini + audio)'],
  },
  'Grok Video': {
    cos: 'Generatore di video di xAI.',
    io: ['Clip brevi per i social',
         'Prove rapide di un’idea di movimento'],
  },
  'HeyGen': {
    cos: 'Piattaforma per video con presentatori digitali: un volto generato legge un testo, anche in altre lingue.',
    io: ['Video formativi e tutorial',
         'Annunci che vanno rifatti spesso',
         'Versioni in più lingue senza rigirare'],
  },
  'Higgsfield': {
    cos: 'Piattaforma di generazione video con controllo esplicito sui movimenti di camera.',
    io: ['Clip a partire da un’immagine',
         'Carrellate e zoom decisi in anticipo',
         'I fotogrammi della versione in pixel art di questo sito'],
  },
  'ACE 1.5': {
    cos: 'Modello aperto per generare musica: dalla descrizione di un genere e di ' +
         'un’atmosfera tira fuori una traccia intera, strumenti e struttura compresi.',
    io: ['Basi musicali originali per video e Reel',
         'Musica senza problemi di diritti, perché nasce per quel pezzo',
         'Varianti della stessa base per durate diverse'],
  },
  'Lyria': {
    cos: 'Modello musicale di Google. Genera brani strumentali su descrizione, con un ' +
         'controllo fine su strumenti, ritmo e andamento.',
    io: ['Musica di sottofondo su misura per un montaggio',
         'Lo stesso tema in versione lunga e in versione da quindici secondi',
         'Alternativa quando serve un timbro diverso da quello di ACE'],
  },
  'ElevenLabs': {
    cos: 'Sintesi vocale e clonazione della voce: trasforma un testo in parlato.',
    io: ['Voce narrante per video e caroselli',
         'Doppiaggio in altre lingue',
         'Una voce coerente su tutta una serie'],
  },
  'Avatar AI': {
    cos: 'Presentatori digitali: un volto generato che presenta a camera.',
    io: ['Contenuti ripetitivi senza set né troupe',
         'Aggiornare un video cambiando solo il testo'],
  },
  'Voice Cloning': {
    cos: 'Riproduzione di una voce specifica a partire da registrazioni di quella voce.',
    io: ['Continuità di voce fra episodi girati in giorni diversi',
         'Correggere una frase senza rientrare in sala'],
  },

  /* ── 04 · workflow e AI in locale ─────────────────────────────── */
  'n8n': {
    cos: 'Piattaforma di automazione a nodi: collega servizi diversi e fa passare i dati da uno all’altro.',
    io: ['Flussi fra strumenti che non si parlano',
         'Passaggi programmati a orario o su evento',
         'Punti di controllo umano dove sbagliare costa',
         'Notifiche quando qualcosa si inceppa'],
  },
  /* La definizione di prima diceva "interfaccia a nodi per costruire
     pipeline": tre parole di gergo in fila, cioe' niente per chi non lo
     conosce gia'. Questa e' la scheda piu' lunga delle trentacinque, ed
     e' giusto che lo sia — e' lo strumento che ha piu' bisogno di
     essere spiegato. */
  'ComfyUI': {
    cos: 'Sistema a nodi, gratuito e aperto, per far generare all’AI immagini, video, ' +
         'testi e musica sul proprio computer. Si costruisce un FLUSSO DI LAVORO ' +
         'collegando scatole una dopo l’altra — quale modello usare, il testo, quante ' +
         'passate fare, l’ingrandimento, il salvataggio — invece di scrivere in un ' +
         'riquadro e sperare. Ogni scatola è un passaggio che si cambia da solo senza ' +
         'rifare il resto, e il flusso finito si salva e si riusa.',
    io: ['Usare flussi già pronti e adattarli a quello che mi serve',
         'Modificare un flusso: aggiungere, togliere o sostituire un passaggio',
         'Costruirne di nuovi quando quelli in giro non fanno la cosa giusta',
         'Generare in locale, senza abbonamento e senza code',
         'Rigenerare solo una parte dell’immagine, lasciando intatto il resto',
         'Ingrandire recuperando dettaglio invece di sgranare',
         'Ripetere la stessa lavorazione su cento immagini di fila',
         'Riaprire un flusso di mesi fa trascinandoci dentro un’immagine che ne è uscita'],
  },
  'Stable Diffusion': {
    cos: 'Modello di generazione immagini installabile in locale: gira sul computer, non su un server altrui.',
    io: ['Generare senza che i materiali del cliente escano dal PC',
         'Stili addestrati su misura',
         'Produzione in blocco senza costo per immagine'],
  },
  'Ollama': {
    cos: 'Programma che fa girare modelli linguistici direttamente sul computer.',
    io: ['Elaborare testi senza costo per richiesta',
         'Lavorare su dati che non devono uscire',
         'Automazioni che girano anche senza rete'],
  },
  'LM Studio': {
    cos: 'Interfaccia per scaricare, provare e confrontare modelli linguistici locali.',
    io: ['Confronto fra modelli su qualità, velocità e memoria',
         'Scelta del modello prima di metterlo in un flusso',
         'Le stime della sezione Tecnologia vengono da qui'],
  },
  'Hooks Engineering': {
    cos: 'Non un programma ma una tecnica: agganciare controlli automatici ai passaggi di un flusso, perché scattino da soli.',
    io: ['Verifiche a ogni passo invece che solo alla fine',
         'Fermare un errore dove nasce',
         'Regole di progetto che valgono senza doverle ricordare'],
  },

  /* ── 05 · AI engineering e automazioni ────────────────────────── */
  'Prompt Engineering': {
    cos: 'Tecnica: scrivere le istruzioni per un modello in modo che diano lo stesso risultato anche domani.',
    io: ['Istruzioni riusabili invece di richieste improvvisate',
         'Vincoli scritti espliciti (formato, lunghezza, cosa non fare)',
         'Prove sui casi limite prima di fidarsi'],
  },
  'Prompt JSON': {
    cos: 'Tecnica: chiedere la risposta in un formato strutturato, leggibile da un programma invece che da una persona.',
    io: ['Output che entra dritto in un altro strumento',
         'Campi obbligatori sempre presenti',
         'Controllo automatico che la risposta sia valida'],
  },
  'Skills Engineering': {
    cos: 'Tecnica: impacchettare un metodo di lavoro in una procedura che un assistente sa rieseguire.',
    io: ['Procedure riusabili fra progetti diversi',
         'Stesso risultato in sessioni diverse',
         'Niente rispiegare il metodo da capo ogni volta'],
  },
  'Memoria persistente AI / Mem0': {
    cos: 'Sistema che dà a un assistente una memoria fra una sessione e l’altra: senza, ogni volta riparte da zero.',
    io: ['Decisioni e vincoli di progetto che restano',
         'Preferenze del cliente ricordate',
         'Meno tempo speso a rimettere in pari l’assistente'],
  },
  'Agenti AI': {
    cos: 'Assistenti che eseguono più passaggi in autonomia usando strumenti, invece di rispondere e basta.',
    io: ['Compiti in più passi portati a termine da soli',
         'Controlli umani messi nei punti che contano',
         'Rapporti su cosa hanno fatto e perché'],
  },
  'Webapp su misura': {
    cos: 'Vibecoding: descrivere a un assistente cosa deve fare un’applicazione, ' +
         'guardarla funzionare, correggerla e rifarla finché fa quella cosa. Non si parte ' +
         'da un modello già pronto — si parte dal problema, e quello che esce serve solo ' +
         'a chi l’ha chiesto.',
    io: ['Strumenti interni per lavori che nessun programma in commercio copre',
         'Pannelli per seguire un flusso mentre gira',
         'Configuratori e calcolatori da mettere dentro un sito',
         'Prototipi funzionanti da provare prima di decidere se vale la pena',
         'Due me li sono costruiti: Alfred e Max Video Downloader, qui sotto'],
  },
  'Automazioni AI': {
    cos: 'L’insieme dei flussi che tolgono di mezzo i passaggi manuali ripetitivi.',
    io: ['Rinomina, ritaglio e adattamento ai formati',
         'Pubblicazione programmata',
         'Raccolta e riordino dei materiali in arrivo'],
  },

  /* ── 06 · social e pubblicazione ──────────────────────────────── */
  'Meta Business Suite': {
    cos: 'Strumento gratuito di Meta per gestire pagine Facebook e Instagram da un posto solo.',
    io: ['Programmazione dei post',
         'Risposte a messaggi e commenti',
         'Lettura dei dati: cosa ha funzionato, dove e quando'],
  },
  'Postiz': {
    cos: 'Strumento di pianificazione e pubblicazione su più social a partire da un calendario unico.',
    io: ['Calendario editoriale in un posto solo',
         'Pubblicazione contemporanea su più piattaforme',
         'Code di contenuti pronti, per non restare scoperti'],
  },
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
    <p class="scheda__cos"></p>
    <p class="scheda__eti mono">Cosa ci faccio</p>
    <ul class="scheda__lista"></ul>
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

function apri(nome, s, categoria, colore) {
  scheda ||= costruisci();
  scheda.style.setProperty('--tool', colore || 'var(--em)');
  scheda.querySelector('.scheda__cat').textContent = categoria;
  scheda.querySelector('#schedaTit').textContent = nome;
  scheda.querySelector('.scheda__cos').textContent = s.cos;
  const lista = scheda.querySelector('.scheda__lista');
  lista.textContent = '';
  for (const voce of s.io) {
    const li = document.createElement('li');
    li.textContent = voce;
    lista.appendChild(li);
  }
  scheda.scrollTop = 0;        /* una scheda lunga non si apre a meta' */
  if (!scheda.open) scheda.showModal();
  scheda.querySelector('[data-scheda-chiudi]').focus();
}

/* ── le pastiglie diventano bottoni ───────────────────────────────── */
export function initStrumenti() {
  const senza = [];
  for (const gruppo of document.querySelectorAll('.stack__group')) {
    const eti = gruppo.querySelector('b');
    /* "01 GRAFICA + VIDEO" → "GRAFICA + VIDEO": il numero e' ordine, non nome */
    const categoria = (eti ? eti.textContent : '').replace(/^\s*\d+\s*/, '').trim();
    const colore = getComputedStyle(gruppo).getPropertyValue('--tool').trim();

    for (const vecchio of [...gruppo.querySelectorAll('div > span')]) {
      const nome = vecchio.textContent.trim();
      const s = SCHEDE[nome];
      if (!s || !s.cos || !s.io || !s.io.length) { senza.push(nome); continue; }

      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = nome;
      b.setAttribute('aria-haspopup', 'dialog');
      b.title = `Che cos’è ${nome} e cosa ci faccio`;
      b.addEventListener('click', () => apri(nome, s, categoria, colore));
      vecchio.replaceWith(b);
    }
  }
  /* Un nome nuovo nell'elenco senza la sua scheda resterebbe una
     pastiglia morta in mezzo a trentaquattro vive, e nessuno se ne
     accorgerebbe guardando. Lo dico qui e lo controlla audit/strumenti.mjs. */
  if (senza.length) console.warn('strumenti senza scheda:', senza.join(', '));
  return senza;
}
