/* Il primo e l'ultimo fotogramma dei due filmati, etichettati. */
import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage(); await p.goto('about:blank');
const capi = [];
for (const nome of ['mano', 'macchina']) {
  const d = fs.readFileSync(`audit/video-${nome}.mp4`).toString('base64');
  const dur = await p.evaluate(async (d) => {
    const v = document.createElement('video'); v.src = 'data:video/mp4;base64,' + d; v.muted = true;
    await new Promise(r => { v.onloadedmetadata = r; }); window.__v = v; return v.duration;
  }, d);
  for (const [eti, t] of [['inizio', 0.05], ['fine', dur - 0.2]]) {
    capi.push({ n: `${nome} ${eti}`, b: await p.evaluate(async (t) => {
      const v = window.__v; await new Promise(r => { v.onseeked = r; v.currentTime = t; });
      const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      return c.toDataURL('image/png').split(',')[1];
    }, t) });
  }
}
const png = await p.evaluate(async (d) => {
  const o = document.createElement('canvas'); o.width = 640; o.height = 200 * d.length;
  const g = o.getContext('2d');
  for (let i = 0; i < d.length; i++) {
    const im = new Image(); im.src = 'data:image/png;base64,' + d[i].b; await im.decode();
    g.drawImage(im, 400, 150, 1280, 450, 0, i * 200, 640, 200);
    g.fillStyle = '#0f0'; g.font = 'bold 20px monospace'; g.fillText(d[i].n, 8, i * 200 + 24);
  }
  return o.toDataURL('image/png').split(',')[1];
}, capi);
fs.writeFileSync('audit/capi-video.png', Buffer.from(png, 'base64'));
await b.close();
console.log('audit/capi-video.png');
