/* ═══════════════════════════════════════════════════════════════════
 * DAI PNG DI HIGGSFIELD AI QUINDICI PIGMENTI
 *
 * Le immagini generate sono 1376×768 con migliaia di colori: messe nel
 * sito così sarebbero fotografie di pixel art, non pixel art. Qui le
 * riporto alla misura vera dello schermo (320×180) e le rimappo sui
 * pigmenti della tavolozza con un retino ordinato di Bayer, che e'
 * quello delle console a 16 bit: una matrice fissa di soglie, uguale
 * per ogni immagine. Il retino a diffusione d'errore faceva sfumature
 * piu' morbide ma con quel brulichio da Amiga, e soprattutto non era
 * ripetibile: due fotogrammi quasi uguali venivano fuori diversi
 * dappertutto. Il perche' e i numeri stanno in audit/rimappa.mjs.
 *
 * Il risultato non è un PNG ma un array di indici: lo stesso formato
 * con cui disegna il motore, così un fondale generato e uno disegnato
 * a codice sono la stessa cosa e si possono mescolare.
 *
 * Uso il browser di Playwright per decodificare i PNG: è già qui, e
 * evita di aggiungere una libreria di immagini al progetto.
 * ═══════════════════════════════════════════════════════════════════ */

import { chromium } from 'playwright';
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { rimappa } from './rimappa.mjs';

const RADICE = path.resolve('site/pixel');
const DENTRO = path.join(RADICE, 'immagini');
const FUORI  = path.join(RADICE, 'sfondi.js');
const LARGO = 960, ALTO = 540;   /* la risoluzione vera del fotogramma */

/* la tavolozza, letta dal file vero per non tenerne due copie */
const tav = fs.readFileSync(path.join(RADICE, 'tavolozza.js'), 'utf8');
const PIGMENTI = [...tav.matchAll(/\['(#[0-9a-f]{6})',\s*'([^']+)'/g)].map(m => m[1]);
if (PIGMENTI.length < 15) { console.error('pigmenti trovati:', PIGMENTI.length); process.exit(1); }
console.log('tavolozza:', PIGMENTI.join(' '));

const file = fs.readdirSync(DENTRO).filter(f => f.endsWith('.png')).sort();
if (!file.length) { console.error('nessun png in', DENTRO); process.exit(1); }

const b = await chromium.launch({
  executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
});
const p = await b.newPage();
await p.goto('about:blank');

const risultati = {};
const pesi = {};
const crudi = {};      /* gli indici veri, che servono a ricavare le varianti */
for (const f of file) {
  const nome = path.basename(f, '.png');
  const dati = fs.readFileSync(path.join(DENTRO, f)).toString('base64');
  const indici = await rimappa(p, dati, { PIGMENTI, LARGO, ALTO });
  const conta = new Array(PIGMENTI.length).fill(0);
  for (const v of indici) conta[v]++;
  const r = { indici, conta };

  /* impacchetto in base64: 57.600 byte diventano 76.800 caratteri,
     leggibili dal browser senza una richiesta in più.

     Con otto fondali il file arriva a 5,3 MB, e su un telefono si
     sente. Comprimerlo con deflate lo porterebbe a 1,45 MB — misurato,
     non stimato — ma srotolarlo nel browser si puo' fare solo in modo
     asincrono, e i fondali servono dentro il ciclo di disegno. Vuol
     dire cambiare sfondo() e la cache dei fondali in gioco.js, cioe'
     toccare il cuore del gioco: e' un lavoro a parte, non da infilare
     in coda a un altro.

     Poi il lavoro a parte l'ho fatto, ed e' questo. */
  const grezzo = Buffer.from(Uint8Array.from(r.indici));
  crudi[nome] = grezzo;
  const stretto = zlib.deflateRawSync(grezzo, { level: 9 });
  risultati[nome] = stretto.toString('base64');
  pesi[nome] = [grezzo.length, stretto.length];
  const usati = r.conta.filter(c => c > 0).length;
  const top = r.conta.map((c, i) => [c, i]).sort((a, b) => b[0] - a[0]).slice(0, 3)
    .map(([c, i]) => `${PIGMENTI[i]}·${Math.round(c / (LARGO * ALTO) * 100)}%`).join(' ');
  console.log(`  ${nome.padEnd(13)} ${usati}/${PIGMENTI.length} pigmenti in campo · ${top}`);
}
await b.close();

const testa = `/* ═══════════════════════════════════════════════════════════════════
 * I FONDALI GENERATI
 *
 * Immagini fatte con Higgsfield (nano_banana_pro), poi riportate a
 * 960×540 e rimappate sui pigmenti della tavolozza con retino
 * di Floyd-Steinberg. Non sono PNG: sono array di indici, lo stesso
 * formato con cui disegna il motore — così un fondale generato e uno
 * disegnato a codice si mescolano senza accorgersene.
 *
 * Gli indici sono compressi con deflate e scritti in base64: crudi
 * facevano 5,3 MB, che su un telefono in giro si sentono.
 *
 * Rigenerabili con:  node audit/quantizza.mjs
 * I PNG di partenza stanno in site/pixel/immagini/.
 * ═══════════════════════════════════════════════════════════════════ */

const B64 = {
`;
/* Le chiavi vanno virgolettate. Senza, il primo file con un trattino
   nel nome — bilancia-giu-sinistra.png — ha scritto una chiave che
   JavaScript non sa leggere, e il sito e' morto con "Unexpected token
   '-'". Un generatore che puo' produrre un file non valido a seconda
   di come si chiama un png e' un generatore da sistemare. */
const corpo = Object.entries(risultati)
  .filter(([k]) => !k.includes('-'))
  .map(([k, v]) => `  '${k}': '${v}',`).join('\n');
const coda = `
};

/* ── da base64 compresso a indici ─────────────────────────────────
   Srotolare deflate nel browser si puo' fare solo in modo asincrono,
   e i fondali servono dentro il ciclo di disegno, che asincrono non e'.
   La via d'uscita era gia' nel codice senza che me ne accorgessi: ogni
   stanza ha il suo disegno di ripiego, e versa() lo lascia passare
   quando il fondale non c'e'.

   Quindi sfondo() risponde subito con quello che ha — l'array se e'
   pronto, niente se non lo e' ancora — e scongela() li apre uno alla
   volta avvisando chi tiene la cache. Cosi' la stanza compare subito
   disegnata a codice e si veste appena il suo fondale e' pronto,
   invece di far aspettare la pagina davanti al vuoto. */
const aperti = new Map();
export function sfondo(nome) { return aperti.get(nome) || null; }

function daBase64(b) {
  const bin = atob(b);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}

/* \`ordine\` sono le stanze da aprire per prime: quella che si sta
   guardando non deve aspettare il suo turno dietro le altre sette. */
export async function scongela(quando, ordine = []) {
  const nomi = [...new Set([...ordine, ...Object.keys(B64)])].filter(k => B64[k]);
  for (const nome of nomi) {
    if (aperti.has(nome)) continue;
    try {
      const flusso = new Blob([daBase64(B64[nome])]).stream()
        .pipeThrough(new DecompressionStream('deflate-raw'));
      aperti.set(nome, new Uint8Array(await new Response(flusso).arrayBuffer()));
      if (quando) quando(nome);
    } catch (e) {
      /* Senza DecompressionStream — browser vecchi — il fondale non si
         apre e la stanza resta quella disegnata a codice. Meglio una
         stanza piu' povera che una pagina rotta. */
      console.warn('fondale non aperto:', nome, e.message);
      return;
    }
    /* un respiro fra uno e l'altro: srotolarne otto di fila tiene
       occupato il filo principale proprio mentre si entra nel sito */
    await new Promise(r => setTimeout(r, 0));
  }
}

export const NOMI = Object.keys(B64);
`;
fs.writeFileSync(FUORI, testa + corpo + coda);
console.log(`\nscritto ${path.relative('.', FUORI)} · ${(fs.statSync(FUORI).size / 1024).toFixed(0)} KB · ${Object.keys(risultati).length} fondali`);

/* ── perche' non ci sono varianti ─────────────────────────────────
   Avevo provato a tenere piu' fotogrammi della stessa stanza — la
   bilancia con la stadera inclinata — per poi innestare sul fondale
   solo i pixel diversi. Non funziona, e la misura e' netta: il
   generatore non muove un pezzo dentro una stanza ferma, ridisegna
   tutta la stanza. Fuori dalla scatola della stadera cambiava l'8,2%
   del quadro in modo forte, con uno scarto medio di colore di 51 su
   255: muovendo la leva si sarebbe visto ballare il muro.

   La stadera si muove per un'altra via, presa dall'immagine che c'e'
   gia' — vedi piegaStadera in stanze.js. Costo: zero byte. */
