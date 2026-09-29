/**
 * Configurazione per il Chatbot "Nous" — F/AI Portfolio
 * Architettura Ibrida (28 Settembre 2026)
 */
export const CONFIG = {
  name: "Nous",
  brand: "MF/AI",
  role: "Intelligenza di Regia Portfolio",
  locale: "it",
  contactEmail: "fabriziomana@gmail.com",
  siteUrl: "https://ivelsefila.github.io/f-ai-site/v2/index.html",
  
  // Endpoint Cloudflare Worker (o proxy locale per sviluppo /api/chat)
  cloudProxyUrl: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? '/api/chat'
    : '', 

  // Sintesi Vocale Neurale HD (Edge TTS / Fallback neurale browser)
  tts: {
    endpoint: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? '/api/tts'
      : '',
    defaultVoice: 'it-IT-ElsaNeural'
  },

  // Modello WebGPU in-browser (scaricato ed eseguito solo su richiesta esplicita dell'utente)
  webgpuModel: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  
  welcomeMessage: "Ciao! Sono **Nous**, l’intelligenza di regia del portfolio di Fabrizio. Posso raccontarti i suoi progetti reali, gli strumenti AI che usa, o guidarti a costruire un brief su misura. Da cosa vuoi partire?",
  
  quickChips: [
    { label: "🎬 Tour di Regia", query: "Avvia il tour guidato del portfolio" },
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

  deflectionMessage: "La mia regia è tarata esclusivamente sul lavoro, i video e l'architettura AI di Fabrizio Mana. Torniamo a parlare di progetti: vuoi esplorare gli spot per Union Energia, il modello 3D per l'esoscheletro o configurare un brief?",

  engine: {
    simulatedStreamingDelay: 12
  }
};
