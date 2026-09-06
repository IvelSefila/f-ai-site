# Audit estetico — F/AI portfolio

Misurato su `portfolio.html` servito in locale, Chromium 1440×900 e 390×844.
Numeri da `audit/measure.mjs` e `audit/measure2.mjs`, screenshot in `audit/shots/`.

## Diagnosi in una riga

Il sito è disegnato mobile-first e su desktop è la stessa composizione **gonfiata**:
mobile è compatto e convincente, a 1440px diventa una colonna stirata con vuoti verticali,
un asse sinistro che cambia tre volte e un'apertura di sezione ripetuta nove volte.
Non è un problema di gusto: sono difetti di composizione misurabili.

---

## P0 — rotture visibili

### 1. Il paragrafo dell'hero passa sotto l'immagine
`.hero__copy` finisce a x=572, `.hero__atlas` inizia a x=542.
**Sovrapposizione reale: 29px in orizzontale, 169px in verticale.**
La riga "…modelli locali **e**" viene tagliata dal bordo dell'immagine.
È la prima cosa che si legge del sito.

→ Hero a due colonne dichiarate (`grid-template-columns: minmax(0,1fr) minmax(0,1.1fr)`),
oppure copy sotto il titolo a colonna piena e atlas a tutta larghezza sotto.

### 2. La palette è collassata su un solo blu
`site.css` dichiara `--cut: #ff5d35` (arancione taglio) e `--selected: #ccff36` (verde acido).
`studio.css`, caricato dopo, li riscrive in `#f1a457` e `#6ea8ff`.
**Elementi arancioni effettivamente renderizzati in pagina: 0.**
Il sistema a due accenti — caldo = mano umana, freddo = AI — esiste solo nel CSS morto.
Quello che resta è un dark-blue generico, indistinguibile da qualsiasi landing tech.

→ Un solo punto di verità per i token. Ripristinare `--cut` come unico colore delle CTA
e tenere il blu per gli stati AI/dati. Vedi `DESIGN.md`.

### 3. Micro-tipografia illeggibile
**38 elementi sotto i 9px**, alcuni a **6px**: `PARTICELLE`, `RETE`, `STORY / 9:16`,
i numeri di fase `01`–`06`, l'output `EQUILIBRIO / 50% AI`.
Su un portfolio di grafica è il dettaglio che si nota per primo.

→ Minimo 11px. La texture da strumento tecnico si fa con mono + tracking, non rimpicciolendo.

---

## P1 — composizione

### 4. Nove sezioni con la stessa identica apertura
Misurato: 9 sezioni su 10 hanno `padding-top: 168px`, h2 a `82px`, riquadro `x:34 w:906`,
e **la seconda riga del titolo in `#6ea8ff`** — sempre, `accentLines: 1` ovunque.

| sezione | h2 | accento |
|---|---|---|
| live-cut | 82px | riga 2 blu |
| lavori | 82px | riga 2 blu |
| servizi | 82px | riga 2 blu |
| metodo | 82px | riga 2 blu |
| ai-locale | 82px | riga 2 blu |
| profilo | 82px | riga 2 blu |
| brief | 82px | riga 2 blu |
| game | 82px | riga 2 blu |
| contact | 112px | riga 3 blu |

Alla terza ripetizione l'accento smette di essere enfasi. Lo scroll diventa prevedibile:
si impara il pattern e si smette di guardare.

→ Massimo tre aperture accentate (hero, lavori, contact). Le altre monocrome,
con quattro varianti di layout in rotazione. Vedi `DESIGN.md § Il tic da rompere`.

### 5. Nessun asse verticale
Bordo sinistro del primo figlio, per sezione: hero **58px**, live-cut/lavori/brief **34px**,
servizi/metodo/ai-locale/game/contact **0px**.
Tre allineamenti diversi nella stessa pagina: l'occhio non trova una linea a cui appoggiarsi.

Causa: `--content: 1500px` con viewport 1440 → il contenitore non si centra mai
e il margine reale dipende da quale wrapper vince nella sezione.

→ `--content: 1320px` + gutter dichiarato, applicato **anche all'hero**.

### 6. Vuoti verticali su desktop
- `metodo`: griglia a 5 colonne con ~200px di cella vuota sopra ogni etichetta
- `ai-locale`: il pannello destro finisce a metà, ~250px di nero sotto
- `contact`: CTA a pillola larga 1370px con la scritta a sinistra e la freccia a destra —
  in mezzo un metro di bianco vuoto
- ogni sezione apre con ~190px di nulla prima dell'eyebrow

Su mobile gli stessi blocchi sono compatti e funzionano. È il desktop a non avere una composizione propria.

### 7. Il watermark "ART × AI" in `profilo`
Gigante, tagliato dal bordo, contrasto quasi nullo su fondo chiaro: legge come un errore
di rendering, non come una filigrana voluta.

→ O dentro la griglia con un contrasto dichiarato (~1.15:1), o via.

---

## P2 — sistema

### 8. Scala tipografica aperta
**18 misure distinte in uso**: 6, 7, 8, 9, 10, 11, 14, 15, 17, 18, 21, 31, 42, 44.64, 48, 54, 82, 102.96px.
Il `44.64px` è un `clamp` non arrotondato. Il gruppo 14/15/17/18 non ha rapporto.

→ 7 gradini. Vedi `DESIGN.md § Tipografia`.

### 9. Dodici colori di testo
Fra cui quattro bianchi quasi identici — `#f5f6f7`, `#eef4fc`, `#ffffff`, `#f4f7fc` —
e quattro grigi. Nessuno di questi salti è percepibile: è deriva, non gerarchia.

→ 3 livelli di inchiostro per fondo.

### 10. Dodici raggi di bordo
`999px` ×78, `14px` ×37, `50%` ×18, più 3/4/10/12/16/20/22/24/37.44px sparsi.

→ 3 valori: pill, card, spigolo vivo.

### 11. Contrasto uniformemente altissimo
Rapporti misurati: corpo hero **12.95:1**, eyebrow **11.08:1**, label mono **17.5–18.6:1**.
Tutto ampiamente oltre AA — e questo è il problema: **le meta-label a 9px hanno più
contrasto del corpo del testo**. Tutto grida allo stesso volume, quindi niente emerge.

→ Meta a 4.8–6:1, corpo 7–10:1, titoli ≥12:1.

### 12. Tre fogli di stile in cascata
`site.css` (270 regole) → `next.css` (101) → `studio.css` (333).
L'ultimo ridefinisce i token del primo. Buona parte di `site.css` è codice morto
che descrive un sito che non esiste più — ed è il file che un agente legge per primo.

### 13. Il canvas dell'hero non si ferma mai
Gira anche fuori viewport: batteria, thermal throttling su laptop, e in pratica
impedisce persino di catturare screenshot della pagina (il compositor non si assesta).

→ `IntersectionObserver` + `cancelAnimationFrame` all'uscita dal viewport.

---

## Cosa **non** va toccato

- **Barlow Condensed 600 + Manrope + mono.** Coppia forte e non generica: è già l'80%
  del carattere del sito. Il problema è la scala, non i caratteri.
- **Alternanza scuro/chiaro fra sezioni.** Regge il ritmo lungo su 13.600px di pagina.
- **L'hero mobile.** Compatto, leggibile, con la dock in basso: è la parte meglio composta del sito.
- **Il concetto della control room** e il cursore umano/AI. È l'idea che rende il portfolio
  diverso da un template — va solo eseguita con più disciplina.

---

## Ordine di intervento

1. Hero: sovrapposizione copy/atlas (P0-1)
2. Token unici + ripristino del secondo accento (P0-2)
3. Minimo 11px (P0-3)
4. Un solo asse sinistro, `--content: 1320px` (P1-5)
5. Rompere il pattern di apertura, 3 accenti su 10 (P1-4)
6. Ritmo verticale a tre ampiezze + riempire i vuoti desktop (P1-6)
7. Chiudere scala, colori, raggi (P2-8/9/10)
8. Ricalibrare il contrasto verso il basso sulle meta (P2-11)
9. Consolidare i tre CSS, rimuovere il morto (P2-12)
10. Fermare il canvas fuori viewport (P2-13)
