/* ═══════════════════════════════════════════════════════════════════
 * IL CASO LA LOCANDA DEL CASTELLO
 *
 * Come per Union Energia, il controllo che conta piu' di tutti e' il
 * primo: aprendo la pagina non deve scaricarsi nemmeno un byte di video
 * o di musica. Qui i pezzi sono 29 MB fra nove locandine e cinque
 * brani; se partissero da soli, chi apre il sito da un telefono in giro
 * pagherebbe 29 MB per leggere due righe.
 *
 * Poi la cosa che questo blocco ha e Union no: la musica. Un brano e un
 * video che suonano insieme non sono una scelta, e non basta fermare i
 * video fra loro — il brano deve fermare il video e il video il brano.
 *
 * uso: node audit/locanda.mjs
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
    if (/\.(mp4|webm|mov|m4a|mp3)(\?|$)/i.test(r.url())) scaricato.push(r.url().split('/').pop());
  });
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2300);

  /* ── niente byte pesanti al carico, nemmeno scorrendo tutto ─────── */
  const alto = await p.evaluate(() => innerHeight);
  const fondo = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < fondo; y += Math.round(alto * 0.7)) {
    await p.evaluate(v => scrollTo(0, v), y);
    await p.waitForTimeout(110);
  }
  await p.waitForTimeout(600);
  dice(scaricato.length === 0,
       `aprendo e scorrendo tutta la pagina non parte ne' un video ne' un brano${scaricato.length ? ' — ' + scaricato.slice(0, 2).join(', ') : ''}`);

  /* ── dove sta e cosa contiene ───────────────────────────────────── */
  const dove = await p.evaluate(() => {
    const l = document.querySelector('.locanda');
    if (!l) return null;
    const sez = l.closest('#main > section');
    const u = document.querySelector('.union');
    const titolo = document.getElementById('contT');
    return {
      sezione: sez.id,
      dopoUnion: !!u && (u.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      primaDelTitolo: !!titolo && (l.compareDocumentPosition(titolo) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      pezzi: document.querySelectorAll('.locanda__pezzo').length,
      brani: document.querySelectorAll('.locanda__brano').length,
      marchio: !!document.querySelector('.locanda__marchio img'),
      claim: (document.querySelector('.locanda__claim') || {}).textContent || '',
    };
  });
  dice(!!dove && dove.sezione === 'contatto', 'il blocco sta nella sezione del contatto');
  dice(dove && dove.dopoUnion, 'dopo Union Energia');
  dice(dove && dove.primaDelTitolo, 'e prima di come mettersi in contatto');
  dice(dove && dove.pezzi === 9, `ci sono tutte e nove le locandine (${dove?.pezzi})`);
  dice(dove && dove.brani === 5, `e i cinque brani (${dove?.brani})`);
  dice(dove && dove.marchio, 'il marchio si vede');
  dice(dove && /tradizione e' servita|tradizione è servita/i.test(dove.claim),
       `il payoff del cliente c\u2019e\u2019: "${(dove?.claim || '').trim()}"`);

  /* ── le copertine ci sono tutte ─────────────────────────────────── */
  const fermi = await p.evaluate(async () => {
    const male = [];
    for (const i of document.querySelectorAll('.locanda__fermo')) {
      if (!i.complete) await new Promise(r => { i.onload = i.onerror = r; });
      if (!i.naturalWidth) male.push(i.getAttribute('src'));
    }
    return male;
  });
  dice(fermi.length === 0, `le nove copertine si vedono tutte${fermi.length ? ' — manca ' + fermi[0] : ''}`);

  /* ── i titoli di una riga vanno a filo ──────────────────────────── */
  const quote = await p.evaluate(() => {
    const t = [...document.querySelectorAll('.locanda__pezzo h4')]
      .map(e => Math.round(e.getBoundingClientRect().top));
    const righe = new Map();
    for (const y of t) {
      let chiave = [...righe.keys()].find(k => Math.abs(k - y) < 30);
      if (chiave === undefined) chiave = y;
      righe.set(chiave, (righe.get(chiave) || 0) + 1);
    }
    /* quanto si discostano i titoli che stanno sulla stessa riga */
    let peggio = 0;
    for (const k of righe.keys()) {
      for (const y of t) if (Math.abs(k - y) < 30) peggio = Math.max(peggio, Math.abs(k - y));
    }
    return peggio;
  });
  dice(quote <= 2, `i titoli di una stessa riga partono alla stessa quota (scarto ${quote}px)`);

  /* ── col pollice ────────────────────────────────────────────────── */
  if (dito) {
    const piccoli = await p.evaluate(() =>
      [...document.querySelectorAll('.locanda__via, .locanda__suona')]
        .map(e => Math.round(e.getBoundingClientRect().height)).filter(h => h < 44).length);
    dice(piccoli === 0, 'bottoni dei video e dei brani si prendono col pollice');
  }

  /* ── al clic parte il video, e uno alla volta ───────────────────── */
  await p.evaluate(() => document.querySelector('.locanda__lavori')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(300);
  await p.click('.locanda__pezzo:nth-child(1) .locanda__via');
  await p.waitForTimeout(1400);
  const primo = await p.evaluate(() => {
    const v = document.querySelector('.locanda__pezzo:nth-child(1) video');
    return v ? { src: v.currentSrc.split('/').pop(), fermo: v.paused } : null;
  });
  dice(!!primo, 'al clic nasce il video');
  dice(primo && scaricato.length > 0, `e adesso il file parte davvero (${scaricato[0] || '—'})`);
  dice(primo && !primo.fermo, 'ed e\u2019 in riproduzione');

  await p.click('.locanda__pezzo:nth-child(2) .locanda__via');
  await p.waitForTimeout(1100);
  const dopo = await p.evaluate(() => ({
    uno: !!document.querySelector('.locanda__pezzo:nth-child(1) video'),
    due: !!document.querySelector('.locanda__pezzo:nth-child(2) video'),
    quanti: [...document.querySelectorAll('.locanda__lavori video')].filter(v => !v.paused).length,
  }));
  dice(dopo.due && !dopo.uno, 'aprendo il secondo, il primo torna copertina');
  dice(dopo.quanti <= 1, `ne suona uno solo per volta (${dopo.quanti})`);

  /* ── il brano ferma il video, e il video ferma il brano ─────────── */
  await p.evaluate(() => document.querySelector('.locanda__brani')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(250);
  await p.click('.locanda__brano:nth-child(1) .locanda__suona');
  await p.waitForTimeout(1500);
  const conMusica = await p.evaluate(() => ({
    suona: document.querySelector('.locanda__brano:nth-child(1) .locanda__suona')
             .classList.contains('suona'),
    video: [...document.querySelectorAll('.locanda__lavori video')].filter(v => !v.paused).length,
  }));
  dice(conMusica.suona, 'il brano parte al clic');
  dice(conMusica.video === 0, 'e facendolo partire il video si ferma');
  dice(scaricato.some(n => /\.m4a$/.test(n)), `il file del brano arriva solo adesso (${scaricato.filter(n => /m4a/.test(n))[0] || '—'})`);

  await p.click('.locanda__brano:nth-child(2) .locanda__suona');
  await p.waitForTimeout(900);
  const due = await p.evaluate(() =>
    [...document.querySelectorAll('.locanda__suona')].filter(e => e.classList.contains('suona')).length);
  dice(due === 1, `ne suona uno solo per volta (${due})`);

  /* lo stesso bottone e' anche la pausa */
  await p.click('.locanda__brano:nth-child(2) .locanda__suona');
  await p.waitForTimeout(500);
  const fermo = await p.evaluate(() =>
    [...document.querySelectorAll('.locanda__suona')].filter(e => e.classList.contains('suona')).length);
  dice(fermo === 0, 'ripremendo lo stesso bottone il brano si mette in pausa');

  /* ── i colori del cliente non seguono la palette del sito ───────── */
  const colori = await p.evaluate(() => {
    const leggi = () => getComputedStyle(document.querySelector('.locanda__slab')).backgroundImage;
    const prima = leggi();
    document.querySelector('[data-pal-veloce="magenta"]').click();
    return { prima, dopo: leggi() };
  });
  dice(colori.prima === colori.dopo, 'cambiando palette il bordeaux della Locanda resta il suo');

  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\nil caso Locanda del Castello regge');
process.exitCode = rotte ? 1 : 0;
