/* Lo stesso fondale a piu' forze di retino, affiancate, per scegliere
   guardando invece che ragionando. */
import { chromium } from 'playwright';
import fs from 'fs';
import { rimappa } from './rimappa.mjs';
const tav = fs.readFileSync('site/pixel/tavolozza.js', 'utf8');
const PIGMENTI = [...tav.matchAll(/\['(#[0-9a-f]{6})',\s*'([^']+)'/g)].map(m => m[1]);
const RGB = PIGMENTI.map(h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16)));
const nome = process.argv[2] || 'forgia';
const forze = (process.argv[3] || '34,20,12,6').split(',').map(Number);
const RITAGLIO = (process.argv[4] || '40,130').split(',').map(Number);
const dati = fs.readFileSync(`site/pixel/immagini/${nome}.png`).toString('base64');
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage(); await p.goto('about:blank');
for (const f of forze) {
  const ind = await rimappa(p, dati, { PIGMENTI, LARGO: 960, ALTO: 540, forza: f });
  const png = await p.evaluate(([ind, RGB, cx, cy]) => {
    const c = document.createElement('canvas'); c.width = 960; c.height = 540;
    const g = c.getContext('2d'); const img = g.createImageData(960, 540);
    for (let i = 0; i < ind.length; i++) { const [r,gg,bb] = RGB[ind[i]]; const k = i*4;
      img.data[k]=r; img.data[k+1]=gg; img.data[k+2]=bb; img.data[k+3]=255; }
    g.putImageData(img, 0, 0);
    /* un ritaglio ingrandito, dove il retino si vede */
    const o = document.createElement('canvas'); o.width = 340*2; o.height = 240*2;
    const go = o.getContext('2d'); go.imageSmoothingEnabled = false;
    go.drawImage(c, cx, cy, 340, 240, 0, 0, o.width, o.height);
    return o.toDataURL('image/png').split(',')[1];
  }, [[...ind], RGB, RITAGLIO[0], RITAGLIO[1]]);
  fs.writeFileSync(`audit/retino-${f}.png`, Buffer.from(png, 'base64'));
  console.log(`forza ${f} → audit/retino-${f}.png`);
}
await b.close();
