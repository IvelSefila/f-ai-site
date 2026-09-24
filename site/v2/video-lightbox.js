/* ═══════════════════════════════════════════════════════════════════
 * VIDEO LIGHTBOX — un solo posto dove i video si aprono in grande
 *
 * Prima ogni caso (Union, Human Robots, Locanda, Studio CETS) apriva il
 * video al posto della copertina, dentro la griglia: piccolo, e la
 * scheda cambiava forma sotto le dita di chi guardava. Un solo <dialog>
 * condiviso, invece, si apre sopra tutto, a schermo pieno quanto serve,
 * e si chiude senza lasciare nessuna scheda a meta'.
 *
 * Resta un video alla volta anche qui: aprire il lightbox chiama
 * soloIo, cosi' un brano della Locanda in corso si ferma da solo.
 *
 * Dentro, si sfoglia: frecce, tastiera (← →) o un dito che scorre
 * passano al pezzo prima o dopo nella STESSA lista da cui si e' aperto
 * — la lista del caso che si stava guardando, non tutto il sito. */

import { registra, soloIo } from './uno-alla-volta.js';

let dialog, video, chiudi, prima, dopo, titoloEl, loopBtn;
let lista = [], cartella = '', indice = 0, inLoop = true;

function assicura() {
  if (dialog) return;
  dialog = document.createElement('dialog');
  dialog.className = 'video-lightbox';
  dialog.innerHTML = `
    <button type="button" class="video-lightbox__chiudi" aria-label="Chiudi il video">×</button>
    <button type="button" class="video-lightbox__freccia video-lightbox__freccia--prima" aria-label="Video precedente">‹</button>
    <button type="button" class="video-lightbox__freccia video-lightbox__freccia--dopo" aria-label="Video successivo">›</button>
    <video class="video-lightbox__video" controls playsinline loop></video>
    <div class="video-lightbox__piede">
      <p class="video-lightbox__titolo mono"></p>
      <button type="button" class="video-lightbox__loop" aria-pressed="true"
              aria-label="Riproduzione in loop: attiva, tocca per disattivare">
        <i aria-hidden="true">↻</i> loop</button>
    </div>`;
  document.body.append(dialog);
  video = dialog.querySelector('video');
  chiudi = dialog.querySelector('.video-lightbox__chiudi');
  prima = dialog.querySelector('.video-lightbox__freccia--prima');
  dopo = dialog.querySelector('.video-lightbox__freccia--dopo');
  titoloEl = dialog.querySelector('.video-lightbox__titolo');
  loopBtn = dialog.querySelector('.video-lightbox__loop');

  chiudi.addEventListener('click', () => dialog.close());
  prima.addEventListener('click', () => vai(indice - 1));
  dopo.addEventListener('click', () => vai(indice + 1));
  loopBtn.addEventListener('click', () => {
    inLoop = !inLoop;
    video.loop = inLoop;
    loopBtn.setAttribute('aria-pressed', String(inLoop));
    loopBtn.setAttribute('aria-label',
      inLoop ? 'Riproduzione in loop: attiva, tocca per disattivare'
             : 'Riproduzione in loop: disattiva, tocca per attivare');
  });
  /* rete di sicurezza sopra l'attributo "loop": in alcuni browser, nel
     momento esatto del giro, l'interfaccia nativa mostra un istante il
     fermo immagine finale col tasto play — sembra fermo, non lo e'. Qui
     il riavvio lo forziamo noi, cosi' il giro è sempre e comunque
     infinito, senza aspettare quel fotogramma. */
  video.addEventListener('ended', () => {
    if (!inLoop) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  });
  /* clic sullo sfondo scuro (il <dialog> stesso, non il video dentro) */
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();               /* stacca davvero il file, non solo la vista */
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') vai(indice - 1);
    else if (e.key === 'ArrowRight') vai(indice + 1);
  });

  /* un dito che scorre orizzontale passa pezzo — verticale resta lo
     scroll/i comandi nativi del video, quindi la soglia guarda anche
     quanto e' STATO orizzontale il gesto, non solo quanto e' lungo */
  let x0 = 0, y0 = 0;
  dialog.addEventListener('touchstart', (e) => {
    x0 = e.changedTouches[0].clientX;
    y0 = e.changedTouches[0].clientY;
  }, { passive: true });
  dialog.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.5) vai(indice + (dx < 0 ? 1 : -1));
  }, { passive: true });
}

function mostra() {
  const p = lista[indice];
  video.poster = cartella + p.id + '.jpg';
  video.src = cartella + p.id + '.mp4';
  video.setAttribute('aria-label', p.t);
  titoloEl.textContent = p.t;
  prima.hidden = indice <= 0;
  dopo.hidden = indice >= lista.length - 1;
  video.play().catch(() => {
    /* se il browser rifiuta l'autoplay restano i comandi nativi */
  });
}

function vai(i) {
  if (i < 0 || i >= lista.length || i === indice) return;
  indice = i;
  mostra();
}

/* si registra qui cosi' un brano della Locanda che parte ferma anche
   questo, e viceversa — vedi uno-alla-volta.js */
const fermaLightbox = registra(() => { if (dialog?.open) dialog.close(); });

/**
 * @param {object} o  { cartella, pezzi, index }
 *   cartella — dove stanno i file, con la barra finale
 *   pezzi    — l'elenco intero di questo caso: [{ id, t, ... }]
 *   index    — quale, dei pezzi, si apre per primo
 */
export function apriVideo({ cartella: c, pezzi, index }) {
  assicura();
  soloIo(fermaLightbox);
  cartella = c;
  lista = pezzi;
  indice = index;
  /* ogni apertura riparte col loop attivo di default, anche se l'ultima
     volta l'aveva spento chi guardava */
  inLoop = true;
  video.loop = true;
  loopBtn.setAttribute('aria-pressed', 'true');
  loopBtn.setAttribute('aria-label', 'Riproduzione in loop: attiva, tocca per disattivare');
  mostra();
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}
