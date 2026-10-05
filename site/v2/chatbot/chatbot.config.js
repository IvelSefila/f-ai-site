/**
 * Configurazione per il Chatbot "Nous" — F/AI Portfolio
 * Architettura Ibrida (28 Settembre 2026)
 */
// Metti qui l'URL del Worker dopo il deploy (es. "https://nous.tuodominio.workers.dev/chat").
// Finche' resta vuoto, in produzione la modalita' Cloud non viene offerta.
const CLOUD_PROXY_URL_PRODUZIONE = 'https://nodo-proxy.fabrizio-mana.workers.dev';

export const CONFIG = {
  /* interruttori provvisori: suggerimenti di Nous (sezione, puntatore, rimugina) e tono IA impazzita con la sua voce */
  suggerimenti: false,
  tonoHal: false,
  name: "Nous",
  brand: "MF/AI",
  role: "Intelligenza di Regia Portfolio",
  locale: "it",
  contactEmail: "fabriziomana@gmail.com",
  siteUrl: "https://ivelsefila.github.io/f-ai-site/v2/index.html",
  
  // Endpoint Cloudflare Worker (o proxy locale per sviluppo /api/chat)
  cloudProxyUrl: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? '/api/chat'
    : CLOUD_PROXY_URL_PRODUZIONE,

  // Sintesi Vocale Neurale HD (Edge TTS / Fallback neurale browser)
  tts: {
    /* sempre il Worker (Azure): anche in locale, altrimenti senza /api/tts si sentiva la voce di ripiego del browser */
    endpoint: CLOUD_PROXY_URL_PRODUZIONE + '/tts',
    defaultVoice: 'it-IT-ElsaNeural'
  },

  // Modello WebGPU in-browser (scaricato ed eseguito solo su richiesta esplicita dell'utente)
  // ID verificato nel catalogo di @mlc-ai/web-llm 0.2.85 (stessa versione pinnata in chatbot.worker.js)
  webgpuModel: "Qwen3-1.7B-q4f16_1-MLC",
  webgpuModelLabel: "Qwen3 1.7B",
  webllmVersion: "0.2.85",
  
  welcomeMessage: "Ciao! Sono **Nous**, l’intelligenza di regia del portfolio di Fabrizio. Posso raccontarti i suoi progetti reali, gli strumenti AI che usa, o guidarti a costruire un brief su misura. Da cosa vuoi partire?",
  
  quickChips: [
    { label: "🎬 Visita guidata", query: "visita guidata" },
    { label: "Chi è Fabrizio?", query: "Chi è Fabrizio Mana e cosa fa?" },
    { label: "Progetti e clienti", query: "Quali sono i progetti e i marchi principali?" },
    { label: "💡 Ideare uno Spot", query: "Aiutami a ideare un concept video" },
    { label: "Stack tecnico & AI", query: "Quali strumenti e modelli AI usa Fabrizio?" }
  ],

  // Guardrail invalicabili: temi esoterici, Lilith, politica di partito, vita privata, diagnosi
  bannedPatterns: [
    /\b(lilith|esoter|taroc|astrolog|oroscop|segno zodiac|zodiaco|occult|rituale|magia)\b/i,
    /\b(politica|partito|elezion|governo|destra|sinistra)\b/i,
    /\b(vita privata|fidanzat|sposat|stipendio|patrimonio|relazion)\b/i,
    /\b(diagnosi|malattia|curare|terapia|farmaco|avvocato|consiglio legale)\b/i
  ],

  deflectionMessage: "Di questo non mi occupo: sono l'assistente del portfolio di Fabrizio Mana. Posso invece raccontarti i cinque lavori (Union Energia, Human Robots, Studio CETS, La Locanda del Castello, CDI Infissi), gli strumenti che usa o come funziona il brief. Da dove vuoi partire?",

  // Domande fuori tema (non vietate, semplicemente non c'entrano): Nous lo dice e propone cose a tema
  offTopicPatterns: [
    /\b(ricett\w*|cucinar\w*|ingredient\w*|dove (si )?mangia\w*|ristorant\w* (a|ad|di|in|vicin\w*)|consigli\w* (un|una|il|la|dei|delle)? ?(ristorante|film|libro|serie|hotel|albergo|viaggio|vacanz\w*|locale|pizzeria))\b/i,
    /\b(meteo|previsioni del tempo|che tempo (fa|far\w*|c'è|ci sarà)|piover\w*|piove|temperatur\w* (di|a|oggi|domani)|calcio|serie a|champions|formula 1|partita di|risultati sportivi|notizie|news di oggi|barzelletta|indovinello|poesia su|canzone di)\b/i,
    /\b(traduc\w+|compiti|equazione|integrale|derivata|teorema|bitcoin|crypto\w*|borsa|azioni di|dieta|allenament\w*|palestra|capitale d\w+|chi ha vinto|presidente d\w+)\b/i,
    /\b(come si installa|come installo|installare (windows|linux|ubuntu|office)|scrivimi (un |uno )?(codice|script|programma)|risolvi (questo|il) (codice|bug))\b/i
  ],
  // Se compare una di queste parole la domanda riguarda il portfolio, anche se contiene un tema sopra
  onTopicHints: /\b(union|cets|locanda|cdi|human robots|esoscheletro|alfred|playlab|max video|brief|fabrizio|mf\/ai|portfolio|sito|video|spot|jingle|logo|marchio|grafica|strumenti|servizi|lavori|progetti|preventiv\w*|contatt\w*)\b/i,

  engine: {
    simulatedStreamingDelay: 12,
    cloudFirstChunkTimeoutMs: 20000,
    cloudTotalTimeoutMs: 60000
  }
};
