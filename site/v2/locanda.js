/* ═══════════════════════════════════════════════════════════════════
 * LA LOCANDA DEL CASTELLO — le locandine e i brani
 *
 * Stessa regola di Union Energia: aprendo la pagina non si scarica
 * nessun video e nessuna canzone. Ogni pezzo e' una copertina piu' un
 * bottone, e il file nasce al clic con preload="none".
 *
 * Una cosa diversa c'e': qui i formati non sono tutti uguali. La
 * cartella di partenza ha tre forme — 720x1280, 816x1104 e 1086x1448 —
 * e schiacciarle tutte in un 9:16 vorrebbe dire tagliare via un pezzo
 * di locandina, cioe' proprio la parte con scritto quando e' la serata.
 * Ogni scheda porta quindi le sue misure e la sua proporzione.
 *
 * La scelta dei nove pezzi e' spiegata in audit/porta-la-locanda.py:
 * la cartella ne aveva una ventina di finiti, diversi dei quali erano
 * lo stesso video esportato due volte.
 * ═══════════════════════════════════════════════════════════════════ */

import { registra, soloIo } from './uno-alla-volta.js';
import { apriVideo } from './video-lightbox.js';

const CARTELLA = 'locanda/';

export const PEZZI = [
  { id: 'posto', t: 'Il posto', d: '0:23', w: 720, h: 1280,
    n: 'Il giro della casa: calice, parco, corte del castello e la scritta che chiude — dove ci si siede.' },
  { id: 'dehor', t: 'Inaugurazione del dehor', d: '0:15', w: 720, h: 1280,
    n: 'Dall’alto alle luci del dehor: sull’ultima inquadratura compare la locandina della serata di apertura.' },
  { id: 'champagne', t: 'Serata degustazione Champagne', d: '0:10', w: 946, h: 1280,
    n: 'La locandina della serata: le bottiglie in fila, i piatti in abbinamento, la data e il prezzo.' },
  { id: 'tradition', t: 'Brut Tradition, il primo assaggio', d: '0:10', w: 946, h: 1280,
    n: 'Una scheda per ogni champagne in degustazione: stessa impaginazione, contenuto diverso — il sistema, non una grafica sola.' },
  { id: 'fritto', t: 'Serata fritto misto', d: '0:27', w: 720, h: 1280,
    n: 'Il pezzo lungo: i piatti da vicino, la data grande, e alla fine l’indirizzo inciso in oro sulla pietra.' },
  { id: 'fritto-locandina', t: 'Fritto misto di pesce', d: '0:10', w: 946, h: 1280,
    n: 'La stessa serata in una locandina che si muove appena: prezzo, data e cosa è compreso, leggibili in due secondi.' },
  { id: 'karaoke', t: 'Serata cena karaoke', d: '0:10', w: 946, h: 1280,
    n: 'Microfono, note e candele. La serata più informale della casa, e si vede dal tono.' },
  { id: 'benessere', t: 'Giornata di benessere e gusto', d: '0:13', w: 960, h: 1280,
    n: 'Una giornata fra trattamento viso e buffet nel parco: un servizio fuori tema che deve sembrare comunque la stessa casa.' },
  { id: 'eventi', t: 'Il luogo dei momenti speciali', d: '0:10', w: 946, h: 1280,
    n: 'La pagina degli eventi privati: compleanni, cresime, comunioni e matrimoni, ognuno con la sua sala.' },
];

/* Cinque brani generati con Lyria, trenta secondi ciascuno. Non sono
   musica presa da una libreria: sono nati per questa casa. */
export const BRANI = [
  { id: 'the-shared-table', t: 'The Shared Table', n: 'La tavola lunga, quella delle sere piene' },
  { id: 'rafters-under-gold', t: 'Rafters Under Gold', n: 'Le travi del soffitto e la luce delle candele' },
  { id: 'copper-and-stone', t: 'Copper and Stone', n: 'Rame e pietra: la cucina e i muri' },
  { id: 'salt-and-golden-light', t: 'Salt and Golden Light', n: 'Il tardo pomeriggio prima del servizio' },
  { id: 'where-the-shadows-dance', t: 'Where the Shadows Dance', n: 'La sera, quando il parco si spegne' },
];

/* avvisa() lo passa app.js: serve a segnare nel dossier che
   qualcuno ha guardato un lavoro vero, non solo scorso la pagina. */
let avvisa = () => {};

export function initLocanda(quando) {
  if (quando) avvisa = quando;
  const griglia = document.querySelector('.locanda__lavori');
  if (griglia) {
    griglia.textContent = '';   /* via la scaletta per chi non ha JS */
    for (const p of PEZZI) {
      const art = document.createElement('article');
      art.className = 'locanda__pezzo';
      art.dataset.id = p.id;
      art.innerHTML = `<h4>${p.t}</h4><p>${p.n}</p>`;
      art.prepend(copertina(art, p));
      griglia.appendChild(art);
    }
  }

  const lista = document.querySelector('.locanda__brani');
  if (lista) {
    lista.textContent = '';     /* via la scaletta per chi non ha JS */
    for (const b of BRANI) {
      const li = document.createElement('li');
      li.className = 'locanda__brano';
      li.innerHTML = `
        <button type="button" class="locanda__suona" data-id="${b.id}">
          <span class="locanda__tasto" aria-hidden="true"></span>
          <span class="locanda__nome"><b>${b.t}</b><em>${b.n}</em></span>
          <span class="locanda__min mono" aria-hidden="true">0:30</span>
        </button>`;
      li.querySelector('.locanda__suona')
        .addEventListener('click', (e) => suona(b, e.currentTarget));
      lista.appendChild(li);
    }
  }
  return PEZZI.length + BRANI.length;
}

/* ── i video: si aprono nel lightbox condiviso ────────────────────── */
function copertina(art, p) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'locanda__via';
  b.setAttribute('aria-label', `Guarda "${p.t}", ${p.d}`);
  b.innerHTML = `
    <img class="locanda__fermo" src="${CARTELLA}${p.id}.jpg" alt=""
         width="${p.w}" height="${p.h}" loading="lazy" decoding="async">
    <span class="locanda__play" aria-hidden="true"></span>
    <span class="locanda__durata mono" aria-hidden="true">${p.d}</span>`;
  b.addEventListener('click', () => {
    /* apriVideo chiama soloIo, che passa da fermaLocanda e ferma un
       brano eventualmente in corso — vedi piu' sotto. */
    apriVideo({ cartella: CARTELLA, pezzi: PEZZI, index: PEZZI.indexOf(p) });
    avvisa();
  });
  return b;
}

/* ── i brani, uno alla volta e senza far saltare la pagina ────────── */
let suonando = null;

function suona(b, bottone) {
  /* Se e' gia' questo, il bottone e' una pausa: uno che vuole fermare
     la musica preme dove l'ha fatta partire, non altrove. */
  if (suonando && suonando.id === b.id) {
    const a = suonando.audio;
    if (a.paused) { a.play().catch(() => {}); bottone.classList.add('suona'); }
    else { a.pause(); bottone.classList.remove('suona'); }
    return;
  }
  soloIo(fermaLocanda);
  fermaTutto();
  const a = new Audio(CARTELLA + b.id + '.m4a');
  a.preload = 'none';
  a.addEventListener('ended', () => {
    bottone.classList.remove('suona');
    bottone.style.removeProperty('--quanto');
  });
  a.addEventListener('timeupdate', () => {
    if (a.duration) bottone.style.setProperty('--quanto', (a.currentTime / a.duration * 100) + '%');
  });
  suonando = { id: b.id, audio: a, bottone };
  bottone.classList.add('suona');
  a.play().catch(() => bottone.classList.remove('suona'));
}

/* Video e canzoni si fermano a vicenda: un video che parla sopra una
   canzone e' lo stesso errore di due video insieme. */
const fermaLocanda = registra(() => fermaTutto());

function fermaTutto() {
  if (suonando) {
    suonando.audio.pause();
    suonando.bottone.classList.remove('suona');
    suonando.bottone.style.removeProperty('--quanto');
    suonando = null;
  }
}
