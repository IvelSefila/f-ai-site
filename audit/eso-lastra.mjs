/* La lastra della Esoscheletri, fotografata per intero.
   uso: node audit/eso-lastra.mjs */
import { chromium } from 'playwright';
const b = await chromium.launch({
  executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [nome, vp] of [['telefono', { width: 390, height: 844 }],
                          ['stretto', { width: 760, height: 900 }],
                          ['desktop', { width: 1440, height: 900 }]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: vp.width < 700, hasTouch: vp.width < 700 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8899/v2/index.html?probe=1', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await p.evaluate(() => { document.querySelectorAll('.rv').forEach(e => e.classList.add('in'));
    for (const s of ['.pal-accenno', '.coda', '.testata', '.sessione']) {
      const e = document.querySelector(s); if (e) e.style.display = 'none'; } });
  await p.evaluate(() => Promise.all([...document.querySelectorAll('.eso__dispositivo img')]
    .map(i => i.decode().catch(() => {}))));
  await p.waitForTimeout(300);
  await (await p.$('.eso__slab')).screenshot({
    path: `audit/v2shots/eso-${nome}.jpg`, type: 'jpeg', quality: 86 });
  const m = await p.evaluate(() => {
    const s = document.querySelector('.eso__slab').getBoundingClientRect();
    const d = document.querySelector('.eso__dispositivo img').getBoundingClientRect();
    return { lastra: [Math.round(s.width), Math.round(s.height)],
             dispositivo: [Math.round(d.width), Math.round(d.height)],
             senzaScroll: document.documentElement.scrollWidth <= innerWidth };
  });
  console.log(nome, JSON.stringify(m));
  await ctx.close();
}
await b.close();
