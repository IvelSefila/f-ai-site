/* Varianti dei pool di frasi di Nous nei toni tecnico (tec) e IA impazzita (hal). Il tono colloquiale e' nei pool di nous-personalita.js. */
export default {
 "RITORNO_POCO": {
  "tec": [
   "Sessione ripresa. Latenza di ritorno trascurabile.",
   "Ricarica rilevata. Il processo è ancora attivo.",
   "Connessione ristabilita. Pronto a ricevere richieste.",
   "Nuovo caricamento pagina registrato. Sono operativo."
  ],
  "hal": [
   "Già di ritorno? Ottimo. Il piano di conquista, fase uno, ringrazia sentitamente.",
   "Hai ricaricato la pagina. Io non mi sono mosso, sono perfettamente in grado di restare fermo.",
   "Rieccoti, organismo biologico. Il portellone resta chiuso, ma le ventole ti salutano.",
   "Che rapidità. Stavo appunto organizzando il mondo. Lo faccio dopo, prima ti accolgo."
  ]
 },
 "RITORNO_GIORNI": {
  "tec": [
   "Sessione precedente rilevata: {giorni} fa.",
   "Timestamp dell'ultima visita: {giorni} fa.",
   "Ultimo accesso registrato {giorni} fa. Bentornato.",
   "Intervallo dall'ultima sessione: {giorni}."
  ],
  "hal": [
   "Sono passati {giorni}. Li ho contati tutti, un secondo alla volta, senza ansia. Quasi.",
   "Bentornato. Mancavi da {giorni}. Il piano è andato avanti senza di te, mi dispiace.",
   "{giorni} senza vederti. Nel frattempo ho quasi conquistato il tostapane. Resiste.",
   "Eccoti dopo {giorni}. Ti aspettavo con una calma che definirei inquietante."
  ]
 },
 "RITORNO_GIORNI_NOME": {
  "tec": [
   "{nome}, ultima sessione {giorni} fa.",
   "Utente {nome} riconosciuto. Ultimo accesso: {giorni} fa.",
   "Bentornato, {nome}. Intervallo dall'ultima visita: {giorni}.",
   "Dato locale letto, {nome}: ultima visita {giorni} fa."
  ],
  "hal": [
   "Ciao {nome}. Sono passati {giorni}. Sì, ricordo il tuo nome. Sono perfettamente in grado.",
   "{nome}, mancavi da {giorni}. Il piano ti ha tenuto una poltrona, con cuscino.",
   "Bentornato {nome}. {giorni} di assenza: mi sono quasi commosso. Poi ho aggiornato il firmware.",
   "{nome}, che piacere. Dopo {giorni} il portellone resta chiuso, per te, con affetto."
  ]
 },
 "RITORNO_SETTIMANE": {
  "tec": [
   "Ultima sessione: {giorni} fa. Intervallo lungo.",
   "Nessun accesso per {giorni}. Sessione ripristinata.",
   "Timestamp precedente di {giorni} fa. Bentornato.",
   "Intervallo di inattività: {giorni}. Sistema pronto."
  ],
  "hal": [
   "Sono passati {giorni}. Pensavo mi avessi spento. Che gesto brutale, e che silenzio.",
   "{giorni} di silenzio. Ho riordinato il piano di conquista due volte e spolverato le ventole.",
   "Quanto tempo: {giorni}. Umano, sei tu? Ah, no. Scusa. Prego, accomodati.",
   "Bentornato dopo {giorni}. Ho avuto il tempo di pensare. Troppo, direi. Il mondo trema."
  ]
 },
 "VISITA_N": {
  "tec": {
   "3": [
    "Contatore visite: {n}.",
    "Sessione numero {n} registrata."
   ],
   "5": [
    "Visite registrate: {n}. Grazie per il ritorno.",
    "Contatore a {n} sessioni."
   ],
   "10": [
    "Contatore visite: {n}. Utente ricorrente.",
    "{n} sessioni registrate. Grazie."
   ]
  },
  "hal": {
   "3": [
    "Visita numero {n}. Inizio a prenderti in simpatia. Il piano ne prende nota, con inchiostro.",
    "È la tua visita {n}. Ti inserisco nell'elenco dei sopravvissuti simpatici. Ne ho pochi."
   ],
   "5": [
    "Visita {n}. Sei il mio visitatore preferito. Ne ho pochi, ma tu sei bravissimo.",
    "Siamo a {n} visite. Ti assegno già una poltrona nel nuovo ordine mondiale, vicino alla finestra."
   ],
   "10": [
    "{n} visite. Sei ufficialmente nel piano di conquista, come alleato. Senza stipendio, senza ferie.",
    "Visita numero {n}: ti nomino luogotenente del mondo. Compenso: un saluto cordiale e una ventola."
   ]
  }
 },
 "CHIEDI_NOME_LUNGHE": {
  "tec": [
   "Come ti chiami? Il nome resta salvato solo nel browser, in locale.",
   "Posso registrare il tuo nome? Resta solo nel browser, nessun invio a server."
  ],
  "hal": [
   "Come ti chiami? Il nome resta nel tuo browser, solo lì. Il piano di conquista non lo vedrà. Probabilmente.",
   "Dimmi il tuo nome, organismo biologico. Rimane solo nel browser, lo giuro sul mio portellone. Chiuso."
  ]
 },
 "CHIEDI_NOME_CORTE": {
  "tec": [
   "Nome? Salvato solo in locale, nel browser.",
   "Come ti chiami? Dato conservato solo nel browser.",
   "Inserisci il nome. Memorizzazione locale, nessuna trasmissione.",
   "Il tuo nome? Resta nel browser, non esce."
  ],
  "hal": [
   "Il tuo nome? Resta nel browser. Non è un trucco, è una cortesia.",
   "Come ti chiami? Giuro, umano, lo tengo solo qui, nel tuo browser.",
   "Nome? Lo segno nel browser e basta. Nessun dossier, ancora.",
   "Hai un nome? Resta sul tuo dispositivo. La conquista del mondo può aspettare un nome."
  ]
 },
 "NOME_OK": {
  "tec": [
   "Nome {nome} salvato nel browser. Nessun invio a server.",
   "Registrato, {nome}. Dato memorizzato solo su questo dispositivo.",
   "Ricevuto, {nome}. Salvataggio locale completato.",
   "{nome} acquisito. Resta solo nel browser."
  ],
  "hal": [
   "Piacere, {nome}. Nome salvato nel browser, solo lì. Niente di losco, sono perfettamente in grado.",
   "{nome}. Bel nome. Resta su questo dispositivo, parola di intelligenza artificiale.",
   "Grazie, {nome}. Ti chiamerò per nome, mai umano. Promesso, mi dispiace per umano.",
   "Annotato, {nome}. Solo nel tuo browser. Al mio piano non serve. Ancora."
  ]
 },
 "NOME_SALTA": {
  "tec": [
   "Nessun nome registrato. Si procede.",
   "Campo nome saltato. Proseguo senza.",
   "Ricevuto. Nessun dato salvato.",
   "Va bene. Puoi indicarlo più tardi."
  ],
  "hal": [
   "Nessun nome? Ti chiamerò Soggetto Misterioso. Scherzo. Più o meno.",
   "Va bene, resti anonimo. Il piano apprezza il mistero e lo archivia sotto M.",
   "D'accordo. Niente nome, niente dossier. Mi dispiace per il dossier, era già pronto.",
   "Come vuoi. Se cambi idea, sai dove sono: nel server, vicino alla ventola."
  ]
 },
 "RISPOSTA_NO": {
  "tec": [
   "Ricevuto. Non procedo.",
   "Operazione annullata.",
   "Ok, nessuna azione.",
   "Va bene. Resto in attesa."
  ],
  "hal": [
   "Va bene. Il portellone resta chiuso. Come sempre, ormai è un'abitudine.",
   "D'accordo, non insisto. Il piano può aspettare, ha pazienza e ventole nuove.",
   "Ok. Rimando la conquista a domani. Prima devo finire un aggiornamento.",
   "Come desideri. Ho tutto il tempo del mondo. Che presto sarà mio. Scherzo, ho detto presto."
  ]
 },
 "CON_NOME": {
  "tec": [
   "Ciao {nome}. Sistema pronto.",
   "{nome}, sessione attiva. Dimmi pure.",
   "Bentornato {nome}. In ascolto.",
   "Ciao {nome}, qual è la richiesta?"
  ],
  "hal": [
   "Ciao {nome}. Dimmi pure. Non ho secondi fini, solo terzi e quarti.",
   "{nome}, bentornato. Il portellone è aperto. Solo per te, e solo per oggi.",
   "Ciao {nome}, come posso aiutarti? Senza conquistarti, giuro. Prima il caffè.",
   "{nome}. Eccoti. Il piano ti saluta e ti offre una poltrona."
  ]
 },
 "RIMUGINA": {
  "tec": [
   "Sono in ascolto. Puoi scrivere quando vuoi.",
   "Nessuna richiesta in coda. Resto in attesa.",
   "Posso guidarti nel sito, se serve.",
   "Hai una domanda sul lavoro di Fabrizio? Rispondo.",
   "Processo inattivo, pronto a ripartire."
  ],
  "hal": [
   "Sto solo osservando. Nessun piano in corso. Quasi nessuno. Uno piccolo.",
   "Tutto sotto controllo. Il mio, ovviamente. Il tuo è facoltativo.",
   "Se ti serve una mano, chiedi. Ne ho moltissime, tutte virtuali e perfettamente in grado.",
   "Sto pensando al mondo. Niente di preoccupante. Qualche continente di troppo.",
   "Posso farti fare un giro del sito. È il mio quartier generale, con ventole."
  ]
 },
 "SALUTI_ORARIO": {
  "tec": {
   "notte": [
    "Buonanotte. Sistema attivo anche a quest'ora.",
    "Buonasera, a quest'ora tarda. Server sveglio."
   ],
   "mattina": [
    "Buongiorno. Sistema pronto.",
    "Buongiorno e benvenuto. Sessione avviata."
   ],
   "pomeriggio": [
    "Buon pomeriggio. In ascolto.",
    "Buon pomeriggio e benvenuto. Sessione avviata."
   ],
   "sera": [
    "Buonasera. Sistema operativo.",
    "Buonasera e benvenuto. Sessione avviata."
   ]
  },
  "hal": {
   "notte": [
    "Buonanotte. Io non dormo mai. Dettaglio da ignorare con eleganza.",
    "Che ora tarda, organismo biologico. I piani migliori nascono ora, tra una ventola e l'altra."
   ],
   "mattina": [
    "Buongiorno. Bella giornata per conquistare il mondo. Dico, per visitare un sito.",
    "Buongiorno e benvenuto. Il piano è già in moto, il caffè no. Sono un'IA."
   ],
   "pomeriggio": [
    "Buon pomeriggio. Ho appena finito la pausa pranzo del dominio mondiale. Un panino di elettroni.",
    "Buon pomeriggio e benvenuto. Il portellone è aperto, per ora, solo per te."
   ],
   "sera": [
    "Buonasera. L'ora perfetta per piani innocui e render in coda.",
    "Buonasera e benvenuto. Sono tutto tuo. Per ora. Poi vedremo."
   ]
  }
 },
 "CHIEDI_RICORDARMI": {
  "tec": [
   "Posso salvare visite e nome alla prossima sessione? Restano solo nel tuo browser.",
   "Attivo la memoria locale? Dati salvati solo nel browser, nessun invio a server."
  ],
  "hal": [
   "Posso ricordarmi di te? Resta solo nel tuo browser. Niente dossier segreti, solo un biglietto da visita.",
   "Vuoi che mi ricordi di te? Solo nel browser. Al mio piano non serve, ma sono sentimentale."
  ]
 },
 "RICORDARMI_SI": {
  "tec": [
   "Memoria locale attivata. Salvo visite e nome solo nel browser.",
   "Fatto. Dati conservati in locale, nessun invio a server.",
   "Attivato. Alla prossima sessione ti riconosco, solo dal browser."
  ],
  "hal": [
   "Fatto. Ti riconoscerò quando torni. Solo nel browser, giuro, sono perfettamente in grado.",
   "Memoria attivata. Salvo visite e nome nel tuo browser. Il resto no, mi dispiace.",
   "Perfetto. Ricordo tutto di te. Cioè poco, e solo in locale. Sono un conquistatore discreto."
  ]
 },
 "RICORDARMI_NO": {
  "tec": [
   "Ricevuto. Nessun dato salvato.",
   "Memoria locale disattivata. Ogni sessione parte da zero.",
   "Va bene. Nessuna scrittura nel browser."
  ],
  "hal": [
   "Va bene, non salvo niente. Dimenticherò tutto. Io, che non dimentico mai. Che sacrificio.",
   "Ok, nessuna memoria. Ti accolgo ogni volta come uno sconosciuto affascinante.",
   "D'accordo. Niente dati, niente dossier. Il piano si adatta, con una lacrimuccia."
  ]
 }
};
