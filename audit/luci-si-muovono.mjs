/* ═══════════════════════════════════════════════════════════════════
 * LE LUCI DIPINTE SI MUOVONO, E SOLO LORO?
 *
 * Due domande, e la seconda e' quella che mi ha gia' fregato una volta.
 *
 *  1 · dentro la zona qualcosa cambia? Un ciclo su pigmenti che li'
 *      non ci sono non fa niente e non lo dice nessuno: nessun errore,
 *      solo una fiamma ferma. L'alone della luna era cosi' — ciclavo il
 *      lapislazzuli e li' c'era indaco.
 *
 *  2 · fuori dalla zona sta fermo? Alla prima prova sulla forgia la
 *      scatola era larga e ciclava anche l'arco di pietra: tutta la
 *      parete lampeggiava.
 *
 * Per rispondere alla seconda tengo conto di quello che si muove per
 * conto suo — le fiamme disegnate a codice, le scintille, gli aloni
 * che respirano — misurando la stanza contro se stessa in una zona
 * lontana da quella che ciclo.
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

/* ── arrivare davvero nella stanza ────────────────────────────────
   Scorrere e poi aspettare un tot di millisecondi non basta: fra
   l'aggancio della pagina e l'osservatore che decide quale stanza
   mostrare passa un tempo che non e' sempre lo stesso, e certe letture
   finivano su un'altra stanza — ferma, quindi "questa luce non si
   muove". Aspetto che la stanza dichiari di esserci. */
const NUMERO = { soglia: '00', bilancia: '01', scriptorium: '02', banchi: '03',
                 forgia: '04', materia: '05', scheda: '06', alchimista: '07' };
async function vaiA(p, id) {
  await p.evaluate(i => document.querySelector('#s-' + i).scrollIntoView(), id);
  await p.waitForFunction(
    n => (document.querySelector('#statoStanza').textContent || '').includes('Stanza ' + n),
    NUMERO[id], { timeout: 8000 });
  await p.waitForTimeout(350);      /* un respiro perche' il quadro si assesti */
}

/* stanza, cosa, la zona che deve muoversi, una zona vicina che deve
   stare ferma (muro, pietra, legno) */
const PROVE = [
  ['soglia',      'alone della luna', [50, 24, 58, 52],  [120, 100, 60, 40]],
  ['soglia',      'finestra torre',   [203, 56, 16, 26], [250, 120, 50, 40]],
  ['bilancia',    'braciere',         [0, 104, 22, 56],  [120, 20, 60, 26]],
  ['scriptorium', 'candela del muro', [95, 24, 11, 14],  [40, 4, 60, 14]],
  ['banchi',      'lanterna',         [150, 30, 14, 20], [40, 6, 70, 20]],
  ['forgia',      'la fornace',       [30, 62, 34, 48],  [96, 44, 78, 30]],
  ['materia',     'le scintille',     [68, 26, 168, 76], [20, 120, 60, 30]],
  ['materia',     'braciere',         [56, 100, 26, 24], [110, 140, 60, 24]],
  ['scheda',      'la lucerna',       [256, 82, 26, 26], [286, 130, 30, 24]],
  ['alchimista',  'la candela',       [118, 54, 18, 28], [230, 130, 60, 30]],
];

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errori = [];
p.on('pageerror', e => errori.push(String(e)));
p.on('console', m => m.type() === 'error' && errori.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });

const zona = (r) => p.evaluate(([x, y, w, h]) => {
  const cv = document.querySelector('#schermo'), k = cv.width / 320;
  return [...cv.getContext('2d').getImageData(x * k, y * k, w * k, h * k).data];
}, r);
const diversi = (a, c) => {
  let n = 0;
  for (let i = 0; i < a.length; i += 4)
    if (Math.max(Math.abs(a[i] - c[i]), Math.abs(a[i+1] - c[i+1]), Math.abs(a[i+2] - c[i+2])) > 12) n++;
  return n / (a.length / 4);
};

let male = 0;
for (const [id, cosa, viva, ferma] of PROVE) {
  await vaiA(p, id);
  /* Con le coppie la fase e' binaria, e due sole letture possono
     coglierla uguale: la prima versione di questa prova dava la stessa
     luce ferma o viva a seconda del momento, e una prova ballerina e'
     peggio di nessuna prova. Dodici letture lungo un secondo e mezzo attraversano di sicuro piu' di un cambio di fase, anche
     se il browser rallenta. */
  const v0 = await zona(viva), f0 = await zona(ferma);
  let siMuove = 0, staFerma = 0;
  /* Gli intervalli sono tutti diversi apposta. Con dodici attese
     uguali la prova falliva una volta su cinque, sempre sulla stessa
     luce, e non era la luce: fra un'attesa e la lettura del quadro
     passa altro tempo, e la somma si incastrava col periodo del ciclo.
     Campionavo dodici volte sempre nella stessa fase. Con intervalli
     irregolari non si puo' incastrare. */
  for (let k = 0; k < 12; k++) {
    await p.waitForTimeout(45 + (k * 37) % 130);
    siMuove = Math.max(siMuove, diversi(v0, await zona(viva)));
    staFerma = Math.max(staFerma, diversi(f0, await zona(ferma)));
  }
  /* passa se la zona viva si muove almeno l'1,5% dei pixel e se
     quella che deve stare ferma si muove molto meno */
  const bene = siMuove > 0.015 && staFerma < 0.05;
  if (!bene) {
    male++;
    /* Quando fallisce voglio sapere cosa stava guardando, non
       immaginarlo: quale stanza, se il ciclo gira, e se il quadro
       intero si muove o e' tutto fermo. */
    const perche = await p.evaluate(() => new Promise(r => {
      const cv = document.querySelector('#schermo');
      const g = cv.getContext('2d');
      const foto = () => { const d = g.getImageData(0, 0, cv.width, cv.height).data;
        let s = 0; for (let i = 0; i < d.length; i += 997) s = (s * 31 + d[i]) >>> 0; return s; };
      const viste = new Set([foto()]);
      let n = 0; const t0 = performance.now();
      const giro = () => { n++; viste.add(foto());
        performance.now() - t0 < 700 ? requestAnimationFrame(giro)
          : r({ stanza: document.querySelector('#statoStanza').textContent,
                giriRaf: n, quadriDiversi: viste.size }); };
      requestAnimationFrame(giro);
    }));
    console.log('        ↳', JSON.stringify(perche));
  }
  console.log(`  ${bene ? 'ok ' : 'NO '} ${(id + ' · ' + cosa).padEnd(30)} ` +
              `si muove ${(siMuove * 100).toFixed(1)}% · accanto ${(staFerma * 100).toFixed(1)}%`);
}
console.log(male ? `\n${male}/${PROVE.length} luci da correggere`
                 : `\ntutte e ${PROVE.length} si muovono, e solo dove devono`);
console.log('errori:', errori.length, errori.slice(0, 2).join(' | '));
await b.close();
process.exit(male || errori.length ? 1 : 0);
