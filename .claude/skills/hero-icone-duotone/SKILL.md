---
name: hero-icone-duotone
description: Disegna o ridisegna icone SVG lineari per il sito F/AI (site/v2), nello stile "duotone hyper-minimal" 2026 già in uso nell'hero (fotocamera+scintilla, infinito, chiave inglese). Usa questa skill ogni volta che si aggiungono, sostituiscono o si chiede di rendere "più belle/moderne/attuali" le icone del sito — non disegnare icone SVG a mano libera senza consultarla prima.
---

# Icone duotone per F/AI

Il sito F/AI (site/v2) usa icone SVG inline, non un pacchetto esterno. Questa skill fissa lo stile in cui vanno disegnate, cosi' restano coerenti fra loro nel tempo invece che ogni icona nuova avere un aspetto diverso.

## Perche' questo stile

A settembre 2026 e' stata fatta una ricerca vera (non a memoria) sulle tendenze di icon design 2026 — vedi fonti in fondo. Il sito e' scuro, tecnico, "sistema di verifica", e usa gia' altrove scene SVG a tratto (manifesto, casi cliente). Fra le direzioni trovate (soft 3D, micro-illustrazioni, hyper-minimal, duotone), quella coerente con questo linguaggio visivo e' **hyper-minimal + duotone monocromatico**: tratto sottile e uniforme, più un riempimento leggerissimo dello stesso colore per dare profondità senza rompere la pulizia lineare. Soft 3D (gradienti, ombre morbide) o le micro-illustrazioni colorate stonerebbero con lo sfondo scuro e la palette a un solo accento.

## La regola

Ogni icona:
- **viewBox="0 0 24 24"**, canvas standard.
- **stroke="currentColor" stroke-width="1.6"** uniforme su tutte le icone del sito — non mescolare pesi diversi nello stesso gruppo.
- **stroke-linecap="round" stroke-linejoin="round"** — nessun angolo vivo, stessa morbidezza del resto del sito (bottoni, card).
- La forma principale (il "corpo" del concetto — la fotocamera, la chiave) prende anche **fill="currentColor" fill-opacity=".16"**: è il tocco duotone, un velo di colore dietro il tratto. I dettagli secondari (l'obiettivo dentro la fotocamera, per esempio) restano solo tratto, senza fill, cosi' si leggono come "dentro" alla forma piena.
- Il colore è sempre `currentColor`, mai un hex fisso: l'elemento che lo usa eredita `color:var(--em-vivo)` (o l'accento coerente del contesto), cosi' l'icona cambia da sola con la palette del sito — non va mai fissato un colore diretto nell'SVG.
- Dimensione reale nella pagina: 30-32px lato. Sotto i 24px il duotone sparisce (l'occhio non distingue più il velo dal tratto) e l'icona torna a sembrare un'icona qualunque — se lo spazio è stretto, meglio un'icona più semplice a piena grandezza che una elaborata rimpicciolita.

## Una sola forma, non tre elementi incollati

La ricerca del settembre 2026 dice una cosa precisa: "le icone minimali più forti oggi usano una sola forma riconoscibile e un solo colore d'accento, niente di più." Non tre `<path>`/`<circle>` separati (corpo + dettaglio + ornamento) messi vicini — un solo tracciato.

La tecnica: un solo `<path>`, con più sottopercorsi (separati da uno spazio nel valore di `d`) e `fill-rule="evenodd"` sull'svg. Il primo sottopercorso è la silhouette piena (prende il fill duotone); i successivi, se disegnati con lo stesso verso, diventano "buchi" nel riempimento — cosi' l'obiettivo di una fotocamera o il dettaglio di uno strumento non è un cerchio disegnato sopra, è un vuoto dentro la stessa forma. Lo stroke, applicato allo stesso path, disegna comunque il contorno di ogni sottopercorso: il dettaglio resta visibile come linea, sparisce solo il suo riempimento.

Esempio (fotocamera + obiettivo + scintilla AI, tutto in un solo `<path>`):
```html
<svg viewBox="0 0 24 24" fill="currentColor" fill-opacity=".16" fill-rule="evenodd"
     stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
     aria-hidden="true" focusable="false">
  <path d="M3 9h3.3L8 6.4h6.4L16 9h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z
            M11.2 18.2a4.3 4.3 0 1 0 0-8.6 4.3 4.3 0 0 0 0 8.6Z
            m8.1-13.4.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8Z"/>
</svg>
```
Un solo elemento nel DOM, non tre. Prima di aggiungere una seconda o terza forma separata a un'icona, prova sempre se puo' diventare un buco nella prima invece che un pezzo a parte.

## Cosa NON fare

- Non inventare glifi generici da "icon pack" (aperture a raggi, reti di puntini astratte) solo perché sembrano "un'icona qualsiasi che ci sta". Il concetto deve leggersi in un colpo d'occhio: se un'icona richiede la didascalia per essere capita, il concetto o il disegno sono sbagliati, non la spiegazione.
- Non mescolare stili: se un'icona ha il fill duotone, ce l'hanno anche le altre nello stesso gruppo (stessa riga, stessa lista).
- Non usare pittogrammi con troppi elementi (soglia: sotto 5 forme per icona) — a 24px canvas si sporca e diventa illeggibile.
- Non serve reinventare la forma se esiste già un glifo noto e leggibile per il concetto (fotocamera, ingranaggio, nuvola, chiave inglese): meglio partire da una forma riconoscibile e adattarla con lo stroke/fill duotone, piuttosto che disegnare qualcosa di originale ma ambiguo.

## Esempio di riferimento (gia' nel sito, hero, settembre 2026)

```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  <path d="M13.3 4h-5L6.3 6.6H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14.6a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1.5l-1.8-2.6Z"
        fill="currentColor" fill-opacity=".16"/>
  <circle cx="11.3" cy="13.3" r="3"/>
  <path d="m19.5 2 .9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" fill="currentColor" stroke="none"/>
</svg>
```
Corpo macchina fotografica in duotone (fill leggero), obiettivo solo a tratto, scintilla AI in fill pieno come accento separato (marca "generato/potenziato da AI", non fa parte del corpo — resta piena per contrasto).

## Fonti della ricerca (settembre 2026)

- Icon Design Trends 2026, Envato — https://elements.envato.com/learn/icon-design-trends
- Icon Design Trends for 2026: Soft 3D, Hyper-Minimal & Micro-Illustrations, Icojoy — https://icojoy.com/blog/icon-design-trends-2026/
- Popular Icon Trends in Branding and Marketing 2026, Icojoy — https://icojoy.com/blog/popular-icon-trends-branding-marketing-2026/

Se in futuro serve aggiornare lo stile, rifare la ricerca invece di fidarsi di questa nota: le tendenze si spostano, questa skill fissa solo la scelta fatta con le fonti di allora.
