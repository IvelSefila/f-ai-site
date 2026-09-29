/**
 * Widget Controller "Nous" — F/AI Portfolio
 * Versione 1.0 (Settembre 2026)
 */
import { CONFIG } from './chatbot.config.js?v=20260928-128';
import { ChatEngine } from './chatbot.engine.js?v=20260928-128';

/* Cosa sta girando: testi mostrati in alto e nel pannello dettagli (italiano semplice) */
const ENGINE_INFO = {
  deterministic: {
    icona: '🛡️', etichetta: 'ISTANTANEO', nome: 'Istantaneo',
    breve: 'risposte scritte sul sito, nel tuo browser',
    cosa: "Le risposte sono testi preparati a partire dal sito e scelti dal tuo browser con delle regole. Non c'è un modello di intelligenza artificiale e non esce nessun dato dal tuo dispositivo. È velocissimo, ma risponde solo a ciò che è previsto."
  },
  cloud: {
    icona: '☁️', etichetta: 'CLOUD · GROQ', nome: 'Cloud (Groq)',
    breve: 'modello AI su Groq, tramite Cloudflare',
    cosa: 'La tua domanda parte dal browser, passa da un piccolo server su Cloudflare e arriva a Groq, che fa girare il modello gpt-oss-120b. Il modello risponde usando i passaggi del sito più adatti alla domanda. Le domande escono dal tuo dispositivo e vengono elaborate da Cloudflare e da Groq; il nostro server non le registra.'
  },
  webgpu: {
    icona: '⚡', etichetta: 'LOCALE · QWEN3', nome: 'Locale (Qwen3)',
    breve: 'modello AI sulla tua scheda video',
    cosa: 'Il modello Qwen3 1.7B è stato scaricato nel tuo browser e gira sulla tua scheda video (tecnologia WebGPU). Nessun dato esce dal tuo dispositivo. Il primo download pesa circa 1 GB.'
  }
};

const GLOSSARIO = [
  ['Cloudflare', 'Servizio online che ospita il piccolo server intermediario (il "Worker"). Custodisce la chiave di accesso a Groq, così non è mai visibile nel sito.'],
  ['Groq', 'Azienda che fa girare modelli di intelligenza artificiale su hardware molto veloce: riceve la domanda e restituisce la risposta.'],
  ['gpt-oss-120b', 'Il modello di intelligenza artificiale usato su Groq: un modello aperto di OpenAI con 120 miliardi di parametri.'],
  ['WebGPU e Qwen3', 'WebGPU è la tecnologia che permette al browser di usare la scheda video. Qwen3 1.7B è il piccolo modello che può girare così, senza inviare dati fuori dal dispositivo.']
];

class NodoWidget {
  constructor() {
    this.engine = null;
    this.isOpen = false;
    this.isGenerating = false;
    this.history = [];
    this.elements = {};
    this._toastTimeout = null;
    this.voiceEnabled = false;
    try {
      this.voiceEnabled = localStorage.getItem('nous_voice_enabled') === '1';
    } catch (e) {}
    this.activeRecognition = null;
    this.isDictating = false;
    this._gen = 0;            // token di generazione: cambia a ogni reset/stop/cambio modalità
    this._ttsTimer = null;
    this.slashCommands = [
      { cmd: '/tour', desc: 'Tour guidato di regia in 4 sale del portfolio', run: () => this.startStudioTour() },
      { cmd: '/concept', desc: 'Generatore interattivo di concept e prompt video', run: () => this.startConceptLab() },
      { cmd: '/dossier', desc: 'Genera la scheda riepilogo del tuo progetto e mail rapida', run: () => this.generateDossierCard() },
      { cmd: '/glitch', desc: 'Attiva un impulso glitch cinematografico nello shader WebGL', run: () => this.triggerShaderGlitch() },
      { cmd: '/scena', desc: 'Cambia la scena fotografica nell\'Hero (3 scene)', run: () => this.cycleShaderScene() },
      { cmd: '/calma', desc: 'Rallenta la turbolenza dello shader WebGL a 0.25x', run: () => this.setShaderSpeed(0.25, 'Calma') },
      { cmd: '/turbo', desc: 'Accelera la turbolenza dello shader WebGL a 2.5x', run: () => this.setShaderSpeed(2.5, 'Turbo') },
      { cmd: '/brief', desc: 'Brief rapido in chat: 3 domande, poi il questionario completo del sito', run: () => this.startBriefWizard() },
      { cmd: '/spot', desc: 'Guarda gli spot video AI per Union Energia', run: () => this.handleUserQuery('Mostrami gli spot video per Union Energia') },
      { cmd: '/audio', desc: 'Ascolta i 5 jingle musicali creati con Lyria', run: () => this.handleUserQuery('Fammi ascoltare i jingle della Locanda del Castello') },
      { cmd: '/stack', desc: 'Scheda tecnica workstation RTX 5090 e software AI', run: () => this.handleUserQuery('Qual è lo stack tecnico e la configurazione hardware?') },
      { cmd: '/colore', desc: 'Cambia al volo la palette cromatica del sito', run: () => this.cyclePalette() }
    ];
    this.slashIndex = 0;
  }

  async init() {
    this.render();
    this.bindEvents();
    this.loadHistory();
    this.scheduleHint();
    this.updateModeBadge();

    try {
      this.engine = await ChatEngine.create();
      this.engine.onCloudDown = (info) => this.handleCloudDown(info);
      this.updateModeBadge();
    } catch (err) {
      console.warn("[Nous] Errore inizializzazione ChatEngine:", err);
    }
  }

  getAvatarSvg(size = 32) {
    return `
      <svg class="nodo-avatar-svg" width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Reticolo di mira esterno -->
        <circle class="nodo-ring" cx="20" cy="20" r="16" stroke="var(--nodo-em)" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.85"/>
        <!-- Mirino ottico -->
        <path class="nodo-cross" d="M20 2v5 M20 33v5 M2 20h5 M33 20h5" stroke="var(--nodo-em-light)" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Nucleo centrale di regia -->
        <circle class="nodo-core" cx="20" cy="20" r="5" fill="var(--nodo-em-bright)"/>
      </svg>
    `;
  }

  render() {
    // 1. FAB
    const fab = document.createElement('button');
    fab.className = 'nodo-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', `Apri assistente virtuale ${CONFIG.name}`);
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = this.getAvatarSvg(32);

    // 2. Micro-Hint
    const hint = document.createElement('div');
    hint.className = 'nodo-hint';
    hint.innerHTML = `
      <span>Cerchi informazioni rapide sui lavori o sullo stack AI? <b>Chiedi a Nous</b></span>
      <button class="nodo-hint-close" type="button" aria-label="Chiudi avviso">&times;</button>
    `;

    // 3. Finestra Chat
    const win = document.createElement('div');
    win.className = 'nodo-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'true');
    win.setAttribute('aria-label', `Chat con ${CONFIG.name}`);
    win.setAttribute('tabindex', '-1');
    win.innerHTML = `
      <header class="nodo-header">
        <div class="nodo-header-title">
          ${this.getAvatarSvg(24)}
          <h3>${CONFIG.name}</h3>
          <div class="nodo-equalizer" title="Nous sta parlando..." style="display:none;" aria-hidden="true">
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
          </div>
        </div>
        <div class="nodo-header-actions">
          <button class="nodo-voice-btn ${this.voiceEnabled ? 'is-active' : ''}" type="button" title="Voce di regia Nous (Attiva/Disattiva)" aria-label="Voce di Nous" aria-pressed="${this.voiceEnabled}">
            <svg class="icon-voice-off" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            <svg class="icon-voice-on" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:none;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          </button>
          <button class="nodo-mode-badge" type="button" title="Cosa sta girando: tocca per i dettagli" aria-label="Cosa sta girando: tocca per i dettagli" aria-expanded="false" aria-controls="nodo-mode-info">
            [ 🛡️ ISTANTANEO ]
          </button>
          <button class="nodo-icon-btn" type="button" data-action="reset" title="Azzera conversazione" aria-label="Azzera conversazione">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
          <button class="nodo-icon-btn" type="button" data-action="close" title="Chiudi chat" aria-label="Chiudi chat">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="nodo-mode-info" id="nodo-mode-info" role="region" aria-label="Cosa sta girando" hidden></div>
      </header>

      <div class="nodo-progress-bar" style="display: none;" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-hidden="true">
        <div class="nodo-progress-meta">
          <span class="nodo-progress-text">Inizializzazione WebGPU...</span>
          <span class="nodo-progress-pct">0%</span>
        </div>
        <div class="nodo-progress-track">
          <div class="nodo-progress-fill" style="width: 0%;"></div>
        </div>
      </div>

      <div class="nodo-toast" style="display: none;" role="status" aria-live="polite"></div>

      <div class="nodo-privacy-note" style="display: none;" role="note">☁️ Modalità Cloud attiva: le domande vengono inviate a un servizio esterno.</div>

      <div class="nodo-messages" role="log" aria-live="off" aria-label="Conversazione con Nous"></div>
      <div class="nodo-sr-only nodo-live" role="status" aria-live="polite" aria-atomic="true"></div>

      <div class="nodo-chips" role="toolbar" aria-label="Suggerimenti rapidi">
        ${CONFIG.quickChips.map(c => `<button class="nodo-chip" type="button" data-query="${c.query}">${c.label}</button>`).join('')}
      </div>

      <div class="nodo-slash-menu" style="display: none;" role="menu"></div>

      <form class="nodo-input-bar">
        <button class="nodo-mic-btn" type="button" aria-label="Dettatura vocale con Nous" title="Parla con Nous (Dettatura vocale)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
        </button>
        <button class="nodo-slash-btn" type="button" aria-label="Menu comandi rapidi" title="Comandi rapidi (/)">/</button>
        <input class="nodo-input" type="text" placeholder="Chiedi a Nous su progetti, video, AI... (o digita /)" aria-label="Scrivi un messaggio per Nous" maxlength="300" autocomplete="off" />
        <button class="nodo-stop-btn" type="button" aria-label="Interrompi la risposta" title="Interrompi la risposta" style="display:none;">Stop</button>
        <button class="nodo-send-btn" type="submit" aria-label="Invia messaggio">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    `;

    win.inert = true;
    win.setAttribute('aria-hidden', 'true');

    document.body.appendChild(fab);
    document.body.appendChild(hint);
    document.body.appendChild(win);

    this.elements = {
      fab,
      hint,
      hintClose: hint.querySelector('.nodo-hint-close'),
      win,
      header: win.querySelector('.nodo-header'),
      voiceBtn: win.querySelector('.nodo-voice-btn'),
      modeBadge: win.querySelector('.nodo-mode-badge'),
      modeInfo: win.querySelector('.nodo-mode-info'),
      progressBar: win.querySelector('.nodo-progress-bar'),
      progressFill: win.querySelector('.nodo-progress-fill'),
      progressText: win.querySelector('.nodo-progress-text'),
      progressPct: win.querySelector('.nodo-progress-pct'),
      toast: win.querySelector('.nodo-toast'),
      messages: win.querySelector('.nodo-messages'),
      live: win.querySelector('.nodo-live'),
      privacyNote: win.querySelector('.nodo-privacy-note'),
      stopBtn: win.querySelector('.nodo-stop-btn'),
      chips: win.querySelector('.nodo-chips'),
      slashMenu: win.querySelector('.nodo-slash-menu'),
      form: win.querySelector('.nodo-input-bar'),
      input: win.querySelector('.nodo-input'),
      micBtn: win.querySelector('.nodo-mic-btn'),
      slashBtn: win.querySelector('.nodo-slash-btn'),
      sendBtn: win.querySelector('.nodo-send-btn'),
      resetBtn: win.querySelector('[data-action="reset"]'),
      closeBtn: win.querySelector('[data-action="close"]')
    };
  }

  bindEvents() {
    const { fab, hint, hintClose, win, form, chips, resetBtn, closeBtn, input, modeBadge, voiceBtn, slashBtn } = this.elements;

    fab.addEventListener('click', () => this.toggle());
    closeBtn.addEventListener('click', () => this.close());
    hintClose.addEventListener('click', () => this.dismissHint());
    hint.addEventListener('click', e => {
      if (e.target !== hintClose) {
        this.dismissHint();
        this.open();
      }
    });

    modeBadge.addEventListener('click', (e) => { e.stopPropagation(); this.toggleModeInfo(); });
    this.elements.modeInfo.addEventListener('click', (e) => {
      const b = e.target.closest('[data-engine]');
      if (!b) return;
      const target = b.dataset.engine;
      if (target === 'webgpu' && this.engine && !this.engine.isWebGPULoaded) {
        this.closeModeInfo();
        this.activateLocalQwen({ passa: true });
      } else {
        this.switchEngine(target);
      }
    });
    win.addEventListener('click', (e) => {
      if (!e.target.closest('.nodo-mode-info, .nodo-mode-badge')) this.closeModeInfo();
    });
    win.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.elements.modeInfo.hidden) {
        e.stopPropagation();
        this.closeModeInfo();
        modeBadge.focus();
      }
    }, true);
    resetBtn.addEventListener('click', () => this.resetChat());

    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => this.toggleVoice());
    }

    if (slashBtn) {
      slashBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.elements.slashMenu && this.elements.slashMenu.style.display !== 'none') {
          this.hideSlashMenu();
        } else {
          this.renderSlashMenu('');
          input.focus();
        }
      });
    }

    this.setupSpeechRecognition();

    form.addEventListener('submit', e => {
      e.preventDefault();
      const query = input.value.trim();
      this.hideSlashMenu();
      if (!query) return;

      const exactSlash = this.slashCommands?.find(c => c.cmd.toLowerCase() === query.toLowerCase());
      if (exactSlash) {
        input.value = '';
        exactSlash.run();
        return;
      }

      if (!this.isGenerating) {
        this.handleUserQuery(query);
      }
    });

    chips.addEventListener('click', e => {
      const chip = e.target.closest('.nodo-chip');
      if (chip && !this.isGenerating) {
        const query = chip.getAttribute('data-query');
        this.handleUserQuery(query);
      }
    });

    // Slash command listeners su input
    input.addEventListener('input', () => {
      const val = input.value;
      if (val.startsWith('/')) {
        this.renderSlashMenu(val);
      } else {
        this.hideSlashMenu();
      }
    });

    input.addEventListener('keydown', e => {
      if (this.elements.slashMenu.style.display !== 'none') {
        const items = Array.from(this.elements.slashMenu.querySelectorAll('.nodo-slash-item'));
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.slashIndex = (this.slashIndex + 1) % items.length;
          this.highlightSlashItem(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.slashIndex = (this.slashIndex - 1 + items.length) % items.length;
          this.highlightSlashItem(items);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          if (items[this.slashIndex]) {
            e.preventDefault();
            items[this.slashIndex].click();
          }
        } else if (e.key === 'Escape') {
          this.hideSlashMenu();
        }
      }
    });

    // Chiusura con ESC
    document.addEventListener('keydown', e => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        if (this.elements.slashMenu && this.elements.slashMenu.style.display !== 'none') return;
        this.close();
        return;
      }
      // Focus trap: Tab e Shift+Tab restano dentro la finestra
      if (e.key === 'Tab') {
        const focusables = Array.from(this.elements.win.querySelectorAll(
          'button, a[href], input, select, textarea, audio[controls], [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.disabled && el.offsetParent !== null);
        if (!focusables.length) {
          e.preventDefault();
          this.elements.win.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (!this.elements.win.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && (active === first || active === this.elements.win)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Pulsante Stop: interrompe la risposta in corso
    if (this.elements.stopBtn) {
      this.elements.stopBtn.addEventListener('click', () => this.stopGeneration());
    }

    // Tastiera mobile: adatta l'altezza della finestra al visualViewport
    if (window.visualViewport) {
      const onVV = () => this.applyViewport();
      window.visualViewport.addEventListener('resize', onVV);
      window.visualViewport.addEventListener('scroll', onVV);
    }

    // Chiusura automatica su click esterno (pointerdown al di fuori di .nodo-window e .nodo-fab)
    document.addEventListener('pointerdown', e => {
      if (this.elements.slashMenu && this.elements.slashMenu.style.display !== 'none') {
        if (!this.elements.slashMenu.contains(e.target) && !this.elements.slashBtn?.contains(e.target)) {
          this.hideSlashMenu();
        }
      }
      if (!this.isOpen) return;
      if (this.elements.win?.contains(e.target) || this.elements.fab?.contains(e.target)) return;
      // Non chiudere durante tour guidato o dettatura vocale
      if (this.tourState || this.isDictating) return;
      this.close();
    });

    // Deep-linking click delegation
    this.elements.messages.addEventListener('click', e => {
      const link = e.target.closest('.nodo-action-link');
      if (link) {
        e.preventDefault();
        const target = this.safeTarget(link.getAttribute('data-target'));
        const elem = target ? document.querySelector(target) : null;
        if (elem) {
          if (window.innerWidth <= 640) this.close();
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    // Sfoglia le chip rapide con il dito o mouse drag
    this.setupSwipeableChips(chips);
  }

  setupSwipeableChips(container) {
    if (!container) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;

    // Aggiorna la maschera visiva di fade ai lati per dare feedback visivo
    const updateFadeMask = () => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 4) {
        container.style.maskImage = 'none';
        container.style.webkitMaskImage = 'none';
        return;
      }
      const isStart = container.scrollLeft <= 6;
      const isEnd = container.scrollLeft >= maxScroll - 6;

      if (isStart) {
        container.style.maskImage = 'linear-gradient(to right, black calc(100% - 32px), transparent 100%)';
        container.style.webkitMaskImage = 'linear-gradient(to right, black calc(100% - 32px), transparent 100%)';
      } else if (isEnd) {
        container.style.maskImage = 'linear-gradient(to right, transparent 0%, black 32px)';
        container.style.webkitMaskImage = 'linear-gradient(to right, transparent 0%, black 32px)';
      } else {
        container.style.maskImage = 'linear-gradient(to right, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%)';
        container.style.webkitMaskImage = 'linear-gradient(to right, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%)';
      }
    };

    container.addEventListener('scroll', updateFadeMask, { passive: true });
    window.addEventListener('resize', updateFadeMask, { passive: true });
    setTimeout(updateFadeMask, 100);

    // Mouse / Pointer drag handling
    container.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      hasMoved = false;
      startX = e.clientX;
      scrollLeft = container.scrollLeft;
      container.classList.add('is-dragging');
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) {
        hasMoved = true;
      }
      container.scrollLeft = scrollLeft - dx;
    }, { passive: true });

    const stopDrag = () => {
      if (!isDown) return;
      isDown = false;
      container.classList.remove('is-dragging');
      setTimeout(() => { hasMoved = false; }, 60);
    };

    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);

    // Mappatura rotellina mouse per scorrere orizzontalmente
    container.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // Previene il click accidentale quando l'utente trascina o sfoglia
    container.addEventListener('click', (e) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
  }

  /** Accetta solo ancore #id esistenti nella pagina; altrimenti null */
  safeTarget(target) {
    if (typeof target !== 'string' || !/^#[A-Za-z][\w-]{0,63}$/.test(target)) return null;
    return document.getElementById(target.slice(1)) ? target : null;
  }

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** HTML sicuro del link di azione (target validato, label escapata); '' se non valido */
  actionLinkHtml(action) {
    if (!action || typeof action !== 'object') return '';
    const target = this.safeTarget(action.target);
    if (!target) return '';
    const label = this.escapeHtml(String(action.label || 'Vai alla sezione').slice(0, 80));
    return `
      <div class="nodo-msg-action">
        <a href="${target}" class="nodo-action-link" data-target="${target}">
          ${label} <span>&rarr;</span>
        </a>
      </div>
    `;
  }

  applyViewport() {
    const win = this.elements.win;
    const vv = window.visualViewport;
    if (!win || !vv) return;
    if (window.innerWidth > 640 || !this.isOpen) {
      win.style.removeProperty('--nodo-vvh');
      win.classList.remove('is-keyboard');
      return;
    }
    const keyboard = window.innerHeight - vv.height - vv.offsetTop > 80;
    win.classList.toggle('is-keyboard', keyboard);
    if (keyboard) {
      win.style.setProperty('--nodo-vvh', `${Math.max(240, Math.round(vv.height - 16))}px`);
    } else {
      win.style.removeProperty('--nodo-vvh');
    }
  }

  /** Annuncia a screen reader solo la risposta completa (l'area messaggi è aria-live=off) */
  announce(text) {
    if (!this.elements.live) return;
    this.elements.live.textContent = '';
    setTimeout(() => { if (this.elements.live) this.elements.live.textContent = text; }, 50);
  }

  /** discard=true (reset / cambio modalità): il testo in arrivo viene scartato e la cronologia non viene toccata */
  stopGeneration(discard = false) {
    if (!this.isGenerating) return;
    if (discard) this._gen++;
    if (this.engine) this.engine.abortGeneration();
    // L'aggiornamento dello stato dei controlli avviene nel finally di handleUserQuery
  }

  scheduleHint() {
    if (localStorage.getItem('nodo_hint_dismissed')) return;
    setTimeout(() => {
      if (!this.isOpen && !localStorage.getItem('nodo_hint_dismissed')) {
        this.elements.hint.classList.add('is-visible');
      }
    }, 8500);
  }

  dismissHint() {
    this.elements.hint.classList.remove('is-visible');
    localStorage.setItem('nodo_hint_dismissed', '1');
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.elements.fab.setAttribute('aria-expanded', 'true');
    this.elements.win.inert = false;
    this.elements.win.removeAttribute('aria-hidden');
    this.elements.win.classList.add('is-open');
    this.applyViewport();
    this.dismissHint();

    if (this.tourBubble) {
      this.tourBubble.classList.add('is-hidden');
    }

    if (this.history.length === 0) {
      const activeSec = this.detectCurrentSection();
      let welcome = CONFIG.welcomeMessage;
      if (activeSec) {
        welcome = `📍 **Sala attiva: ${activeSec.name}**\n\nCiao! Sono **Nous**, l'intelligenza di regia del portfolio di Fabrizio. ${activeSec.prompt}`;
      }
      welcome = `${welcome}\n\n${this.rigaMotore()}`;
      this.appendBotMessage(welcome);
      if (this.voiceEnabled) {
        this.speakText(welcome);
      }

      // Modello locale: una domanda all'apertura (una volta per browser)
      setTimeout(() => this.offerLocalQwen('open'), 1500);
    }
    setTimeout(() => this.elements.input.focus(), 150);
  }

  close(options = {}) {
    this.closeModeInfo();
    this.isOpen = false;
    this.elements.fab.setAttribute('aria-expanded', 'false');
    this.elements.win.classList.remove('is-open');
    this.elements.win.inert = true; // fuori dall'ordine di Tab e dagli screen reader quando chiusa
    this.elements.win.setAttribute('aria-hidden', 'true');
    this.applyViewport();
    this.hideSlashMenu();
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    if (this.tourState && this.tourBubble) {
      this.tourBubble.classList.remove('is-hidden');
    } else if (!options?.preserveTour) {
      this.stopSpeaking();
      this.clearTourTimer();
      this.stopStudioTour(false);
    }
    this.elements.fab.focus();
  }

  resetChat() {
    this.stopGeneration(true);
    this.clearTourTimer();
    this.tourState = null;
    this.history = [];
    try {
      sessionStorage.removeItem('nodo_chat_history');
    } catch (e) {
      console.warn("[Nodo] Impossibile rimuovere da sessionStorage:", e);
    }
    this.elements.messages.innerHTML = '';
    this.appendBotMessage(`${CONFIG.welcomeMessage}\n\n${this.rigaMotore()}`);
  }

  /* Riga di benvenuto: dice quale motore sta rispondendo in questo momento. */
  rigaMotore() {
    const mode = this.engine ? this.engine.getEffectiveMode() : (CONFIG.cloudProxyUrl ? 'cloud' : 'deterministic');
    if (mode === 'cloud') {
      return "Al momento sto usando **gpt-oss-120b** tramite **Groq** e **Cloudflare**. Tocca il badge in alto per i dettagli.";
    }
    if (mode === 'webgpu') {
      return "Al momento sto usando **Qwen3 1.7B**, un modello che gira sul tuo dispositivo. Tocca il badge in alto per i dettagli.";
    }
    return "Al momento rispondo con testi scritti sul sito, senza intelligenza artificiale (modalità **Istantaneo**). Tocca il badge in alto per i dettagli.";
  }

  /* Groq non risponde piu': si passa da solo ai motori di riserva e si propone il modello locale. */
  handleCloudDown(info) {
    this.updateModeBadge();
    const rest = Math.max(1000, info.fino - Date.now());
    setTimeout(() => this.updateModeBadge(), rest + 500);
    setTimeout(() => {
      if (!this.offerLocalQwen('fallback')) {
        const nome = ENGINE_INFO[this.engine.getEffectiveMode()].nome;
        this.appendBotMessage(info.limite
          ? `Le chiamate a Groq per ora sono finite: rispondo con ${nome} e riprovo da solo tra poco.`
          : `Groq per ora non risponde: rispondo con ${nome} e riprovo da solo tra poco.`);
      }
    }, 900);
  }

  /* Propone di installare Qwen3 sul dispositivo. Ritorna true se ha mostrato la domanda. */
  offerLocalQwen(reason) {
    if (!navigator.gpu || !this.engine || this.engine.isWebGPULoaded || this.engine.isWebGPULoading) return false;
    let asked = false;
    try { asked = !!localStorage.getItem('nodo_webgpu_asked'); } catch (e) {}
    if (reason === 'open' && asked) return false;
    if (reason === 'fallback') {
      if (this._qwenOfferedFallback) return false;
      this._qwenOfferedFallback = true;
    }
    const eff = this.engine.getEffectiveMode();
    const inPausa = this.engine.getMode() === 'cloud' && eff !== 'cloud';
    let testo;
    if (eff === 'cloud') {
      testo = "Al momento le risposte le dà <strong>Groq</strong> (modello gpt-oss-120b) tramite <strong>Cloudflare</strong>. Vuoi installare sul tuo dispositivo <strong>Qwen3 1.7B</strong>? Risponde da solo, senza mandare le domande in rete, e resta come riserva se Groq non risponde. Si scarica una volta sola (circa 1 GB).";
    } else if (inPausa) {
      testo = "Groq per ora non risponde (chiamate finite o servizio occupato): uso le risposte <strong>Istantanee</strong>, scritte sul sito, e riprovo da solo tra poco. Vuoi installare sul tuo dispositivo <strong>Qwen3 1.7B</strong>, un piccolo modello AI che risponde senza rete? Si scarica una volta sola (circa 1 GB).";
    } else {
      testo = "Al momento rispondo con testi scritti sul sito, senza intelligenza artificiale. Vuoi installare sul tuo dispositivo <strong>Qwen3 1.7B</strong>, un piccolo modello AI che risponde senza rete? Si scarica una volta sola (circa 1 GB).";
    }
    const offerMsg = document.createElement('div');
    offerMsg.className = 'nodo-msg nodo-msg--bot';
    offerMsg.innerHTML = `
      <div class="nodo-msg-text">⚡ ${testo}</div>
      <div class="nodo-msg-action nodo-webgpu-offer-actions">
        <button class="nodo-webgpu-offer" data-choice="yes">Sì, installa</button>
        <button class="nodo-webgpu-offer" data-choice="no">No grazie</button>
      </div>`;
    const memorizza = () => { try { localStorage.setItem('nodo_webgpu_asked', '1'); } catch (e) {} };
    offerMsg.querySelector('[data-choice="yes"]').addEventListener('click', () => {
      memorizza();
      offerMsg.remove();
      this.activateLocalQwen();
    });
    offerMsg.querySelector('[data-choice="no"]').addEventListener('click', () => {
      memorizza();
      offerMsg.remove();
      this.appendBotMessage(`Va bene, continuo con ${ENGINE_INFO[this.engine.getEffectiveMode()].nome}.`);
    });
    this.elements.messages.appendChild(offerMsg);
    this.scrollToBottom();
    return true;
  }

  /* Attiva il modello locale (Qwen3 nel browser). Si chiama solo dalla domanda in chat. */
  async activateLocalQwen(opts = {}) {
    if (this.engine && this.engine.isWebGPULoading) return;
    if (this.isGenerating) this.stopGeneration(true);

    if (!this.engine) {
      try {
        this.engine = await ChatEngine.create();
      } catch (e) {
        this.showToast("Inizializzazione motore non riuscita.");
        return;
      }
    }

    const prevMode = this.engine.getMode();
    if (!navigator.gpu) {
      this.showToast("Il tuo browser non supporta WebGPU: resto sul motore attuale.");
      return;
    }

    if (this.engine.isWebGPULoaded) {
      this.engine.setMode('webgpu');
      this.updateModeBadge();
      this.showToast("⚡ Modello locale (Qwen3 1.7B) attivato.", false, 2000);
      return;
    }

    this.showProgressBar();
    this.elements.modeBadge.classList.add('nodo-mode-badge--loading');

    try {
      await this.engine.loadWebGPU((progress, text) => {
        this.updateProgress(progress, text);
      });

      this.updateProgress(1.0, "Modello Qwen3 1.7B pronto (100%)");
      const restaSuGroq = prevMode === 'cloud' && !opts.passa;
      if (!restaSuGroq) this.engine.setMode('webgpu');
      this.updateModeBadge();

      setTimeout(() => {
        this.hideProgressBar();
        this.showToast(restaSuGroq
          ? "Qwen3 installato: resta come riserva se Groq non risponde. Dal badge puoi passarci quando vuoi."
          : "Modello locale caricato: adesso risponde Qwen3 sul tuo dispositivo.", false, 3200);
      }, 1500);
    } catch (err) {
      console.warn("[Nous] Errore caricamento WebGPU:", err);
      this.hideProgressBar();
      this.engine.setMode(prevMode);
      this.updateModeBadge();
      this.showToast(`Modello locale non disponibile: ${err.message || 'errore nel download'}. Resto su ${ENGINE_INFO[prevMode].nome}.`);
    } finally {
      this.elements.modeBadge.classList.remove('nodo-mode-badge--loading');
    }
  }

  /* Passa da un motore all'altro fra quelli gia' pronti (niente download da qui). */
  switchEngine(target) {
    if (!this.engine || this.engine.isWebGPULoading || !ENGINE_INFO[target]) return;
    if (target === 'cloud' && !CONFIG.cloudProxyUrl) return;
    if (target === 'webgpu' && !this.engine.isWebGPULoaded) return;
    if (this.isGenerating) this.stopGeneration(true);
    if (target === 'cloud') this.engine.cloudDownUntil = 0;
    this.engine.setMode(target);
    this.updateModeBadge();
    this.showToast(`Adesso risponde: ${ENGINE_INFO[target].nome}`, false, 2000);
  }

  toggleModeInfo() {
    const box = this.elements.modeInfo;
    if (!box) return;
    if (box.hidden) {
      this.renderModeInfo();
      box.hidden = false;
      this.elements.modeBadge.setAttribute('aria-expanded', 'true');
    } else {
      this.closeModeInfo();
    }
  }

  closeModeInfo() {
    const box = this.elements.modeInfo;
    if (!box || box.hidden) return;
    box.hidden = true;
    this.elements.modeBadge.setAttribute('aria-expanded', 'false');
  }

  renderModeInfo() {
    const box = this.elements.modeInfo;
    if (!box) return;
    const mode = this.engine ? this.engine.getEffectiveMode() : 'deterministic';
    const inPausa = !!this.engine && this.engine.getMode() === 'cloud' && mode !== 'cloud';
    const now = ENGINE_INFO[mode] || ENGINE_INFO.deterministic;
    const qwenPronto = !!(this.engine && this.engine.isWebGPULoaded);
    const qwenInCorso = !!(this.engine && this.engine.isWebGPULoading);
    const altri = ['deterministic', 'cloud', 'webgpu'].filter(m => m !== mode && (
      (m === 'deterministic') ||
      (m === 'cloud' && !!CONFIG.cloudProxyUrl) ||
      (m === 'webgpu' && !!navigator.gpu && !qwenInCorso)
    ));
    const etichetta = (m) => (m === 'webgpu' && !qwenPronto)
      ? 'Installa e passa a WebGPU · Qwen3 (circa 1 GB)'
      : (m === 'webgpu' ? 'Passa a WebGPU · Qwen3' : `Passa a ${ENGINE_INFO[m].nome}`);
    const cambia = altri.length
      ? `<div class="nodo-mode-info-switch">${altri.map(m => `<button type="button" class="nodo-mode-info-btn" data-engine="${m}">${etichetta(m)}</button>`).join('')}</div>`
      : '';
    const glossario = GLOSSARIO.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('');
    box.innerHTML = `
      <p class="nodo-mode-info-kicker">Cosa sta girando adesso</p>
      <p class="nodo-mode-info-now"><strong>${now.icona} ${now.nome}</strong><span>${now.breve}</span></p>
      <p class="nodo-mode-info-text">${now.cosa}</p>
      ${inPausa ? '<p class="nodo-mode-info-note">Groq per ora non risponde (chiamate finite o servizio occupato). Riprovo da solo fra qualche minuto, oppure puoi riprovare subito con il pulsante qui sotto.</p>' : ''}
      ${cambia}
      <details class="nodo-mode-info-gloss">
        <summary>Cosa sono Cloudflare, Groq e gli altri</summary>
        <dl>${glossario}</dl>
      </details>`;
  }

  updateModeBadge() {
    const mode = this.engine ? this.engine.getEffectiveMode() : 'deterministic';
    const badge = this.elements.modeBadge;
    if (!badge) return;
    const info = ENGINE_INFO[mode] || ENGINE_INFO.deterministic;
    const inPausa = !!this.engine && this.engine.getMode() === 'cloud' && mode !== 'cloud';

    badge.className = 'nodo-mode-badge';
    if (this.elements.privacyNote) {
      this.elements.privacyNote.style.display = mode === 'cloud' ? 'block' : 'none';
    }
    badge.classList.add(mode === 'webgpu' ? 'nodo-mode-badge--webgpu' : mode === 'cloud' ? 'nodo-mode-badge--cloud' : 'nodo-mode-badge--instant');
    badge.innerHTML = `[ ${info.icona} ${info.etichetta} ]`;
    badge.setAttribute('title', `Sta girando: ${info.nome}. ${info.breve}.${inPausa ? ' Groq per ora non risponde.' : ''} Tocca per i dettagli.`);
    badge.setAttribute('aria-label', `Sta girando: ${info.nome}. Tocca per i dettagli.`);
    if (this.elements.modeInfo && !this.elements.modeInfo.hidden) this.renderModeInfo();
  }

  showProgressBar() {
    if (this.elements.progressBar) {
      this.elements.progressBar.style.display = 'flex';
      this.elements.progressBar.setAttribute('aria-hidden', 'false');
    }
    this.updateProgress(0, "Inizializzazione WebGPU...");
  }

  hideProgressBar() {
    if (this.elements.progressBar) {
      this.elements.progressBar.style.display = 'none';
      this.elements.progressBar.setAttribute('aria-hidden', 'true');
    }
  }

  updateProgress(progress, text) {
    const rawProgress = typeof progress === 'number' ? progress : 0;
    const pct = Math.min(100, Math.max(0, Math.round(rawProgress * 100)));

    if (this.elements.progressFill) {
      this.elements.progressFill.style.width = `${pct}%`;
    }
    const displayMsg = text || `Caricamento pesi Qwen3 (${pct}%)...`;
    if (this.elements.progressText) {
      this.elements.progressText.textContent = displayMsg;
    }
    if (this.elements.progressPct) {
      this.elements.progressPct.textContent = `${pct}%`;
    }
    if (this.elements.progressBar) {
      this.elements.progressBar.setAttribute('aria-valuenow', pct);
    }
  }

  showToast(message, isError = true, durationMs = 3800) {
    const toast = this.elements.toast;
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'nodo-toast' + (isError ? ' nodo-toast--error' : ' nodo-toast--info');
    toast.style.display = 'flex';
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, durationMs);
  }

  async handleUserQuery(text) {
    this.clearTourTimer();
    this.elements.input.value = '';
    this.appendUserMessage(text);

    const myGen = this._gen;
    const stale = () => myGen !== this._gen;
    const releaseControls = () => {
      if (this.elements.header) this.elements.header.classList.remove('is-talking');
      if (this.elements.fab) this.elements.fab.classList.remove('is-talking');
      if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;
      if (this.elements.stopBtn) this.elements.stopBtn.style.display = 'none';
      if (this.elements.input) {
        this.elements.input.disabled = false;
        setTimeout(() => this.elements.input.focus(), 50);
      }
      this.isGenerating = false;
    };

    this.isGenerating = true;
    this.elements.sendBtn.disabled = true;
    this.elements.input.disabled = true;
    if (this.elements.stopBtn) this.elements.stopBtn.style.display = 'inline-block';
    this.elements.header.classList.add('is-talking');
    this.elements.fab.classList.add('is-talking');

    // Typing indicator: 3 puntini animati per 380ms
    const typingMsg = document.createElement('div');
    typingMsg.className = 'nodo-msg nodo-msg--bot nodo-msg--typing';
    typingMsg.innerHTML = '<div class="nodo-typing-dots"><span>•</span><span>•</span><span>•</span></div>';
    this.elements.messages.appendChild(typingMsg);
    this.scrollToBottom();

    await new Promise(r => setTimeout(r, 380));
    typingMsg.remove();
    if (stale()) { releaseControls(); return; }

    // Crea subito il messaggio bot vuoto nel DOM con il cursore .nodo-cursor
    const botMsg = document.createElement('div');
    botMsg.className = 'nodo-msg nodo-msg--bot';


    const textNode = document.createElement('div');
    textNode.className = 'nodo-msg-text';
    textNode.innerHTML = '<span class="nodo-cursor" aria-hidden="true"></span>';
    botMsg.appendChild(textNode);

    this.elements.messages.appendChild(botMsg);
    this.scrollToBottom();

    let currentText = '';
    const onReset = () => {
      currentText = '';
      textNode.innerHTML = '<span class="nodo-cursor" aria-hidden="true"></span>';
    };
    const onChunk = (delta) => {
      if (stale()) return;
      currentText += delta;
      textNode.innerHTML = this.formatMarkdown(currentText) + '<span class="nodo-cursor" aria-hidden="true"></span>';
      this.scrollToBottom();
    };

    let res = null;
    try {
      if (!this.engine) {
        this.engine = await ChatEngine.create();
      }
      res = await this.engine.replyStream(text, this.history, onChunk, onReset);
    } catch (err) {
      console.error("[Nodo] Errore nello streaming:", err);
      if (!currentText) {
        currentText = "Si è verificato un errore momentaneo nella generazione della risposta.";
      }
    } finally {
      try {
        // Reset o cambio modalità durante la risposta: non scrivere nulla nella cronologia svuotata
        if (stale()) return;

        // Stop manuale: tieni il testo già arrivato (se c'è) e chiudi senza effetti collaterali
        if (res?.aborted) {
          if (currentText) {
            textNode.innerHTML = this.formatMarkdown(currentText);
            this.saveHistory('bot', currentText);
          } else {
            botMsg.remove();
          }
          return;
        }

        // 1. Rimuovi il cursore
        textNode.innerHTML = this.formatMarkdown(currentText);
        this.announce(currentText);

        // 2. Se c'è un'azione di deep-link (res.action), inserisci il pulsante di salto (target validato)
        if (res && res.action) {
          const linkHtml = this.actionLinkHtml(res.action);
          if (linkHtml) {
            const actionHtml = document.createElement('div');
            actionHtml.innerHTML = linkHtml;
            botMsg.appendChild(actionHtml.firstElementChild);
            this.scrollToBottom();
          }
        }

        // 3. Voice synthesis (TTS) se abilitata dall'utente
        if (this.voiceEnabled && currentText && !res?.isDeflection) {
          this.speakText(currentText);
        }

        // 4. Rich Media: Audio player per Locanda o Video spot per Union
        const qLower = text.toLowerCase();
        if (res?.action?.type === 'audio_locanda' || qLower.includes('jingle') || qLower.includes('canzon') || (qLower.includes('locanda') && (qLower.includes('audio') || qLower.includes('music')))) {
          this.renderAudioPlayer(botMsg);
        } else if (res?.action?.type === 'video_union' || qLower.includes('spot') || qLower.includes('alpaca') || qLower.includes('asino') || (qLower.includes('union') && qLower.includes('video'))) {
          this.renderVideoSpotPicker(botMsg);
        }

        // 4b. Evoluzioni Interattive: Tour, Concept, Dossier, Shader FX
        if (res?.action?.type === 'tour_start' || qLower.includes('tour') || qLower.includes('giro del sito') || qLower.includes('visita guidata')) {
          setTimeout(() => this.startStudioTour(), 400);
        } else if (res?.action?.type === 'concept_start' || qLower.includes('concept') || qLower.includes('ideare uno spot') || qLower.includes('idea video')) {
          setTimeout(() => this.startConceptLab(), 400);
        } else if (res?.action?.type === 'dossier_show' || qLower.includes('dossier') || qLower.includes('scheda progetto')) {
          setTimeout(() => this.generateDossierCard(), 400);
        } else if (res?.action?.type === 'shader_glitch' || qLower.includes('glitch')) {
          this.triggerShaderGlitch(false);
        } else if (res?.action?.type === 'shader_scene' || qLower.includes('cambia scena')) {
          this.cycleShaderScene(false);
        } else if (res?.action?.type === 'shader_speed' || qLower.includes('calma shader') || qLower.includes('turbo shader')) {
          if (qLower.includes('calma') || qLower.includes('rallenta')) this.setShaderSpeed(0.25, 'Calma', false);
          else this.setShaderSpeed(2.5, 'Turbo', false);
        }

        // 5. Se res.isDeflection, applica l'animazione di scuotimento/deflection
        if (res && res.isDeflection) {
          this.elements.win.classList.add('is-deflection');
          setTimeout(() => this.elements.win.classList.remove('is-deflection'), 400);
        }

        // 6. Salva la cronologia completa in sessionStorage
        this.saveHistory('bot', currentText, res?.action || null);

        // 7. Lead Capture automatico per intento 'contact'
        if (res?.leadCapture === true && !res?.isDeflection) {
          setTimeout(() => {
            const leadMsg = document.createElement('div');
            leadMsg.className = 'nodo-msg nodo-msg--bot nodo-msg--lead';
            leadMsg.innerHTML = `
              <div class="nodo-msg-text">📋 Vuoi configurare il brief adesso in 3 tocchi veloci qui in chat o preferisci aprire il modulo sul sito?</div>
              <div class="nodo-msg-action" style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                <button class="nodo-lead-cta nodo-lead-wizard-btn" type="button">⚡ Configura in 3 tocchi</button>
                <button class="nodo-lead-cta nodo-lead-direct-btn" type="button" style="background:transparent; color:var(--nodo-em-bright); border:1px solid var(--nodo-border);">Apri modulo →</button>
              </div>
            `;
            leadMsg.querySelector('.nodo-lead-wizard-btn').addEventListener('click', () => {
              leadMsg.remove();
              this.startBriefWizard();
            });
            leadMsg.querySelector('.nodo-lead-direct-btn').addEventListener('click', () => {
              if (window.innerWidth <= 640) this.close();
              const brief = document.querySelector('#brief');
              if (brief) brief.scrollIntoView({ behavior: 'smooth' });
              this.saveHistory('bot', '[Lead CTA: utente ha aperto il modulo brief]');
            });
            this.elements.messages.appendChild(leadMsg);
            this.scrollToBottom();
          }, 800);
        }
      } catch (innerErr) {
        console.error("[Nodo] Errore nel post-processing del messaggio:", innerErr);
      } finally {
        // 5. Rimuovi .is-talking e riabilita tassativamente i controlli
        releaseControls();
      }
    }
  }

  appendUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'nodo-msg nodo-msg--user';
    msg.textContent = text;
    this.elements.messages.appendChild(msg);
    this.scrollToBottom();
    this.saveHistory('user', text);

    // Mini Analytics in localStorage
    try {
      const stats = JSON.parse(localStorage.getItem('nodo_stats') || '{"queries":0,"topics":{}}');
      stats.queries++;
      // keyword semplici per topic
      const topicKeys = {
        union: 'union energia', eso: 'esoscheletro', cets: 'cets', locanda: 'locanda', cdi: 'cdi infissi',
        contact: 'contatto', tools: 'strumenti'
      };
      for (const [key, label] of Object.entries(topicKeys)) {
        if (text.toLowerCase().includes(key)) {
          stats.topics[label] = (stats.topics[label] || 0) + 1;
        }
      }
      localStorage.setItem('nodo_stats', JSON.stringify(stats));
      if (stats.queries % 5 === 0) console.info('[Nodo Analytics] Statistiche visitatori:', stats);
    } catch (e) {}
  }

  formatMarkdown(text) {
    // Formattatore markdown minimale e sicuro (solo grassetto, corsivo e a capo)
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  appendBotMessage(text, action = null) {
    const msg = document.createElement('div');
    msg.className = 'nodo-msg nodo-msg--bot';
    let html = `<div class="nodo-msg-text">${this.formatMarkdown(text)}</div>`;
    if (action) html += this.actionLinkHtml(action);
    msg.innerHTML = html;
    this.elements.messages.appendChild(msg);
    this.scrollToBottom();
    this.saveHistory('bot', text, action);
    this.announce(text);
  }

  scrollToBottom() {
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  saveHistory(role, text, action = null) {
    this.history.push({ role, text, action });
    if (this.history.length > 20) this.history.shift();
    try {
      sessionStorage.setItem('nodo_chat_history', JSON.stringify(this.history));
    } catch (e) {
      console.warn("[Nodo] Impossibile salvare la cronologia in sessionStorage:", e);
    }
  }

  /* ── Conversational Brief Wizard ───────────────────────────────── */
  startBriefWizard() {
    this.briefState = {
      project_type: null,
      project_label: '',
      channels: null,
      channels_label: '',
      timing: null,
      timing_label: ''
    };

    const step1Msg = document.createElement('div');
    step1Msg.className = 'nodo-msg nodo-msg--bot nodo-msg--brief-wizard';
    step1Msg.innerHTML = `
      <div class="nodo-msg-text">🎯 <b>Passo 1 di 3:</b> Che tipo di progetto hai in mente?</div>
      <div class="nodo-wizard-chips">
        <button class="nodo-wiz-btn" data-val="video" data-label="Video &amp; Spot AI" type="button">🎬 Video &amp; Spot AI</button>
        <button class="nodo-wiz-btn" data-val="grafica" data-label="Grafica &amp; Identità" type="button">🎨 Grafica &amp; Identità</button>
        <button class="nodo-wiz-btn" data-val="siti" data-label="Sito Web Statico" type="button">🌐 Sito Web Statico</button>
        <button class="nodo-wiz-btn" data-val="jingle" data-label="Jingle &amp; Audio" type="button">🎵 Jingle &amp; Audio</button>
        <button class="nodo-wiz-btn" data-val="ai" data-label="Pipeline AI su misura" type="button">⚡ Pipeline AI su misura</button>
      </div>
    `;

    step1Msg.querySelectorAll('.nodo-wiz-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.briefState.project_type = btn.dataset.val;
        this.briefState.project_label = btn.dataset.label;
        step1Msg.querySelectorAll('.nodo-wiz-btn').forEach(b => b.disabled = true);
        btn.classList.add('is-selected');
        this.askBriefStep2();
      });
    });

    this.elements.messages.appendChild(step1Msg);
    this.scrollToBottom();
  }

  askBriefStep2() {
    setTimeout(() => {
      const step2Msg = document.createElement('div');
      step2Msg.className = 'nodo-msg nodo-msg--bot nodo-msg--brief-wizard';
      step2Msg.innerHTML = `
        <div class="nodo-msg-text">📡 <b>Passo 2 di 3:</b> Qual è il canale principale di diffusione?</div>
        <div class="nodo-wizard-chips">
          <button class="nodo-wiz-btn" data-val="social" data-label="Social (Reels/Feed)" type="button">📱 Social (Reels/Feed)</button>
          <button class="nodo-wiz-btn" data-val="web" data-label="Web o Landing" type="button">🖥️ Web o Landing</button>
          <button class="nodo-wiz-btn" data-val="advertising" data-label="Advertising / Ads" type="button">📢 Advertising / Ads</button>
          <button class="nodo-wiz-btn" data-val="multiple" data-label="Più canali" type="button">🌐 Più canali</button>
        </div>
      `;

      step2Msg.querySelectorAll('.nodo-wiz-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.briefState.channels = [btn.dataset.val];
          this.briefState.channels_label = btn.dataset.label;
          step2Msg.querySelectorAll('.nodo-wiz-btn').forEach(b => b.disabled = true);
          btn.classList.add('is-selected');
          this.askBriefStep3();
        });
      });

      this.elements.messages.appendChild(step2Msg);
      this.scrollToBottom();
    }, 350);
  }

  askBriefStep3() {
    setTimeout(() => {
      const step3Msg = document.createElement('div');
      step3Msg.className = 'nodo-msg nodo-msg--bot nodo-msg--brief-wizard';
      step3Msg.innerHTML = `
        <div class="nodo-msg-text">⏳ <b>Passo 3 di 3:</b> Che tempistiche hai a disposizione?</div>
        <div class="nodo-wizard-chips">
          <button class="nodo-wiz-btn" data-val="date" data-label="Breve termine (&lt; 3 sett.)" type="button">⚡ Breve termine (&lt; 3 sett.)</button>
          <button class="nodo-wiz-btn" data-val="flexible" data-label="Data flessibile" type="button">🗓️ Data flessibile</button>
          <button class="nodo-wiz-btn" data-val="unknown" data-label="Da definire insieme" type="button">💡 Da definire insieme</button>
        </div>
      `;

      step3Msg.querySelectorAll('.nodo-wiz-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.briefState.timing = btn.dataset.val;
          this.briefState.timing_label = btn.dataset.label;
          step3Msg.querySelectorAll('.nodo-wiz-btn').forEach(b => b.disabled = true);
          btn.classList.add('is-selected');
          this.showBriefSummaryCard();
        });
      });

      this.elements.messages.appendChild(step3Msg);
      this.scrollToBottom();
    }, 350);
  }

  showBriefSummaryCard() {
    setTimeout(() => {
      const cardMsg = document.createElement('div');
      cardMsg.className = 'nodo-msg nodo-msg--bot nodo-brief-card-wrapper';
      cardMsg.innerHTML = `
        <div class="nodo-brief-card">
          <div class="nodo-brief-header">
            <span class="nodo-brief-icon">📋</span>
            <b>RIEPILOGO BRIEF CONFIGURATO</b>
          </div>
          <div class="nodo-brief-rows">
            <div class="nodo-brief-row">
              <span class="lbl">Progetto:</span>
              <span class="val">${this.briefState.project_label}</span>
            </div>
            <div class="nodo-brief-row">
              <span class="lbl">Canale:</span>
              <span class="val">${this.briefState.channels_label}</span>
            </div>
            <div class="nodo-brief-row">
              <span class="lbl">Tempistica:</span>
              <span class="val">${this.briefState.timing_label}</span>
            </div>
          </div>
          <button class="nodo-brief-submit-cta" type="button">
            🚀 Trasferisci al modulo e completa (1 Clic) &rarr;
          </button>
        </div>
      `;

      cardMsg.querySelector('.nodo-brief-submit-cta').addEventListener('click', () => {
        const briefData = {
          detail: {
            project_type: this.briefState.project_type,
            channels: this.briefState.channels,
            timing: this.briefState.timing
          }
        };
        document.dispatchEvent(new CustomEvent('nous:fill-brief', briefData));
        document.dispatchEvent(new CustomEvent('nodo:fill-brief', briefData));
        if (window.innerWidth <= 640) this.close();
        const brief = document.querySelector('#brief');
        if (brief) brief.scrollIntoView({ behavior: 'smooth' });
        this.saveHistory('bot', `[Brief configurato: ${this.briefState.project_label}, ${this.briefState.channels_label}, ${this.briefState.timing_label}]`);
      });

      this.elements.messages.appendChild(cardMsg);
      this.scrollToBottom();
    }, 400);
  }

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    try {
      localStorage.setItem('nous_voice_enabled', this.voiceEnabled ? '1' : '0');
    } catch (e) {}

    if (this.elements.voiceBtn) {
      this.elements.voiceBtn.classList.toggle('is-active', this.voiceEnabled);
      this.elements.voiceBtn.setAttribute('aria-pressed', String(this.voiceEnabled));
      this.elements.voiceBtn.title = this.voiceEnabled
        ? "Voce Neurale Femminile Nous HD (Attiva - Clicca per silenziare)"
        : "Voce di regia Nous (Attiva/Disattiva)";
    }

    if (!this.voiceEnabled) {
      this.stopSpeaking();
      this.showToast('Voce di Nous disattivata', false, 1800);
    } else {
      this.showToast('Voce Neurale Femminile Attiva 🎙️ (Elsa HD Studio)', false, 2000);
      this.speakText("Voce di regia attiva. Sono pronta ad ascoltarti o a leggere le risposte.");
    }
  }

  stopSpeaking() {
    if (this.ttsAudio) {
      try {
        this.ttsAudio.pause();
        this.ttsAudio.currentTime = 0;
      } catch (e) {}
      this.ttsAudio = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.elements.header?.classList.remove('is-speaking');
    this.elements.fab?.classList.remove('is-speaking');
  }

  cleanTextForSpeech(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/•/g, ', ')
      .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, '') // Rimuove emoji per non storpiare la pronuncia
      .replace(/https?:\/\/\S+/g, '') // Rimuove URL grezzi
      .replace(/[#_`~|><]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async speakText(text) {
    if (!this.voiceEnabled) return;
    this.stopSpeaking();

    const clean = this.cleanTextForSpeech(text);
    if (!clean) return;

    // Se il testo è molto lungo, taglia in corrispondenza dell'ultimo punto prima di 400 caratteri
    let speechText = clean;
    if (clean.length > 400) {
      const cut = clean.slice(0, 390);
      const lastPunct = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'), cut.lastIndexOf(';'));
      speechText = (lastPunct > 120 ? cut.slice(0, lastPunct + 1) : cut) + '...';
    }

    // Feedback visivo immediato (equalizzatore in header e glow su FAB)
    this.elements.header?.classList.add('is-speaking');
    this.elements.fab?.classList.add('is-speaking');

    // Livello 1: Sintesi Neurale Edge TTS HD (24kHz, prosodia umana, intonazione cinematografica femminile)
    const ttsEndpoint = CONFIG.tts?.endpoint || '/api/tts';
    const voiceName = CONFIG.tts?.defaultVoice || 'it-IT-ElsaNeural';
    let ttsSuccess = false;

    if (ttsEndpoint) {
      // Il server locale (serve.py) espone /api/tts solo in GET: il testo resta in querystring ma su localhost.
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 4500);
      this._ttsTimer = timeoutId;
      try {
        const url = `${ttsEndpoint}?text=${encodeURIComponent(speechText)}&voice=${encodeURIComponent(voiceName)}`;
        const resp = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timeoutId);

        if (resp.ok && (resp.headers.get('content-type') || '').includes('audio')) {
          const blob = await resp.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.ttsAudio = audio;

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.stopSpeaking();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            this.ttsAudio = null;
            this.fallbackBrowserSpeech(speechText);
          };
          await audio.play();
          ttsSuccess = true;
        }
      } catch (err) {
        ttsSuccess = false;
      } finally {
        clearTimeout(timeoutId); // il timeout viene sempre cancellato, anche in caso di errore
        if (this._ttsTimer === timeoutId) this._ttsTimer = null;
      }
    }

    // Livello 2: Fallback avanzato browser con prioritizzazione voci Naturali/Neurali Femminili
    if (!ttsSuccess) {
      this.fallbackBrowserSpeech(speechText);
    }
  }

  fallbackBrowserSpeech(speechText) {
    if (!('speechSynthesis' in window) || !this.voiceEnabled) {
      this.elements.header?.classList.remove('is-speaking');
      this.elements.fab?.classList.remove('is-speaking');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(speechText);
      utter.lang = 'it-IT';
      utter.rate = 0.98;
      utter.pitch = 1.05; // Tonalità leggermente più melodica per voce femminile naturale

      const allVoices = window.speechSynthesis.getVoices();
      const itVoices = allVoices.filter(v => v.lang && (v.lang.startsWith('it') || v.lang.replace('_', '-').startsWith('it')));

      if (itVoices.length > 0) {
        // Seleziona la voce femminile a più alta fedeltà neurale
        const scored = itVoices.map(v => {
          let score = 0;
          const name = (v.name || '').toLowerCase();
          if (name.includes('natural') || name.includes('neural')) score += 100;
          if (name.includes('online')) score += 80;
          // Priorità esplicita alle voci femminili italiane
          if (name.includes('elsa') || name.includes('isabella') || name.includes('alice') || name.includes('federica') || name.includes('elena') || name.includes('chiara') || name.includes('female') || name.includes('donna')) score += 90;
          if (name.includes('google') && !name.includes('male')) score += 60;
          if (v.localService === false) score += 40;
          // Penalizza voci maschili
          if (name.includes('cosimo') || name.includes('diego') || name.includes('giuseppe') || name.includes('luca') || name.includes('male')) score -= 60;
          if (name.includes('desktop') || name.includes('sapi')) score -= 40; // Penalizza vecchie voci robotiche
          return { voice: v, score };
        });
        scored.sort((a, b) => b.score - a.score);
        utter.voice = scored[0].voice;
      }

      utter.onstart = () => {
        this.elements.header?.classList.add('is-speaking');
        this.elements.fab?.classList.add('is-speaking');
      };
      utter.onend = () => {
        this.stopSpeaking();
      };
      utter.onerror = () => {
        this.stopSpeaking();
      };

      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('[Nous] Errore fallback speech synthesis:', e);
      this.stopSpeaking();
    }
  }

  setupSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      if (this.elements.micBtn) {
        this.elements.micBtn.style.opacity = '0.4';
        this.elements.micBtn.title = 'Dettatura non supportata in questo browser';
      }
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'it-IT';
    recognition.continuous = false;
    recognition.interimResults = true;

    const defaultPlaceholder = this.elements.input.placeholder;
    let isListening = false;
    let heardSpeech = false; // true solo se questa sessione ha davvero ricevuto voce
    let micError = false;
    this.elements.micBtn.addEventListener('click', () => {
      if (isListening) {
        recognition.stop();
        return;
      }
      if (this.isGenerating) return;
      heardSpeech = false;
      micError = false;
      try {
        recognition.start();
      } catch (err) {
        console.warn('[Nous] Errore start SpeechRecognition:', err);
        this.isDictating = false;
        this.showToast('Non riesco ad avviare il microfono. Riprova tra un attimo o scrivi la domanda.');
      }
    });

    recognition.onstart = () => {
      isListening = true;
      this.isDictating = true;
      this.elements.micBtn.classList.add('is-listening');
      this.elements.input.placeholder = "Ascolto... parla pure in italiano";
    };

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      if (transcript.trim()) heardSpeech = true;
      this.elements.input.value = transcript;
    };

    recognition.onend = () => {
      isListening = false;
      this.isDictating = false;
      this.elements.micBtn.classList.remove('is-listening');
      this.elements.input.placeholder = defaultPlaceholder;
      // Invia solo se il testo arriva dalla dettatura, mai quello scritto a mano
      const query = this.elements.input.value.trim();
      if (heardSpeech && !micError && query && !this.isGenerating) {
        this.handleUserQuery(query);
      }
      heardSpeech = false;
    };

    recognition.onerror = (ev) => {
      micError = true;
      isListening = false;
      this.isDictating = false;
      this.elements.micBtn.classList.remove('is-listening');
      this.elements.input.placeholder = defaultPlaceholder;
      const code = ev && ev.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        this.showToast('Microfono bloccato: consenti l’accesso al microfono nelle impostazioni del browser per dettare.');
      } else if (code === 'no-speech') {
        this.showToast('Non ho sentito nulla. Riprova a parlare più vicino al microfono.');
      } else if (code === 'audio-capture') {
        this.showToast('Non trovo nessun microfono collegato.');
      } else if (code === 'network') {
        this.showToast('La dettatura ha bisogno di connessione. Riprova oppure scrivi la domanda.');
      } else if (code !== 'aborted') {
        this.showToast('Dettatura non riuscita. Puoi scrivere la domanda qui sotto.');
      }
    };
  }

  renderSlashMenu(filterText = '') {
    const q = filterText.toLowerCase().trim();
    const matched = this.slashCommands.filter(c => c.cmd.startsWith(q) || c.desc.toLowerCase().includes(q.replace('/', '')));

    if (!matched.length) {
      this.hideSlashMenu();
      return;
    }

    this.slashIndex = 0;
    this.elements.slashMenu.innerHTML = matched.map((c, i) => `
      <button class="nodo-slash-item ${i === 0 ? 'is-selected' : ''}" type="button" data-cmd="${c.cmd}">
        <span class="nodo-slash-cmd">${c.cmd}</span>
        <span class="nodo-slash-desc">${c.desc}</span>
      </button>
    `).join('');

    this.elements.slashMenu.style.display = 'flex';
    if (this.elements.slashBtn) {
      this.elements.slashBtn.classList.add('is-active');
    }

    this.elements.slashMenu.querySelectorAll('.nodo-slash-item').forEach((item) => {
      item.addEventListener('click', () => {
        const cmd = item.getAttribute('data-cmd');
        this.hideSlashMenu();
        this.elements.input.value = '';
        const found = this.slashCommands.find(c => c.cmd === cmd);
        if (found) found.run();
      });
    });
  }

  hideSlashMenu() {
    if (this.elements.slashMenu) {
      this.elements.slashMenu.style.display = 'none';
      this.elements.slashMenu.innerHTML = '';
    }
    if (this.elements.slashBtn) {
      this.elements.slashBtn.classList.remove('is-active');
    }
  }

  highlightSlashItem(items) {
    items.forEach((it, idx) => {
      it.classList.toggle('is-selected', idx === this.slashIndex);
    });
  }

  async cyclePalette() {
    try {
      const { applica, palettaAttiva, PALETTE } = await import('../palette.js' + (document.querySelector('script[src*="app.js"]')?.src.match(/\?.*$/)?.[0] || ''));
      const keys = Object.keys(PALETTE);
      const current = palettaAttiva();
      const currentIdx = keys.indexOf(current);
      const nextKey = keys[(currentIdx + 1) % keys.length];
      applica(nextKey, true);
      const p = PALETTE[nextKey];
      this.appendBotMessage(`🎨 Ho impostato la palette su **${p.nome}** (${p.nota}). Ti piace questa atmosfera?`);
      if (this.voiceEnabled) this.speakText(`Palette cambiata in ${p.nome}`);
    } catch (e) {
      console.warn('[Nous] Errore cambio palette:', e);
      this.appendBotMessage('Puoi cambiare i colori del sito tenendo premuto su qualsiasi riquadro della pagina!');
    }
  }

  /* ── 1. Tour Guidato di Regia (Modalità Automatica con Bubble Fluttuante dal Pallino) ── */
  startStudioTour() {
    this.clearTourTimer();
    this.tourState = {
      step: 0,
      autoDuration: 7, // 7 secondi per sala: tempo confortevole per guardare l'effetto e ascoltare
      timeLeft: 7,
      isPaused: false,
      timer: null,
      steps: [
        {
          num: '1/4',
          target: '#top',
          title: 'Sala 1: L\'Origine & Il Confine WebGL',
          desc: 'A ogni frame calcoliamo il confine fra mano e macchina in WebGL2 puro (zero librerie esterne). Guarda lo shader in azione o prova a distorcerlo!',
          speech: "Tappa 1. L'Origine e la moviola. Qui il confine tra mano e macchina è calcolato in tempo reale a ogni frame in WebGL.",
          actionText: '⚡ Prova Glitch',
          onAction: () => this.triggerShaderGlitch(false)
        },
        {
          num: '2/4',
          target: '#caso-union',
          title: 'Sala 2: Spot Video & Personaggi AI (Union Energia)',
          desc: '9 spot video completi per il format green con l\'alpaca Davide e l\'asino Luca, mantenuti coerenti tra ComfyUI e Premiere Pro senza set reale.',
          speech: "Tappa 2. Gli spot video AI per Union Energia. Nove episodi con l'alpaca Davide e l'asino Luca.",
          actionText: '🎬 Apri Spot 1',
          onAction: async () => {
            try {
              const { apriVideo } = await import('../video-lightbox.js');
              const { PEZZI } = await import('../union.js');
              apriVideo({ cartella: 'lavori/', pezzi: PEZZI, index: 1 });
            } catch (e) {}
          }
        },
        {
          num: '3/4',
          target: '#caso-eso',
          title: 'Sala 3: Hardware & Materia (Esoscheletro)',
          desc: 'Dalla telemetria bionica alla nuvola di 12.600 punti interattivi WebGL in OGL. Scene generate con GPT Image, sistemate in Photoshop e montate in Premiere Pro.',
          speech: "Tappa 3. Hardware e video di prodotto per l'esoscheletro, con la nuvola di punti WebGL.",
          actionText: '🔄 Vai a Esoscheletro',
          onAction: () => {
            const mSec = document.querySelector('#caso-eso');
            if (mSec) mSec.scrollIntoView({ behavior: 'smooth' });
          }
        },
        {
          num: '4/4',
          target: '#banchi',
          title: 'Sala 4: I Banchi di Lavoro & Contatto Diretto',
          desc: 'Quattro banchi per i formati di produzione e il modulo brief interattivo per stimare costi e tempi del tuo progetto.',
          speech: "Tappa 4. I banchi di lavoro e il brief interattivo per dare forma alle tue idee.",
          actionText: '📋 Avvia Brief',
          onAction: () => this.startBriefWizard()
        }
      ]
    };

    // Attiva styling di regia attiva sul pallino (glow e rotazione rapida)
    this.elements.fab?.classList.add('is-touring');

    // Chiude la finestra di Nous per lasciare lo schermo interamente visibile
    this.close({ preserveTour: true });

    // Renderizza la bolla fluttuante accanto al pallino chiuso
    this.renderTourStep(0);
  }

  clearTourTimer() {
    if (this.tourState?.timer) {
      clearInterval(this.tourState.timer);
      this.tourState.timer = null;
    }
  }

  startTourTimer(card, index) {
    this.clearTourTimer();
    if (!this.tourState) return;

    this.tourState.timeLeft = this.tourState.autoDuration || 7;
    this.tourState.isPaused = false;

    const timeLabel = card.querySelector('.nodo-tour-countdown-sec');
    const fillBar = card.querySelector('.nodo-tour-countdown-fill');

    if (fillBar) {
      fillBar.style.transition = 'none';
      fillBar.style.width = '100%';
      void fillBar.offsetWidth; // Force reflow
      fillBar.style.transition = `width ${this.tourState.autoDuration}s linear`;
      fillBar.style.width = '0%';
    }

    this.tourState.timer = setInterval(() => {
      if (!this.tourState) {
        this.clearTourTimer();
        return;
      }
      if (this.tourState.isPaused) return;

      this.tourState.timeLeft -= 1;
      if (timeLabel) {
        timeLabel.textContent = `${Math.max(0, this.tourState.timeLeft)}s`;
      }

      if (this.tourState.timeLeft <= 0) {
        this.clearTourTimer();
        if (index < this.tourState.steps.length - 1) {
          this.renderTourStep(index + 1);
        } else {
          this.finishStudioTour();
        }
      }
    }, 1000);
  }

  toggleTourPause(card) {
    if (!this.tourState) return;
    this.tourState.isPaused = !this.tourState.isPaused;
    const pauseBtn = card.querySelector('.nodo-tour-btn--pause');
    const fillBar = card.querySelector('.nodo-tour-countdown-fill');
    const statusText = card.querySelector('.nodo-tour-countdown-label');

    if (this.tourState.isPaused) {
      if (pauseBtn) {
        pauseBtn.innerHTML = `▶️ Riprendi`;
        pauseBtn.title = 'Riprendi auto-avanzamento';
      }
      if (statusText) statusText.textContent = 'Auto-tour in pausa:';
      if (fillBar) {
        const computedWidth = window.getComputedStyle(fillBar).width;
        fillBar.style.transition = 'none';
        fillBar.style.width = computedWidth;
      }
    } else {
      if (pauseBtn) {
        pauseBtn.innerHTML = `⏸️ Pausa`;
        pauseBtn.title = 'Metti in pausa';
      }
      if (statusText) statusText.textContent = 'Prossima sala tra:';
      if (fillBar) {
        fillBar.style.transition = `width ${this.tourState.timeLeft}s linear`;
        fillBar.style.width = '0%';
      }
    }
  }

  finishStudioTour() {
    this.clearTourTimer();
    this.elements.fab?.classList.remove('is-touring');

    if (this.tourBubble) {
      this.tourBubble.innerHTML = `
        <div class="nodo-tour-bubble-inner">
          <div class="nodo-tour-bubble-header">
            <span class="nodo-tour-step">🎬 TOUR COMPLETATO</span>
            <button class="nodo-tour-bubble-close" type="button" title="Chiudi" aria-label="Chiudi">✕</button>
          </div>
          <div class="nodo-tour-title">Hai esplorato tutte le 4 sale del portfolio!</div>
          <div class="nodo-tour-desc">Dall'origine WebGL agli spot AI, dalla materia ai banchi di lavoro. Da dove vuoi partire ora?</div>
          <div class="nodo-tour-nav" style="margin-top: 10px;">
            <button class="nodo-tour-btn nodo-tour-btn--action" id="nodo-bubble-brief-btn" type="button">📋 Avvia Brief</button>
            <button class="nodo-tour-btn nodo-tour-btn--next" id="nodo-bubble-open-chat" type="button">💬 Apri Nous</button>
            <button class="nodo-tour-btn nodo-tour-btn--stop" id="nodo-bubble-dismiss" type="button">Chiudi</button>
          </div>
        </div>
      `;

      this.tourBubble.querySelector('#nodo-bubble-brief-btn')?.addEventListener('click', () => {
        this.stopStudioTour(false);
        const brief = document.querySelector('#brief');
        if (brief) brief.scrollIntoView({ behavior: 'smooth' });
        this.startBriefWizard();
      });

      this.tourBubble.querySelector('#nodo-bubble-open-chat')?.addEventListener('click', () => {
        this.stopStudioTour(false);
        this.open();
      });

      this.tourBubble.querySelector('#nodo-bubble-dismiss')?.addEventListener('click', () => {
        this.stopStudioTour(false);
      });

      this.tourBubble.querySelector('.nodo-tour-bubble-close')?.addEventListener('click', () => {
        this.stopStudioTour(false);
      });
    }

    this.appendBotMessage("🎬 **Tour di regia completato!** Abbiamo esplorato l'origine WebGL, gli spot video AI, la materia e i banchi di lavoro.\n\nVuoi approfondire un progetto specifico o partire da un brief rapido in chat, con 3 domande?");
    if (this.voiceEnabled) {
      this.speakText("Tour di regia completato. Abbiamo attraversato tutte le sale. Da cosa vuoi partire?");
    }

    this.tourState = null;
  }

  stopStudioTour(notify = true) {
    this.clearTourTimer();
    this.elements.fab?.classList.remove('is-touring');
    if (this.tourBubble) {
      this.tourBubble.classList.add('is-closing');
      setTimeout(() => {
        this.tourBubble?.remove();
        this.tourBubble = null;
      }, 250);
    }
    if (notify) {
      this.showToast("Tour di regia terminato", false, 1800);
      this.saveHistory('bot', "Tour interrotto dall'utente.");
    }
    this.tourState = null;
  }

  renderTourStep(index) {
    if (!this.tourState) return;
    const current = this.tourState.steps[index];
    if (!current) return;
    this.tourState.step = index;

    // Scroll fluido alla sezione
    const targetEl = document.querySelector(current.target);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }

    // Crea o recupera la bolla fluttuante accanto al pallino
    if (!this.tourBubble) {
      this.tourBubble = document.createElement('div');
      this.tourBubble.className = 'nodo-tour-bubble';
      document.body.appendChild(this.tourBubble);
    }
    this.tourBubble.classList.remove('is-hidden', 'is-closing');

    const pct = ((index + 1) / this.tourState.steps.length) * 100;

    this.tourBubble.innerHTML = `
      <div class="nodo-tour-bubble-inner">
        <div class="nodo-tour-bubble-header">
          <div class="nodo-tour-bubble-meta">
            <span class="nodo-tour-step">🎬 TAPPA ${current.num}</span>
            <span class="nodo-tour-auto-badge" title="Auto-Tour attivo (7s per tappa)">
              <span class="nodo-tour-dot"></span> AUTO
            </span>
          </div>
          <div class="nodo-tour-bubble-actions">
            <div class="nodo-tour-progress-track">
              <div class="nodo-tour-progress-fill" style="width: ${pct}%;"></div>
            </div>
            <button class="nodo-tour-bubble-close" type="button" title="Esci dal tour" aria-label="Esci dal tour">✕</button>
          </div>
        </div>
        <div class="nodo-tour-title">${current.title}</div>
        <div class="nodo-tour-desc">${current.desc}</div>

        <div class="nodo-tour-countdown-wrap">
          <div class="nodo-tour-countdown-bar">
            <div class="nodo-tour-countdown-fill"></div>
          </div>
          <div class="nodo-tour-countdown-info">
            <span class="nodo-tour-countdown-label">Prossima sala tra:</span>
            <b class="nodo-tour-countdown-sec">7s</b>
          </div>
        </div>

        <div class="nodo-tour-nav">
          ${current.actionText ? `<button class="nodo-tour-btn nodo-tour-btn--action" type="button">${current.actionText}</button>` : ''}
          <button class="nodo-tour-btn nodo-tour-btn--pause" type="button" title="Metti in pausa auto-tour">⏸️ Pausa</button>
          ${index < this.tourState.steps.length - 1 ? `<button class="nodo-tour-btn nodo-tour-btn--next" type="button" title="Passa subito alla prossima sala">Salta ▶</button>` : `<button class="nodo-tour-btn nodo-tour-btn--next" type="button">🏁 Concludi</button>`}
          <button class="nodo-tour-btn nodo-tour-btn--chat" type="button" title="Apri la chat completa">💬 Chat</button>
        </div>
      </div>
    `;

    // Salva un appunto nella cronologia della chat
    this.saveHistory('bot', `[Tour - Tappa ${current.num}: ${current.title}] ${current.desc}`);

    if (current.actionText) {
      this.tourBubble.querySelector('.nodo-tour-btn--action')?.addEventListener('click', () => {
        if (this.tourState && !this.tourState.isPaused) {
          this.toggleTourPause(this.tourBubble);
        }
        current.onAction();
      });
    }

    const pauseBtn = this.tourBubble.querySelector('.nodo-tour-btn--pause');
    pauseBtn?.addEventListener('click', () => this.toggleTourPause(this.tourBubble));

    const nextBtn = this.tourBubble.querySelector('.nodo-tour-btn--next');
    nextBtn?.addEventListener('click', () => {
      this.clearTourTimer();
      if (index < this.tourState.steps.length - 1) {
        this.renderTourStep(index + 1);
      } else {
        this.finishStudioTour();
      }
    });

    const chatBtn = this.tourBubble.querySelector('.nodo-tour-btn--chat');
    chatBtn?.addEventListener('click', () => {
      this.open();
    });

    const closeBtn = this.tourBubble.querySelector('.nodo-tour-bubble-close');
    closeBtn?.addEventListener('click', () => {
      this.stopStudioTour(true);
    });

    if (this.voiceEnabled && current.speech) {
      this.speakText(current.speech);
    }

    // Avvia il countdown automatico
    this.startTourTimer(this.tourBubble, index);
  }

  /* ── 2. Controllo WebGL & Moviola Shader ────────────────────────── */
  triggerShaderGlitch(withMessage = true) {
    document.dispatchEvent(new CustomEvent('hero:glitch', { detail: { duration: 2200 } }));
    const heroEl = document.querySelector('#top');
    if (heroEl && heroEl.getBoundingClientRect().bottom < 0) {
      heroEl.scrollIntoView({ behavior: 'smooth' });
    }
    if (withMessage) {
      this.appendBotMessage("⚡ **Glitch WebGL attivato!** Ho iniettato un impulso di turbolenza nel confine umano/macchina dell'Hero.", {
        type: 'fx',
        label: 'Guarda lo shader in alto',
        target: '#top'
      });
      if (this.voiceEnabled) this.speakText("Impulso glitch inviato al motore grafico.");
    }
  }

  cycleShaderScene(withMessage = true) {
    document.dispatchEvent(new CustomEvent('hero:scene', {}));
    const heroEl = document.querySelector('#top');
    if (heroEl && heroEl.getBoundingClientRect().bottom < 0) {
      heroEl.scrollIntoView({ behavior: 'smooth' });
    }
    if (withMessage) {
      this.appendBotMessage("🖼️ **Scena WebGL aggiornata!** Ho ruotato la scena fotografica nell'Hero.", {
        type: 'fx',
        label: 'Guarda la nuova scena',
        target: '#top'
      });
      if (this.voiceEnabled) this.speakText("Scena fotografica commutata.");
    }
  }

  setShaderSpeed(multiplier, label, withMessage = true) {
    document.dispatchEvent(new CustomEvent('hero:speed', { detail: { multiplier } }));
    if (withMessage) {
      this.appendBotMessage(`⏱️ **Velocità shader impostata a ${multiplier}x (${label})**. Il rumore FBM e il ciclo di render ora scorrono a questa cadenza.`);
      if (this.voiceEnabled) this.speakText(`Velocità shader impostata su ${label}`);
    }
  }

  /* ── 3. Concept & Moodboard Lab ────────────────────────────────── */
  startConceptLab() {
    this.conceptState = { sector: null, tone: null };
    const step1 = document.createElement('div');
    step1.className = 'nodo-msg nodo-msg--bot';
    step1.innerHTML = `
      <div class="nodo-msg-text">💡 <b>Concept Lab di Regia:</b> Per quale settore o tipologia di attività vuoi ideare uno spot/video AI?</div>
      <div class="nodo-wizard-chips" style="margin-top:8px;">
        <button class="nodo-wiz-btn" data-sector="food" type="button">🍷 Food &amp; Ristorazione</button>
        <button class="nodo-wiz-btn" data-sector="tech" type="button">⚡ Tech, Software &amp; AI</button>
        <button class="nodo-wiz-btn" data-sector="manuf" type="button">🏭 Artigianato &amp; Industria</button>
        <button class="nodo-wiz-btn" data-sector="turism" type="button">🌲 Turismo &amp; Territorio</button>
      </div>
    `;

    step1.querySelectorAll('.nodo-wiz-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.conceptState.sector = btn.dataset.sector;
        step1.querySelectorAll('.nodo-wiz-btn').forEach(b => b.disabled = true);
        btn.classList.add('is-selected');
        this.askConceptTone();
      });
    });

    this.elements.messages.appendChild(step1);
    this.scrollToBottom();
  }

  askConceptTone() {
    setTimeout(() => {
      const step2 = document.createElement('div');
      step2.className = 'nodo-msg nodo-msg--bot';
      step2.innerHTML = `
        <div class="nodo-msg-text">🎨 Che <b>tono di voce visivo</b> desideri trasmettere?</div>
        <div class="nodo-wizard-chips" style="margin-top:8px;">
          <button class="nodo-wiz-btn" data-tone="epic" type="button">🎬 Cinematografico &amp; Epico</button>
          <button class="nodo-wiz-btn" data-tone="ironic" type="button">😄 Ironico &amp; Pop (stile Union)</button>
          <button class="nodo-wiz-btn" data-tone="minimal" type="button">🌿 Intimo &amp; Documentaristico</button>
        </div>
      `;

      step2.querySelectorAll('.nodo-wiz-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.conceptState.tone = btn.dataset.tone;
          step2.querySelectorAll('.nodo-wiz-btn').forEach(b => b.disabled = true);
          btn.classList.add('is-selected');
          this.generateConceptOutput();
        });
      });

      this.elements.messages.appendChild(step2);
      this.scrollToBottom();
    }, 300);
  }

  generateConceptOutput() {
    const { sector, tone } = this.conceptState;
    const presets = {
      'food_epic': {
        title: "La Fiamma e la Materia (Food & Wine)",
        hook: "Macro a 120fps su gocce d'olio che incontrano una brace rovente, fumo dorato controluce volumetrico, stacco netto al piatto finito.",
        prompt: "Ultra-photorealistic close-up cinematography, glowing charcoal ember, olive oil droplet sizzles in slow motion, shallow depth of field, anamorphic flare, Kodak Vision3 500T, cinematic color grade --ar 16:9",
        sound: "Basso cupo profondo, suono foley iper-definito del crepitio e violoncello intimo."
      },
      'food_ironic': {
        title: "Il Critico Inatteso (Ristorazione)",
        hook: "Un animale insolito (es. un gufo con gli occhiali) osserva serissimo un piatto gourmet ed esclama un verdetto fulmineo prima di assaggiare.",
        prompt: "Photorealistic anthropomorphic owl wearing small tortoiseshell spectacles inspecting a gourmet pasta dish on a rustic wooden table, cinematic lighting, humorous dramatic expression, high detail --ar 9:16",
        sound: "Pizzicato d'archi comico, voce fuori campo profonda in stile documentario della BBC."
      },
      'tech_epic': {
        title: "Il Respiro dell'Algoritmo (Tech & AI)",
        hook: "Filamenti di luce neon smeraldo pulsano attraverso un circuito in titanio, trasformandosi in una mano robotica che sfiora una pianta reale.",
        prompt: "Futuristic bionic titanium robotic hand gently touching organic green moss in dark minimal studio, emerald luminescence, raytraced reflections, Unreal Engine 5 aesthetic, 8k cinematic shot --ar 16:9",
        sound: "Glitch sintetico modulare, sub-bass sweep potente e transizione morbida su pianoforte acustico."
      },
      'default': {
        title: "Identità & Impulso Visivo",
        hook: "Inquadratura simmetrica a campo largo, luce di taglio che svela il gesto artigianale prima del reveal del marchio.",
        prompt: "Cinematic medium shot of an artisan workshop, volumetric dust particles in natural light beam, warm earthy tones, ARRI Alexa LF, clean composition, high-end commercial aesthetic --ar 16:9",
        sound: "Texture organica di ambiente, ritmo incalzante a crescendo per i titoli finali."
      }
    };

    const key = `${sector}_${tone}`;
    const concept = presets[key] || presets[`${sector}_epic`] || presets['default'];

    setTimeout(() => {
      const card = document.createElement('div');
      card.className = 'nodo-msg nodo-msg--bot nodo-concept-wrapper';
      card.innerHTML = `
        <div class="nodo-concept-card">
          <div class="nodo-concept-badge">💡 SCHEDA CONCEPT VIDEO</div>
          <div class="nodo-concept-title">${concept.title}</div>
          
          <div class="nodo-concept-block">
            <div class="nodo-concept-block-label">🎯 Gancio Visivo (0-3s)</div>
            <div class="nodo-concept-block-text">${concept.hook}</div>
          </div>

          <div class="nodo-concept-block">
            <div class="nodo-concept-block-label">🤖 Prompt Video (ComfyUI / LTX)</div>
            <div class="nodo-concept-prompt-box">
              <div class="nodo-concept-prompt-code">${concept.prompt}</div>
            </div>
          </div>

          <div class="nodo-concept-block">
            <div class="nodo-concept-block-label">🎵 Sound Design &amp; Voce</div>
            <div class="nodo-concept-block-text">${concept.sound}</div>
          </div>

          <button class="nodo-concept-cta" type="button">
            🚀 Trasferisci al Brief (Auto-compila) &rarr;
          </button>
        </div>
      `;

      card.querySelector('.nodo-concept-cta').addEventListener('click', () => {
        const briefData = {
          detail: {
            project_type: 'video',
            channels: ['social'],
            timing: 'flexible',
            note: `Concept ideato con Nous: "${concept.title}"\nHook: ${concept.hook}\nPrompt suggerito: ${concept.prompt}`
          }
        };
        document.dispatchEvent(new CustomEvent('nous:fill-brief', briefData));
        document.dispatchEvent(new CustomEvent('nodo:fill-brief', briefData));
        if (window.innerWidth <= 640) this.close();
        const brief = document.querySelector('#brief');
        if (brief) brief.scrollIntoView({ behavior: 'smooth' });
        this.saveHistory('bot', `[Concept trasferito al brief: ${concept.title}]`);
      });

      this.elements.messages.appendChild(card);
      this.scrollToBottom();
      this.saveHistory('bot', `Concept generato: ${concept.title}`);
      if (this.voiceEnabled) this.speakText(`Ho elaborato il concept: ${concept.title}. Puoi trasferirlo direttamente al brief o copiare il prompt.`);
    }, 350);
  }

  /* ── 4. Dossier & Export Card ──────────────────────────────────── */
  generateDossierCard() {
    const brief = this.briefState || {};
    const proj = brief.project_label || 'Da definire (Video / AI / Web)';
    const chan = brief.channels_label || 'Social & Web';
    const time = brief.timing_label || 'Flessibile / Da concordare';

    const dossierText = `--- DOSSIER DI PRODUZIONE F/AI ---
Progetto: ${proj}
Canali previsti: ${chan}
Tempistiche indicative: ${time}
Referente: Fabrizio Mana (fabriziomana@gmail.com)
Portfolio: https://ivelsefila.github.io/f-ai-site/v2/index.html
Data: ${new Date().toLocaleDateString('it-IT')}
----------------------------------`;

    const mailSubject = encodeURIComponent(`Richiesta Collaborazione: ${proj}`);
    const mailBody = encodeURIComponent(`Ciao Fabrizio,\n\nHo esplorato il tuo portfolio F/AI con Nous e vorrei discutere del seguente progetto:\n\n${dossierText}\n\nResto in attesa di un riscontro.\nGrazie!`);
    const mailUrl = `mailto:fabriziomana@gmail.com?subject=${mailSubject}&body=${mailBody}`;

    const card = document.createElement('div');
    card.className = 'nodo-msg nodo-msg--bot nodo-dossier-wrapper';
    card.innerHTML = `
      <div class="nodo-dossier-card">
        <div class="nodo-dossier-header">
          <b>📋 SCHEDA DOSSIER DI PRODUZIONE</b>
          <span style="font-family:var(--nodo-font-mono); font-size:10px; color:var(--nodo-muted);">${new Date().toLocaleDateString('it-IT')}</span>
        </div>
        <div class="nodo-dossier-row">
          <span class="lbl">Tipologia:</span>
          <span class="val">${proj}</span>
        </div>
        <div class="nodo-dossier-row">
          <span class="lbl">Canali:</span>
          <span class="val">${chan}</span>
        </div>
        <div class="nodo-dossier-row">
          <span class="lbl">Tempistiche:</span>
          <span class="val">${time}</span>
        </div>
        <div class="nodo-dossier-actions">
          <button class="nodo-dossier-btn nodo-dossier-btn--copy" type="button">📋 Copia Scheda</button>
          <a class="nodo-dossier-btn nodo-dossier-btn--mail" href="${mailUrl}">✉️ Invia Mail a Fabrizio</a>
        </div>
      </div>
    `;

    card.querySelector('.nodo-dossier-btn--copy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(dossierText);
        this.showToast('📋 Scheda copiata negli appunti!', false, 2500);
      } catch (err) {
        this.showToast('Seleziona e copia il testo del dossier.', true, 2000);
      }
    });

    this.elements.messages.appendChild(card);
    this.scrollToBottom();
    this.saveHistory('bot', `[Dossier generato: ${proj}]`);
    if (this.voiceEnabled) this.speakText("Ho preparato la scheda del tuo dossier. Puoi copiarla negli appunti o inviarla direttamente via email.");
  }

  detectCurrentSection() {
    const sections = [
      { id: 'caso-union', name: 'Union Energia', prompt: 'Posso mostrarti i 9 spot o raccontarti come sono nati.' },
      { id: 'caso-eso', name: 'Esoscheletro (Human Robots)', prompt: 'Vuoi vedere come è stato raccontato il lancio di un esoscheletro, con il giro a 360° del dispositivo?' },
      { id: 'caso-locanda', name: 'La Locanda del Castello', prompt: 'Vuoi ascoltare uno dei 5 brani creati con Lyria o vedere le locandine animate?' },
      { id: 'caso-cest', name: 'Studio CETS', prompt: 'Posso raccontarti il marchio rifatto e i 6 video per lo studio.' },
      { id: 'caso-cdi', name: 'CDI Infissi', prompt: 'Vuoi sapere come è fatto il sito con il catalogo QFORT?' },
      { id: 'strumenti', name: 'Strumenti & AI Stack', prompt: 'Posso dirti quali strumenti uso e per cosa.' },
      { id: 'banchi', name: 'I Banchi di Lavoro', prompt: 'Posso orientarti tra i servizi (video, grafica, web app o jingle).' },
      { id: 'brief', name: 'Modulo Brief', prompt: 'Il questionario sul sito ha 6 domande. Se preferisci, ne facciamo una versione rapida qui in chat, con 3 domande.' }
    ];

    const vh = window.innerHeight || 800;
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= vh * 0.65 && rect.bottom >= vh * 0.25) {
          return s;
        }
      }
    }
    return null;
  }

  renderAudioPlayer(container) {
    if (container.querySelector('.nodo-audio-card')) return;
    const tracks = [
      { id: 'the-shared-table', t: 'The Shared Table', n: 'La tavola lunga, quella delle sere piene', file: 'locanda/the-shared-table.m4a' },
      { id: 'copper-and-stone', t: 'Copper and Stone', n: 'Rame e pietra: la cucina e i muri', file: 'locanda/copper-and-stone.m4a' },
      { id: 'salt-and-golden-light', t: 'Salt and Golden Light', n: 'Il tardo pomeriggio prima del servizio', file: 'locanda/salt-and-golden-light.m4a' }
    ];

    const card = document.createElement('div');
    card.className = 'nodo-audio-card';
    card.innerHTML = `
      <div class="nodo-audio-header">
        <span class="nodo-audio-title">🎵 Jingle Lyria Originale</span>
        <span class="nodo-audio-duration">0:30 • Master M4A</span>
      </div>
      <div class="nodo-audio-controls">
        <button class="nodo-audio-play" type="button" aria-label="Riproduci jingle">
          <svg class="icon-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <svg class="icon-pause" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </button>
        <div class="nodo-audio-bar-wrap">
          <div class="nodo-audio-note">${tracks[0].t} — ${tracks[0].n}</div>
          <div class="nodo-audio-track">
            <div class="nodo-audio-progress"></div>
          </div>
        </div>
      </div>
      <audio preload="none" src="${tracks[0].file}"></audio>
    `;

    const audio = card.querySelector('audio');
    const playBtn = card.querySelector('.nodo-audio-play');
    const playIcon = card.querySelector('.icon-play');
    const pauseIcon = card.querySelector('.icon-pause');
    const progress = card.querySelector('.nodo-audio-progress');

    playBtn.addEventListener('click', () => {
      if (this.currentAudio && this.currentAudio !== audio) {
        this.currentAudio.pause();
      }
      if (audio.paused) {
        audio.play().catch(() => {});
        this.currentAudio = audio;
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'inline-block';
      } else {
        audio.pause();
        playIcon.style.display = 'inline-block';
        pauseIcon.style.display = 'none';
      }
    });

    audio.addEventListener('timeupdate', () => {
      const pct = (audio.currentTime / (audio.duration || 30)) * 100;
      progress.style.width = pct + '%';
    });

    audio.addEventListener('ended', () => {
      playIcon.style.display = 'inline-block';
      pauseIcon.style.display = 'none';
      progress.style.width = '0%';
    });

    container.appendChild(card);
    this.scrollToBottom();
  }

  renderVideoSpotPicker(container) {
    if (container.querySelector('.nodo-spot-grid')) return;
    const spots = [
      { id: 'davide-01', t: "Davide l'alpaca (0:04)", index: 1 },
      { id: 'luca-asino', t: "Luca l'asino sommerso (0:07)", index: 3 },
      { id: 'locandina', t: "Azzeriamola green (0:07)", index: 0 },
      { id: 'insieme', t: "Insieme si può (1:18)", index: 5 }
    ];

    const grid = document.createElement('div');
    grid.className = 'nodo-spot-grid';
    grid.innerHTML = `
      <div style="font-size: 11px; font-family: var(--nodo-font-mono); color: var(--nodo-muted); margin-bottom: 2px;">
        🎬 APRI GLI SPOT IN SALA (LIGHTBOX CONDIVISA):
      </div>
      ${spots.map(s => `
        <button class="nodo-spot-btn" type="button" data-index="${s.index}">
          <span>🎬 ${s.t}</span>
          <span class="nodo-spot-badge">Apri video &rarr;</span>
        </button>
      `).join('')}
    `;

    grid.querySelectorAll('.nodo-spot-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        try {
          const { apriVideo } = await import('../video-lightbox.js');
          const { PEZZI } = await import('../union.js');
          apriVideo({ cartella: 'lavori/', pezzi: PEZZI, index: idx });
        } catch (err) {
          console.warn('[Nous] Impossibile aprire lightbox video:', err);
          const unionSec = document.querySelector('#caso-union');
          if (unionSec) unionSec.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    container.appendChild(grid);
    this.scrollToBottom();
  }

  loadHistory() {
    let stored = null;
    try {
      stored = sessionStorage.getItem('nodo_chat_history');
    } catch (e) {
      console.warn("[Nodo] Impossibile accedere a sessionStorage:", e);
      stored = null;
    }
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.history = Array.isArray(parsed) ? parsed : [];
        for (const item of this.history) {
          if (!item || typeof item.text !== 'string') continue;
          if (item.role === 'user') {
            const msg = document.createElement('div');
            msg.className = 'nodo-msg nodo-msg--user';
            msg.textContent = item.text;
            this.elements.messages.appendChild(msg);
          } else {
            const msg = document.createElement('div');
            msg.className = 'nodo-msg nodo-msg--bot';
            let html = `<div class="nodo-msg-text">${this.formatMarkdown(item.text)}</div>`;
            if (item.action) html += this.actionLinkHtml(item.action);
            msg.innerHTML = html;
            this.elements.messages.appendChild(msg);
          }
        }
        this.scrollToBottom();
      } catch (e) {
        this.history = [];
      }
    }
  }
}

// Inizializzazione differita (non blocca il caricamento critico della pagina)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new NodoWidget().init());
} else {
  new NodoWidget().init();
}
