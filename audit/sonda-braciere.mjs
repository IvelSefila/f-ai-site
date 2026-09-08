/* Il braciere della bilancia cambia o no? Venti letture, stampate. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('ERRORE', String(e)));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelector('#s-bilancia').scrollIntoView());
await p.waitForTimeout(900);
const impronta = () => p.evaluate(() => {
  const cv = document.querySelector('#schermo'), k = cv.width / 320;
  const d = cv.getContext('2d').getImageData(0, 104 * k, 22 * k, 56 * k).data;
  let s = 0; for (let i = 0; i < d.length; i += 40) s = (s * 31 + d[i]) >>> 0;
  return s;
});
const vive = () => p.evaluate(() => ({
  visibile: document.querySelector('#schermo').getBoundingClientRect().top,
  nascosta: document.hidden,
}));
const st = await p.evaluate(() => document.querySelector('#statoStanza').textContent);
console.log('stanza mostrata:', st, '· stato:', JSON.stringify(await vive()));
const viste = new Set();
for (let i = 0; i < 20; i++) { viste.add(await impronta()); await p.waitForTimeout(80); }
console.log('impronte diverse in 20 letture:', viste.size);
await b.close();
