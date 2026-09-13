/* ═══════════════════════════════════════════════════════════════════
 * IL CASO UNION ENERGIA
 *
 * Il controllo che conta piu' di tutti e' il primo: APRENDO LA PAGINA
 * NON DEVE SCARICARSI NEMMENO UN BYTE DI VIDEO. I nove pezzi pesano
 * 34,6 MB ricodificati; se partissero da soli, chi apre il sito da un
 * telefono in giro pagherebbe 34 MB per leggere due righe. La pagina
 * mette una copertina e un bottone, e il video nasce al clic.
 *
 * Poi: che al clic parta davvero, che facendone partire un secondo il
 * primo torni copertina (due video che parlano insieme non sono una
 * scelta), che il blocco stia nella sezione dei lavori e cominci nel
 * primo terzo della pagina — prima era al 65%, dopo il modulo del
 * brief — che le copertine abbiano tutte il loro file, e che il lime
 * del cliente non si mescoli col verde del sito quando si cambia
 * palette.
 *
 * uso: node audit/union.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html?probe=1';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
         '--autoplay-policy=no-user-gesture-required'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

for (const [nome, vp, dito] of [['telefono', { width: 390, height: 844 }, true],
                                ['desktop', { width: 1440, height: 900 }, false]]) {
  console.log(`\n════ ${nome} ${vp.width}×${vp.height} ════`);
  const ctx = await b.newContext({ viewport: vp, isMobile: dito, hasTouch: dito });
  const p = await ctx.newPage();
  const errs = [];
  const scaricato = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('response', r => {
    if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url().split('/').pop());
    if (/\.(mp4|webm|mov)(\?|$)/i.test(r.url())) scaricato.push(r.url().split('/').pop());
  });
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2300);

  /* ── niente video al carico, nemmeno scorrendo tutto ────────────── */
  const alto = await p.evaluate(() => innerHeight);
  const fondo = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < fondo; y += Math.round(alto * 0.7)) {
    await p.evaluate(v => scrollTo(0, v), y);
    await p.waitForTimeout(120);
  }
  await p.waitForTimeout(600);
  dice(scaricato.length === 0,
       `aprendo e scorrendo tutta la pagina non si scarica un byte di video${scaricato.length ? ' — ' + scaricato.slice(0, 2).join(', ') : ''}`);

  /* ── dove sta, e quanti pezzi ci sono ───────────────────────────── */
  const dove = await p.evaluate(() => {
    const u = document.querySelector('.union');
    if (!u) return null;
    const sez = u.closest('#main > section');
    const tutte = [...document.querySelectorAll('#main > section')];
    const titolo = document.getElementById('contT');
    return {
      sezione: sez.id,
      /* quanto in basso comincia il primo lavoro vero: era al 65% della
         pagina, dentro i contatti, dopo il modulo del brief */
      quota: Math.round((u.getBoundingClientRect().top + scrollY) * 100 / document.body.scrollHeight),
      primaDelTitolo: !!titolo && (u.compareDocumentPosition(titolo) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      pezzi: document.querySelectorAll('.union__pezzo').length,
      claim: (document.querySelector('.union__claim') || {}).textContent || '',
      lama: !!document.querySelector('.union__davide img'),
    };
  });
  dice(!!dove && dove.sezione === 'lavori', `il blocco sta nella sezione dei lavori (${dove?.sezione})`);
  dice(dove && dove.quota <= 42, `e comincia nel primo terzo della pagina, prima era al 65% (${dove?.quota}%)`);
  dice(dove && dove.pezzi === 9, `ci sono tutti e nove i pezzi (${dove?.pezzi})`);
  dice(dove && /uniti si vince/i.test(dove.claim), `il payoff c\u2019e\u2019: "${dove?.claim}"`);
  dice(dove && dove.lama, 'e il lama pure');

  /* ── le copertine ci sono tutte ─────────────────────────────────── */
  const fermi = await p.evaluate(async () => {
    const male = [];
    for (const i of document.querySelectorAll('.union__fermo')) {
      if (!i.complete) await new Promise(r => { i.onload = i.onerror = r; });
      if (!i.naturalWidth) male.push(i.getAttribute('src'));
    }
    return male;
  });
  dice(fermi.length === 0, `le nove copertine si vedono tutte${fermi.length ? ' — manca ' + fermi[0] : ''}`);

  /* ── col pollice ────────────────────────────────────────────────── */
  if (dito) {
    const piccoli = await p.evaluate(() => [...document.querySelectorAll('.union__via')]
      .map(e => Math.round(e.getBoundingClientRect().height)).filter(h => h < 44).length);
    dice(piccoli === 0, 'i bottoni dei video si prendono col pollice');
  }

  /* ── al clic parte, e uno alla volta ────────────────────────────── */
  await p.evaluate(() => document.querySelector('.union__lavori')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(300);
  await p.click('.union__pezzo:nth-child(1) .union__via');
  await p.waitForTimeout(1400);
  const primo = await p.evaluate(() => {
    const v = document.querySelector('.union__pezzo:nth-child(1) video');
    return v ? { c: v.currentTime, src: v.currentSrc.split('/').pop(), fermo: v.paused } : null;
  });
  dice(!!primo, 'al clic nasce il video');
  dice(primo && scaricato.length > 0, `e adesso il file parte davvero (${scaricato[0] || '—'})`);
  dice(primo && !primo.fermo, 'ed e\u2019 in riproduzione');

  await p.click('.union__pezzo:nth-child(2) .union__via');
  await p.waitForTimeout(1200);
  const dopo = await p.evaluate(() => ({
    uno: !!document.querySelector('.union__pezzo:nth-child(1) video'),
    due: !!document.querySelector('.union__pezzo:nth-child(2) video'),
    quanti: [...document.querySelectorAll('.union__lavori video')].filter(v => !v.paused).length,
  }));
  dice(dopo.due && !dopo.uno, 'aprendo il secondo, il primo torna copertina');
  dice(dopo.quanti <= 1, `ne suona uno solo per volta (${dopo.quanti})`);

  /* ── il lime del cliente non si mescola col verde del sito ──────── */
  const colori = await p.evaluate(() => {
    const prima = getComputedStyle(document.querySelector('.union__claim')).backgroundColor;
    document.querySelector('[data-pal-veloce="magenta"]').click();
    const dopo = getComputedStyle(document.querySelector('.union__claim')).backgroundColor;
    return { prima, dopo };
  });
  dice(colori.prima === colori.dopo,
       `cambiando palette il marchio del cliente resta il suo (${colori.dopo})`);

  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\nil caso Union Energia regge');
process.exitCode = rotte ? 1 : 0;
