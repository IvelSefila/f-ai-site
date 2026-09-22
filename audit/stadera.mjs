/* Tre fotografie della bilancia a tre posizioni della leva. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('ERRORE', String(e)));
p.on('console', m => m.type() === 'error' && console.log('console', m.text()));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelector('#s-bilancia').scrollIntoView());
await p.waitForTimeout(900);
const tel = await p.locator('.telaio').boundingBox();
for (const v of [0, 50, 100]) {
  await p.evaluate(n => { const l = document.querySelector('#levaMix');
    l.value = n; l.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await p.waitForTimeout(500);
  await p.screenshot({ path: `audit/stadera-${v}.png`,
    clip: { x: tel.x + tel.width * 60 / 320, y: tel.y + tel.height * 22 / 180,
            width: tel.width * 200 / 320, height: tel.height * 120 / 180 } });
}
await b.close();
console.log('tre fotografie della stadera');
