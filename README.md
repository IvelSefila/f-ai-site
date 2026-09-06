# F-AI-sites-claude

Cartella di lavoro Claude per il portfolio F/AI. Non tocca `../F-AI-sites`.

```
site/                    copia del sito con il restyling smeraldo
  tokens.css             unico punto di verità per i token
  v2/                    ⭐ IL LAVORO FINITO — il sito come sistema di verifica
    index.html           struttura e testi
    v2.css               stile completo
    engine.js            motori: key visual, timeline, radar
    hero.js              confine umano/AI in WebGL2
    app.js               sessione, voce di sistema, dossier, metriche
    materia.js           prova 07: nuvola di punti in OGL (caricata a richiesta)
    vendor/ogl.min.js    OGL ridotto ai soli moduli usati — 54 KB, 15 KB gzip
  lab/hero-v2.html       primo prototipo dell'hero (superato da v2/)
audit/
  shoot.mjs              screenshot per sezione, desktop 1440 + mobile 390
  measure.mjs            overlap, padding, contrasto, scala tipografica
  measure2.mjs           micro-tipografia, token, raggi, fogli di stile
  verify.mjs             metriche di verifica (usato per il prima/dopo)
  raf.mjs                animazioni attive in cima e in fondo pagina
  shots/                 20 screenshot (desk-*.png / mob-*.png)
AUDIT-ESTETICO.md        diagnosi: 13 difetti misurati
RESTYLING.md             cosa è cambiato, con i numeri prima/dopo
DESIGN.md                design system prescrittivo per gli agenti
research/
  repos/                 repo clonati (fonti)
  design-md-refs/        DESIGN.md di riferimento (Linear, Vercel, Runway, Stripe...)
```

## Aprire il sito finito

```bash
cd "C:/Users/fabri/Documents/sito internet/F-AI-sites-claude/site" && python -m http.server 8899
```

Poi `http://localhost:8899/v2/index.html`

## Come rilanciare e verificare

```bash
cd site && python -m http.server 8899 &
cd .. && node audit/shoot.mjs
```

```bash
node audit/verify.mjs
```

```bash
node audit/raf.mjs
```

## Skill installate in `~/.claude/skills` (26)

**Anthropic ufficiali** — `frontend-design`, `theme-factory`, `canvas-design`,
`brand-guidelines`, `webapp-testing`, `algorithmic-art`, `web-artifacts-builder`
_fonte: github.com/anthropics/skills_

**Taste (Leonxlnx)** — `taste-skill`, `redesign-skill`, `image-to-code-skill`
_fonte: github.com/Leonxlnx/taste-skill_

**UI/UX Pro Max (nextlevelbuilder)** — `ui-ux-pro-max`, `design-system`, `ui-styling`, `brand`
_fonte: github.com/nextlevelbuilder/ui-ux-pro-max-skill_

**Motion / web moderno (freshtechbro + kylezantos)** — `modern-web-design`,
`gsap-scrolltrigger`, `scroll-reveal-libraries`, `lightweight-3d-effects`,
`motion-framer`, `design-motion-principles`

**Qualità web (Addy Osmani)** — `web-quality-audit`, `accessibility`,
`core-web-vitals`, `performance`, `seo`, `best-practices`
_fonte: github.com/addyosmani/web-quality-skills_

## MCP consigliati (non installati — richiedono la tua conferma)

```bash
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest
claude mcp add playwright -s user -- npx @playwright/mcp@latest
```

## L'unica dipendenza

`vendor/ogl.min.js` è OGL compilato con esbuild ai soli moduli che servono
(Renderer, Camera, Transform, Program, Geometry, Mesh, Texture e la matematica):
**54 KB grezzi, 15 KB gzip**. Three.js per lo stesso lavoro sarebbe 356 KB / 84 KB gzip,
e porterebbe un motore di scena che qui non serve.

Viene caricato **solo quando la prova 07 entra nel viewport**, con
`await import()`. Misurato: primo caricamento **494 KB / 9 richieste**,
dopo la prova 07 **722 KB / 12 richieste**. Il pannello metriche si riallinea
da solo dopo il caricamento differito, così i numeri restano veri.

Per rigenerare il bundle:

```bash
npx esbuild _ogl-entry.js --bundle --format=esm --minify --outfile=site/v2/vendor/ogl.min.js
```
