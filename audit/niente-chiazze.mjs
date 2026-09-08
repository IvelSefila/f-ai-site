/* ═══════════════════════════════════════════════════════════════════
 * IL TOCCO LASCIA CHIAZZE?
 *
 * Questa prova ha cambiato strumento due volte, e vale la pena dire
 * perche'.
 *
 * La prima versione toccava cinque punti e confrontava col fotogramma
 * di partenza. Diceva che tre stanze su quattro restavano macchiate, e
 * sbagliava: in quelle stanze il tocco cambia stato APPOSTA — riminia
 * la pagina, cambia la disposizione della materia, sceglie un altro
 * banco. Misuravo la funzione, non il difetto.
 *
 * La seconda toccava due volte lo stesso punto, cosi' al secondo lo
 * stato non si muoveva piu'. Ha funzionato finche' le luci dipinte non
 * hanno cominciato a ciclare: da allora il fotogramma non torna MAI
 * identico, perche' la fiamma non sta ferma, e la prova ballava.
 *
 * Adesso guarda la MEDIA nel tempo. Un ciclo di tavolozza oscilla
 * attorno a un valore e nella media sparisce; una chiazza d'oro invece
 * sposta la media e ci resta. Cosi' la domanda torna quella giusta:
 * dopo che ho toccato, la stanza e' in media la stessa di prima?
 *
 * uso: node audit/niente-chiazze.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const NUMERO = { soglia: '00', bilancia: '01', scriptorium: '02', banchi: '03',
                 forgia: '04', materia: '05', scheda: '06', alchimista: '07' };

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errori = [];
p.on('pageerror', e => errori.push(String(e)));
p.on('console', m => m.type() === 'error' && errori.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });

async function vaiA(id) {
  await p.evaluate(i => document.querySelector('#s-' + i).scrollIntoView(), id);
  await p.waitForFunction(
    n => (document.querySelector('#statoStanza').textContent || '').includes('Stanza ' + n),
    NUMERO[id], { timeout: 8000 });
  await p.waitForTimeout(350);
}

/* i tre canali medi del quadro intero */
const media = () => p.evaluate(() => {
  const cv = document.querySelector('#schermo');
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let r = 0, g = 0, bb = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i+1]; bb += d[i+2]; n++; }
  return [r / n, g / n, bb / n];
});

/* la media di tante letture, per stendere il ciclo delle fiamme */
async function mediaNelTempo(quante = 14) {
  const s = [0, 0, 0];
  for (let k = 0; k < quante; k++) {
    const m = await media();
    for (let c = 0; c < 3; c++) s[c] += m[c];
    await p.waitForTimeout(40 + (k * 29) % 90);
  }
  return s.map(v => v / quante);
}
const scostamento = (a, b2) =>
  Math.sqrt(a.reduce((s, v, i) => s + (v - b2[i]) ** 2, 0));

let male = 0;
for (const [id, punti] of [
  ['soglia',     [[60, 40], [250, 120]]],
  ['scheda',     [[150, 40], [150, 120]]],
  ['banchi',     [[40, 60], [250, 40]]],
  ['forgia',     [[150, 30], [60, 150]]],
  ['bilancia',   [[160, 150], [90, 40]]],
  ['alchimista', [[60, 30], [250, 150]]],
]) {
  await vaiA(id);
  const tel = await p.locator('.telaio').boundingBox();

  const tocca = async () => {
    for (const [x, y] of punti)
      await p.mouse.click(tel.x + tel.width * x / 320, tel.y + tel.height * y / 180);
    await p.waitForTimeout(2500);        /* tempo perche' ogni onda finisca */
  };

  /* Un primo giro di tocchi serve a far assestare lo stato: nei banchi
     toccare sceglie un banco, e scegliendone due diversi la stanza
     cambia per davvero — e' la funzione, non una macchia. Dal secondo
     giro in poi gli stessi punti danno lo stesso stato. */
  await tocca();

  /* due misure a riposo: quanto balla la stanza da sola */
  const a = await mediaNelTempo();
  const b1 = await mediaNelTempo();
  const balla = scostamento(a, b1);

  await tocca();
  const dopo = await mediaNelTempo();
  const salto = scostamento(b1, dopo);

  /* passa se dopo il tocco la media non si sposta piu' di quanto si
     sposti da sola, con un margine largo e comunque sotto un livello
     che a occhio non si vedrebbe */
  const bene = salto <= Math.max(balla * 3 + 0.5, 1.2);
  if (!bene) male++;
  console.log(`  ${bene ? 'ok ' : 'NO '} ${id.padEnd(12)} da sola ${balla.toFixed(2)} · dopo il tocco ${salto.toFixed(2)}`);
}
console.log(male ? `\n${male} stanze restano macchiate`
                 : '\nnessuna chiazza: il tocco non sposta la stanza');
console.log('errori:', errori.length, errori.slice(0, 2).join(' | '));
await b.close();
process.exit(male || errori.length ? 1 : 0);
