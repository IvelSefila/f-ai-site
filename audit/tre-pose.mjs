import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 700, height: 900 } });
await p.goto('about:blank');
const quali = (process.argv[2] || '00,08,16').split(',');
const png = await p.evaluate(async (d) => {
  const o = document.createElement('canvas');
  o.width = 640; o.height = 200 * d.length;
  const g = o.getContext('2d');
  for (let i = 0; i < d.length; i++) {
    const im = new Image(); im.src = 'data:image/png;base64,' + d[i].b; await im.decode();
    g.drawImage(im, 400, 150, 1280, 450, 0, i * 200, 640, 200);
    g.fillStyle = '#0f0'; g.font = 'bold 20px monospace';
    g.fillText(d[i].n, 8, i * 200 + 24);
  }
  return o.toDataURL('image/png').split(',')[1];
}, quali.map(n => ({ n, b: fs.readFileSync(`site/pixel/fotogrammi/bilancia-${n}.png`).toString('base64') })));
fs.writeFileSync('audit/tre-pose.png', Buffer.from(png, 'base64'));
await b.close();
console.log('audit/tre-pose.png');
