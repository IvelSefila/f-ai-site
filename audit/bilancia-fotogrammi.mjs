/* ═══════════════════════════════════════════════════════════════════
 * I FOTOGRAMMI DELLA BILANCIA
 *
 * La stadera deve inclinarsi seguendo la leva. Genero la stessa stanza
 * con la stadera in posizioni diverse, dando come riferimento
 * l'immagine gia' in uso: se non gliela do, ogni generazione rifa' la
 * stanza da capo e muovendo la leva salterebbe tutto, non la bilancia.
 *
 * uso: node audit/bilancia-fotogrammi.mjs <nome> <descrizione inclinazione>
 * ═══════════════════════════════════════════════════════════════════ */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { STILE } from './stanze-prompt.mjs';
const esegui = promisify(execFile);

const CMD = path.join(process.env.APPDATA || '', 'npm/node_modules/@higgsfield/cli/vendor/hf.exe');
const hf = (a) => esegui(CMD, a, { maxBuffer: 64 << 20 });

const [nome, inclinazione] = process.argv.slice(2);
const BASE = 'site/pixel/immagini/bilancia.png';

const prompt =
  'Keep this exact room, exact same stone vaulted chamber, exact same warm ' +
  'orange left half and cold blue right half, exact same candles, tables, ' +
  'flasks and books in exactly the same places, exact same wall bricks. ' +
  'Change ONE thing: the hanging brass balance scale. ' + inclinazione + ' ' +
  'The chains stay attached to the beam ends and to the pans, and stretch or ' +
  'shorten accordingly. Everything else in the frame is pixel-identical. ' + STILE;

const { stdout: costo } = await hf(['generate', 'cost', 'nano_banana_pro',
  '--prompt', prompt, '--aspect-ratio', '16:9', '--image', BASE]);
console.log(`${nome} · costo ${costo.trim().split('\n')[0]}`);

const { stdout } = await hf(['generate', 'create', 'nano_banana_pro',
  '--prompt', prompt, '--aspect-ratio', '16:9', '--image', BASE, '--wait', '--json']);
const dati = JSON.parse(stdout);
const url = (function trova(o) {
  if (typeof o === 'string' && /^https?:\/\/.*\.(png|jpg|jpeg|webp)/i.test(o)) return o;
  if (Array.isArray(o)) { for (const v of o) { const r = trova(v); if (r) return r; } return null; }
  if (o && typeof o === 'object') { for (const v of Object.values(o)) { const r = trova(v); if (r) return r; } return null; }
  return null;
})(dati);
if (!url) { console.error('nessuna immagine'); console.log(JSON.stringify(dati).slice(0, 900)); process.exit(1); }
const uscita = `site/pixel/immagini/bilancia-${nome}.png`;
fs.writeFileSync(uscita, Buffer.from(await (await fetch(url)).arrayBuffer()));
console.log('  scritto', uscita, `${(fs.statSync(uscita).size / 1024).toFixed(0)} KB`);
