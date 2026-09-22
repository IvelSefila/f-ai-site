/* ═══════════════════════════════════════════════════════════════════
 * LA CONVERSIONE E' FEDELE?
 *
 * Confrontare due fotografie della stanza non dimostra niente: dove
 * qualcosa si muove i pixel cambiano perche' e' passato del tempo, non
 * perche' il codice sbaglia. Lo 0,06 per cento di scarto che avevo
 * misurato era tutto li' — fiamme, aloni che respirano, rune che
 * girano.
 *
 * La prova vera e' questa: riempio un fotogramma con tutti i
 * sessantaquattro pigmenti, lo faccio consegnare allo schermo, e
 * rileggo i pixel uno per uno confrontandoli con la tavolozza scritta
 * nel file. Se l'ordine dei byte fosse sbagliato — l'errore classico
 * quando si impacchettano i colori in interi — i rossi e i blu
 * risulterebbero scambiati, e qui si vedrebbe.
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage();
const errori = [];
p.on('pageerror', e => errori.push(String(e)));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });

const esito = await p.evaluate(async () => {
  /* prendo il motore e la tavolozza dagli stessi file che usa il sito */
  const v = document.querySelector('script[type=module][src*=gioco]').src.split('?v=')[1];
  const { Schermo } = await import('./motore.js?v=' + v);
  const { TAVOLOZZA, RGB } = await import('./tavolozza.js?v=' + v);

  const n = RGB.length;
  const sc = new Schermo(n, 1, 1);           /* un pixel per pigmento */
  for (let i = 0; i < n; i++) sc.buf[i] = i;

  const cv = document.createElement('canvas');
  cv.width = n; cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  sc.presenta(ctx);
  const d = ctx.getImageData(0, 0, n, 1).data;

  const sbagliati = [];
  for (let i = 0; i < n; i++) {
    const [r, g, bb] = RGB[i];
    const k = i * 4;
    if (d[k] !== r || d[k + 1] !== g || d[k + 2] !== bb || d[k + 3] !== 255)
      sbagliati.push({
        i, nome: TAVOLOZZA[i][1],
        atteso: [r, g, bb, 255],
        avuto: [d[k], d[k + 1], d[k + 2], d[k + 3]],
      });
  }
  return { n, sbagliati };
});

console.log(`pigmenti controllati: ${esito.n}`);
if (esito.sbagliati.length) {
  for (const s of esito.sbagliati.slice(0, 8))
    console.log(`  ${String(s.i).padStart(2)} ${s.nome.padEnd(22)} atteso ${s.atteso} · avuto ${s.avuto}`);
  console.log(`\n${esito.sbagliati.length} pigmenti sbagliati`);
} else {
  console.log('tutti resi esatti, canale per canale, alfa compresa');
}
console.log('errori:', errori.length, errori.slice(0, 2).join(' | '));
await b.close();
process.exit(esito.sbagliati.length || errori.length ? 1 : 0);
