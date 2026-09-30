/* ═══════════════════════════════════════════════════════════════════
 * STUDIO CETS — il marchio e la campagna
 *
 * Il motore e' quello condiviso con gli esoscheletri (scheda.js): stessa
 * lastra, stessa cornice, stesso "un video alla volta". Qui c'e' solo
 * la roba di questo lavoro.
 *
 * La cartella di partenza ha sei file e sono sei pezzi finiti diversi:
 * per una volta non c'era niente da scremare e infatti ci sono tutti.
 * Vedi audit/porta-cest.py per come sono stati portati da 237 MB a 16.
 *
 * L'ordine non e' quello dei file. Apre la scadenza antincendio perche'
 * e' l'unico pezzo che ha un motivo per essere guardato OGGI — c'e' una
 * data dentro. Chiudono i due del marchio, che sono lo stesso pezzo in
 * due formati e stanno bene appaiati: e' anche l'unico punto della
 * pagina dove si vede la stessa cosa fatta due volte apposta.
 * ═══════════════════════════════════════════════════════════════════ */

import { scheda } from './scheda.js';

export const PEZZI = [
  { id: 'marchio-alto', t: 'Il marchio che si costruisce', d: '0:05', w: 720, h: 1280,
    n: 'Il logo animato in 9:16 per le storie: la linea che gira, lo scudo tricolore, il drone che si posa.' },
  { id: 'antincendio', t: 'La scadenza', d: '0:31', w: 720, h: 1280,
    n: 'Una scintilla in un quadro elettrico, poi la data: da fine settembre la manutenzione antincendio la firma solo un tecnico qualificato.' },
  { id: 'amministratori', t: 'Il servizio, per intero', d: '0:40', w: 720, h: 1280,
    n: 'Il giro completo: la firma che non copre, la rivalsa, il rilievo con drone, lo scudo — il pezzo da mandare a chi ha già chiesto.' },
  { id: 'ced-voce', t: 'Caro amministratore', d: '0:14', w: 1280, h: 860,
    n: 'Zero giorni liberi, sommerso dalle scartoffie: parla uno che ci è passato e finisce con cosa cambia — niente più caos, tempi dimezzati.' },
  { id: 'ced-vita', t: 'Riprenditi la tua vita', d: '0:16', w: 720, h: 1280,
    n: 'Stessa promessa senza parole: i fogli che sommergono la scrivania, poi lo stesso uomo che esce dallo studio.' },
  { id: 'marchio-largo', t: 'Lo stesso, in orizzontale', d: '0:05', w: 1280, h: 720,
    n: 'La versione 16:9, sigla di apertura e chiusura degli altri pezzi: non il verticale ritagliato, ma l’aria ridistribuita ai lati.' },
];

const mio = scheda({ nome: 'cest', cartella: 'cest/', pezzi: PEZZI });

export function initCest(quando) {
  return mio.monta(quando);
}
