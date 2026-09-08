/* ═══════════════════════════════════════════════════════════════════
 * I FONDALI CHE MANCANO
 *
 * Cinque stanze su otto hanno un fondale generato, e si vede: sono le
 * belle. Le altre tre sono disegnate a codice con rettangoli e cerchi,
 * e sono quelle che non si capiscono. Qui stanno i testi con cui si
 * generano, tenuti in un posto solo perche' la prossima volta non si
 * ricomincia da capo — l'altra volta li avevo persi.
 *
 * La regola per restare nella stessa famiglia delle cinque gia' fatte:
 * pixel art a 16 bit, vista frontale come un fondale da gioco a
 * scorrimento, luce da candela o da forgia, pietra e legno, e la
 * tavolozza degli alchimisti — porpora, lapislazzuli, verderame,
 * cinabro, minio, orpimento, oro, pergamena su un fondo ferro-gallico.
 *
 * Uso:  node audit/stanze-prompt.mjs elenco
 *       node audit/stanze-prompt.mjs prova  <nome>          (Soul, 0,12)
 *       node audit/stanze-prompt.mjs genera <nome> [modello]
 * ═══════════════════════════════════════════════════════════════════ */

export const STILE =
  '16-bit pixel art, SNES JRPG background art, crisp chunky pixels with visible ' +
  'pixel grid, ordered dithering for gradients, limited palette of deep iron-gall ' +
  'ink purple #140f1a, shadow purple #241a2e, murex purple #7b3f9d, lapis blue ' +
  '#2e5f8a, azurite #4a90c2, verdigris #1f6f5c, malachite green #3fae7f, ' +
  'cinnabar red #c8102e, minium orange #e2622f, orpiment yellow #e8a317, gold ' +
  '#d4af37, parchment #e8dcc0, stone greys and warm earth browns. Straight-on ' +
  'flat front view like a side-scrolling game room, no perspective vanishing ' +
  'point, no camera tilt. Warm candle and hearth lighting with dithered glow ' +
  'halos. Medieval alchemical tower interior. Highly detailed but readable at ' +
  'small size. No text, no letters, no numbers, no watermark, no UI, no border, ' +
  'no characters looking at camera.';

export const STANZE = {
  bilancia: {
    titolo: '01 · La bilancia — la regia, mano contro macchina',
    prompt:
      'A vaulted stone chamber in an alchemical tower. Dead centre hangs a huge ' +
      'ornate brass balance scale from a chain in the ceiling, its beam perfectly ' +
      'horizontal. On the LEFT pan: a warm orange-red glowing heap of hand tools — ' +
      'brushes, a quill, a chisel — wrapped in a dithered ember glow. On the RIGHT ' +
      'pan: a cold blue-cyan glowing cluster of clockwork gears and a glass lens, ' +
      'wrapped in a dithered azure glow. Behind, a rough stone block wall with two ' +
      'lit wall sconces, and a heavy wooden workbench along the bottom edge. The ' +
      'left half of the room is lit warm orange, the right half cool blue, meeting ' +
      'in the middle under the scale. Empty floor in the lower quarter.',
  },
  materia: {
    titolo: '05 · La materia — la stessa sostanza in tre disposizioni',
    prompt:
      'A dark domed observatory chamber inside an alchemical tower. In the middle ' +
      'of the room, floating above a round stone pedestal table, hangs a swirling ' +
      'cloud of thousands of tiny glowing motes of light — gold, malachite green, ' +
      'lapis blue and orange sparks — suspended in mid-air like a constellation or ' +
      'a swarm, forming a loose lens-shaped mass. A brass astrolabe and an open ' +
      'ledger sit on the pedestal. Around them a dark stone wall with faint carved ' +
      'geometric constellation lines and two small green-flamed braziers. The mote ' +
      'cloud is the brightest thing in the frame; everything else is deep purple ' +
      'shadow. Empty dark floor in the lower quarter.',
  },
  scheda: {
    titolo: '06 · La scheda — il profilo, come in un gioco di ruolo',
    prompt:
      'A quiet scholar\'s alcove in an alchemical tower, seen straight on. A stone ' +
      'niche in the middle of the wall, framed by carved pilasters, with a lit ' +
      'candle on a small ledge to the left and a hanging brass lamp to the right. ' +
      'Behind, warm parchment-coloured plaster and stone blocks, shelves of rolled ' +
      'scrolls and leather ledgers along the top edge, and a long dark wooden desk ' +
      'running along the bottom edge with an inkwell and a stack of sealed letters. ' +
      'The middle of the wall is deliberately plain and evenly lit, an empty warm ' +
      'surface, because a card will be laid over it. Rich detail only around the ' +
      'outer edges of the frame.',
  },
};

/* ── da qui in giu' e' solo il ferro per parlare con Higgsfield ── */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
const esegui = promisify(execFile);

/* Su Windows "higgsfield" e' un .cmd di npm, e execFile senza shell non
   ci arriva: spawn ENOENT. Accendere la shell pero' non va bene, perche'
   questi testi sono lunghi e pieni di virgolette, cancelletti e trattini
   lunghi che cmd.exe rimaneggia. Sotto lo shim c'e' l'eseguibile vero:
   chiamo quello, e gli argomenti arrivano intatti. */
const CMD = (() => {
  const app = process.env.APPDATA || '';
  const candidati = [
    path.join(app, 'npm/node_modules/@higgsfield/cli/vendor/hf.exe'),
    path.join(app, 'npm/higgsfield.cmd'),
  ];
  for (const c of candidati) if (fs.existsSync(c)) return c;
  return 'higgsfield';
})();
const hf = (args) => esegui(CMD, args, { maxBuffer: 64 << 20, shell: CMD.endsWith('.cmd') });

const [azione, nome, modello = 'nano_banana_pro'] = process.argv.slice(2);

if (azione === 'elenco' || !azione) {
  for (const [k, v] of Object.entries(STANZE)) console.log(`${k.padEnd(10)} ${v.titolo}`);
  process.exit(0);
}

const st = STANZE[nome];
if (!st) { console.error('stanza sconosciuta:', nome, '· ce ne sono:', Object.keys(STANZE).join(' ')); process.exit(1); }

const mod = azione === 'prova' ? 'text2image_soul_v2' : modello;
const testo = st.prompt + ' ' + STILE;
const uscita = azione === 'prova'
  ? path.join('audit', `prova-${nome}-${mod}.png`)
  : path.join('site/pixel/immagini', `${nome}.png`);

console.log(`${nome} · ${mod}`);
const { stdout: costo } = await hf(['generate', 'cost', mod, '--prompt', testo, '--aspect-ratio', '16:9']);
console.log('  costo:', costo.trim().split('\n')[0]);

const args = ['generate', 'create', mod, '--prompt', testo, '--aspect-ratio', '16:9', '--wait', '--json'];
const { stdout } = await hf(args);
let dati;
try { dati = JSON.parse(stdout); } catch { console.log(stdout.slice(0, 2000)); process.exit(1); }

/* l'indirizzo dell'immagine sta annidato in modo diverso a seconda del
   modello: lo cerco invece di indovinare dove */
const url = (function trova(o) {
  if (typeof o === 'string' && /^https?:\/\/.*\.(png|jpg|jpeg|webp)/i.test(o)) return o;
  if (Array.isArray(o)) { for (const v of o) { const r = trova(v); if (r) return r; } return null; }
  if (o && typeof o === 'object') { for (const v of Object.values(o)) { const r = trova(v); if (r) return r; } return null; }
  return null;
})(dati);
if (!url) { console.error('nessuna immagine nella risposta'); console.log(JSON.stringify(dati).slice(0, 1200)); process.exit(1); }

const risp = await fetch(url);
if (!risp.ok) { console.error('scarico fallito:', risp.status); process.exit(1); }
fs.writeFileSync(uscita, Buffer.from(await risp.arrayBuffer()));
console.log('  scritto:', uscita, `· ${(fs.statSync(uscita).size / 1024).toFixed(0)} KB`);
