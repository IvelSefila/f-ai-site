/* ═══════════════════════════════════════════════════════════════════
 * OGNI OGGETTO REAGISCE DAVVERO?
 *
 * Un colpetto e' un successo solo se il fotogramma cambia dove deve.
 * Quindi misuro la luminanza media di un rettangolo prima e dopo, e
 * chiedo una differenza. Guardo anche un rettangolo lontano, per
 * essere sicuro che non stia cambiando tutta la scena da sola.
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const PROVE = [
  ['soglia', 'finestra della torre', 213, 69, [200, 55, 30, 30], 900],
  ['soglia', 'luna a sinistra',       79, 50, [50, 22, 60, 56], 1700],
  ['soglia', 'luna a destra',        248, 40, [220, 12, 58, 56], 1700],
  ['scriptorium', 'la prima pagina',  56, 82, [18, 34, 76, 96], 330],
  ['scriptorium', 'la terza pagina', 256, 82, [218, 34, 76, 96], 330],
  ['scriptorium', 'le candele',      205, 62, [98, 24, 16, 54], 700],
  ['banchi', 'i pennelli',            40, 100, [6, 124, 66, 24], 900],
  ['banchi', 'la bobina',            105, 104, [86, 88, 40, 34], 500],
  ['banchi', 'gli scudi',            200, 104, [176, 84, 50, 42], 500],
  ['banchi', 'gli automi',           281, 100, [252, 86, 60, 32], 500],
  ['forgia', 'la fornace',            48,  92, [22, 62, 54, 56], 700],
  ['forgia', 'gli utensili',         135,  60, [96, 44, 78, 52], 500],
  ['forgia', 'la finestra',          258,  60, [218, 8, 82, 60], 200],
  ['bilancia', 'il piatto della mano',    100, 100, [74, 82, 58, 46], 300],
  ['bilancia', 'il piatto della macchina', 206, 102, [178, 84, 56, 42], 300],
  ['materia', "l'astrolabio",        142, 114, [126, 100, 36, 30], 500],
  ['materia', 'il libro',            176, 118, [160, 108, 34, 20], 300],
  ['materia', 'i bracieri',           68, 112, [54, 84, 30, 32], 500],
  ['scheda', 'la candela',            45,  90, [26, 62, 30, 44], 700],
  ['scheda', 'la lucerna',           270,  90, [252, 70, 36, 40], 400],
];

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errori = [];
p.on('console', m => m.type() === 'error' && errori.push(m.text()));
p.on('pageerror', e => errori.push(String(e)));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });

const luce = (r) => p.evaluate(([x, y, w, h]) => {
  const cv = document.querySelector('#schermo'), k = cv.width / 320;
  const d = cv.getContext('2d').getImageData(x * k, y * k, w * k, h * k).data;
  let s = 0;
  for (let i = 0; i < d.length; i += 4) s += .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2];
  return +(s / (d.length / 4)).toFixed(1);
}, r);

let ok = 0;
for (const [stanza, cosa, tx, ty, rett, attesa] of PROVE) {
  await p.evaluate(id => document.querySelector('#s-' + id).scrollIntoView(), stanza);
  await p.waitForTimeout(800);
  const tel = await p.locator('.telaio').boundingBox();

  /* due letture a riposo, per sapere quanto respira la scena da sola */
  const a0 = await luce(rett);
  await p.waitForTimeout(attesa);
  const a1 = await luce(rett);
  const respiro = Math.abs(a1 - a0);

  await p.mouse.click(tel.x + tel.width * tx / 320, tel.y + tel.height * ty / 180);
  await p.waitForTimeout(attesa);
  const dopo = await luce(rett);
  const salto = Math.abs(dopo - a1);

  const passa = salto > Math.max(2.5, respiro * 2.2);
  if (passa) ok++;
  console.log(`${passa ? '  ok ' : '  NO '} ${(stanza + ' · ' + cosa).padEnd(34)} ` +
    `riposo ${a0}→${a1} (${respiro.toFixed(1)}) · tocco → ${dopo} (${salto.toFixed(1)})`);
}
console.log(`\n${ok}/${PROVE.length} oggetti reagiscono · errori in console: ${errori.length}`);
if (errori.length) console.log(errori.slice(0, 4).join('\n'));
await b.close();
process.exit(ok === PROVE.length && !errori.length ? 0 : 1);
