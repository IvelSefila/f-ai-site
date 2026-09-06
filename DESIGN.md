# DESIGN.md — F/AI

Sistema visivo del portfolio F/AI. Chi genera UI per questo progetto legge questo file
e non improvvisa. Formato ispirato a `VoltAgent/awesome-design-md`.

## Identità in una riga

Sala di montaggio, non dashboard. Nero di scena, tipografia condensata da titoli di coda,
**un solo** accento caldo che segna il taglio. L'AI è un layer freddo, non il protagonista.

## Colore

Una sola famiglia: smeraldo. Definita in `site/tokens.css`, unico :root del progetto.

```css
:root {
  --emerald:        #14c08a;   /* accento principale su scuro   ~8.5:1 */
  --emerald-bright: #4fe3b0;   /* stati attivi, evidenziazioni         */
  --emerald-light:  #7fe3bd;   /* gradienti, scope                     */
  --emerald-deep:   #0a8f63;   /* superfici piene, layer profondo      */
  --emerald-ink:    #0f9c70;   /* su fondo chiaro               ~3.2:1 */
}
```

**Regola:** sui fondi chiari l’inchiostro smeraldo sostituisce quello pieno.
Lo smeraldo saturo su carta sta a 2.1:1 e non regge nemmeno sui titoli grandi.

## Tipografia

Barlow Condensed 600 + Manrope + mono di sistema: la coppia funziona, **tenerla**.
Il problema è la scala: in pagina ci sono **18 misure diverse** (da 6px a 103px) e
**38 elementi sotto i 9px**. Scala da chiudere a 7 gradini.

```
display-xl  clamp(56px, 9vw, 104px) / .82  Barlow Cond 600, tracking -.025em  → solo hero
display-l   clamp(40px, 5.6vw, 72px) / .88 Barlow Cond 600                    → h2 sezione
display-m   clamp(28px, 3vw, 40px)  / .95  Barlow Cond 600                    → titoli card
body-l      19px / 1.58   Manrope 400                                          → intro
body        16px / 1.6    Manrope 400                                          → corpo
label       12px / 1.35   mono, tracking .09em, uppercase                      → eyebrow, meta
micro       11px / 1.3    mono, tracking .12em, uppercase                      → timecode, HUD
```

**Minimo assoluto 11px.** Niente 6/7/8px, nemmeno nell'HUD del hero: la texture
"strumento di regia" si ottiene con tracking e monospace, non rimpicciolendo.

## Griglia e allineamento

Oggi i blocchi partono da tre bordi sinistri diversi (hero `58px`, alcune sezioni
`34px`, altre `0`). Nessun asse verticale. Da imporre:

```css
--gutter:  clamp(20px, 4vw, 64px);
--content: 1320px;   /* non 1500: a 1440 lasciava 34px di margine */
```

Ogni sezione: `width: min(100%, var(--content)); margin-inline: auto`.
**Un solo asse sinistro per tutta la pagina, hero compreso.**

Colonne: 12 su desktop, 4 su mobile. Le griglie a 4 e 5 colonne (servizi, metodo)
si spezzano a 2 sotto i 1100px, non a 1.

## Ritmo verticale

Oggi 9 sezioni su 10 hanno `padding-top: 168px` identico e un h2 da `82px`
identico. La pagina non ha respiro variabile: ha un metronomo.

```
--space-section-l: clamp(96px, 12vw, 160px)   /* apertura di capitolo: hero→live-cut, contact */
--space-section-m: clamp(72px, 8vw, 112px)    /* default                                      */
--space-section-s: clamp(48px, 5vw, 72px)     /* sezioni legate: lavori→servizi, metodo→ai    */
```

Alternare: dopo due sezioni "large" ne serve una "small", altrimenti lo scroll è piatto.

## Il tic da rompere

Nove sezioni su dieci aprono con lo **stesso identico costrutto**: eyebrow mono →
h2 a due righe con la **seconda riga sempre in blu** → paragrafo piccolo in colonna destra.
Alla terza volta il blu non è più enfasi, è decorazione.

Massimo **tre** aperture accentate in tutta la pagina — hero, `lavori`, `contact`.
Le altre: h2 monocromo. Per variare usare, in rotazione:

1. h2 pieno larghezza, paragrafo sotto a colonna stretta
2. h2 a destra, immagine/numero a sinistra
3. h2 senza eyebrow, con un numero di sezione grande in filigrana
4. apertura solo tipografica, senza paragrafo

## Superfici e bordi

Oggi: **12 raggi diversi** (999px ×78, 14px ×37, poi 3/4/10/12/16/20/22/24/37.44px).

```
--r-pill: 999px    /* chip, tag, pill di navigazione */
--r-card: 16px     /* card, pannelli, media          */
--r-flat: 0        /* HUD, timeline, tabelle: spigolo vivo, è una moviola */
```

Nient'altro. Le superfici tecniche (control room, timeline, HUD del hero) restano a
spigolo vivo: è quello che le distingue dalle card di contenuto.

## Movimento

- Reveal: `opacity` + `translateY(22px)`, 650ms, `cubic-bezier(.2,.7,.2,1)`. Va bene, tenerlo.
- Stagger massimo 3 elementi, 60ms l'uno. Oltre diventa attesa.
- `prefers-reduced-motion: reduce` → niente translate, solo opacity 150ms.
- Il canvas del hero deve fermarsi quando esce dal viewport (`IntersectionObserver` +
  `cancelAnimationFrame`): oggi gira sempre e blocca anche gli screenshot.

## Contrasto

Non è un problema di accessibilità — i rapporti misurati vanno da 8.4 a 18.8, tutti oltre AA.
È un problema di gerarchia: **tutto grida allo stesso volume**. Target:

```
titoli   ≥ 12:1
corpo      7:1 – 10:1
meta       4.8:1 – 6:1   ← oggi stanno a 17-18:1, vanno abbassati
```

## Da non fare

- Gradienti viola/indaco su card. Il fondo è nero di scena, non un SaaS.
- Glassmorphism sulle card di contenuto. Il vetro è ammesso solo sui controlli sovrapposti al video.
- Più di un accento per viewport.
- Testo sopra un'immagine senza un livello di leggibilità dichiarato.
- Emoji come icone.
