import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
const fps = await p.evaluate(() => new Promise(r => {
  let n = 0; const t0 = performance.now();
  const g = () => { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(g) : r(n / ((performance.now() - t0) / 1000)); };
  requestAnimationFrame(g);
}));
console.log('fotogrammi al secondo:', fps.toFixed(1));
await b.close();
