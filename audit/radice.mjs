/* ═══════════════════════════════════════════════════════════════════
 * LA RADICE PORTA DRITTA AL SITO
 *
 * Prima qui c'era un bivio fra il sito e la torre in pixel art, e
 * questa prova controllava che dicesse cosa faccio prima di far
 * scegliere. La torre e' in standby: adesso la radice rimanda, e le
 * domande sono altre.
 *
 * Un rimando ha due modi tipici di essere sbagliato, e nessuno dei due
 * si vede aprendo la pagina una volta:
 *
 *  · LA TRAPPOLA DELLA CRONOLOGIA — se il rimando usa un assign invece
 *    di un replace, il tasto "indietro" dal sito torna alla radice, che
 *    rimanda avanti: si resta incastrati e non si esce piu' dal sito.
 *    Qui si prova proprio cosi': si entra, si torna indietro, e si
 *    guarda dove si finisce.
 *
 *  · SENZA JAVASCRIPT non succede niente. Il <meta refresh> serve a
 *    quello, e si prova spegnendo JavaScript per davvero.
 *
 * E poi le due cose che non devono essersi rotte mettendo in standby la
 * torre: che la torre risponda ancora al suo indirizzo, e che il bivio
 * sia conservato e funzionante, cosi' rimetterlo e' questione di un
 * minuto.
 *
 * uso: node audit/radice.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:8899';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

for (const [nome, vp] of [['telefono', { width: 390, height: 844 }],
                          ['desktop', { width: 1440, height: 900 }]]) {
  console.log(`\n════ ${nome} ${vp.width}×${vp.height} ════`);
  const ctx = await b.newContext({ viewport: vp, isMobile: vp.width < 700, hasTouch: vp.width < 700 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('response', r => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });

  /* ── ci porta, e ci porta in fretta ─────────────────────────────── */
  const t0 = Date.now();
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.waitForURL(/\/v2\//, { timeout: 5000 }).catch(() => {});
  const quanto = Date.now() - t0;
  dice(/\/v2\//.test(p.url()), `dalla radice si finisce nel sito (${p.url().replace(BASE, '')})`);
  /* compreso il carico del sito, che e' la parte grossa: qui conta che
     non ci sia un'attesa messa apposta prima del rimando */
  dice(quanto < 5000, `e ci si arriva in ${quanto} ms, carico del sito compreso`);
  await p.waitForTimeout(1800);
  dice(await p.evaluate(() => !!document.getElementById('main')), 'il sito e\u2019 quello vero, con le sue sezioni');

  /* ── e non si resta incastrati ──────────────────────────────────── */
  await p.goBack({ waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(900);
  const dopoIndietro = p.url();
  /* Con replace() la radice non lascia traccia nella cronologia, quindi
     tornando indietro si esce dal sito — qui prima non c'era niente, e
     infatti si finisce sulla pagina vuota di partenza. Se invece si
     tornasse su /v2/ vorrebbe dire che la radice c'e' ancora e ha
     rimandato avanti un'altra volta: da li' non si uscirebbe piu'. */
  dice(!dopoIndietro.includes('/v2/'),
       `il tasto indietro esce, non rimbalza dentro (${dopoIndietro.replace(BASE, '') || 'pagina vuota'})`);
  await ctx.close();

  /* ── senza JavaScript ───────────────────────────────────────────── */
  const muto = await b.newContext({ viewport: vp, javaScriptEnabled: false });
  const pm = await muto.newPage();
  await pm.goto(BASE + '/', { waitUntil: 'load' });
  await pm.waitForURL(/\/v2\//, { timeout: 6000 }).catch(() => {});
  dice(/\/v2\//.test(pm.url()),
       `senza JavaScript ci porta lo stesso (${pm.url().replace(BASE, '')})`);
  /* Il ripiego scritto va cercato nella SORGENTE della radice, non
     nella pagina che si sta guardando: quando arrivo a leggerla sono
     gia' nel sito, e leggerei il testo del sito credendo che sia il
     suo. La prima versione faceva esattamente questo, e passava
     dicendo una cosa che non aveva misurato. */
  const sorgente = await (await fetch(BASE + '/index.html')).text();
  dice(sorgente.includes('href="v2/index.html"') && /meta http-equiv="refresh"/i.test(sorgente),
       'e chi non viene portato da nessuno dei due trova il collegamento scritto');
  await muto.close();

  /* ── la torre non e' sparita, e il bivio nemmeno ────────────────── */
  const ctx2 = await b.newContext({ viewport: vp });
  const p2 = await ctx2.newPage();
  const torre = await p2.goto(BASE + '/pixel/index.html', { waitUntil: 'domcontentloaded' });
  dice(torre.status() === 200, `la torre risponde al suo indirizzo (${torre.status()})`);
  const scelta = await p2.goto(BASE + '/scelta.html', { waitUntil: 'domcontentloaded' });
  const porte = await p2.evaluate(() => [...document.querySelectorAll('.porta')]
    .map(a => a.getAttribute('href')));
  dice(scelta.status() === 200 && porte.length === 2,
       `il bivio e\u2019 conservato e intero (${porte.join(', ')})`);
  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx2.close();
}

await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\nla radice porta dritta al sito');
process.exitCode = rotte ? 1 : 0;
