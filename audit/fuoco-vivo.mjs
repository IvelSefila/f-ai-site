/* Due fotogrammi della stessa zona a mezzo secondo di distanza:
   se il fuoco dipinto si muove davvero, devono essere diversi. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('ERRORE', String(e)));
p.on('console', m => m.type() === 'error' && console.log('console', m.text()));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelector('#s-forgia').scrollIntoView());
await p.waitForTimeout(900);
const tel = await p.locator('.telaio').boundingBox();
for (const [i, attesa] of [[1, 0], [2, 120], [3, 120]]) {
  await p.waitForTimeout(attesa);
  await p.screenshot({ path: `audit/fuoco-${i}.png`, clip: { x: tel.x + tel.width * 10 / 320, y: tel.y + tel.height * 50 / 180, width: tel.width * 80 / 320, height: tel.height * 76 / 180 } });
}
await b.close();
console.log('tre fotogrammi del fuoco');
