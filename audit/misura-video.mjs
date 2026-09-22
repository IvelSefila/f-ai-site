/* ═══════════════════════════════════════════════════════════════════
 * QUANTO DURANO E CHE FORMA HANNO I VIDEO DEL PORTFOLIO
 *
 * Senza ffmpeg sul computer, il lettore video del browser sa gia' dire
 * tutto quello che serve: durata, larghezza, altezza. E sa anche tirare
 * fuori un fotogramma, che e' quello che serve come copertina.
 *
 * I file vengono serviti su una porta a parte invece di essere copiati
 * nel sito: 310 MB di originali non devono entrare nel progetto prima
 * di aver deciso come si pubblicano.
 *
 * uso: node audit/misura-video.mjs            (misura)
 *      node audit/misura-video.mjs copertine  (misura e salva i fermi)
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = 'http://localhost:8901';
const FUORI = 'audit/copertine';
const COPERTINE = process.argv[2] === 'copertine';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext()).newPage();
await p.goto(BASE + '/');

const elenco = await p.evaluate(() => [...document.querySelectorAll('a')]
  .map(a => decodeURIComponent(a.getAttribute('href')))
  .filter(h => /\.(mp4|webm|mov)$/i.test(h)));

if (COPERTINE) fs.mkdirSync(FUORI, { recursive: true });
console.log(`${elenco.length} video\n`);
const righe = [];

for (const nome of elenco) {
  const m = await p.evaluate(async ({ url, ferma }) => {
    const v = document.createElement('video');
    v.src = url; v.muted = true; v.preload = 'metadata';
    await new Promise((ok, ko) => { v.onloadedmetadata = ok; v.onerror = () => ko(new Error('non si apre')); });
    const out = { d: v.duration, w: v.videoWidth, h: v.videoHeight };
    if (ferma) {
      /* un fotogramma a un sesto della durata: all'inizio c'e' spesso
         nero o un titolo che non racconta niente del pezzo */
      await new Promise(ok => { v.onseeked = ok; v.currentTime = Math.min(v.duration / 6, 4); });
      const c = document.createElement('canvas');
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      out.png = c.toDataURL('image/jpeg', 0.86).split(',')[1];
    }
    return out;
  }, { url: BASE + '/' + encodeURIComponent(nome), ferma: COPERTINE });

  const mmss = `${Math.floor(m.d / 60)}:${String(Math.round(m.d % 60)).padStart(2, '0')}`;
  const prop = (m.w / m.h).toFixed(2);
  const forma = prop > 1.5 ? 'orizzontale' : prop < 0.7 ? 'verticale' : 'quadrato-ish';
  const peso = fs.statSync(path.join('C:/Users/fabri/Desktop/Robe varie/lavori/portfolio/Union Energia per Roberto Baldizzone', nome)).size;
  const mbit = (peso * 8 / m.d / 1e6).toFixed(1);
  righe.push({ nome, d: m.d, mmss, w: m.w, h: m.h, forma, mb: peso / 1048576, mbit });
  console.log(`  ${nome}`);
  console.log(`     ${mmss} · ${m.w}×${m.h} ${forma} · ${(peso / 1048576).toFixed(1)} MB · ${mbit} Mbit/s`);

  if (COPERTINE && m.png) {
    const f = path.join(FUORI, nome.replace(/\.[^.]+$/, '') + '.jpg');
    fs.writeFileSync(f, Buffer.from(m.png, 'base64'));
  }
}

const tot = righe.reduce((s, r) => s + r.mb, 0);
const dur = righe.reduce((s, r) => s + r.d, 0);
console.log(`\nin tutto: ${tot.toFixed(0)} MB · ${Math.floor(dur / 60)}:${String(Math.round(dur % 60)).padStart(2, '0')} di girato`);
console.log(`a 2,5 Mbit/s starebbero in ${(dur * 2.5 / 8).toFixed(0)} MB`);
await b.close();
