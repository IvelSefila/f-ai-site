(function initOriginalPlaylab() {
  "use strict";

  const dialog = document.querySelector("#original-playlab");
  const openButton = document.querySelector("#open-playlab");
  if (!dialog || !openButton || !globalThis.FAIPlaylabDNA) return;

  const dna = globalThis.FAIPlaylabDNA;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const storageKey = "fai-original-playlab-v1";
  const reduceMotionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const factories = {
    loom: "createLoom",
    fold: "createFold",
    drift: "createDrift",
    choir: "createChoir",
  };
  const legacyGameNames = {
    LOOM: "TRAMA",
    FOLD: "PIEGA",
    DRIFT: "FLUSSO",
    CHOIR: "CORO",
    QUIET: "IPNOTICA",
    KINETIC: "CINETICA",
    MYSTERIOUS: "ENIGMATICA",
  };

  function localiseSavedName(value) {
    if (!value || value === "UNTITLED FIELD") return "GIOCO SENZA NOME";
    const match = String(value).match(/^(LOOM|FOLD|DRIFT|CHOIR) \/ (QUIET|KINETIC|MYSTERIOUS)$/);
    return match ? `${legacyGameNames[match[1]]} / ${legacyGameNames[match[2]]}` : String(value);
  }

  const ui = {
    app: $(".playlab-app", dialog),
    close: $(".playlab-close", dialog),
    mode: $("#playlab-mode", dialog),
    builder: $("#playlab-builder", dialog),
    runner: $("#playlab-runner", dialog),
    engineRail: $("#playlab-engine-rail", dialog),
    presetRail: $("#playlab-preset-rail", dialog),
    dnaFields: $("#playlab-dna-fields", dialog),
    advanced: $("#playlab-advanced", dialog),
    advancedToggle: $("#playlab-advanced-toggle", dialog),
    previewCanvas: $("#playlab-preview-canvas", dialog),
    previewName: $("#playlab-preview-name", dialog),
    previewMeta: $("#playlab-preview-meta", dialog),
    previewPrompt: $("#playlab-preview-prompt", dialog),
    buildName: $("#playlab-build-name", dialog),
    creatorName: $("#playlab-creator-name", dialog),
    create: $("#playlab-create", dialog),
    guidedOpen: $("#playlab-guided-open", dialog),
    wizard: $("#playlab-wizard", dialog),
    wizardClose: $("#playlab-wizard-close", dialog),
    wizardStep: $("#playlab-wizard-step", dialog),
    wizardIndex: $("#playlab-wizard-index", dialog),
    wizardTotal: $("#playlab-wizard-total", dialog),
    wizardProgress: $("#playlab-wizard-progress", dialog),
    wizardBack: $("#playlab-wizard-back", dialog),
    wizardNext: $("#playlab-wizard-next", dialog),
    runnerCanvas: $("#playlab-canvas", dialog),
    runnerEngine: $("#playlab-hud-engine", dialog),
    runnerScore: $("#playlab-hud-score", dialog),
    runnerLevel: $("#playlab-hud-level", dialog),
    runnerSignal: $("#playlab-hud-signal", dialog),
    runnerProgress: $("#playlab-run-progress", dialog),
    runnerStatus: $("#playlab-status", dialog),
    intro: $("#playlab-intro", dialog),
    introIndex: $("#playlab-intro-index", dialog),
    introTitle: $("#playlab-intro-title", dialog),
    introCopy: $("#playlab-intro-copy", dialog),
    introGesture: $("#playlab-intro-gesture", dialog),
    start: $("#playlab-start", dialog),
    pause: $("#playlab-pause", dialog),
    pausePanel: $("#playlab-pause-panel", dialog),
    resume: $("#playlab-resume", dialog),
    restart: $("#playlab-restart", dialog),
    edit: $$("[data-playlab-edit]", dialog),
    result: $("#playlab-result", dialog),
    resultTitle: $("#playlab-result-title", dialog),
    resultCopy: $("#playlab-result-copy", dialog),
    resultScore: $("#playlab-result-score", dialog),
    resultAgain: $("#playlab-result-again", dialog),
    touchDock: $("#playlab-touch-dock", dialog),
    toast: $("#playlab-toast", dialog),
  };

  const saved = readSaved();
  const state = {
    engine: dna.engines[saved?.engine] ? saved.engine : "loom",
    values: {},
    name: localiseSavedName(saved?.name),
    creator: saved?.creator && saved.creator !== "F/AI MAKER" ? saved.creator : "CREATORE F/AI",
    mood: saved?.mood || "kinetic",
    audience: saved?.audience || "curious",
    reducedMotion: saved?.reducedMotion ?? reduceMotionQuery.matches,
    preset: saved?.preset || "balanced",
    view: "builder",
    advanced: false,
    wizardIndex: 0,
    previewEngine: null,
    gameEngine: null,
    previewObserver: null,
    previewVisibilityObserver: null,
    gameObserver: null,
    previewTimer: 0,
    toastTimer: 0,
    gameStarted: false,
    lastGameState: null,
    longPressTimer: 0,
    repeatTimer: 0,
    hudTimer: 0,
  };
  state.values = dna.normalise(state.engine, saved?.values || {});

  const metaModules = [
    {
      key: "mood",
      label: "ATMOSFERA DEL GIOCO",
      question: "Che sensazione deve lasciare?",
      help: "Serve a dare un’identità coerente al tuo gioco.",
      options: [
        { value: "quiet", label: "IPNOTICA", meta: "CALMA / PROFONDA" },
        { value: "kinetic", label: "CINETICA", meta: "VIVA / DIRETTA" },
        { value: "mysterious", label: "ENIGMATICA", meta: "SCOPERTA / STRANA" },
      ],
    },
    {
      key: "audience",
      label: "PER CHI È",
      question: "Chi vuoi far entrare nel sistema?",
      help: "Modula il tono della presentazione, non il punteggio.",
      options: [
        { value: "curious", label: "CURIOSI", meta: "IMMEDIATO" },
        { value: "players", label: "ESPLORATORI", meta: "PIÙ PROFONDO" },
        { value: "teams", label: "GRUPPI CREATIVI", meta: "DA MOSTRARE" },
      ],
    },
    {
      key: "reducedMotion",
      label: "MOVIMENTO DELLO SFONDO",
      question: "Quanto movimento ambientale vuoi?",
      help: "La modalità ridotta mantiene le meccaniche ma limita pulsazioni e particelle.",
      options: [
        { value: true, label: "RIDOTTO", meta: "MOVIMENTO LEGGERO" },
        { value: false, label: "IMMERSIVO", meta: "EFFETTI COMPLETI" },
      ],
    },
  ];

  function readSaved() {
    try { return JSON.parse(localStorage.getItem(storageKey) || "null"); }
    catch (_) { return null; }
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        engine: state.engine,
        values: state.values,
        name: state.name,
        creator: state.creator,
        mood: state.mood,
        audience: state.audience,
        reducedMotion: state.reducedMotion,
        preset: state.preset,
      }));
    } catch (_) { /* local persistence is optional */ }
  }

  function escapeText(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function selectedOption(module, value) {
    return module.options.find(option => option.value === value) || module.options[0];
  }

  function renderEngineRail() {
    ui.engineRail.innerHTML = Object.entries(dna.engines).map(([id, engine]) => `
      <button class="playlab-engine-card tap${id === state.engine ? " active" : ""}" type="button" data-engine="${id}" aria-pressed="${id === state.engine}">
        <span>${engine.index} / GIOCO</span>
        <i aria-hidden="true">${engine.glyph}</i>
        <b>${engine.name}</b>
        <small>${engine.subtitle}</small>
      </button>
    `).join("");
    requestAnimationFrame(() => {
      ui.engineRail.querySelector(".playlab-engine-card.active")?.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: state.reducedMotion ? "auto" : "smooth",
      });
    });
  }

  function renderPresetRail() {
    const current = dna.presets[state.engine] || [];
    const custom = state.preset === "custom" ? [`<button type="button" class="playlab-chip active" aria-pressed="true" disabled>PERSONALIZZATO ✓</button>`] : [];
    ui.presetRail.innerHTML = [
      `<button type="button" class="playlab-chip tap${state.preset === "balanced" ? " active" : ""}" data-preset="balanced" aria-pressed="${state.preset === "balanced"}">EQUILIBRATO</button>`,
      ...current.map(preset => `<button type="button" class="playlab-chip tap${state.preset === preset.id ? " active" : ""}" data-preset="${preset.id}" aria-pressed="${state.preset === preset.id}">${preset.label}</button>`),
      `<button type="button" class="playlab-chip tap${state.preset === "random" ? " active" : ""}" data-preset="random" aria-pressed="${state.preset === "random"}">SORPRENDIMI ✦</button>`,
      ...custom,
    ].join("");
    requestAnimationFrame(() => {
      ui.presetRail.querySelector(".playlab-chip.active")?.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: state.reducedMotion ? "auto" : "smooth",
      });
    });
  }

  function moduleMarkup(module, compact) {
    const current = state.values[module.key];
    return `
      <fieldset class="playlab-field${compact ? " playlab-field--compact" : ""}" data-module="${module.key}">
        <legend><span>${module.label}</span>${module.help ? `<small>${module.help}</small>` : ""}</legend>
        <div class="playlab-options">
          ${module.options.map(option => `
            <button class="tap${option.value === current ? " active" : ""}" type="button" data-setting="${module.key}" data-value="${escapeText(JSON.stringify(option.value))}" aria-pressed="${option.value === current}">
              <b>${option.label}</b><small>${option.meta || ""}</small>
            </button>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function renderFields() {
    ui.dnaFields.innerHTML = dna.modulesFor(state.engine).map(module => moduleMarkup(module, false)).join("");
    ui.advanced.innerHTML = dna.universalModules.map(module => moduleMarkup(module, true)).join("");
    ui.advanced.hidden = !state.advanced;
    ui.advancedToggle.setAttribute("aria-expanded", String(state.advanced));
    ui.advancedToggle.querySelector("span").textContent = state.advanced ? "CHIUDI REGIA AVANZATA" : "APRI REGIA AVANZATA";
    ui.advancedToggle.querySelector("i").textContent = state.advanced ? "−" : "＋";
  }

  function renderPreviewCopy() {
    const engine = dna.engines[state.engine];
    ui.previewName.textContent = state.name || `${engine.name} / GIOCO`;
    ui.previewMeta.textContent = `${engine.name} / ${engine.subtitle}`;
    ui.previewPrompt.textContent = engine.gesture;
    ui.buildName.value = state.name;
    ui.creatorName.value = state.creator;
    ui.app.dataset.palette = state.values.palette || "aurora";
    ui.app.dataset.engine = state.engine;
    ui.app.dataset.motion = state.reducedMotion ? "reduced" : "full";
  }

  function renderBuilder(options = {}) {
    const keepPreview = options.keepPreview;
    renderEngineRail();
    renderPresetRail();
    renderFields();
    renderPreviewCopy();
    if (!keepPreview) schedulePreview();
    if (options.focusSelector) {
      requestAnimationFrame(() => $(options.focusSelector, ui.builder)?.focus({ preventScroll: true }));
    }
  }

  function chooseEngine(engineId, shouldRender = true) {
    if (!dna.engines[engineId] || engineId === state.engine) return;
    state.engine = engineId;
    state.values = dna.defaultsFor(engineId);
    state.preset = "balanced";
    state.name = `${dna.engines[engineId].name} / ${selectedOption(metaModules[0], state.mood).label}`;
    save();
    if (shouldRender) renderBuilder({ focusSelector: `[data-engine="${engineId}"]` });
    toast(`${dna.engines[engineId].name} / GIOCO PRONTO`);
  }

  function setValue(key, rawValue, shouldRender = true) {
    const modules = [...dna.modulesFor(state.engine), ...dna.universalModules];
    const module = modules.find(item => item.key === key);
    if (!module) return;
    const value = module.options.find(option => JSON.stringify(option.value) === rawValue)?.value;
    if (value === undefined) return;
    state.values[key] = value;
    state.preset = "custom";
    save();
    if (shouldRender) {
      $$(`[data-setting="${key}"]`, ui.builder).forEach(button => {
        const active = button.dataset.value === JSON.stringify(value);
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      renderPresetRail();
      renderPreviewCopy();
      schedulePreview();
    }
  }

  function applyPreset(presetId) {
    if (presetId === "balanced") {
      state.values = dna.defaultsFor(state.engine);
    } else if (presetId === "random") {
      const randomValues = dna.defaultsFor(state.engine);
      [...dna.modulesFor(state.engine), ...dna.universalModules].forEach(module => {
        const option = module.options[Math.floor(Math.random() * module.options.length)];
        randomValues[module.key] = option.value;
      });
      state.values = randomValues;
    } else {
      const preset = (dna.presets[state.engine] || []).find(item => item.id === presetId);
      if (!preset) return;
      state.values = { ...dna.defaultsFor(state.engine), ...preset.values };
    }
    state.preset = presetId;
    save();
    renderBuilder({ focusSelector: `[data-preset="${presetId}"]` });
    toast("REGOLE AGGIORNATE / ANTEPRIMA PRONTA");
  }

  function engineConfig() {
    const config = {
      ...state.values,
      seed: `${state.engine}:${state.name}:${state.creator}`,
      reducedMotion: state.reducedMotion || state.values.feedback === "calm",
      reduceMotion: state.reducedMotion || state.values.feedback === "calm",
      externalHud: true,
    };
    if (state.engine === "loom") {
      config.duration = { quick: 45, standard: 90, deep: 180 }[state.values.session] || 90;
      config.sequenceLength = 4 + Number(state.values.intensity || 2) * 2;
    }
    if (state.engine === "drift") {
      config.palette = { acid: "ember", aurora: "nocturne", mono: "mineral" }[state.values.palette] || "nocturne";
    }
    return config;
  }

  function getFactory(engineId) {
    const factory = globalThis.FAIPlaylab?.[factories[engineId]];
    return typeof factory === "function" ? factory : null;
  }

  function destroyPreview() {
    clearTimeout(state.previewTimer);
    if (state.previewEngine) state.previewEngine.destroy();
    state.previewEngine = null;
    if (state.previewObserver) state.previewObserver.disconnect();
    state.previewObserver = null;
    if (state.previewVisibilityObserver) state.previewVisibilityObserver.disconnect();
    state.previewVisibilityObserver = null;
  }

  function schedulePreview() {
    clearTimeout(state.previewTimer);
    state.previewTimer = setTimeout(buildPreview, 90);
  }

  function buildPreview() {
    destroyPreview();
    if (state.view !== "builder" || !dialog.open) return;
    const factory = getFactory(state.engine);
    if (!factory) {
      ui.previewPrompt.textContent = "IL GIOCO NON È PRONTO · RICARICA LA PAGINA";
      return;
    }
    try {
      state.previewEngine = factory({
        canvas: ui.previewCanvas,
        config: { ...engineConfig(), intensity: 1, reducedMotion: true },
        onEvent(type) {
          if ((type === "win" || type === "gameover") && state.previewEngine) {
            setTimeout(() => state.previewEngine?.restart(), 320);
          }
        },
      });
      // L'anteprima è una tela: il gesto resta al gioco finché il dito è sul canvas.
      ui.previewCanvas.style.touchAction = "none";
      state.previewEngine.resize();
      state.previewEngine.start();
      state.previewObserver = new ResizeObserver(() => state.previewEngine?.resize());
      state.previewObserver.observe(ui.previewCanvas);
      state.previewVisibilityObserver = new IntersectionObserver(entries => {
        const active = entries.some(entry => entry.isIntersecting && entry.intersectionRatio > .05);
        if (!state.previewEngine) return;
        if (active) state.previewEngine.resume?.();
        else state.previewEngine.pause?.();
      }, { threshold: [0, .05, .35] });
      state.previewVisibilityObserver.observe(ui.previewCanvas);
    } catch (error) {
      console.error(error);
      ui.previewPrompt.textContent = "ANTEPRIMA NON DISPONIBILE · RIPROVA";
    }
  }

  function destroyGame() {
    clearInterval(state.hudTimer);
    state.hudTimer = 0;
    if (state.gameEngine) state.gameEngine.destroy();
    state.gameEngine = null;
    if (state.gameObserver) state.gameObserver.disconnect();
    state.gameObserver = null;
    state.gameStarted = false;
  }

  function resetHud() {
    const engine = dna.engines[state.engine];
    ui.runnerEngine.textContent = engine.name;
    ui.runnerScore.textContent = "00000";
    ui.runnerLevel.textContent = "01";
    ui.runnerSignal.textContent = "100";
    ui.runnerProgress.style.setProperty("--progress", "0%");
    ui.runnerStatus.textContent = engine.promise.toUpperCase();
  }

  function updateHud(payload) {
    if (!payload || typeof payload !== "object") return;
    state.lastGameState = payload;
    const score = Number(payload.score || 0);
    ui.runnerScore.textContent = String(Math.max(0, Math.round(score))).padStart(5, "0");
    const derivedLevel = payload.level ?? payload.constellation ?? (payload.completions != null ? payload.completions + 1 : 1);
    ui.runnerLevel.textContent = String(Math.max(1, Math.round(Number(derivedLevel || 1)))).padStart(2, "0");
    let signalValue = payload.energy ?? payload.signal;
    if (signalValue == null && payload.entropy != null) signalValue = (1 - Number(payload.entropy)) * 100;
    if (signalValue == null) signalValue = payload.stability ?? payload.coherence ?? payload.harmony ?? payload.resonance ?? 1;
    if (Number(signalValue) <= 1) signalValue = Number(signalValue) * 100;
    ui.runnerSignal.textContent = String(Math.max(0, Math.min(100, Math.round(Number(signalValue) || 0))));
    let progressValue = payload.progress;
    if (progressValue == null && payload.goal) progressValue = Number(payload.completions || 0) / Number(payload.goal);
    if (progressValue == null && payload.targetChords) progressValue = Number(payload.lockedChords || 0) / Number(payload.targetChords);
    if (progressValue == null && payload.constellation != null) progressValue = (Math.max(0, Number(payload.constellation) - 1) + Number(payload.constellationCharge || 0) / 100) / 4;
    if (progressValue == null && payload.stability != null) progressValue = Number(payload.stability);
    const progress = Math.max(0, Math.min(1, Number(progressValue || 0)));
    ui.runnerProgress.style.setProperty("--progress", `${Math.round(progress * 100)}%`);
    if (payload.message) ui.runnerStatus.textContent = String(payload.message).toUpperCase();
  }

  function gameEvent(type, payload) {
    const fullState = state.gameEngine?.getState?.() || {};
    const merged = { ...fullState, ...(payload || {}) };
    updateHud(merged);
    if (["score", "chord", "phase", "formation", "fold"].includes(type) && state.values.feedback === "haptic" && navigator.vibrate) navigator.vibrate(type === "score" ? 18 : 10);
    if (type === "win" || type === "complete") showResult(true, merged);
    else if (type === "gameover" || type === "over") showResult(false, merged);
  }

  function beginHudLoop() {
    clearInterval(state.hudTimer);
    if (!state.gameEngine || !state.gameStarted) return;
    updateHud(state.gameEngine.getState?.());
    state.hudTimer = setInterval(() => {
      if (state.gameEngine && state.gameStarted && ui.pausePanel.hidden) updateHud(state.gameEngine.getState?.());
    }, 100);
  }

  function buildGame() {
    destroyPreview();
    destroyGame();
    const factory = getFactory(state.engine);
    if (!factory) {
      toast("GIOCO NON PRONTO · RICARICA LA PAGINA");
      return false;
    }
    try {
      state.gameEngine = factory({ canvas: ui.runnerCanvas, config: engineConfig(), onEvent: gameEvent });
      state.gameEngine.resize();
      state.gameObserver = new ResizeObserver(() => state.gameEngine?.resize());
      state.gameObserver.observe(ui.runnerCanvas);
      return true;
    } catch (error) {
      console.error(error);
      toast("QUALCOSA NON HA FUNZIONATO · RIPROVA");
      return false;
    }
  }

  function openRunner() {
    clearTimeout(state.toastTimer);
    ui.toast.hidden = true;
    state.name = ui.buildName.value.trim().slice(0, 32) || `${dna.engines[state.engine].name} / GIOCO`;
    state.creator = ui.creatorName.value.trim().slice(0, 32) || "CREATORE F/AI";
    save();
    state.view = "runner";
    ui.app.dataset.view = "runner";
    ui.builder.hidden = true;
    ui.builder.inert = true;
    ui.runner.hidden = false;
    ui.runner.inert = false;
    ui.mode.textContent = "GIOCA / GIOCO ORIGINALE";
    ui.intro.hidden = false;
    ui.pausePanel.hidden = true;
    ui.result.hidden = true;
    setStageInteractive(false);
    ui.pause.setAttribute("aria-pressed", "false");
    ui.pause.textContent = "Ⅱ";
    ui.pause.setAttribute("aria-label", "Metti in pausa");
    const engine = dna.engines[state.engine];
    ui.introIndex.textContent = `${engine.index} / ${engine.subtitle}`;
    ui.introTitle.textContent = state.name;
    ui.introCopy.textContent = engine.promise;
    ui.introGesture.textContent = engine.gesture;
    ui.touchDock.dataset.controls = state.values.controls || "hybrid";
    resetHud();
    requestAnimationFrame(() => {
      if (buildGame()) ui.start.focus({ preventScroll: true });
    });
  }

  function setStageInteractive(interactive) {
    ui.runnerCanvas.inert = !interactive;
    ui.touchDock.inert = !interactive;
    ui.pause.inert = !interactive;
  }

  function startGame() {
    if (!state.gameEngine && !buildGame()) return;
    ui.intro.hidden = true;
    ui.pausePanel.hidden = true;
    ui.result.hidden = true;
    setStageInteractive(true);
    state.gameStarted = true;
    state.gameEngine.start();
    beginHudLoop();
    ui.pause.textContent = "Ⅱ";
    ui.pause.setAttribute("aria-label", "Metti in pausa");
    ui.runnerCanvas.focus({ preventScroll: true });
    ui.runnerStatus.textContent = dna.engines[state.engine].gesture;
  }

  function pauseGame() {
    if (!state.gameEngine || !state.gameStarted || !ui.pausePanel.hidden) return;
    state.gameEngine.pause();
    clearInterval(state.hudTimer);
    state.hudTimer = 0;
    ui.pausePanel.hidden = false;
    setStageInteractive(false);
    ui.pause.setAttribute("aria-pressed", "true");
    ui.pause.textContent = "▶";
    ui.pause.setAttribute("aria-label", "Riprendi il gioco");
    ui.resume.focus({ preventScroll: true });
  }

  function resumeGame() {
    if (!state.gameEngine) return;
    ui.pausePanel.hidden = true;
    setStageInteractive(true);
    ui.pause.setAttribute("aria-pressed", "false");
    ui.pause.textContent = "Ⅱ";
    ui.pause.setAttribute("aria-label", "Metti in pausa");
    state.gameEngine.resume();
    beginHudLoop();
    ui.runnerCanvas.focus({ preventScroll: true });
  }

  function restartGame() {
    if (!state.gameEngine) return;
    ui.intro.hidden = true;
    ui.pausePanel.hidden = true;
    ui.result.hidden = true;
    setStageInteractive(true);
    ui.pause.setAttribute("aria-pressed", "false");
    ui.pause.textContent = "Ⅱ";
    ui.pause.setAttribute("aria-label", "Metti in pausa");
    state.gameStarted = true;
    state.gameEngine.restart();
    beginHudLoop();
    ui.runnerCanvas.focus({ preventScroll: true });
  }

  function showResult(won, payload) {
    state.gameStarted = false;
    clearInterval(state.hudTimer);
    state.hudTimer = 0;
    updateHud(payload);
    ui.pausePanel.hidden = true;
    ui.result.hidden = false;
    setStageInteractive(false);
    ui.pause.setAttribute("aria-pressed", "false");
    ui.resultTitle.textContent = won ? "OBIETTIVO RAGGIUNTO." : "QUASI! RIPROVA.";
    ui.resultCopy.textContent = won ? "Hai creato il tuo gioco e completato la sfida." : "Puoi cambiare le regole oppure riprovare subito.";
    ui.resultScore.textContent = ui.runnerScore.textContent;
    ui.resultAgain.focus({ preventScroll: true });
  }

  function editBuild() {
    destroyGame();
    state.view = "builder";
    ui.app.dataset.view = "builder";
    ui.builder.hidden = false;
    ui.builder.inert = false;
    ui.runner.hidden = true;
    ui.runner.inert = true;
    ui.mode.textContent = "CREAZIONE / REGOLE ATTIVE";
    renderBuilder();
    ui.create.focus({ preventScroll: true });
  }

  function toast(message) {
    clearTimeout(state.toastTimer);
    ui.toast.textContent = message;
    ui.toast.hidden = false;
    state.toastTimer = setTimeout(() => { ui.toast.hidden = true; }, 1800);
  }

  function wizardSteps() {
    return [
      { type: "engine", label: "TIPO DI GIOCO", question: "Da quale comportamento vuoi partire?", help: "Qui non scegli soltanto l’aspetto: scegli una regola di gioco originale." },
      ...dna.modulesFor(state.engine).map(module => ({ type: "module", module })),
      ...dna.universalModules.map(module => ({ type: "module", module })),
      ...metaModules.map(module => ({ type: "meta", module })),
      { type: "text", key: "name", label: "NOME", question: "Come si chiama questo gioco?", help: "Un nome breve lo rende facile da ricordare." },
      { type: "text", key: "creator", label: "FIRMA", question: "Chi l’ha progettata?", help: "La firma resta soltanto su questo dispositivo." },
    ];
  }

  function valueForStep(step) {
    if (step.type === "module") return state.values[step.module.key];
    if (step.type === "meta") return state[step.module.key];
    if (step.type === "text") return state[step.key];
    return state.engine;
  }

  function renderWizard(options = {}) {
    const steps = wizardSteps();
    state.wizardIndex = Math.max(0, Math.min(state.wizardIndex, steps.length - 1));
    const step = steps[state.wizardIndex];
    const isLast = state.wizardIndex === steps.length - 1;
    ui.wizardIndex.textContent = String(state.wizardIndex + 1).padStart(2, "0");
    ui.wizardTotal.textContent = String(steps.length).padStart(2, "0");
    ui.wizardProgress.style.setProperty("--progress", `${(state.wizardIndex + 1) / steps.length * 100}%`);
    ui.wizardBack.disabled = state.wizardIndex === 0;
    ui.wizardNext.querySelector("span").textContent = isLast ? "CREA E GIOCA" : "CONTINUA";

    if (step.type === "engine") {
      ui.wizardStep.innerHTML = `
        <span>${step.label}</span><h3 tabindex="-1">${step.question}</h3><p>${step.help}</p>
        <div class="wizard-engine-grid">${Object.entries(dna.engines).map(([id, engine]) => `
          <button type="button" class="tap${state.engine === id ? " active" : ""}" data-wizard-engine="${id}" aria-pressed="${state.engine === id}">
            <i>${engine.glyph}</i><b>${engine.name}</b><small>${engine.subtitle}</small>
          </button>`).join("")}</div>`;
    } else if (step.type === "module" || step.type === "meta") {
      const module = step.module;
      const current = valueForStep(step);
      ui.wizardStep.innerHTML = `
        <span>${module.label}</span><h3 tabindex="-1">${module.question}</h3><p>${module.help || "La scelta aggiorna subito il comportamento del gioco."}</p>
        <div class="wizard-option-grid">${module.options.map(option => `
          <button type="button" class="tap${option.value === current ? " active" : ""}" data-wizard-setting="${module.key}" data-wizard-value="${escapeText(JSON.stringify(option.value))}" aria-pressed="${option.value === current}">
            <b>${option.label}</b><small>${option.meta || ""}</small>
          </button>`).join("")}</div>`;
    } else {
      const value = valueForStep(step);
      ui.wizardStep.innerHTML = `
        <span>${step.label}</span><h3 tabindex="-1">${step.question}</h3><p>${step.help}</p>
        <label class="wizard-text"><span>${step.label}</span><input type="text" maxlength="32" data-wizard-text="${step.key}" value="${escapeText(value)}" autocomplete="off" /></label>`;
    }

    requestAnimationFrame(() => {
      let target = null;
      if (options.focusEngine) {
        target = $$('[data-wizard-engine]', ui.wizardStep)
          .find(button => button.dataset.wizardEngine === options.focusEngine);
      } else if (options.focusSetting) {
        target = $$('[data-wizard-setting]', ui.wizardStep).find(button => (
          button.dataset.wizardSetting === options.focusSetting.key
          && button.dataset.wizardValue === options.focusSetting.value
        ));
      } else if (options.focusHeading) {
        target = $("h3", ui.wizardStep);
      } else if (step.type === "text") {
        target = $("input", ui.wizardStep);
      }
      if (!target) return;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "nearest" });
    });
  }

  function openWizard() {
    state.wizardIndex = 0;
    ui.builder.inert = true;
    ui.wizard.hidden = false;
    ui.wizard.inert = false;
    ui.wizard.setAttribute("aria-hidden", "false");
    renderWizard();
    ui.wizardClose.focus({ preventScroll: true });
  }

  function closeWizard() {
    ui.wizard.hidden = true;
    ui.wizard.inert = true;
    ui.wizard.setAttribute("aria-hidden", "true");
    ui.builder.inert = false;
    renderBuilder();
    ui.guidedOpen.focus({ preventScroll: true });
  }

  function nextWizard() {
    const steps = wizardSteps();
    if (state.wizardIndex >= steps.length - 1) {
      closeWizard();
      openRunner();
      return;
    }
    state.wizardIndex += 1;
    renderWizard({ focusHeading: true });
  }

  function openDialog() {
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
    document.body.classList.add("playlab-open");
    state.view = "builder";
    ui.app.dataset.view = "builder";
    ui.builder.hidden = false;
    ui.builder.inert = false;
    ui.runner.hidden = true;
    ui.runner.inert = true;
    ui.wizard.hidden = true;
    ui.wizard.inert = true;
    renderBuilder();
    requestAnimationFrame(() => ui.close.focus({ preventScroll: true }));
  }

  function closeDialog() {
    destroyPreview();
    destroyGame();
    clearRepeat();
    document.body.classList.remove("playlab-open");
    if (dialog.open && typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open");
    openButton.focus({ preventScroll: true });
  }

  function controlInput(command) {
    if (!state.gameEngine || !state.gameStarted) return;
    if (command === "action" && state.engine === "loom") {
      state.gameEngine.input({ type: "tap", x: 0.5, y: 0.5, normalized: true });
    } else if (command === "action" && state.engine === "drift") {
      state.gameEngine.input({ type: "stroke", from: { x: 0.32, y: 0.72 }, to: { x: 0.68, y: 0.46 } });
    } else {
      state.gameEngine.input(command);
    }
  }

  function previewControlInput(command) {
    if (!state.previewEngine) return;
    if (command === "action" && state.engine === "loom") {
      state.previewEngine.input({ type: "tap", x: 0.5, y: 0.5, normalized: true });
    } else if (command === "action" && state.engine === "drift") {
      state.previewEngine.input({ type: "stroke", from: { x: 0.32, y: 0.72 }, to: { x: 0.68, y: 0.46 } });
    } else {
      state.previewEngine.input(command);
    }
  }

  function beginRepeat(command) {
    clearRepeat();
    controlInput(command);
    state.longPressTimer = setTimeout(() => {
      state.repeatTimer = setInterval(() => controlInput(command), 88);
    }, 260);
  }

  function clearRepeat() {
    clearTimeout(state.longPressTimer);
    clearInterval(state.repeatTimer);
    state.longPressTimer = 0;
    state.repeatTimer = 0;
  }

  openButton.addEventListener("click", openDialog);
  ui.close.addEventListener("click", closeDialog);
  ui.create.addEventListener("click", openRunner);
  ui.guidedOpen.addEventListener("click", openWizard);
  ui.wizardClose.addEventListener("click", closeWizard);
  ui.wizardBack.addEventListener("click", () => { state.wizardIndex -= 1; renderWizard({ focusHeading: true }); });
  ui.wizardNext.addEventListener("click", nextWizard);
  ui.advancedToggle.addEventListener("click", () => { state.advanced = !state.advanced; renderFields(); });
  ui.start.addEventListener("click", startGame);
  ui.pause.addEventListener("click", () => ui.pausePanel.hidden ? pauseGame() : resumeGame());
  ui.resume.addEventListener("click", resumeGame);
  ui.restart.addEventListener("click", restartGame);
  ui.resultAgain.addEventListener("click", restartGame);
  ui.edit.forEach(button => button.addEventListener("click", editBuild));

  ui.engineRail.addEventListener("click", event => {
    const button = event.target.closest("[data-engine]");
    if (button) chooseEngine(button.dataset.engine);
  });
  ui.presetRail.addEventListener("click", event => {
    const button = event.target.closest("[data-preset]");
    if (button) applyPreset(button.dataset.preset);
  });
  ui.builder.addEventListener("click", event => {
    const button = event.target.closest("[data-setting]");
    if (button) setValue(button.dataset.setting, button.dataset.value);
  });
  ui.buildName.addEventListener("input", () => { state.name = ui.buildName.value.slice(0, 32); ui.previewName.textContent = state.name || `${dna.engines[state.engine].name} / GIOCO`; save(); });
  ui.creatorName.addEventListener("input", () => { state.creator = ui.creatorName.value.slice(0, 32); save(); });

  ui.wizardStep.addEventListener("click", event => {
    const engineButton = event.target.closest("[data-wizard-engine]");
    if (engineButton) {
      chooseEngine(engineButton.dataset.wizardEngine, false);
      renderWizard({ focusEngine: engineButton.dataset.wizardEngine });
      return;
    }
    const settingButton = event.target.closest("[data-wizard-setting]");
    if (!settingButton) return;
    const key = settingButton.dataset.wizardSetting;
    const metaModule = metaModules.find(module => module.key === key);
    if (metaModule) {
      const option = metaModule.options.find(item => JSON.stringify(item.value) === settingButton.dataset.wizardValue);
      if (option) state[key] = option.value;
      save();
      renderWizard({ focusSetting: { key, value: settingButton.dataset.wizardValue } });
    } else {
      setValue(key, settingButton.dataset.wizardValue, false);
      renderWizard({ focusSetting: { key, value: settingButton.dataset.wizardValue } });
    }
  });
  ui.wizardStep.addEventListener("input", event => {
    const input = event.target.closest("[data-wizard-text]");
    if (!input) return;
    state[input.dataset.wizardText] = input.value.slice(0, 32);
    save();
  });

  $$("[data-control]", ui.touchDock).forEach(button => {
    const command = button.dataset.control;
    if (["left", "right", "up", "down"].includes(command)) {
      button.addEventListener("pointerdown", event => {
        event.preventDefault();
        button.classList.add("is-pressed");
        button.setPointerCapture?.(event.pointerId);
        if (state.values.feedback === "haptic" && navigator.vibrate) navigator.vibrate(8);
        beginRepeat(command);
      });
      const release = event => {
        button.classList.remove("is-pressed");
        if (event?.pointerId != null && button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
        clearRepeat();
      };
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", () => { button.classList.remove("is-pressed"); clearRepeat(); });
    } else {
      button.addEventListener("click", () => controlInput(command));
    }
  });

  ui.runnerCanvas.addEventListener("keydown", event => {
    const map = {
      ArrowLeft: "left", a: "left", A: "left",
      ArrowRight: "right", d: "right", D: "right",
      ArrowUp: "up", w: "up", W: "up",
      ArrowDown: "down", s: "down", S: "down",
      " ": "action", Enter: "action", z: "action", Z: "action", x: "alt", X: "alt",
    };
    if (map[event.key]) {
      event.preventDefault();
      controlInput(map[event.key]);
    } else if (event.key === "p" || event.key === "P" || event.key === "Escape") {
      event.preventDefault();
      ui.pausePanel.hidden ? pauseGame() : resumeGame();
    }
  });

  ui.previewCanvas.addEventListener("keydown", event => {
    const map = {
      ArrowLeft: "left", a: "left", A: "left",
      ArrowRight: "right", d: "right", D: "right",
      ArrowUp: "up", w: "up", W: "up",
      ArrowDown: "down", s: "down", S: "down",
      " ": "action", Enter: "action", z: "action", Z: "action", x: "alt", X: "alt",
    };
    if (!map[event.key]) return;
    event.preventDefault();
    previewControlInput(map[event.key]);
  });

  dialog.addEventListener("keydown", event => {
    if (event.key !== "Tab" || !dialog.open) return;
    const focusable = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', dialog)
      .filter(element => !element.closest("[hidden], [inert]") && element.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    if (!ui.wizard.hidden) closeWizard();
    else if (state.view === "runner" && state.gameStarted) ui.pausePanel.hidden ? pauseGame() : closeDialog();
    else closeDialog();
  });
  dialog.addEventListener("close", () => {
    destroyPreview();
    destroyGame();
    document.body.classList.remove("playlab-open");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && dialog.open && state.view === "runner" && state.gameStarted) pauseGame();
  });
  reduceMotionQuery.addEventListener?.("change", event => {
    if (saved?.reducedMotion == null) state.reducedMotion = event.matches;
  });

})();
