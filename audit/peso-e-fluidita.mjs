/* ═══════════════════════════════════════════════════════════════════
 * QUANTO PESA E QUANTO SCORRE
 *
 * Due numeri, misurati e non stimati:
 *
 *  · il peso vero sul filo — quanti byte scarica il browser prima di
 *    poter giocare, contati sulle richieste che partono davvero;
 *  · i fotogrammi al secondo, su schermo grande e su telefono. Il
 *    telefono lo imito rallentando il processore di quattro volte con
 *    lo stesso comando che usa il pannello di Chrome: un portatile da
 *    sviluppo non e' un telefono, e misurarci sopra vuol dire non
 *    misurare niente.
 *
 * uso: node audit/peso-e-fluidita.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CHROME = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const INDIRIZZO = 'http://localhost:8899/pixel/index.html';

async function misura({ larghezza, altezza, freno, nome }) {
  const b = await chromium.launch({ executablePath: CHROME });
  const ctx = await b.newContext({ viewport: { width: larghezza, height: altezza } });
  const p = await ctx.newPage();

  /* I byte VERI sul filo, non quelli del corpo srotolato.
     Chiedendo il corpo a Playwright si riceve la roba gia' decompressa:
     misurando cosi' sfondi.js risultava 1,46 MB anche col server che ne
     manda 1,10, e l'ottimizzazione sembrava non essere servita. Chiedo
     al protocollo quanti byte sono passati davvero. */
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  const nomi = new Map();          /* id richiesta → nome del file */
  const richieste = [];
  cdp.on('Network.requestWillBeSent', e => {
    if (e.request.url.startsWith('http://localhost'))
      nomi.set(e.requestId, e.request.url.split('/').pop().split('?')[0]);
  });
  cdp.on('Network.loadingFinished', e => {
    const nome = nomi.get(e.requestId);
    if (nome) richieste.push([nome, e.encodedDataLength]);
  });

  if (freno > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: freno });

  const t0 = Date.now();
  await p.goto(INDIRIZZO, { waitUntil: 'load' });
  const caricata = Date.now() - t0;
  await p.waitForLoadState('networkidle');
  const pronta = Date.now() - t0;

  /* i fotogrammi veri: conto i giri di requestAnimationFrame */
  await p.waitForTimeout(700);
  const fps = async () => p.evaluate(() => new Promise(r => {
    let n = 0; const t = performance.now();
    const g = () => { n++; performance.now() - t < 1600 ? requestAnimationFrame(g)
                                                        : r(n / ((performance.now() - t) / 1000)); };
    requestAnimationFrame(g);
  }));

  /* Quanto costa un fotogramma di sola conversione, nei due modi:
     quello vecchio con la destrutturazione e quello nuovo a interi.
     Li misuro tutti e due qui dentro, cosi' il confronto e' sulla
     stessa macchina nello stesso momento. */
  const costo = await p.evaluate(() => {
    const cv = document.querySelector('#schermo');
    const g = cv.getContext('2d');
    const img = g.createImageData(cv.width, cv.height);
    img.data.fill(255);
    const u32 = new Uint32Array(img.data.buffer);
    const n = cv.width * cv.height;
    const finto = new Uint8Array(n);
    for (let i = 0; i < n; i++) finto[i] = i & 63;
    const RGB = [];
    const pal = new Uint32Array(64);
    for (let i = 0; i < 64; i++) {
      const r = i * 3 & 255, gg = i * 5 & 255, bb = i * 7 & 255;
      RGB.push([r, gg, bb]);
      pal[i] = ((255 << 24) | (bb << 16) | (gg << 8) | r) >>> 0;
    }
    const cronometra = (f) => {
      f(); f();                                  /* due giri a vuoto */
      const t = performance.now();
      for (let giro = 0; giro < 10; giro++) f();
      return +((performance.now() - t) / 10).toFixed(2);
    };
    const vecchio = cronometra(() => {
      const d = img.data;
      for (let i = 0; i < n; i++) {
        const [r, gg, bb] = RGB[finto[i]];
        const k = i << 2;
        d[k] = r; d[k + 1] = gg; d[k + 2] = bb;
      }
    });
    const nuovo = cronometra(() => {
      for (let i = 0; i < n; i++) u32[i] = pal[finto[i]];
    });
    return { vecchio, nuovo };
  });

  const stanze = ['soglia', 'bilancia', 'materia', 'alchimista'];
  const letture = [];
  for (const id of stanze) {
    await p.evaluate(i => document.querySelector('#s-' + i).scrollIntoView(), id);
    await p.waitForTimeout(500);
    letture.push([id, +(await fps()).toFixed(1)]);
  }

  const totale = richieste.reduce((a, [, n]) => a + n, 0);
  const grossi = richieste.filter(([, n]) => n > 40000)
    .sort((a, b) => b[1] - a[1]).slice(0, 4);

  console.log(`\n── ${nome} ──`);
  console.log(`  scaricato   ${(totale / 1024 / 1024).toFixed(2)} MB in ${richieste.length} richieste`);
  for (const [f, n] of grossi) console.log(`              ${f.padEnd(16)} ${(n / 1024).toFixed(0)} KB`);
  console.log(`  caricata in ${caricata} ms · tutto fermo a ${pronta} ms`);
  console.log(`  conversione: ${costo.vecchio} ms col vecchio modo · ${costo.nuovo} ms col nuovo`);
  console.log('  fotogrammi al secondo:');
  for (const [id, f] of letture) console.log(`              ${id.padEnd(12)} ${f}`);
  await b.close();
  return { totale, letture, costo };
}

await misura({ larghezza: 1440, altezza: 900, freno: 1, nome: 'schermo grande, processore libero' });
await misura({ larghezza: 390, altezza: 844, freno: 4, nome: 'telefono, processore rallentato 4x' });
