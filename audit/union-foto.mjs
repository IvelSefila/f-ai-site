/* Il blocco Union Energia, guardato. uso: node audit/union-foto.mjs */
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
  await p.evaluate(() => { document.querySelectorAll('.rv').forEach(e => e.classList.add('in'));
    const a = document.querySelector('.pal-accenno'); if (a) a.remove(); });
  for (const [t, sel, giu] of [['1-lastra', '.union', 80], ['2-pezzi', '.union__lavori', 100],
                               ['3-come', '.union__come', 100]]) {
    await p.evaluate(({ s, g }) => { document.querySelector(s)
      .scrollIntoView({ block: 'start', behavior: 'instant' }); scrollBy(0, -g); }, { s: sel, g: giu });
    await p.waitForTimeout(500);
    await p.screenshot({ path: `audit/v2shots/union-${nome}-${t}.jpg`, type: 'jpeg', quality: 85 });
  }
  await ctx.close(); console.log(nome);
}
await b.close();
