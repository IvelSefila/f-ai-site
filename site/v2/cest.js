/* ═══════════════════════════════════════════════════════════════════
 * STUDIO CETS — il marchio e la campagna
 *
 * Il motore e' quello condiviso con gli esoscheletri (scheda.js): stessa
 * lastra, stessa cornice, stesso "un video alla volta". Qui c'e' solo
 * la roba di questo lavoro.
 *
 * La cartella di partenza ha sei file e sono sei pezzi finiti diversi:
 * per una volta non c'era niente da scremare, e infatti ci sono tutti.
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
  { id: 'antincendio', t: 'La scadenza', d: '0:31', w: 720, h: 1280,
    n: 'Una scintilla dentro un quadro elettrico, poi la data: da fine settembre la manutenzione antincendio la può firmare solo un tecnico qualificato. È il pezzo che ha un motivo per essere guardato adesso.' },
  { id: 'amministratori', t: 'Il servizio, per intero', d: '0:40', w: 720, h: 1280,
    n: 'Il giro completo: la firma che non copre, la rivalsa, il rilievo con drone, e alla fine lo scudo. Il pezzo lungo, quello che si manda a chi ha già chiesto.' },
  { id: 'ced-voce', t: 'Caro amministratore', d: '0:14', w: 1280, h: 860,
    n: 'Zero giorni liberi, sommerso dalle scartoffie. Parla uno che dice di esserci passato, e finisce con la lista di cosa cambia: niente più caos, tempi dimezzati.' },
  { id: 'ced-vita', t: 'Riprenditi la tua vita', d: '0:16', w: 720, h: 1280,
    n: 'Stessa promessa senza una parola detta: i fogli che sommergono la scrivania, poi lo stesso uomo che esce dallo studio. Il taglio da mettere in cima a una campagna.' },
  { id: 'marchio-largo', t: 'Il marchio che si costruisce', d: '0:05', w: 1280, h: 720,
    n: 'Il logo animato in 16:9: la linea che gira, lo scudo tricolore, il drone che si posa. È la sigla di apertura e di chiusura di tutti gli altri pezzi.' },
  { id: 'marchio-alto', t: 'Lo stesso, in verticale', d: '0:05', w: 720, h: 1280,
    n: 'La versione 9:16 per le storie. Non è il 16:9 ritagliato: l’aria intorno allo scudo si sposta dai lati a sopra e sotto, se no lo scudo resta minuscolo in mezzo.' },
];

const mio = scheda({ nome: 'cest', cartella: 'cest/', pezzi: PEZZI });

export function initCest(quando) {
  return mio.monta(quando);
}
