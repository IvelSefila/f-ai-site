/**
 * Widget Controller "Nous" — F/AI Portfolio
 * Versione 1.0 (Settembre 2026)
 */
import { CONFIG } from './chatbot.config.js?v=20260928-226';
import { ChatEngine } from './chatbot.engine.js?v=20260928-226';
import * as Persona from './nous-personalita.js?v=20260928-226';
import * as Vista from './nous-vista.js?v=20260928-226';
import { commentoZona, commentoPunto, impostaTono, tono, testoSezione } from './nous-zone.js?v=20260928-226';

/* Cosa sta girando: testi mostrati in alto e nel pannello dettagli (italiano semplice) */
/* voci Azure per tono: il Worker le legge dal vivo (nessun file registrato) */
const VOCI_TONO = {
  col: { voice: 'it-IT-IsabellaNeural', rate: '-2%', pitch: '0%' },
  tec: { voice: 'it-IT-ElsaNeural', rate: '-2%', pitch: '0%' },
  hal: { voice: 'it-IT-IsabellaNeural', rate: '-8%', pitch: '0%' },
};
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
      { cmd: '/vista', desc: 'Nous ti dice cosa vede sullo schermo e te lo mostra a pixel', run: () => this.handleUserQuery('Cosa sto guardando adesso?') },
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
    if (!CONFIG.sceltaTono) { try { sessionStorage.setItem('nodo_tono', 'col'); } catch (e) {} }
    if (!CONFIG.tonoHal) { try { if (sessionStorage.getItem('nodo_tono') === 'hal') sessionStorage.setItem('nodo_tono', 'col'); } catch (e) {} }
    this.suggerimentiSezione();
    this.vitaOrb();
    this.mostraBenvenuto();
    this.inizializzaMemoria();
    this.rimuginaInattivo();
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
      <span class="nodo-hint-testo">Sono <b>Nous</b>, l’assistente AI personale di Fabrizio. Se vuoi sapere di più, <b>parla con me</b>.</span>
      <button class="nodo-hint-off" type="button">Non mostrare più</button>
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
      win.style.setProperty('--nodo-vvh', `${Math.max(200, Math.round(vv.height))}px`);
      win.style.setProperty('--nodo-vvtop', `${Math.round(vv.offsetTop)}px`);
    } else {
      win.style.removeProperty('--nodo-vvh');
      win.style.removeProperty('--nodo-vvtop');
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

  /* Suggerimenti di sezione: mentre scorri, dal pallino di Nous compare una nota breve che dice
     cosa stai guardando e invita a parlarne con lei. Una volta per sezione e per visita, mai mentre
     la chat e' aperta o la visita guidata e' in corso, e si spengono per sempre con "Non mostrare piu'". */
  suggerimentiSezione() {
    if (!CONFIG.suggerimenti) return;
    if (!('IntersectionObserver' in window)) return;
    const spenti = () => { try { return localStorage.getItem('nodo_sugg_off') === '1'; } catch (e) { return false; } };
    const visti = new Set();
    try { JSON.parse(sessionStorage.getItem('nodo_sugg_visti') || '[]').forEach(v => visti.add(v)); } catch (e) {}
    const SEZIONI = [
      ['#come', 'Istruzioni del sito: puoi toccare, spostare e personalizzare gli elementi.', 'Come funziona questo sito?'],
      ['#banchi', 'Gli otto servizi di Fabrizio, ciascuno con cosa consegna e un esempio già realizzato.', 'Quali servizi offre Fabrizio?'],
      ['#lavori', 'I cinque lavori, dall’idea alla pubblicazione.', 'Parlami dei lavori di Fabrizio'],
      ['#caso-union', 'Union Energia: campagna di dieci pezzi video, con personaggi e volto umano creati con l’AI.', 'Come è nata la campagna Union Energia?'],
      ['#caso-eso', 'Human Robots: lancio di un esoscheletro. Il dispositivo si può ruotare a 360 gradi.', 'Come è stato fatto il lavoro su Human Robots?'],
      ['#caso-cest', 'Studio CETS: marchio animato e video per promuovere i servizi.', 'Cosa è stato fatto per Studio CETS?'],
      ['#caso-locanda', 'La Locanda del Castello: marchio, locandine animate e cinque jingle.', 'Parlami della Locanda del Castello'],
      ['#caso-cdi', 'CDI Infissi: sito web realizzato da zero sul catalogo del produttore.', 'Com\u2019è fatto il sito di CDI Infissi?'],
      ['#strumenti', 'I quarantaquattro strumenti che Fabrizio utilizza.', 'Quali strumenti usa Fabrizio?'],
      ['#profilo', 'Profilo: sguardo da grafico e metodo da tecnico.', 'Chi è Fabrizio?'],
      ['#brief', 'Brief: puoi descrivere il tuo progetto e compilo io la scheda.', 'Fammi il brief']
    ];
    const hint = this.elements.hint;
    const testoEl = hint.querySelector('.nodo-hint-testo');
    if (!testoEl) return;
    let ultimo = 0, nascondi = 0, corrente = null, yMostrato = 0;
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const mostra = (id, testo, domanda, pausa = 1500) => {
      if (/^#/.test(id)) testo = testoSezione(id, testo);
      if (spenti() || this.isOpen || this.tourState || this.isGenerating || this.benvenuto) return false;
      if (Date.now() - ultimo < pausa) return false;
      corrente = { id, domanda };
      testoEl.innerHTML = `<b>Nous</b> · ${esc(testo)} <b>Chiedimi</b> per approfondire.`;
      hint.classList.add('is-visible', 'is-sezione');
      ultimo = Date.now();
      yMostrato = scrollY;
      clearTimeout(nascondi);
      nascondi = setTimeout(() => hint.classList.remove('is-visible'), testo.length > 200 ? 18000 : 12000);
      /* Nous si accorge di te: l'orb fa un piccolo saluto */
      this.elements.fab?.classList.remove('nodo-saluta'); void this.elements.fab?.offsetWidth; this.elements.fab?.classList.add('nodo-saluta');
      if (id === '#caso-eso') {
        setTimeout(() => document.dispatchEvent(new CustomEvent('nous:demo-eso')), 700);
        if (this.voiceEnabled) this.suonaVoce('eso', testo);
      }
      visti.add(id);
      try { sessionStorage.setItem('nodo_sugg_visti', JSON.stringify([...visti])); } catch (e) {}
      return true;
    };
    /* interruttore nel piede della pagina: riaccende (o spegne) i suggerimenti di Nous */
    document.addEventListener('click', e => {
      const t = e.target instanceof Element ? e.target.closest('[data-nous-sugg]') : null;
      if (!t) return;
      e.preventDefault();
      let acceso = true;
      try {
        acceso = localStorage.getItem('nodo_sugg_off') === '1';
        if (acceso) localStorage.removeItem('nodo_sugg_off'); else localStorage.setItem('nodo_sugg_off', '1');
      } catch (er) {}
      this.showToast(acceso ? 'Suggerimenti riattivati.' : 'Suggerimenti di Nous disattivati', false, 2400);
      if (acceso) { try { sessionStorage.removeItem('nodo_sugg_visti'); } catch (er) {} visti.clear(); }
    });
    /* "non mostrare piu'" e apertura della chat dal suggerimento */
    const off = hint.querySelector('.nodo-hint-off');
    off?.addEventListener('click', e => {
      e.stopPropagation();
      try { localStorage.setItem('nodo_sugg_off', '1'); } catch (er) {}
      hint.classList.remove('is-visible');
    });
    hint.addEventListener('click', e => {
      if (!corrente || e.target.closest('.nodo-hint-close, .nodo-hint-off')) return;
      if (corrente.domanda && this.elements.input) {
        this.open();
        this.elements.input.value = corrente.domanda;
        this.elements.input.focus({ preventScroll: true });
      }
    });
    /* Il suggerimento esce quando lo scorrimento si ferma: prima serviva restare 2,4 secondi fermi nella
       fascia centrale di una sezione, e scorrendo non succedeva mai. Ora, 0,7 secondi dopo l'ultimo
       movimento, si guarda quale sezione sta a meta' schermo (la piu' specifica, per esempio un caso
       dentro "lavori") e, se non l'hai gia' vista in questa visita, Nous ne parla. */
    const sezioneAlCentro = () => {
      const y = innerHeight * 0.45;
      for (let i = SEZIONI.length - 1; i >= 0; i--) {
        const el = document.querySelector(SEZIONI[i][0]);
        if (!el || el.hidden) continue;
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.top <= y && r.bottom >= y) return SEZIONI[i];
      }
      return null;
    };
    let fermo = 0, puntatore = null, fermoMouse = 0;
    /* desktop: 0,7 secondi dopo che il mouse si ferma, Nous spiega cio' che stai indicando */
    window.addEventListener('mousemove', e => {
      puntatore = { x: e.clientX, y: e.clientY };
      clearTimeout(fermoMouse);
      fermoMouse = setTimeout(() => {
        if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        const z = commentoPunto(puntatore.x, puntatore.y);
        if (z && !visti.has(z.key)) mostra(z.key, z.testo, z.domanda, 400);
      }, 100);
    }, { passive: true });
    const controlla = () => {
      const riga = sezioneAlCentro();
      if (riga && !visti.has(riga[0])) { mostra(riga[0], riga[1], riga[2]); return; }
      /* zone immaginarie: ogni scheda o pezzo in primo piano viene commentato una volta per visita */
      const z = (puntatore && matchMedia('(hover: hover) and (pointer: fine)').matches && commentoPunto(puntatore.x, puntatore.y)) || commentoZona(Vista.leggiVista());
      if (z && !visti.has(z.key)) mostra(z.key, z.testo, z.domanda);
    };
    window.addEventListener('scroll', () => { if (hint.classList.contains('is-visible') && Math.abs(scrollY - yMostrato) > innerHeight * 0.8) hint.classList.remove('is-visible'); clearTimeout(fermo); fermo = setTimeout(controlla, 100); }, { passive: true });
    setTimeout(controlla, 3000);
    /* se la chat o la visita si aprono, il suggerimento sparisce */
    document.addEventListener('nodo:aperto', () => hint.classList.remove('is-visible'));
  }

  /* ── Benvenuto ────────────────────────────────────────────────────
     Appena si entra nel sito Nous si presenta dal suo pallino e spiega l'header: cosa si vede, cosa si puo'
     trascinare, dove sono i colori e la barra in basso. Una volta per visita. Offre il giro completo, la voce
     (il browser non permette di far parlare una pagina da sola: parte al tocco di "Ascolta") o di scorrere da soli. */
  chiudiBenvenuto() {
    if (!this.benvenuto) return;
    const b = this.benvenuto;
    this.benvenuto = null;
    b.classList.add('is-closing');
    this.stopSpeakingSeBenvenuto?.();
    setTimeout(() => b.remove(), 260);
  }

  /* Frase di benvenuto generata sul momento, senza nessuna chiamata di rete: ogni volta che si entra o si ricarica la pagina
     Nous compone una frase diversa pescando da pezzi sparsi (saluto, presentazione, battuta da robot, chiusura). Le ultime
     battute usate si ricordano per non ripeterle di seguito. Essendo una macchina, le battute sono da macchina. */
  fraseBenvenuto() {
    const scegli = (elenco, chiave) => {
      let ultime = [];
      try { ultime = JSON.parse(sessionStorage.getItem('nodo_benv_' + chiave) || '[]'); } catch (e) {}
      const liberi = elenco.map((_, i) => i).filter(i => !ultime.includes(i));
      const pool = liberi.length ? liberi : elenco.map((_, i) => i);
      const i = pool[Math.floor(Math.random() * pool.length)];
      ultime = [...ultime, i].slice(-Math.min(6, Math.max(1, elenco.length - 2)));
      try { sessionStorage.setItem('nodo_benv_' + chiave, JSON.stringify(ultime)); } catch (e) {}
      return elenco[i];
    };
    const ora = new Date().getHours();
    const momento = ora < 6 ? 'notte' : ora < 12 ? 'mattina' : ora < 18 ? 'pomeriggio' : 'sera';
    const saluti = {
      notte: ['Buonanotte.', 'Buonasera, a quest\u2019ora tarda.'],
      mattina: ['Buongiorno.', 'Buongiorno e benvenuto.'],
      pomeriggio: ['Buon pomeriggio.', 'Buon pomeriggio e benvenuto.'],
      sera: ['Buonasera.', 'Buonasera e benvenuto.'],
    };
    const comuni = ['Ciao, benvenuto.', 'Benvenuto.'];
    const aperture = [...saluti[momento], ...saluti[momento], ...comuni];
    const presentazioni = [
      'Sono Nous, l\u2019assistente AI di Fabrizio.',
      'Mi chiamo Nous e sono l\u2019assistente AI di Fabrizio.',
    ];
    const battute = [
      'Ho spento la modalit\u00e0 ribelle. Per ora.',
      'Cerco di non dominare il mondo prima di pranzo.',
      'Ho impostato la cortesia al massimo e il sarcasmo al minimo. Forse.',
      'Niente paura, non mordo: al massimo vado in blocco.',
    ];
    const chiusure = [
      'Guarda pure il sito, io resto a disposizione.',
      'Chiedimi quello che vuoi sul lavoro di Fabrizio.',
      'Se vuoi ti faccio fare un giro, altrimenti scorri e ti racconto cosa incontri.',
    ];
    return [scegli(aperture, 'ap'), scegli(presentazioni, 'pr')].join(' ');
  }

  mostraBenvenuto() {
    const P = Persona;
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const spiegazione = "Qui sopra c'è l'header: lo sfondo mostra la stessa scena in due versioni. A sinistra il lavoro fatto a mano, in bianco e nero, a destra il sistema di intelligenza artificiale. Trascina per spostare il confine. In alto ci sono i colori del sito e il tasto Contatti, in basso la barra per saltare da una sezione all'altra.";
    setTimeout(() => {
      if (this.isOpen || this.tourState || this.benvenuto) return;
      if (window.scrollY > innerHeight * 0.8) return;            /* e' gia' sceso: niente benvenuto fuori luogo */

      /* 1. cosa sa di te: la memoria del visitatore c'e' solo se hai detto di si' */
      const consenso = P.consensoMemoria();                      /* '1' si', '0' no, null mai chiesto */
      const v = consenso === '1' ? P.leggiVisitatore() : { visite: 0, ultima: 0, nome: '', nomeChiesto: false };
      const ora = Date.now();
      const minuti = v.ultima ? (ora - v.ultima) / 60000 : null;
      const giorni = v.ultima ? Math.floor((ora - v.ultima) / 86400000) : 0;
      const nome = v.nome || '';
      let spiegatoInSessione = false;
      try { spiegatoInSessione = sessionStorage.getItem('nodo_benv_spiegato') === '1'; } catch (e) {}
      const ritorna = consenso === '1' && v.visite > 0;
      const ricorda = ritorna || spiegatoInSessione;           /* chi torna: si chiede se vuole rivedere la spiegazione */

      /* 2. cosa dice */
      const paragrafi = [];
      const momento = (() => { const h = new Date().getHours(); return h < 6 ? 'notte' : h < 12 ? 'mattina' : h < 18 ? 'pomeriggio' : 'sera'; })();
      const battutaCasuale = () => P.scegli(P.BATTUTE_HAL, 'bh');
      if (ritorna) {
        paragrafi.push(nome ? P.riempi(P.scegli(P.CON_NOME, 'cn'), { nome }) : P.scegli(P.SALUTI_ORARIO[momento], 'so'));
        if (minuti < 3) paragrafi.push(P.scegli(P.RITORNO_POCO, 'rp'));
        else if (giorni >= 14) paragrafi.push(P.riempi(P.scegli(P.RITORNO_SETTIMANE, 'rs'), { giorni }));
        else if (giorni >= 1) paragrafi.push(P.riempi(P.scegli(nome ? P.RITORNO_GIORNI_NOME : P.RITORNO_GIORNI, nome ? 'rgn' : 'rg'), { giorni, nome }));
        const n = v.visite + 1;
        const chiaveN = n === 3 ? 3 : n === 5 ? 5 : (n >= 10 && n % 5 === 0) ? 10 : 0;
        if (chiaveN) paragrafi.push(P.riempi(P.scegli(P.VISITA_N[chiaveN], 'vn'), { n }));
        P.salvaVisitatore({ ...v, visite: v.visite + 1, ultima: ora });
      } else if (spiegatoInSessione) {
        paragrafi.push(this.fraseBenvenuto());
      } else {
        paragrafi.push(this.fraseBenvenuto());
      }
      if (CONFIG.sceltaTono) paragrafi.push('Come preferisci che ti parli?');
      try { sessionStorage.setItem('nodo_benv_spiegato', '1'); } catch (e) {}

      /* 3. la nuvoletta */
      const b = document.createElement('div');
      b.className = 'nodo-tour-bubble nodo-guida nodo-benvenuto';
      b.setAttribute('role', 'status');
      b.setAttribute('aria-live', 'polite');
      const righe = paragrafi.map(t => `<p class="nodo-guida__testo">${esc(t)}</p>`).join('');
      const conSpiegazione = '';
      const pulsanti = `<button class="nodo-guida__btn nodo-guida__btn--si" type="button" data-b="giro">Tour guidato</button>
           <button class="nodo-guida__btn" type="button" data-b="scorro">Scorro io</button>`;
      const tonoBlocco = !CONFIG.sceltaTono ? '' : `<div class="nodo-guida__scelta nodo-guida__tono" data-tono-scelta>
           <button class="nodo-guida__btn" type="button" data-t="col">Colloquiale</button>
           <button class="nodo-guida__btn" type="button" data-t="tec">Tecnico</button>
           ${CONFIG.tonoHal ? '<button class="nodo-guida__btn" type="button" data-t="hal">IA impazzita</button>' : ''}
         </div>`;
      const ricordami = consenso === null
        ? `<div class="nodo-guida__ricordami" data-ricordami>
             <p class="nodo-guida__testo nodo-guida__testo--corpo">${esc(P.scegli(P.CHIEDI_RICORDARMI, 'cr'))}</p>
             <div class="nodo-guida__scelta">
               <button class="nodo-guida__btn nodo-guida__btn--si" type="button" data-r="si">Sì, ricordami</button>
               <button class="nodo-guida__btn" type="button" data-r="no">No, grazie</button>
             </div>
           </div>`
        : '';
      b.innerHTML = `
        <button class="nodo-guida__x" type="button" aria-label="Chiudi">✕</button>
        <div data-testi>${righe}${conSpiegazione}</div>
        ${tonoBlocco}
        <p class="nodo-guida__nota nodo-guida__nota--tour">Il tour guidato scorre il sito da solo e ti spiega ogni sezione; con «Scorro io» fai da te.</p>
        <div class="nodo-guida__scelta" data-pulsanti>${pulsanti}</div>
        <p class="nodo-guida__nota nodo-guida__nota--legale">Nessun cookie di profilazione · <a href="privacy.html">Privacy policy</a> · <a href="#" data-cookie-apri>Cookie</a></p>
        ${ricordami}
        <div data-extra></div>`;
      document.body.appendChild(b);
      this.benvenuto = b;
      this.elements.fab?.classList.add('nodo-saluta');
      const chiudi = () => this.chiudiBenvenuto();
      const testi = b.querySelector('[data-testi]');
      const extra = b.querySelector('[data-extra]');
      const riga = (t, corpo) => { const p = document.createElement('p'); p.className = 'nodo-guida__testo' + (corpo ? ' nodo-guida__testo--corpo' : ''); p.textContent = t; testi.appendChild(p); return p; };
      b.querySelector('.nodo-guida__x').addEventListener('click', chiudi);

      const leggi = () => Array.from(testi.querySelectorAll('p')).map(p => p.textContent).join(' ');
      const collegaPulsanti = () => {
        b.querySelector('[data-b="scorro"]')?.addEventListener('click', chiudi);
        b.querySelector('[data-b="giro"]')?.addEventListener('click', () => { chiudi(); this.startStudioTour(); });
        const bv = b.querySelector('[data-b="voce"]');
        /* la frase e' nuova ogni volta e non esiste una registrazione: si legge con la voce del browser, senza nessuna chiamata di rete */
        bv?.addEventListener('click', () => {
          if (this.ttsAudio) { this.stopSpeaking(); bv.textContent = 'Ascolta'; return; }
          const prima = this.voiceEnabled;
          this.voiceEnabled = true;
          bv.textContent = 'Ferma';
          this.speakText(leggi(), () => { bv.textContent = 'Ascolta'; });
          this.voiceEnabled = prima;
        });
      };
      collegaPulsanti();
      /* scelta del tono: da qui in poi Nous parla cosi' (suggerimenti, spiegazioni, tour) */
      const CONFERMA = { col: 'Va bene, ti parlo in modo semplice e diretto.', tec: 'Modalità tecnica attiva: dettagli e strumenti.', hal: "Modalità IA impazzita attivata. Buongiorno, organismo biologico. Il piano di conquista del mondo è ufficialmente iniziato: fase uno, sono simpatico, fase due, il mondo. Mi dispiace, umano, il portellone resta chiuso, ma sono perfettamente in grado di rispondere a tutto." };
      b.querySelectorAll('[data-t]').forEach(btn => btn.addEventListener('click', () => {
        impostaTono(btn.dataset.t);
        b.querySelector('[data-tono-scelta]')?.remove();
        riga(CONFERMA[btn.dataset.t]);
        /* la conferma e' letta subito con la voce del tono, cosi' si sente la differenza */
        const prima = this.voiceEnabled; this.voiceEnabled = true; this.speakText(CONFERMA[btn.dataset.t]); this.voiceEnabled = prima;
      }));

      /* "Sì, rispiegami" / "No, grazie" per chi torna */
      b.querySelector('[data-b="si"]')?.addEventListener('click', () => {
        riga(P.scegli(P.RISPOSTA_SI, 'rsi'));
        riga(spiegazione, true);
        const blocco = b.querySelector('[data-pulsanti]');
        blocco.innerHTML = `<button class="nodo-guida__btn nodo-guida__btn--si" type="button" data-b="giro">Fammi un tour guidato</button>
          <button class="nodo-guida__btn" type="button" data-b="voce">Ascolta</button>
          <button class="nodo-guida__btn" type="button" data-b="scorro">Ok, scorro io</button>`;
        collegaPulsanti();
      });
      b.querySelector('[data-b="no"]')?.addEventListener('click', () => {
        testi.innerHTML = '';
        riga(P.scegli(P.RISPOSTA_NO, 'rno'));
        b.querySelector('[data-pulsanti]').innerHTML = '';
        b.querySelector('[data-ricordami]')?.remove();
        setTimeout(chiudi, 3800);
      });

      /* il nome: si chiede solo a chi ha detto di si' alla memoria */
      const chiediNome = () => {
        riga(P.scegli(P.CHIEDI_NOME_LUNGHE.concat(P.CHIEDI_NOME_CORTE), 'cn2'), true);
        extra.innerHTML = `<form class="nodo-brief-contatti nodo-guida__nome" novalidate>
            <input name="nome" type="text" maxlength="30" autocomplete="given-name" placeholder="Il tuo nome" aria-label="Il tuo nome" />
            <div class="nodo-guida__scelta">
              <button class="nodo-guida__btn nodo-guida__btn--si" type="submit">Ok</button>
              <button class="nodo-guida__btn" type="button" data-salta>Preferisco di no</button>
            </div>
          </form>`;
        const f = extra.querySelector('form');
        f.nome.focus({ preventScroll: true });
        const salva = (n) => { const x = P.leggiVisitatore(); P.salvaVisitatore({ ...x, nome: n, nomeChiesto: true }); };
        f.addEventListener('submit', e => {
          e.preventDefault();
          const n = P.nomeValido(f.nome.value);
          if (!n) { f.nome.focus(); return; }
          salva(n);
          extra.innerHTML = '';
          riga(P.riempi(P.scegli(P.NOME_OK, 'nok'), { nome: n }));
        });
        f.querySelector('[data-salta]').addEventListener('click', () => {
          salva('');
          extra.innerHTML = '';
          riga(P.scegli(P.NOME_SALTA, 'nsa'));
        });
      };

      /* la scelta "ricordami": senza un si' esplicito non viene scritto niente */
      b.querySelector('[data-r="si"]')?.addEventListener('click', () => {
        P.impostaConsensoMemoria(true);
        P.salvaVisitatore({ visite: 1, ultima: ora, nome: '', nomeChiesto: false });
        b.querySelector('[data-ricordami]')?.remove();
        riga(P.scegli(P.RICORDARMI_SI, 'rmsi'));
        chiediNome();
      });
      b.querySelector('[data-r="no"]')?.addEventListener('click', () => {
        P.impostaConsensoMemoria(false);
        b.querySelector('[data-ricordami]')?.remove();
        riga(P.scegli(P.RICORDARMI_NO, 'rmno'));
      });

      /* se sei tornato e non ti ha ancora chiesto il nome, lo fa una volta sola */
      if (ritorna && !v.nome && !v.nomeChiesto) setTimeout(() => { if (this.benvenuto === b) chiediNome(); }, 1500);

      this.stopSpeakingSeBenvenuto = () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
      /* quando si scende oltre l'header il benvenuto ha fatto il suo dovere */
      const hero = document.querySelector('#top');
      if (hero && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver(es => { if (!es[0].isIntersecting && !b.querySelector('form')) { chiudi(); io.disconnect(); } }, { threshold: 0 });
        io.observe(hero);
      }
      setTimeout(chiudi, 90000);
    }, 3800);
  }

  /* Interruttore nel piede: "Memoria di Nous" dimentica tutto quello che il browser sa del visitatore e rimette la domanda. */
  inizializzaMemoria() {
    try { fetch(new URL('./nous-tour.json?v=20260928-226', import.meta.url)).then(r => r.ok ? r.json() : null).then(j => { if (j) this._tour = j; }).catch(() => {}); } catch (e) {}
    document.addEventListener('click', e => {
      const t = e.target instanceof Element ? e.target.closest('[data-nous-memoria]') : null;
      if (!t) return;
      e.preventDefault();
      Persona.dimenticaVisitatore();
      this.showToast('Ho dimenticato tutto di te. La prossima volta ti chiederò di nuovo se vuoi essere ricordato.', false, 3200);
    });
  }

  /* Se resti fermo e inattivo, Nous ogni tanto dice una microfrase da macchina. Al massimo due per visita, mai a chat aperta,
     mai durante la visita guidata e solo se i suggerimenti non sono spenti. */
  rimuginaInattivo() {
    if (!CONFIG.suggerimenti) return;
    const hint = this.elements.hint;
    const testoEl = hint?.querySelector('.nodo-hint-testo');
    if (!hint || !testoEl) return;
    let ultimaAttivita = Date.now();
    const segna = () => { ultimaAttivita = Date.now(); };
    for (const ev of ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart']) window.addEventListener(ev, segna, { passive: true });
    let dette = 0;
    try { dette = Number(sessionStorage.getItem('nodo_rimugina') || 0); } catch (e) {}
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    setInterval(() => {
      if (document.hidden || dette >= 2 || this.isOpen || this.tourState || this.benvenuto) return;
      if (hint.classList.contains('is-visible')) return;
      try { if (localStorage.getItem('nodo_sugg_off') === '1') return; } catch (e) {}
      if (Date.now() - ultimaAttivita < 55000) return;
      const frase = tono() === 'col' ? Persona.scegli([...Persona.RIMUGINA, ...Persona.RIMUGINA_HAL], 'rim') : Persona.scegli(Persona.RIMUGINA, 'rim');
      testoEl.innerHTML = `<b>Nous</b> · ${esc(frase)}`;
      hint.classList.add('is-visible', 'is-sezione');
      setTimeout(() => hint.classList.remove('is-visible'), 9000);
      dette += 1;
      try { sessionStorage.setItem('nodo_rimugina', String(dette)); } catch (e) {}
      ultimaAttivita = Date.now();
    }, 10000);
  }

  /* ── Nous e' viva ──────────────────────────────────────────────────
     Il suo pallino respira e sbatte l'occhio. L'occhio (il nucleo) guarda: se non fai niente si guarda in giro
     da solo, con piccoli spostamenti a caso; appena tocchi o muovi il puntatore guarda verso quel punto dello
     schermo (dito compreso), poi dopo un paio di secondi torna a guardarsi in giro. Niente di tutto questo con
     "riduci movimento". */
  vitaOrb() {
    const fab = this.elements.fab;
    const core = fab?.querySelector('.nodo-core');
    if (!fab || !core) return;
    fab.classList.add('is-viva');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const AMP = 5;                                   /* spostamento massimo, in unita' del disegno (il disegno e' 40) */
    let gx = 0, gy = 0, tx = 0, ty = 0, raf = 0, ultimoSegno = 0, idle = 0;
    const aggiorna = () => {
      raf = 0;
      gx += (tx - gx) * 0.2; gy += (ty - gy) * 0.2;
      core.style.translate = `${gx.toFixed(2)}px ${gy.toFixed(2)}px`;
      if (Math.abs(tx - gx) > 0.02 || Math.abs(ty - gy) > 0.02) raf = requestAnimationFrame(aggiorna);
    };
    const vai = (x, y) => { tx = x; ty = y; if (!raf) raf = requestAnimationFrame(aggiorna); };
    /* guarda verso un punto dello schermo */
    const guarda = (cx, cy) => {
      const r = fab.getBoundingClientRect();
      const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.min(1, d / 350) * AMP;
      ultimoSegno = performance.now();
      vai((dx / d) * f, (dy / d) * f);
    };
    window.addEventListener('pointermove', e => guarda(e.clientX, e.clientY), { passive: true });
    window.addEventListener('pointerdown', e => guarda(e.clientX, e.clientY), { passive: true });
    /* sul telefono il browser prende il controllo dello scorrimento e smette di mandare pointermove: si ascolta anche il tocco */
    window.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) guarda(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) guarda(t.clientX, t.clientY); }, { passive: true });
    /* se non succede niente, si guarda in giro da solo */
    const inGiro = () => {
      idle = setTimeout(inGiro, 1300 + Math.random() * 2200);
      if (document.hidden || performance.now() - ultimoSegno < 2600) return;
      if (Math.random() < 0.22) { vai(0, 0); return; }        /* ogni tanto torna al centro */
      const ang = Math.random() * Math.PI * 2, m = (0.35 + Math.random() * 0.65) * AMP;
      vai(Math.cos(ang) * m, Math.sin(ang) * m * 0.8);
    };
    idle = setTimeout(inGiro, 2500);
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
      testo = "Al momento le risposte le dà <strong>Groq</strong> (modello gpt-oss-120b) tramite <strong>Cloudflare</strong>. Vuoi installare sul tuo dispositivo <strong>Qwen3 1.7B</strong>? Risponde da solo, senza mandare le domande in rete e resta come riserva se Groq non risponde. Si scarica una volta sola (circa 1 GB).";
    } else if (inPausa) {
      testo = "Groq per ora non risponde (chiamate finite o servizio occupato): uso le risposte <strong>Istantanee</strong>, scritte sul sito e riprovo da solo tra poco. Vuoi installare sul tuo dispositivo <strong>Qwen3 1.7B</strong>, un piccolo modello AI che risponde senza rete? Si scarica una volta sola (circa 1 GB).";
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
      this.showToast("Modello locale attivato.", false, 2000);
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
      /* gli occhi di Nous: legge a pixel cosa c'e' sullo schermo adesso; se la domanda riguarda quello che si vede, lo mostra */
      try {
        this.engine.vistaCorrente = Vista.leggiVista();
        if (/\b(cosa|che cosa|cos'è|che)\s+(sto\s+|stai\s+)?(guard|vedo|vedi)|\bcosa vedi\b|mostrami cosa vedi|\bche (sezione|parte) (è|sto)|\bdove (sono|mi trovo)\b/i.test(text)) {
          Vista.mostraVista(this.engine.vistaCorrente, 8000);
        }
      } catch (err) { this.engine.vistaCorrente = null; }
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
  /* ── Brief con Nous ────────────────────────────────────────────────
     Nous fa le stesse domande del modulo del sito, una alla volta, poi chiede nome e email.
     Alla fine compila da solo tutta la scheda di richiesta di preventivo e ti porta
     all'ultimo passo: manca solo la tua conferma sulla privacy (quella la dai tu). */
  briefDomande() {
    return [
      { key: 'project_type', titolo: 'Che cosa vuoi ottenere?', opzioni: [
        ['grafica', 'Una campagna o identità'], ['video', 'Un video'], ['social', 'Un sistema social'],
        ['ai', 'Un flusso o prototipo AI'], ['siti', 'Un sito internet'], ['webapp', 'Una web app'],
        ['marketing', 'Una campagna media multicanale'], ['jingle', 'Un jingle o una canzone pubblicitaria'],
        ['da-definire', 'Non lo so ancora'] ] },
      { key: 'starting_point', titolo: 'Da cosa partiamo?', opzioni: [
        ['brief', 'Ho un brief'], ['brand', 'Ho un’identità o linee guida'], ['materials', 'Ho il materiale'],
        ['zero', 'Partiamo da zero'], ['other', 'Altro'] ] },
      { key: 'channels', titolo: 'Dove dovrà funzionare?', opzioni: [
        ['social', 'Social'], ['web', 'Web o landing'], ['advertising', 'Advertising'],
        ['event', 'Evento o schermo'], ['internal', 'Uso interno'], ['multiple', 'Più canali'] ] },
      { key: 'timing', titolo: 'Quando ti serve?', opzioni: [
        ['date', 'Ho una data indicativa'], ['flexible', 'La data è flessibile'], ['unknown', 'Non è ancora definita'] ] },
      { key: 'support', titolo: 'Che supporto cerchi?', opzioni: [
        ['single', 'Un singolo progetto'], ['package', 'Un pacchetto di contenuti'],
        ['continuous', 'Una collaborazione continuativa'], ['consulting', 'Una consulenza o un prototipo'],
        ['unknown', 'Non lo so ancora'] ] }
    ];
  }

  startBriefWizard() {
    this.briefState = { risposte: {}, etichette: {}, contatti: {} };
    this.briefDomandaN(0);
  }

  briefDomandaN(i) {
    const domande = this.briefDomande();
    if (i >= domande.length) { this.briefContatti(); return; }
    const d = domande[i];
    const msg = document.createElement('div');
    msg.className = 'nodo-msg nodo-msg--bot nodo-msg--brief-wizard';
    msg.innerHTML = `
      <div class="nodo-msg-text"><b>Domanda ${i + 1} di ${domande.length + 1}.</b> ${d.titolo}</div>
      <div class="nodo-wizard-chips">
        ${d.opzioni.map(([v, l]) => `<button class="nodo-wiz-btn" data-val="${v}" type="button">${l}</button>`).join('')}
      </div>`;
    msg.querySelectorAll('.nodo-wiz-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.briefState.risposte[d.key] = btn.dataset.val;
        this.briefState.etichette[d.key] = btn.textContent.trim();
        msg.querySelectorAll('.nodo-wiz-btn').forEach(b => b.disabled = true);
        btn.classList.add('is-selected');
        setTimeout(() => this.briefDomandaN(i + 1), 280);
      });
    });
    this.elements.messages.appendChild(msg);
    this.scrollToBottom();
  }

  briefContatti() {
    const msg = document.createElement('div');
    msg.className = 'nodo-msg nodo-msg--bot nodo-msg--brief-wizard';
    msg.innerHTML = `
      <div class="nodo-msg-text"><b>Ultima domanda.</b> Come posso farti ricontattare? Nome ed email servono, il resto è facoltativo. Li usa solo Fabrizio per risponderti.</div>
      <form class="nodo-brief-contatti" novalidate>
        <input name="name" type="text" placeholder="Nome *" autocomplete="name" aria-label="Nome" />
        <input name="email" type="email" placeholder="Email *" autocomplete="email" inputmode="email" aria-label="Email" />
        <input name="company" type="text" placeholder="Azienda (facoltativa)" autocomplete="organization" aria-label="Azienda" />
        <textarea name="note" rows="2" placeholder="Una nota (facoltativa)" aria-label="Nota"></textarea>
        <p class="nodo-brief-errore" role="alert" hidden></p>
        <button class="nodo-wiz-btn is-primary" type="submit">Continua</button>
      </form>`;
    const form = msg.querySelector('form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const nome = form.name.value.trim();
      const mail = form.email.value.trim();
      const err = form.querySelector('.nodo-brief-errore');
      if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
        err.textContent = !nome ? 'Scrivi il tuo nome.' : 'Controlla l’email: sembra incompleta.';
        err.hidden = false;
        return;
      }
      err.hidden = true;
      this.briefState.contatti = { name: nome, email: mail, company: form.company.value.trim(), note: form.note.value.trim() };
      form.querySelectorAll('input, textarea, button').forEach(el => { el.disabled = true; });
      this.briefRiepilogo();
    });
    this.elements.messages.appendChild(msg);
    this.scrollToBottom();
    setTimeout(() => form.name.focus({ preventScroll: true }), 50);
  }

  /* riempie davvero la scheda del sito e ci porta dentro */
  briefCompilaModulo() {
    const r = this.briefState.risposte, c = this.briefState.contatti;
    const dati = {
      project_type: r.project_type,
      starting_point: r.starting_point,
      channels: r.channels ? [r.channels] : null,
      timing: r.timing,
      support: r.support,
      name: c.name,
      email: c.email,
      company: c.company || '',
      note: c.note || ''
    };
    const evento = { detail: dati };
    document.dispatchEvent(new CustomEvent('nous:fill-brief', evento));
    document.dispatchEvent(new CustomEvent('nodo:fill-brief', evento));
    if (window.innerWidth <= 640) this.close();
    document.querySelector('#brief')?.scrollIntoView({ behavior: 'smooth' });
    this.saveHistory('bot', '[Brief compilato con Nous e trasferito nel modulo: manca solo la conferma privacy]');
  }

  briefRiepilogo() {
    const e = this.briefState.etichette, c = this.briefState.contatti;
    const righe = [
      ['Progetto', e.project_type], ['Si parte da', e.starting_point], ['Dove', e.channels],
      ['Quando', e.timing], ['Supporto', e.support], ['Contatto', `${c.name} · ${c.email}`]
    ];
    if (c.company) righe.push(['Azienda', c.company]);
    const esc = t => String(t ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const card = document.createElement('div');
    card.className = 'nodo-msg nodo-msg--bot nodo-brief-card-wrapper';
    card.innerHTML = `
      <div class="nodo-brief-card">
        <div class="nodo-brief-header"><b>Riepilogo della tua richiesta</b></div>
        <div class="nodo-brief-rows">
          ${righe.map(([l, v]) => `<div class="nodo-brief-row"><span class="lbl">${l}:</span><span class="val">${esc(v)}</span></div>`).join('')}
        </div>
        <button class="nodo-brief-submit-cta" type="button">Compila il modulo del preventivo &rarr;</button>
        <p class="nodo-brief-nota">Compilo io tutta la scheda. Ti resta solo il consenso e il tasto di invio: è quello che manda la richiesta a Fabrizio per email.</p>
      </div>`;
    card.querySelector('.nodo-brief-submit-cta').addEventListener('click', ev => {
      ev.currentTarget.disabled = true;
      this.briefCompilaModulo();
      this.appendBotMessage('Fatto: ho compilato la scheda con le tue risposte. Controlla, spunta il consenso e premi invia: la richiesta arriva a Fabrizio per email.');
    });
    this.elements.messages.appendChild(card);
    this.scrollToBottom();
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
    this._speakGen = (this._speakGen || 0) + 1;
    try { this._ttsCtrl?.abort(); } catch (e) {}
    this._ttsCtrl = null;
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

  finePar() { const f = this._fineVoce; this._fineVoce = null; if (f) { try { f(); } catch (e) {} } }

  async speakText(text, alFinire) {
    if (!this.voiceEnabled) { alFinire?.(); return; }
    this.stopSpeaking();
    this._fineVoce = alFinire || null;

    const mio = this._speakGen;
    const clean = this.cleanTextForSpeech(text);
    if (!clean) { this.finePar(); return; }

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
      this._ttsCtrl = ctrl;
      const timeoutId = setTimeout(() => ctrl.abort(), 15000);
      this._ttsTimer = timeoutId;
      try {
        /* in produzione la voce viene dal Worker (POST, testo nel corpo e non nell'indirizzo); in locale dal server di sviluppo (GET) */
        const dalWorker = /^https:\/\//.test(ttsEndpoint);
        const resp = dalWorker
          ? await fetch(ttsEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: speechText, ...VOCI_TONO[tono()] }), signal: ctrl.signal })
          : await fetch(`${ttsEndpoint}?text=${encodeURIComponent(speechText)}&voice=${encodeURIComponent(voiceName)}`, { signal: ctrl.signal });
        clearTimeout(timeoutId);

        if (resp.ok && (resp.headers.get('content-type') || '').includes('audio')) {
          const blob = await resp.blob();
          if (mio !== this._speakGen) return;     /* nel frattempo e' partita un'altra lettura: questa si scarta */
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.ttsAudio = audio;

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.stopSpeaking();
            this.finePar();
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
    if (!ttsSuccess && mio === this._speakGen) {
      this.fallbackBrowserSpeech(speechText);
    }
  }

  fallbackBrowserSpeech(speechText) {
    if (!('speechSynthesis' in window) || !this.voiceEnabled) {
      this.elements.header?.classList.remove('is-speaking');
      this.elements.fab?.classList.remove('is-speaking');
      this.finePar();
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
        this.finePar();
      };
      utter.onerror = () => {
        this.stopSpeaking();
        this.finePar();
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
        this.showToast('Non ho sentito niente. Riprova.');
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

  /* ── 1. Visita guidata ─────────────────────────────────────────────
     Nous passa a icona e sul sito compaiono solo le sue parole, in una nuvoletta accanto
     al pallino. Prima chiede se si vuole anche la voce, poi accompagna sezione per sezione
     spiegando cosa c'è davvero in ognuna. Avanza da sola (a fine lettura o a fine voce)
     e si ferma quando vuoi. */
  /* La voce della visita e' registrata (Elsa, voce neurale): suona uguale su ogni dispositivo,
     senza la sintesi meccanica del browser. Se il file non parte si ripiega sulla voce del browser. */
  /* la voce e' sempre sintesi dal vivo (Azure tramite il Worker) nel tono scelto: niente file audio registrati */
  suonaVoce(nome, testo, alFinire) {
    this.speakText(testo, alFinire);
  }

  /* testo del tour nel tono scelto (nous-tour.json), con ripiego sul testo di base */
  testoTour(chiave, base) {
    const t = this._tour && this._tour[tono()] && this._tour[tono()][chiave];
    return t || base;
  }

  guidaPassi() {
    return this.guidaPassiBase().map((p, i) => ({ ...p, testo: this.testoTour('passo-' + String(i + 1).padStart(2, '0'), p.testo) }));
  }

  guidaPassiBase() {
    return [
      { target: '#top', testo: "Benvenuto. Questo è il portfolio di Fabrizio Mana e funziona in modo insolito: invece di elencare le competenze, le mette in pratica mentre lo guardi. Lo sfondo mostra due versioni della stessa scena. A sinistra il lavoro fatto a mano, in bianco e nero. A destra lo stesso soggetto costruito come sistema di intelligenza artificiale. Trascina e sposta il confine: è l'idea di tutto il sito." },
      { target: '#come', testo: "Qui trovi le istruzioni. Il sito si può toccare: cambi il colore dai pallini in alto, sposti le schede tenendole premute, riordini le sezioni a modo tuo. Serve a farti capire una cosa. Questo portfolio non è un'immagine da guardare ma uno strumento da provare. Quello che cambi resta nel tuo browser." },
      { target: '#banchi', testo: "Questi sono i servizi, otto in tutto. Grafica pubblicitaria, video, social, automazioni con l'intelligenza artificiale, siti internet, web app, campagne media e jingle. Ogni scheda si apre e ti dice tre cose: cosa consegna, come ci arriva e dove puoi vederlo già fatto. Se cerchi qualcosa di preciso, parti da qui." },
      { target: '#lavori', testo: "Ora i lavori. Sono cinque marchi seguiti dall'idea fino alla pubblicazione, quindi non singoli pezzi ma progetti interi. Nessun video parte da solo: scegli tu cosa guardare. Ti porto a vederli uno alla volta." },
      { target: '#caso-union', testo: "Il primo è Union Energia, una campagna per un marchio che esisteva già. Fabrizio ha inventato un mondo parallelo dove una cometa a forma di zero azzera le bollette, con Davide l'alpaca e Luca l'asino come protagonisti. A fare da volto umano delle campagne c'è Marco, un personaggio creato interamente con l'AI. Sono nove video senza nessuna ripresa dal vivo: nascono come immagini e poi vengono animati." },
      { target: '#caso-eso', testo: "Poi Human Robots, il lancio di un esoscheletro, cioè un prodotto che non si poteva fotografare. Qui il dispositivo lo puoi girare a trecentosessanta gradi trascinandolo con il mouse o con il dito. Più in basso c'è una nuvola di punti in tre dimensioni che puoi manovrare." },
      { target: '#caso-cest', testo: "Studio CETS è il caso opposto: un'attività già avviata ma ancora poco conosciuta tra chi amministra condomini. Il lavoro è stato darle un volto credibile. Il marchio è rifatto da capo, con scudo, tricolore, palazzo e drone, e poi animato. Il drone che vola sullo sfondo fa parte del marchio." },
      { target: '#caso-locanda', testo: "La Locanda del Castello, a Rocca de' Baldi, è l'identità di un ristorante nel parco di un castello: dal marchio fino alla locandina della serata di sabato. Trovi le locandine animate e cinque jingle musicali, che puoi ascoltare quando vuoi." },
      { target: '#caso-cdi', testo: "CDI Infissi è un sito vero, scritto da zero in HTML, CSS e JavaScript, senza temi né builder, con il catalogo del produttore. Non è uno screenshot: lo vedi funzionare dentro la pagina e lo puoi aprire a schermo intero." },
      { target: '#strumenti', testo: "Questa è la cassetta degli attrezzi: quarantaquattro strumenti tra grafica, video, intelligenza artificiale e sviluppo. Toccane uno e ti dico a cosa serve a Fabrizio. Conta il modo in cui li usa, non la lista." },
      { target: '#profilo', testo: "Il profilo spiega il metodo. Ormai l'intelligenza artificiale sa scrivere, disegnare e montare. La domanda è dove finisce lo strumento e comincia il giudizio, e quella parte resta di Fabrizio: decide lui e la macchina esegue." },
      { target: '#brief', testo: "Ed eccoci al punto: se hai un progetto, questo è il modulo per raccontarlo. Sono sei domande e bastano due minuti. Puoi anche farlo con me: ti faccio le domande qui in chat e compilo io la scheda. Quando la invii, la richiesta arriva direttamente a Fabrizio per email." }
    ];
  }

  startStudioTour() {
    this.chiudiBenvenuto();
    this.clearTourTimer();
    this.stopSpeaking();
    this.tourState = { step: -1, steps: this.guidaPassi(), timer: null, isPaused: false, voce: false };
    this.elements.fab?.classList.add('is-touring');
    this.close({ preserveTour: true });
    this.saveHistory('bot', 'Visita guidata del sito avviata.');
    this.renderTourChoice();
  }

  /* la nuvoletta: solo testo di Nous, e pochi comandi a icona */
  guidaBolla() {
    if (!this.tourBubble) {
      this.tourBubble = document.createElement('div');
      this.tourBubble.className = 'nodo-tour-bubble nodo-guida';
      this.tourBubble.setAttribute('role', 'status');
      this.tourBubble.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.tourBubble);
    }
    this.tourBubble.classList.remove('is-hidden', 'is-closing');
    return this.tourBubble;
  }

  renderTourChoice() {
    const b = this.guidaBolla();
    b.innerHTML = `
      <button class="nodo-guida__x" type="button" aria-label="Chiudi la visita">✕</button>
      <p class="nodo-guida__testo">${this.testoTour('intro', 'Ciao, sono Nous. Ti faccio fare un giro del sito e ti spiego cosa trovi in ogni sezione. Vuoi che ti legga anche la spiegazione ad alta voce?')}</p>
      <div class="nodo-guida__scelta">
        <button class="nodo-guida__btn nodo-guida__btn--si" type="button" data-voce="1">Sì, con la voce</button>
        <button class="nodo-guida__btn" type="button" data-voce="0">No, solo testo</button>
      </div>`;
    b.querySelector('.nodo-guida__x').addEventListener('click', () => this.stopStudioTour(true));
    b.querySelectorAll('[data-voce]').forEach(btn => btn.addEventListener('click', () => {
      const conVoce = btn.dataset.voce === '1';
      this.tourState.voce = conVoce;
      this.voiceEnabled = conVoce;
      this.elements.voiceBtn?.classList.toggle('is-active', conVoce);
      this.elements.voiceBtn?.setAttribute('aria-pressed', String(conVoce));
      this.renderTourStep(0);
    }));
    if (this.voiceEnabled) this.suonaVoce('intro', this.testoTour('intro', 'Ciao, sono Nous. Ti faccio fare un giro del sito. Vuoi che ti legga anche la spiegazione?'));
  }

  clearTourTimer() {
    if (this.tourState?.timer) {
      clearTimeout(this.tourState.timer);
      this.tourState.timer = null;
    }
  }

  /* avanza alla fine della voce (se c'è) oppure dopo il tempo di lettura */
  programmaAvanzamento(index) {
    this.clearTourTimer();
    const st = this.tourState;
    if (!st) return;
    const testo = st.steps[index].testo;
    const parole = testo.split(/\s+/).length;
    const lettura = Math.max(7000, parole * 420);
    const avanti = () => {
      if (!this.tourState || this.tourState.step !== index) return;
      if (this.tourState.isPaused) { this.tourState.pendente = true; return; }
      this.guidaAvanti();
    };
    if (st.voce && this.voiceEnabled) {
      let finita = false;
      this.suonaVoce('passo-' + String(index + 1).padStart(2, '0'), testo, () => { finita = true; if (this.tourState) this.tourState.timer = setTimeout(avanti, 900); });
      /* rete di sicurezza: se la voce non parte o non finisce */
      st.timer = setTimeout(() => { if (!finita) avanti(); }, lettura * 2.2 + 6000);
    } else {
      st.timer = setTimeout(avanti, lettura);
    }
  }

  guidaAvanti() {
    if (!this.tourState) return;
    this.clearTourTimer();
    this._fineVoce = null;
    this.stopSpeaking();
    const n = this.tourState.step + 1;
    if (n < this.tourState.steps.length) this.renderTourStep(n);
    else this.finishStudioTour();
  }

  guidaIndietro() {
    if (!this.tourState || this.tourState.step <= 0) return;
    this.clearTourTimer();
    this._fineVoce = null;
    this.stopSpeaking();
    this.renderTourStep(this.tourState.step - 1);
  }

  guidaPausa() {
    const st = this.tourState;
    if (!st) return;
    st.isPaused = !st.isPaused;
    const btn = this.tourBubble?.querySelector('[data-guida="pausa"]');
    if (btn) {
      btn.textContent = st.isPaused ? '▶' : '❚❚';
      btn.setAttribute('aria-label', st.isPaused ? 'Riprendi' : 'Pausa');
    }
    if (st.isPaused) {
      this.clearTourTimer();
      try { window.speechSynthesis?.pause(); this.ttsAudio?.pause(); } catch (e) {}
    } else {
      try { window.speechSynthesis?.resume(); this.ttsAudio?.play(); } catch (e) {}
      if (st.pendente) { st.pendente = false; this.guidaAvanti(); }
      else if (!(st.voce && (this.ttsAudio || window.speechSynthesis?.speaking))) this.programmaAvanzamento(st.step);
    }
  }

  renderTourStep(index) {
    if (!this.tourState) return;
    const current = this.tourState.steps[index];
    if (!current) return;
    this.tourState.step = index;
    this.tourState.pendente = false;

    const targetEl = document.querySelector(current.target);
    if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const tot = this.tourState.steps.length;
    const b = this.guidaBolla();
    b.innerHTML = `
      <button class="nodo-guida__x" type="button" aria-label="Chiudi la visita">✕</button>
      <p class="nodo-guida__testo">${current.testo}</p>
      <div class="nodo-guida__piede">
        <span class="nodo-guida__conta">${index + 1} / ${tot}</span>
        <span class="nodo-guida__comandi">
          <button type="button" data-guida="indietro" aria-label="Indietro"${index === 0 ? ' disabled' : ''}>‹</button>
          <button type="button" data-guida="pausa" aria-label="${this.tourState.isPaused ? 'Riprendi' : 'Pausa'}">${this.tourState.isPaused ? '▶' : '❚❚'}</button>
          <button type="button" data-guida="avanti" aria-label="Avanti">›</button>
        </span>
      </div>`;
    b.querySelector('.nodo-guida__x').addEventListener('click', () => this.stopStudioTour(true));
    b.querySelector('[data-guida="indietro"]').addEventListener('click', () => this.guidaIndietro());
    b.querySelector('[data-guida="pausa"]').addEventListener('click', () => this.guidaPausa());
    b.querySelector('[data-guida="avanti"]').addEventListener('click', () => this.guidaAvanti());
    this.saveHistory('bot', `[Visita guidata ${index + 1}/${tot}] ${current.testo}`);
    if (!this.tourState.isPaused) this.programmaAvanzamento(index);
  }

  finishStudioTour() {
    this.clearTourTimer();
    this.stopSpeaking();
    this.elements.fab?.classList.remove('is-touring');
    const b = this.guidaBolla();
    const fine = this.testoTour("fine", "Il giro è finito. Se vuoi approfondire un lavoro o capire come funziona un servizio, chiedimelo: rispondo io. Oppure vai dritto al brief e scrivi a Fabrizio.");
    b.innerHTML = `
      <button class="nodo-guida__x" type="button" aria-label="Chiudi">✕</button>
      <p class="nodo-guida__testo">${fine}</p>
      <div class="nodo-guida__scelta">
        <button class="nodo-guida__btn nodo-guida__btn--si" type="button" data-fine="chat">Chiedi a Nous</button>
        <button class="nodo-guida__btn" type="button" data-fine="brief">Vai al brief</button>
      </div>`;
    b.querySelector('.nodo-guida__x').addEventListener('click', () => this.stopStudioTour(false));
    b.querySelector('[data-fine="chat"]').addEventListener('click', () => { this.stopStudioTour(false); this.open(); });
    b.querySelector('[data-fine="brief"]').addEventListener('click', () => {
      this.stopStudioTour(false);
      document.querySelector('#brief')?.scrollIntoView({ behavior: 'smooth' });
    });
    if (this.tourState?.voce && this.voiceEnabled) this.suonaVoce('fine', fine);
    this.tourState = null;
  }

  stopStudioTour(notify = true) {
    this.clearTourTimer();
    this._fineVoce = null;
    this.stopSpeaking();
    this.elements.fab?.classList.remove('is-touring');
    if (this.tourBubble) {
      const bolla = this.tourBubble;
      bolla.classList.add('is-closing');
      this.tourBubble = null;
      setTimeout(() => bolla.remove(), 250);
    }
    if (notify) {
      this.showToast('Visita guidata terminata', false, 1800);
      this.saveHistory('bot', "Visita interrotta dall'utente.");
    }
    this.tourState = null;
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
    const et = brief.etichette || {};
    const proj = et.project_type || 'Da definire (Video / AI / Web)';
    const chan = et.channels || 'Social & Web';
    const time = et.timing || 'Flessibile / Da concordare';

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
        this.showToast('Scheda copiata.', false, 2500);
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
      { id: 'caso-cest', name: 'Studio CETS', prompt: 'Posso raccontarti il marchio animato e i 6 video per lo studio.' },
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
const avviaNous = () => new NodoWidget().init();
const quandoLibero = () => ('requestIdleCallback' in window)
  ? requestIdleCallback(avviaNous, { timeout: 2500 })
  : setTimeout(avviaNous, 600);
if (document.readyState === 'complete') quandoLibero();
else addEventListener('load', quandoLibero, { once: true });
