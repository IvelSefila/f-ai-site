/* ═══════════════════════════════════════════════════════════════════
 * LA BILANCIA SEGUE LA LEVA?
 *
 * Ho provato tre volte a misurare "dove sta il piatto" con il
 * baricentro dei pixel chiari, e tre volte ho sbagliato: in quelle
 * scatole finiscono anche le candele sul banco e il camino, che sono
 * fermi e luminosi e tirano il baricentro dove vogliono loro. Due
 * volte la prova mi ha detto che la corsa era al contrario, e due
 * volte ci ho creduto prima di guardare la stanza intera.
 *
 * Allora cambio domanda, e ne faccio due che so misurare bene:
 *
 *  1 · ogni posizione della leva da' un quadro DIVERSO, e la
 *      differenza cresce man mano che ci si allontana — cioe' la
 *      corsa e' continua e ordinata, non a scatti e non avanti e
 *      indietro;
 *  2 · fuori dalla bilancia il quadro non si muove di un pixel.
 *
 * Il verso — a leva zero comanda la mano — si vede nella striscia a
 * stanza intera di audit/pose-in-fila.mjs, ed e' li' che va guardato:
 * un occhio su un'immagine intera e' piu' affidabile di un baricentro
 * su un ritaglio.
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errori = [];
p.on('pageerror', e => errori.push(String(e)));
p.on('console', m => m.type() === 'error' && errori.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelector('#s-bilancia').scrollIntoView());
await p.waitForFunction(() => (document.querySelector('#statoStanza').textContent || '').includes('Stanza 01'));
await p.waitForTimeout(1800);      /* le pose si aprono una alla volta */

const leva = async (v) => {
  await p.evaluate(n => { const l = document.querySelector('#levaMix');
    l.value = n; l.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await p.waitForTimeout(420);
};
const zona = (r) => p.evaluate(([x, y, w, h]) => {
  const cv = document.querySelector('#schermo'), k = cv.width / 320;
  return [...cv.getContext('2d').getImageData(x * k, y * k, w * k, h * k).data];
}, r);
const diversi = (a, c) => {
  let n = 0;
  for (let i = 0; i < a.length; i += 4)
    if (Math.max(Math.abs(a[i]-c[i]), Math.abs(a[i+1]-c[i+1]), Math.abs(a[i+2]-c[i+2])) > 20) n++;
  return n / (a.length / 4);
};

const BILANCIA = [74, 22, 172, 122];
/* il muro fra i due piatti e il banco: qui non deve muoversi niente */
const FERMO = [8, 140, 60, 36];

await leva(0);
const base = await zona(BILANCIA), fermo0 = await zona(FERMO);

console.log('  leva   quanto e\' cambiata la bilancia rispetto a leva 0');
const scarti = [];
for (const v of [0, 12, 25, 37, 50, 62, 75, 87, 100]) {
  await leva(v);
  const d = diversi(base, await zona(BILANCIA));
  scarti.push(d);
  console.log(`  ${String(v).padStart(4)}%   ${(d * 100).toFixed(1)}%${' '.repeat(Math.round(d * 60))}·`);
}
await leva(100);
const fermoFine = await zona(FERMO);
const restaFermo = diversi(fermo0, fermoFine);

/* cresce sempre? Ammetto un gradino piatto, non un passo indietro. */
let ordinata = true;
for (let i = 1; i < scarti.length; i++)
  if (scarti[i] < scarti[i - 1] - 0.01) ordinata = false;
const passi = new Set(scarti.map(d => Math.round(d * 200))).size;

console.log(`\n  la corsa cresce sempre           ${ordinata ? 'si' : 'NO'}`);
console.log(`  posizioni distinte su nove       ${passi}`);
console.log(`  il muro accanto cambia           ${(restaFermo * 100).toFixed(2)}%`);
console.log(`  errori                           ${errori.length}`);

const bene = ordinata && passi >= 7 && restaFermo < 0.005 && !errori.length;
console.log('\n' + (bene ? 'la bilancia segue la leva, e il resto sta fermo'
                         : 'QUALCOSA NON TORNA'));
await b.close();
process.exit(bene ? 0 : 1);
