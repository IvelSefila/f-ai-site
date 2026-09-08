/* Girando fra le stanze, il ciclo di disegno si ferma mai?
   Se il quadro resta identico per un secondo intero, si e' fermato. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('ERRORE', String(e)));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });

const NUMERO = { soglia:'00', bilancia:'01', scriptorium:'02', banchi:'03',
                 forgia:'04', materia:'05', scheda:'06', alchimista:'07' };
const impronta = () => p.evaluate(() => {
  const cv = document.querySelector('#schermo');
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let s = 0; for (let i = 0; i < d.length; i += 997) s = (s * 31 + d[i]) >>> 0;
  return s;
});
/* quante volte il ciclo ha girato, chiesto al browser */
const giri = () => p.evaluate(() => new Promise(r => {
  let n = 0; const t = performance.now();
  const g = () => { n++; performance.now() - t < 500 ? requestAnimationFrame(g) : r(n); };
  requestAnimationFrame(g);
}));

let fermi = 0;
for (let giro = 0; giro < 3; giro++)
  for (const id of Object.keys(NUMERO)) {
    await p.evaluate(i => document.querySelector('#s-' + i).scrollIntoView(), id);
    await p.waitForFunction(n => (document.querySelector('#statoStanza').textContent || '')
      .includes('Stanza ' + n), NUMERO[id], { timeout: 8000 });
    await p.waitForTimeout(350);
    const viste = new Set();
    for (let k = 0; k < 10; k++) { viste.add(await impronta()); await p.waitForTimeout(100); }
    if (viste.size === 1) {
      fermi++;
      console.log(`  FERMO  ${id.padEnd(12)} quadro identico per un secondo · rAF in mezzo secondo: ${await giri()}`);
    }
  }
console.log(fermi ? `\n${fermi} volte il quadro si e' fermato` : '\nil ciclo non si ferma mai');
await b.close();
process.exit(fermi ? 1 : 0);
