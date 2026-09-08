/* Un ritaglio ingrandito di un fondale, con la griglia logica sopra.
   uso: node audit/ritaglio.mjs bilancia 96 28 148 104 */
import { chromium } from 'playwright';
import fs from 'fs';
import zlib from 'zlib';
const [nome, X, Y, W, H] = process.argv.slice(2).map((v, i) => i ? +v : v);
const src = fs.readFileSync('site/pixel/sfondi.js', 'utf8');
const a = zlib.inflateRawSync(Buffer.from(new RegExp(`^  '?${nome}'?: '([^']+)',`, 'm').exec(src)[1], 'base64'));
const tav = fs.readFileSync('site/pixel/tavolozza.js', 'utf8');
const P = [...tav.matchAll(/\['(#[0-9a-f]{6})'/g)].map(m => m[1]);
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: W * 8 + 40, height: H * 8 + 40 } });
await p.goto('about:blank');
await p.evaluate(([ind, P, X, Y, W, H]) => {
  const K = 3, LARGO = 960, Z = 8 / K;   /* ingrandimento sul pixel vero */
  const cv = document.createElement('canvas');
  cv.width = W * K; cv.height = H * K;
  const g = cv.getContext('2d');
  const img = g.createImageData(cv.width, cv.height);
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
    const h = P[ind[(Y * K + y) * LARGO + X * K + x]];
    const k = (y * cv.width + x) * 4;
    img.data[k] = parseInt(h.slice(1,3),16); img.data[k+1] = parseInt(h.slice(3,5),16);
    img.data[k+2] = parseInt(h.slice(5,7),16); img.data[k+3] = 255;
  }
  g.putImageData(img, 0, 0);
  const big = document.createElement('canvas');
  big.width = cv.width * Z; big.height = cv.height * Z;
  const gb = big.getContext('2d');
  gb.imageSmoothingEnabled = false;
  gb.drawImage(cv, 0, 0, big.width, big.height);
  gb.strokeStyle = 'rgba(255,0,0,.55)'; gb.fillStyle = '#f00';
  gb.font = '11px monospace';
  for (let lx = 0; lx <= W; lx += 10) { const px = lx * K * Z;
    gb.beginPath(); gb.moveTo(px, 0); gb.lineTo(px, big.height); gb.stroke();
    gb.fillText(String(X + lx), px + 2, 11); }
  for (let ly = 0; ly <= H; ly += 10) { const py = ly * K * Z;
    gb.beginPath(); gb.moveTo(0, py); gb.lineTo(big.width, py); gb.stroke();
    gb.fillText(String(Y + ly), 2, py + 11); }
  document.body.style.margin = '0';
  document.body.appendChild(big);
}, [[...a], P, X, Y, W, H]);
await p.locator('canvas').screenshot({ path: `audit/ritaglio-${nome}.png` });
await b.close();
console.log(`ritaglio-${nome}.png`);
