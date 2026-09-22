/* ═══════════════════════════════════════════════════════════════════
 * LE SCALETTE NON DEVONO ALLONTANARSI DAI MODULI
 *
 * Dentro ogni griglia dei casi c'e' un elenco scritto a mano nell'HTML:
 * si vede solo a JavaScript spento, perche' con il JS acceso viene
 * sostituito dalle schede vere. Serve a non lasciare tre buchi a chi
 * arriva senza JS.
 *
 * Il guaio degli elenchi scritti due volte e' che si allontanano: uno
 * aggiunge un video al modulo e si dimentica l'HTML, e per sei mesi
 * nessuno se ne accorge perche' con il JS acceso l'elenco non si vede
 * mai. Questo controllo li rimette uno accanto all'altro.
 *
 * uso: node audit/scalette.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

/* ── 1 · a JS spento: cosa c'e' scritto nell'HTML ─────────────────── */
const spento = await b.newContext({ javaScriptEnabled: false });
const ps = await spento.newPage();
await ps.goto(SITO, { waitUntil: 'domcontentloaded' });
const nellHtml = await ps.evaluate(() => {
  const fuori = {};
  for (const g of document.querySelectorAll('.union__lavori,.eso__lavori,.locanda__lavori,.cest__lavori,.locanda__brani')) {
    fuori[g.className] = [...g.querySelectorAll('.scaletta li, li')].map(li => li.textContent.trim());
  }
  return fuori;
});
await spento.close();

/* ── 2 · a JS acceso: cosa costruiscono i moduli ──────────────────── */
const acceso = await b.newContext({ viewport: { width: 1440, height: 900 } });
const pa = await acceso.newPage();
await pa.goto(SITO, { waitUntil: 'networkidle' });
await pa.waitForTimeout(2000);
const nelModulo = await pa.evaluate(() => {
  const fuori = {};
  for (const g of document.querySelectorAll('.union__lavori,.eso__lavori,.locanda__lavori,.cest__lavori,.locanda__brani')) {
    fuori[g.className] = [...g.querySelectorAll('h4, .locanda__nome b')].map(h => h.textContent.trim());
    fuori[g.className + ' scaletta rimasta'] = g.querySelectorAll('.scaletta').length;
  }
  return fuori;
});
await acceso.close();
await b.close();

for (const chiave of Object.keys(nellHtml)) {
  const a = nellHtml[chiave], c = nelModulo[chiave] || [];
  const nome = chiave.split('__')[0];
  dice(a.length > 0, `${nome}: la scaletta c'e' a JS spento (${a.length} voci)`);
  dice(a.length === c.length, `${nome}: stesso numero di pezzi (html ${a.length}, modulo ${c.length})`);
  const diversi = a.filter((t, i) => t !== c[i]);
  dice(diversi.length === 0,
       `${nome}: stessi titoli e stesso ordine${diversi.length ? ' — il primo che non torna: "' + diversi[0] + '"' : ''}`);
  dice(nelModulo[chiave + ' scaletta rimasta'] === 0,
       `${nome}: con il JS acceso la scaletta sparisce`);
}

console.log(rotte ? `\n${rotte} controlli con problemi` : '\nle scalette sono in pari con i moduli');
process.exitCode = rotte ? 1 : 0;
