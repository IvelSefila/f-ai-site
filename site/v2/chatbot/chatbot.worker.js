/**
 * Web Worker per WebLLM / WebGPU — Chatbot "Nodo"
 * Esegue il modello neurale direttamente sulla GPU del visitatore.
 */

let engine = null;
let currentModel = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

self.onmessage = async (e) => {
  const { type, data } = e.data;

  if (type === "init") {
    const model = data?.model || currentModel;
    try {
      self.postMessage({ type: "progress", progress: 0.05, text: "Verifica accelerazione WebGPU..." });

      // Import dinamico da CDN ESM affidabile
      const { CreateMLCEngine } = await import("https://esm.run/@mlc-ai/web-llm");

      self.postMessage({ type: "progress", progress: 0.15, text: `Download pesi ${model}...` });

      engine = await CreateMLCEngine(model, {
        initProgressCallback: (report) => {
          self.postMessage({
            type: "progress",
            progress: report.progress,
            text: report.text || `Caricamento neurale: ${Math.round(report.progress * 100)}%`
          });
        }
      });

      self.postMessage({ type: "ready", model });
    } catch (err) {
      self.postMessage({
        type: "error",
        error: `Inizializzazione WebGPU fallita: ${err.message || String(err)}`
      });
    }
  }

  if (type === "generate") {
    if (!engine) {
      self.postMessage({ type: "error", error: "Modello WebGPU non inizializzato." });
      return;
    }

    try {
      const { messages, systemPrompt } = data;
      const conversation = [
        { role: "system", content: systemPrompt },
        ...messages
      ];

      const chunks = await engine.chat.completions.create({
        messages: conversation,
        temperature: 0.6,
        max_tokens: 450,
        stream: true
      });

      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          self.postMessage({ type: "chunk", delta });
        }
      }

      self.postMessage({ type: "done" });
    } catch (err) {
      self.postMessage({ type: "error", error: `Errore durante l'inferenza: ${err.message}` });
    }
  }

  if (type === "unload") {
    if (engine) {
      try {
        await engine.unload();
      } catch (e) {}
      engine = null;
    }
    self.postMessage({ type: "unloaded" });
  }
};
