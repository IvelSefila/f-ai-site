/* ═══════════════════════════════════════════════════════════════════
 * IL MANIFESTO SI APRE E SI CHIUDE
 *
 * Da settembre 2026 e' un <details>/<summary>: solo la lastra scura si
 * vede all'inizio, le sei istruzioni compaiono cliccando sulla lastra.
 *
 * UNA COSA IMPARATA COSTRUENDO QUESTO CONTROLLO, e vale la pena
 * scriverla: un <details> chiuso in Chrome NON azzera l'altezza del suo
 * contenuto — lo tiene nel layout (cosi' Ctrl+F lo trova e lo riapre da
 * solo) e ne sospende solo la PITTURA. getBoundingClientRect().height
 * quindi mente: riporta l'altezza vera anche a chiuso, e il primo giro
 * di questo audit dava per rotto un manifesto che allo screenshot era
 * perfetto. La misura giusta e' checkVisibility(), l'API pensata
 * apposta per questo — o, quando serve la controprova visiva, uno
 * screenshot vero (li' sotto in audit/v2shots/).
 *
 * uso: node audit/manifesto.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

const visibile = (p, sel) => p.evaluate(s => {
  const e = document.querySelector(s);
  return e ? e.checkVisibility() : null;
}, sel);

// ── senza JavaScript ──────────────────────────────────────────────
console.log('\n════ senza JavaScript ════');
{
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(SITO);
  await p.waitForTimeout(400);

  const esiste = await p.evaluate(() => {
    const d = document.querySelector('details.manifesto');
    return { c: !!d, aperto: d?.open };
  });
  dice(esiste.c, 'il <details> c\u2019e\u2019 anche senza JS');
  dice(!esiste.aperto, 'parte chiuso');
  dice(!(await visibile(p, '.istruzioni li')), 'le istruzioni non si vedono finche\u2019 chiuso');

  // clic sulla lastra: senza JS il browser apre da solo, nativamente
  await p.click('.manifesto__slab');
  await p.waitForTimeout(200);
  dice(await p.evaluate(() => document.querySelector('details.manifesto').open),
       'un clic sulla lastra apre le istruzioni, senza JS');
  dice(await visibile(p, '.istruzioni li'), 'e adesso si vedono davvero');
  dice((await p.evaluate(() => document.querySelector('.istruzioni h3')?.textContent.trim()))
       === 'Il colore di tutto il sito', 'il contenuto e\u2019 quello giusto');

  await p.click('.manifesto__slab'); // richiudo
  await p.waitForTimeout(200);
  await p.focus('.manifesto__slab');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(200);
  dice(await p.evaluate(() => document.querySelector('details.manifesto').open),
       'Invio da tastiera sulla lastra apre le istruzioni');

  await ctx.close();
}

// ── con JavaScript, sulle due larghezze ────────────────────────────
for (const [nome, vp] of [['desktop', { width: 1440, height: 900 }], ['telefono', { width: 390, height: 844 }]]) {
  console.log(`\n════ ${nome}, con JS ════`);
  const ctx = await b.newContext({ viewport: vp, isMobile: nome === 'telefono', hasTouch: nome === 'telefono' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2400);

  dice(!(await p.evaluate(() => document.querySelector('details.manifesto').open)),
       'parte chiuso anche a JS acceso');
  dice(!(await visibile(p, '.istruzioni li')), 'le istruzioni non si vedono all\u2019apertura pagina');

  await p.evaluate(() => document.querySelector('.manifesto__slab').scrollIntoView({ block: 'start', behavior: 'instant' }));
  await p.waitForTimeout(200);
  await p.click('.manifesto__slab');
  await p.waitForTimeout(600); // la Web Animations API in apri() dura 420ms
  const dopo = await p.evaluate(() => ({
    aperto: document.querySelector('details.manifesto').open,
    seiVoci: document.querySelectorAll('.istruzioni li').length,
    icona: getComputedStyle(document.querySelector('.manifesto__cta i')).transform,
  }));
  dice(dopo.aperto, 'il clic apre');
  dice(await visibile(p, '.istruzioni li'), 'e le istruzioni si vedono davvero');
  dice(dopo.seiVoci === 6, `tutte e sei ci sono (${dopo.seiVoci})`);
  dice(dopo.icona !== 'none', 'la freccia ha ruotato');

  // richiudere: qui e' dove il primo giro di questo audit sbagliava
  await p.click('.manifesto__slab');
  await p.waitForTimeout(500); // chiudi() dura 320ms + il tempo di onfinish
  const richiuso = await p.evaluate(() => document.querySelector('details.manifesto').open);
  dice(!richiuso, 'un secondo clic chiude l\u2019attributo open');
  dice(!(await visibile(p, '.istruzioni li')), 'e le istruzioni tornano invisibili');

  if (nome === 'telefono') {
    const bersaglio = await p.evaluate(() => Math.round(document.querySelector('.manifesto__slab').getBoundingClientRect().height));
    dice(bersaglio >= 44, `la lastra si prende col pollice (${bersaglio}px di altezza)`);
  }

  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\nil manifesto si apre e si chiude come deve');
process.exitCode = rotte ? 1 : 0;
