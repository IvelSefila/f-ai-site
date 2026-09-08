/* ═══════════════════════════════════════════════════════════════════
 * LA BILANCIA SEGUE LA LEVA?
 *
 * Muovo la leva da un capo all'altro e misuro dove sta il piatto: non
 * "cambia qualcosa", proprio a che altezza. Trovo il piatto cercando
 * la riga piu' bassa che contiene i suoi pigmenti dentro una colonna
 * stretta, cosi' il numero e' un'altezza in pixel e non un'impressione.
 *
 * E controllo che il resto della stanza stia fermo: spostare pezzi di
 * fondale e' comodo ma se sbagli scatola trascini anche il muro.
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errori = [];
p.on('pageerror', e => errori.push(String(e)));
p.on('console', m => m.type() === 'error' && errori.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelector('#s-bilancia').scrollIntoView());
await p.waitForTimeout(900);

const leva = async (v) => {
  await p.evaluate(n => { const l = document.querySelector('#levaMix');
    l.value = n; l.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await p.waitForTimeout(400);
};

/* Dove sta il piatto: il baricentro verticale dei pixel chiari dentro
   una scatola stretta attorno al piatto.

   La prima versione cercava "la riga piu' bassa illuminata" e a
   sinistra leggeva 148 fisso qualunque cosa facesse la leva: sotto il
   piatto ci sono le candele sul banco, ed erano loro la riga piu'
   bassa. Il baricentro guarda solo dentro la scatola e non si fa
   ingannare da quello che c'e' sotto. */
const doveStaIlPiatto = (x, y, w, h) => p.evaluate(([x, y, w, h]) => {
  const cv = document.querySelector('#schermo'), K = cv.width / 320;
  const d = cv.getContext('2d').getImageData(x * K, y * K, w * K, h * K).data;
  const W = w * K;
  let somma = 0, peso = 0;
  for (let yy = 0; yy < h * K; yy++)
    for (let xx = 0; xx < W; xx++) {
      const i = (yy * W + xx) * 4;
      const l = 0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2];
      if (l > 140) { somma += yy; peso++; }
    }
  return peso ? +(y + somma / peso / K).toFixed(1) : null;
}, [x, y, w, h]);
const piattoMano = () => doveStaIlPiatto(86, 76, 46, 58);
const piattoMacchina = () => doveStaIlPiatto(186, 78, 48, 58);

const zona = (r) => p.evaluate(([x, y, w, h]) => {
  const cv = document.querySelector('#schermo'), k = cv.width / 320;
  return [...cv.getContext('2d').getImageData(x * k, y * k, w * k, h * k).data];
}, r);
const diversi = (a, c) => {
  let n = 0;
  for (let i = 0; i < a.length; i += 4)
    if (Math.max(Math.abs(a[i]-c[i]), Math.abs(a[i+1]-c[i+1]), Math.abs(a[i+2]-c[i+2])) > 12) n++;
  return n / (a.length / 4);
};

/* il muro e il banco devono restare dove sono */
const FERMO = [10, 140, 60, 34];

await leva(50);
const fermo0 = await zona(FERMO);

const letture = [];
for (const v of [0, 25, 50, 75, 100]) {
  await leva(v);
  letture.push([v, await piattoMano(), await piattoMacchina()]);
}
await leva(50);
const fermoFine = await zona(FERMO);

console.log('  leva   piatto mano   piatto macchina');
for (const [v, a, m] of letture)
  console.log(`  ${String(v).padStart(4)}%   ${String(a).padStart(9)}   ${String(m).padStart(13)}`);

const mano = letture.map(l => l[1]), mac = letture.map(l => l[2]);
const scendeMano = mano[0] - mano[4];        /* a leva 0 la mano pesa: sta piu' giu' */
const scendeMac = mac[4] - mac[0];
const restaFermo = diversi(fermo0, fermoFine);

console.log(`\n  il piatto della mano si alza di     ${scendeMano.toFixed(1)} unita' passando da 0 a 100`);
console.log(`  il piatto della macchina scende di  ${scendeMac.toFixed(1)}`);
console.log(`  il muro accanto cambia              ${(restaFermo * 100).toFixed(2)}%`);
console.log(`  errori: ${errori.length} ${errori.slice(0, 2).join(' | ')}`);

const bene = scendeMano > 3 && scendeMac > 3 && restaFermo < 0.005 && !errori.length;
console.log('\n' + (bene ? 'la bilancia segue la leva, e il resto sta fermo' : 'QUALCOSA NON TORNA'));
await b.close();
process.exit(bene ? 0 : 1);
