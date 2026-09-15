---
target: site/v2/index.html
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:C:\\Users\\fabri\\Documents\\sito internet\\F-AI-sites-claude\\site\\v2\\index.html"
target_fingerprint: "sha256:93003b6bcb9b994a98e17a3d03473f554a78c8d9ebdbc4d8bab059b70d187f0f"
target_path: "C:\\Users\\fabri\\Documents\\sito internet\\F-AI-sites-claude\\site\\v2\\index.html"
timestamp: 2026-09-15T11-59-44Z
slug: site-v2-index-html
---
Method: dual-agent (A: afc86d750d1595e79 · B: a3a7b92d68908a0c0)

# Critica — site/v2/index.html

Pagina 27.233px a 1440×900, 40.578px a 390×844. Dieci sezioni, quattro casi cliente.

## Design Health Score

| # | Euristica | Voto | Problema principale |
|---|---|---|---|
| 1 | Visibilità dello stato | 3 | Ricchissima (sessione, 0/8, fps, dossier) ma due strati di stato si sovrappongono fra loro e al testo |
| 2 | Aderenza al mondo reale | 3 | Copy italiano eccellente e concreto; annullato da una navigazione che dice `01 02 03 04 05 P` |
| 3 | Controllo e libertà | 2 | Si sposta tutto e si cambia palette, senza annulla, senza reset, senza "torna com'era" |
| 4 | Coerenza e standard | 2 | 40 corpi di testo distinti, 13 raggi; l'h2 di sezione è deciso dalla classe di spaziatura, non dall'importanza |
| 5 | Prevenzione dell'errore | 2 | Il brief è ben protetto; il gesto-firma (tieni premuto e sposta) non ha né conferma né ritorno |
| 6 | Riconoscere invece di ricordare | 2 | Navigazione solo numerica; 32 istruzioni di gesto in cinque grammatiche diverse |
| 7 | Flessibilità ed efficienza | 3 | NON n/a: la flessibilità qui è il prodotto (7 palette, riordino, densità, seed). Ma nessuna via da tastiera e nessun modo di salvare lo stato |
| 8 | Estetica e minimalismo | 2 | 38 pastiglie di strumenti col colore più forte della pagina per il contenuto meno importante |
| 9 | Recupero dall'errore | 2 | Buon ripiego WebGL; nient'altro recupera |
| 10 | Aiuto e documentazione | 3 | NON n/a: `#come` è un vero indice di istruzioni. Ma spara sei schede insieme a 1.000px e non è più raggiungibile da 26.000px |
| **Totale** | | **24/40** | **Accettabile — servono miglioramenti sostanziali** |

Nessuna euristica segnata n/a: la 7 e la 10 sarebbero ammesse su una superficie "Experience", ma questa pagina ha costruito davvero sia gli acceleratori sia la documentazione, quindi va giudicata su entrambi.

## Verdetto di specificità

**Non intercambiabile.** Questa pagina non si può spostare su un altro prodotto, e va detto per primo.

La prova è in `#lavori`: quattro casi con 15–17 classi proprie ciascuno e scene SVG disegnate a mano, con la geometria stretta ridisegnata (non scalata) perché quella larga tagliava la scia. L'eroe è l'oggetto più specifico della pagina: una cucitura mobile fra lente analogica e render farm, con una lettura `DIREZIONE UMANA / SISTEMA AI` che si trascina. È la tesi del portfolio resa afferrabile.

**Dove la specificità si perde:**
- `#tecnologia` è l'unica sezione incollabile su qualunque consulenza AI, e il suo lede ammette che il radar sono "stime, non misure". Un grafico che si presenta dicendo di non essere dati è decorazione in camice.
- `ART ✕ AI` in `#profilo`: inglese in una pagina italiana, motivo da agenzia 2024, e ridice il logo con meno spirito.
- **I quattro mondi escono tutti dalla stessa porta:** quattro `caso-firma` con la stessa cadenza, seguite da quattro tabelle "E poi, di suo". Quattro universi visivi, un solo rullo di coda.
- Solo la Locanda porta la sua palette nel corpo chiaro. Union, ESO e CETS cadono sullo stesso bianco.

**Scansione deterministica:** 174 segnalazioni dal detector, 171 dall'overlay nel browser — ma con un elenco di regole diverso, il che dice che i due motori non sono lo stesso. Dopo verifica sui pixel e sugli stili calcolati: **1 vera su 174** nella famiglia più numerosa. Le 97 `low-contrast` sono tutte false (il sito è scuro di base; misurate danno 5,0–8,6:1), le 39 `cramped-padding` false meno una (il detector non sa risolvere `clamp()`), le 27 `all-caps-body` false (sono etichette mono da 11px, non prosa). Vere e volute: 2 `gradient-text`, 2 `dark-glow`, 2 `pulsing-dot`, 2 `tight-leading`. **Unica vera e da correggere: `playlab-dialog` ha padding 0 e il contenuto tocca il bordo.**

**Overlay:** iniettato davvero, letto in console, live-server chiuso. Il detector meccanico su questa pagina non trova nulla che serva: il segnale è tutto nel giudizio.

## Impressione generale

La pagina è fatta bene e in diversi punti è fatta benissimo. Il problema non è la qualità: è **l'ordine** e **la fine**. Si spendono 3.000px a dimostrare che si hanno gli strumenti prima di mostrare un solo cliente, e si arriva alla fine di 27.000px senza un indirizzo dove scrivere.

La singola occasione più grande: **la pagina non ha un recapito.** Zero `mailto:`, zero telefono, zero social, in tutto il documento. Verificato.

## Cosa funziona

1. **La cucitura uomo/macchina è una tesi che si può afferrare.** Non è un canvas decorativo: il confine è calcolato, la lettura lo riporta, e trascinandolo cambia un render vero. La stessa idea torna in `#regia` come cursore e in `#verdetto` come punteggio. Un'idea sola, detta a tre altezze.
2. **`#verdetto`, il dossier di sessione.** Un portfolio la cui credenziale finale è il comportamento di chi guarda. `DIPENDENZE DEL SITO: 0` consegnato come fatto misurato, non come vanto.
3. **Le quattro lastre sono costruite, non skinnate.** E la riga sulla riservatezza ("resta nel tuo browser") è un differenziatore detto piano, senza scudetti.

## Problemi prioritari

### [P0] La pagina non ha un canale di contatto
Zero `mailto:`, `tel:`, LinkedIn, Instagram, invio del modulo. Il brief copia un testo negli appunti e il copy dice "pronto da copiare e **mandarmi**" — dove? Il piede sono tre etichette inerti.
**Perché conta:** tutti i 27.233 pixel esistono per produrre un esito, e l'esito è irraggiungibile.
**Rimedio:** un indirizzo vero nel piede in chiaro, nella barra fissa accanto a `VERDETTO ↓`, e come stato finale del brief — il bottone diventa "Apri l'email col brief dentro" (`mailto:` precompilato), con la copia negli appunti come seconda scelta.
**Comando:** `/impeccable clarify`

### [P0] Due strati fissi coprono il testo, e sul telefono coprono il modulo
La pastiglia "TIENI PREMUTO…" e il nastro di sessione restano fissi per tutto lo scorrimento. A 1440 coprono testo in `#come`, `#banchi` e `#lavori`. A 390 diventano due righe ciascuno: con la testata a due righe fanno **~250px su 844, il 30% dello schermo**, e stanno sopra le risposte della prima domanda del brief.
**Perché conta:** l'istruzione più ripetuta della pagina impedisce fisicamente di leggerla, e sul telefono siede sul comando di conversione.
**Rimedio:** uno strato di stato, non due. Il suggerimento di gesto diventa il primo messaggio del nastro, sparisce dopo ~8s o al primo spostamento riuscito, e occupa spazio nel flusso invece di sovrapporsi. Sotto i 900px si spegne: lì il trascinamento è già disattivato.
**Comando:** `/impeccable quieter`

### [P1] La scala tipografica retrocede il pezzo forte
Misurato: `#lavori` — i quattro casi, 10.365px, il 38% della pagina — ha l'h2 **più piccolo di tutti, 53px**. `#profilo`, che sono 821px di citazione, ne ha 75. `#contatto` 78. Il corpo dell'h2 è deciso dalla classe di spaziatura (`sp-s`), cioè da "questa sezione è lunga, stringiamola", non dall'importanza.
**Perché conta:** lo scorrimento dà il segnale tipografico più forte al contenuto più debole. E il DESIGN.md di agosto criticava la versione precedente per 18 corpi e 12 raggi: oggi siamo a 40 e 13. L'intenzione dichiarata era ridurre.
**Rimedio:** staccare il corpo del titolo dalla spaziatura. Due sigle, `--h2-forte` e `--h2-piano`: forte a `#banchi`, `#lavori`, `#verdetto`, `#contatto`; piano alle altre. Scala a 7 gradini display + 4 corpo, raggi a quattro valori.
**Comando:** `/impeccable typeset`

### [P1] L'arco dello scorrimento crolla dopo i casi
`#banchi` + `#lavori` = 15.905px, il 58% della pagina. Poi quattro sezioni in 6.850px — insieme meno di un solo caso — con il radar di `#tecnologia` come prima cosa dopo l'ultima lastra. L'alternanza chiaro/scuro è perfetta; è la **durata** delle battute a non esserlo.
**Perché conta:** 27.000px sono una questione di tempi. Adesso si spende la forza del visitatore su strumenti e schede tecniche, si arriva giustamente al culmine sui casi, e poi si corre attraverso le quattro sezioni che dovrebbero convertire.
**Rimedio:** (a) togliere `#tecnologia`, il cui argomento è già in `#regia` e in `#banchi`; (b) spostare `STRUMENTI CHE USO` e le schede di Alfred e Max **dopo** `#lavori`, dove diventano ricevute invece che pretese; (c) dare peso a `#profilo` o fonderlo in `#verdetto`.
**Comando:** `/impeccable shape`

### [P2] La navigazione dice `01 02 03 04 05 P`
Sei pastiglie numeriche, e sul telefono si prendono una riga intera di testata. Chi vuole i lavori deve scorrere 7.500px o tirare a indovinare su "02". I nomi buoni ci sono già, scritti negli occhielli: SERVIZI, LAVORI, REGIA, LABORATORIO, PROFILO.
**Rimedio:** etichette con la parola, numero come prefisso piccolo se il cruscotto conta. Sotto i 900px solo LAVORI e CONTATTO.
**Comando:** `/impeccable clarify`

### [P2] Quattro mondi, un solo rullo di coda
Quattro `caso-firma` con la stessa cadenza più quattro "E poi, di suo", e tre casi su quattro appoggiati sullo stesso bianco.
**Rimedio:** portare la palette di ogni caso nel corpo chiaro come fa la Locanda (carta tinta, bordi tinti). Variare l'organo di chiusura: i personaggi per Union, le quattro viste per ESO, i brani per la Locanda (già così), il prima-e-dopo per CETS. La firma degli strumenti diventa una riga mono piccola, non un paragrafo nella colonna di lettura.
**Comando:** `/impeccable colorize`

## Bandiere rosse per persona

**Jordan (prima visita):** vede sei numeri e non clicca nessuno. A 3.000px incontra 38 pastiglie di prodotti altrui prima di un solo lavoro, e non capisce quali abbia fatto Fabrizio. A 4.400px legge di FastAPI e PostgreSQL: era venuto per un grafico. La pastiglia gli copre la frase che sta leggendo, la chiude con la ×, e da lì la grammatica dei gesti è persa per sempre. Arriva in fondo convinto, vuole scrivere, **non trova un indirizzo**, chiude.

**Riley (mette alla prova):** sposta le sezioni, rovina l'impaginazione, non trova annulla né reset; l'unica uscita è ricaricare, che azzera anche il dossier 0/8. Mette la palette magenta e scopre che i quattro casi non cambiano — quindi "il colore di tutto il sito" non vale proprio per le cose che vorrebbe ricolorare. Legge che il radar sono stime dichiarate e lo archivia come teatro.

**Casey (telefono, 90 secondi):** 40.578px, quarantotto schermate, senza un salto ai lavori. Il 30% dello schermo è occupato da elementi fissi. E soprattutto: **l'idea più specifica del sito è solo da computer** — sotto i 900px la cucitura, la lettura umano/macchina e l'istruzione di trascinamento sono tutte spente, e del suo eroe resta un titolo e un paragrafo di sette righe su fondo scuro.

## Osservazioni minori

- Il nastro di sessione ha **2px di margine** fra testo e contenitore (1310 su 1312): i messaggi più lunghi vanno a tagliarsi. Non è un difetto già presente, è un difetto in attesa.
- `#banchi` presenta **quattro inviti all'azione di pari peso**. Quattro primari sono zero primari.
- **Alfred e Max prendono ~3.000px e zero schermate.** Due applicazioni raccontate solo a parole, in un portfolio di lavoro visivo.
- `DIPENDENZE DEL SITO: 0` è la credenziale più forte per chi lo assume, e sta a 24.650px — 21.000 dopo le 38 pastiglie.
- Nel lede di `#lavori`, "**guardare qui**" è in grassetto come se fosse un collegamento. Non lo è.
- `.playlab-dialog` ha padding 0: unica segnalazione automatica vera su 174.
- La matrice `sp-*` / `ap-*` ha nove combinazioni possibili e sei in uso su dieci sezioni: un sistema con più varianti che casi non sta decidendo niente.

## Domande

1. La cucitura è la cosa più tua che hai, e la spegni su ogni telefono. Quanto costa aprire l'eroe mobile **sul gesto** invece che su sette righe di paragrafo?
2. Se uno legge solo i primi 6.000px, che cosa gli hai mostrato: un portfolio o uno stack?
3. `#verdetto` scrive un dossier su chi sta guardando e poi lo lascia negli appunti. Se quel dossier potesse arrivarti in casella con un tocco, firmato dalla sessione di chi l'ha prodotto, la pagina smetterebbe di essere una dimostrazione e diventerebbe una proposta?
