(function initOriginalPlaylabDNA(global) {
  "use strict";

  const engines = {
    loom: {
      index: "01",
      name: "TRAMA",
      subtitle: "CAMPO DI TENSIONE",
      glyph: "⌁",
      accent: "#caff3d",
      promise: "Tendi un campo vivo tra punti mobili e mantienilo in equilibrio.",
      gesture: "TRASCINA I PUNTI · AVVICINA O ALLARGA DUE DITA",
      modules: [
        {
          key: "anchorCount",
          label: "NODI ATTIVI",
          question: "Quanti nodi vuoi governare insieme?",
          help: "Più nodi creano geometrie ricche e richiedono più coordinazione.",
          options: [
            { value: 3, label: "TRIADE", meta: "CHIARO / TATTILE" },
            { value: 5, label: "COSTELLAZIONE", meta: "EQUILIBRATO" },
            { value: 7, label: "SCIAME", meta: "DENSO / ESPERTO" },
          ],
        },
        {
          key: "phaseWindow",
          label: "PRECISIONE",
          question: "Quanto deve essere precisa la risonanza?",
          help: "Una finestra stretta premia micro-correzioni del dito.",
          options: [
            { value: "wide", label: "AMPIA", meta: "ACCESSIBILE" },
            { value: "balanced", label: "DINAMICA", meta: "BILANCIATA" },
            { value: "precise", label: "MICRO", meta: "PRECISIONE" },
          ],
        },
        {
          key: "viscosity",
          label: "RISPOSTA AL TOCCO",
          question: "Come risponde la materia al gesto?",
          help: "Cambia inerzia, elasticità e velocità di assestamento del campo.",
          options: [
            { value: "responsive", label: "REATTIVA", meta: "IMMEDIATA" },
            { value: "flowing", label: "FLUIDA", meta: "SCORREVOLE" },
            { value: "dense", label: "DENSA", meta: "PESANTE" },
          ],
        },
        {
          key: "entropyRecovery",
          label: "RECUPERO",
          question: "Come recupera il campo dagli errori?",
          help: "Determina quanta energia ritorna quando ricomponi una figura.",
          options: [
            { value: "rapid", label: "MORBIDO", meta: "RECUPERO RAPIDO" },
            { value: "steady", label: "ADATTIVO", meta: "CONTESTUALE" },
            { value: "gradual", label: "SEVERO", meta: "ALTA TENSIONE" },
          ],
        },
        {
          key: "fieldMaterial",
          label: "MATERIA",
          question: "Di cosa è tessuto il campo?",
          help: "Cambia la firma visiva senza toccare la leggibilità tattile.",
          options: [
            { value: "silk", label: "FILAMENTO", meta: "LINEARE / NETTO" },
            { value: "fluid", label: "AURORA", meta: "LUMINOSA / MORBIDA" },
            { value: "crystal", label: "CRISTALLO", meta: "SFACCETTATO / NETTO" },
          ],
        },
      ],
    },
    fold: {
      index: "02",
      name: "PIEGA",
      subtitle: "MEMBRANA VIVA",
      glyph: "△",
      accent: "#74ebff",
      promise: "Piega una membrana triangolare e propaga onde nella forma giusta.",
      gesture: "TRASCINA SULLA FORMA · RUOTA O STRINGI CON DUE DITA",
      modules: [
        {
          key: "targetTopology",
          label: "FORMA OBIETTIVO",
          question: "Quale forma deve imparare la membrana?",
          help: "Ogni topologia cambia i punti di pressione e l’ordine delle pieghe.",
          options: [
            { value: "bridge", label: "PONTE", meta: "BILANCIATA" },
            { value: "halo", label: "CORONA", meta: "SIMMETRICA" },
            { value: "triad", label: "TRIADE", meta: "ASIMMETRICA" },
          ],
        },
        {
          key: "foldBudget",
          label: "GESTI DISPONIBILI",
          question: "Quante pieghe hai per risolvere una forma?",
          help: "Meno gesti rendono ogni piega una scelta importante.",
          options: [
            { value: 4, label: "QUATTRO", meta: "ESPLORA" },
            { value: 3, label: "TRE", meta: "BILANCIATO" },
            { value: 2, label: "DUE", meta: "ESSENZIALE" },
          ],
        },
        {
          key: "waveLatency",
          label: "ECO DEL GESTO",
          question: "Quanto velocemente viaggia una piega?",
          help: "Il ritardo modifica anticipazione, ritmo e interferenze.",
          options: [
            { value: "quick", label: "IMPULSO", meta: "IMMEDIATO" },
            { value: "elastic", label: "ECO", meta: "CADENZATO" },
            { value: "echo", label: "MAREA", meta: "LENTO / AMPIO" },
          ],
        },
        {
          key: "polarityMode",
          label: "INTERAZIONE TRA LE PIEGHE",
          question: "Come interagiscono le pieghe vicine?",
          help: "Attrazione, alternanza o repulsione creano strategie diverse.",
          options: [
            { value: "positive", label: "SI ATTRAGGONO", meta: "STESSA DIREZIONE" },
            { value: "alternating", label: "ALTERNATA", meta: "RITMO" },
            { value: "gesture", label: "GESTUALE", meta: "DIREZIONALE" },
          ],
        },
        {
          key: "membraneMaterial",
          label: "SUPERFICIE",
          question: "Quale pelle vuoi deformare?",
          help: "La resa cambia peso percepito, riflessi e lettura delle onde.",
          options: [
            { value: "silk", label: "SETA LUCE", meta: "OPACA / CALDA" },
            { value: "foil", label: "LAMINA", meta: "RIFLETTENTE" },
            { value: "gel", label: "GEL", meta: "VISCOSO / VIVO" },
          ],
        },
      ],
    },
    drift: {
      index: "03",
      name: "FLUSSO",
      subtitle: "DANZA DELLE CORRENTI",
      glyph: "≈",
      accent: "#9a87ff",
      promise: "Disegna correnti e fai cooperare moti autonomi in una coreografia.",
      gesture: "DISEGNA CON IL DITO · TOCCA PER CREARE UN’ONDA",
      modules: [
        {
          key: "moteRoles",
          label: "RUOLI DELLE PARTICELLE",
          question: "Quale piccolo gruppo vuoi dirigere?",
          help: "I ruoli cambiano velocità, sensibilità e modo di collaborare.",
          options: [
            { value: "triad", label: "TRIADE", meta: "RUOLI EQUILIBRATI" },
            { value: "specialist", label: "SPECIALISTI", meta: "COMPITI DISTINTI" },
            { value: "adaptive", label: "ADATTIVI", meta: "RUOLI EMERGENTI" },
          ],
        },
        {
          key: "flowMemory",
          label: "MEMORIA DEL FLUSSO",
          question: "Quanto resta attiva una corrente disegnata?",
          help: "Tracce brevi sono ritmiche; tracce lunghe costruiscono sistemi.",
          options: [
            { value: "fleeting", label: "ISTANTE", meta: "RAPIDA" },
            { value: "echo", label: "SCIA", meta: "BILANCIATA" },
            { value: "persistent", label: "SEDIMENTO", meta: "PERSISTENTE" },
          ],
        },
        {
          key: "targetChoreography",
          label: "COREOGRAFIA",
          question: "Quale relazione devono formare i moti?",
          help: "Non raggiungi una casella: componi un movimento collettivo.",
          options: [
            { value: "orbit", label: "ORBITA", meta: "CIRCOLARE" },
            { value: "weave", label: "INTRECCIO", meta: "INCROCIATO" },
            { value: "breathe", label: "RESPIRO", meta: "ESPANSIVA" },
          ],
        },
        {
          key: "frontBehavior",
          label: "ONDA IN ARRIVO",
          question: "Come reagisce il campo alla pressione?",
          help: "Il fronte decide se assorbire, dividere o rilanciare l’energia.",
          options: [
            { value: "breeze", label: "BREZZA", meta: "MORBIDO" },
            { value: "shear", label: "TAGLIO", meta: "DIREZIONALE" },
            { value: "vortex", label: "VORTICE", meta: "ROTANTE" },
          ],
        },
        {
          key: "ambientFeedback",
          label: "TRACCIA VISIVA",
          question: "Come vuoi leggere ciò che hai causato?",
          help: "Scegli come il gioco ti mostra l’effetto dei tuoi gesti.",
          options: [
            { value: "trails", label: "TRACCE", meta: "SOTTILE" },
            { value: "ripples", label: "ONDE", meta: "CONTINUO" },
            { value: "aurora", label: "AURORA", meta: "STRUTTURALE" },
          ],
        },
      ],
    },
    choir: {
      index: "04",
      name: "CORO",
      subtitle: "CERCHI ARMONICI",
      glyph: "◎",
      accent: "#ff7ab6",
      promise: "Accorda cerchi concentrici e cattura risonanze al ritmo del campo.",
      gesture: "TRASCINA I CERCHI · TOCCA IL CENTRO AL MOMENTO GIUSTO",
      modules: [
        {
          key: "bandCount",
          label: "CERCHI",
          question: "Quante frequenze vuoi accordare?",
          help: "Più bande aumentano ricchezza armonica e coordinazione.",
          options: [
            { value: 3, label: "TRIADE", meta: "IMMEDIATA" },
            { value: 4, label: "QUARTETTO", meta: "BILANCIATO" },
            { value: 5, label: "SPETTRO", meta: "PROFONDO" },
          ],
        },
        {
          key: "tuningRatios",
          label: "ACCORDATURA",
          question: "Quale intervallo governa gli allineamenti?",
          help: "Le distanze tra bersagli creano una grammatica visiva distinta.",
          options: [
            { value: "open", label: "APERTA", meta: "REGOLARE" },
            { value: "fifth", label: "DIAGONALE", meta: "DINAMICA" },
            { value: "spectral", label: "SPETTRALE", meta: "IRREGOLARE" },
          ],
        },
        {
          key: "tempoDrift",
          label: "DERIVA DEL TEMPO",
          question: "Quanto deve respirare il ritmo?",
          help: "Il tempo può restare calmo o diventare un organismo instabile.",
          options: [
            { value: "calm", label: "CALMO", meta: "LARGO" },
            { value: "alive", label: "VIVO", meta: "RESPIRA" },
            { value: "volatile", label: "VOLATILE", meta: "SORPRENDE" },
          ],
        },
        {
          key: "harmonicRule",
          label: "REGOLA ARMONICA",
          question: "Come devono muoversi insieme i cerchi?",
          help: "La regola modifica precisione, deriva e direzioni complementari.",
          options: [
            { value: "consonance", label: "CONSONANZA", meta: "COERENTE" },
            { value: "orbit", label: "ORBITA", meta: "MOBILE" },
            { value: "counterpoint", label: "CONTRAPPUNTO", meta: "OPPOSTO" },
          ],
        },
        {
          key: "spectralMaterial",
          label: "SPETTRO",
          question: "Che materia emette la risonanza?",
          help: "Colori e rifrazione cambiano, ma gli obiettivi restano leggibili.",
          options: [
            { value: "silk", label: "SETA", meta: "MORBIDA" },
            { value: "glass", label: "VETRO", meta: "LUMINOSO" },
            { value: "plasma", label: "PLASMA", meta: "SATURO" },
          ],
        },
      ],
    },
  };

  const universalModules = [
    {
      key: "intensity",
      label: "INTENSITÀ",
      question: "Quanto deve essere esigente la sessione?",
      options: [
        { value: 1, label: "RILASSATA", meta: "FACILE" },
        { value: 2, label: "EQUILIBRATA", meta: "BILANCIATA" },
        { value: 3, label: "INTENSA", meta: "ESIGENTE" },
      ],
    },
    {
      key: "controls",
      label: "CONTROLLO",
      question: "Come vuoi toccare il sistema?",
      options: [
        { value: "gesture", label: "SOLO GESTI", meta: "TELA LIBERA" },
        { value: "hybrid", label: "IBRIDO", meta: "GESTI + PULSANTI" },
        { value: "precision", label: "PRECISIONE", meta: "PULSANTI VISIBILI" },
      ],
    },
    {
      key: "palette",
      label: "PALETTE",
      question: "Quale atmosfera deve avere il gioco?",
      options: [
        { value: "acid", label: "ACIDA", meta: "VERDE ACIDO / SCURO" },
        { value: "aurora", label: "AURORA", meta: "CIANO / VIOLA" },
        { value: "mono", label: "MONOCROMATICA", meta: "INCHIOSTRO / CHIARO" },
      ],
    },
    {
      key: "feedback",
      label: "RISPOSTA",
      question: "Quanta risposta visiva vuoi dal sistema?",
      options: [
        { value: "calm", label: "CALMA", meta: "RIDOTTO" },
        { value: "full", label: "VIVO", meta: "COMPLETO" },
        { value: "haptic", label: "TATTILE", meta: "VIBRAZIONE + EFFETTI" },
      ],
    },
    {
      key: "session",
      label: "DURATA",
      question: "Quanto deve durare una partita?",
      options: [
        { value: "quick", label: "VELOCE", meta: "~45 SECONDI" },
        { value: "standard", label: "NORMALE", meta: "~90 SECONDI" },
        { value: "deep", label: "LUNGA", meta: "SENZA FRETTA" },
      ],
    },
  ];

  const presets = {
    loom: [
      { id: "soft-field", label: "CAMPO MORBIDO", values: { anchorCount: 3, phaseWindow: "wide", viscosity: "flowing", entropyRecovery: "rapid", fieldMaterial: "fluid" } },
      { id: "precision-weave", label: "TRAMA PRECISA", values: { anchorCount: 5, phaseWindow: "precise", viscosity: "responsive", entropyRecovery: "steady", fieldMaterial: "silk" } },
    ],
    fold: [
      { id: "foil-tide", label: "MAREA METALLICA", values: { targetTopology: "halo", foldBudget: 4, waveLatency: "echo", polarityMode: "positive", membraneMaterial: "foil" } },
      { id: "hard-triad", label: "TRIADE DIFFICILE", values: { targetTopology: "triad", foldBudget: 2, waveLatency: "quick", polarityMode: "gesture", membraneMaterial: "gel" } },
    ],
    drift: [
      { id: "quiet-orbit", label: "ORBITA CALMA", values: { moteRoles: "triad", flowMemory: "persistent", targetChoreography: "orbit", frontBehavior: "breeze", ambientFeedback: "ripples" } },
      { id: "living-weave", label: "INTRECCIO VIVO", values: { moteRoles: "adaptive", flowMemory: "echo", targetChoreography: "weave", frontBehavior: "shear", ambientFeedback: "aurora" } },
    ],
    choir: [
      { id: "glass-quartet", label: "QUARTETTO DI VETRO", values: { bandCount: 4, tuningRatios: "fifth", tempoDrift: "alive", harmonicRule: "consonance", spectralMaterial: "glass" } },
      { id: "plasma-counter", label: "CONTRAPPUNTO AL PLASMA", values: { bandCount: 5, tuningRatios: "spectral", tempoDrift: "volatile", harmonicRule: "counterpoint", spectralMaterial: "plasma" } },
    ],
  };

  function defaultsFor(engineId) {
    const engine = engines[engineId] || engines.loom;
    const values = {};
    engine.modules.forEach(module => { values[module.key] = module.options[1]?.value ?? module.options[0].value; });
    universalModules.forEach(module => { values[module.key] = module.options[1]?.value ?? module.options[0].value; });
    return values;
  }

  function normalise(engineId, values) {
    const safeId = engines[engineId] ? engineId : "loom";
    const output = defaultsFor(safeId);
    [...engines[safeId].modules, ...universalModules].forEach(module => {
      const allowed = module.options.map(option => option.value);
      if (allowed.includes(values?.[module.key])) output[module.key] = values[module.key];
    });
    return output;
  }

  global.FAIPlaylabDNA = Object.freeze({
    engines,
    universalModules,
    presets,
    modulesFor: engineId => engines[engineId]?.modules || [],
    defaultsFor,
    normalise,
  });
})(typeof window !== "undefined" ? window : globalThis);
