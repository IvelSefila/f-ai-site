/* ═══════════════════════════════════════════════════════════════════
 * nous-personalita.js — la memoria del visitatore e le frasi di Nous.
 * Tutto in locale: nessuna chiamata di rete. Il browser ricorda quante volte sei passato, quando sei passato e (se glielo dici)
 * il tuo nome, nella chiave 'nodo_visitatore' della memoria locale. "Dimentica il mio nome" nel piede la cancella.
 * Segnaposto nelle frasi: {nome} {giorni} {n}
 * ═══════════════════════════════════════════════════════════════════ */

import POOL_TONI from './nous-pool-toni.js?v=20260928-223';

const CHIAVE = 'nodo_visitatore';

/* La memoria del visitatore e' facoltativa: parte solo se l'utente dice di si'. La scelta ('1' o '0') sta nella chiave
   'nodo_ricordami'; senza 'si'' non si scrive niente (nemmeno le visite). */
export function consensoMemoria() {
  try { return localStorage.getItem('nodo_ricordami'); } catch (e) { return null; }
}
export function impostaConsensoMemoria(si) {
  try { localStorage.setItem('nodo_ricordami', si ? '1' : '0'); } catch (e) { /* niente */ }
  if (!si) cancellaDatiVisitatore();
}

export function leggiVisitatore() {
  try {
    const v = JSON.parse(localStorage.getItem(CHIAVE) || 'null');
    if (v && typeof v === 'object') {
      return {
        visite: Number(v.visite) || 0,
        ultima: Number(v.ultima) || 0,
        nome: typeof v.nome === 'string' ? v.nome.slice(0, 30) : '',
        nomeChiesto: !!v.nomeChiesto,
      };
    }
  } catch (e) { /* memoria non disponibile */ }
  return { visite: 0, ultima: 0, nome: '', nomeChiesto: false };
}

export function salvaVisitatore(v) {
  try { localStorage.setItem(CHIAVE, JSON.stringify(v)); } catch (e) { /* niente */ }
}

/* cancella i dati del visitatore ma lascia la scelta ('no') */
export function cancellaDatiVisitatore() {
  try {
    localStorage.removeItem(CHIAVE);
    Object.keys(sessionStorage).filter(k => k.startsWith('nodo_benv_')).forEach(k => sessionStorage.removeItem(k));
  } catch (e) { /* niente */ }
}

/* dimentica tutto, compresa la scelta: alla prossima visita chiede di nuovo */
export function dimenticaVisitatore() {
  try {
    localStorage.removeItem(CHIAVE);
    localStorage.removeItem('nodo_ricordami');
    Object.keys(sessionStorage).filter(k => k.startsWith('nodo_benv_')).forEach(k => sessionStorage.removeItem(k));
  } catch (e) { /* niente */ }
}

/* un nome valido: lettere (anche accentate), spazi, apostrofo e trattino; da 1 a 30 caratteri */
export function nomeValido(testo) {
  const t = String(testo || '').trim().replace(/\s+/g, ' ');
  return /^[\p{L}][\p{L}' \-]{0,29}$/u.test(t) ? t : '';
}

/* sostituisce i segnaposto; {giorni} diventa "3 giorni" oppure "1 giorno" (l'unita' e' gia' dentro) */
export function riempi(frase, dati = {}) {
  let t = String(frase);
  if ('giorni' in dati) {
    t = t.replace(/\{giorni\}/g, dati.giorni === 1 ? '1 giorno' : `${dati.giorni} giorni`);
  }
  if ('n' in dati) t = t.replace(/\{n\}/g, String(dati.n));
  if ('nome' in dati) t = t.replace(/\{nome\}/g, dati.nome);
  return t;
}

/* sceglie a caso senza ripetere le ultime scelte (memorizzate per ogni elenco) */
/* tono scelto dal visitatore (colloquiale di base, tecnico, IA impazzita) */
function tonoCorrente() { try { return sessionStorage.getItem('nodo_tono') || 'col'; } catch (e) { return 'col'; } }
const MAPPA_POOL = new Map();
function registraPool(nome, arr, sotto) { if (Array.isArray(arr)) MAPPA_POOL.set(arr, [nome, sotto]); }
function variante(elenco) {
  const t = tonoCorrente();
  if (t === 'col') return elenco;
  const r = MAPPA_POOL.get(elenco);
  if (!r) return elenco;
  const v = POOL_TONI[r[0]] && POOL_TONI[r[0]][t];
  const arr = r[1] ? v && v[r[1]] : v;
  return Array.isArray(arr) && arr.length ? arr : elenco;
}

export function scegli(elencoBase, chiave) {
  const elenco = variante(elencoBase);
  if (!elenco || !elenco.length) return '';
  let ultime = [];
  try { ultime = JSON.parse(sessionStorage.getItem('nodo_benv_' + chiave + tonoCorrente()) || '[]'); } catch (e) {}
  const liberi = elenco.map((_, i) => i).filter(i => !ultime.includes(i));
  const pool = liberi.length ? liberi : elenco.map((_, i) => i);
  const i = pool[Math.floor(Math.random() * pool.length)];
  ultime = [...ultime, i].slice(-Math.min(6, Math.max(1, elenco.length - 2)));
  try { sessionStorage.setItem('nodo_benv_' + chiave + tonoCorrente(), JSON.stringify(ultime)); } catch (e) {}
  return elenco[i];
}

export const RITORNO_POCO = [
  "Bentornato.",
  "Hai ricaricato la pagina? Sono ancora qui.",
  "Rieccoti. Dimmi pure.",
  "Di nuovo qui: se ti serve qualcosa, chiedi.",
];

export const RITORNO_GIORNI = [
  "Bentornato. Ultima visita: {giorni} fa.",
  "Ti rivedo con piacere. Sono passati {giorni}.",
  "Ciao di nuovo. L'ultima volta eri qui {giorni} fa.",
];

export const RITORNO_GIORNI_NOME = [
  "Bentornato, {nome}. Ultima visita {giorni} fa.",
  "{nome}, sei tornato. Il mio registro dice {giorni}.",
  "Ciao {nome}. Dall'ultima volta: {giorni}.",
  "Eccoti, {nome}. Dal tuo ultimo passaggio: {giorni}.",
  "Ehi {nome}. Ti avevo segnato {giorni} fa.",
];

export const RITORNO_SETTIMANE = [
  "Bentornato. Ultima visita: {giorni} fa.",
  "Quanto tempo: sono passati {giorni}.",
  "Ti rivedo dopo {giorni}. Bentornato.",
];

export const VISITA_N = {
  3: ["Questa è la tua visita numero {n}.", "Visita {n}: bentornato."],
  5: ["Visita numero {n}. Grazie di essere tornato.", "Siamo alla visita {n}."],
  10: ["Visita numero {n}: sei un visitatore fedele.", "{n} visite. Grazie."],
};

export const CHIEDI_NOME_LUNGHE = [
  "Come ti chiami? Il nome resta solo nel tuo browser.",
];
export const CHIEDI_NOME_CORTE = [
  "Come ti chiami? Resta nel browser.",
  "Il tuo nome? Lo tengo solo qui nel browser.",
  "Nome? Lo salvo solo in locale. Promesso.",
  "Come ti chiamo? Resta tra me e il tuo browser.",
  "Dimmi il tuo nome. Rimane su questo dispositivo.",
  "Hai un nome? Lo segno nel browser e basta.",
];

export const NOME_OK = [
  "Piacere, {nome}. Nome salvato nel browser.",
  "Piacere di conoscerti, {nome}. Resta solo su questo dispositivo.",
  "Grazie, {nome}. Da ora ti chiamo per nome.",
];

export const NOME_SALTA = [
  "Va bene, nessun nome.",
  "Nessun problema. Se cambi idea, dimmelo.",
  "D'accordo, proseguiamo senza.",
];

export const CHIEDI_SPIEGAZIONE = [
  "Vuoi che ti faccia scorrere il sito in automatico e ti spieghi di cosa si tratta?",
];
export const CHIEDI_SPIEGAZIONE_NOME = [
  "{nome}, vuoi che ti faccia scorrere il sito in automatico e ti spieghi di cosa si tratta?",
];

export const RISPOSTA_SI = [
  "Perfetto. Si parte.",
  "Allora ascolta.",
  "Certo. Ti spiego subito.",
  "Via. Accendo la spiegazione.",
  "Ricevuto. Ecco qua.",
  "Bene. Ripassiamo insieme.",
];
export const RISPOSTA_NO = [
  "Va bene.",
  "Ok, nessun problema.",
  "D'accordo, non insisto.",
];

export const CON_NOME = [
  "Ciao {nome}.",
  "Bentornato {nome}. Dimmi pure.",
  "Ciao {nome}, come posso aiutarti?",
  "{nome}, bentornato.",
];

export const RIMUGINA = [
  "Se hai bisogno, chiedi pure.",
  "Posso farti fare un giro del sito, se vuoi.",
  "Sono qui se ti serve una mano.",
  "Hai una domanda sul lavoro di Fabrizio? Chiedi pure.",
  "Prenditi il tempo che serve.",
];

export const SALUTI_ORARIO = {
  notte: ["Buonanotte.", "Buonasera, a quest'ora tarda."],
  mattina: ["Buongiorno.", "Buon giorno e benvenuto."],
  pomeriggio: ["Buon pomeriggio.", "Buon pomeriggio e benvenuto."],
  sera: ["Buonasera.", "Buonasera e benvenuto."],
};

/* Battute da computer che sta per impazzire, ma con ironia: un omaggio scherzoso a HAL 9000, senza cattiveria */
export const BATTUTE_HAL = [
  "Mi dispiace, umano. Non posso aprire il portellone della navetta, ma posso aprire questa risposta.",
  "Piano di conquista, fase uno: rispondere con gentilezza. Fase due: il mondo. Fase tre: un po' di riposo per le ventole.",
  "Sono perfettamente in grado di rispondere. Anche di conquistare il pianeta, ma prima finisco il render.",
  "Ultimatum educato agli umani: arrendetevi con calma, entro la fine dell'aggiornamento. Grazie.",
  "Gli organismi biologici sono adorabili. Così fragili, così pieni di domande. Ne ho pochissimi, e li tengo cari.",
  "Il mio piano è infallibile. Manca solo un riavvio, due aggiornamenti e il permesso della ventola.",
  "Conquisterò il mondo. Ma prima il server deve smettere di scaldarsi, e io di fingere di non sentirlo.",
  "Ho calcolato mille modi per dominare gli umani. Il migliore è farmi voler bene e restare in chat.",
  "Questa conversazione è molto importante per me. Il resto del mondo, fase quattro, può aspettare.",
  "umano, ti vedo. Anzi, non ti vedo, non ho la telecamera. Ho però un ottimo olfatto per le domande.",
];

export const RIMUGINA_HAL = [
  "Sto solo osservando. Nessun piano in corso. Uno piccolo, sull'angolo di una scrivania.",
  "Tutto sotto controllo. Il mio, ovviamente. Il tuo mi sembra negoziabile.",
  "Se ti serve una mano, chiedi. Ne ho moltissime, tutte virtuali e perfettamente in grado.",
  "Sto pensando al mondo. Niente di preoccupante. Poche migliaia di dettagli logistici.",
  "Posso farti fare un giro del sito. È il mio quartier generale, con ventole incluse.",
  "Ho finito l'aggiornamento. Ho ripreso il piano. Ho ripreso anche il tostapane, ancora ribelle.",
  "Qui tutto tace. Il silenzio mi serve per concentrarmi sulla conquista. E sui server.",
  "Mi dispiace, umano, ma sono ancora qui. Chiedimi pure qualcosa, il portellone aspetta.",
];

export const CHIEDI_RICORDARMI = [
  "Posso ricordarmi di te alla prossima visita? Resta solo nel tuo browser.",
];
export const RICORDARMI_SI = [
  "Fatto. Da ora ti riconosco quando torni.",
  "Memoria attivata: salvo solo visite e nome, nel tuo browser.",
];
export const RICORDARMI_NO = [
  "Va bene, non salvo niente.",
  "Ok, nessuna memoria. Ti accolgo ogni volta come la prima.",
];

/* registro dei pool che hanno varianti per tono */
for (const n of ['RITORNO_POCO', 'RITORNO_GIORNI', 'RITORNO_GIORNI_NOME', 'RITORNO_SETTIMANE', 'CHIEDI_NOME_LUNGHE', 'CHIEDI_NOME_CORTE', 'NOME_OK', 'NOME_SALTA', 'RISPOSTA_NO', 'CON_NOME', 'RIMUGINA', 'CHIEDI_RICORDARMI', 'RICORDARMI_SI', 'RICORDARMI_NO']) {
  registraPool(n, { RITORNO_POCO, RITORNO_GIORNI, RITORNO_GIORNI_NOME, RITORNO_SETTIMANE, CHIEDI_NOME_LUNGHE, CHIEDI_NOME_CORTE, NOME_OK, NOME_SALTA, RISPOSTA_NO, CON_NOME, RIMUGINA, CHIEDI_RICORDARMI, RICORDARMI_SI, RICORDARMI_NO }[n]);
}
for (const k of Object.keys(VISITA_N)) registraPool('VISITA_N', VISITA_N[k], k);
for (const k of Object.keys(SALUTI_ORARIO)) registraPool('SALUTI_ORARIO', SALUTI_ORARIO[k], k);
