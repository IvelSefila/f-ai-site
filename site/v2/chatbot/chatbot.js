/**
 * Widget Controller "Nous" — F/AI Portfolio
 * Versione 1.0 (Settembre 2026)
 */
import { CONFIG } from './chatbot.config.js';
import { ChatEngine } from './chatbot.engine.js';

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
    this.slashCommands = [
      { cmd: '/tour', desc: 'Tour guidato di regia in 4 sale del portfolio', run: () => this.startStudioTour() },
      { cmd: '/concept', desc: 'Generatore interattivo di concept e prompt video', run: () => this.startConceptLab() },
      { cmd: '/dossier', desc: 'Genera la scheda riepilogo del tuo progetto e mail rapida', run: () => this.generateDossierCard() },
      { cmd: '/glitch', desc: 'Attiva un impulso glitch cinematografico nello shader WebGL', run: () => this.triggerShaderGlitch() },
      { cmd: '/scena', desc: 'Cambia la scena fotografica nell\'Hero (3 scene)', run: () => this.cycleShaderScene() },
      { cmd: '/calma', desc: 'Rallenta la turbolenza dello shader WebGL a 0.25x', run: () => this.setShaderSpeed(0.25, 'Calma') },
      { cmd: '/turbo', desc: 'Accelera la turbolenza dello shader WebGL a 2.5x', run: () => this.setShaderSpeed(2.5, 'Turbo') },
      { cmd: '/brief', desc: 'Avvia preventivo interattivo guidato in 3 step', run: () => this.startBriefWizard() },
      { cmd: '/spot', desc: 'Guarda gli spot video AI per Union Energia', run: () => this.handleUserQuery('Mostrami gli spot video per Union Energia') },
      { cmd: '/audio', desc: 'Ascolta i 5 jingle musicali creati con Lyria', run: () => this.handleUserQuery('Fammi ascoltare i jingle della Locanda del Falco') },
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
    win.setAttribute('aria-label', `Chat con ${CONFIG.name}`);
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
          <button class="nodo-mode-badge" type="button" title="Selettore modalità motore (Istantaneo / GPU Locale / Cloud)" aria-label="Modalità motore">
            [ 🛡️ ISTANTANEO ]
          </button>
          <button class="nodo-icon-btn" type="button" data-action="reset" title="Azzera conversazione" aria-label="Azzera conversazione">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
          <button class="nodo-icon-btn" type="button" data-action="close" title="Chiudi chat" aria-label="Chiudi chat">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
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

      <div class="nodo-messages" role="log" aria-live="polite"></div>

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
        <button class="nodo-send-btn" type="submit" aria-label="Invia messaggio">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    `;

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
      progressBar: win.querySelector('.nodo-progress-bar'),
      progressFill: win.querySelector('.nodo-progress-fill'),
      progressText: win.querySelector('.nodo-progress-text'),
      progressPct: win.querySelector('.nodo-progress-pct'),
      toast: win.querySelector('.nodo-toast'),
      messages: win.querySelector('.nodo-messages'),
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

    modeBadge.addEventListener('click', () => this.handleModeToggle());
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
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Chiusura automatica su click esterno (pointerdown al di fuori di .nodo-window e .nodo-fab)
    document.addEventListener('pointerdown', e => {
      if (this.elements.slashMenu && this.elements.slashMenu.style.display !== 'none') {
        if (!this.elements.slashMenu.contains(e.target) && !this.elements.slashBtn?.contains(e.target)) {
          this.hideSlashMenu();
        }
      }
      if (!this.isOpen) return;
      if (this.elements.win?.contains(e.target) || this.elements.fab?.contains(e.target)) return;
      this.close();
    });

    // Deep-linking click delegation
    this.elements.messages.addEventListener('click', e => {
      const link = e.target.closest('.nodo-action-link');
      if (link) {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        const elem = document.querySelector(target);
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
    this.elements.win.classList.add('is-open');
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
      this.appendBotMessage(welcome);
      if (this.voiceEnabled) {
        this.speakText(welcome);
      }

      // Auto-Detection WebGPU: proponi una volta sola se supportato
      if (navigator.gpu && !localStorage.getItem('nodo_webgpu_asked')) {
        setTimeout(() => {
          const offerMsg = document.createElement('div');
          offerMsg.className = 'nodo-msg nodo-msg--bot';
          offerMsg.innerHTML = `
            <div class="nodo-msg-text">⚡ Il tuo browser supporta l'AI locale (WebGPU). Vuoi risposte più libere e contestuali con il modello neurale Qwen2.5?</div>
            <div class="nodo-msg-action nodo-webgpu-offer-actions">
              <button class="nodo-webgpu-offer" data-choice="yes">Sì, attiva</button>
              <button class="nodo-webgpu-offer" data-choice="no">No grazie</button>
            </div>
          `;

          // Handler pulsanti
          offerMsg.querySelector('[data-choice="yes"]').addEventListener('click', () => {
            localStorage.setItem('nodo_webgpu_asked', '1');
            offerMsg.remove();
            this.handleModeToggle();
          });
          offerMsg.querySelector('[data-choice="no"]').addEventListener('click', () => {
            localStorage.setItem('nodo_webgpu_asked', '1');
            offerMsg.remove();
            this.appendBotMessage('Ok, rimango in modalità Istantanea/Cloud. Puoi attivarla quando vuoi dal badge in alto.');
          });

          this.elements.messages.appendChild(offerMsg);
          this.scrollToBottom();
        }, 1500);
      }
    }
    setTimeout(() => this.elements.input.focus(), 150);
  }

  close(options = {}) {
    this.isOpen = false;
    this.elements.fab.setAttribute('aria-expanded', 'false');
    this.elements.win.classList.remove('is-open');
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
    this.clearTourTimer();
    this.tourState = null;
    this.history = [];
    try {
      sessionStorage.removeItem('nodo_chat_history');
    } catch (e) {
      console.warn("[Nodo] Impossibile rimuovere da sessionStorage:", e);
    }
    this.elements.messages.innerHTML = '';
    this.appendBotMessage(CONFIG.welcomeMessage);
  }

  async handleModeToggle() {
    if (this.isGenerating || (this.engine && this.engine.isWebGPULoading)) return;

    if (!this.engine) {
      try {
        this.engine = await ChatEngine.create();
      } catch (e) {
        this.showToast("Inizializzazione motore non riuscita.");
        return;
      }
    }

    const currentMode = this.engine ? this.engine.getMode() : 'deterministic';

    if (currentMode === 'deterministic') {
      // Passa a GPU LOCALE
      if (!navigator.gpu) {
        this.showToast("WebGPU non supportata dal tuo browser o dispositivo. Rimango in modalità Istantanea.");
        this.engine.setMode('deterministic');
        this.updateModeBadge();
        return;
      }

      if (this.engine.isWebGPULoaded) {
        this.engine.setMode('webgpu');
        this.updateModeBadge();
        this.showToast("⚡ GPU Locale (Qwen2.5 0.5B) attivata.", false, 2000);
        return;
      }

      this.showProgressBar();
      this.elements.modeBadge.classList.add('nodo-mode-badge--loading');

      try {
        await this.engine.loadWebGPU((progress, text) => {
          this.updateProgress(progress, text);
        });

        this.updateProgress(1.0, "Pesi Qwen2.5 0.5B pronti (100%)");
        this.engine.setMode('webgpu');
        this.updateModeBadge();

        setTimeout(() => {
          this.hideProgressBar();
          this.showToast("WebGPU caricata con successo! Modello neurale attivo.", false, 2500);
        }, 1500);
      } catch (err) {
        console.warn("[Nodo] Errore caricamento WebGPU:", err);
        this.hideProgressBar();
        this.engine.setMode('deterministic');
        this.updateModeBadge();
        this.showToast(`WebGPU non disponibile: ${err.message || 'Errore nei pesi'}. Ritorno a Istantaneo.`);
      } finally {
        this.elements.modeBadge.classList.remove('nodo-mode-badge--loading');
      }
    } else if (currentMode === 'webgpu') {
      // Da WebGPU passa a Cloud se configurato, altrimenti a Istantaneo
      const nextMode = CONFIG.cloudProxyUrl ? 'cloud' : 'deterministic';
      this.engine.setMode(nextMode);
      this.updateModeBadge();
      this.showToast(`Modalità impostata su: ${nextMode === 'cloud' ? 'Cloud' : 'Istantaneo'}`, false, 2000);
    } else if (currentMode === 'cloud') {
      this.engine.setMode('deterministic');
      this.updateModeBadge();
      this.showToast("Modalità impostata su: Istantaneo", false, 2000);
    }
  }

  updateModeBadge() {
    const mode = this.engine ? this.engine.getMode() : 'deterministic';
    const badge = this.elements.modeBadge;
    if (!badge) return;

    badge.className = 'nodo-mode-badge';
    if (mode === 'webgpu') {
      badge.classList.add('nodo-mode-badge--webgpu');
      badge.innerHTML = `[ ⚡ GPU LOCALE ]`;
      badge.setAttribute('title', 'Modalità attiva: GPU Locale (Qwen2.5 0.5B in-browser). Clicca per passare a Istantaneo.');
      badge.setAttribute('aria-label', 'Modalità attiva: GPU Locale. Clicca per cambiare.');
    } else if (mode === 'cloud') {
      badge.classList.add('nodo-mode-badge--cloud');
      badge.innerHTML = `[ ☁️ CLOUD ]`;
      badge.setAttribute('title', 'Modalità attiva: Cloud Worker. Clicca per cambiare.');
      badge.setAttribute('aria-label', 'Modalità attiva: Cloud. Clicca per cambiare.');
    } else {
      badge.classList.add('nodo-mode-badge--instant');
      badge.innerHTML = `[ 🛡️ ISTANTANEO ]`;
      badge.setAttribute('title', 'Modalità attiva: Istantaneo (deterministico offline). Clicca per attivare GPU Locale.');
      badge.setAttribute('aria-label', 'Modalità attiva: Istantaneo. Clicca per attivare GPU Locale.');
    }
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
    const displayMsg = text || `Caricamento pesi Qwen2.5 (${pct}%)...`;
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

    this.isGenerating = true;
    this.elements.sendBtn.disabled = true;
    this.elements.input.disabled = true;
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
    const onChunk = (delta) => {
      currentText += delta;
      textNode.innerHTML = this.formatMarkdown(currentText) + '<span class="nodo-cursor" aria-hidden="true"></span>';
      this.scrollToBottom();
    };

    let res = null;
    try {
      if (!this.engine) {
        this.engine = await ChatEngine.create();
      }
      res = await this.engine.replyStream(text, this.history, onChunk);
    } catch (err) {
      console.error("[Nodo] Errore nello streaming:", err);
      if (!currentText) {
        currentText = "Si è verificato un errore momentaneo nella generazione della risposta.";
      }
    } finally {
      try {
        // 1. Rimuovi il cursore
        textNode.innerHTML = this.formatMarkdown(currentText);

        // 2. Se c'è un'azione di deep-link (res.action), inserisci il pulsante di salto
        if (res && res.action) {
          const actionHtml = document.createElement('div');
          actionHtml.className = 'nodo-msg-action';
          actionHtml.innerHTML = `
            <a href="${res.action.target}" class="nodo-action-link" data-target="${res.action.target}">
              ${res.action.label} <span>&rarr;</span>
            </a>
          `;
          botMsg.appendChild(actionHtml);
          this.scrollToBottom();
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
        if (this.elements.header) this.elements.header.classList.remove('is-talking');
        if (this.elements.fab) this.elements.fab.classList.remove('is-talking');
        if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;
        if (this.elements.input) {
          this.elements.input.disabled = false;
          setTimeout(() => this.elements.input.focus(), 50);
        }
        this.isGenerating = false;
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
    if (action) {
      html += `
        <div class="nodo-msg-action">
          <a href="${action.target}" class="nodo-action-link" data-target="${action.target}">
            ${action.label} <span>&rarr;</span>
          </a>
        </div>
      `;
    }
    msg.innerHTML = html;
    this.elements.messages.appendChild(msg);
    this.scrollToBottom();
    this.saveHistory('bot', text, action);
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
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 4500);
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

    let isListening = false;
    this.elements.micBtn.addEventListener('click', () => {
      if (isListening) {
        recognition.stop();
        return;
      }
      try {
        recognition.start();
      } catch (err) {
        console.warn('[Nous] Errore start SpeechRecognition:', err);
      }
    });

    recognition.onstart = () => {
      isListening = true;
      this.elements.micBtn.classList.add('is-listening');
      this.elements.input.placeholder = "Ascolto... parla pure in italiano";
    };

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      this.elements.input.value = transcript;
    };

    recognition.onend = () => {
      isListening = false;
      this.elements.micBtn.classList.remove('is-listening');
      this.elements.input.placeholder = "Chiedi a Nous su progetti, video, AI... (o digita /)";
      const query = this.elements.input.value.trim();
      if (query && !this.isGenerating) {
        this.handleUserQuery(query);
      }
    };

    recognition.onerror = () => {
      isListening = false;
      this.elements.micBtn.classList.remove('is-listening');
      this.elements.input.placeholder = "Chiedi a Nous su progetti, video, AI... (o digita /)";
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
          title: 'Sala 3: Hardware & Materia 3D (Esoscheletro)',
          desc: 'Dalla telemetria bionica alla nuvola di 12.600 punti interattivi WebGL in OGL. Pipeline: Blender 3D → ComfyUI ControlNet → LTX Video.',
          speech: "Tappa 3. Hardware e simulazione 3D per l'esoscheletro, integrando Blender, ComfyUI e la nuvola di punti WebGL.",
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
          <div class="nodo-tour-desc">Dall'origine WebGL agli spot AI, dalla materia 3D ai banchi di lavoro. Da dove vuoi partire ora?</div>
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

    this.appendBotMessage("🎬 **Tour di regia completato!** Abbiamo esplorato l'origine WebGL, gli spot video AI, la modellazione 3D e i banchi di lavoro.\n\nVuoi approfondire un progetto specifico o configurare un brief in 3 passaggi?");
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
      { id: 'caso-union', name: 'Union Energia', prompt: 'Posso mostrarti i 9 spot video AI o spiegare come abbiamo mantenuto coerente l\'alpaca Davide.' },
      { id: 'caso-eso', name: 'Esoscheletro (Human Robots)', prompt: 'Vuoi esplorare la simulazione 3D tra Blender, ComfyUI e LTX Video per la mobilità?' },
      { id: 'caso-locanda', name: 'La Locanda del Castello', prompt: 'Vuoi ascoltare uno dei 5 jingle musicali creati con Lyria o vedere le locandine animate?' },
      { id: 'caso-cest', name: 'Studio CETS (Alpi Marittime)', prompt: 'Posso raccontarti il progetto di identità visiva per il turismo sostenibile.' },
      { id: 'caso-cdi', name: 'CDI Infissi', prompt: 'Vuoi scoprire come funziona il configuratore web di serramenti?' },
      { id: 'skill', name: 'Strumenti & AI Stack', prompt: 'Vuoi conoscere i dettagli della workstation locale RTX 5090 e dei flussi ComfyUI?' },
      { id: 'banchi', name: 'I Banchi di Lavoro', prompt: 'Posso orientarti tra i servizi (video, grafica, web app o jingle).' },
      { id: 'brief', name: 'Modulo Brief', prompt: 'Vuoi che compiliamo insieme il questionario qui in chat in 3 passaggi veloci?' }
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
          if (item.role === 'user') {
            const msg = document.createElement('div');
            msg.className = 'nodo-msg nodo-msg--user';
            msg.textContent = item.text;
            this.elements.messages.appendChild(msg);
          } else {
            const msg = document.createElement('div');
            msg.className = 'nodo-msg nodo-msg--bot';
            let html = `<div class="nodo-msg-text">${this.formatMarkdown(item.text)}</div>`;
            if (item.action) {
              html += `
                <div class="nodo-msg-action">
                  <a href="${item.action.target}" class="nodo-action-link" data-target="${item.action.target}">
                    ${item.action.label} <span>&rarr;</span>
                  </a>
                </div>
              `;
            }
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
