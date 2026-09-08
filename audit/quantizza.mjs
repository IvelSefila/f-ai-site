/* ═══════════════════════════════════════════════════════════════════
 * DAI PNG DI HIGGSFIELD AI QUINDICI PIGMENTI
 *
 * Le immagini generate sono 1376×768 con migliaia di colori: messe nel
 * sito così sarebbero fotografie di pixel art, non pixel art. Qui le
 * riporto alla misura vera dello schermo (320×180) e le rimappo sui
 * quindici pigmenti della tavolozza, con retino di Floyd-Steinberg per
 * le sfumature che quindici colori non sanno fare.
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
import path from 'path';

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
for (const f of file) {
  const nome = path.basename(f, '.png');
  const dati = fs.readFileSync(path.join(DENTRO, f)).toString('base64');
  const r = await p.evaluate(async ({ dati, PIGMENTI, LARGO, ALTO }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + dati;
    await img.decode();

    /* 1 · alla misura dello schermo. Riduco in due passi con un filtro
       morbido: un salto secco da 1376 a 320 perde i dettagli fini
       (i mattoni, i libri sugli scaffali) e resta una poltiglia. */
    const mezzo = document.createElement('canvas');
    mezzo.width = Math.round(LARGO * 1.6); mezzo.height = Math.round(ALTO * 1.6);
    const gm = mezzo.getContext('2d');
    gm.imageSmoothingEnabled = true; gm.imageSmoothingQuality = 'high';
    gm.drawImage(img, 0, 0, mezzo.width, mezzo.height);

    const cv = document.createElement('canvas');
    cv.width = LARGO; cv.height = ALTO;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(mezzo, 0, 0, LARGO, ALTO);

    const d = g.getImageData(0, 0, LARGO, ALTO).data;
    const tri = PIGMENTI.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));

    /* 2 · la distanza fra colori la calcolo in una forma che pesa il
       verde più del blu: l'occhio fa così, e senza questa correzione
       i viola scuri finivano tutti sul nero. */
    const vicino = (r, gg, bb) => {
      let best = 0, dmin = Infinity;
      for (let i = 0; i < tri.length; i++) {
        const [pr, pg, pb] = tri[i];
        const rm = (r + pr) / 2;
        const dr = r - pr, dg = gg - pg, db = bb - pb;
        const dd = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
        if (dd < dmin) { dmin = dd; best = i; }
      }
      return best;
    };

    /* 3 · Floyd-Steinberg: l'errore di ogni pixel si spalma sui vicini
       non ancora fatti. È quello che dà il retino invece delle fasce. */
    const buf = new Float32Array(LARGO * ALTO * 3);
    for (let i = 0, k = 0; i < d.length; i += 4, k += 3) {
      buf[k] = d[i]; buf[k + 1] = d[i + 1]; buf[k + 2] = d[i + 2];
    }
    const out = new Uint8Array(LARGO * ALTO);
    /* Il tetto all'errore. Senza, su una campitura larga di un colore
       che la tavolozza non ha — il blu notte del cielo — l'errore si
       somma di pixel in pixel finche' spinge il colore dall'altra parte
       della ruota: il cielo diventava arancione. Con un limite di 40
       per canale il retino continua a funzionare ma non puo' scappare. */
    const TETTO = 40;
    const freno = e => e > TETTO ? TETTO : e < -TETTO ? -TETTO : e;
    const spargi = (x, y, er, eg, eb, f) => {
      if (x < 0 || x >= LARGO || y >= ALTO) return;
      const k = (y * LARGO + x) * 3;
      buf[k]     = Math.max(0, Math.min(255, buf[k]     + er * f));
      buf[k + 1] = Math.max(0, Math.min(255, buf[k + 1] + eg * f));
      buf[k + 2] = Math.max(0, Math.min(255, buf[k + 2] + eb * f));
    };
    for (let y = 0; y < ALTO; y++)
      for (let x = 0; x < LARGO; x++) {
        const k = (y * LARGO + x) * 3;
        const r = buf[k], gg = buf[k + 1], bb = buf[k + 2];
        const i = vicino(r, gg, bb);
        out[y * LARGO + x] = i;
        const [pr, pg, pb] = tri[i];
        const er = freno(r - pr), eg = freno(gg - pg), eb = freno(bb - pb);
        spargi(x + 1, y,     er, eg, eb, 7 / 16);
        spargi(x - 1, y + 1, er, eg, eb, 3 / 16);
        spargi(x,     y + 1, er, eg, eb, 5 / 16);
        spargi(x + 1, y + 1, er, eg, eb, 1 / 16);
      }

    /* quali pigmenti sono finiti in campo, e quanto */
    const conta = new Array(tri.length).fill(0);
    for (const v of out) conta[v]++;
    return { indici: [...out], conta };
  }, { dati, PIGMENTI, LARGO, ALTO });

  /* impacchetto in base64: 57.600 byte diventano 76.800 caratteri,
     leggibili dal browser senza una richiesta in più.

     Con otto fondali il file arriva a 5,3 MB, e su un telefono si
     sente. Comprimerlo con deflate lo porterebbe a 1,45 MB — misurato,
     non stimato — ma srotolarlo nel browser si puo' fare solo in modo
     asincrono, e i fondali servono dentro il ciclo di disegno. Vuol
     dire cambiare sfondo() e la cache dei fondali in gioco.js, cioe'
     toccare il cuore del gioco: e' un lavoro a parte, non da infilare
     in coda a un altro. */
  risultati[nome] = Buffer.from(Uint8Array.from(r.indici)).toString('base64');
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
 * Rigenerabili con:  node audit/quantizza.mjs
 * I PNG di partenza stanno in site/pixel/immagini/.
 * ═══════════════════════════════════════════════════════════════════ */

const B64 = {
`;
const corpo = Object.entries(risultati)
  .map(([k, v]) => `  ${k}: '${v}',`).join('\n');
const coda = `
};

/* da base64 a indici: una volta sola, alla prima richiesta */
const cache = new Map();
export function sfondo(nome) {
  if (cache.has(nome)) return cache.get(nome);
  const b = B64[nome];
  if (!b) return null;
  const bin = atob(b);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  cache.set(nome, a);
  return a;
}

export const NOMI = Object.keys(B64);
`;
fs.writeFileSync(FUORI, testa + corpo + coda);
console.log(`\nscritto ${path.relative('.', FUORI)} · ${(fs.statSync(FUORI).size / 1024).toFixed(0)} KB · ${Object.keys(risultati).length} fondali`);
