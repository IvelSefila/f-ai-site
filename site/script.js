(() => {
  "use strict";

  const $ = (selector, scope = document) => scope?.querySelector?.(selector) || null;
  const $$ = (selector, scope = document) => scope?.querySelectorAll
    ? Array.from(scope.querySelectorAll(selector))
    : [];
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scrollBehaviour = () => reducedMotionQuery.matches ? "auto" : "smooth";

  const setInert = (element, value) => {
    if (element) element.inert = Boolean(value);
  };

  requestAnimationFrame(() => document.body?.classList.add("loaded"));

  // Rimuove in modo difensivo i residui della precedente hero: nessun cursore
  // personalizzato e nessun canvas ambientale fanno parte dell'esperienza finale.
  $$(".cursor, #touch-field, .touch-hint").forEach(element => element.remove());

  // Barra superiore e avanzamento pagina.
  const topbar = $(".topbar");
  const pageProgress = $(".page-progress i");
  let scrollFrame = 0;

  function renderScrollState() {
    scrollFrame = 0;
    const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(100, window.scrollY / maximum * 100));
    if (pageProgress) {
      pageProgress.style.width = `${progress}%`;
      pageProgress.style.setProperty("--progress", `${progress}%`);
    }
    topbar?.classList.toggle("scrolled", window.scrollY > 24);
  }

  function queueScrollState() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScrollState);
  }

  window.addEventListener("scroll", queueScrollState, { passive: true });
  window.addEventListener("resize", queueScrollState, { passive: true });
  renderScrollState();

  // Dock condiviso con il Playlab e gli altri pannelli a schermo intero.
  const mobileDock = $(".mobile-dock");
  const dockHiddenReasons = new Set();

  function setDockHidden(reason, hidden) {
    if (!mobileDock) return;
    const key = String(reason || "interface");
    if (hidden) dockHiddenReasons.add(key);
    else dockHiddenReasons.delete(key);
    const shouldHide = dockHiddenReasons.size > 0;
    mobileDock.classList.toggle("hidden", shouldHide);
    setInert(mobileDock, shouldHide);
    mobileDock.setAttribute("aria-hidden", String(shouldHide));
  }

  window.siteUI = Object.freeze({ setDockHidden });

  // Su mobile il dock resta disponibile all'inizio, poi libera la tela quando
  // l'utente scorre verso il basso e ricompare appena torna verso l'alto.
  let previousDockScrollY = window.scrollY;
  let dockScrollFrame = 0;

  function renderDockScrollState() {
    dockScrollFrame = 0;
    const currentY = window.scrollY;
    const delta = currentY - previousDockScrollY;
    const mobileLayout = window.matchMedia("(max-width: 899px)").matches;
    if (!mobileLayout || currentY < 120) {
      setDockHidden("scroll", false);
    } else if (delta > 8) {
      setDockHidden("scroll", true);
    } else if (delta < -8) {
      setDockHidden("scroll", false);
    }
    previousDockScrollY = currentY;
  }

  window.addEventListener("scroll", () => {
    if (!dockScrollFrame) dockScrollFrame = requestAnimationFrame(renderDockScrollState);
  }, { passive: true });
  window.addEventListener("resize", renderDockScrollState, { passive: true });

  // Menu accessibile con ritorno del focus e ciclo di tabulazione.
  const menuButton = $(".menu-trigger");
  const menu = $("#menu");
  const pageMain = $("main");
  const menuBackgroundControls = $$(".topbar a, .topbar button")
    .filter(element => element !== menuButton);
  let menuReturnFocus = null;

  function menuIsOpen() {
    return menuButton?.getAttribute("aria-expanded") === "true";
  }

  function menuFocusables() {
    if (!menu || !menuButton) return [];
    return [
      menuButton,
      ...$$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', menu)
        .filter(element => !element.hidden && !element.closest("[inert]")),
    ];
  }

  function setMenu(open, restoreFocus = true) {
    if (!menu || !menuButton) return;
    if (open) menuReturnFocus = document.activeElement;
    menuButton.setAttribute("aria-expanded", String(open));
    const label = $("span", menuButton);
    if (label) label.textContent = open ? "CHIUDI" : "MENU";
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", String(!open));
    setInert(menu, !open);
    setInert(pageMain, open);
    menuBackgroundControls.forEach(control => setInert(control, open));
    setDockHidden("menu", open);
    document.body?.classList.toggle("menu-open", open);
    window.dispatchEvent(new CustomEvent("site:menu", { detail: { open } }));

    if (open) {
      requestAnimationFrame(() => $("a[href]", menu)?.focus({ preventScroll: true }));
    } else if (restoreFocus && menuReturnFocus instanceof HTMLElement) {
      menuReturnFocus.focus({ preventScroll: true });
    }
  }

  menuButton?.addEventListener("click", () => setMenu(!menuIsOpen()));
  $$("a[href]", menu).forEach(link => {
    link.addEventListener("click", () => {
      const target = link.hash ? $(link.hash) : null;
      setMenu(false, false);
      if (target) {
        target.tabIndex = -1;
        requestAnimationFrame(() => target.focus({ preventScroll: true }));
      }
    });
  });

  document.addEventListener("keydown", event => {
    if (!menuIsOpen()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusables = menuFocusables();
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Entrate progressive: contenuto sempre visibile come fallback.
  const reveals = $$(".reveal");
  if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
    reveals.forEach(element => element.classList.add("in-view"));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
    reveals.forEach(element => revealObserver.observe(element));
  }

  // Stato della navigazione rapida mobile.
  const dockLinks = $$(".mobile-dock a[data-section]");
  const dockSectionMap = {
    home: "home",
    "live-cut": "lavori",
    lavori: "lavori",
    servizi: "servizi",
    metodo: "servizi",
    "ai-locale": "servizi",
    profilo: "servizi",
    brief: "brief",
    game: "game",
    contact: "brief",
  };

  function setActiveDock(section) {
    dockLinks.forEach(link => {
      const active = link.dataset.section === section;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  if (dockLinks.length && "IntersectionObserver" in window) {
    const dockObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveDock(dockSectionMap[visible[0].target.id]);
    }, { threshold: [0.08, 0.24, 0.5], rootMargin: "-18% 0px -55% 0px" });
    Object.keys(dockSectionMap)
      .map(id => document.getElementById(id))
      .filter(Boolean)
      .forEach(section => dockObserver.observe(section));
  }

  dockLinks.forEach(link => {
    link.addEventListener("click", () => setActiveDock(link.dataset.section));
  });

  // Feedback semantico coordinato: ambra per azioni, blu per selezioni,
  // pervinca per gli strumenti AI. Colore e icona cambiano a ogni tocco.
  const TAP_TONES = Object.freeze({
    action: { color: "#f1a457", icon: "↗" },
    selection: { color: "#6ea8ff", icon: "✓" },
    ai: { color: "#8f9cff", icon: "✦" },
  });
  const pressedPointers = new Map();

  function tapTone(element) {
    if (
      element.matches(".ai-mode, [data-service='ai']") ||
      element.closest(".ai-studio")
    ) return "ai";
    if (
      element.matches(".live-cut__marker, [aria-pressed='true'], [aria-selected='true'], .active") ||
      element.closest(".playlab-options, .playlab-engine-rail, .playlab-preset-rail")
    ) return "selection";
    return "action";
  }

  function applyTapTone(element) {
    const toneName = tapTone(element);
    const tone = TAP_TONES[toneName];
    element.dataset.tapTone = toneName;
    element.style.setProperty("--tap-flash", tone.color);
    return tone;
  }

  document.addEventListener("pointerdown", event => {
    const target = event.target instanceof Element ? event.target.closest(".tap") : null;
    if (!target) return;
    const tone = applyTapTone(target);
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "tap-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    ripple.style.color = tone.color;
    target.appendChild(ripple);
    target.classList.add("is-pressing");
    pressedPointers.set(event.pointerId, target);
    const removeRipple = () => ripple.remove();
    ripple.addEventListener("animationend", removeRipple, { once: true });
    window.setTimeout(removeRipple, 700);
  }, { passive: true });

  ["pointerup", "pointercancel"].forEach(type => {
    document.addEventListener(type, event => {
      const target = pressedPointers.get(event.pointerId);
      target?.classList.remove("is-pressing");
      pressedPointers.delete(event.pointerId);
    }, { passive: true });
  });

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target.closest(".tap") : null;
    if (!target) return;
    const tone = applyTapTone(target);
    target.classList.add("is-confirmed");
    const previous = $(".tap-feedback-icon", target);
    previous?.remove();
    const icon = document.createElement("span");
    icon.className = "tap-feedback-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = tone.icon;
    target.appendChild(icon);
    const cleanup = () => {
      icon.remove();
      target.classList.remove("is-confirmed");
    };
    icon.addEventListener("animationend", cleanup, { once: true });
    window.setTimeout(cleanup, 700);
  });

  // Control Room: cinque decisioni lungo una timeline continua.
  const liveCutRange = $("#live-cut-range");
  const liveCutTimecode = $("#live-cut-timecode");
  const liveCutStage = $("#live-cut-stage");
  const liveCutDecision = $("#live-cut-decision");
  const liveCutConsole = $(".live-cut__console");
  const liveCutVisual = $(".live-cut__visual");
  const liveCutMarkers = $$(".live-cut__marker");
  const liveCutStates = [
    {
      id: "brief",
      stage: "01 / BRIEF",
      name: "Brief",
      decision: "Definisco obiettivo, pubblico, canali e vincoli. L’AI non parte ancora.",
    },
    {
      id: "direction",
      stage: "02 / DIREZIONE",
      name: "Direzione",
      decision: "Costruisco concept, riferimenti, tono e ritmo. Decido quali parti richiedono lavoro tradizionale e quali possono beneficiare dell’AI.",
    },
    {
      id: "production",
      stage: "03 / PRODUZIONE",
      name: "Produzione",
      decision: "Creo, monto e genero solo ciò che serve. Ogni output entra in una sequenza progettata, non in una raccolta casuale di prove.",
    },
    {
      id: "control",
      stage: "04 / CONTROLLO",
      name: "Controllo",
      decision: "Seleziono, correggo e confronto. Coerenza, ritmo, leggibilità e qualità finale restano sotto supervisione umana.",
    },
    {
      id: "delivery",
      stage: "05 / CONSEGNA",
      name: "Consegna",
      decision: "Preparo versioni, formati e indicazioni d’uso: il risultato deve funzionare davvero nei canali previsti.",
    },
  ];
  let currentLiveCutState = -1;

  function liveCutTime(value) {
    const totalFrames = Math.round(Math.max(0, Math.min(100, value)) / 100 * 12 * 25);
    const seconds = Math.floor(totalFrames / 25);
    const frames = totalFrames % 25;
    return `00:00:${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
  }

  function renderLiveCut(rawValue, allowHaptic = false) {
    if (!liveCutRange) return;
    const value = Math.max(0, Math.min(100, Number(rawValue) || 0));
    const stateIndex = Math.max(0, Math.min(liveCutStates.length - 1, Math.round(value / 25)));
    const state = liveCutStates[stateIndex];
    const stateChanged = stateIndex !== currentLiveCutState;
    liveCutRange.value = String(value);
    liveCutRange.style.setProperty("--range", `${value}%`);
    liveCutConsole?.style.setProperty("--progress", `${value}%`);
    if (liveCutConsole) liveCutConsole.dataset.stage = state.id;
    if (liveCutVisual) {
      liveCutVisual.dataset.stage = state.id;
      liveCutVisual.style.setProperty("--cut-progress", `${value}%`);
      liveCutVisual.style.setProperty("--track-a", `${value * .06}px`);
      liveCutVisual.style.setProperty("--track-b", `${value * -.045}px`);
      liveCutVisual.style.setProperty("--track-c", `${value * .075}px`);
    }
    if (liveCutTimecode) liveCutTimecode.textContent = liveCutTime(value);
    if (stateChanged) {
      if (liveCutStage) liveCutStage.textContent = state.stage;
      if (liveCutDecision) liveCutDecision.textContent = state.decision;
    }
    liveCutRange.setAttribute("aria-valuetext", `Fase ${stateIndex + 1} di 5, ${state.name}. ${state.decision}`);
    liveCutMarkers.forEach((marker, index) => {
      const active = index === stateIndex;
      marker.classList.toggle("active", active);
      marker.setAttribute("aria-pressed", String(active));
    });
    if (allowHaptic && stateChanged && currentLiveCutState >= 0 && navigator.vibrate) {
      navigator.vibrate(8);
    }
    currentLiveCutState = stateIndex;
  }

  liveCutRange?.addEventListener("input", () => renderLiveCut(liveCutRange.value, true));
  liveCutMarkers.forEach(marker => {
    marker.addEventListener("click", () => renderLiveCut(marker.dataset.value, true));
  });
  if (liveCutRange) renderLiveCut(liveCutRange.value, false);

  // Confronto delle tre modalità AI.
  const aiModes = {
    local: {
      title: "PIÙ CONTROLLO SUL FLUSSO.",
      copy: "Il lavoro locale offre più controllo su file, configurazioni e iterazioni; richiede capacità hardware e gestione tecnica.",
    },
    cloud: {
      title: "PIÙ SERVIZI, SENZA GESTIRE L’HARDWARE.",
      copy: "Il cloud rende disponibili modelli e funzioni specializzate rapidamente; richiede una valutazione attenta di costi, dati e dipendenza dal servizio.",
    },
    hybrid: {
      title: "OGNI FASE USA L’AMBIENTE PIÙ ADATTO.",
      copy: "Un flusso ibrido combina elaborazione locale e servizi cloud, mantenendo revisione umana, tracciabilità e controllo sugli output.",
    },
  };
  const aiModeButtons = $$(".ai-mode");
  const aiModeTitle = $("#ai-mode-title");
  const aiModeCopy = $("#ai-mode-copy");
  const aiConsole = $(".ai-studio__console");

  function selectAiMode(mode) {
    const content = aiModes[mode];
    if (!content) return;
    aiModeButtons.forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (aiConsole) aiConsole.dataset.mode = mode;
    if (aiModeTitle) aiModeTitle.textContent = content.title;
    if (aiModeCopy) aiModeCopy.textContent = content.copy;
  }

  aiModeButtons.forEach(button => {
    button.addEventListener("click", () => selectAiMode(button.dataset.mode));
  });
  const initialAiMode = aiModeButtons.find(button => button.getAttribute("aria-pressed") === "true")?.dataset.mode;
  if (initialAiMode) selectAiMode(initialAiMode);

  // Brief guidato: sei passi, riepilogo locale, copia e apertura dell'email.
  function createBriefController() {
    const form = $("#brief-form");
    const section = $("#brief");
    const steps = $$(".brief-step", form);
    const backButton = $("#brief-back");
    const nextButton = $("#brief-next");
    const counter = $("#brief-counter");
    const progress = $("#brief-progress");
    const error = $("#brief-error");
    const summary = $("#brief-summary");
    const summaryCopy = $("#brief-copy");
    const summaryStatus = $("#brief-status");
    const copyButton = $("#brief-copy-button");
    const mailLink = $("#brief-mail");
    const editButton = $("#brief-edit");

    if (!form || !steps.length) {
      return {
        open() {
          section?.scrollIntoView({ behavior: scrollBehaviour(), block: "start" });
        },
      };
    }

    const labels = {
      project_type: {
        grafica: "Campagna o identità",
        video: "Video",
        social: "Sistema social",
        ai: "Flusso o prototipo AI",
        "da-definire": "Da definire",
      },
      starting_point: {
        brief: "Brief disponibile",
        brand: "Identità o linee guida disponibili",
        materials: "Girato o materiali disponibili",
        zero: "Partenza da zero",
        other: "Altro",
      },
      channels: {
        social: "Social",
        web: "Web o landing",
        advertising: "Advertising",
        event: "Evento o schermo",
        internal: "Uso interno",
        multiple: "Più canali",
      },
      timing: {
        date: "Data indicativa",
        flexible: "Data flessibile",
        unknown: "Da definire",
      },
      support: {
        single: "Singolo progetto",
        package: "Pacchetto di contenuti",
        continuous: "Collaborazione continuativa",
        consulting: "Consulenza o prototipo",
        unknown: "Da definire",
      },
      budget: {
        "": "Non indicata",
        "da-definire": "Da definire insieme",
        piccolo: "Progetto circoscritto",
        medio: "Produzione articolata",
        continuativo: "Collaborazione continuativa",
      },
    };
    let currentStep = Math.max(0, steps.findIndex(step => step.classList.contains("active")));
    if (currentStep < 0) currentStep = 0;
    let preparedSummary = "";
    const briefSessionKey = "fai-brief-session-v1";
    const nextStepLabels = [
      "AVANTI: MATERIALI",
      "AVANTI: CANALI",
      "AVANTI: TEMPI",
      "AVANTI: SUPPORTO",
      "AVANTI: CONTATTI",
      "PREPARA IL RIEPILOGO",
    ];

    function saveBriefSession() {
      try {
        const values = {};
        $$("input[name], select[name], textarea[name]", form).forEach(control => {
          const { name } = control;
          if (control.type === "checkbox" || control.type === "radio") {
            if (!Array.isArray(values[name])) values[name] = [];
            if (control.checked) values[name].push(control.value);
          } else {
            values[name] = control.value;
          }
        });
        sessionStorage.setItem(briefSessionKey, JSON.stringify({ step: currentStep, values }));
      } catch (_) {
        // Il brief resta pienamente utilizzabile anche se lo storage è disattivato.
      }
    }

    function restoreBriefSession() {
      try {
        const savedState = JSON.parse(sessionStorage.getItem(briefSessionKey) || "null");
        if (!savedState || typeof savedState !== "object" || !savedState.values) return;
        currentStep = Math.max(0, Math.min(steps.length - 1, Number(savedState.step) || 0));
        $$("input[name], select[name], textarea[name]", form).forEach(control => {
          const savedValue = savedState.values[control.name];
          if (control.type === "checkbox" || control.type === "radio") {
            control.checked = Array.isArray(savedValue) && savedValue.includes(control.value);
          } else if (typeof savedValue === "string") {
            control.value = savedValue;
          }
        });
      } catch (_) {
        // Uno stato non valido viene ignorato senza bloccare il percorso.
      }
    }

    restoreBriefSession();

    function clearError(target) {
      if (error) {
        error.hidden = true;
        error.textContent = "";
      }
      const invalidTargets = new Set($$('[aria-invalid="true"]', form));
      if (target instanceof HTMLElement) invalidTargets.add(target);
      invalidTargets.forEach(element => {
        element.removeAttribute("aria-invalid");
        const descriptions = (element.getAttribute("aria-describedby") || "")
          .split(/\s+/)
          .filter(id => id && id !== "brief-error");
        if (descriptions.length) element.setAttribute("aria-describedby", descriptions.join(" "));
        else element.removeAttribute("aria-describedby");
      });
    }

    function showError(message, target) {
      if (error) {
        error.textContent = message;
        error.hidden = false;
      }
      if (target instanceof HTMLElement) {
        target.setAttribute("aria-invalid", "true");
        const descriptions = new Set((target.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
        descriptions.add("brief-error");
        target.setAttribute("aria-describedby", Array.from(descriptions).join(" "));
        target.focus({ preventScroll: true });
      }
    }

    function showStep(index, focus = false) {
      currentStep = Math.max(0, Math.min(steps.length - 1, index));
      steps.forEach((step, stepIndex) => {
        const active = stepIndex === currentStep;
        step.hidden = !active;
        setInert(step, !active);
        step.classList.toggle("active", active);
      });
      if (counter) counter.textContent = `DOMANDA ${currentStep + 1} DI ${steps.length}`;
      if (progress) progress.style.setProperty("--progress", `${(currentStep + 1) / steps.length * 100}%`);
      if (backButton) backButton.hidden = currentStep === 0;
      const nextLabel = $("span", nextButton);
      if (nextLabel) nextLabel.textContent = nextStepLabels[currentStep] || "CONTINUA";
      clearError();
      if (focus) {
        const legend = $("legend", steps[currentStep]);
        if (legend) {
          legend.tabIndex = -1;
          requestAnimationFrame(() => legend.focus({ preventScroll: true }));
        }
      }
      saveBriefSession();
    }

    function validateCurrentStep() {
      if (currentStep === 0) {
        const selected = $('input[name="project_type"]:checked', form);
        if (!selected) {
          showError("Scegli almeno un tipo di progetto per continuare.", $('input[name="project_type"]', form));
          return false;
        }
      }

      if (currentStep === steps.length - 1) {
        const name = $('input[name="name"]', form);
        const email = $('input[name="email"]', form);
        const privacy = $('input[name="privacy"]', form);
        if (!name?.value.trim()) {
          showError("Inserisci il tuo nome.", name);
          return false;
        }
        if (!email?.value.trim()) {
          showError("Inserisci il tuo indirizzo email.", email);
          return false;
        }
        if (!email.validity.valid) {
          showError("Controlla l’indirizzo email: deve avere un formato valido.", email);
          return false;
        }
        if (!privacy?.checked) {
          showError("Conferma di aver capito come vengono gestiti i dati.", privacy);
          return false;
        }
      }
      return true;
    }

    const checkedValues = name => $$('[name="' + name + '"]:checked', form).map(input => input.value);
    const fieldValue = name => $('[name="' + name + '"]', form)?.value?.trim() || "";
    const readable = (group, value) => labels[group]?.[value] || value || "Non indicato";
    const readableList = (group, values) => values.length
      ? values.map(value => readable(group, value)).join(", ")
      : "Non indicato";

    function readableDate(value) {
      const parts = value.split("-").map(Number);
      if (parts.length !== 3 || parts.some(part => !Number.isFinite(part))) return value;
      return new Intl.DateTimeFormat("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])));
    }

    function buildSummary() {
      const project = checkedValues("project_type")[0] || "";
      const timing = checkedValues("timing")[0] || "";
      const deadline = fieldValue("deadline");
      const timingText = timing === "date" && deadline
        ? `${readable("timing", timing)}: ${readableDate(deadline)}`
        : readable("timing", timing);
      const note = fieldValue("note");
      const lines = [
        "BRIEF PER F/AI",
        "",
        `Tipo di progetto: ${readable("project_type", project)}`,
        `Punto di partenza: ${readableList("starting_point", checkedValues("starting_point"))}`,
        `Canali: ${readableList("channels", checkedValues("channels"))}`,
        `Tempistiche: ${timingText}`,
        `Supporto richiesto: ${readable("support", checkedValues("support")[0] || "")}`,
        `Fascia di investimento: ${readable("budget", fieldValue("budget"))}`,
        "",
        "CONTATTO",
        `Nome: ${fieldValue("name")}`,
        `Email: ${fieldValue("email")}`,
        `Azienda: ${fieldValue("company") || "Non indicata"}`,
        `Nota: ${note || "Non indicata"}`,
      ];
      return {
        text: lines.join("\n"),
        projectLabel: readable("project_type", project),
        name: fieldValue("name"),
      };
    }

    function showSummary() {
      const built = buildSummary();
      preparedSummary = built.text;
      if (summaryCopy) summaryCopy.textContent = preparedSummary;
      if (mailLink) {
        const subject = `Nuovo brief F/AI — ${built.projectLabel} — ${built.name}`;
        mailLink.href = "#brief";   /* nessun indirizzo, per ora: resta la copia */
      }
      form.hidden = true;
      setInert(form, true);
      if (summary) {
        summary.hidden = false;
        setInert(summary, false);
        summary.focus({ preventScroll: true });
      }
      if (summaryStatus) summaryStatus.textContent = "";
    }

    function nextStep() {
      if (!validateCurrentStep()) return;
      if (currentStep === steps.length - 1) showSummary();
      else showStep(currentStep + 1, true);
    }

    function open(index = 0, focus = true) {
      if (summary) {
        summary.hidden = true;
        setInert(summary, true);
      }
      form.hidden = false;
      setInert(form, false);
      showStep(index, false);
      section?.scrollIntoView({ behavior: scrollBehaviour(), block: "start" });
      if (focus) {
        requestAnimationFrame(() => {
          const selected = $('input[name="project_type"]:checked', steps[currentStep]);
          const target = selected || $("input, select, textarea, button", steps[currentStep]);
          target?.focus({ preventScroll: true });
        });
      }
    }

    async function copyText(text) {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (_) {
          // Prosegue con il fallback compatibile con il server locale.
        }
      }
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.readOnly = true;
      textarea.style.position = "fixed";
      textarea.style.inset = "0 auto auto -9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (_) {
        copied = false;
      }
      textarea.remove();
      copyButton?.focus({ preventScroll: true });
      return copied;
    }

    backButton?.addEventListener("click", () => showStep(currentStep - 1, true));
    form.addEventListener("submit", event => {
      event.preventDefault();
      nextStep();
    });
    form.addEventListener("input", event => {
      clearError(event.target);
      saveBriefSession();
    });
    form.addEventListener("change", event => {
      clearError(event.target);
      saveBriefSession();
    });

    const deadline = $('input[name="deadline"]', form);
    const deadlineLabel = deadline?.closest(".brief-date");
    const timingInputs = $$('input[name="timing"]', form);
    function syncDeadlineField() {
      const needsDate = $('input[name="timing"][value="date"]', form)?.checked === true;
      if (deadlineLabel) deadlineLabel.hidden = !needsDate;
      if (deadline) {
      deadline.disabled = !needsDate;
      if (!needsDate) deadline.value = "";
      saveBriefSession();
      }
    }
    timingInputs.forEach(input => input.addEventListener("change", syncDeadlineField));
    syncDeadlineField();

    copyButton?.addEventListener("click", async () => {
      const copied = await copyText(preparedSummary);
      if (summaryStatus) {
        summaryStatus.textContent = copied
          ? "Riepilogo copiato. Incollalo dove preferisci."
          : "Copia non riuscita. Seleziona il testo del riepilogo e copialo manualmente.";
      }
    });

    mailLink?.addEventListener("click", () => {
      if (summaryStatus) {
        summaryStatus.textContent = "Conferma l’invio nel tuo programma email: il sito non invia nulla automaticamente.";
      }
    });

    editButton?.addEventListener("click", () => open(steps.length - 1, true));
    showStep(currentStep, false);

    return { open };
  }

  const briefController = createBriefController();
  $$(".service-brief").forEach(button => {
    button.addEventListener("click", () => {
      const service = button.dataset.service;
      const choice = service
        ? $('#brief-form input[name="project_type"][value="' + service + '"]')
        : null;
      if (choice) {
        choice.checked = true;
        choice.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (location.hash !== "#brief") history.pushState(null, "", "#brief");
      briefController.open(0, true);
    });
  });

  // Playlab: nessun asset prima del click; il primo tocco carica e apre.
const PLAYLAB_VERSION = "20260729av";
  const playlabButton = $("#open-playlab");
  const playlabDialog = $("#original-playlab");
  const playlabScripts = [
    "playlab-dna.js",
    "playlab-loom.js",
    "playlab-fold.js",
    "playlab-drift.js",
    "playlab-choir.js",
    "playlab-app.js",
  ];
  const scriptPromises = new Map();
  let playlabStylePromise = null;
  let playlabPromise = null;
  let playlabLoaded = false;

  function loadPlaylabStyle() {
    if (playlabStylePromise) return playlabStylePromise;
    playlabStylePromise = new Promise((resolve, reject) => {
      const existing = $$('link[rel="stylesheet"]')
        .find(link => new URL(link.href, document.baseURI).pathname.endsWith("/playlab.css"));
      if (existing) {
        try {
          if (existing.sheet) {
            resolve();
            return;
          }
        } catch (_) {
          // La risorsa è locale; in caso di stato incerto viene ricreata.
        }
        existing.remove();
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `playlab.css?v=${PLAYLAB_VERSION}`;
      link.dataset.playlabAsset = "style";
      link.addEventListener("load", resolve, { once: true });
      link.addEventListener("error", () => {
        link.remove();
        playlabStylePromise = null;
        reject(new Error("Impossibile caricare lo stile del Laboratorio."));
      }, { once: true });
      document.head.appendChild(link);
    });
    return playlabStylePromise;
  }

  function loadPlaylabScript(filename) {
    if (scriptPromises.has(filename)) return scriptPromises.get(filename);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${filename}?v=${PLAYLAB_VERSION}`;
      script.async = false;
      script.dataset.playlabAsset = filename;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", () => {
        script.remove();
        scriptPromises.delete(filename);
        reject(new Error(`Impossibile caricare ${filename}.`));
      }, { once: true });
      document.body.appendChild(script);
    });
    scriptPromises.set(filename, promise);
    return promise;
  }

  function preparePlaylab() {
    if (playlabPromise) return playlabPromise;
    playlabPromise = (async () => {
      if (!playlabDialog) throw new Error("Interfaccia del Laboratorio non disponibile.");
      const styleReady = loadPlaylabStyle();
      await Promise.all(playlabScripts.slice(0, -1).map(loadPlaylabScript));
      await loadPlaylabScript(playlabScripts.at(-1));
      await styleReady;
      if (!globalThis.FAIPlaylabDNA || !globalThis.FAIPlaylab) {
        throw new Error("Il Laboratorio non ha completato l’inizializzazione.");
      }
      playlabLoaded = true;
    })().catch(error => {
      playlabPromise = null;
      throw error;
    });
    return playlabPromise;
  }

  if (playlabButton) {
    const label = $("span", playlabButton);
    const icon = $("i", playlabButton);
    const loadStatus = document.createElement("span");
    loadStatus.id = "playlab-load-status";
    loadStatus.className = "sr-only";
    loadStatus.setAttribute("role", "status");
    loadStatus.setAttribute("aria-live", "polite");
    playlabButton.insertAdjacentElement("afterend", loadStatus);
    const describedBy = new Set((playlabButton.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
    describedBy.add(loadStatus.id);
    playlabButton.setAttribute("aria-describedby", Array.from(describedBy).join(" "));

    playlabButton.addEventListener("click", async event => {
      if (playlabLoaded) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (playlabPromise) {
        loadStatus.textContent = "Caricamento del Laboratorio in corso.";
        return;
      }

      playlabButton.setAttribute("aria-busy", "true");
      if (label) label.textContent = "PREPARO IL LABORATORIO…";
      if (icon) icon.textContent = "◌";
      loadStatus.textContent = "Caricamento del Laboratorio in corso.";

      try {
        await preparePlaylab();
        playlabButton.setAttribute("aria-busy", "false");
        if (label) label.textContent = "LABORATORIO PRONTO · APRI";
        if (icon) icon.textContent = "▶";
        loadStatus.textContent = "Laboratorio pronto. Apertura in corso.";
        requestAnimationFrame(() => {
          playlabButton.click();
          requestAnimationFrame(() => { loadStatus.textContent = ""; });
        });
      } catch (error) {
        console.error(error);
        playlabButton.setAttribute("aria-busy", "false");
        if (label) label.textContent = "RIPROVA IL CARICAMENTO";
        if (icon) icon.textContent = "↻";
        loadStatus.textContent = "Il Laboratorio non è stato caricato. Premi di nuovo per riprovare.";
      }
    }, true);
    playlabDialog?.addEventListener("close", () => { loadStatus.textContent = ""; });
  }
})();
