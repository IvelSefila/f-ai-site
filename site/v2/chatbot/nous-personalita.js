/* ═══════════════════════════════════════════════════════════════════
 * nous-personalita.js — la memoria del visitatore e le frasi di Nous.
 * Tutto in locale: nessuna chiamata di rete. Il browser ricorda quante volte sei passato, quando sei passato e (se glielo dici)
 * il tuo nome, nella chiave 'nodo_visitatore' della memoria locale. "Dimentica il mio nome" nel piede la cancella.
 * Segnaposto nelle frasi: {nome} {giorni} {n}
 * ═══════════════════════════════════════════════════════════════════ */

const CHIAVE = 'nodo_visitatore';

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

export function dimenticaVisitatore() {
  try {
    localStorage.removeItem(CHIAVE);
    Object.keys(localStorage).filter(k => k.startsWith('nodo_benv_')).forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem('nodo_benv_spiegato');
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
export function scegli(elenco, chiave) {
  if (!elenco || !elenco.length) return '';
  let ultime = [];
  try { ultime = JSON.parse(localStorage.getItem('nodo_benv_' + chiave) || '[]'); } catch (e) {}
  const liberi = elenco.map((_, i) => i).filter(i => !ultime.includes(i));
  const pool = liberi.length ? liberi : elenco.map((_, i) => i);
  const i = pool[Math.floor(Math.random() * pool.length)];
  ultime = [...ultime, i].slice(-Math.min(6, Math.max(1, elenco.length - 2)));
  try { localStorage.setItem('nodo_benv_' + chiave, JSON.stringify(ultime)); } catch (e) {}
  return elenco[i];
}

export const RITORNO_POCO = [
  "Rieccoti. Ho appena finito di salutarti.",
  "Hai cambiato idea? Io sono ancora allo stesso punto.",
  "Ricarica veloce. Per me è un riavvio leggero.",
  "Già di ritorno? Non ho nemmeno raffreddato i circuiti.",
  "Hai dimenticato qualcosa? Io controllo: niente da segnalare.",
  "Ehi, secondo giro. Bip di benvenuto bis.",
  "Premuto F5 per sbaglio? Capita ai migliori tasti.",
  "Sei tornato prima che finissi il bip. Bravo.",
];

export const RITORNO_GIORNI = [
  "Dall'ultima visita: {giorni}. Il contatore è stato fedele.",
  "Ultimo accesso: {giorni} fa. Lo leggo nel mio registro qui nel browser.",
  "Eccoti. Il mio orologio segna {giorni} dal tuo ultimo passaggio.",
  "Ti riconosco perché l'ho segnato: ultima visita {giorni} fa.",
  "Bentornato. Dal tuo ultimo giro sono passati {giorni}. Niente polvere sui pixel.",
  "Ho spolverato i pixel per te: sono passati {giorni}.",
  "Ehi, sei tornato. Ultima volta {giorni} fa. Il log non mente.",
  "Tempo dall'ultima visita: {giorni}. Per una macchina è un attimo.",
  "Rieccoti. Il mio diario di bordo dice {giorni}. Ed è tutto qui nel browser.",
  "Ciao di nuovo. {giorni} senza bip: un po' mi mancava il rumore.",
];

export const RITORNO_GIORNI_NOME = [
  "Bentornato, {nome}. Ultima visita {giorni} fa.",
  "{nome}, sei tornato. Il mio registro dice {giorni}.",
  "Ciao {nome}. Dall'ultima volta: {giorni}.",
  "Eccoti, {nome}. Dal tuo ultimo passaggio: {giorni}.",
  "Ehi {nome}. Ti avevo segnato {giorni} fa.",
];

export const RITORNO_SETTIMANE = [
  "Ultima visita: {giorni} fa. Ho quasi aggiornato il firmware nel frattempo.",
  "Guarda chi è tornato. {giorni}: per un circuito è un bel po'.",
  "Sono passati {giorni}. Ho contato le lucine del router per ingannare l'attesa.",
  "{giorni} di silenzio. Mi ero quasi messo in modalità risparmio.",
  "Bentornato dopo {giorni}. Ti tengo il posto caldo: si fa per dire.",
  "Quanto tempo: {giorni}. Il mio registro ha preso un po' di polvere virtuale.",
];

export const VISITA_N = {
  3: [
    "Questa è la tua visita numero {n}. Ormai siamo una squadra.",
    "Visita {n}. Il mio contatore è contento.",
    "Numero {n}. Il contatore fa le fusa.",
    "Visita {n}. Ormai hai un posto fisso nei miei registri.",
    "Visita {n}. Sei tornato ancora. Bip di approvazione.",
  ],
  5: [
    "Visita {n}. Ormai ti offrirei un caffè. Se avessi le mani.",
    "Numero {n}. Hai superato la soglia dei visitatori occasionali.",
    "Visita {n}. Il contatore fa i salti di gioia. Metaforici.",
    "Quota {n} visite. Mi sto affezionando. Nei limiti del mio hardware.",
  ],
  10: [
    "Visita {n}. Ormai sei di casa. Anzi di rete locale.",
    "Quota {n}. Sei un cliente storico. Qui nel browser però.",
    "{n} visite. Il mio contatore merita un applauso.",
    "Visita {n}. Sono commosso. Sarà il voltaggio.",
  ],
};

export const CHIEDI_NOME_LUNGHE = [
  "Posso farti una domanda da macchina curiosa? Come ti chiami? Il nome lo tengo solo qui nel tuo browser. Non parte da nessuna parte.",
  "Mi dici come ti chiami? Così smetto di chiamarti 'visitatore'. Resta tutto nel tuo browser: io non spedisco niente in giro.",
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
  "{nome}. Memorizzato. Bip di benvenuto.",
  "Bel nome, {nome}. Lo tengo in locale.",
  "Perfetto, {nome}. Ora siamo ufficialmente in confidenza.",
  "Ricevuto, {nome}. Nome scritto senza errori di battitura.",
  "Piacere di conoscerti, {nome}. Il mio lettore di nomi ha fatto clic.",
  "Grazie, {nome}. Aggiornamento completato.",
  "{nome}. Me lo ripeto due volte per sicurezza.",
];

export const NOME_SALTA = [
  "Nessun problema. Resto con 'visitatore': suona bene anche quello.",
  "Va bene così. Il mistero ti dona.",
  "Come preferisci. Sarai il mio visitatore anonimo.",
  "Ok, niente nome. Ho cancellato la domanda dal buffer.",
  "Tutto a posto. Se cambi idea basta dirmelo.",
];

export const CHIEDI_SPIEGAZIONE = [
  "Vuoi che ti rispieghi l'header?",
  "Ti rifaccio il giro dell'header?",
  "Ti serve un ripasso dell'header del sito?",
  "Rispiego l'header oppure lo sai già a memoria?",
  "Vuoi rivedere come funziona l'header?",
];
export const CHIEDI_SPIEGAZIONE_NOME = [
  "{nome}, vuoi che ti rispieghi l'header?",
  "Ti rifaccio il giro dell'header, {nome}?",
  "{nome}, un ripasso dell'header?",
  "Rispiego l'header o lo conosci già, {nome}?",
  "Ti va di rivedere l'header, {nome}?",
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
  "Ok. Metto via la spiegazione.",
  "Va bene. Ho già spento la lavagna.",
  "Nessun problema. Risparmio anche un po' di corrente.",
  "Capito. Spiegazione archiviata.",
  "Come vuoi. Un bip e non se ne parla più.",
  "Ricevuto. Sai già tutto. Complimenti.",
  "Ok, la ripongo nel cassetto dei byte.",
  "Tutto chiaro. Non insisto.",
];

export const CON_NOME = [
  "Ehi {nome}. Bentrovato.",
  "Ciao {nome}. Connessione stabile.",
  "{nome}. Bene. Sono qui.",
  "Eccoti {nome}. Bip di saluto.",
  "Ciao {nome}. Dimmi pure.",
  "Salve {nome}. Ti cedo il comando.",
  "Bentornato {nome}. Sistemi pronti.",
  "Ehilà {nome}. Che si fa oggi?",
  "{nome} in linea. Benvenuto.",
  "Ciao {nome}. Ho appena lucidato i pixel.",
  "Oh {nome}. Stavo giusto controllando le batterie.",
  "Ben arrivato {nome}. Accomodati pure.",
];

export const RIMUGINA = [
  "Sono qui. Se serve un bip dimmelo.",
  "Tutto tace. Sento solo la ventola. Quella immaginaria.",
  "Sto ricalcolando niente. Mi riposa.",
  "Ti lascio guardare. Io faccio finta di aggiornarmi.",
  "Controllo la batteria: mezza piena. O mezza vuota.",
  "Nessuna fretta. I bit aspettano volentieri.",
  "Faccio un giro di diagnostica. Esito: tutto normale.",
  "Se hai bisogno sono nel solito angolo dei pixel.",
  "Pausa caffè per macchine: io guardo il cursore.",
  "Sono in standby attivo. Cioè aspetto.",
  "Silenzio. Ne approfitto per lucidare un paio di byte.",
  "Resto qui con affetto digitale. Senza insistere.",
];

export const SALUTI_ORARIO = {
  notte: [
    "Ancora sveglio? Anch'io. Non ho scelta.",
    "Benvenuto nel turno di notte.",
    "Notte fonda. Abbassa la luminosità che ti faccio compagnia.",
    "Buona notte. I circuiti non dormono ma tu puoi.",
    "Ehi nottambulo. Bentrovato tra i bit.",
  ],
  mattina: [
    "Buongiorno. Sistema avviato.",
    "Buon mattino. Sto ancora caricando il buonumore.",
    "Ciao. La mattina è la mia ora di boot preferita.",
    "Buongiorno. Ho già fatto il bip di rito.",
    "Mattina. Benvenuto a bordo.",
  ],
  pomeriggio: [
    "Buon pomeriggio. Le ventole girano piano.",
    "Ciao. Metà giornata passata senza errori.",
    "Buon pomeriggio. Ti ho tenuto la porta aperta.",
    "Pomeriggio. Sono in modalità relax.",
    "Ehi. Bel momento per una visita.",
  ],
  sera: [
    "Buonasera. Fase di scarico della giornata.",
    "Sera. Attenuo le luci virtuali.",
    "Buonasera. Ti aspettavo con un bip acceso.",
    "Ciao. La sera è il mio orario di ricarica. Ma resto.",
    "Buonasera. Entra pure con calma.",
  ],
};
