/* Rimette un'immagine al sedici noni allungando in basso l'ultima riga.
   Serve alla materia: li' la fascia in fondo non era un difetto ma il
   buio sotto il ripiano di pietra, e toglierla schiacciava la cupola
   del tredici per cento quando la quantizzazione riporta a 960x540. */
import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage(); await p.goto('about:blank');
for (const f of process.argv.slice(2)) {
  const r = await p.evaluate(async d => {
    const i = new Image(); i.src = 'data:image/png;base64,' + d; await i.decode();
    const alto = Math.round(i.width * 9 / 16);
    if (Math.abs(alto - i.height) < 3) return null;
    const c = document.createElement('canvas'); c.width = i.width; c.height = alto;
    const g = c.getContext('2d');
    g.drawImage(i, 0, 0);
    /* l'ultima riga, stirata fino in fondo */
    if (alto > i.height) g.drawImage(i, 0, i.height - 1, i.width, 1, 0, i.height, i.width, alto - i.height);
    return { w: i.width, prima: i.height, dopo: alto, dati: c.toDataURL('image/png').split(',')[1] };
  }, fs.readFileSync(f).toString('base64'));
  if (!r) { console.log(f + ': gia\' al sedici noni'); continue; }
  fs.writeFileSync(f, Buffer.from(r.dati, 'base64'));
  console.log(`${f}: ${r.w}x${r.prima} → ${r.w}x${r.dopo}`);
}
await b.close();
