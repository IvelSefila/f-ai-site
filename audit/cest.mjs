/* ═══════════════════════════════════════════════════════════════════
 * IL CASO STUDIO CETS
 *
 * Stessa regola degli altri tre: aprendo la pagina non si scarica
 * nemmeno un byte di video. Qui i sei pezzi pesano 16 MB.
 *
 * Due cose che questo caso ha e gli altri no.
 *
 * La prima: adesso la lastra scura e' CONDIVISA con gli esoscheletri —
 * un blocco di regole solo, due gruppi di sigle di colore. Quindi qui si
 * misura anche che le sigle arrivino davvero: se un giorno qualcuno
 * cancella il gruppo .cest, le regole continuano a valere ma tutte le
 * sigle diventano vuote e la lastra esce nera su nera senza che nessun
 * errore lo dica. Il controllo guarda che il fondo sia il blu del
 * marchio e che il testo ci stacchi sopra.
 *
 * La seconda: qui l'ultimo pezzo e' il penultimo rifatto in un altro
 * formato. Sono le due uniche copertine che condividono il soggetto, e
 * devono restare due schede diverse — se una delle due sparisse, la
 * griglia non se ne accorgerebbe.
 *
 * uso: node audit/cest.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html?probe=1';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
         '--autoplay-policy=no-user-gesture-required'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

/* il rapporto di contrasto fra due colori letti dal browser */
const cifre = (s) => (s.match(/[\d.]+/g) || []).map(Number);
const chiarore = (c) => {
  const v = c.map(x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; });
  return .2126 * v[0] + .7152 * v[1] + .0722 * v[2];
};
const rapporto = (a, b) => {
  const [x, y] = [chiarore(a), chiarore(b)].sort((m, n) => n - m);
  return (x + .05) / (y + .05);
};

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
    if (/\/cest\/.*\.(mp4|webm|mov)(\?|$)/i.test(r.url())) scaricato.push(r.url().split('/').pop());
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

  /* ── dove sta, e cosa c'e' dentro ───────────────────────────────── */
  const dove = await p.evaluate(() => {
    const e = document.querySelector('.cest');
    if (!e) return null;
    const l = document.querySelector('.locanda');
    const dopo = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    return {
      sezione: e.closest('#main > section').id,
      quota: Math.round((e.getBoundingClientRect().top + scrollY) * 100 / document.body.scrollHeight),
      dopoLocanda: !!l && dopo(l, e),
      pezzi: document.querySelectorAll('.cest__pezzo').length,
      marchio: !!document.querySelector('.cest__figura img'),
      claim: (document.querySelector('.cest__claim') || {}).textContent || '',
      titoli: [...document.querySelectorAll('.cest__pezzo h4')].map(h => h.textContent),
      scaletta: !!document.querySelector('.cest__lavori .scaletta'),
    };
  });
  dice(!!dove && dove.sezione === 'lavori', `il blocco sta nella sezione dei lavori (${dove?.sezione})`);
  /* E' il quarto di quattro casi, quindi non puo' stare a meta' pagina:
     comincia dove finisce il terzo. La soglia dice un'altra cosa — che
     tutta la fila dei lavori resta nei primi due terzi, cioe' che il
     visitatore incontra il lavoro vero prima di arrivare al fondo. */
  dice(dove && dove.quota <= 66, `la fila dei lavori resta nei primi due terzi (${dove?.quota}%)`);
  dice(dove && dove.dopoLocanda, 'dopo la Locanda, ultimo dei quattro casi');
  dice(dove && dove.pezzi === 6, `ci sono tutti e sei i pezzi (${dove?.pezzi})`);
  dice(dove && !dove.scaletta, 'la scaletta per chi non ha JS e\u2019 stata sostituita');
  dice(dove && dove.marchio, 'il marchio si vede');
  dice(dove && /cambia passo/i.test(dove.claim),
       `il payoff del marchio c\u2019e\u2019: "${(dove?.claim || '').trim()}"`);
  /* il marchio in due formati: due schede distinte, stesso soggetto */
  const duo = (dove?.titoli || []).filter(t => /marchio|verticale/i.test(t));
  dice(duo.length === 2, `il marchio c\u2019e\u2019 in tutti e due i formati (${duo.length})`);

  /* ── le sigle di colore arrivano davvero ────────────────────────── */
  const tinte = await p.evaluate(() => {
    const s = document.querySelector('.cest__slab');
    const t = document.querySelector('.cest__testa h3');
    const c = document.querySelector('.cest__conti b');
    return {
      fondo: getComputedStyle(s).backgroundImage,
      titolo: getComputedStyle(t).color,
      numero: getComputedStyle(c).color,
      /* il fondo e' un gradiente: il colore di partenza sta scritto dentro */
      etichetta: getComputedStyle(document.querySelector('.cest__sotto span')).color,
    };
  });
  const dentro = cifre(tinte.fondo.split('rgb').slice(1, 3).join(' '));
  dice(dentro.length >= 6 && dentro[2] > dentro[0],
       `la lastra e\u2019 blu e non nera (${tinte.fondo.slice(0, 54)}…)`);
  const blu = dentro.slice(0, 3);
  dice(rapporto(cifre(tinte.titolo), blu) >= 4.5,
       `il titolo stacca sul blu (${rapporto(cifre(tinte.titolo), blu).toFixed(1)}:1)`);
  dice(rapporto(cifre(tinte.etichetta), blu) >= 4.5,
       `e l\u2019acciaio delle etichette pure (${rapporto(cifre(tinte.etichetta), blu).toFixed(1)}:1)`);

  /* ── le copertine, e nessuna tagliata ───────────────────────────── */
  const fermi = await p.evaluate(async () => {
    const male = [], tagliate = [];
    for (const i of document.querySelectorAll('.cest__fermo')) {
      if (!i.complete) await new Promise(r => { i.onload = i.onerror = r; });
      if (!i.naturalWidth) { male.push(i.getAttribute('src')); continue; }
      /* con object-fit:contain l'immagine sta DENTRO il riquadro e
         mantiene le sue proporzioni: se cosi' non fosse, una delle due
         misure sarebbe piu' grande del riquadro */
      const r = i.getBoundingClientRect();
      const q = i.naturalWidth / i.naturalHeight;
      const dis = Math.min(r.width, r.height * q);
      if (dis > r.width + 1 || dis / q > r.height + 1) tagliate.push(i.getAttribute('src'));
    }
    return { male, tagliate };
  });
  dice(fermi.male.length === 0, `le sei copertine si vedono tutte${fermi.male.length ? ' — manca ' + fermi.male[0] : ''}`);
  dice(fermi.tagliate.length === 0,
       `nessuna copertina e\u2019 ritagliata${fermi.tagliate.length ? ' — ' + fermi.tagliate[0] : ''}`);

  if (dito) {
    const piccoli = await p.evaluate(() => [...document.querySelectorAll('.cest__via')]
      .map(e => Math.round(e.getBoundingClientRect().height)).filter(h => h < 44).length);
    dice(piccoli === 0, 'i bottoni si prendono col pollice');
  }

  /* ── al clic parte, e uno alla volta ────────────────────────────── */
  await p.evaluate(() => document.querySelector('.cest__lavori')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(300);
  await p.click('.cest__pezzo:nth-child(1) .cest__via');
  await p.waitForTimeout(1400);
  const primo = await p.evaluate(() => {
    const v = document.querySelector('.cest__pezzo:nth-child(1) video');
    return v ? { src: v.currentSrc.split('/').pop(), fermo: v.paused } : null;
  });
  dice(!!primo, 'al clic nasce il video');
  dice(primo && scaricato.length > 0, `e adesso il file parte davvero (${scaricato[0] || '—'})`);
  dice(primo && !primo.fermo, 'ed e\u2019 in riproduzione');

  await p.click('.cest__pezzo:nth-child(2) .cest__via');
  await p.waitForTimeout(1100);
  const dopo = await p.evaluate(() => ({
    uno: !!document.querySelector('.cest__pezzo:nth-child(1) video'),
    due: !!document.querySelector('.cest__pezzo:nth-child(2) video'),
    quanti: [...document.querySelectorAll('.cest__lavori video')].filter(v => !v.paused).length,
  }));
  dice(dopo.due && !dopo.uno, 'aprendo il secondo, il primo torna copertina');
  dice(dopo.quanti <= 1, `ne suona uno solo per volta (${dopo.quanti})`);

  /* ── e non suona insieme agli altri tre casi ────────────────────── */
  await p.evaluate(() => document.querySelector('.eso__lavori')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(250);
  await p.click('.eso__pezzo:nth-child(1) .eso__via');
  await p.waitForTimeout(1200);
  const insieme = await p.evaluate(() =>
    [...document.querySelectorAll('.union__lavori video, .eso__lavori video, .locanda__lavori video, .cest__lavori video')]
      .filter(v => !v.paused).length);
  dice(insieme <= 1, `aprendo un pezzo di un altro caso, qui si ferma (${insieme} in onda)`);

  /* ── i colori del cliente non seguono la palette del sito ───────── */
  const colori = await p.evaluate(() => {
    const leggi = () => getComputedStyle(document.querySelector('.cest__slab')).backgroundImage;
    const prima = leggi();
    document.querySelector('[data-pal-veloce="magenta"]').click();
    return { prima, dopo: leggi() };
  });
  dice(colori.prima === colori.dopo, 'cambiando palette la lastra del marchio resta la sua');

  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\nil caso Studio CETS regge');
process.exitCode = rotte ? 1 : 0;
