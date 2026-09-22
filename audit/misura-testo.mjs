/* ═══════════════════════════════════════════════════════════════════
 * QUANTO TESTO C'E' IN PAGINA
 *
 * Nato per la sintesi di settembre 2026: prima di tagliare bisognava
 * sapere quante parole c'erano davvero e dove stavano, non tagliare a
 * sensazione. Conta le parole leggibili per sezione (solo testo
 * visibile, esclude .scaletta/noscript che spariscono con JS acceso) e
 * l'altezza della pagina, cosi' un prima/dopo si misura in un numero
 * solo invece che a occhio.
 *
 * uso: node audit/misura-testo.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(SITO, { waitUntil: 'networkidle' });
await p.waitForTimeout(2600);

const r = await p.evaluate(() => {
  const per = {};
  const conta = (s) => s.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  for (const sec of document.querySelectorAll('#main > section')) {
    let testo = '';
    for (const e of sec.querySelectorAll('p, li, h2, h3, h4, dd, .mono, figcaption')) {
      if (e.closest('script,style,svg,canvas,noscript')) continue;
      const cs = getComputedStyle(e);
      if (cs.display === 'none') continue;
      testo += ' ' + (e.textContent || '');
    }
    per[sec.id || '?'] = conta(testo);
  }
  const tutto = conta(document.getElementById('main').innerText || '');
  return { per, tutto, altezza: document.body.scrollHeight };
});

console.log('Parole totali (innerText):', r.tutto);
console.log('Altezza pagina:', r.altezza, 'px');
console.log('\nParole per sezione (dai tag di testo):');
for (const [k, v] of Object.entries(r.per).sort((a, b) => b[1] - a[1]))
  console.log('  ', String(v).padStart(5), k);

await b.close();
