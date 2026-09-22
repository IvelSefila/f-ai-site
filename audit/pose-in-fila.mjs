/* Le pose in colonna, per vedere che corsa fa davvero la stadera. */
import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('ERRORE', String(e)));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelector('#s-bilancia').scrollIntoView());
await p.waitForFunction(() => (document.querySelector('#statoStanza').textContent||'').includes('Stanza 01'));
await p.waitForTimeout(1500);
const png = await p.evaluate(async () => {
  const cv = document.querySelector('#schermo'), K = cv.width / 320;
  const leva = document.querySelector('#levaMix');
  const pose = [0, 25, 50, 75, 100];
  const o = document.createElement('canvas');
  o.width = 320 * K; o.height = 180 * K * pose.length;
  const go = o.getContext('2d');
  for (let i = 0; i < pose.length; i++) {
    leva.value = pose[i]; leva.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    go.drawImage(cv, 0, 0, 320 * K, 180 * K, 0, i * 180 * K, 320 * K, 180 * K);
    go.fillStyle = '#0f0'; go.font = 'bold 26px monospace';
    go.fillText(pose[i] + '%', 8, i * 180 * K + 30);
  }
  return o.toDataURL('image/png').split(',')[1];
});
fs.writeFileSync('audit/pose-in-fila.png', Buffer.from(png, 'base64'));
await b.close();
console.log('audit/pose-in-fila.png');
