/* La mappa delle sezioni, com'e' mentre si trascina: telefono e
   desktop. uso: node audit/mappa-foto.mjs */
import { chromium } from 'playwright';

const b = await chromium.launch({
  executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

for (const [nome, vp, dito] of [['telefono', { width: 390, height: 844 }, true],
                                ['desktop',  { width: 1440, height: 900 }, false]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: dito, hasTouch: dito });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8899/v2/index.html?probe=1', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2400);

  await p.evaluate(() => document.getElementById('lavori')
    .querySelector('.sec__head').scrollIntoView({ block: 'center', behavior: 'instant' }));
  const q = await p.evaluate(() => {
    const r = document.querySelector('#lavori .sec__head').getBoundingClientRect();
    return { x: Math.round(r.left + 40), y: Math.round(Math.max(90, r.top + 20)) };
  });
  await p.mouse.move(q.x, q.y);
  await p.mouse.down();
  await p.waitForTimeout(760);
  await p.mouse.move(q.x + 14, q.y + 6);
  await p.waitForTimeout(260);

  /* la porto a meta' strada verso il brief, cosi' si vede la banda in
     viaggio e le altre gia' riassestate */
  const m = await p.evaluate(() => {
    const r = document.getElementById('brief').getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  for (let k = 1; k <= 8; k++) {
    await p.mouse.move(q.x + (m.x - q.x) * k / 8, q.y + (m.y - q.y) * k / 8);
    await p.waitForTimeout(30);
  }
  await p.waitForTimeout(120);
  await p.screenshot({ path: `audit/v2shots/mappa-${nome}.jpg`, type: 'jpeg', quality: 84 });
  await p.mouse.up();
  await p.waitForTimeout(2200);   /* lo scorrimento morbido deve finire */
  await p.screenshot({ path: `audit/v2shots/mappa-${nome}-dopo.jpg`, type: 'jpeg', quality: 84 });
  await ctx.close();
  console.log(nome);
}
await b.close();
console.log('audit/v2shots/mappa-*.jpg');
