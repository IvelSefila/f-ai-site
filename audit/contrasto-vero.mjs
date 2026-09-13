/* ═══════════════════════════════════════════════════════════════════
 * IL CONTRASTO MISURATO SUI PIXEL, NON SUL FOGLIO DI STILE
 *
 * v2a11y.mjs legge il CSS e ricostruisce il fondo di un testo risalendo
 * i genitori. Funziona quasi sempre, ma non sa DOVE stanno le cose: una
 * sfumatura radiale in un angolo, per lui, copre tutto il blocco, e una
 * stella disegnata in SVG non la vede proprio. Sulla lastra della
 * Locanda dava 1,53:1 su un oro che dove sta davvero fa 6,8:1.
 *
 * Qui si fa il contrario e senza modelli: si nasconde il testo, si
 * fotografa il blocco, e per ogni scritta si guarda il pixel PEGGIORE
 * dentro il suo riquadro. E' quello che vede l'occhio, decorazioni
 * comprese.
 *
 * La fotografia torna dentro la pagina come immagine e si legge con una
 * tela: cosi' il PNG lo decodifica il browser e non serve una libreria
 * in piu' solo per questo.
 *
 * Serve sulle tre lastre dei casi, che sono l'unico posto del sito dove
 * sotto il testo c'e' della grafica invece di una tinta.
 *
 * uso: node audit/contrasto-vero.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html?probe=1';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
/* Ogni scena ha una geometria per la lastra larga e una per la colonna
   del telefono: sono disegni diversi, e vanno misurati tutti e due. */
let rotte = 0;
for (const [forma, vp] of [['desktop', { width: 1440, height: 900 }],
                           ['telefono', { width: 390, height: 844 }]]) {
const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1,
  isMobile: vp.width < 700, hasTouch: vp.width < 700 });
const p = await ctx.newPage();
await p.goto(SITO, { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
await p.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));
/* Ferma tutto quello che si muove. Senza questa riga i riquadri delle
   scritte venivano presi mentre il blocco stava ancora salendo e la
   fotografia mezzo secondo dopo, ad altezze diverse: sul telefono
   usciva 1,00:1, cioe' "il testo sta sopra se stesso", che e' il modo
   in cui una misura sbagliata si presenta. */
await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;' +
                               'animation:none!important}' });
await p.waitForTimeout(500);

for (const [nome, lastra] of [['Union Energia', '.union__slab'],
                              ['Esoscheletri', '.eso__slab'],
                              ['Locanda del Castello', '.locanda__slab']]) {
  console.log(`\n════ ${nome} · ${forma} ${vp.width}px ════`);
  const el = await p.$(lastra);
  if (!el) { console.log('  ✗ lastra non trovata'); rotte++; continue; }
  await p.evaluate(s => document.querySelector(s)
    .scrollIntoView({ block: 'center', behavior: 'instant' }), lastra);
  await p.waitForTimeout(400);

  /* le scritte: colore, misura e riquadro rispetto alla lastra */
  const scritte = await p.evaluate((s) => {
    const slab = document.querySelector(s);
    const base = slab.getBoundingClientRect();
    const fuori = [];
    const cammina = (n) => {
      for (const f of n.childNodes) {
        if (f.nodeType === 3 && f.textContent.trim().length > 1) {
          const r = document.createRange(); r.selectNodeContents(f);
          const q = r.getBoundingClientRect();
          if (!q.width || !q.height) continue;
          const cs = getComputedStyle(n);
          if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
          /* Il riquadro di un testo e' piu' alto della riga di scrittura:
             ci stanno dentro le code delle lettere e un po' di aria, e
             finisce per sconfinare nel bordo di chi lo contiene. Sul
             payoff di Union sconfinava nella riga lime sotto "si vince"
             — stesso colore del testo — e la misura diceva 1,00:1.
             Si taglia sulla scatola del contenuto, bordi e imbottiture
             fuori. */
          const pe = n.getBoundingClientRect();
          const num = (v) => parseFloat(v) || 0;
          const c0x = pe.left + num(cs.borderLeftWidth) + num(cs.paddingLeft);
          const c0y = pe.top + num(cs.borderTopWidth) + num(cs.paddingTop);
          const c1x = pe.right - num(cs.borderRightWidth) - num(cs.paddingRight);
          const c1y = pe.bottom - num(cs.borderBottomWidth) - num(cs.paddingBottom);
          const x0 = Math.max(q.left, c0x), y0 = Math.max(q.top, c0y);
          const x1 = Math.min(q.right, c1x), y1 = Math.min(q.bottom, c1y);
          if (x1 - x0 < 2 || y1 - y0 < 2) continue;
          fuori.push({
            testo: f.textContent.trim().slice(0, 34),
            colore: cs.color,
            px: parseFloat(cs.fontSize),
            grasso: parseInt(cs.fontWeight, 10) >= 700,
            x: Math.round(x0 - base.left), y: Math.round(y0 - base.top),
            w: Math.round(x1 - x0), h: Math.round(y1 - y0),
          });
        } else if (f.nodeType === 1) cammina(f);
      }
    };
    cammina(slab);
    return fuori;
  }, lastra);

  /* La stessa lastra senza testo. Si spegne il COLORE delle lettere,
     non gli elementi: nascondere un blocco porta via anche il suo
     fondo, e la prima versione misurava il payoff di Union contro il
     lime invece che contro la targa verde cupo su cui sta davvero —
     1,13:1 dove il vero valore e' 5,5:1. Le decorazioni in SVG restano,
     che sono proprio quelle da misurare.
     Sparisce anche tutto quello che sta "fisso" sullo schermo: la
     testata e la coda del sito galleggiano sopra la pagina e finiscono
     dentro la fotografia di un elemento piu' alto del telefono. La
     prima versione lo prendeva per fondo e misurava l'oro della Locanda
     contro lo smeraldo del marchio F/AI — 1,19:1 su un oro che li'
     sotto ha del bordeaux e fa 6,8:1. Non e' un difetto della lastra,
     e' una barra che passa davanti. */
  const spegni = await p.addStyleTag({ content:
    `${lastra} *{color:transparent!important;-webkit-text-fill-color:transparent!important;` +
    `text-shadow:none!important}` });
  const fissi = await p.evaluate((s) => {
    const slab = document.querySelector(s);
    const spenti = [];
    for (const e of document.body.querySelectorAll('*')) {
      if (slab.contains(e) || e.contains(slab)) continue;
      const cs = getComputedStyle(e);
      if (cs.position === 'fixed' || cs.position === 'sticky') {
        e.dataset.eraFisso = e.style.visibility || '-';
        e.style.visibility = 'hidden';
        spenti.push(1);
      }
    }
    return spenti.length;
  }, lastra);
  await p.waitForTimeout(250);
  if (process.env.PERCHE) console.log(`  (${fissi} elementi fissi messi da parte)`);
  const scatto = 'data:image/png;base64,' + (await el.screenshot()).toString('base64');
  await spegni.evaluate(n => n.remove());
  await p.evaluate(() => {
    for (const e of document.querySelectorAll('[data-era-fisso]')) {
      if (e.dataset.eraFisso === '-') e.style.removeProperty('visibility');
      else e.style.visibility = e.dataset.eraFisso;
      delete e.dataset.eraFisso;
    }
  });

  const esito = await p.evaluate(async ({ scatto, scritte }) => {
    const im = new Image();
    im.src = scatto;
    await im.decode();
    const tela = document.createElement('canvas');
    tela.width = im.naturalWidth; tela.height = im.naturalHeight;
    tela.getContext('2d').drawImage(im, 0, 0);
    const dati = tela.getContext('2d').getImageData(0, 0, tela.width, tela.height).data;

    const canale = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lum = (r, g, b) => 0.2126 * canale(r) + 0.7152 * canale(g) + 0.0722 * canale(b);
    const rapporto = (a, b) => { let [x, y] = [a, b]; if (x < y) [x, y] = [y, x];
                                 return (x + 0.05) / (y + 0.05); };
    /* Un colore calcolato con color-mix() il browser lo restituisce come
       "color(srgb 0.357 0.818 0.678)": numeri da zero a uno, non da zero a
       255. Letto alla vecchia maniera diventava quasi nero e il controllo
       diceva 1,05:1 su una scritta chiarissima. */
    const rgb = (s) => { const n = (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
      return /^color\(/.test(s) ? n.map(v => v * 255) : n; };

    const male = [];
    let peggio = { r: 99 };
    for (const t of scritte) {
      const [fr, fg, fb] = rgb(t.colore);
      const lf = lum(fr, fg, fb);
      const serve = (t.px >= 24 || (t.px >= 18.66 && t.grasso)) ? 3 : 4.5;
      let min = 99, dove = null;
      for (let y = Math.max(0, t.y); y < Math.min(tela.height, t.y + t.h); y += 2) {
        for (let x = Math.max(0, t.x); x < Math.min(tela.width, t.x + t.w); x += 2) {
          const i = (tela.width * y + x) << 2;
          /* Un pixel del colore della scritta stessa non e' fondo: e'
             inchiostro. Sotto "si vince" c'e' la riga lime che fa parte
             del lettering, e misurarci contro dava 1,00:1 — "il testo
             non si legge sopra se stesso", che e' vero e non serve. */
          if (Math.abs(dati[i] - fr) + Math.abs(dati[i + 1] - fg) +
              Math.abs(dati[i + 2] - fb) < 36) continue;
          const r = rapporto(lf, lum(dati[i], dati[i + 1], dati[i + 2]));
          if (r < min) { min = r; dove = [x, y, dati[i], dati[i+1], dati[i+2]]; }
        }
      }
      if (min === 99) continue;
      if (min < peggio.r) peggio = { r: min, testo: t.testo };
      if (min < serve) male.push({ r: min, serve, px: t.px, testo: t.testo,
                                   dove: dove, colore: t.colore, box: [t.x, t.y, t.w, t.h],
                                   tela: [tela.width, tela.height] });
    }
    return { male, peggio, quante: scritte.length };
  }, { scatto, scritte });

  for (const m of esito.male)
    console.log(`  ✗ ${m.r.toFixed(2)}:1 (serve ${m.serve}) ${m.px}px · ${m.testo}` +
                (process.env.PERCHE ? `  [testo ${m.colore} · riquadro ${m.box} · tela ${m.tela} · peggio in ${m.dove}]` : ''));
  rotte += esito.male.length;
  console.log(`  ${esito.quante} scritte misurate sui pixel · la peggiore fa ` +
              `${esito.peggio.r.toFixed(2)}:1 ("${esito.peggio.testo}")`);
}
await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} scritte sotto il minimo` : '\nsui pixel veri il contrasto tiene');
process.exitCode = rotte ? 1 : 0;
