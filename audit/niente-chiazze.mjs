/* ═══════════════════════════════════════════════════════════════════
 * IL TOCCO LASCIA CHIAZZE?
 *
 * La prima versione di questa prova toccava cinque punti e confrontava
 * col fotogramma di partenza. Diceva che tre stanze su quattro
 * restavano macchiate, e sbagliava: in quelle stanze il tocco cambia
 * stato apposta — riminia la pagina, cambia la disposizione della
 * materia, sceglie un altro banco. Misuravo la funzione, non il
 * difetto.
 *
 * Qui tocco DUE VOLTE LO STESSO PUNTO. Al primo tocco lo stato si
 * assesta; al secondo non cambia piu' niente, perche' scegliere lo
 * stesso banco due volte e' come sceglierlo una. Quindi tutto quello
 * che resta diverso e' l'oro dell'onda, che e' proprio quello che
 * voglio misurare.
 *
 * Restano fuori scriptorium e materia, dove il tocco non e' ripetibile:
 * ogni volta tirano un seme nuovo o girano di una disposizione.
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errori = [];
p.on('pageerror', e => errori.push(String(e)));
p.on('console', m => m.type() === 'error' && errori.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });

const foto = () => p.evaluate(() => {
  const cv = document.querySelector('#schermo');
  return [...cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data];
});
const scarto = (a, c) => {
  let n = 0, peggio = 0;
  for (let i = 0; i < a.length; i += 4) {
    const d = Math.max(Math.abs(a[i] - c[i]), Math.abs(a[i+1] - c[i+1]), Math.abs(a[i+2] - c[i+2]));
    if (d > 12) { n++; if (d > peggio) peggio = d; }
  }
  return { n, peggio, tot: a.length / 4 };
};

/* stanze dove toccare due volte lo stesso punto lascia lo stato dov'e' */
const PROVE = [
  ['scheda',   [[150, 40]]],
  ['banchi',   [[40, 60]]],
  ['forgia',   [[150, 30]]],
  ['bilancia', [[160, 150]]],
];

let male = 0;
for (const [id, punti] of PROVE) {
  await p.evaluate(i => document.querySelector('#s-' + i).scrollIntoView(), id);
  await p.waitForTimeout(900);
  const t = await p.locator('.telaio').boundingBox();
  const tocca = async () => {
    for (const [x, y] of punti)
      await p.mouse.click(t.x + t.width * x / 320, t.y + t.height * y / 180);
  };
  await tocca();                     /* primo tocco: lo stato si assesta */
  await p.waitForTimeout(3000);      /* e l'onda finisce */

  /* Il metro di paragone: quanto cambia la stanza DA SOLA in tre
     secondi. Nella forgia il fuoco tremola sempre, e senza questo
     controllo avrei letto il tremolio come una macchia. */
  const a0 = await foto();
  await p.waitForTimeout(3000);
  const a1 = await foto();
  const daSola = scarto(a0, a1);

  await tocca();                     /* secondo tocco: solo l'onda */
  await p.waitForTimeout(3000);
  const dopo = await foto();
  const r = scarto(a1, dopo);

  /* passa se dopo il tocco non cambia piu' di quanto cambi da sola */
  const pulita = r.n <= Math.max(daSola.n * 1.6, r.tot * 0.002);
  if (!pulita) male++;
  console.log(`  ${pulita ? 'ok ' : 'NO '} ${id.padEnd(10)} da sola ${String(daSola.n).padStart(5)}` +
              ` · dopo il tocco ${String(r.n).padStart(5)} su ${r.tot}` +
              ` (${(r.n / r.tot * 100).toFixed(2)}%)`);
}
console.log(`\n${male ? male + ' stanze restano macchiate' : 'nessuna chiazza: l\'onda passa e non lascia niente'}`);
console.log('errori:', errori.length);
await b.close();
process.exit(male || errori.length ? 1 : 0);
