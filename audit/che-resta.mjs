/* Dopo il tocco, cosa resta esattamente? Fotografo prima, tocco,
   aspetto, e disegno una mappa di dove i pixel sono cambiati. */
import { chromium } from 'playwright';
const [id, tx, ty] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('ERRORE', String(e)));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.evaluate(i => document.querySelector('#s-' + i).scrollIntoView(), id);
await p.waitForTimeout(900);
const tel = await p.locator('.telaio').boundingBox();
const foto = () => p.evaluate(() => { const cv = document.querySelector('#schermo');
  return [...cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data]; });
const tocca = async () => { await p.mouse.click(tel.x + tel.width * +tx / 320, tel.y + tel.height * +ty / 180); };
await tocca(); await p.waitForTimeout(3000);
const A = await foto();
await tocca(); await p.waitForTimeout(3000);
const B = await foto();
/* dove sono i cambiamenti, per fascia di 20 unita' logiche */
const K = 3, W = 960;
const griglia = {};
for (let i = 0; i < A.length; i += 4) {
  const d = Math.max(Math.abs(A[i]-B[i]), Math.abs(A[i+1]-B[i+1]), Math.abs(A[i+2]-B[i+2]));
  if (d <= 12) continue;
  const px = (i / 4) % W, py = Math.floor((i / 4) / W);
  const cella = `${Math.floor(px / K / 40) * 40},${Math.floor(py / K / 40) * 40}`;
  griglia[cella] = (griglia[cella] || 0) + 1;
}
const righe = Object.entries(griglia).sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log(`${id} · tocco in ${tx},${ty}`);
for (const [c, n] of righe) console.log(`  zona ${c.padEnd(8)} ${n} pixel cambiati`);
await b.close();
