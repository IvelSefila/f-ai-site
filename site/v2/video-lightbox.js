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
 * ═══════════════════════════════════════════════════════════════════ */

import { registra, soloIo } from './uno-alla-volta.js';

let dialog, video, chiudi;

function assicura() {
  if (dialog) return;
  dialog = document.createElement('dialog');
  dialog.className = 'video-lightbox';
  dialog.innerHTML = `
    <button type="button" class="video-lightbox__chiudi" aria-label="Chiudi il video">×</button>
    <video class="video-lightbox__video" controls playsinline></video>`;
  document.body.append(dialog);
  video = dialog.querySelector('video');
  chiudi = dialog.querySelector('.video-lightbox__chiudi');

  chiudi.addEventListener('click', () => dialog.close());
  /* clic sullo sfondo scuro (il <dialog> stesso, non il video dentro) */
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();               /* stacca davvero il file, non solo la vista */
  });
}

/* si registra qui cosi' un brano della Locanda che parte ferma anche
   questo, e viceversa — vedi uno-alla-volta.js */
const fermaLightbox = registra(() => { if (dialog?.open) dialog.close(); });

export function apriVideo(src, poster, titolo) {
  assicura();
  soloIo(fermaLightbox);
  video.poster = poster;
  video.src = src;
  video.setAttribute('aria-label', titolo);
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  video.play().catch(() => {
    /* se il browser rifiuta l'autoplay restano i comandi nativi */
  });
}
