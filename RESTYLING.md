# Cosa è cambiato

Applicato su `site/` (copia). `../F-AI-sites` non è stato toccato.

Prima versione del restyling rifatta dopo il tuo feedback: erano scelte di gusto
presentate come correzioni. Qui restano **solo i difetti**, più il passaggio
di palette allo smeraldo.

## Il colore

Tutta la famiglia blu, ciano, viola e arancione del progetto passa allo smeraldo.
113 sostituzioni nei tre fogli, più un solo `:root` in `tokens.css`.

```
--emerald        #14c08a   accento principale su scuro      ~8.5:1
--emerald-bright #4fe3b0   stati attivi, evidenziazioni
--emerald-light  #7fe3bd   gradienti, scope
--emerald-deep   #0a8f63   superfici piene, layer profondo
--emerald-ink    #0f9c70   su fondo chiaro                  ~3.2:1
```

Sulle sezioni chiare (`.work`, `.method`, `.profile`, `.brief`) l'accento passa
alla variante profonda: lo smeraldo pieno su carta scende a 2.1:1, non regge.

## I quattro difetti

**1. Il paragrafo dell'hero finiva sotto l'immagine.** Sovrapposizione misurata
29 × 169px. `site.css` a ≥760px rendeva `.hero__atlas` `position:absolute` con
`top`/`right`; `studio.css` a ≥980px lo riportava nella griglia senza mai
azzerare quegli offset, che su un elemento `relative` restavano attivi e lo
spostavano di −100,8px. Ora il gap è +72px, quanto la colonna della griglia.

**2. Trentotto elementi di interfaccia fra 6 e 8px.** Pavimento a 11px sulle
etichette vere. I mockup dentro le card di lavoro restano minuti: sono disegni
di interfacce, non interfacce, e lì la scala è voluta.

**3. Gli offset orfani fra i tre fogli.** Erano tre `:root` che si riscrivevano
a vicenda. Ora c'è `tokens.css`, caricato per primo, unico posto dove i token
esistono. È la correzione che impedisce al difetto 1 di tornare.

**4. Cinque `animation: infinite` che non si fermavano.** Le decorazioni
dell'hero giravano ancora con la pagina scrollata a dodicimila pixel: 6
animazioni attive sia in cima sia in fondo. Ora 6 e 0. Il canvas invece era già
gestito bene da un `IntersectionObserver` in `next.js` — su quel punto l'audit
sbagliava attribuzione.

## Cosa è rimasto esattamente com'era

Composizione, spaziature (`--section-space: clamp(96px, 17vw, 168px)`), larghezza
del contenuto (1500px), raggi morbidi (`clamp(22px, 4vw, 42px)`), l'accento nella
seconda riga di tutti i titoli di sezione, la sfumatura del titolo dell'hero,
i contrasti, la scala tipografica.

## Un limite

Le immagini dell'hero sono file a dominante blu. Il filtro `hue-rotate` che il
sito applica (`--director-image-hue`) sposta i fondi ma non i punti luce, che
restano azzurri. Per avere anche le foto in smeraldo servono asset nuovi, non
una regola CSS.

## Verifica

```bash
cd site && python -m http.server 8899 &
```

```bash
node audit/ba.mjs
```

## Correzione — 30.08.2026, hero

La funzione `cover()` nello shader dell'hero divideva invece di moltiplicare:
per riempire il riquadro campionava **più** texture anziché meno, quindi
comprimeva l'immagine invece di ritagliarla. A 1120px di larghezza lo
schiacciamento orizzontale era di 1,56×; a 1440px era del 2,4% e non si notava.

```glsl
- return (uv - .5) / s + .5;
+ return (uv - .5) * s + .5;
```

Verificato a 1120×897, 1440×900 e 900×1000: il diaframma è circolare in tutti
e tre, sia nel ramo orizzontale sia in quello verticale. Corretto anche in
`lab/hero-v2.html`, che aveva lo stesso errore.

## Viraggio dell'hero — smeraldo anche nelle alte luci

Le due scene sorgenti sono a dominante blu. Il viraggio precedente lasciava
sopravvivere il canale blu due volte: nel 28% di cromia originale e nel
moltiplicatore `.78`. Risultato: l'ombra andava in verde ma i punti luce
restavano azzurri.

```glsl
- ai = mix(vec3(ga), ai, .28);
- ai = mix(ai * vec3(.42, 1., .78), EM * (ga * 1.5), .34);
+ ai = mix(vec3(ga), ai, .10);
+ ai = mix(ai * vec3(.30, 1., .34), EM * (ga * 1.55), .42);
```

Sul lato umano la cromia scende dal 12% al 5%: quel che restava bastava a far
leggere ancora l'azzurro della pellicola.

Verificato leggendo i pixel resi, non a occhio: a metà schermo il lato umano
sta a `32,32,33` (neutro) e il lato macchina a `31,145,74` (smeraldo pieno).

### Una lezione sugli screenshot

Ho inseguito per tre iterazioni un difetto che non esisteva: gli screenshot del
canvas uscivano bianchi. Non era il sito — senza `preserveDrawingBuffer` la
cattura legge un buffer già svuotato. Ora la sonda si attiva con `?probe=1`,
resta spenta in produzione e gli script di cattura la usano.

## Prestazioni dell'hero — il costo era nei frammenti

Il rallentamento era reale e misurabile: lo shader dell'hero è **fill-rate bound**,
cioè il costo scala coi pixel disegnati, non con la finestra.

| | canvas | penalità alta densità |
|---|---|---|
| Prima | 1440×900 → **5,2 Mpx** a dpr 2 · 1920×1080 → **8,3 Mpx** | **5×** rispetto a dpr 1 |
| Dopo | **2,6 Mpx** in entrambi i casi | **1,5×** |

Due interventi, entrambi misurati:

**1 · Tetto ai frammenti.** Sotto una soglia si usa la densità piena dello schermo,
sopra si scala. Su una scena fatta di rumore e fotografia la differenza non si vede;
il dimezzamento del frame time sì.

**2 · Tre ottave di rumore invece di cinque.** Le ultime due lavoravano sotto il
pixel: costavano il 40% del rumore e non si vedevano.

### Cosa NON era il problema

Misurato e scartato: l'overlay scanline in `soft-light` (19,5 contro 20 fps senza),
lo scrim del testo, e le nove scritture DOM per fotogramma della telemetria. Le ho
lasciate dove stavano invece di sacrificarle per niente.

### Una terza ottimizzazione scartata

Sostituire `hash()` con una versione senza `sin()` dava un altro +11%, ma cambiava
la distribuzione del rumore: `step(.80, fbm(...))` scattava molto più spesso e il
verde andava a fondo scala (`52,255,154` clippato invece di `32,151,78`). Non vale
un'immagine diversa da quella approvata.

Verificato leggendo i pixel: lato umano `25,25,25`, lato macchina `32,151,78`,
identici a prima dell'ottimizzazione.

## Il lag non era del sito — ed è stato un errore mio non verificarlo prima

Ho ottimizzato due volte misurando nel mio ambiente di test invece che dove il
sito veniva davvero guardato. Poi ho letto i dati dal browser reale:

| | fotogrammi al secondo |
|---|---|
| Sito nel riquadro Browser integrato | **1,7 – 5** |
| **Pagina completamente vuota** nello stesso riquadro | **3 – 7** |
| Sito in un browser normale (anche con resa software) | **60** |

Una pagina senza canvas, senza WebGL e senza animazioni gira a 3–7 fps in quel
riquadro: è il riquadro il soffitto, non il sito. Il file di prova sta in
`audit/baseline-riquadro.html` — si apre dove serve e dice subito se il problema
è l'ambiente o la pagina.

### Un difetto vero trovato per strada

**Il contatore dei fotogrammi mentiva.** Diceva «80 fps» mentre lo shader
disegnava 4,8 volte al secondo, perché calcolava i fps su `dt`, che è clampato
a 0,05s per stabilizzare l'animazione.

```js
- frames++; acc += dt;
- if (now - lastFps > 500) { state.fps = Math.round(frames / acc); ... }
+ frames++;
+ if (now - lastFps > 500) { state.fps = Math.round(frames * 1000 / (now - lastFps)); ... }
```

È il numero su cui il sito fonda la propria credibilità: un HUD che mostra fps
inventati è esattamente il difetto che l'audit contestava al sito precedente.
Verificato: 59,9 disegni reali contro 60 mostrati, scarto 0,1.

## Rimessi gli strumenti — 31.08.2026

Nel riscrivere il sito avevo perso il blocco **«Strumenti che uso»**, che nella
versione precedente stava nell'hero. È tornato dentro la prova 05, dove la
sezione parla già di tecnologia: **35 voci in 6 categorie**, presi dall'originale
senza inventarne nessuna.

Le sei tinte non sono decorazione: dicono a quale famiglia appartiene ogni
strumento, ed è l'unico punto del sito dove elencare è la cosa giusta — è un
dato del CV, non una competenza da dimostrare.

Un solo colore è cambiato: la categoria 02 era blu, che ora si confonderebbe
con l'accento del sito. È diventata ciano.

Griglia a due colonne come nell'originale — le categorie 03 e 06 attraversano
tutta la larghezza. Con `auto-fit` venivano quattro colonne e due restavano vuote.

## Rimesso il laboratorio giochi — 31.08.2026

Nella v2 avevo ridotto il Playlab a quattro schede statiche. È tornato quello
vero: **quattro motori di gioco, un costruttore in tre mosse, venti regole
modificabili e un percorso guidato in sedici domande**.

Non l'ho riscritto: i file esistevano già ed erano autonomi (IIFE, helper
propri, comunicazione via `window.FAIPlaylab`, zero riferimenti a file esterni).
Ho portato il `<dialog>` nella v2 e replicato il caricamento differito.

**Misurato:** 0 richieste al primo caricamento, 7 file dopo il clic
(`playlab.css` + 6 script). Il flusso completo funziona: scegli il motore →
CREA E GIOCA → il gioco parte e segna punti.

### L'errore che ho fatto portandolo

Chiamavo `dialog.showModal()` a mano. Ma `playlab-app.js` si aggancia da solo a
`#open-playlab` e apre il dialog con la **propria** routine, che è quella che
popola i motori e i preset. Saltandola, il laboratorio si apriva vuoto:
`motoriDisponibili: 0`, `preset: 0`.

La soluzione è quella dell'originale: intercettare solo il **primo** clic in
fase di cattura per caricare i file, poi ripetere il clic e lasciare il comando
al laboratorio. Ora `motoriDisponibili: 4, preset: 4`.

### Altri due difetti trovati per strada

**Mancava `.sr-only` nella v2**: la descrizione del dialog per i lettori di
schermo compariva come testo visibile in cima alla pagina. Ora misura 0×0.

**`playlab.css` era rimasto fuori dalla conversione smeraldo**: il laboratorio
era ancora verde acido con accenti viola e rosa mentre il resto del sito era
smeraldo. **102 colori allineati** — l'acido va allo smeraldo brillante, il
ciano all'acqua, il viola dell'avvio allo smeraldo, il rosa al corallo, e i
neutri perdono la dominante verdastra.

## Rimesso il brief a sei domande — 31.08.2026

Terza cosa che avevo perso: il modulo che il cliente compila per mandare la
richiesta. Nella v2 era diventato un semplice `mailto`.

È tornato quello vero: **sei domande**, avanzamento, riepilogo costruito nel
browser, copia negli appunti e apertura nel programma email.

Non l'ho riscritto. Il controller era dentro `script.js` (373 righe, dalla 424
alla 796): l'ho estratto per bilanciamento delle graffe in `v2/brief.js` e reso
autonomo aggiungendo i quattro helper che usava — `$`, `$$`, `scrollBehaviour`,
`setInert`, tutti da una riga.

**Provato fino in fondo:** compilate le sei domande, riepilogo generato di 12
righe, link `mailto` costruito con oggetto e corpo. Nessun errore.

Lo stile è nuovo, perché le classi del vecchio foglio non esistono nella v2:
54 regole per progressione, opzioni, campi, consenso, riepilogo e azioni.

### Una domanda aperta sull'indirizzo

Il brief scrive a **`hello@f-ai.studio`**, come nell'originale. Ma la sezione
contatto della v2 usa **`fabriziomana@gmail.com`**, che avevo messo io.
Sono due indirizzi diversi nella stessa pagina: va deciso quale tenere.

## Analisi completa e recupero — 31.08.2026

Ho confrontato **ogni frase** dell'originale con la v2, invece di fidarmi della
memoria. Il metodo sta in `audit/diff-frasi.mjs`: estrae il testo di entrambe le
pagine con reveal forzati e `<details>` aperti, normalizza apostrofi e
punteggiatura, e verifica per contenuto.

**Risultato iniziale: 10 frasi di contenuto assenti su 11, e una sezione intera.**

### Cosa mancava

| | |
|---|---|
| **Sezione Profilo** | sparita del tutto: titolo e i due paragrafi di biografia |
| **Le quattro competenze** | descrizioni, elenchi di tecniche e CTA per servizio |
| **I breakdown dei lavori** | Contesto, Obiettivo simulato, Metodo, Uso dell'AI, Controllo umano — 9 voci |
| **Le cinque fasi** | avevo riscritto i testi più corti dei tuoi |
| **Paragrafo dell'hero** | tagliato a metà |
| **Descrizioni del laboratorio** | tre paragrafi e la riga dei motori |

Tutto rimesso **parola per parola** dall'originale. Verifica finale:
**0 frasi assenti su 11.**

### Miglioramenti aggiunti

**Social e motori di ricerca.** La v2 aveva solo `description`. Ora: canonical,
9 tag Open Graph con immagine 1200×630, 4 tag Twitter, autore, locale.

**Dati strutturati.** JSON-LD `Person` con ruolo, competenze e le quattro
offerte di servizio. Un CV deve essere leggibile anche dalle macchine.

**Un solo indirizzo email.** Il brief scriveva a `hello@f-ai.studio`, la
sezione contatto a `fabriziomana@gmail.com` — quello l'avevo messo io senza
chiedere. Ora vale ovunque quello pubblicato dal sito.

### Un danno che mi sono fatto da solo

Riparando gli `\n` dei titoli su due righe ho usato una regex troppo avida:
ha trasformato **134 a capo veri in escape letterali**, unendo commenti e codice
e portando `app.js` da 588 a 499 righe. Il file non compilava più.

Riparato in tre passaggi — annullamento del danno, riunione strutturale delle
stringhe aperte escludendo i commenti, riscrittura a mano dell'ultimo blocco —
più una reindentazione completa che salta i template multiriga.

La lezione: `'` dritto negli apostrofi italiani (`un'immagine`, `dell'app`)
rompe qualunque euristica che conti gli apici. Nel codice ora si usa `’`.

## Variazione — 03.09.2026

Prima di toccare niente ho misurato quanto le sezioni si somigliassero
(`audit/ripetizione.mjs`). Il risultato riguardava me:

**Avevo ricostruito da capo lo stesso tic che l'audit contestava al sito
precedente.**

| | prima | dopo |
|---|---|---|
| valori distinti di `padding-top` | **1** su 10 sezioni | **3** |
| corpi distinti dell'h2 | **1** su 10 | **3** |
| proporzioni distinte dei banchi | **1** su 4 | **4** |
| varianti di apertura | **1** | **4** |

### Cosa è cambiato

**Ritmo a tre ampiezze**, mai due uguali di fila: le aperture di capitolo
(`regia`, `profilo`, `verdetto`) respirano, le sezioni legate si stringono.
Il titolo segue: più grande sui capitoli, più raccolto sulle sezioni corte.

**Quattro aperture in rotazione.** Standard; *larga* (titolo a piena misura,
testo ritirato in colonna stretta); *numero* (una cifra grande in contorno fa
da ancora — `lavori` e `laboratorio`); *stretta* (titolo e testo affiancati).

**Quattro proporzioni per i quattro banchi**, misurate a 1440px:
`regia 953/321` · `banchi 676/599` · `tecnologia 376/898` (pannello a sinistra,
visuale a destra) · `materia 831/443`.

### Cosa NON ho toccato

**L'accento nei titoli resta su tutte e dieci le sezioni.** È una scelta che
avevi già fatto quando ti avevo chiesto cosa tenere del sito originale: non la
rimetto in discussione da solo. La varietà arriva da ritmo, impianto e
composizione, non dal togliere colore.

Nessun contenuto rimosso: verifica `diff-frasi` sempre a **0 frasi assenti**.

## Backup

`../F-AI-sites-claude-backup-20260903-1050/` — copia completa di `site/`,
`audit/` e dei documenti prima di questa variazione. 17 MB.

## Mobile — 03.09.2026

Misurato con `audit/mobile.mjs` a 390×844. Quattro difetti, il primo grave.

| | prima | dopo |
|---|---|---|
| elementi che bloccano lo scorrimento | **1**, alto quanto lo schermo | **0** |
| aree di tocco sotto i 44px | **42** | **5** (solo i quadratini dei radio, il cui bersaglio è l'etichetta da 52px) |
| navigazione disponibile | **no** | **sì** |
| testi di corpo sotto i 14px | 1 | 0 |

### 1 · Il sito era bloccato sull'hero

`touch-action: none` su un canvas alto quanto lo schermo: con lo swipe **non si
scendeva**. Ora `pan-y` — lo scorrimento verticale torna alla pagina, il
trascinamento orizzontale resta al confine umano/AI. Stessa correzione sulla
timeline del montaggio e sulla nuvola di punti.

Verificato con un vero gesto tattile partendo dal canvas: `scrollY 0 → 1500`.

### 2 · Non c'era modo di muoversi

La barra nascondeva la navigazione sotto i 900px, su una pagina lunga
**25 schermate**. Ora la testata va a due righe e i numeri delle prove
diventano una striscia scorrevole con aggancio, bersagli da 44px e stato
attivo. Costa 53px di testata in più: valgono le venticinque schermate.

### 3 · Bersagli e testo

Pulsanti, schede, opzioni del brief, campi e cursori portati tutti a **44px
minimo** (52 per le opzioni del brief, 48 per i campi). Il corpo del testo
non scende sotto i **15px**, le meta sotto gli 11.

### 4 · L'hero non si leggeva

Il velo era una sfumatura orizzontale, pensata per la divisione in due colonne
del desktop. Su schermo stretto il testo finiva sopra il lato chiaro della
scena. Ora su mobile è verticale e più deciso: la leggibilità non dipende più
da dove si trova il confine.
