/* Il blocco degli strumenti al suo posto nuovo, e una scheda aperta.
   uso: node audit/strumenti-foto.mjs */
import { chromium } from 'playwright';

const b = await chromium.launch({
  executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

for (const [nome, vp] of [['telefono', { width: 390, height: 844 }],
                          ['desktop', { width: 1440, height: 900 }]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: vp.width < 700, hasTouch: vp.width < 700 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8899/v2/index.html?probe=1', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2400);
  await p.evaluate(() => {
    document.querySelectorAll('.rv').forEach(e => e.classList.add('in'));
    const a = document.querySelector('.pal-accenno'); if (a) a.remove();
  });

  await p.evaluate(() => {
    document.querySelector('.stack').scrollIntoView({ block: 'start', behavior: 'instant' });
    scrollBy(0, -80);
  });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `audit/v2shots/strum-${nome}-elenco.jpg`, type: 'jpeg', quality: 84 });

  /* il blocco delle app che mi sono costruito, subito sotto l'elenco */
  await p.evaluate(() => {
    document.querySelector('.appmie').scrollIntoView({ block: 'start', behavior: 'instant' });
    scrollBy(0, -80);
  });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `audit/v2shots/appmie-${nome}.jpg`, type: 'jpeg', quality: 84 });

  /* ComfyUI: la scheda piu' lunga di tutte, definizione compresa. */
  await p.click('.stack__group--local button:nth-child(2)');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `audit/v2shots/strum-${nome}-scheda.jpg`, type: 'jpeg', quality: 84 });
  await ctx.close();
  console.log(nome);
}
await b.close();
