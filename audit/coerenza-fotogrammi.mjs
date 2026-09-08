/* ═══════════════════════════════════════════════════════════════════
 * I FOTOGRAMMI SONO COERENTI FRA LORO?
 *
 * E' la domanda che decide tutto. Se fra un fotogramma e l'altro si
 * muove solo la bilancia, allora posso tenere il fondale una volta
 * sola e di ogni fotogramma salvare il pezzetto che cambia: leggero, e
 * la stanza non balla mentre si sposta la leva.
 *
 * Se invece si muove tutto — com'era generando immagini separate, dove
 * l'8,2% del quadro cambiava forte — allora servono fotogrammi interi,
 * e diciassette fotogrammi interi non stanno in un sito.
 *
 * Misuro due cose:
 *  · dove sta il movimento, cioe' la scatola che contiene tutti i
 *    pixel che cambiano in tutta la sequenza;
 *  · quanto si muove il quadro FUORI da quella scatola, che e' il
 *    ballo che si vedrebbe.
 *
 * uso: node audit/coerenza-fotogrammi.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const CARTELLA = 'site/pixel/fotogrammi';
const file = fs.readdirSync(CARTELLA).filter(f => f.endsWith('.png')).sort();
if (file.length < 2) { console.error('servono almeno due fotogrammi'); process.exit(1); }

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage();
await p.goto('about:blank');

/* li porto tutti alla misura del fotogramma di gioco: e' li' che
   conta la differenza, non a 1920 */
const LARGO = 960, ALTO = 540;
const grigi = [];
for (const f of file) {
  const d = fs.readFileSync(path.join(CARTELLA, f)).toString('base64');
  grigi.push(await p.evaluate(async ([d, W, H]) => {
    const i = new Image(); i.src = 'data:image/png;base64,' + d; await i.decode();
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(i, 0, 0, W, H);
    const px = g.getImageData(0, 0, W, H).data;
    const out = new Array(W * H);
    for (let k = 0, j = 0; k < px.length; k += 4, j++)
      out[j] = 0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2];
    return out;
  }, [d, LARGO, ALTO]));
}
await b.close();

/* La scatola del movimento. La soglia va tenuta alta: a 26 il retino
   che respira in tutto il quadro faceva risultare "in movimento" il
   28,5% dei pixel e la scatola veniva grande quanto la stanza. Le
   differenze forti fuori dalla bilancia erano gia' lo 0,00%, quindi il
   movimento vero e' solo dove il salto e' netto. */
const SOGLIA = 55;
let x0 = LARGO, y0 = ALTO, x1 = 0, y1 = 0;
const mosso = new Uint8Array(LARGO * ALTO);
for (let k = 1; k < grigi.length; k++)
  for (let i = 0; i < mosso.length; i++)
    if (Math.abs(grigi[k][i] - grigi[0][i]) > SOGLIA) mosso[i] = 1;
for (let y = 0; y < ALTO; y++)
  for (let x = 0; x < LARGO; x++)
    if (mosso[y * LARGO + x]) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
const quantiMossi = mosso.reduce((s, v) => s + v, 0);

console.log(`${file.length} fotogrammi a ${LARGO}×${ALTO}`);
console.log(`la scatola del movimento: ${x0},${y0} → ${x1},${y1}  (${x1-x0+1}×${y1-y0+1} pixel veri` +
            `, ${Math.round((x1-x0+1)/3)}×${Math.round((y1-y0+1)/3)} logici)`);
console.log(`pixel che si muovono: ${quantiMossi} (${(quantiMossi / mosso.length * 100).toFixed(1)}% del quadro)`);

/* il ballo fuori dalla scatola, fotogramma per fotogramma */
console.log('\nfuori dalla scatola, rispetto al primo fotogramma:');
let peggio = 0;
for (let k = 1; k < grigi.length; k++) {
  let somma = 0, n = 0, forti = 0;
  for (let y = 0; y < ALTO; y++)
    for (let x = 0; x < LARGO; x++) {
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) continue;
      const d = Math.abs(grigi[k][y * LARGO + x] - grigi[0][y * LARGO + x]);
      somma += d; n++;
      if (d > 40) forti++;
    }
  const media = somma / n, pf = forti / n * 100;
  if (media > peggio) peggio = media;
  if (k % 4 === 0 || k === grigi.length - 1)
    console.log(`  fotogramma ${String(k).padStart(2)} · scarto medio ${media.toFixed(1)} · forti ${pf.toFixed(2)}%`);
}
console.log(`\nballo massimo fuori dalla scatola: ${peggio.toFixed(1)} su 255`);
console.log(peggio < 6
  ? 'coerenti: si muove la bilancia e basta'
  : 'NON coerenti: si muove anche il resto, e si vedrebbe');
