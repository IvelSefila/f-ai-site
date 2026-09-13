/* ═══════════════════════════════════════════════════════════════════
 * ESOSCHELETRI — i sei pezzi del lancio
 *
 * Stessa regola degli altri due casi: aprendo la pagina non si scarica
 * nemmeno un byte di video. Copertina piu' bottone, il file nasce al
 * clic con preload="none".
 *
 * Qui i formati sono due, orizzontale e verticale, e stanno insieme
 * nella stessa griglia: un trailer da mettere su YouTube e uno spot da
 * mettere in un reel sono due cose diverse anche a guardarle ferme, e
 * la forma della copertina lo dice prima della didascalia.
 *
 * La scelta dei sei e' spiegata in audit/porta-eso.py. Vale la pena
 * ricordare cosa NON e' entrato: l'endcard del marchio, perche' dopo il
 * primo fotogramma la scritta diventa "HUJMAN ROBOTS"; e i due pezzi da
 * due minuti e mezzo — la camminata dentro il sito e un video di
 * approfondimento — che qui erano fuori tono. In una fila di spot da
 * dieci secondi due registrazioni lunghe non si guardano, e pesavano
 * 10,4 MB dei 24,3 di tutta la sezione.
 * ═══════════════════════════════════════════════════════════════════ */

import { registra, soloIo } from './uno-alla-volta.js';

const CARTELLA = 'eso/';

export const PEZZI = [
  { id: 'trailer', t: 'Il trailer', d: '0:24', w: 1280, h: 720,
    n: 'Ventiquattro secondi che fanno il giro delle tre vite del prodotto: la casa, la palestra di riabilitazione, la montagna.' },
  { id: 'trekking', t: 'Trekking', d: '0:16', w: 720, h: 1280,
    n: 'Il verticale per i social: un uomo sale un crinale con l’esoscheletro addosso, e non si vede uno sforzo.' },
  { id: 'borgo', t: 'La spesa, in salita', d: '0:10', w: 1280, h: 720,
    n: 'Un borgo italiano in pendenza, la spesa in mano. È l’inquadratura che spiega a chi serve senza dire una parola.' },
  { id: 'spot', t: 'Più forza, più libertà', d: '0:11', w: 720, h: 1280,
    n: 'Lo spot che finisce sulla scheda prodotto: il dispositivo staccato sul bianco, il claim, e basta.' },
  { id: 'e-legs', t: 'E-Legs Trek', d: '0:12', w: 720, h: 1280,
    n: 'La stessa famiglia di prodotti raccontata per chi va in montagna: un marchio diverso, un pubblico diverso.' },
  { id: 'prodotto', t: 'Il dispositivo', d: '0:10', w: 720, h: 1280,
    n: 'Product film: solo l’oggetto, fumo e luce radente. Serve a far vedere com’è fatto quando il resto è narrazione.' },
];

const PER_ID = new Map(PEZZI.map(p => [p.id, p]));

/* La copertina e' una funzione perche' va rifatta quando un altro video
   prende il turno: vedi la nota in union.js. */
function copertina(art, p) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'eso__via';
  b.setAttribute('aria-label', `Guarda "${p.t}", ${p.d}`);
  b.innerHTML = `
    <img class="eso__fermo" src="${CARTELLA}${p.id}.jpg" alt=""
         width="${p.w}" height="${p.h}" loading="lazy" decoding="async">
    <span class="eso__play" aria-hidden="true"></span>
    <span class="eso__durata mono" aria-hidden="true">${p.d}</span>`;
  b.addEventListener('click', () => parte(art, p, b));
  return b;
}

const fermaEso = registra(() => rimetti());

function rimetti(tranne) {
  for (const v of document.querySelectorAll('.eso__lavori video')) {
    const art = v.closest('.eso__pezzo');
    if (art === tranne) continue;
    v.pause();
    v.replaceWith(copertina(art, PER_ID.get(art.dataset.id)));
    art.classList.remove('in-onda');
  }
}

/* avvisa() lo passa app.js: serve a segnare nel dossier che
   qualcuno ha guardato un lavoro vero, non solo scorso la pagina. */
let avvisa = () => {};

export function initEso(quando) {
  if (quando) avvisa = quando;
  const griglia = document.querySelector('.eso__lavori');
  if (!griglia) return 0;
  griglia.textContent = '';     /* via la scaletta per chi non ha JS */

  for (const p of PEZZI) {
    const art = document.createElement('article');
    art.className = 'eso__pezzo';
    art.dataset.forma = p.w >= p.h ? 'largo' : 'alto';
    art.dataset.id = p.id;
    art.innerHTML = `<h4>${p.t}</h4><p>${p.n}</p>`;
    art.prepend(copertina(art, p));
    griglia.appendChild(art);
  }
  return PEZZI.length;
}

function parte(art, p, bottone) {
  soloIo(fermaEso);
  rimetti(art);

  const v = document.createElement('video');
  v.src = CARTELLA + p.id + '.mp4';
  v.poster = CARTELLA + p.id + '.jpg';
  v.controls = true;
  v.playsInline = true;
  v.preload = 'none';
  v.setAttribute('aria-label', p.t);
  bottone.replaceWith(v);
  art.classList.add('in-onda');
  avvisa();
  v.play().catch(() => {});
}
