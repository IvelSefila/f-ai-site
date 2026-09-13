/* ═══════════════════════════════════════════════════════════════════
 * REVISIONE GENERALE — si cercano i guai, non le conferme
 *
 * Gli altri controlli guardano ognuno una cosa e la guardano bene.
 * Questo fa il contrario: passa su tutto il sito una volta sola e cerca
 * le crepe che stanno FRA le cose — un link che non porta da nessuna
 * parte, un id scritto due volte, un video di un caso che suona insieme
 * alla musica di un altro, un bottone senza nome, una pagina che a JS
 * spento resta vuota.
 *
 * Non sostituisce niente. Serve a trovare quello che nessuno ha ancora
 * pensato di controllare.
 *
 * uso: node audit/revisione.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:8899';
const SITO = BASE + '/v2/index.html';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
         '--autoplay-policy=no-user-gesture-required'] });

const guai = [];
const rotto = (dove, che) => { guai.push(`${dove} · ${che}`); console.log(`  ✗ ${che}`); };
const bene = (che) => console.log(`  ✓ ${che}`);
const titolo = (t) => console.log(`\n──── ${t} ────`);

/* ══ 1 · le pagine rispondono ═══════════════════════════════════════ */
titolo('le pagine di partenza');
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  for (const via of ['/', '/index.html', '/v2/index.html', '/scelta.html', '/pixel/index.html']) {
    const r = await p.goto(BASE + via, { waitUntil: 'domcontentloaded' }).catch(() => null);
    if (!r || r.status() >= 400) rotto('pagine', `${via} risponde ${r ? r.status() : 'niente'}`);
    else bene(`${via} → ${r.status()}${p.url() !== BASE + via ? ' → ' + p.url().replace(BASE, '') : ''}`);
  }
  await ctx.close();
}

/* ══ 2 · niente rotto nel carico, a due misure ══════════════════════ */
for (const [nome, vp, dito] of [['telefono', { width: 390, height: 844 }, true],
                                ['desktop', { width: 1440, height: 900 }, false]]) {
  titolo(`carico e integrita' · ${nome}`);
  const ctx = await b.newContext({ viewport: vp, isMobile: dito, hasTouch: dito });
  const p = await ctx.newPage();
  const errs = [], http = [], console4 = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  p.on('console', m => { if (m.type() === 'error') console4.push(m.text().slice(0, 120)); });
  p.on('response', r => { if (r.status() >= 400) http.push(r.status() + ' ' + r.url().replace(BASE, '')); });
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);
  /* si scorre tutto: le immagini pigre nascono solo cosi' */
  const h = await p.evaluate(() => document.body.scrollHeight);
  const v = await p.evaluate(() => innerHeight);
  for (let y = 0; y < h; y += Math.round(v * 0.6)) {
    await p.evaluate(t => scrollTo(0, t), y);
    await p.waitForTimeout(90);
  }
  await p.waitForTimeout(900);

  errs.length ? rotto(nome, `${errs.length} errori JS: ${errs[0]}`) : bene('nessun errore JS');
  http.length ? rotto(nome, `${http.length} richieste fallite: ${http.slice(0, 3).join(' | ')}`)
              : bene('nessuna richiesta fallita');
  console4.length ? rotto(nome, `${console4.length} console.error: ${console4[0]}`)
                  : bene('niente in console.error');

  /* immagini che non si sono caricate */
  const brutte = await p.evaluate(() => [...document.images]
    .filter(i => i.complete && !i.naturalWidth && i.getAttribute('src'))
    .map(i => i.getAttribute('src')));
  brutte.length ? rotto(nome, `${brutte.length} immagini vuote: ${brutte[0]}`)
                : bene(`tutte le ${await p.evaluate(() => document.images.length)} immagini si vedono`);

  /* scroll orizzontale */
  const largo = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  largo ? rotto(nome, 'la pagina scorre in orizzontale') : bene('niente scroll orizzontale');

  await ctx.close();
}

/* ══ 3 · struttura: id, ancore, nomi ════════════════════════════════ */
titolo('struttura del documento');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);

  const s = await p.evaluate(() => {
    const conta = {};
    for (const e of document.querySelectorAll('[id]')) conta[e.id] = (conta[e.id] || 0) + 1;
    const doppi = Object.entries(conta).filter(([, n]) => n > 1).map(([k]) => k);

    const ancoreMorte = [...document.querySelectorAll('a[href^="#"]')]
      .map(a => a.getAttribute('href')).filter(h => h.length > 1)
      .filter(h => !document.getElementById(decodeURIComponent(h.slice(1))))
      .filter((v, i, a) => a.indexOf(v) === i);

    const ariaMorto = [];
    for (const e of document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')) {
      for (const att of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
        const v = e.getAttribute(att);
        if (!v) continue;
        for (const id of v.split(/\s+/)) if (id && !document.getElementById(id)) ariaMorto.push(att + '="' + id + '"');
      }
    }

    const senzaAlt = [...document.images].filter(i => !i.hasAttribute('alt'))
      .map(i => i.getAttribute('src'));

    const muti = [];
    for (const e of document.querySelectorAll('button,a[href],[role="button"],[role="tab"]')) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const nome = (e.getAttribute('aria-label') || e.textContent || '').trim()
                || (e.querySelector('img') ? e.querySelector('img').alt : '')
                || e.getAttribute('title') || '';
      if (!nome) muti.push(e.tagName + '.' + (e.className || '').toString().split(' ')[0]);
    }

    /* i titoli: h1 uno solo, e nessun salto di livello */
    const liv = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(e => +e.tagName[1]);
    const salti = [];
    for (let i = 1; i < liv.length; i++) if (liv[i] - liv[i - 1] > 1) salti.push(liv[i - 1] + '→' + liv[i]);

    return { doppi, ancoreMorte, ariaMorto, senzaAlt, muti,
             h1: document.querySelectorAll('h1').length, salti,
             lang: document.documentElement.lang,
             titolo: (document.title || '').length,
             descr: (document.querySelector('meta[name=description]') || {}).content?.length || 0,
             canonico: !!document.querySelector('link[rel=canonical]'),
             og: !!document.querySelector('meta[property="og:image"]') };
  });

  s.doppi.length ? rotto('struttura', `id ripetuti: ${s.doppi.join(', ')}`) : bene('nessun id ripetuto');
  s.ancoreMorte.length ? rotto('struttura', `ancore che non portano da nessuna parte: ${s.ancoreMorte.join(', ')}`)
                       : bene('tutte le ancore interne arrivano da qualche parte');
  s.ariaMorto.length ? rotto('struttura', `aria che punta a id inesistenti: ${s.ariaMorto.join(', ')}`)
                     : bene('nessun aria appeso nel vuoto');
  s.senzaAlt.length ? rotto('struttura', `${s.senzaAlt.length} immagini senza alt: ${s.senzaAlt[0]}`)
                    : bene('tutte le immagini hanno un alt');
  s.muti.length ? rotto('struttura', `${s.muti.length} controlli senza nome: ${s.muti.slice(0, 3).join(', ')}`)
                : bene('tutti i controlli hanno un nome');
  s.h1 === 1 ? bene('un solo h1') : rotto('struttura', `h1 presenti: ${s.h1}`);
  s.salti.length ? rotto('struttura', `salti di livello nei titoli: ${s.salti.join(', ')}`)
                 : bene('nessun salto nei livelli dei titoli');
  s.lang ? bene(`lang="${s.lang}"`) : rotto('struttura', 'manca lang sull\u2019html');
  s.titolo > 10 && s.titolo < 70 ? bene(`title di ${s.titolo} battute`)
                                 : rotto('struttura', `title di ${s.titolo} battute`);
  s.descr > 50 ? bene(`description di ${s.descr} battute`) : rotto('struttura', `description di ${s.descr} battute`);
  s.canonico ? bene('canonical presente') : rotto('struttura', 'manca il canonical');
  s.og ? bene('og:image presente') : rotto('struttura', 'manca og:image');

  await ctx.close();
}

/* ══ 4 · i tre casi non devono suonare insieme ══════════════════════ */
titolo('i tre casi, insieme');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(SITO + '?probe=1', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2200);

  const apri = async (sel) => {
    await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), sel);
    await p.waitForTimeout(250);
    await p.click(sel);
    await p.waitForTimeout(1300);
  };

  await apri('.union__pezzo:nth-child(1) .union__via');
  await apri('.eso__pezzo:nth-child(1) .eso__via');
  let quanti = await p.evaluate(() =>
    [...document.querySelectorAll('video')].filter(v => !v.paused && !v.muted).length);
  quanti <= 1 ? bene('un video di Union e uno di Esoscheletri: ne suona uno solo')
              : rotto('casi', `Union ed Esoscheletri suonano insieme (${quanti} video in riproduzione)`);

  /* aprendo il secondo, il primo deve tornare COPERTINA: per un po' il
     video veniva tolto e basta, e la scheda restava un titolo con due
     righe di testo, senza immagine e senza modo di riaprirla. */
  const tornata = await p.evaluate(() => {
    const a = document.querySelector('.union__pezzo:nth-child(1)');
    return { bottone: !!a.querySelector('.union__via'), img: !!a.querySelector('img') };
  });
  (tornata.bottone && tornata.img) ? bene('la scheda lasciata indietro torna copertina')
    : rotto('casi', 'la scheda lasciata indietro resta senza copertina e non si puo’ riaprire');

  await apri('.locanda__pezzo:nth-child(1) .locanda__via');
  quanti = await p.evaluate(() =>
    [...document.querySelectorAll('video')].filter(v => !v.paused && !v.muted).length);
  quanti <= 1 ? bene('aggiungendo la Locanda, ne suona sempre uno solo')
              : rotto('casi', `tre casi aperti, ${quanti} video in riproduzione insieme`);

  /* e la musica della Locanda sopra un video di un altro caso */
  await apri('.union__pezzo:nth-child(2) .union__via');
  await p.evaluate(() => document.querySelector('.locanda__brani')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(250);
  await p.click('.locanda__brano:nth-child(1) .locanda__suona');
  await p.waitForTimeout(1500);
  const insieme = await p.evaluate(() => ({
    video: [...document.querySelectorAll('video')].filter(v => !v.paused).length,
    musica: document.querySelectorAll('.locanda__suona.suona').length,
  }));
  (insieme.video === 0 || insieme.musica === 0)
    ? bene('la canzone della Locanda ferma il video degli altri casi')
    : rotto('casi', `canzone e video insieme: ${insieme.video} video + ${insieme.musica} brano`);

  await ctx.close();
}

/* ══ 5 · tastiera e finestre ════════════════════════════════════════ */
titolo('tastiera');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);

  /* si cammina col tabulatore e si guarda dove si finisce */
  const invisibili = [];
  for (let i = 0; i < 70; i++) {
    await p.keyboard.press('Tab');
    const dove = await p.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const r = a.getBoundingClientRect();
      const cs = getComputedStyle(a);
      return { tag: a.tagName, cls: (a.className || '').toString().split(' ')[0],
               vis: cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && r.height > 0 };
    });
    if (dove && !dove.vis) invisibili.push(dove.tag + '.' + dove.cls);
  }
  invisibili.length ? rotto('tastiera', `il fuoco finisce su ${invisibili.length} elementi invisibili: ${invisibili[0]}`)
                    : bene('settanta tabulazioni, il fuoco non finisce mai nel vuoto');

  /* la finestra di uno strumento: si apre, si chiude con Esc, il fuoco torna */
  await p.evaluate(() => document.querySelector('.stack__grid button')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(300);
  await p.click('.stack__grid button');
  await p.waitForTimeout(500);
  const aperta = await p.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    return d ? { c: d.contains(document.activeElement) } : null;
  });
  aperta ? bene('la finestra di uno strumento si apre') : rotto('tastiera', 'la finestra dello strumento non si apre');
  if (aperta) {
    aperta.c ? bene('e il fuoco entra dentro') : rotto('tastiera', 'il fuoco resta fuori dalla finestra aperta');
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);
    const chiusa = await p.evaluate(() => !document.querySelector('dialog[open]'));
    chiusa ? bene('Esc la chiude') : rotto('tastiera', 'Esc non chiude la finestra');
    const tornato = await p.evaluate(() => document.activeElement &&
      document.activeElement.closest('.stack__grid') !== null);
    tornato ? bene('e il fuoco torna dove stava') : rotto('tastiera', 'il fuoco non torna al bottone di partenza');
  }
  await ctx.close();
}

/* ══ 6 · quello che uno cambia, resta ═══════════════════════════════ */
titolo('memoria del browser');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  /* --acc non esiste: la palette si legge su data-palette e sul valore
     di --em. La prima versione di questo controllo confrontava due
     stringhe vuote e diceva sempre di si'. */
  const prima = await p.evaluate(() => {
    document.querySelector('[data-pal-veloce="magenta"]').click();
    return { nome: document.documentElement.dataset.palette,
             em: getComputedStyle(document.documentElement).getPropertyValue('--em').trim() };
  });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  const dopo = await p.evaluate(() => ({
    nome: document.documentElement.dataset.palette,
    em: getComputedStyle(document.documentElement).getPropertyValue('--em').trim() }));
  (prima.nome === 'magenta' && dopo.nome === 'magenta' && prima.em && prima.em === dopo.em)
    ? bene(`la palette scelta resta dopo il ricarico (${dopo.nome}, ${dopo.em})`)
    : rotto('memoria', `la palette non resta: ${JSON.stringify(prima)} → ${JSON.stringify(dopo)}`);
  const quante = await p.evaluate(() => Object.keys(localStorage).length);
  bene(`${quante} chiavi in localStorage`);
  await p.evaluate(() => localStorage.clear());
  await ctx.close();
}

/* ══ 7 · senza JavaScript ═══════════════════════════════════════════ */
titolo('a JavaScript spento');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(SITO, { waitUntil: 'domcontentloaded' });
  const q = await p.evaluate(() => 1).catch(() => null);
  const testo = (await p.textContent('body')).replace(/\s+/g, ' ').trim();
  testo.length > 2000 ? bene(`restano ${testo.length} battute di testo leggibile`)
                      : rotto('no-js', `a JS spento restano solo ${testo.length} battute`);
  const vuote = await p.$$eval('.union__lavori,.eso__lavori,.locanda__lavori,.locanda__brani',
    (l) => l.filter(e => e.children.length === 0).length).catch(() => 0);
  vuote ? rotto('no-js', `${vuote} griglie dei casi restano vuote senza JS (i video non si vedono)`)
        : bene('le griglie dei casi hanno contenuto anche senza JS');
  const nomi = await p.$$eval('.stack__grid *', (l) => l.length).catch(() => 0);
  nomi > 20 ? bene(`gli strumenti restano scritti nell\u2019HTML (${nomi} nodi)`)
            : rotto('no-js', 'senza JS spariscono anche i nomi degli strumenti');
  await ctx.close();
}

/* ══ 8 · con le animazioni spente ═══════════════════════════════════ */
titolo('movimento ridotto');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 },
                                   reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 100)));
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const nascosti = await p.evaluate(() => {
    const fuori = [];
    for (const e of document.querySelectorAll('.rv')) {
      const cs = getComputedStyle(e);
      if (parseFloat(cs.opacity) < 0.5) fuori.push((e.className || '').toString().split(' ')[0]);
    }
    return fuori;
  });
  nascosti.length ? rotto('movimento', `${nascosti.length} blocchi restano trasparenti con le animazioni spente`)
                  : bene('con le animazioni spente si vede tutto lo stesso');
  errs.length ? rotto('movimento', `errori: ${errs[0]}`) : bene('nessun errore');
  await ctx.close();
}

/* ══ 9 · quanto pesa aprire la pagina ═══════════════════════════════ */
titolo('peso e velocita');
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  let byte = 0, richieste = 0;
  p.on('response', async r => {
    richieste++;
    const l = r.headers()['content-length'];
    if (l) byte += parseInt(l, 10);
  });
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const m = await p.evaluate(() => new Promise(res => {
    let lcp = 0, cls = 0;
    new PerformanceObserver(l => { for (const e of l.getEntries()) lcp = e.startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => res({ lcp: Math.round(lcp), cls: +cls.toFixed(4) }), 900);
  }));
  console.log(`  · ${richieste} richieste, ${(byte / 1024).toFixed(0)} KB dichiarati`);
  m.lcp && m.lcp < 2500 ? bene(`LCP ${m.lcp} ms`) : rotto('peso', `LCP ${m.lcp} ms`);
  m.cls < 0.1 ? bene(`CLS ${m.cls}`) : rotto('peso', `CLS ${m.cls}`);
  byte < 1500 * 1024 ? bene(`${(byte / 1024).toFixed(0)} KB per aprire la pagina`)
                     : rotto('peso', `${(byte / 1024).toFixed(0)} KB per aprire la pagina`);
  await ctx.close();
}

await b.close();
console.log('\n' + '═'.repeat(60));
if (guai.length) {
  console.log(`${guai.length} cose da sistemare:\n`);
  for (const g of guai) console.log('  · ' + g);
} else {
  console.log('nessun guaio trovato');
}
process.exitCode = guai.length ? 1 : 0;
