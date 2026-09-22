/* ═══════════════════════════════════════════════════════════════════
 * IL CASO ESOSCHELETRI
 *
 * Stessa regola degli altri due: aprendo la pagina non si scarica
 * nemmeno un byte di video. Qui i sei pezzi pesano 14 MB.
 *
 * La cosa da controllare che gli altri due non hanno: qui orizzontali e
 * verticali stanno nella stessa griglia. La cornice e' 16:9 per tutti e
 * i verticali ci stanno dentro interi — se un giorno qualcuno cambia
 * "contain" in "cover", di uno spot verticale si vede la pancia e
 * spariscono il titolo e la data. Il controllo misura che dentro la
 * cornice ci sia tutta l'immagine, non un ritaglio.
 *
 * uso: node audit/eso.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
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

  const alto = await p.evaluate(() => innerHeight);
  const fondo = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < fondo; y += Math.round(alto * 0.7)) {
    await p.evaluate(v => scrollTo(0, v), y);
    await p.waitForTimeout(110);
  }
  await p.waitForTimeout(600);
  dice(scaricato.length === 0,
       `aprendo e scorrendo tutta la pagina non parte un video${scaricato.length ? ' — ' + scaricato.slice(0, 2).join(', ') : ''}`);

  /* ── dove sta, fra gli altri due ────────────────────────────────── */
  const dove = await p.evaluate(() => {
    const e = document.querySelector('.eso');
    if (!e) return null;
    const u = document.querySelector('.union');
    const l = document.querySelector('.locanda');
    const dopo = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    return {
      sezione: e.closest('#main > section').id,
      quota: Math.round((e.getBoundingClientRect().top + scrollY) * 100 / document.body.scrollHeight),
      dopoUnion: !!u && dopo(u, e),
      primaLocanda: !!l && dopo(e, l),
      pezzi: document.querySelectorAll('.eso__pezzo').length,
      dispositivo: !!document.querySelector('.eso__figura img'),
      tavola: !!document.querySelector('.eso__tavola img'),
      claim: (document.querySelector('.eso__claim') || {}).textContent || '',
    };
  });
  dice(!!dove && dove.sezione === 'lavori', `il blocco sta nella sezione dei lavori (${dove?.sezione})`);
  dice(dove && dove.quota <= 55, `nella prima meta' della pagina (${dove?.quota}%)`);
  dice(dove && dove.dopoUnion && dove.primaLocanda, 'fra Union Energia e la Locanda');
  dice(dove && dove.pezzi === 6, `ci sono tutti e sei i pezzi (${dove?.pezzi})`);
  dice(dove && dove.dispositivo, 'il dispositivo si vede');
  dice(dove && dove.tavola, 'e la tavola di riferimento pure');
  dice(dove && /cammina con te/i.test(dove.claim),
       `il payoff del marchio c\u2019e\u2019: "${(dove?.claim || '').trim()}"`);

  /* ── le copertine, e nessuna tagliata ───────────────────────────── */
  const fermi = await p.evaluate(async () => {
    const male = [], tagliate = [];
    for (const i of document.querySelectorAll('.eso__fermo')) {
      if (!i.complete) await new Promise(r => { i.onload = i.onerror = r; });
      if (!i.naturalWidth) { male.push(i.getAttribute('src')); continue; }
      /* con object-fit:contain l'immagine disegnata sta DENTRO il
         riquadro e mantiene le sue proporzioni: se cosi' non fosse,
         una delle due misure sarebbe piu' grande del riquadro */
      const r = i.getBoundingClientRect();
      const q = i.naturalWidth / i.naturalHeight;
      const dis = Math.min(r.width, r.height * q);
      const dish = dis / q;
      if (dis > r.width + 1 || dish > r.height + 1) tagliate.push(i.getAttribute('src'));
    }
    return { male, tagliate };
  });
  dice(fermi.male.length === 0, `le sei copertine si vedono tutte${fermi.male.length ? ' — manca ' + fermi.male[0] : ''}`);
  dice(fermi.tagliate.length === 0,
       `nessuna copertina e' ritagliata: verticali e orizzontali ci stanno dentro interi${fermi.tagliate.length ? ' — ' + fermi.tagliate[0] : ''}`);

  /* ── i titoli di una riga vanno a filo ──────────────────────────── */
  const scarto = await p.evaluate(() => {
    const t = [...document.querySelectorAll('.eso__pezzo h4')]
      .map(e => Math.round(e.getBoundingClientRect().top));
    let peggio = 0;
    for (const a of t) for (const b of t) if (Math.abs(a - b) < 30) peggio = Math.max(peggio, Math.abs(a - b));
    return peggio;
  });
  dice(scarto <= 2, `i titoli di una stessa riga partono alla stessa quota (scarto ${scarto}px)`);

  if (dito) {
    const piccoli = await p.evaluate(() => [...document.querySelectorAll('.eso__via')]
      .map(e => Math.round(e.getBoundingClientRect().height)).filter(h => h < 44).length);
    dice(piccoli === 0, 'i bottoni si prendono col pollice');
  }

  /* ── al clic parte, e uno alla volta ────────────────────────────── */
  await p.evaluate(() => document.querySelector('.eso__lavori')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(300);
  await p.click('.eso__pezzo:nth-child(1) .eso__via');
  await p.waitForTimeout(1400);
  const primo = await p.evaluate(() => {
    const v = document.querySelector('.eso__pezzo:nth-child(1) video');
    return v ? { src: v.currentSrc.split('/').pop(), fermo: v.paused } : null;
  });
  dice(!!primo, 'al clic nasce il video');
  dice(primo && scaricato.length > 0, `e adesso il file parte davvero (${scaricato[0] || '—'})`);
  dice(primo && !primo.fermo, 'ed e\u2019 in riproduzione');

  await p.click('.eso__pezzo:nth-child(2) .eso__via');
  await p.waitForTimeout(1100);
  const dopo = await p.evaluate(() => ({
    uno: !!document.querySelector('.eso__pezzo:nth-child(1) video'),
    due: !!document.querySelector('.eso__pezzo:nth-child(2) video'),
    quanti: [...document.querySelectorAll('.eso__lavori video')].filter(v => !v.paused).length,
  }));
  dice(dopo.due && !dopo.uno, 'aprendo il secondo, il primo torna copertina');
  dice(dopo.quanti <= 1, `ne suona uno solo per volta (${dopo.quanti})`);

  /* ── i colori del prodotto non seguono la palette del sito ──────── */
  const colori = await p.evaluate(() => {
    const leggi = () => getComputedStyle(document.querySelector('.eso__slab')).backgroundImage;
    const prima = leggi();
    document.querySelector('[data-pal-veloce="magenta"]').click();
    return { prima, dopo: leggi() };
  });
  dice(colori.prima === colori.dopo, 'cambiando palette la lastra del prodotto resta la sua');

  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\nil caso esoscheletri regge');
process.exitCode = rotte ? 1 : 0;
