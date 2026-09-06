/* ═══════════════════════════════════════════════════════════════════
 * brief.js — le sei domande.
 *
 * Il controller è quello che il sito aveva già: sei passi, riepilogo
 * costruito nel browser, copia negli appunti e apertura nel programma
 * email. Estratto da script.js e reso autonomo — i quattro helper che
 * usava stanno qui sopra, non dipende da altro.
 *
 * I dati non escono dal browser: restano in localStorage e finiscono
 * in una email solo se è l'utente ad aprirla.
 * ═══════════════════════════════════════════════════════════════════ */

const $ = (selector, scope = document) => scope?.querySelector?.(selector) || null;
const $$ = (selector, scope = document) =>
  scope?.querySelectorAll ? Array.from(scope.querySelectorAll(selector)) : [];
const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehaviour = () => (reducedMotionQuery.matches ? 'auto' : 'smooth');
const setInert = (element, value) => { if (element) element.inert = Boolean(value); };
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
        mailLink.href = `mailto:hello@f-ai.studio?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(preparedSummary)}`;
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

export function initBrief() {
  return createBriefController();
}
