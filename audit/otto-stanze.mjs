/* Una fotografia per stanza, e il conto degli errori. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errori = [], avvisi = [];
p.on('pageerror', e => errori.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errori.push(m.text());
                       if (m.type() === 'warning') avvisi.push(m.text()); });
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
const S = ['soglia','bilancia','scriptorium','banchi','forgia','materia','scheda','alchimista'];
for (const id of S) {
  await p.evaluate(i => document.querySelector('#s-' + i).scrollIntoView(), id);
  await p.waitForTimeout(750);
  await p.screenshot({ path: `audit/stanza-${id}.png`, clip: await p.locator('.telaio').boundingBox() });
}
console.log('errori:', errori.length, errori.slice(0,3).join(' | '));
console.log('avvisi:', [...new Set(avvisi)].slice(0,4).join(' | ') || 'nessuno');
await b.close();
