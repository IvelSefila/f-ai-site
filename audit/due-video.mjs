/* ═══════════════════════════════════════════════════════════════════
 * DUE FILMATI BREVI INVECE DI UNO LUNGO
 *
 * Il primo tentativo era un filmato solo di otto secondi che doveva
 * fare tutta la corsa: giu' a sinistra, in piano, giu' a destra.
 * Non l'ha fatta. E' andato da piano a sinistra-giu' e poi e' tornato
 * indietro, e a meta' corsa la stanga era pure deformata — un video
 * lungo con un movimento composto lascia al modello troppo spazio per
 * inventare.
 *
 * Qui sono due filmati da quattro secondi, ognuno con UN movimento
 * solo e monotono, e tutti e due partono dallo stesso identico
 * fotogramma: la stadera in piano, presa dal filmato di prima. Cosi'
 * la stanza combacia fra i due, e la corsa completa si ottiene
 * mettendo il primo al contrario davanti al secondo.
 *
 * Dodici crediti l'uno.
 *
 * uso: node audit/due-video.mjs             (genera, scarica, spezza)
 *      node audit/due-video.mjs spezza      (solo i fotogrammi)
 * ═══════════════════════════════════════════════════════════════════ */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const esegui = promisify(execFile);

const CMD = path.join(process.env.APPDATA || '', 'npm/node_modules/@higgsfield/cli/vendor/hf.exe');
const hf = (a) => esegui(CMD, a, { maxBuffer: 128 << 20 });

const PIANO = 'audit/piano.png';
const FOTOGRAMMI = 'site/pixel/fotogrammi';
const PER_VERSO = 9;      /* fotogrammi per meta' corsa, estremo compreso */

const COMUNE =
  'Locked-off camera. No camera movement, no zoom, no pan, no parallax. ' +
  'The room is frozen: the stone walls, the arches, the two wooden tables, ' +
  'the flasks, the books, the candles and the fireplace do not move or ' +
  'change at all. ONLY the hanging brass balance scale moves. ' +
  'It keeps its exact shape: the beam stays one rigid solid brass bar of ' +
  'constant thickness, the two chains stay the same length, the two pans ' +
  'keep their contents. Nothing bends, stretches or deforms. ' +
  'The movement is slow, even and mechanical, in ONE direction only from ' +
  'the first frame to the last, with no bounce and no return. ' +
  '16-bit pixel art, flat straight-on front view, unchanged lighting.';

const VERSI = [
  ['mano', 'The beam tips steadily so that the LEFT pan — the one with the ' +
           'paintbrushes and the quill — sinks down, and the RIGHT pan with the ' +
           'gears rises by the same amount. By the end the beam is clearly ' +
           'tilted about twelve degrees, left side low.'],
  ['macchina', 'The beam tips steadily so that the RIGHT pan — the one with the ' +
           'gears and the glass lens — sinks down, and the LEFT pan with the ' +
           'brushes rises by the same amount. By the end the beam is clearly ' +
           'tilted about twelve degrees, right side low.'],
];

if (process.argv[2] !== 'spezza') {
  for (const [nome, moto] of VERSI) {
    const prompt = moto + ' ' + COMUNE;
    const { stdout: costo } = await hf(['generate', 'cost', 'seedance1_5',
      '--prompt', prompt, '--start-image', PIANO, '--duration', '4',
      '--resolution', '1080p', '--generate-audio=false']);
    console.log(`${nome} · ${costo.trim().split('\n')[0]}`);
    const { stdout } = await hf(['generate', 'create', 'seedance1_5',
      '--prompt', prompt, '--start-image', PIANO, '--duration', '4',
      '--resolution', '1080p', '--aspect-ratio', '16:9',
      '--generate-audio=false', '--wait', '--json']);
    const dati = JSON.parse(stdout);
    const url = (function trova(o) {
      if (typeof o === 'string' && /^https?:\/\/.*\.(mp4|webm|mov)/i.test(o)) return o;
      if (Array.isArray(o)) { for (const v of o) { const r = trova(v); if (r) return r; } return null; }
      if (o && typeof o === 'object') { for (const v of Object.values(o)) { const r = trova(v); if (r) return r; } return null; }
      return null;
    })(dati);
    if (!url) { console.error('nessun video per', nome); process.exit(1); }
    fs.writeFileSync(`audit/video-${nome}.mp4`, Buffer.from(await (await fetch(url)).arrayBuffer()));
    console.log(`  scaricato audit/video-${nome}.mp4`);
  }
}

/* ── spezzare ─────────────────────────────────────────────────────
   Qui ho sbagliato una volta, e vale la pena scriverlo. Come immagine
   di partenza dei due filmati avevo preso il fotogramma di mezzo del
   filmato precedente, DANDO PER SCONTATO che il mezzo fosse la posa in
   piano. Non lo era: era gia' inclinata. Cosi' entrambi i filmati
   partono da stadera-a-destra-giu', e mettendoli in fila come avevo
   previsto veniva fuori una corsa che andava avanti e indietro.

   Guardando i capi dei due filmati (audit/capi-video.mjs) si vede che
   quello chiamato "macchina" fa da solo la corsa intera: parte con il
   piatto destro giu' e finisce con il sinistro giu', passando per il
   piano. E' quello che serviva, e basta lui.

   Nell'ordine in cui esce: il filmato parte con il piatto sinistro giu'
   e finisce col destro giu', e la leva a zero vuol dire tutta mano,
   che e' il piatto di sinistra. Ci avevo messo un .reverse() ragionando
   sul nome del filmato invece che su cosa c'e' dentro, e la bilancia
   veniva al contrario — misurato con audit/angolo-stanga.mjs, che
   guarda l'altezza dei due capi della stanga e non si presta a
   interpretazioni. */
const QUANTE = 17;
fs.rmSync(FOTOGRAMMI, { recursive: true, force: true });
fs.mkdirSync(FOTOGRAMMI, { recursive: true });

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage();
await p.goto('about:blank');

const dati = fs.readFileSync('audit/video-macchina.mp4').toString('base64');
const durata = await p.evaluate(async (d) => {
  const v = document.createElement('video');
  v.src = 'data:video/mp4;base64,' + d; v.muted = true;
  await new Promise(r => { v.onloadedmetadata = r; });
  window.__v = v;
  return v.duration;
}, dati);

const pose = [];
for (let i = 0; i < QUANTE; i++) {
  const t = 0.05 + (durata - 0.25) * (i / (QUANTE - 1));
  pose.push(await p.evaluate(async (t) => {
    const v = window.__v;
    await new Promise(r => { v.onseeked = r; v.currentTime = t; });
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    return c.toDataURL('image/png').split(',')[1];
  }, t));
}
await b.close();

pose.forEach((png, i) =>
  fs.writeFileSync(path.join(FOTOGRAMMI, `bilancia-${String(i).padStart(2, '0')}.png`),
                   Buffer.from(png, 'base64')));
console.log(`${pose.length} pose in fila dentro ${FOTOGRAMMI}/`);
