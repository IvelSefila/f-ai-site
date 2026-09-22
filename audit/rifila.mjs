/* ═══════════════════════════════════════════════════════════════════
 * VIA LE FASCE VUOTE DAI BORDI
 *
 * Il generatore ogni tanto lascia una striscia piatta su un bordo —
 * nella bilancia una fascia color crema alta un ottavo, che nel gioco
 * sarebbe un pavimento di cartone. Qui la trovo e la taglio: scorro le
 * righe dal bordo verso il centro e finche' una riga e' tutta dello
 * stesso colore (o quasi) la butto.
 *
 * Taglio e basta: non riscalo. Ci pensa la quantizzazione a riportare
 * tutto a 960x540, e un ritaglio dal 16:9 resta abbastanza vicino da
 * non deformare niente di visibile.
 *
 * uso: node audit/rifila.mjs site/pixel/immagini/bilancia.png [...]
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';
import fs from 'fs';

const file = process.argv.slice(2);
if (!file.length) { console.error('quale immagine?'); process.exit(1); }

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage();
await p.goto('about:blank');

for (const f of file) {
  const dati = fs.readFileSync(f).toString('base64');
  const r = await p.evaluate(async (dati) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + dati;
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height).data;

    /* quanto varia una riga: se sta sotto la soglia e' una fascia */
    const piatta = (y) => {
      let min = [255, 255, 255], max = [0, 0, 0];
      /* Salto il cinque per cento ai lati: quasi ogni immagine ha uno
         o due pixel scuri sul bordo estremo, e bastavano a far sembrare
         "variata" una fascia di crema piatta. La fascia della bilancia
         non veniva vista per questo. */
      const m = Math.round(cv.width * 0.05);
      for (let x = m; x < cv.width - m; x += 3) {
        const k = (y * cv.width + x) * 4;
        for (let c = 0; c < 3; c++) {
          if (d[k + c] < min[c]) min[c] = d[k + c];
          if (d[k + c] > max[c]) max[c] = d[k + c];
        }
      }
      return Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) < 14;
    };

    /* Solo fino a un quarto per lato: oltre non e' piu' un difetto del
       generatore ma il disegno, e un cielo notturno uniforme non va
       tagliato via. */
    const tetto = Math.floor(cv.height / 4);
    let alto = 0; while (alto < tetto && piatta(alto)) alto++;
    let basso = 0; while (basso < tetto && piatta(cv.height - 1 - basso)) basso++;

    if (!alto && !basso) return { alto: 0, basso: 0, dati: null, w: cv.width, h: cv.height };

    const nh = cv.height - alto - basso;
    const out = document.createElement('canvas');
    out.width = cv.width; out.height = nh;
    out.getContext('2d').drawImage(cv, 0, alto, cv.width, nh, 0, 0, cv.width, nh);
    return { alto, basso, dati: out.toDataURL('image/png').split(',')[1], w: cv.width, h: nh };
  }, dati);

  if (!r.dati) { console.log(`${f}: niente da rifilare (${r.w}x${r.h})`); continue; }
  fs.writeFileSync(f, Buffer.from(r.dati, 'base64'));
  console.log(`${f}: tolti ${r.alto} in alto e ${r.basso} in basso → ${r.w}x${r.h}`);
}
await b.close();
