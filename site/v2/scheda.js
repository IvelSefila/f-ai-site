/* ═══════════════════════════════════════════════════════════════════
 * SCHEDA — il motore comune ai casi con la lastra scura
 *
 * eso.js e cest.js facevano la stessa identica cosa: costruire una
 * griglia di copertine, aprire un video al clic, e rimettere la
 * copertina a posto quando il turno passa a un altro. Erano centodieci
 * righe uguali in due file, e la seconda copia sarebbe diventata il
 * posto dove un giorno si corregge un bug che nell'altra resta.
 *
 * Qui c'e' una volta sola. Ogni caso passa il suo prefisso di classe
 * (".eso__", ".cest__"), la sua cartella e il suo elenco di pezzi.
 *
 * Le due regole che questo motore fa rispettare:
 *  · aprendo la pagina non si scarica nemmeno un byte di video — c'e'
 *    solo un'immagine ferma e un bottone, e l'elemento <video> nasce
 *    al clic con preload="none";
 *  · un video alla volta in tutta la pagina — uno-alla-volta.js tiene
 *    il registro, e quando un altro blocco prende il turno qui la
 *    copertina va RIFATTA, non solo rimessa: l'elemento vecchio e' stato
 *    sostituito dal <video>, e riattaccarlo lascerebbe una scheda morta.
 * ═══════════════════════════════════════════════════════════════════ */

import { registra, soloIo } from './uno-alla-volta.js';

/**
 * @param {object} c  { nome, cartella, pezzi }
 *   nome     — la radice delle classi: 'eso' oppure 'cest'
 *   cartella — dove stanno i file, con la barra finale
 *   pezzi    — [{ id, t, d, w, h, n }]
 * @returns {{ monta: (avvisa?: () => void) => number }}
 */
export function scheda({ nome, cartella, pezzi }) {
  const perId = new Map(pezzi.map(p => [p.id, p]));
  let avvisa = () => {};

  function copertina(art, p) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `${nome}__via`;
    b.setAttribute('aria-label', `Guarda "${p.t}", ${p.d}`);
    b.innerHTML = `
    <img class="${nome}__fermo" src="${cartella}${p.id}.jpg" alt=""
         width="${p.w}" height="${p.h}" loading="lazy" decoding="async">
    <span class="${nome}__play" aria-hidden="true"></span>
    <span class="${nome}__durata mono" aria-hidden="true">${p.d}</span>`;
    b.addEventListener('click', () => parte(art, p, b));
    return b;
  }

  function rimetti(tranne) {
    for (const v of document.querySelectorAll(`.${nome}__lavori video`)) {
      const art = v.closest(`.${nome}__pezzo`);
      if (art === tranne) continue;
      v.pause();
      v.replaceWith(copertina(art, perId.get(art.dataset.id)));
      art.classList.remove('in-onda');
    }
  }

  const fermami = registra(() => rimetti());

  function parte(art, p, bottone) {
    soloIo(fermami);
    rimetti(art);

    const v = document.createElement('video');
    v.src = cartella + p.id + '.mp4';
    v.poster = cartella + p.id + '.jpg';
    v.controls = true;
    v.playsInline = true;
    v.preload = 'none';
    v.setAttribute('aria-label', p.t);
    bottone.replaceWith(v);
    art.classList.add('in-onda');
    avvisa();
    v.play().catch(() => {});
  }

  /* avvisa() lo passa app.js: serve a segnare nel dossier che qualcuno
     ha guardato un lavoro vero, non solo scorso la pagina. */
  function monta(quando) {
    if (quando) avvisa = quando;
    const griglia = document.querySelector(`.${nome}__lavori`);
    if (!griglia) return 0;
    griglia.textContent = '';   /* via la scaletta per chi non ha JS */

    for (const p of pezzi) {
      const art = document.createElement('article');
      art.className = `${nome}__pezzo`;
      art.dataset.forma = p.w >= p.h ? 'largo' : 'alto';
      art.dataset.id = p.id;
      art.innerHTML = `<h4>${p.t}</h4><p>${p.n}</p>`;
      art.prepend(copertina(art, p));
      griglia.appendChild(art);
    }
    return pezzi.length;
  }

  return { monta };
}
