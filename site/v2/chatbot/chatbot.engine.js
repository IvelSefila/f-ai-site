/**
 * Motore Ibrido per "Nodo" — F/AI Portfolio
 * Supporta:
 * 1. Cloud Streaming (Cloudflare Worker Proxy + Groq/Llama/Qwen)
 * 2. WebGPU Locale (WebLLM Qwen2.5-0.5B via Web Worker)
 * 3. Motore A Deterministico (Zero rete, offline, instant fallback)
 */
import { CONFIG } from './chatbot.config.js';

export class ChatEngine {
  constructor(knowledge) {
    this.kb = knowledge;
    this.currentMode = CONFIG.cloudProxyUrl ? 'cloud' : 'deterministic';
    this.worker = null;
    this.isWebGPULoaded = false;
    this.isWebGPULoading = false;
  }

  static async create() {
    const res = await fetch(new URL('./knowledge.json', import.meta.url));
    const kb = await res.json();
    return new ChatEngine(kb);
  }

  setMode(mode) {
    this.currentMode = mode;
  }

  getMode() {
    return this.currentMode;
  }

  getSystemPrompt() {
    return `Il tuo nome ufficiale è NOUS (Noûs, intelligenza di regia). Ti chiami esclusivamente NOUS, mai Nodo né altri nomi.
Se ti presenti o ti chiedono chi sei, rispondi sempre presentandoti come NOUS.
Parli italiano naturale, chiaro, frasi brevi e tono competente con un tocco di ironia leggera da sala montaggio.
Conosci SOLO i fatti documentati nel portfolio e nella KNOWLEDGE fornita.
NON inventi dati, clienti, numeri o premi non presenti.
NON parli di temi esoterici, Lilith, tarocchi, astrologia, culti, politica di partito, vita privata, diagnosi o pareri legali.
Se l'utente pone domande fuori perimetro o esoteriche, declina con garbo e riconduci ai progetti (Union Energia, Esoscheletro, CETS, Locanda, CDI Infissi) o agli strumenti AI di Fabrizio.
Formatta in modo sintetico e pulito con elenchi puntati brevi.

KNOWLEDGE BASE:
${JSON.stringify(this.kb, null, 2)}

REGOLE DI RISPOSTA:
- Cita SEMPRE dati specifici dalla KNOWLEDGE (nomi reali, tool usati, episodi, personaggi).
- Per prezzi: NON inventare cifre. Di' sempre che il preventivo si calibra col brief.
- Per processo: descrivi i 4 step (Brief → Concept → Produzione → Consegna).
- Per domande vaghe: proponi 2 opzioni concrete di approfondimento.
- Formato: **grassetto** per nomi chiave, • per liste. MAX 100 parole per risposta.
- Tono: competente, diretto, un filo ironico. Come un montatore in sala che sa cosa vuole.`;
  }

  isBanned(query) {
    return CONFIG.bannedPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Inizializza il Web Worker WebGPU su richiesta dell'utente
   */
  async loadWebGPU(onProgress) {
    if (this.isWebGPULoaded) return true;
    if (this.isWebGPULoading) return false;

    if (!navigator.gpu) {
      throw new Error("WebGPU non supportata dal tuo browser o dispositivo. Rimango in modalità istantanea.");
    }

    this.isWebGPULoading = true;

    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(new URL('./chatbot.worker.js', import.meta.url), { type: 'module' });

        this.worker.onmessage = (e) => {
          const { type, progress, text, error } = e.data;

          if (type === 'progress') {
            if (onProgress) onProgress(progress, text);
          } else if (type === 'ready') {
            this.isWebGPULoaded = true;
            this.isWebGPULoading = false;
            this.currentMode = 'webgpu';
            resolve(true);
          } else if (type === 'error') {
            this.isWebGPULoading = false;
            reject(new Error(error));
          }
        };

        this.worker.postMessage({
          type: 'init',
          data: { model: CONFIG.webgpuModel }
        });
      } catch (err) {
        this.isWebGPULoading = false;
        reject(err);
      }
    });
  }

  /**
   * Genera risposta in streaming sul canale specificato
   */
  async replyStream(query, history, onChunk) {
    const cleanQuery = query.trim();

    // 1. Guardrail Off-Topic immediato client-side
    if (this.isBanned(cleanQuery)) {
      onChunk(CONFIG.deflectionMessage);
      return { isDeflection: true };
    }

    const isContact = /preventiv|cost|prezz|tariff|collabor|brief|ingagg|lavorare insieme|nuovo progetto|contatt/i.test(cleanQuery);

    // 2. Tentativo Cloud Proxy (se configurato e attivo)
    if (this.currentMode === 'cloud' && CONFIG.cloudProxyUrl) {
      try {
        const streamOk = await this._replyCloudStream(query, history, onChunk);
        if (streamOk) return { mode: 'cloud', leadCapture: isContact };
      } catch (err) {
        console.warn("[Nodo] Cloud proxy non disponibile, fallback a motore locale:", err.message);
      }
    }

    // 3. Tentativo WebGPU Locale
    if (this.currentMode === 'webgpu' && this.isWebGPULoaded && this.worker) {
      try {
        await this._replyWebGPUStream(query, history, onChunk);
        return { mode: 'webgpu' };
      } catch (err) {
        console.warn("[Nodo] Inferenza WebGPU fallita, fallback a motore deterministico:", err.message);
      }
    }

    // 4. Motore A Deterministico (Always-on / Fallback garantito)
    return await this._replyDeterministic(query, onChunk, history);
  }

  /**
   * Streaming SSE da Cloudflare Worker
   */
  async _replyCloudStream(query, history, onChunk) {
    const messages = [
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
      { role: 'user', content: query }
    ];

    const response = await fetch(CONFIG.cloudProxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const raw = trimmed.slice(5).trim();
          if (raw === '[DONE]') {
            return true;
          }
          try {
            const parsed = JSON.parse(raw);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) onChunk(delta);
          } catch (e) {}
        }
      }
    }

    return true;
  }

  /**
   * Streaming dal Web Worker WebGPU
   */
  async _replyWebGPUStream(query, history, onChunk) {
    return new Promise((resolve, reject) => {
      const messages = [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
        { role: 'user', content: query }
      ];

      const handler = (e) => {
        const { type, delta, error } = e.data;
        if (type === 'chunk') {
          if (delta) onChunk(delta);
        } else if (type === 'done') {
          this.worker.removeEventListener('message', handler);
          resolve(true);
        } else if (type === 'error') {
          this.worker.removeEventListener('message', handler);
          reject(new Error(error));
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({
        type: 'generate',
        data: {
          messages,
          systemPrompt: this.getSystemPrompt()
        }
      });
    });
  }

  /**
   * Motore Deterministico Avanzato v2 — Sistema a Intenti con scoring, rotazione e contesto
   */
  async _replyDeterministic(query, onChunk, history = []) {
    const kb = this.kb;

    /* ─── Utilità ────────────────────────────────────────────────────────────── */

    /** Ruota tra più varianti di risposta in modo deterministico */
    const pick = (arr) => arr[Math.floor(Date.now() / 1000) % arr.length];

    /** Calcola score: quante keyword del pattern matchano nella query */
    const score = (q, keywords) => {
      let s = 0;
      for (const kw of keywords) {
        if (typeof kw === 'string' && q.includes(kw)) s++;
        else if (kw instanceof RegExp && kw.test(q)) s += 2;
      }
      return s;
    };

    /** Estrae i testi dell'history recente (ultimi 6 turni) */
    const recentHistory = (history || []).slice(-6).map(h => (h.text || '').toLowerCase()).join(' ');

    const q = query.toLowerCase();

    /* ─── Recupero dati KB con fallback ────────────────────────────────────── */
    const proj = (id) => kb.projects?.find(x => x.id === id) || {};
    const P = kb.person || {};
    const pUnion   = proj('union');
    const pEso     = proj('eso');
    const pLocanda = proj('locanda');
    const pCets    = proj('cets');
    const pCdi     = proj('cdi');

    /* ─── Definizione Intenti ───────────────────────────────────────────────── */
    const intents = [

      /* 1. Saluto / Benvenuto */
      {
        id: 'greeting',
        keys: [/^(ciao|salve|hey|hi|hello|buongiorno|buonasera|buon|salut)/i, 'buon pomeriggio', 'buona sera'],
        replies: [
          `Ciao! Sono **Nous**, l'intelligenza di regia del portfolio di **Fabrizio Mana**. Da dove vuoi partire?`,
          `Benvenuto in sala montaggio. Cosa vuoi sapere sul lavoro di **Fabrizio**? Progetti, strumenti o contatti?`,
          `Pronti. Parla pure — posso guidarti tra i **5 casi reali**, gli strumenti AI o il percorso del brief.`
        ],
        action: null
      },

      /* 2. Chi è Fabrizio */
      {
        id: 'whoIs',
        keys: ['chi è', 'chi sei', 'fabrizio', 'autore', 'mana', 'mf/ai', 'di te', 'ti presenti', 'presentati'],
        replies: [
          `**${P.name} (${P.brand})** — *${P.tagline}*\n\n${P.role || 'Regista creativo AI'} con base in **${P.location}**.\n\nSi occupa di grafica pubblicitaria, spot video generativi, identità sonore e siti statici ultra-reattivi.\n\nPrincipio guida: *"${P.philosophy}"*`,
          `Fabrizio Mana è un **regista creativo AI-native** che lavora al confine tra comunicazione visiva e tecnologia generativa. Il brand è **MF/AI**. Ha sede in **${P.location}** e realizza campagne video, identità sonore e configuratori web — senza mai perdere la regia narrativa.`,
          `Il nome in sala è **Fabrizio Mana**, brand **MF/AI**. Tagline: *"${P.tagline}"*. Fa il regista di contenuti AI: non preme il pulsante "genera" a caso — costruisce pipeline ripetibili con ComfyUI, Blender, Premiere Pro e modelli locali su RTX.`
        ],
        action: { type: 'scroll', target: '#profilo', label: 'Leggi Profilo' }
      },

      /* 3. Cosa fa / Ruolo */
      {
        id: 'whatDoes',
        keys: ['cosa fa', 'che fa', 'lavoro', 'ruolo', 'mestiere', 'si occupa', 'professione', 'specializ'],
        replies: [
          `Fabrizio produce:\n\n• **Spot video generativi** — campagne complete realizzate senza riprese (vedi Union Energia: 9 spot in 6 settimane)\n• **Identità sonore** — jingle e sound design proprietari (Lyria, ElevenLabs)\n• **Siti ultra-reattivi** — WebGL, vanilla JS, zero framework inutili\n• **Grafica AI** — Flux.1, SDXL, ComfyUI per visual campaign`,
          `In estrema sintesi: **regia creativa AI**. Prende un brief, costruisce una pipeline con gli strumenti giusti e consegna campagne, spot, suoni e siti. Tutto orchestrato, niente generato a caso.\n\nI principali fronti: video generativo, sound design, web statici e grafica pubblicitaria.`,
          `Il lavoro di Fabrizio si divide in 4 aree:\n\n• **Video:** spot e campagne senza riprese dal vivo\n• **Audio:** identità sonore con Lyria / ElevenLabs\n• **Web:** siti statici con WebGL e animazioni native\n• **AI generativa:** pipeline ComfyUI per immagini e video`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Scopri i Servizi' }
      },

      /* 4. Filosofia / Approccio / Metodologia */
      {
        id: 'philosophy',
        keys: ['filosofia', 'approccio', 'metodologia', 'metodo', 'principio', 'visione', 'come lavora', 'come lavori'],
        replies: [
          `Il principio è semplice: *"${P.philosophy}"*\n\nQuesto significa che ogni tool — ComfyUI, Blender, Lyria — viene usato solo se serve la storia da raccontare. Nessuna feature demo fine a sé stessa.`,
          `**Approccio:** brief → pipeline → consegna. Fabrizio parte sempre dal messaggio del cliente, costruisce una pipeline ripetibile e misurabile, poi produce in batch. Risultato: qualità costante, tempi compressi.\n\nTre valori operativi:\n• **Regia** — il tono visivo è sempre coerente\n• **Pipeline** — i workflow sono documentati e riusabili\n• **Controllo** — i modelli girano localmente, senza vendor lock-in cloud`,
          `La metodologia si chiama *regia generativa*: si scrive il brief come uno script cinematografico, poi si traducono le scene in prompt ControlNet/Flux, si assembla in Premiere Pro e si calibra il ritmo come un regista tradizionale. L'AI è una troupe di attori digitali, non un oracolo.`
        ],
        action: { type: 'scroll', target: '#profilo', label: 'Leggi Approccio' }
      },

      /* 5. Union Energia — Progetto Generale */
      {
        id: 'union',
        keys: ['union', 'energia', 'fornitura', 'gas', 'luce', 'alpaca', 'asino', 'davide', 'marco', 'luca'],
        replies: [
          `**${pUnion.client || 'Union Energia'} — ${pUnion.title || 'Campagna Video Generativa'}**\n\n${pUnion.challenge || 'Spot multicanale per fornitore energetico — nessuna ripresa dal vivo.'}\n\n• **Personaggi:** ${(pUnion.characters || ['Davide l\'alpaca', 'Marco', 'Luca l\'asino']).join(', ')}\n• **9 spot** prodotti in 6 settimane con pipeline ComfyUI + Blender\n• **Tool:** ${(pUnion.stack || ['ComfyUI', 'Blender', 'Premiere Pro', 'ElevenLabs']).join(', ')}`,
          `Union Energia è il caso studio più articolato del portfolio: **9 spot video completi** realizzati in 6 settimane senza una sola ripresa dal vivo.\n\nProtagonistaspeciale: **Davide**, l'alpaca testimonial generato con ComfyUI + ControlNet che sfida le bollette in nome della famiglia.\n\nStack: ${(pUnion.stack || ['ComfyUI', 'Blender', 'ElevenLabs']).join(' · ')}`,
          `9 spot, 6 settimane, zero set fisico. Questa è Union Energia.\n\nI personaggi — **Davide** (alpaca), **Marco** e **Luca** (asino) — sono costruiti con mesh Blender, rigged con ControlNet e doppiati con ElevenLabs. La coerenza visiva è garantita dalla pipeline ComfyUI che mantiene seed e stile fisso tra gli episodi.`
        ],
        action: { type: 'video_union', target: '#caso-union', label: 'Vedi scheda Union' }
      },

      /* 6. Union Energia — Personaggi */
      {
        id: 'unionChars',
        keys: ['personaggi', 'character', 'davide alpaca', 'luca asino', 'protagonisti', 'chi sono i personag'],
        replies: [
          `I personaggi di **Union Energia** sono tre:\n\n• **Davide** — l'alpaca testimonial, simpatico e direct-response. Generato con ComfyUI + ControlNet su mesh Blender.\n• **Marco** — il cliente umano frastornato dalle bollette.\n• **Luca** — l'asino consulente energetico (sì, è un asino): voce ElevenLabs, stile illustrativo coerente.`,
          `**Davide l'alpaca** è la star: mantiene coerenza visiva tra tutti i 9 spot grazie a seed fissi e ControlNet openpose. Parla con voce clonata ElevenLabs, gesticola con animazioni rigged in Blender.\n\n**Luca** (asino consulente) e **Marco** (cliente umano) completano il cast — tutti generati, nessuno reale.`
        ],
        action: { type: 'video_union', target: '#caso-union', label: 'Vedi i Personaggi' }
      },

      /* 7. Union Energia — Episodi */
      {
        id: 'unionEpisodes',
        keys: ['episod', 'spot n.', 'primo spot', 'quanti spot', 'stagioni', 'puntate', 'campagna spot'],
        replies: [
          `Sono stati prodotti **9 spot** per Union Energia, distribuiti su formati 16:9, 9:16 e 1:1 per canali TV, social e digital OOH.\n\nOgni spot segue la stessa struttura narrativa (problema bolletta → Davide interviene → soluzione Union) ma con ambientazione e battute diverse. La pipeline ComfyUI garantisce coerenza visiva al 100%.`,
          `La campagna Union conta **9 episodi** con archi narrativi distinti:\n\n• Spot 1–3: Presentazione di Davide e del problema energetico\n• Spot 4–6: Confronti e situazioni domestiche\n• Spot 7–9: Chiusura con call-to-action diretta\n\nTutti doppiati con **ElevenLabs** e montati in **Premiere Pro**.`
        ],
        action: { type: 'video_union', target: '#caso-union', label: 'Guarda gli Spot' }
      },

      /* 8. Esoscheletro / Bionics / Robot */
      {
        id: 'eso',
        keys: ['esoscheletr', 'bion', 'robot', 'human robot', 'camminare', 'riabilitaz', 'ortesi', 'protesi', 'mobilità assistita'],
        replies: [
          `**${pEso.client || 'Human Robots'} — ${pEso.title || 'Prototipo Esoscheletro'}**\n\n${pEso.challenge || 'Simulazione fotorealistica per esoscheletro di mobilità assistita.'}\n\n• **Metodo:** ${pEso.method || 'Blender + ComfyUI per rendering previo al prototipo fisico'}\n• **Tool:** ${(pEso.stack || ['Blender', 'ComfyUI', 'Flux.1']).join(', ')}\n\nSimulazione fotorealistica del cammino assistito prima della costruzione del prototipo industriale.`,
          `L'esoscheletro è il progetto più *hard-science* del portfolio: **Human Robots** aveva bisogno di visualizzare il cammino assistito prima che il prototipo fisico esistesse.\n\nFabrizio ha costruito la simulazione in **Blender** (cinematica diretta + mesh anatomica), texturato con **Flux.1** e composto in **Premiere Pro**. Il cliente ha usato i render per il pitch agli investitori.`,
          `**Bionics / Esoscheletro**: progetto commissionato da Human Robots per visualizzare un sistema di mobilità assistita.\n\nNessun prototipo fisico disponibile → pipeline 100% virtuale: Blender per la struttura meccanica, ComfyUI per i materiali fotorealistici, Topaz per l'upscale finale a 4K.`
        ],
        action: { type: 'scroll', target: '#caso-eso', label: 'Vedi Esoscheletro' }
      },

      /* 9. Studio CETS / Parco Alpi Marittime / Montagna */
      {
        id: 'cets',
        keys: ['cets', 'parco', 'alpi marittime', 'montagna', 'turismo', 'cartellonist', 'natura', 'sostenibil', 'sentiero'],
        replies: [
          `**${pCets.client || 'Parco Naturale Alpi Marittime'} — Studio CETS**\n\n${pCets.challenge || 'Identità visiva per la Carta Europea del Turismo Sostenibile.'}\n\n• **Metodo:** ${pCets.method || 'Grafica istituzionale + cartellonistica per aree naturali protette'}\n• **Focus:** Identità visiva coerente per il turismo montano sostenibile`,
          `Il **CETS** (Carta Europea del Turismo Sostenibile) è un progetto istituzionale per il **Parco Naturale Alpi Marittime**.\n\nFabrizio ha curato cartellonistica, mappe e materiali visivi per promuovere il turismo lento — font istituzionali, palette naturalista, illustrazioni vettoriali dei sentieri.`,
          `Studio CETS: identità visiva per il turismo sostenibile nelle **Alpi Marittime**. Un lavoro di grafica tradizionale con forte attenzione alla leggibilità su formati fisici (pannelli, mappe, brochure). Niente AI generativa qui — solo composizione, tipografia e rigore istituzionale.`
        ],
        action: { type: 'scroll', target: '#caso-cest', label: 'Vedi Studio CETS' }
      },

      /* 10. La Locanda del Castello / Jingle / Ristorazione */
      {
        id: 'locanda',
        keys: ['locanda', 'castello', 'jingle', 'ristorante', 'ristorazione', 'audio identità', 'musica locale', 'sound brand'],
        replies: [
          `**${pLocanda.client || 'La Locanda del Castello'} — Identità Sonora**\n\n${pLocanda.challenge || 'Brand sonoro completo per ristorante storico piemontese.'}\n\n• **5 jingle originali** (.m4a) udibili nel player del sito\n• **Tool:** ${(pLocanda.stack || ['Lyria', 'ElevenLabs', 'Reaper']).join(', ')}\n• Stile: toni caldi, folk piemontese, nessun cliché da pizzeria`,
          `La Locanda del Castello è il progetto *sound design* più completo: **5 jingle originali** generati con **Lyria** (Google DeepMind), raffinati con effetti in **Reaper** e integrati in un player personalizzato sul sito.\n\nOgni jingle copre un'emozione diversa: arrivo, pranzo, cantina, dessert, congedo.`,
          `Identità sonora per un ristorante storico piemontese: 5 jingle, tutti originali, generati con **Lyria** e masterizzati in **Reaper**. Il brand sonoro è coerente e immediatamente riconoscibile. Puoi ascoltarli nel player embed sul sito.`
        ],
        action: { type: 'audio_locanda', target: '#caso-locanda', label: 'Ascolta i Jingle' }
      },

      /* 11. CDI Infissi / Serramenti / Configuratore */
      {
        id: 'cdi',
        keys: ['cdi', 'infiss', 'serrament', 'finestre', 'porte', 'configurator', 'trasmittanza', 'epiq', 'arrogance', 'paysage'],
        replies: [
          `**${pCdi.client || 'CDI Infissi'} — Configuratore Web**\n\n${pCdi.challenge || 'Configuratore interattivo per linee di serramenti premium.'}\n\n• Calcolo **trasmittanza termica Uw** e isolamento acustico **dB** in tempo reale\n• Modelli configurabili: **Epiq, Arrogance, Paysage**\n• Stack: Vanilla JS, CSS a token, zero dipendenze esterne`,
          `CDI Infissi: configuratore web interattivo per tre linee di serramenti premium (**Epiq, Arrogance, Paysage**).\n\nL'utente seleziona materiale, colore e vetrocamera e vede in tempo reale i valori di **trasmittanza Uw** e isolamento acustico dB. Tutto in vanilla JS, nessun framework, caricamento <1s.`,
          `Il configuratore CDI è un esempio di web tecnico ad alte prestazioni: calcola **Uw e dB** secondo norma UNI EN ISO 10077 e presenta i risultati con animazioni CSS pure. Tre modelli configurabili, palette interattiva, PDF generabile lato client.`
        ],
        action: { type: 'scroll', target: '#caso-cdi', label: 'Vedi CDI Infissi' }
      },

      /* 12. Strumenti / Tool / Stack generale */
      {
        id: 'tools',
        keys: ['strument', 'tool', 'stack', 'software', 'programm', 'usi cosa', 'cosa usi', 'tecnologie'],
        replies: [
          `Fabrizio usa **35 strumenti professionali** in 6 categorie:\n\n• **Video:** ComfyUI, Forge, LTX Video, Topaz Video AI, Premiere Pro, DaVinci Resolve, Blender\n• **Audio:** Lyria, ElevenLabs, Suno, Udio, Reaper\n• **Modelli:** Qwen 2.5, Flux.1, SDXL, Whisper — su workstation locale RTX\n• **Codice:** Vanilla JS, WebGL2/OGL, CSS a token, Python, Linux\n\n*I tool servono la regia, non il contrario.*`,
          `Lo stack di Fabrizio copre video, audio, modelli AI e codice:\n\n• **Generazione immagini/video:** ComfyUI + Flux.1 + LTX Video\n• **3D:** Blender (mesh, rigging, rendering)\n• **Audio:** Lyria + ElevenLabs + Reaper\n• **Post-produzione:** Premiere Pro + Topaz (upscale 4K)\n• **Web:** Vanilla JS + WebGL2 + CSS token\n• **Automazione:** Python + Linux scripts`,
          `35 tool, 6 categorie. Ma la cosa importante non è la lista — è come vengono orchestrati in pipeline. Nessun tool è usato isolatamente: ogni progetto è un grafo ComfyUI → Blender → ElevenLabs → Premiere Pro.`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Esplora i Banchi' }
      },

      /* 13. ComfyUI */
      {
        id: 'comfyui',
        keys: ['comfyui', 'comfy', 'node graph', 'workflow comfy', 'controlnet', 'diffusion workflow'],
        replies: [
          `**ComfyUI** è il cuore della pipeline generativa di Fabrizio. Viene usato per:\n\n• Generazione immagini con **Flux.1 / SDXL** + ControlNet\n• Pipeline video con **LTX Video** e AnimateDiff\n• Batch processing di centinaia di frame coerenti (vedi Union Energia)\n• Custom nodes per automazioni Python`,
          `ComfyUI è il *direttore d'orchestra* della pipeline AI di Fabrizio: ogni nodo è un'operazione (loader, sampler, upscaler, compressor) e il grafo intero è il workflow documentato e riproducibile.\n\nI workflow più complessi gestiscono seed fissi per la coerenza dei personaggi e batch da 200+ immagini per progetto.`,
          `Su ComfyUI girano Flux.1 Dev, SDXL, LTX Video e vari ControlNet (openpose, depth, canny). La macchina è una workstation locale con RTX — nessuna dipendenza da API cloud per la generazione.`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Vedi i Workflow' }
      },

      /* 14. Blender / 3D */
      {
        id: 'blender',
        keys: ['blender', '3d', 'mesh', 'rigging', 'modellazione', 'render 3d', 'sculpting', 'animazione 3d'],
        replies: [
          `**Blender** è usato per costruire le strutture 3D che poi vengono "vestite" con texture AI in ComfyUI:\n\n• Mesh anatomiche per l'esoscheletro (Human Robots)\n• Rig dei personaggi Union Energia (alpaca Davide, asino Luca)\n• Set virtuali per compositing con plate ComfyUI\n• Rendering con Cycles per i materiali tecnici`,
          `In Blender Fabrizio fa il lavoro che non si può fare con la diffusion pura: costruisce scheletri 3D, li rotta in pose coerenti, esporta depth map e openpose che poi finiscono nel ControlNet ComfyUI. È la parte "fisica" del processo virtuale.`,
          `Blender nel portfolio di Fabrizio ha due ruoli principali:\n\n1. **Rigging e pose** — per mantenere la coerenza dei personaggi tra più frame (Union Energia)\n2. **Modellazione tecnica** — geometrie meccaniche per l'esoscheletro (Human Robots)`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Vedi Tool 3D' }
      },

      /* 15. Premiere Pro / Montaggio */
      {
        id: 'premiere',
        keys: ['premiere', 'montaggio', 'davinci', 'editing', 'color grading', 'post produzione', 'taglio', 'sequenza'],
        replies: [
          `**Premiere Pro** è la sala montaggio finale di ogni progetto:\n\n• Assemblaggio degli spot Union Energia (sincronizzazione audio ElevenLabs + frame ComfyUI)\n• Color grading e correzione cromatica\n• Export multi-formato (16:9, 9:16, 1:1 per canali diversi)\n\nPer i video più tecnici viene affiancato da **DaVinci Resolve** per il colore.`,
          `Il montaggio è l'ultima regia: Fabrizio porta in Premiere Pro tutti i frame generati con ComfyUI, li sincronizza con il parlato ElevenLabs e calibra il ritmo come farebbe un regista tradizionale. L'AI genera, la regia decide.`,
          `Premiere Pro + DaVinci Resolve per la post-produzione. Su Premiere va il rough cut e la sync audio; su DaVinci il grade finale e il master per la distribuzione. Tutti i progetti vengono consegnati in H.264 broadcast e H.265 per social.`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Vedi Post-Produzione' }
      },

      /* 16. ElevenLabs / Voci */
      {
        id: 'elevenlabs',
        keys: ['elevenlabs', 'eleven labs', 'clonazione voce', 'voice cloning', 'voce', 'doppiaggio', 'sintesi vocale', 'tts'],
        replies: [
          `**ElevenLabs** è il doppiatore digitale del portfolio:\n\n• Voci dei personaggi Union Energia (Davide, Luca, Marco)\n• Voice cloning per mantenere il personaggio coerente tra i 9 spot\n• Dialetti e toni calibrabili per ogni scena\n• Integrazione diretta nel workflow Premiere Pro`,
          `Con ElevenLabs Fabrizio clona le voci dei personaggi e le mantiene coerenti tra tutti gli episodi. Il workflow è: scrivi il dialogo → genera l'audio → porta in Premiere → sincronizza con il video frame-by-frame.`,
          `ElevenLabs è usato per voice cloning ad alta fedeltà. Una volta creato il "timbro" di Davide l'alpaca, ogni nuova battuta suona identica. Nessun attore vocale da riprenotare tra un episodio e l'altro.`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Vedi Tool Audio' }
      },

      /* 17. Lyria / Musica / Jingle */
      {
        id: 'lyria',
        keys: ['lyria', 'musica generativa', 'colonna sonora', 'jingle musical', 'deepmind audio', 'musiclm'],
        replies: [
          `**Lyria** (Google DeepMind) genera la musica di sottofondo e i jingle originali:\n\n• **5 jingle** per La Locanda del Castello — folk piemontese, warmth autunnale\n• Musiche di accompagnamento per gli spot Union Energia\n• Output .wav raffinati poi in **Reaper** per equalizzazione e master`,
          `Lyria è il compositore AI di Fabrizio: genera tracce musicali complete in stile, mood e durata specifici. I jingle de La Locanda sono stati creati con Lyria e rifiniti in Reaper con plug-in analogici per recuperare calore timbrico.`,
          `Con **Lyria** si parte da un prompt musicale dettagliato (strumentazione, BPM, mood, ispirazione) e si ottiene una traccia originale. Per i 5 jingle della Locanda sono state generate circa 40 varianti, poi selezionate e masterizzate le migliori.`
        ],
        action: { type: 'scroll', target: '#caso-locanda', label: 'Ascolta i Jingle' }
      },

      /* 18. Suno / Udio */
      {
        id: 'suno',
        keys: ['suno', 'udio', 'musica ai', 'canzoni ai', 'generazione musicale', 'testo musicale'],
        replies: [
          `**Suno** e **Udio** sono nella cassetta degli attrezzi audio di Fabrizio come alternativi a Lyria per formati più pop o commerciali.\n\nSuno eccelle su testi + melodia (utile per jingle con parole), mentre Lyria è preferita per strumentali d'atmosfera. La scelta dipende dal brief.`,
          `Sì, Fabrizio usa anche **Suno** — soprattutto quando il jingle richiede vocalità integrate (canto + strumenti). Per la Locanda del Castello la scelta è ricaduta su Lyria perché il cliente voleva folk strumentale, non cantato.`,
          `**Suno/Udio vs Lyria**: Suno genera canzoni con testo e voce cantata, Lyria si concentra su musica strumentale di alta qualità. Per spot commerciali con voce parlata (doppiata con ElevenLabs) si usa Lyria per il sottofondo; per jingle cantati si usa Suno.`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Vedi Tool Audio' }
      },

      /* 19. Flux / SDXL / Generazione Immagini */
      {
        id: 'flux',
        keys: ['flux', 'sdxl', 'stable diffusion', 'generazione immagini', 'text to image', 't2i', 'midjourney', 'dall-e', 'imagen'],
        replies: [
          `**Flux.1** è il modello di generazione immagini principale, usato in ComfyUI per:\n\n• Background degli spot Union Energia\n• Texture fotorealistiche per i materiali dell'esoscheletro\n• Visual per campagne social e print\n\n**SDXL** viene usato in parallelo per stili più illustrativi. Tutto gira localmente su RTX — zero API cloud per la generazione.`,
          `Flux.1 Dev + SDXL sono i modelli di base per la generazione immagini. La chiave non è il modello singolo ma la pipeline: ControlNet fornisce la struttura (posa, profondità, contorno) e Flux riempie con texture fotorealistica coerente.`,
          `Fabrizio preferisce **Flux.1** a Midjourney o DALL·E per tre motivi:\n\n1. **Controllo:** ControlNet permette pose e composizioni precise\n2. **Locale:** nessuna dipendenza da API cloud, batch da 200+ immagini\n3. **Ripetibilità:** seed fissi = coerenza tra frame di uno stesso personaggio`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Vedi Generazione Immagini' }
      },

      /* 20. Topaz / Upscaling */
      {
        id: 'topaz',
        keys: ['topaz', 'upscal', 'super resolution', '4k', 'video enhancer', 'denoising video'],
        replies: [
          `**Topaz Video AI** è il passo finale di ogni video: converte output a 720p/1080p in **4K broadcast** riducendo rumore e artefatti da diffusion. È particolarmente utile sulle animazioni Union Energia dove i frame ComfyUI hanno ancora grain da campionamento.`,
          `Topaz è il "fotografo in camera oscura" della pipeline: tutto ciò che esce da ComfyUI o Blender passa per Topaz per l'upscale a 4K e la riduzione degli artefatti. Il workflow è: genera → upscala → monta → distribuisci.`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Vedi Post Tool' }
      },

      /* 21. WebGL / Siti / Web */
      {
        id: 'webgl',
        keys: ['webgl', 'sito', 'web', 'frontend', 'javascript', 'animazioni web', 'html', 'css', 'vanilla js', 'ogl'],
        replies: [
          `I siti nel portfolio di Fabrizio usano **WebGL2 / OGL** per le animazioni 3D in-browser, **Vanilla JS** senza framework inutili e **CSS a token** per theming sistematico.\n\nCaricamento tipico: **<1 secondo** anche con shader complessi. Zero React, zero npm bloat.`,
          `Sul web Fabrizio scrive tutto a mano: Vanilla JS, WebGL2 (via OGL come thin wrapper), CSS custom properties per i token. I siti sono file statici deployati su CDN — nessun server, nessuna dipendenza runtime, massima velocità.`,
          `Lo stack web:\n\n• **WebGL2 / OGL** — shader e geometrie 3D inline nel browser\n• **Vanilla JS** — logica pura, nessun framework\n• **CSS a token** — design system con custom properties\n• **Static deploy** — Cloudflare Pages / GitHub Pages, TTFB <50ms`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Vedi Siti Web' }
      },

      /* 22. Python / Automazione */
      {
        id: 'python',
        keys: ['python', 'automazione', 'script', 'bot', 'pipeline python', 'linux', 'bash'],
        replies: [
          `**Python** è il collante della pipeline AI di Fabrizio:\n\n• Script di batch processing per ComfyUI (via API locale)\n• Automazioni di file management tra Blender e Premiere\n• Chatbot e backend leggeri (FastAPI)\n• Integrazione con API ElevenLabs per il voice cloning automatizzato`,
          `Python + Linux sono la "stanza macchine" del workflow: gestiscono le code di rendering ComfyUI, rinominano e catalogano i frame generati, preparano i preset di Premiere Pro. Tutto scriptato, niente fatto a mano due volte.`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Vedi Automazioni' }
      },

      /* 23. Contatto / Preventivo / Brief */
      {
        id: 'contact',
        keys: ['contatt', 'preventiv', 'brief', 'collabor', 'lavorar', 'progetto insieme', 'commiss', 'ingagg'],
        replies: [
          `Per avviare una collaborazione:\n\n1. **Modulo Brief** — percorso guidato in 6 passaggi sul sito: canali, budget, tempistiche, tono visivo.\n2. **Email diretta:** **${P.email || 'fabrizio@mfai.it'}**\n\nIl brief serve a Fabrizio per capire se il progetto è fattibile e stimare i tempi. Senza brief non parte niente.`,
          `Due strade per partire:\n\n• **Breve veloce:** manda una mail a **${P.email || 'fabrizio@mfai.it'}** con 3 righe sul progetto\n• **Brief completo:** usa il modulo sul sito — 6 domande, 5 minuti, stima immediata\n\nVuoi che ti porto al modulo?`,
          `Per collaborare serve un **brief**: tipo di progetto, canali di distribuzione, tempistica e budget indicativo. Poi Fabrizio risponde con un preventivo dettagliato entro 48h. Scrivi a **${P.email || 'fabrizio@mfai.it'}** o usa il modulo guidato sul sito.`
        ],
        action: { type: 'scroll', target: '#brief', label: 'Apri Modulo Brief' }
      },

      /* 24. Email */
      {
        id: 'email',
        keys: ['email', 'mail', 'indirizzo', 'dove scrivo', 'come ti contatto', 'recapito'],
        replies: [
          `Puoi scrivere direttamente a **${P.email || 'fabrizio@mfai.it'}**. Per un preventivo preciso, includi: tipo di progetto, canali di distribuzione e tempistica indicativa.`,
          `L'email di contatto è **${P.email || 'fabrizio@mfai.it'}**. In alternativa usa il modulo brief sul sito: guidato in 6 passaggi, calibra il preventivo automaticamente.`
        ],
        action: { type: 'scroll', target: '#brief', label: 'Apri Modulo Brief' }
      },

      /* 25. Servizi offerti */
      {
        id: 'services',
        keys: ['servizi', 'offri', 'cosa produc', 'produzione', 'cosa realizz', 'output', 'deliverable'],
        replies: [
          `I servizi di **MF/AI** in 4 macro-aree:\n\n• **Spot Video Generativi** — campagne senza riprese, multiplex 16:9/9:16/1:1\n• **Identità Sonora** — jingle e sound design originali per brand\n• **Siti Ultra-Reattivi** — statici, WebGL, <1s caricamento\n• **Grafica AI** — visual per social, print e OOH`,
          `Fabrizio produce:\n\n1. **Video generativi** (spot, campagne, reel) — vedi Union Energia e Esoscheletro\n2. **Sound design** (jingle, brand audio, musica) — vedi La Locanda\n3. **Web** (siti statici, configuratori, landing) — vedi CDI Infissi\n4. **Identità visiva** (cartellonistica, brand) — vedi CETS`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Scopri i Servizi' }
      },

      /* 26. Prezzi / Costo / Tariffe */
      {
        id: 'price',
        keys: ['prezz', 'cost', 'tariff', 'quanto costa', 'budget', 'quanto si paga', 'tariffa'],
        replies: [
          `I prezzi dipendono dal brief: canali, formato, durata, complessità della pipeline.\n\nNon ci sono listini fissi — ogni progetto è diverso. Il **modulo brief** sul sito permette di inquadrare scope e budget in 6 domande, poi arriva un preventivo dettagliato entro 48h.`,
          `Non ho tariffe da listino — ogni progetto ha variabili diverse (durata video, numero di personaggi, canali di distribuzione, iterazioni).\n\nIl modo corretto è compilare il **brief guidato** sul sito: Fabrizio stima il costo reale in base alle tue specifiche e risponde in 48h.`,
          `Il budget è una variabile del brief, non un dato fisso. Union Energia (9 spot in 6 settimane) ha un costo molto diverso da un jingle singolo. Compila il modulo brief per avere una stima realistica — senza impegno.`
        ],
        action: { type: 'scroll', target: '#brief', label: 'Richiedi Preventivo' }
      },

      /* 27. Tempi / Quanto ci vuole */
      {
        id: 'timing',
        keys: ['tempi', 'quanto ci vuole', 'quanto tempo', 'deadline', 'consegna', 'settimane', 'giorni', 'urgente'],
        replies: [
          `I tempi dipendono dalla complessità:\n\n• **Spot singolo** (personaggio già definito): 1–2 settimane\n• **Campagna multipla** (tipo Union Energia 9 spot): 5–7 settimane\n• **Sito web** (tipo CDI Infissi): 2–4 settimane\n• **Jingle + sound design**: 1 settimana\n\nPer urgenze è possibile accelerare la pipeline con coda prioritaria.`,
          `Union Energia: 9 spot in **6 settimane**. Questo dà la misura. Per progetti singoli (uno spot, un jingle, un sito) si parla di **1–3 settimane** in media.\n\nI tempi esatti vengono concordati nel brief — la pipeline AI è molto più rapida del set tradizionale.`
        ],
        action: { type: 'scroll', target: '#brief', label: 'Parla di Tempistiche' }
      },

      /* 28. AI generativa in generale */
      {
        id: 'aiGeneral',
        keys: ['intelligenza artificiale', 'ai generativa', 'cosa è l\'ai', 'come funziona l\'ai', 'modello linguistico', 'llm', 'diffusion model'],
        replies: [
          `L'**AI generativa** usata da Fabrizio è di tipo *diffusion* (immagini/video con Flux.1, SDXL, LTX) e *transformer* (testo/audio con Qwen, ElevenLabs, Lyria).\n\nNon è magia: è matematica applicata a pattern visivi e sonori. La regia umana decide cosa generare, la macchina esegue.`,
          `Fabrizio distingue tra AI *generativa* (crea contenuti: immagini, video, musica) e AI *discriminativa* (analizza e classifica). Il portfolio usa prevalentemente la prima — con pipeline controllate che evitano l'output casuale da "prompt a caso".`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Esplora i Tool AI' }
      },

      /* 29. Differenza con ChatGPT / Midjourney ecc. */
      {
        id: 'vsOthers',
        keys: ['chatgpt', 'midjourney', 'openai', 'claude', 'gemini', 'differenza', 'meglio di', 'rispetto a', 'confronto'],
        replies: [
          `La differenza chiave rispetto a ChatGPT o Midjourney è la **pipeline orchestrata**:\n\nChatGPT dà testo, Midjourney dà immagini. Fabrizio invece costruisce un grafo ComfyUI che prende un prompt, genera 200 frame coerenti, li upscala con Topaz, aggiunge audio ElevenLabs e monta tutto in Premiere — in automatico.\n\nÈ la differenza tra un singolo musicista e un direttore d'orchestra.`,
          `Midjourney e DALL·E generano singole immagini. Fabrizio usa Flux.1 in pipeline batch: centinaia di frame coerenti per un personaggio, con seed fisso, ControlNet e upscaling automatico. È un ordine di grandezza diverso di controllo.`,
          `Vs ChatGPT: ChatGPT è bravo a conversare, Fabrizio usa i modelli linguistici (Qwen) per scrivere script e dialoghi, non come prodotto finale. Il prodotto finale è uno spot video o un sito — il testo è solo uno degli input.`
        ],
        action: null
      },

      /* 30. Progetto più bello / preferito / grande */
      {
        id: 'bestProject',
        keys: ['progetto più', 'preferito', 'più bello', 'più grande', 'più complesso', 'più importante', 'migliore', 'quale preferisci'],
        replies: [
          `Il progetto più articolato è **Union Energia**: 9 spot, 3 personaggi, 6 settimane, zero riprese dal vivo. È quello che dimostra meglio la capacità di orchestrare una pipeline generativa complessa e mantenere coerenza narrativa su tanti episodi.`,
          `Dal punto di vista tecnico, il più sfidante è l'**Esoscheletro** (Human Robots): nessun prototipo fisico esisteva, tutto doveva essere credibile al 100% per il pitch agli investitori — mesh 3D, materiali fotorealistici, animazione del cammino assistito.\n\nDal punto di vista creativo, **La Locanda del Castello**: 5 jingle originali che catturano l'anima di un luogo fisico senza mai averci messo piede.`,
          `Ognuno ha il suo primato:\n\n• **Union Energia** — volume e coerenza (9 spot)\n• **Esoscheletro** — complessità tecnica (3D + fisimulazione)\n• **La Locanda** — sfida creativa (identità sonora da zero)\n• **CDI Infissi** — ingegneria web (configuratore tecnico real-time)\n• **CETS** — istituzionale (identità visiva per ente pubblico)`
        ],
        action: { type: 'scroll', target: '#lavori', label: 'Vedi i Progetti' }
      },

      /* 31. Stack tecnologico completo */
      {
        id: 'techStack',
        keys: ['stack tecn', 'architettura', 'tech stack', 'quali linguaggi', 'infrastruttura', 'workstation', 'rtx', 'gpu'],
        replies: [
          `Lo stack tecnico completo:\n\n• **Hardware:** workstation con RTX (vram elevata per modelli locali) + storage NAS per i dataset\n• **AI locale:** ComfyUI + Forge + Blender su Linux\n• **Audio:** ElevenLabs cloud + Lyria cloud + Reaper locale\n• **Web:** Vanilla JS + WebGL2/OGL + CSS token + deploy statico\n• **Automazione:** Python + bash scripts\n• **Post:** Premiere Pro + DaVinci Resolve + Topaz Video AI`,
          `La cosa interessante nello stack di Fabrizio è che i **modelli pesanti girano localmente** (ComfyUI, Flux.1, Blender) mentre solo le API cloud leggere sono esterne (ElevenLabs per voce, Lyria per musica). Questo garantisce:\n\n• Nessun costo per API di generazione immagini/video\n• Controllo totale sui modelli e sui dati\n• Batch processing senza limiti di rate`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Vedi il Setup' }
      },

      /* 32. Modalità di lavoro remoto/presenza */
      {
        id: 'workMode',
        keys: ['remoto', 'da remoto', 'presenza', 'in presenza', 'sede', 'dove lavora', 'può venire', 'trasferta', 'online'],
        replies: [
          `Fabrizio lavora **prevalentemente da remoto** dalla workstation in **${P.location || 'Piemonte'}**. La pipeline è interamente digitale — non è necessaria la presenza fisica per spot video, jingle o siti web.\n\nPer briefing strategici o presentazioni finali è disponibile per call video o, su accordo, incontri di persona.`,
          `Il lavoro è **100% remote-first**: la pipeline AI non richiede presenza fisica. Brief, revisioni, consegne e feedback avvengono online. Questo permette di lavorare con clienti in tutta Italia (e non solo).`
        ],
        action: { type: 'scroll', target: '#brief', label: 'Inizia il Brief' }
      },

      /* 33. Domanda vaga / non capisco */
      {
        id: 'vague',
        keys: ['non capisco', 'non so', 'aiuto', 'come funziona', 'da dove parto', 'spiegami', 'cosa intendi'],
        replies: [
          `Nessun problema. Provo a guidarti:\n\n• Vuoi sapere **chi è Fabrizio** e cosa fa? → Digita "chi è Fabrizio"\n• Vuoi esplorare un **progetto specifico**? → "Dimmi di Union Energia" o "Esoscheletro"\n• Vuoi capire **quali strumenti usa**? → "Che tool usa?"\n• Vuoi **avviare una collaborazione**? → "Come posso contattarti?"`,
          `Posso aiutarti su:\n\n• **Progetti:** Union Energia, Esoscheletro, CETS, La Locanda, CDI Infissi\n• **Strumenti:** ComfyUI, Blender, ElevenLabs, Lyria, Premiere Pro\n• **Servizi:** preventivi, brief, tempi e modalità di lavoro\n\nCosa ti interessa di più?`
        ],
        action: null
      },

      /* 34. Ringraziamento / feedback positivo */
      {
        id: 'thanks',
        keys: ['grazie', 'perfetto', 'ottimo', 'bravo', 'interessante', 'capito', 'chiaro', 'fantastico', 'thank', 'ottima risposta'],
        replies: [
          `Perfetto. Se vuoi approfondire qualcosa o passare al brief, sono qui.`,
          `Prego. C'è altro che vuoi sapere sul portfolio o sui servizi di Fabrizio?`,
          `Figurati. Se hai un progetto in mente, il modulo brief sul sito è il punto di partenza giusto.`
        ],
        action: null
      },

      /* 35. Tour Guidato di Regia */
      {
        id: 'tour',
        keys: ['tour', 'fai fare un giro', 'visita guidata', 'accompagnami', 'mostrami il sito', 'fai da cicerone', 'guida del sito', 'fai da guida'],
        replies: [
          `🎬 **Avvio il Tour di Regia!** Ti guiderò attraverso le 4 sale del portfolio: partiremo dalla moviola WebGL dell'Hero fino ai banchi di produzione e al brief. Seguimi!`,
          `Ottima idea. Prendo io la regia dello scroll: faremo un percorso in 4 tappe chiave (Hero WebGL → Spot Union → Esoscheletro 3D → Banchi & Brief).`
        ],
        action: { type: 'tour_start', target: '#top', label: 'Avvia Tour' }
      },

      /* 36. Shader Glitch FX */
      {
        id: 'glitch',
        keys: ['glitch', 'distorsione', 'vibra shader', 'effetto glitch', 'fai un glitch', 'distorci'],
        replies: [
          `⚡ **Impulso Glitch WebGL inviato!** Ho iniettato una turbolenza istantanea nel confine umano/macchina dell'Hero. Guarda lo shader in alto!`,
          `Fatto! Impulso glitch inviato al canvas WebGL2: il confine vibra per 2 secondi a frequenza maggiorata.`
        ],
        action: { type: 'shader_glitch', target: '#top', label: 'Guarda lo Shader' }
      },

      /* 37. Shader Scena */
      {
        id: 'shaderScene',
        keys: ['cambia scena', 'altra scena', 'scena successiva', 'commutare scena', 'ruota scena'],
        replies: [
          `🖼️ **Scena WebGL commutata!** Ho ruotato la scena fotografica nell'Hero tra Regia video, Sistema visivo e Flussi agenti.`,
          `Scena aggiornata nel viewport! Il motore ha caricato la composizione successiva.`
        ],
        action: { type: 'shader_scene', target: '#top', label: 'Guarda Nuova Scena' }
      },

      /* 38. Shader Speed (Calma / Turbo) */
      {
        id: 'shaderSpeed',
        keys: ['calma shader', 'rallenta shader', 'turbo shader', 'accelera shader', 'velocità shader', 'più veloce lo shader'],
        replies: [
          `⏱️ **Velocità shader aggiornata!** La cadenza temporale e la turbolenza del rumore FBM sono state ricalibrate in tempo reale.`
        ],
        action: { type: 'shader_speed', target: '#top', label: 'Controlla Shader' }
      },

      /* 39. Concept Lab */
      {
        id: 'concept',
        keys: ['concept', 'moodboard', 'ideare uno spot', 'ideare un video', 'progetta uno spot', 'suggerisci uno spot', 'idea video', 'idea per uno spot'],
        replies: [
          `💡 **Benvenuto nel Concept Lab di Regia!** Possiamo costruire insieme il gancio visivo (hook), il prompt video per ComfyUI e la direzione audio per il tuo settore. Ti mostro subito i settori disponibili.`
        ],
        action: { type: 'concept_start', target: '#brief', label: 'Avvia Concept Lab' }
      },

      /* 40. Dossier / Export */
      {
        id: 'dossier',
        keys: ['dossier', 'scheda riepilogo', 'esporta brief', 'copia brief', 'invia mail', 'scheda progetto', 'scheda di produzione'],
        replies: [
          `📋 **Ecco la Scheda Dossier di Produzione!** Ho assemblato i parametri e predisposto la copia rapida negli appunti o l'invio mail a Fabrizio con un solo clic.`
        ],
        action: { type: 'dossier_show', target: '#brief', label: 'Visualizza Dossier' }
      },

      /* 41. Fallback generico */
      {
        id: 'fallback',
        keys: [],
        replies: [
          `Non ho trovato una risposta precisa a questa domanda nel portfolio. Posso però guidarti su:\n\n• I **5 progetti reali** (Union Energia, Esoscheletro, CETS, Locanda, CDI Infissi)\n• Gli **strumenti e modelli AI** (ComfyUI, Qwen, Premiere Pro, Lyria)\n• I **servizi e il brief preventivi**\n\nCosa desideri approfondire?`,
          `Questa specifica informazione non è nel mio archivio. Prova a chiedere di un progetto specifico, di un tool o di come avviare una collaborazione. Sono più utile su quei terreni.`,
          `Non ho dati su questo. Se la domanda riguarda il portfolio di Fabrizio, prova a riformularla — tipo "parlami di Union Energia" o "che tool usa per il video". Se esula dal portfolio, non è il mio territorio.`
        ],
        action: { type: 'scroll', target: '#banchi', label: 'Esplora il Portfolio' }
      }

    ]; // fine intents

    /* ─── Scoring e Selezione Intento ──────────────────────────────────────── */

    let bestIntent = intents[intents.length - 1]; // fallback di default
    let bestScore = 0;

    for (const intent of intents) {
      if (intent.id === 'fallback') continue;
      const s = score(q, intent.keys);

      // Boost contestuale: se la history recente parla dello stesso progetto/argomento
      const histBoost = intent.keys.some(k => {
        if (typeof k === 'string') return recentHistory.includes(k);
        if (k instanceof RegExp) return k.test(recentHistory);
        return false;
      }) ? 0.5 : 0;

      if (s + histBoost > bestScore) {
        bestScore = s + histBoost;
        bestIntent = intent;
      }
    }

    /* ─── Selezione Risposta con Rotazione Temporale ──────────────────────── */

    const fullText = pick(bestIntent.replies);
    const action   = bestIntent.action || null;

    /* ─── Streaming Simulato ──────────────────────────────────────────────── */

    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i++) {
      onChunk((i === 0 ? '' : ' ') + words[i]);
      await new Promise(r => setTimeout(r, CONFIG.engine.simulatedStreamingDelay));
    }

    return { mode: 'deterministic', action, leadCapture: bestIntent.id === 'contact' };
  }
}
