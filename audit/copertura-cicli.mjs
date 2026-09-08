/* ═══════════════════════════════════════════════════════════════════
 * I CICLI TOCCANO DAVVERO QUALCOSA?
 *
 * Un ciclo di tavolozza su una zona dove i suoi pigmenti non ci sono
 * non fa niente, e non lo dice nessuno: nessun errore, nessun avviso,
 * solo una fiamma che resta ferma. L'alone della luna era cosi' —
 * ciclavo il lapislazzuli e li' c'era indaco.
 *
 * Questa prova non dice se la luce si vede bene: quello lo dice
 * luci-si-muovono.mjs, che guarda il quadro vero. Questa dice quanti
 * pixel il ciclo ha in mano, ed e' il numero che serve quando una luce
 * si muove poco e non si capisce se sbaglia la rampa o la scatola.
 *
 * Le zone le legge dalle stanze invece di tenerne una copia: una copia
 * a mano invecchia senza dirlo, e infatti era gia' invecchiata —
 * cercava una rampa che nel frattempo aveva cambiato nome.
 *
 * uso: node audit/copertura-cicli.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import fs from 'fs';
import zlib from 'zlib';

const LARGO = 960, K = 3;

/* i fondali. Le chiavi sono virgolettate da quando un nome col
   trattino aveva prodotto un file che JavaScript non sapeva leggere. */
const src = fs.readFileSync('site/pixel/sfondi.js', 'utf8');
const fondali = {};
for (const m of src.matchAll(/^ +'?([a-z-]+)'?: '([^']+)',/gm))
  fondali[m[1]] = zlib.inflateRawSync(Buffer.from(m[2], 'base64'));

/* La bilancia non sta piu' fra i fondali: la sua stanza e' la posa in
   piano del video, e vive in fotogrammi.js. Senza questo lo script
   diceva "fondale mancante" e sembrava che due luci fossero rotte. */
try {
  const f = fs.readFileSync('site/pixel/fotogrammi.js', 'utf8');
  const m = /const STANZA = '([^']+)'/.exec(f);
  if (m) fondali.bilancia = zlib.inflateRawSync(Buffer.from(m[1], 'base64'));
} catch { /* se non c'e', la bilancia risultera' mancante e si vedra' */ }

/* le rampe */
const tav = fs.readFileSync('site/pixel/tavolozza.js', 'utf8');
const CICLI = {};
for (const m of /export const CICLI = \{([\s\S]*?)\n\};/.exec(tav)[1]
                  .matchAll(/^ *([a-z]+): *(\[\[.*?\]\]),/gm))
  CICLI[m[1]] = JSON.parse(m[2]);

/* le zone, prese dalle stanze riga per riga */
const stanze = fs.readFileSync('site/pixel/stanze.js', 'utf8');
const ZONE = [];
let stanza = null;
for (const riga of stanze.split(/\r?\n/)) {
  const s = /^ +id: '([a-z]+)'/.exec(riga) || /^ +id: "([a-z]+)"/.exec(riga);
  if (s) stanza = s[1];
  for (const m of riga.matchAll(
    /\[ *(-?[\d.]+), *(-?[\d.]+), *(-?[\d.]+), *(-?[\d.]+), *CICLI\.([a-z]+)/g))
    if (stanza) ZONE.push([stanza, +m[1], +m[2], +m[3], +m[4], m[5]]);
}
if (!ZONE.length) { console.error('nessuna zona trovata in stanze.js'); process.exit(1); }

let male = 0;
for (const [id, X, Y, W, H, ciclo] of ZONE) {
  const a = fondali[id];
  const rampa = CICLI[ciclo];
  if (!a) { console.log(`  ?? ${id}: fondale mancante`); male++; continue; }
  if (!rampa) { console.log(`  ?? ${id}: rampa "${ciclo}" sconosciuta`); male++; continue; }
  const dentro = new Set(rampa.flat());
  let tocca = 0, tot = 0;
  for (let y = Y * K; y < (Y + H) * K; y++)
    for (let x = X * K; x < (X + W) * K; x++) { if (dentro.has(a[y * LARGO + x])) tocca++; tot++; }
  const q = tocca / tot;
  /* sotto l'uno e mezzo per cento il ciclo non ha in mano niente */
  const bene = q >= 0.015;
  if (!bene) male++;
  console.log(`  ${bene ? 'ok ' : 'NO '} ${id.padEnd(12)} ${String(X).padStart(3)},${String(Y).padStart(3)} ` +
              `${(W + '×' + H).padEnd(8)} ${ciclo.padEnd(8)} ${(q * 100).toFixed(1)}% dei pixel`);
}
console.log(male ? `\n${male}/${ZONE.length} zone senza pigmenti da ciclare`
                 : `\ntutte e ${ZONE.length} le zone ciclano su pixel che ci sono`);
process.exit(male ? 1 : 0);
