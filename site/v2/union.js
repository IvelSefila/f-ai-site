/* ═══════════════════════════════════════════════════════════════════
 * UNION ENERGIA — i video, e come si aprono
 *
 * Nove video per 4:09 di girato. Gli originali, esportati da Premiere,
 * pesavano 299 MB: a 21 Mbit/s un video da sette secondi fa 17 MB e su
 * un telefono in giro non parte. Rientrati in un riquadro da 1280 e
 * ricodificati a qualita' costante fanno 34,6 MB — l'88% in meno, e a
 * guardarli non si vede la differenza.
 *
 * Ma 34 MB sono comunque troppi da far scaricare a chi passa di qui per
 * leggere. Quindi la pagina non carica NESSUN video: mette una
 * copertina (una cinquantina di KB) e un bottone. Il video nasce al
 * clic, con preload="none", e prima di quel clic dal server non e'
 * uscito un byte di filmato. E' la stessa idea del laboratorio, dove i
 * giochi si scaricano solo se li apri.
 *
 * Uno alla volta: farne partire un secondo ferma il primo. Due video
 * che parlano insieme non sono una scelta, sono una dimenticanza.
 * ═══════════════════════════════════════════════════════════════════ */

/* forma: 'alto' = 9:16 (i social), 'largo' = 16:9.
   Le didascalie descrivono quello che si vede, non quello che mi
   piacerebbe che si vedesse.

   L'ORDINE E' QUELLO DELLA STORIA, non quello delle date: apre la
   locandina, che in sette secondi dice di cosa parla la campagna; poi i
   corti che presentano Davide, poi Luca, poi la cometa che spiega da
   dove viene tutto, poi i pezzi lunghi, e in fondo l'unico orizzontale.
   Chi arriva qui non conosce il mondo: se il primo video che apre e'
   quello da un minuto e venti non capisce chi sono questi animali. */
import { apriVideo } from './video-lightbox.js';

export const PEZZI = [
  { id: 'locandina', t: 'Azzeriamola green', d: '0:07', forma: 'alto',
    n: 'La locandina animata della campagna: il payoff, i tre passaggi e l’invito a scrivere.' },
  { id: 'davide-01', t: 'Caro benzina', d: '0:04', forma: 'alto',
    n: 'Davide il lama davanti a una pompa di benzina, nel primo dei corti che lo presentano.' },
  { id: 'davide-02', t: 'La bolletta di luce e gas', d: '0:08', forma: 'alto',
    n: 'Davide sulla porta di casa, con la bolletta appena arrivata.' },
  { id: 'luca-asino', t: 'Luca l’asino sommerso', d: '0:07', forma: 'alto',
    n: 'Un salotto sepolto sotto un mare di bollette, e Luca l’asino in mezzo.' },
  { id: 'davide-03', t: 'La cometa a forma di zero', d: '0:12', forma: 'alto',
    n: 'L’origine di tutto: una cometa a forma di 0 entra nell’atmosfera, e nasce il mondo parallelo.' },
  { id: 'insieme', t: 'Insieme si può', d: '1:18', forma: 'alto',
    n: 'Il pezzo lungo: la richiesta di partecipazione e il gancio finale, sottotitolato.' },
  { id: 'bollette-roby', t: 'Rapito dalle bollette', d: '0:30', forma: 'alto',
    n: 'Un uomo sollevato in cielo da un disco volante sopra un prato: le bollette che ti portano via.' },
  { id: 'marco', t: 'Marco', d: '0:35', forma: 'alto',
    n: 'Sembra una ripresa dal vivo in un viale alberato e non lo è: persona, luce e movimento sono tutti generati.' },
  { id: 'dialogo-roby', t: 'Quanto ti costa la tua casa', d: '1:08', forma: 'largo',
    n: 'Un dialogo fra due persone su una panchina. L’unico orizzontale della serie.' },
];

const CARTELLA = 'lavori/';

/* Il video si apre nel lightbox condiviso (video-lightbox.js): la
   copertina qui non cambia mai forma, e' sempre lo stesso bottone. */
function copertina(art, p) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'union__via';
  b.setAttribute('aria-label', `Guarda "${p.t}", ${p.d}`);
  b.innerHTML = `
    <img class="union__fermo" src="${CARTELLA}${p.id}.jpg" alt=""
         loading="lazy" decoding="async">
    <span class="union__play" aria-hidden="true"></span>
    <span class="union__durata mono" aria-hidden="true">${p.d}</span>`;
  b.addEventListener('click', () => {
    apriVideo({ cartella: CARTELLA, pezzi: PEZZI, index: PEZZI.indexOf(p) });
    avvisa();
  });
  return b;
}

/* avvisa() lo passa app.js: serve a segnare nel dossier che
   qualcuno ha guardato un lavoro vero, non solo scorso la pagina. */
let avvisa = () => {};

export function initUnion(quando) {
  if (quando) avvisa = quando;
  const griglia = document.querySelector('.union__lavori');
  if (!griglia) return 0;
  griglia.textContent = '';     /* via la scaletta per chi non ha JS */

  for (const p of PEZZI) {
    const art = document.createElement('article');
    art.className = 'union__pezzo';
    art.dataset.forma = p.forma;
    art.dataset.id = p.id;
    art.innerHTML = `<h4>${p.t}</h4><p>${p.n}</p>`;
    art.prepend(copertina(art, p));
    griglia.appendChild(art);
  }
  return PEZZI.length;
}
