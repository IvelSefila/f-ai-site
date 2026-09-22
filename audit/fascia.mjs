import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage(); await p.goto('about:blank');
for (const f of process.argv.slice(2)) {
  const r = await p.evaluate(async d => {
    const i = new Image(); i.src = 'data:image/png;base64,' + d; await i.decode();
    const c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0);
    const dd = g.getImageData(0, 0, c.width, c.height).data;
    const riga = y => { let mn=[255,255,255], mx=[0,0,0];
      for (let x = 0; x < c.width; x += 3) { const k = (y*c.width+x)*4;
        for (let j = 0; j < 3; j++) { if (dd[k+j]<mn[j]) mn[j]=dd[k+j]; if (dd[k+j]>mx[j]) mx[j]=dd[k+j]; } }
      const k0 = (y*c.width + (c.width>>1))*4;
      return { v: Math.max(mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]), rgb: [dd[k0],dd[k0+1],dd[k0+2]] }; };
    const out = [];
    for (let y = c.height - 1; y > c.height - 260; y -= 20) out.push([y, riga(y)]);
    return { h: c.height, out };
  }, fs.readFileSync(f).toString('base64'));
  console.log(f, '· alto', r.h);
  for (const [y, x] of r.out) console.log(`   y=${y} variazione ${String(x.v).padStart(3)} colore ${x.rgb.join(',')}`);
}
await b.close();
