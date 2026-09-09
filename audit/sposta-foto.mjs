/* Tre foto del gesto: il riquadro staccato, il riquadro in viaggio con
   i vicini che gli fanno posto, e il pannello con i comandi nuovi.
   uso: node audit/sposta-foto.mjs */
import { chromium } from 'playwright';

const b = await chromium.launch({
  executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await p.goto('http://localhost:8899/v2/index.html?probe=1', { waitUntil: 'networkidle' });
await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
await p.waitForTimeout(2400);
await p.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));

const dove = (sel, i, fx, fy) => p.evaluate(({ s, i, fx, fy }) => {
  const r = document.querySelectorAll(s)[i].getBoundingClientRect();
  return { x: Math.round(r.left + r.width * fx), y: Math.round(r.top + r.height * fy) };
}, { s: sel, i, fx, fy });

await p.evaluate(() => document.querySelectorAll('.work')[0]
  .scrollIntoView({ block: 'center', behavior: 'instant' }));
await p.waitForTimeout(300);

const a = await dove('.work', 0, 0.04, 0.03);
const m = await dove('.work', 1, 0.8, 0.1);

await p.mouse.move(a.x, a.y);
await p.mouse.down();
await p.waitForTimeout(750);
await p.screenshot({ path: 'audit/v2shots/sposta-1-staccato.jpg', type: 'jpeg', quality: 82 });

for (let k = 1; k <= 8; k++) {
  await p.mouse.move(a.x + (m.x - a.x) * k / 8, a.y + (m.y - a.y) * k / 8);
  await p.waitForTimeout(30);
}
await p.waitForTimeout(60);
await p.screenshot({ path: 'audit/v2shots/sposta-2-viaggio.jpg', type: 'jpeg', quality: 82 });
await p.mouse.up();
await p.waitForTimeout(400);
await p.screenshot({ path: 'audit/v2shots/sposta-3-posato.jpg', type: 'jpeg', quality: 82 });

/* il pannello */
const c = await dove('.work', 0, 0.04, 0.03);
await p.mouse.move(c.x, c.y);
await p.mouse.down(); await p.waitForTimeout(750); await p.mouse.up();
await p.waitForTimeout(500);
await p.screenshot({ path: 'audit/v2shots/sposta-4-pannello.jpg', type: 'jpeg', quality: 82 });

await b.close();
console.log('quattro foto in audit/v2shots/sposta-*.jpg');
