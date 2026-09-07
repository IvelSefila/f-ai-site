/* Costruisce la tavolozza a 64 pigmenti.
   I primi 24 restano identici — nessun disegno gia' scritto cambia.
   I 40 nuovi sono gradazioni: ogni famiglia di colore riceve una rampa
   dall'ombra alla luce, che e' il modo in cui lavoravano le macchine a
   16 bit e, prima di loro, i miniaturisti. */
import fs from 'fs';
const hex = ([r,g,b]) => '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const rgb = h => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));

/* dal colore pieno a una gradazione: verso l'ombra si scurisce e si
   desatura verso il fondo d'inchiostro, verso la luce si schiarisce e
   si sposta appena verso il caldo, come fa la luce di candela */
const FONDO = rgb('#140f1a'), LUCE = rgb('#fbf3e2');
const verso = (c, obiettivo, q) => c.map((v,i)=>v + (obiettivo[i]-v)*q);

const FAMIGLIE = [
  ['porpora',  '#7b3f9d', [-.55,-.30,  .22, .45]],
  ['lapis',    '#2e5f8a', [-.45,-.22,  .26, .50]],
  ['verderame','#1f6f5c', [-.42,-.20,  .28, .52]],
  ['cinabro',  '#c8102e', [-.55,-.28,  .24, .48]],
  ['minio',    '#e2622f', [-.50,-.25,  .22, .44]],
  ['oro',      '#d4af37', [-.52,-.26,  .20, .42]],
  ['pietra',   '#6b6a78', [-.48,-.24,  .26, .50]],
  ['terra',    '#8a5a2b', [-.50,-.25,  .24, .48]],
  ['indaco',   '#35406b', [-.42,-.20,  .26, .50]],
  ['carne',    '#b9736f', [-.45,-.22,  .22, .46]],
];

const nuovi = [];
for (const [nome, base, passi] of FAMIGLIE) {
  const c = rgb(base);
  passi.forEach((q, i) => {
    const col = q < 0 ? verso(c, FONDO, -q) : verso(c, LUCE, q);
    nuovi.push([hex(col), `${nome} ${q < 0 ? (i === 0 ? 'ombra profonda' : 'ombra') : (q > .4 ? 'luce' : 'chiaro')}`]);
  });
}
console.log('gradazioni generate:', nuovi.length);

/* le innesto in coda al file, dopo le mezze tinte */
const p = 'site/pixel/tavolozza.js';
let s = fs.readFileSync(p, 'utf8');
const ancora = "  /* 23 */ ['#6e3a2e', 'bruno rosso',     'mezza tinta'],";
if (!s.includes(ancora)) { console.error('ancora non trovata'); process.exit(1); }
if (s.includes('LE RAMPE')) { console.error('gia\' fatto'); process.exit(1); }

const righe = nuovi.map(([h, n], i) =>
  `  /* ${24 + i} */ ['${h}', '${n}',${' '.repeat(Math.max(1, 20 - n.length))}'gradazione'],`).join('\n');
s = s.replace(ancora, ancora + `

  /* ── LE RAMPE ──────────────────────────────────────────────────
     Quaranta gradazioni, quattro per ogni famiglia di colore: due
     verso l'ombra, due verso la luce. È la differenza fra un otto e
     un sedici bit — non più tinte, ma più gradini dentro ogni tinta,
     così una parete di pietra ha il suo volume invece di una
     campitura sola. Generate da audit/rampe.mjs.
     Anche queste in coda: 0-23 restano quelli di prima. */
${righe}`);
fs.writeFileSync(p, s);
const quanti = (s.match(/\['#[0-9a-f]{6}'/g) || []).length;
console.log('tavolozza ora:', quanti, 'pigmenti');
