/* ═══════════════════════════════════════════════════════════════════
 * SPOSTARE UN RIQUADRO — la prova
 *
 * Sette cose, e la prima serve a fidarsi delle altre sei: se la finta
 * pressione lunga non stacca il pezzo, tutto il resto direbbe "non si
 * muove" per il motivo sbagliato.
 *
 *  0 · il gesto stacca davvero il pezzo (la prova si prova da sola)
 *  1 · trascinando, l'ordine dentro il gruppo cambia
 *  2 · ricaricando, l'ordine resta
 *  3 · premere e lasciare fermo apre il pannello, come prima
 *  4 · le frecce del pannello spostano di un posto
 *  5 · "rimetti come prima" torna all'originale e cancella la memoria
 *  6 · su un riquadro fuori dai gruppi il pannello si apre senza le frecce
 *  7 · col dito, sul telefono, e la pagina non scorre sotto
 *
 * uso: node audit/sposta.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html?probe=1';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

let rotte = 0;
const dice = (ok, testo) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${testo}`); };

/* ── una pagina pronta, con i suoi guardiani ─────────────────────── */
async function pagina(ctx) {
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2200);
  p.errs = errs;
  return p;
}

const ordine = (p, sel) => p.evaluate(s =>
  [...document.querySelector(s).children].map(e => e.dataset.ordId).join(','), sel);

/* Il punto dove appoggiare il dito: dentro il riquadro ma lontano dai
   comandi, che sul gesto hanno la precedenza.

   `mira` invece è il punto dove lasciarlo, e non può essere un punto
   qualsiasi sopra la carta d'arrivo: la prima versione di questa prova
   mirava al bordo SINISTRO della seconda carta, cioè chiedeva "mettimi
   prima di lei" — che per la prima carta vuol dire restare dov'è. La
   prova diceva "non si muove" e il codice aveva ragione. Si mira oltre
   la metà, che è la soglia vera. */
async function inquadra(p, sel, i) {
  return p.evaluate(({ s, i }) => {
    document.querySelectorAll(s)[i].scrollIntoView({ block: 'center', behavior: 'instant' });
  }, { s: sel, i });
}
const dove = (p, sel, i, fx, fy) => p.evaluate(({ s, i, fx, fy }) => {
  const r = document.querySelectorAll(s)[i].getBoundingClientRect();
  return { x: Math.round(r.left + r.width * fx), y: Math.round(r.top + r.height * fy) };
}, { s: sel, i, fx, fy });
const presa = (p, sel, i) => dove(p, sel, i, 0.04, 0.03);

const dorme = (p, ms) => p.waitForTimeout(ms);

/* ── 0 · il gesto stacca il pezzo ─────────────────────────────────── */
console.log('── il gesto ──');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await pagina(ctx);
  await inquadra(p, '.work', 0);
  const a = await presa(p, '.work', 0);
  await p.mouse.move(a.x, a.y);
  await p.mouse.down();
  await dorme(p, 250);
  dice(await p.evaluate(() => !!document.querySelector('.pal-staccato')) === false,
       'a 250 ms non è ancora staccato');
  await dorme(p, 500);
  dice(await p.evaluate(() => !!document.querySelector('.pal-staccato')),
       'a 750 ms il riquadro è staccato');
  await p.mouse.up();
  await dorme(p, 200);
  await p.keyboard.press('Escape');
  await ctx.close();
}

/* ── 1 e 2 · trascinare, e ritrovarlo dopo ────────────────────────── */
console.log('── trascinare ──');
let ordineDopo = null;
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await pagina(ctx);
  const prima = await ordine(p, '#deck');
  await inquadra(p, '.work', 0);
  const a = await presa(p, '.work', 0);
  const m = await dove(p, '.work', 1, 0.8, 0.1);   /* oltre la metà della seconda */

  await p.mouse.move(a.x, a.y);
  await p.mouse.down();
  await dorme(p, 700);                      /* stacco */
  for (let k = 1; k <= 10; k++) {           /* verso la seconda, un pezzo per volta */
    await p.mouse.move(a.x + (m.x - a.x) * k / 10, a.y + (m.y - a.y) * k / 10);
    await dorme(p, 24);
  }
  dice(await p.evaluate(() => !!document.querySelector('.ord-preso')), 'in viaggio ha la sua classe');
  await p.mouse.up();
  await dorme(p, 350);

  ordineDopo = await ordine(p, '#deck');
  dice(ordineDopo !== prima, `l'ordine è cambiato: ${prima} → ${ordineDopo}`);
  dice(await p.evaluate(() => !document.querySelector('.ord-preso, .ord-gruppo, .pal-staccato')),
       'lasciato il pezzo, non resta nessuno stato appiccicato');
  dice(await p.evaluate(() => !document.querySelector('.work').style.transform ||
       document.querySelector('.work').style.transform === ''), 'nessuna trasformazione residua');
  dice(await p.evaluate(() => !!JSON.parse(localStorage.getItem('fai-ordine') || '{}').deck),
       'la scelta è scritta in memoria');

  await p.reload({ waitUntil: 'networkidle' });
  await dorme(p, 2200);
  dice(await ordine(p, '#deck') === ordineDopo, 'ricaricando, l’ordine è ancora quello');
  dice(p.errs.length === 0, `nessun errore${p.errs.length ? ': ' + p.errs[0] : ''}`);
  await ctx.close();
}

/* ── 3, 4, 5 · il pannello ────────────────────────────────────────── */
console.log('── il pannello ──');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await pagina(ctx);
  await inquadra(p, '.work', 0);
  const a = await presa(p, '.work', 0);
  await p.mouse.move(a.x, a.y);
  await p.mouse.down();
  await dorme(p, 750);
  await p.mouse.up();                        /* lasciato fermo: pannello */
  await dorme(p, 300);
  dice(await p.evaluate(() => !!document.getElementById('palPanel')?.open), 'il pannello si è aperto');
  dice(await p.evaluate(() => !document.querySelector('.pal__sez--pos')?.hidden),
       'ci sono i comandi di posizione');

  const prima = await ordine(p, '#deck');
  await p.click('[data-pos="1"]');
  await dorme(p, 320);
  const spostato = await ordine(p, '#deck');
  dice(spostato !== prima, `la freccia sposta di un posto: ${prima} → ${spostato}`);

  await p.click('[data-pos-reset]');
  await dorme(p, 320);
  dice(await ordine(p, '#deck') === '0,1,2', 'rimette come prima');
  dice(await p.evaluate(() => !JSON.parse(localStorage.getItem('fai-ordine') || '{}').deck),
       'e cancella la memoria invece di salvare l’originale');
  dice(await p.evaluate(() => document.querySelector('[data-pos-reset]').disabled),
       'poi "rimetti" si spegne da solo');

  await p.keyboard.press('Escape');
  await dorme(p, 200);

  /* un riquadro che non sta in nessun gruppo */
  await inquadra(p, '.dossier', 0);
  const d = await presa(p, '.dossier', 0);
  await p.mouse.move(d.x, d.y);
  await p.mouse.down(); await dorme(p, 750); await p.mouse.up();
  await dorme(p, 300);
  dice(await p.evaluate(() => !!document.getElementById('palPanel')?.open),
       'anche fuori dai gruppi il pannello si apre');
  dice(await p.evaluate(() => document.querySelector('.pal__sez--pos').hidden),
       'ma senza i comandi di posizione, che non avrebbero dove mandarlo');
  dice(p.errs.length === 0, `nessun errore${p.errs.length ? ': ' + p.errs[0] : ''}`);
  await ctx.close();
}

/* ── 7 · col dito ─────────────────────────────────────────────────── */
console.log('── col dito, sul telefono ──');
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const p = await pagina(ctx);
  /* qui le carte dei lavori sono alte 650 px: due non stanno in uno
     schermo, e per superare la metà della seconda il dito dovrebbe
     uscire dalla pagina. Le carte del laboratorio sono alte 151 e in
     colonna: lo stesso codice, con l'asse verticale invece che
     orizzontale. */
  const prima = await ordine(p, '.lab');
  await inquadra(p, '.lab__card', 1);
  const a = await presa(p, '.lab__card', 0);
  const m = await dove(p, '.lab__card', 1, 0.5, 0.8);
  const scorsoPrima = await p.evaluate(() => scrollY);

  const cdp = await ctx.newCDPSession(p);
  const tocco = (type, x, y) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });

  await tocco('touchStart', a.x, a.y);
  await dorme(p, 750);
  for (let k = 1; k <= 12; k++) {
    await tocco('touchMove', a.x + (m.x - a.x) * k / 12, a.y + (m.y - a.y) * k / 12);
    await dorme(p, 24);
  }
  const scorsoDurante = await p.evaluate(() => scrollY);
  await tocco('touchEnd', 0, 0);
  await dorme(p, 350);

  dice(await ordine(p, '.lab') !== prima, 'col dito il pezzo si sposta');
  dice(Math.abs(scorsoDurante - scorsoPrima) < 4,
       `la pagina non scorre sotto il dito (${scorsoDurante - scorsoPrima} px)`);
  dice(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
       'e non compare scorrimento orizzontale');
  dice(p.errs.length === 0, `nessun errore${p.errs.length ? ': ' + p.errs[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} prove rotte` : '\ntutto a posto');
process.exitCode = rotte ? 1 : 0;
