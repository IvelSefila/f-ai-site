/* ═══════════════════════════════════════════════════════════════════
 * ESOSCHELETRI — i quattro pezzi del lancio
 *
 * Il motore sta in scheda.js ed e' lo stesso di Studio CETS: copertina
 * piu' bottone, il video nasce al clic con preload="none", uno alla
 * volta in tutta la pagina. Qui c'e' solo la roba di questo lavoro.
 *
 * I formati sono due, orizzontale e verticale e stanno insieme nella
 * stessa griglia: un trailer da mettere su YouTube e uno spot da mettere
 * in un reel sono due cose diverse anche a guardarle ferme e la forma
 * della copertina lo dice prima della didascalia.
 *
 * La scelta dei sei e' spiegata in audit/porta-eso.py. Vale la pena
 * ricordare cosa NON e' entrato: l'endcard del marchio, perche' dopo il
 * primo fotogramma la scritta diventa "HUJMAN ROBOTS"; e i due pezzi da
 * due minuti e mezzo — la camminata dentro il sito e un video di
 * approfondimento — che qui erano fuori tono. In una fila di spot da
 * dieci secondi due registrazioni lunghe non si guardano e pesavano
 * 10,4 MB dei 24,3 di tutta la sezione.
 * ═══════════════════════════════════════════════════════════════════ */

import { scheda } from './scheda.js';

export const PEZZI = [
  { id: 'trailer', t: 'Il trailer', d: '0:24', w: 1280, h: 720,
    n: 'Filmato principale del lancio: mostra il dispositivo in casa, in riabilitazione e in montagna, per YouTube e sito.' },
  { id: 'trekking', t: 'Trekking', d: '0:16', w: 720, h: 1280,
    n: 'Spot verticale per i social, rivolto a chi cerca aiuto nelle camminate in montagna.' },
  { id: 'spot', t: 'Più forza, più libertà', d: '0:32', w: 720, h: 1280,
    n: 'Spot verticale per la scheda prodotto: mostra l’uso quotidiano del dispositivo, chiuso dal marchio.' },
  { id: 'prodotto', t: 'Il dispositivo', d: '0:10', w: 720, h: 1280,
    n: 'Presentazione breve del dispositivo, da usare come apertura nei reel e nella pagina prodotto.' },
  { id: 'prova0', t: 'Vista frontale, studio', d: '0:10', w: 720, h: 1280,
    n: 'Prova di giro completo, per mostrare tutti i lati e mantenere identico l’aspetto in ogni inquadratura.' },
  { id: 'prova5', t: 'Vista frontale, controluce', d: '0:06', w: 720, h: 1302,
    n: 'Prova di inquadratura con luci da studio, per scegliere atmosfera e dettagli dei video del lancio.' },
  { id: 'prova3', t: 'Modulo centrale, dettaglio', d: '0:10', w: 720, h: 1302,
    n: 'Prova sui ganci e sul retro della cintura, per spot e schede che spiegano l’aggancio.' },
  { id: 'prova1', t: 'Dettaglio, macro', d: '0:05', w: 720, h: 1280,
    n: 'Prova ravvicinata da usare come stacco nei montaggi, dal particolare rosso al dispositivo intero.' },
  { id: 'prova6', t: 'Dettaglio, texture carbonio', d: '0:08', w: 720, h: 1254,
    n: 'Prova su materiali e articolazioni, da usare come inserto nei video per mostrare la costruzione.' },
];

const mio = scheda({ nome: 'eso', cartella: 'eso/', pezzi: PEZZI });

export function initEso(quando) {
  return mio.monta(quando);
}
