/* Come si presenta la pagina a chi arriva: telefono prima, poi
   desktop. uso: node audit/apertura-foto.mjs */
import { chromium } from 'playwright';

const b = await chromium.launch({
  executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
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

  for (const [tappa, id] of [['1-apertura', 'top'], ['2-istruzioni', 'come'],
                             ['3-servizi', 'banchi'], ['4-contatto', 'contatto']]) {
    await p.evaluate(i => {
      document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' });
      if (i !== 'top') scrollBy(0, -80);
    }, id);
    await p.waitForTimeout(500);
    const f = `audit/v2shots/apre-${nome}-${tappa}.jpg`;
    await p.screenshot({ path: f, type: 'jpeg', quality: 82 });
    console.log(f);
  }
  await ctx.close();
}
await b.close();
