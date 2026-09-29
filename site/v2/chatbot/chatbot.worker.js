/**
 * Web Worker per WebLLM / WebGPU — Chatbot "Nous"
 * Esegue il modello neurale direttamente sulla GPU del visitatore.
 * Ogni richiesta porta un id: le risposte tornano etichettate con lo stesso id.
 */

// Versione pinnata: deve coincidere con CONFIG.webllmVersion (ID modello verificato su questa versione).
const WEBLLM_VERSION = "0.2.85";
const WEBLLM_URL = `https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@${WEBLLM_VERSION}/+esm`;

let engine = null;
let currentModel = "Qwen3-1.7B-q4f16_1-MLC";
let interrupted = false;

const isQwen3 = (m) => /^Qwen3/i.test(m || "");

self.onmessage = async (e) => {
  const { type, data, id } = e.data || {};

  if (type === "init") {
    const model = data?.model || currentModel;
    try {
      self.postMessage({ type: "progress", id, progress: 0.05, text: "Verifica accelerazione WebGPU..." });

      const { CreateMLCEngine } = await import(WEBLLM_URL);

      self.postMessage({ type: "progress", id, progress: 0.15, text: `Download pesi ${model}...` });

      engine = await CreateMLCEngine(model, {
        initProgressCallback: (report) => {
          self.postMessage({
            type: "progress",
            id,
            progress: report.progress,
            text: report.text || `Caricamento neurale: ${Math.round(report.progress * 100)}%`
          });
        }
      });
      currentModel = model;

      self.postMessage({ type: "ready", id, model });
    } catch (err) {
      engine = null;
      self.postMessage({
        type: "error",
        id,
        error: `Inizializzazione WebGPU fallita: ${err?.message || String(err)}`
      });
    }
    return;
  }

  if (type === "interrupt") {
    interrupted = true;
    try {
      if (engine) await engine.interruptGenerate();
    } catch (err) {}
    return;
  }

  if (type === "generate") {
    if (!engine) {
      self.postMessage({ type: "error", id, error: "Modello WebGPU non inizializzato." });
      return;
    }

    interrupted = false;
    try {
      const { messages, systemPrompt } = data;
      const conversation = [
        { role: "system", content: systemPrompt },
        ...messages
      ];

      // Qwen3: disattiva il thinking aggiungendo /no_think all'ultimo messaggio utente
      if (isQwen3(currentModel)) {
        for (let i = conversation.length - 1; i >= 0; i--) {
          if (conversation[i].role === "user") {
            conversation[i] = { ...conversation[i], content: `${conversation[i].content} /no_think` };
            break;
          }
        }
      }

      const chunks = await engine.chat.completions.create({
        messages: conversation,
        temperature: 0.6,
        max_tokens: 450,
        stream: true
      });

      // Filtro difensivo: scarta un eventuale blocco <think>...</think> anche se vuoto
      let pending = "";
      let inThink = false;
      const emit = (text) => { if (text) self.postMessage({ type: "chunk", id, delta: text }); };

      for await (const chunk of chunks) {
        if (interrupted) break;
        const delta = chunk.choices[0]?.delta?.content || "";
        if (!delta) continue;
        pending += delta;
        while (true) {
          if (inThink) {
            const end = pending.indexOf("</think>");
            if (end === -1) { pending = ""; break; }
            pending = pending.slice(end + 8).replace(/^\s+/, "");
            inThink = false;
          } else {
            const start = pending.indexOf("<think>");
            if (start === -1) {
              // tieni in coda un possibile inizio di tag spezzato
              const keep = Math.max(pending.lastIndexOf("<"), -1);
              if (keep !== -1 && "<think>".startsWith(pending.slice(keep))) {
                emit(pending.slice(0, keep));
                pending = pending.slice(keep);
              } else {
                emit(pending);
                pending = "";
              }
              break;
            }
            emit(pending.slice(0, start));
            pending = pending.slice(start + 7);
            inThink = true;
          }
        }
      }
      if (!inThink) emit(pending);

      self.postMessage({ type: interrupted ? "interrupted" : "done", id });
    } catch (err) {
      self.postMessage({ type: "error", id, error: `Errore durante l'inferenza: ${err?.message || String(err)}` });
    }
    return;
  }

  if (type === "unload") {
    if (engine) {
      try {
        await engine.unload();
      } catch (err) {}
      engine = null;
    }
    self.postMessage({ type: "unloaded", id });
  }
};
