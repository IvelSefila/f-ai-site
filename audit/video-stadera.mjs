/* ═══════════════════════════════════════════════════════════════════
 * UN VIDEO DELLA BILANCIA, POI SPEZZATO IN FOTOGRAMMI
 *
 * Spostare i pezzi del fondale funziona ma si vede che e' un trucco:
 * i bordi delle toppe scattano. La strada giusta e' quella che mi e'
 * stata indicata — fotogrammi veri, e correlati fra loro.
 *
 * Perche' un video e non tante immagini: generando immagini separate
 * ognuna ridisegna la stanza da capo (misurato: l'8,2% del quadro
 * cambia forte fuori dalla stadera). Un video invece e' fatto apposta
 * per essere coerente da un fotogramma al successivo — e' la sua
 * ragione di esistere. E l'immagine di partenza ancora la stanza a
 * quella che c'e' gia' nel sito.
 *
 * Otto secondi a 1080p, una passata sola: la stadera va giu' a
 * sinistra, torna in piano, va giu' a destra. Quella e' la corsa
 * completa della leva.
 *
 * uso: node audit/video-stadera.mjs            (genera e scarica)
 *      node audit/video-stadera.mjs spezza     (solo i fotogrammi)
 * ═══════════════════════════════════════════════════════════════════ */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const esegui = promisify(execFile);

const CMD = path.join(process.env.APPDATA || '', 'npm/node_modules/@higgsfield/cli/vendor/hf.exe');
const hf = (a) => esegui(CMD, a, { maxBuffer: 128 << 20 });

const BASE = 'site/pixel/immagini/bilancia.png';
const VIDEO = 'audit/video-bilancia.mp4';
const FOTOGRAMMI = 'site/pixel/fotogrammi';
const QUANTI = 17;          /* dispari, cosi' uno cade esattamente in mezzo */

const PROMPT =
  'Locked-off camera, absolutely no camera movement, no zoom, no pan. ' +
  'The room and everything in it stays exactly where it is: the stone walls, ' +
  'the arches, the wooden tables, the flasks, the books, the candles, the ' +
  'fireplace — all perfectly still and unchanged. ' +
  'ONLY the hanging brass balance scale moves. It tips slowly and smoothly, ' +
  'like a real balance settling: first the LEFT pan (with the brushes and ' +
  'quill) sinks down while the RIGHT pan (with the gears and lens) rises; ' +
  'then it returns through perfectly level; then the RIGHT pan sinks down ' +
  'while the LEFT pan rises. One single slow continuous sweep across the ' +
  'whole clip, no bouncing, no oscillation at the ends. The chains stay ' +
  'attached to the beam ends and to the pans throughout. ' +
  'The art style never changes: 16-bit pixel art, crisp chunky pixels, ' +
  'flat straight-on front view, no lighting changes, no new elements.';

if (process.argv[2] !== 'spezza') {
  const args = ['generate', 'create', 'seedance1_5', '--prompt', PROMPT,
    '--start-image', BASE, '--duration', '8', '--resolution', '1080p',
    '--aspect-ratio', '16:9', '--generate-audio=false', '--wait', '--json'];
  const { stdout: costo } = await hf(['generate', 'cost', 'seedance1_5', '--prompt', PROMPT,
    '--start-image', BASE, '--duration', '8', '--resolution', '1080p',
    '--generate-audio=false']);
  console.log('costo:', costo.trim().split('\n')[0]);

  const { stdout } = await hf(args);
  const dati = JSON.parse(stdout);
  const url = (function trova(o) {
    if (typeof o === 'string' && /^https?:\/\/.*\.(mp4|webm|mov)/i.test(o)) return o;
    if (Array.isArray(o)) { for (const v of o) { const r = trova(v); if (r) return r; } return null; }
    if (o && typeof o === 'object') { for (const v of Object.values(o)) { const r = trova(v); if (r) return r; } return null; }
    return null;
  })(dati);
  if (!url) { console.error('nessun video nella risposta'); console.log(JSON.stringify(dati).slice(0, 1200)); process.exit(1); }
  fs.writeFileSync(VIDEO, Buffer.from(await (await fetch(url)).arrayBuffer()));
  console.log('scaricato', VIDEO, `${(fs.statSync(VIDEO).size / 1024 / 1024).toFixed(1)} MB`);
}

/* ── spezzare il video ────────────────────────────────────────────
   Senza aggiungere ffmpeg al progetto: il browser che uso gia' per
   tutto il resto sa aprire un mp4, andare a un istante preciso e
   disegnare quel fotogramma su una tela. */
if (!fs.existsSync(VIDEO)) { console.error('manca', VIDEO); process.exit(1); }
fs.mkdirSync(FOTOGRAMMI, { recursive: true });

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage();
await p.goto('about:blank');
const dati = fs.readFileSync(VIDEO).toString('base64');

const info = await p.evaluate(async (d) => {
  const v = document.createElement('video');
  v.src = 'data:video/mp4;base64,' + d;
  v.muted = true;
  await new Promise(r => { v.onloadedmetadata = r; });
  window.__v = v;
  return { durata: v.duration, w: v.videoWidth, h: v.videoHeight };
}, dati);
console.log(`video ${info.w}×${info.h} · ${info.durata.toFixed(1)}s`);

for (let i = 0; i < QUANTI; i++) {
  /* sto lontano dai due estremi: il primo e l'ultimo fotogramma di un
     video generato spesso sono i piu' sporchi */
  const t = 0.15 + (info.durata - 0.35) * (i / (QUANTI - 1));
  const png = await p.evaluate(async (t) => {
    const v = window.__v;
    await new Promise(r => { v.onseeked = r; v.currentTime = t; });
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    return c.toDataURL('image/png').split(',')[1];
  }, t);
  const f = path.join(FOTOGRAMMI, `bilancia-${String(i).padStart(2, '0')}.png`);
  fs.writeFileSync(f, Buffer.from(png, 'base64'));
}
await b.close();
console.log(`spezzato in ${QUANTI} fotogrammi dentro ${FOTOGRAMMI}/`);
