/* Verifica che quello che il browser esegue sia davvero l'ultima
   versione: non basta che il server mandi i file giusti, il browser
   deve anche non ripescarli dalla cache. Guardo le richieste vere. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errori = [], moduli = [];
p.on('console', m => m.type() === 'error' && errori.push(m.text()));
p.on('pageerror', e => errori.push(String(e)));
p.on('request', r => { const u = r.url(); if (/\.(js|css)/.test(u)) moduli.push(u.split('/pixel/')[1] || u); });

await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);

const senzaVersione = moduli.filter(u => !u.includes('?v='));
const stato = await p.evaluate(() => {
  const cv = document.querySelector('#schermo');
  return {
    canvas: cv ? `${cv.width}x${cv.height}` : 'assente',
    pigmenti: document.querySelectorAll('#listaPigmenti li').length,
    pagine: document.querySelectorAll('.pagina').length,
    menu: document.querySelectorAll('nav a').length,
  };
});

console.log('moduli chiesti :', moduli.length, '· senza versione:', senzaVersione.length, senzaVersione.join(' '));
console.log('canvas         :', stato.canvas, '(atteso 960x540)');
console.log('pigmenti in lista:', stato.pigmenti, '(atteso 64)');
console.log('pagine         :', stato.pagine, '· menù:', stato.menu);
console.log('errori         :', errori.length, errori.slice(0, 3).join(' | '));

/* e il colpetto sugli oggetti, che e' la novita' */
await p.evaluate(() => document.querySelector('#s-alchimista').scrollIntoView());
await p.waitForTimeout(900);
const tel = await p.locator('.telaio').boundingBox();
const tocca = async (lx, ly) => {
  await p.mouse.click(tel.x + tel.width * lx / 320, tel.y + tel.height * ly / 180);
  await p.waitForTimeout(60);
};
const luce = async (x, y, w, h) => p.evaluate(([x, y, w, h]) => {
  const cv = document.querySelector('#schermo'), k = cv.width / 320;
  const d = cv.getContext('2d').getImageData(x*k, y*k, w*k, h*k).data;
  let s = 0; for (let i = 0; i < d.length; i += 4) s += .2126*d[i] + .7152*d[i+1] + .0722*d[i+2];
  return Math.round(s / (d.length / 4));
}, [x, y, w, h]);

const c0 = await luce(112, 60, 34, 40);
await tocca(128, 88); await p.waitForTimeout(500);
const c1 = await luce(112, 60, 34, 40);
await p.waitForTimeout(2600);
const c2 = await luce(112, 60, 34, 40);
console.log(`candela        : ${c0} → ${c1} (spenta) → ${c2} (riaccesa)`);

const a0 = await luce(142, 90, 40, 32);
await tocca(161, 100); await p.waitForTimeout(700);
const a1 = await luce(142, 90, 40, 32);
console.log(`ampolla        : ${a0} → ${a1} (ribolle)`);

await tocca(200, 55); await tocca(230, 52); await tocca(255, 58);
await p.waitForTimeout(1400);
await p.screenshot({ path: 'audit/aggiornato.png', clip: tel });
await b.close();
