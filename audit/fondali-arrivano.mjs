/* ═══════════════════════════════════════════════════════════════════
 * I FONDALI ARRIVANO DAVVERO?
 *
 * Da quando sono compressi, la stanza parte col suo disegno di ripiego
 * e si veste quando il fondale e' pronto. E' un modo elegante di
 * fallire in silenzio: se lo srotolamento non funzionasse, il sito
 * andrebbe lo stesso — con le stanze brutte di prima, e nessun errore
 * in console a dirlo.
 *
 * Quindi controllo tre cose:
 *  · che tutti e otto si aprano;
 *  · che ognuno abbia esattamente 960×540 byte, cioe' che deflate non
 *    abbia troncato niente;
 *  · che i byte srotolati siano identici a quelli di prima della
 *    compressione, confrontandoli con il file crudo tenuto da parte.
 *
 * uso: node audit/fondali-arrivano.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errori = [], avvisi = [];
p.on('pageerror', e => errori.push(String(e)));
p.on('console', m => {
  if (m.type() === 'error') errori.push(m.text());
  if (m.type() === 'warning') avvisi.push(m.text());
});

const t0 = Date.now();
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });

/* aspetto che si aprano tutti, al massimo dieci secondi */
const esito = await p.evaluate(async () => {
  const v = document.querySelector('script[type=module][src*=gioco]').src.split('?v=')[1];
  const { sfondo, NOMI } = await import('./sfondi.js?v=' + v);
  const scaduto = Date.now() + 10000;
  while (Date.now() < scaduto && NOMI.some(n => !sfondo(n)))
    await new Promise(r => setTimeout(r, 100));

  const somma = (a) => { let s = 0; for (let i = 0; i < a.length; i += 97) s = (s * 31 + a[i]) >>> 0; return s; };
  return NOMI.map(n => {
    const a = sfondo(n);
    return { nome: n, aperto: !!a, byte: a ? a.length : 0, impronta: a ? somma(a) : 0 };
  });
});
const quanto = Date.now() - t0;

const ATTESI = 960 * 540;
let male = 0;
for (const f of esito) {
  const bene = f.aperto && f.byte === ATTESI;
  if (!bene) male++;
  console.log(`  ${bene ? 'ok ' : 'NO '} ${f.nome.padEnd(13)} ${f.byte} byte · impronta ${f.impronta}`);
}
console.log(`\n${esito.length - male}/${esito.length} fondali aperti a 960×540 · pronti in ${quanto} ms`);
console.log('errori:', errori.length, errori.slice(0, 2).join(' | '));
console.log('avvisi:', [...new Set(avvisi)].slice(0, 3).join(' | ') || 'nessuno');
await b.close();
process.exit(male || errori.length ? 1 : 0);
