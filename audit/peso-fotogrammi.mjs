/* ═══════════════════════════════════════════════════════════════════
 * QUANTO PESEREBBERO I FOTOGRAMMI VERI
 *
 * I fotogrammi del video sono coerenti — fuori dalla bilancia il quadro
 * si sposta di 3,5 su 255, contro il 51 delle immagini generate una per
 * una. Quindi si puo' tenere la stanza una volta sola e di ogni
 * fotogramma salvare solo la bilancia.
 *
 * Qui misuro quanto costa, in tre modi diversi, perche' la scelta si fa
 * sui numeri e non sull'intuito:
 *
 *  1 · il fotogramma intero
 *  2 · solo il rettangolo della bilancia
 *  3 · solo i pixel che dentro quel rettangolo differiscono dal
 *      fotogramma di riposo (gli altri li da' la stanza)
 *
 * uso: node audit/peso-fotogrammi.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { rimappa } from './rimappa.mjs';

const CARTELLA = 'site/pixel/fotogrammi';
const LARGO = 960, ALTO = 540, K = 3;
/* la scatola della bilancia, in coordinate logiche, presa dal ritaglio */
const BOX = [74, 22, 172, 122];

const tav = fs.readFileSync('site/pixel/tavolozza.js', 'utf8');
const PIGMENTI = [...tav.matchAll(/\['(#[0-9a-f]{6})',\s*'([^']+)'/g)].map(m => m[1]);

const file = fs.readdirSync(CARTELLA).filter(f => f.endsWith('.png')).sort();
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage();
await p.goto('about:blank');

/* Il fotogramma di riposo — quello in mezzo, con la stanga in piano —
   si rimappa per primo e senza riferimento: e' lui la stanza. Tutti
   gli altri lo prendono come riferimento, cosi' dove non si muove
   niente restano identici a lui byte per byte. */
const mezzo = Math.floor(file.length / 2);
const leggi = (f) => fs.readFileSync(path.join(CARTELLA, f)).toString('base64');
const base = await rimappa(p, leggi(file[mezzo]), { PIGMENTI, LARGO, ALTO });
const TOLL = +(process.argv[2] || 46);
const indici = [];
for (const f of file) {
  indici.push(await rimappa(p, leggi(f), { PIGMENTI, LARGO, ALTO, riferimento: base, tolleranza: TOLL }));
  process.stdout.write('.');
}
await b.close();
console.log('');

const stretto = (buf) => zlib.deflateRawSync(Buffer.from(buf), { level: 9 }).length;
const [BX, BY, BW, BH] = BOX;
const rx = BX * K, ry = BY * K, rw = BW * K, rh = BH * K;
const riposo = base;      /* la stanza: il fotogramma con la stanga in piano */

let interi = 0, scatole = 0, mascherati = 0, cambiati = 0;
for (const a of indici) {
  interi += stretto(a);
  const scat = Buffer.alloc(rw * rh);
  const masc = Buffer.alloc(rw * rh, 255);
  for (let j = 0; j < rh; j++)
    for (let i = 0; i < rw; i++) {
      const k = (ry + j) * LARGO + rx + i;
      scat[j * rw + i] = a[k];
      if (a[k] !== riposo[k]) { masc[j * rw + i] = a[k]; cambiati++; }
    }
  scatole += stretto(scat);
  mascherati += stretto(masc);
}

const n = indici.length;
const kb = (v) => (v / 1024).toFixed(0) + ' KB';
console.log(`tolleranza ${TOLL} · ${n} fotogrammi · la scatola della bilancia e' ${BW}×${BH} logici (${rw}×${rh} veri)`);
console.log(`  1 · fotogrammi interi        ${kb(interi)}  (${kb(interi / n)} l'uno)`);
console.log(`  2 · solo la scatola          ${kb(scatole)}  (${kb(scatole / n)} l'uno)`);
console.log(`  3 · solo i pixel che cambiano ${kb(mascherati)}  (${kb(mascherati / n)} l'uno)`);
console.log(`      dentro la scatola cambia il ${(cambiati / (n * rw * rh) * 100).toFixed(0)}% dei pixel`);
console.log(`\nil sito adesso pesa 1,15 MB sul filo`);
