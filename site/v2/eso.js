/* ═══════════════════════════════════════════════════════════════════
 * ESOSCHELETRI — i sei pezzi del lancio
 *
 * Il motore sta in scheda.js ed e' lo stesso di Studio CETS: copertina
 * piu' bottone, il video nasce al clic con preload="none", uno alla
 * volta in tutta la pagina. Qui c'e' solo la roba di questo lavoro.
 *
 * I formati sono due, orizzontale e verticale, e stanno insieme nella
 * stessa griglia: un trailer da mettere su YouTube e uno spot da mettere
 * in un reel sono due cose diverse anche a guardarle ferme, e la forma
 * della copertina lo dice prima della didascalia.
 *
 * La scelta dei sei e' spiegata in audit/porta-eso.py. Vale la pena
 * ricordare cosa NON e' entrato: l'endcard del marchio, perche' dopo il
 * primo fotogramma la scritta diventa "HUJMAN ROBOTS"; e i due pezzi da
 * due minuti e mezzo — la camminata dentro il sito e un video di
 * approfondimento — che qui erano fuori tono. In una fila di spot da
 * dieci secondi due registrazioni lunghe non si guardano, e pesavano
 * 10,4 MB dei 24,3 di tutta la sezione.
 * ═══════════════════════════════════════════════════════════════════ */

import { scheda } from './scheda.js';

export const PEZZI = [
  { id: 'trailer', t: 'Il trailer', d: '0:24', w: 1280, h: 720,
    n: 'Ventiquattro secondi nelle tre vite del prodotto: casa, palestra di riabilitazione, montagna.' },
  { id: 'trekking', t: 'Trekking', d: '0:16', w: 720, h: 1280,
    n: 'Il verticale per i social: un uomo sale un crinale con l’esoscheletro, senza sforzo visibile.' },
  { id: 'borgo', t: 'La spesa, in salita', d: '0:10', w: 1280, h: 720,
    n: 'Un borgo in pendenza, la spesa in mano: spiega a chi serve senza dire una parola.' },
  { id: 'spot', t: 'Più forza, più libertà', d: '0:11', w: 720, h: 1280,
    n: 'Lo spot che finisce sulla scheda prodotto: il dispositivo staccato sul bianco, il claim, e basta.' },
  { id: 'e-legs', t: 'E-Legs Trek', d: '0:12', w: 720, h: 1280,
    n: 'La stessa famiglia di prodotti raccontata per chi va in montagna: un marchio diverso, un pubblico diverso.' },
  { id: 'prodotto', t: 'Il dispositivo', d: '0:10', w: 720, h: 1280,
    n: 'Product film: solo l’oggetto, fumo e luce radente — com’è fatto, quando il resto è narrazione.' },
];

const mio = scheda({ nome: 'eso', cartella: 'eso/', pezzi: PEZZI });

export function initEso(quando) {
  return mio.monta(quando);
}
