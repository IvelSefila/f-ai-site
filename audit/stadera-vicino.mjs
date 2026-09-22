/* Il dettaglio dove le toppe si vedrebbero: l'attacco delle catene. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('ERRORE', String(e)));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelector('#s-bilancia').scrollIntoView());
await p.waitForTimeout(900);
for (const v of [0, 100]) {
  await p.evaluate(n => { const l = document.querySelector('#levaMix');
    l.value = n; l.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await p.waitForTimeout(400);
  /* ingrandisco il fotogramma vero, non lo schermo */
  const png = await p.evaluate(([x, y, w, h]) => {
    const cv = document.querySelector('#schermo'), K = cv.width / 320;
    const src = cv.getContext('2d').getImageData(x*K, y*K, w*K, h*K);
    const o = document.createElement('canvas');
    o.width = w*K; o.height = h*K;
    o.getContext('2d').putImageData(src, 0, 0);
    const big = document.createElement('canvas');
    big.width = w*K*4; big.height = h*K*4;
    const g = big.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(o, 0, 0, big.width, big.height);
    return big.toDataURL('image/png').split(',')[1];
  }, [88, 26, 140, 60]);
  const fs = await import('fs');
  fs.writeFileSync(`audit/stadera-vicino-${v}.png`, Buffer.from(png, 'base64'));
}
await b.close();
console.log('dettagli');
