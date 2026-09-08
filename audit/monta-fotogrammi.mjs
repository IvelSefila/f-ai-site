/* ═══════════════════════════════════════════════════════════════════
 * I FOTOGRAMMI DEL VIDEO, MONTATI SUL SITO
 *
 * Il video della bilancia (Higgsfield, Seedance 1.5 Pro, 8 secondi a
 * 1080p) e' stato spezzato in fotogrammi da audit/video-stadera.mjs.
 * Qui diventano quello che il sito puo' usare.
 *
 * Come sono tenuti:
 *  · il fotogramma di mezzo — la stadera in piano — e' la stanza, e si
 *    salva intero. Sostituisce il vecchio fondale della bilancia,
 *    cosi' i fotogrammi combaciano con lui esattamente.
 *  · gli altri sedici salvano solo il rettangolo della bilancia, e
 *    dentro quel rettangolo solo i pixel diversi dalla stanza. 255
 *    vuol dire "lascia stare quello che c'e'".
 *
 * Due cose rendono possibile tutto questo, e sono state misurate:
 *  · i fotogrammi di un VIDEO sono coerenti fra loro (scarto medio 3,5
 *    su 255 fuori dalla bilancia) mentre immagini generate una per una
 *    non lo sono (51, con l'8,2% del quadro che cambia forte);
 *  · il retino ORDINATO e' ripetibile, quello a diffusione d'errore no.
 *    Con l'isteresi — un pixel tiene il pigmento della stanza se il
 *    colore nuovo gli e' ancora vicino — dentro il rettangolo cambia
 *    il 27% dei pixel invece del 73%.
 *
 * uso: node audit/monta-fotogrammi.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { rimappa } from './rimappa.mjs';

const RADICE = 'site/pixel';
const CARTELLA = path.join(RADICE, 'fotogrammi');
const FUORI = path.join(RADICE, 'fotogrammi.js');
const LARGO = 960, ALTO = 540, K = 3;
const BOX = [74, 22, 172, 122];          /* la bilancia, in logiche */
const TOLLERANZA = 70;

const tav = fs.readFileSync(path.join(RADICE, 'tavolozza.js'), 'utf8');
const PIGMENTI = [...tav.matchAll(/\['(#[0-9a-f]{6})',\s*'([^']+)'/g)].map(m => m[1]);

const file = fs.readdirSync(CARTELLA).filter(f => f.endsWith('.png')).sort();
if (!file.length) { console.error('nessun fotogramma in', CARTELLA); process.exit(1); }

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage();
await p.goto('about:blank');
const leggi = (f) => fs.readFileSync(path.join(CARTELLA, f)).toString('base64');

const mezzo = Math.floor(file.length / 2);
const stanza = await rimappa(p, leggi(file[mezzo]), { PIGMENTI, LARGO, ALTO });
console.log(`stanza: ${file[mezzo]}`);

const [BX, BY, BW, BH] = BOX;
const rx = BX * K, ry = BY * K, rw = BW * K, rh = BH * K;
const toppe = [];
for (const f of file) {
  const a = await rimappa(p, leggi(f), { PIGMENTI, LARGO, ALTO, riferimento: stanza, tolleranza: TOLLERANZA });
  const t = Buffer.alloc(rw * rh, 255);
  let n = 0;
  for (let j = 0; j < rh; j++)
    for (let i = 0; i < rw; i++) {
      const k = (ry + j) * LARGO + rx + i;
      if (a[k] !== stanza[k]) { t[j * rw + i] = a[k]; n++; }
    }
  toppe.push({ dati: zlib.deflateRawSync(t, { level: 9 }), n });
  process.stdout.write('.');
}
await b.close();
console.log('');

const stanzaStretta = zlib.deflateRawSync(Buffer.from(stanza), { level: 9 });
const peso = stanzaStretta.length + toppe.reduce((s, t) => s + t.dati.length, 0);

fs.writeFileSync(FUORI, `/* ═══════════════════════════════════════════════════════════════════
 * I FOTOGRAMMI DELLA BILANCIA
 *
 * Presi da un video vero (Higgsfield, Seedance 1.5 Pro, 8 secondi a
 * 1080p), non da immagini generate una per una: quelle ridisegnavano
 * tutta la stanza e muovendo la leva si sarebbe visto ballare il muro
 * — misurato, l'8,2% del quadro cambiava forte. I fotogrammi di un
 * video sono coerenti per costruzione: fuori dalla bilancia lo scarto
 * medio e' 3,5 su 255 e le differenze forti sono lo 0,00%.
 *
 * STANZA e' il fotogramma con la stadera in piano, intero. TOPPE sono
 * gli altri: solo il rettangolo della bilancia, e li' dentro solo i
 * pixel diversi dalla stanza. 255 vuol dire "lascia stare".
 *
 * Rigenerabili con:  node audit/monta-fotogrammi.mjs
 * ═══════════════════════════════════════════════════════════════════ */

export const RIQUADRO = { x: ${BX}, y: ${BY}, w: ${BW}, h: ${BH} };
export const QUANTI = ${file.length};

const STANZA = '${stanzaStretta.toString('base64')}';
const TOPPE = [
${toppe.map(t => `  '${t.dati.toString('base64')}',`).join('\n')}
];

function daBase64(b) {
  const bin = atob(b);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}
async function apri(b64) {
  const flusso = new Blob([daBase64(b64)]).stream()
    .pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(flusso).arrayBuffer());
}

let stanza = null;
const toppe = new Array(QUANTI).fill(null);
export function stanzaBilancia() { return stanza; }
export function toppaBilancia(i) { return toppe[Math.max(0, Math.min(QUANTI - 1, i))]; }

/* Si aprono per strada come i fondali: la stanza per prima, cosi' la
   bilancia si vede subito, poi le pose una alla volta. Finche' una
   posa non e' pronta si usa la piu' vicina che lo e'. */
export async function scongelaBilancia(quando) {
  try {
    stanza = await apri(STANZA);
    if (quando) quando();
    /* dal mezzo verso i bordi: le pose centrali servono per prime */
    const mezzo = QUANTI >> 1;
    const ordine = [mezzo];
    for (let d = 1; d <= mezzo; d++) { ordine.push(mezzo - d, mezzo + d); }
    for (const i of ordine) {
      if (i < 0 || i >= QUANTI || toppe[i]) continue;
      toppe[i] = await apri(TOPPE[i]);
      if (quando) quando();
      await new Promise(r => setTimeout(r, 0));
    }
  } catch (e) {
    console.warn('fotogrammi della bilancia non aperti:', e.message);
  }
}

/* la posa piu' vicina che sia gia' pronta */
export function posaPronta(i) {
  for (let d = 0; d < QUANTI; d++) {
    if (toppe[i - d]) return toppe[i - d];
    if (toppe[i + d]) return toppe[i + d];
  }
  return null;
}
`);

console.log(`${file.length} pose · riquadro ${BW}×${BH} logici`);
console.log(`  la stanza    ${(stanzaStretta.length / 1024).toFixed(0)} KB`);
console.log(`  le sedici pose ${((peso - stanzaStretta.length) / 1024).toFixed(0)} KB`);
console.log(`  in tutto     ${(peso / 1024).toFixed(0)} KB`);
console.log(`scritto ${FUORI} · ${(fs.statSync(FUORI).size / 1024).toFixed(0)} KB sul disco`);
