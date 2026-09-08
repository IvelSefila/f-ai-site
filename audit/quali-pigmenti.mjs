/* Quali pigmenti stanno dentro una zona di un fondale, in ordine di
   luminosita'. Serve a costruire le rampe per il ciclo di tavolozza:
   ciclare un pigmento che li' non c'e' non fa niente, e ciclarne uno
   che c'e' ma appartiene al muro fa lampeggiare il muro.
   uso: node audit/quali-pigmenti.mjs forgia 18 48 66 76 */
import fs from 'fs';
import zlib from 'zlib';
const [nome, X, Y, W, H] = process.argv.slice(2);
const src = fs.readFileSync('site/pixel/sfondi.js', 'utf8');
const m = new RegExp(`^  '?${nome}'?: '([^']+)',`, 'm').exec(src);
if (!m) { console.error('fondale sconosciuto:', nome); process.exit(1); }
const a = zlib.inflateRawSync(Buffer.from(m[1], 'base64'));

const tav = fs.readFileSync('site/pixel/tavolozza.js', 'utf8');
const P = [...tav.matchAll(/\['(#[0-9a-f]{6})',\s*'([^']+)'/g)].map(x => [x[1], x[2]]);
const lum = h => { const [r,g,b] = [1,3,5].map(i => parseInt(h.slice(i,i+2),16));
                   return 0.2126*r + 0.7152*g + 0.0722*b; };

const K = 3, LARGO = 960;
const x0 = X*K, y0 = Y*K, x1 = (+X + +W)*K, y1 = (+Y + +H)*K;
const conta = new Array(P.length).fill(0);
let tot = 0;
for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { conta[a[y*LARGO+x]]++; tot++; }

console.log(`${nome} · zona ${X},${Y} ${W}x${H} · ${tot} pixel`);
conta.map((c,i) => ({ i, c, hex: P[i][0], nome: P[i][1], l: lum(P[i][0]) }))
  .filter(x => x.c / tot > 0.005)
  .sort((a,b) => a.l - b.l)
  .forEach(x => console.log(
    `  ${String(x.i).padStart(2)} ${x.hex} ${x.nome.padEnd(24)} ` +
    `luce ${String(Math.round(x.l)).padStart(3)} · ${(x.c/tot*100).toFixed(1)}%`));
