/* ═══════════════════════════════════════════════════════════════════
 * UNION ENERGIA — i video e come si aprono
 *
 * Nove video per 4:09 di girato. Gli originali, esportati da Premiere,
 * pesavano 299 MB: a 21 Mbit/s un video da sette secondi fa 17 MB e su
 * un telefono in giro non parte. Rientrati in un riquadro da 1280 e
 * ricodificati a qualita' costante fanno 34,6 MB — l'88% in meno e a
 * guardarli non si vede la differenza.
 *
 * Ma 34 MB sono comunque troppi da far scaricare a chi passa di qui per
 * leggere. Quindi la pagina non carica NESSUN video: mette una
 * copertina (una cinquantina di KB) e un bottone. Il video nasce al
 * clic, con preload="none" e prima di quel clic dal server non e'
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
   dove viene tutto, poi i pezzi lunghi e in fondo l'unico orizzontale.
   Chi arriva qui non conosce il mondo: se il primo video che apre e'
   quello da un minuto e venti non capisce chi sono questi animali. */
import { apriVideo } from './video-lightbox.js';

export const PEZZI = [
  { id: 'cashback', t: 'Il cashback', d: '0:21', forma: 'alto',
    n: 'Spiega il cashback sulla bolletta a chi segue la campagna sui social.' },
  { id: 'locandina', t: 'Azzeriamola green', d: '0:07', forma: 'alto',
    n: 'Apre la campagna e invita a scrivere in privato per saperne di più.' },
  { id: 'davide-01', t: 'Caro benzina', d: '0:04', forma: 'alto',
    n: 'Primo corto con Davide: parte dal costo del carburante per arrivare alle bollette.' },
  { id: 'davide-02', t: 'La bolletta di luce e gas', d: '0:08', forma: 'alto',
    n: 'Secondo corto con Davide: porta il discorso dalla benzina alla bolletta di luce e gas.' },
  { id: 'luca-asino', t: 'Luca l’asino sommerso', d: '0:07', forma: 'alto',
    n: 'Corto con Luca, che rappresenta chi subisce la bolletta senza sapere come uscirne.' },
  { id: 'davide-03', t: 'La cometa a forma di zero', d: '0:12', forma: 'alto',
    n: 'Racconta da dove nasce l’idea dello zero e invita a diventare Cliente Privilegiato.' },
  { id: 'insieme', t: 'Insieme si può', d: '1:18', forma: 'alto',
    n: 'Pezzo lungo in cui una persona presenta l’iniziativa e invita a partecipare.' },
  { id: 'bollette-roby', t: 'Rapito dalle bollette', d: '0:30', forma: 'alto',
    n: 'Racconta il peso delle bollette con una scena di fantasia, poi mostra la bolletta a zero.' },
  { id: 'marco', t: 'Marco', d: '0:35', forma: 'alto',
    n: 'Testimonial creato con l’AI: spiega la condivisione dei risparmi e rimanda al contatto diretto.' },
  { id: 'dialogo-roby', t: 'Quanto ti costa la tua casa', d: '1:08', forma: 'largo',
    n: 'Conversazione tra amici per far capire l’idea della campagna e invitare alla diretta.' },
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
