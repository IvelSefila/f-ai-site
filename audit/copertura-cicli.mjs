/* ═══════════════════════════════════════════════════════════════════
 * I CICLI TOCCANO DAVVERO QUALCOSA?
 *
 * Un ciclo di tavolozza su una zona dove i suoi pigmenti non ci sono
 * non fa niente, e non se ne accorge nessuno: nessun errore, nessun
 * avviso, solo una fiamma che resta ferma. Il contrario e' peggio —
 * ciclare un pigmento che li' appartiene al muro fa lampeggiare il
 * muro, ed e' proprio quello che mi era successo alla prima prova
 * sulla forgia.
 *
 * Qui, per ogni zona che voglio animare, conto quanti pixel finiranno
 * davvero nel ciclo. Sotto il 6 per cento la zona e' sbagliata o e'
 * troppo larga; sopra il 55 per cento sto ciclando il fondo e non la
 * luce.
 *
 * uso: node audit/copertura-cicli.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import fs from 'fs';
import zlib from 'zlib';

const src = fs.readFileSync('site/pixel/sfondi.js', 'utf8');
const fondali = {};
for (const m of src.matchAll(/^  ([a-z]+): '([^']+)',/gm))
  fondali[m[1]] = zlib.inflateRawSync(Buffer.from(m[2], 'base64'));

/* le rampe, lette dal file vero per non tenerne due copie */
const tav = fs.readFileSync('site/pixel/tavolozza.js', 'utf8');
const blocco = /export const CICLI = \{([\s\S]*?)\n\};/.exec(tav)[1];
const CICLI = {};
for (const m of blocco.matchAll(/^\s*([a-z]+):\s*(\[\[[\d,\s\[\]]*\]),/gm))
  CICLI[m[1]] = JSON.parse(m[2]);

/* le zone da animare, in coordinate logiche */
const ZONE = [
  ['soglia',      'luna a sinistra',  50, 24, 58, 52, 'chiaro'],
  ['soglia',      'luna a destra',   220, 14, 58, 52, 'chiaro'],
  ['soglia',      'finestra torre',  203, 56, 16, 26, 'fiamma'],
  ['bilancia',    'braciere a sinistra', 0, 104, 22, 56, 'fuoco'],
  ['bilancia',    'candele sul banco', 44, 116, 34, 22, 'fiamma'],
  ['scriptorium', 'candele del muro',  0,  20, 320, 34, 'fiamma'],
  ['banchi',      'lanterne appese',   0,  30, 320, 30, 'fiamma'],
  ['forgia',      'la fornace',       30,  62, 34, 48, 'fuoco'],
  ['materia',     'la nebulosa',      68,  26, 168, 76, 'polvere'],
  ['materia',     'braciere sinistro', 56, 100, 26, 24, 'verde'],
  ['materia',     'braciere destro',  238, 100, 26, 24, 'verde'],
  ['scheda',      'la candela',       34,  76, 24, 26, 'fiamma'],
  ['scheda',      'la lucerna',      256,  82, 26, 26, 'fiamma'],
  ['alchimista',  'la candela',      118,  54, 18, 28, 'fiamma'],
  ['alchimista',  "l'ampolla",       144,  86, 34, 32, 'verde'],
];

const K = 3, LARGO = 960;
let male = 0;
for (const [stanza, cosa, X, Y, W, H, ciclo] of ZONE) {
  const a = fondali[stanza];
  if (!a) { console.log(`  ?? ${stanza} non trovato`); male++; continue; }
  const dentro = new Set(CICLI[ciclo].flat());
  let tocca = 0, tot = 0;
  for (let y = Y * K; y < (Y + H) * K; y++)
    for (let x = X * K; x < (X + W) * K; x++) { if (dentro.has(a[y * LARGO + x])) tocca++; tot++; }
  const q = tocca / tot;
  const bene = q >= 0.06 && q <= 0.55;
  if (!bene) male++;
  console.log(`  ${bene ? 'ok ' : 'NO '} ${(stanza + ' · ' + cosa).padEnd(32)} ` +
              `${ciclo.padEnd(8)} ${(q * 100).toFixed(1)}% dei pixel`);
}
console.log(male ? `\n${male}/${ZONE.length} zone da correggere`
                 : `\ntutte e ${ZONE.length} le zone ciclano su pixel che ci sono`);
