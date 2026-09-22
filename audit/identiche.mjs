/* Due cartelle di fotografie, confrontate pixel per pixel.
   Un'ottimizzazione che cambia l'immagine non e' un'ottimizzazione. */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const [A, B] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage(); await p.goto('about:blank');
let tutte = 0, diverse = 0;
for (const f of fs.readdirSync(A).filter(f => f.endsWith('.png'))) {
  if (!fs.existsSync(path.join(B, f))) continue;
  tutte++;
  const r = await p.evaluate(async ([a, c]) => {
    const carica = async d => { const i = new Image(); i.src = 'data:image/png;base64,' + d; await i.decode();
      const v = document.createElement('canvas'); v.width = i.width; v.height = i.height;
      const g = v.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0);
      return { w: i.width, h: i.height, d: g.getImageData(0, 0, i.width, i.height).data }; };
    const x = await carica(a), y = await carica(c);
    if (x.w !== y.w || x.h !== y.h) return { misura: false };
    let n = 0, peggio = 0;
    for (let i = 0; i < x.d.length; i += 4)
      for (let k = 0; k < 3; k++) {
        const dd = Math.abs(x.d[i + k] - y.d[i + k]);
        if (dd) { n++; if (dd > peggio) peggio = dd; break; }
      }
    return { misura: true, n, peggio, tot: x.d.length / 4 };
  }, [fs.readFileSync(path.join(A, f)).toString('base64'),
      fs.readFileSync(path.join(B, f)).toString('base64')]);
  if (!r.misura) { console.log(`  ${f}: misure diverse`); diverse++; continue; }
  if (r.n) { console.log(`  ${f}: ${r.n} pixel diversi su ${r.tot}, scarto massimo ${r.peggio}`); diverse++; }
}
console.log(diverse ? `\n${diverse}/${tutte} fotografie cambiate` : `\n${tutte}/${tutte} identiche pixel per pixel`);
await b.close();
process.exit(diverse ? 1 : 0);
