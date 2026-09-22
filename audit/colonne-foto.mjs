/* I preset a colonne diverse, guardati invece che misurati.
   uso: node audit/colonne-foto.mjs */
import { chromium } from 'playwright';

const b = await chromium.launch({
  executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const CASI = [
  ['desktop', { width: 1440, height: 900 }, '.istruzioni', '2'],
  ['telefono', { width: 390, height: 844 }, '.istruzioni', '2'],
  ['desktop', { width: 1440, height: 900 }, '.offerta__grid', '4'],
  ['desktop', { width: 1440, height: 900 }, '.deck',  '8-4'],
  ['desktop', { width: 1440, height: 900 }, '.deck',  '6-3-3'],
  ['desktop', { width: 1440, height: 900 }, '.offerta__grid', '8-4'],
  ['telefono', { width: 390, height: 844 }, '.deck',  '8-4'],
  ['telefono', { width: 390, height: 844 }, '.offerta__grid', '6-3-3'],
];

for (const [nome, vp, sel, preset] of CASI) {
  const ctx = await b.newContext({ viewport: vp, isMobile: vp.width < 700, hasTouch: vp.width < 700 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8899/v2/index.html?probe=1', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2300);
  await p.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));
  await p.evaluate(({ s, v }) => {
    const g = document.querySelector(s);
    g.dataset.gr = v;
    g.scrollIntoView({ block: 'start', behavior: 'instant' });
    scrollBy(0, -90);
  }, { s: sel, v: preset });
  await p.waitForTimeout(600);
  const f = `audit/v2shots/col-${nome}-${sel.replace(/\W/g, '')}-${preset}.jpg`;
  await p.screenshot({ path: f, type: 'jpeg', quality: 82 });
  console.log(f);
  await ctx.close();
}
await b.close();
