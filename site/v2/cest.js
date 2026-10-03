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
    n: 'Anima il marchio dello studio per aprire e chiudere i video verticali di storie e reel.' },
  { id: 'antincendio', t: 'La scadenza', d: '0:31', w: 720, h: 1280,
    n: 'Promuove il servizio antincendio agli amministratori: gli interventi spettano a tecnici qualificati.' },
  { id: 'amministratori', t: 'Il servizio, per intero', d: '0:40', w: 720, h: 1280,
    n: 'Presenta agli amministratori i servizi dello studio, dal rilievo con drone alla tutela nelle contestazioni.' },
  { id: 'ced-voce', t: 'Caro amministratore', d: '0:14', w: 1280, h: 860,
    n: 'Propone agli amministratori di affidare le pratiche al CED dello studio, per dimezzare i tempi.' },
  { id: 'ced-vita', t: 'Riprenditi la tua vita', d: '0:16', w: 720, h: 1280,
    n: 'Versione verticale senza voce della proposta del CED agli amministratori, pensata per storie e reel.' },
  { id: 'marchio-largo', t: 'Lo stesso, in orizzontale', d: '0:05', w: 1280, h: 720,
    n: 'Anima il marchio in formato orizzontale per aprire e chiudere gli altri video dello studio.' },
];

const mio = scheda({ nome: 'cest', cartella: 'cest/', pezzi: PEZZI });

export function initCest(quando) {
  return mio.monta(quando);
}
