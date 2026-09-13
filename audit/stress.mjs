/* ═══════════════════════════════════════════════════════════════════
 * SI PROVA A ROMPERLO
 *
 * La revisione generale guarda se il sito e' in ordine. Questo prova a
 * metterlo nei guai: schermi piccolissimi, doppi clic, un video che
 * suona mentre qualcuno cambia le colonne sotto, un blocco spostato e
 * poi la pagina ricaricata.
 *
 * Sono i punti dove le cose si rompono davvero: non nel caso normale,
 * ma quando due funzioni che nessuno ha mai visto insieme si
 * incontrano.
 *
 * uso: node audit/stress.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html?probe=1';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
         '--autoplay-policy=no-user-gesture-required'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };
const titolo = (t) => console.log(`\n──── ${t} ────`);

/* ══ 1 · schermi impossibili ════════════════════════════════════════ */
titolo('larghezze estreme');
for (const w of [320, 360, 768, 1024, 1920]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 },
                                   isMobile: w < 700, hasTouch: w < 700 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 90)));
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  const m = await p.evaluate(() => {
    const nome = (e) => ((typeof e.className === 'string' && e.className) ||
                         e.getAttribute('class') || e.tagName).split(' ')[0];
    /* Sborda solo quello che esce dalla finestra SENZA che nessuno lo
       tagli: un disegno largo dentro un contenitore con overflow hidden
       non sborda, e' solo tagliato apposta. La prima versione di questa
       prova segnalava le scene in SVG dei tre casi, che stanno dentro
       lastre con overflow:hidden e non si vedono mai fuori. */
    const tagliaQualcuno = (e) => {
      for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.overflow !== 'visible' || cs.clipPath !== 'none') return true;
      }
      return false;
    };
    const fuori = [];
    for (const e of document.querySelectorAll('#main *')) {
      const r = e.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > innerWidth + 2 || r.left < -2) {
        const cs = getComputedStyle(e);
        if (cs.position === 'fixed' || cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue;
        if (tagliaQualcuno(e)) continue;
        fuori.push(nome(e) + ' (' + Math.round(r.left) + '→' + Math.round(r.right) + ')');
      }
    }
    /* Testo tagliato davvero: piu' largo della sua scatola E con la
       scatola che lo taglia. Con overflow visible il testo esce e si
       legge lo stesso — ed e' quello che fanno i trattini del payoff di
       Union, che stanno fuori apposta. */
    const tagliati = [];
    for (const e of document.querySelectorAll('#main h1,#main h2,#main h3,#main h4,#main p,#main dd,#main li')) {
      const cs = getComputedStyle(e);
      if (e.scrollWidth > e.clientWidth + 2 && (cs.overflowX === 'hidden' || cs.overflowX === 'clip'))
        tagliati.push(nome(e));
    }
    return { fuori: [...new Set(fuori)], tagliati: [...new Set(tagliati)],
             scroll: document.documentElement.scrollWidth > innerWidth + 1 };
  });
  dice(!m.scroll && m.fuori.length === 0 && m.tagliati.length === 0 && errs.length === 0,
       `${w}px: ${m.scroll ? 'scorre in orizzontale' : 'niente scroll'}` +
       `${m.fuori.length ? ' · sbordano ' + m.fuori.slice(0, 2).join(', ') : ''}` +
       `${m.tagliati.length ? ' · testo tagliato in ' + m.tagliati.slice(0, 2).join(', ') : ''}` +
       `${errs.length ? ' · ' + errs[0] : ''}`);
  await ctx.close();
}

/* ══ 2 · doppi clic e clic ripetuti ═════════════════════════════════ */
titolo('doppi clic');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 110)));
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector('.union__lavori')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(250);
  /* due clic rapidi sullo stesso bottone: il secondo arriva quando il
     bottone non c'e' piu' */
  await p.dblclick('.union__pezzo:nth-child(1) .union__via').catch(() => {});
  await p.waitForTimeout(1200);
  const uno = await p.evaluate(() => ({
    video: document.querySelectorAll('.union__pezzo:nth-child(1) video').length,
    bottoni: document.querySelectorAll('.union__pezzo:nth-child(1) .union__via').length,
  }));
  dice(uno.video === 1 && uno.bottoni === 0,
       `doppio clic: resta un video solo e nessun bottone doppio (${uno.video} video, ${uno.bottoni} bottoni)`);

  /* cinque clic in fila su cinque schede diverse */
  for (let i = 2; i <= 6; i++) {
    await p.click(`.union__pezzo:nth-child(${i}) .union__via`).catch(() => {});
    await p.waitForTimeout(120);
  }
  await p.waitForTimeout(1200);
  const tanti = await p.evaluate(() => ({
    video: document.querySelectorAll('.union__lavori video').length,
    suonano: [...document.querySelectorAll('.union__lavori video')].filter(v => !v.paused).length,
    schedeSenzaCopertina: [...document.querySelectorAll('.union__pezzo')]
      .filter(a => !a.querySelector('.union__via') && !a.querySelector('video')).length,
  }));
  dice(tanti.video === 1 && tanti.suonano <= 1 && tanti.schedeSenzaCopertina === 0,
       `cinque clic rapidi: ${tanti.video} video, ${tanti.suonano} in riproduzione, ` +
       `${tanti.schedeSenzaCopertina} schede rimaste senza copertina`);
  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

/* ══ 3 · cambiare le colonne mentre un video suona ══════════════════ */
titolo('colonne cambiate durante la riproduzione');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 110)));
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector('.eso__lavori')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(250);
  await p.click('.eso__pezzo:nth-child(1) .eso__via');
  await p.waitForTimeout(1200);
  const cambiato = await p.evaluate(() => {
    const g = document.querySelector('.eso__lavori');
    const prima = g.getAttribute('data-gr');
    g.setAttribute('data-gr', '8-4');
    return { prima, dopo: g.getAttribute('data-gr') };
  });
  await p.waitForTimeout(600);
  const vivo = await p.evaluate(() => {
    const v = document.querySelector('.eso__lavori video');
    return v ? { c: v.paused, largo: Math.round(v.getBoundingClientRect().width) } : null;
  });
  dice(vivo && !vivo.c, `il video continua mentre le colonne cambiano (${cambiato.prima} → ${cambiato.dopo}, largo ${vivo?.largo}px)`);
  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

/* ══ 4 · sposta un blocco, ricarica, riapri un video ════════════════ */
titolo('ordine spostato e ricaricato');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 110)));
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2000);

  const prima = await p.evaluate(() =>
    [...document.querySelectorAll('.union__pezzo h4')].map(h => h.textContent));
  /* si sposta il secondo pezzo davanti al primo, come fa il dito */
  const mossa = await p.evaluate(() => {
    const g = document.querySelector('.union__lavori');
    g.insertBefore(g.children[1], g.children[0]);
    return [...g.querySelectorAll('h4')].map(h => h.textContent);
  });
  dice(mossa[0] === prima[1], `lo spostamento si vede subito (${mossa[0]})`);

  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector('.union__lavori')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(250);
  await p.click('.union__pezzo:nth-child(1) .union__via');
  await p.waitForTimeout(1300);
  const riapre = await p.evaluate(() => {
    const v = document.querySelector('.union__pezzo:nth-child(1) video');
    return v ? { src: v.currentSrc.split('/').pop(), fermo: v.paused } : null;
  });
  dice(riapre && !riapre.fermo, `dopo il ricarico i video si aprono ancora (${riapre?.src})`);
  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await p.evaluate(() => localStorage.clear());
  await ctx.close();
}

/* ══ 5 · avanti e indietro col browser ══════════════════════════════ */
titolo('avanti e indietro');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 110)));
  await p.goto('http://localhost:8899/v2/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.click('a[href="#contatto"]').catch(async () => {
    await p.evaluate(() => { location.hash = '#contatto'; });
  });
  /* Lo scorrimento e' morbido e la pagina e' lunga sedicimila pixel:
     bisogna aspettare che si fermi davvero. Misurato a 700 ms si
     leggeva un valore a meta' strada, e "indietro" sembrava andare piu'
     giu' invece che piu' su. */
  await p.waitForFunction(() => {
    const y = Math.round(scrollY);
    if (window.__ultimo === y) return true;
    window.__ultimo = y;
    return false;
  }, null, { timeout: 8000, polling: 260 }).catch(() => {});
  const giu = await p.evaluate(() => Math.round(scrollY));
  await p.goBack({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1600);
  const su = await p.evaluate(() => Math.round(scrollY));
  dice(giu > 1000 && su < giu, `l\u2019ancora porta in fondo (${giu}px) e indietro si torna su (${su}px)`);
  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

/* ══ 6 · la torre in standby ════════════════════════════════════════ */
titolo('la torre');
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = [], http = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 110)));
  p.on('response', r => { if (r.status() >= 400) http.push(r.status() + ' ' + r.url().split('/').pop()); });
  await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  const tela = await p.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return null;
    const g = c.getContext('2d');
    const d = g ? g.getImageData(c.width >> 1, c.height >> 1, 1, 1).data : null;
    return { w: c.width, h: c.height, pixel: d ? [...d].join(',') : null };
  });
  dice(!!tela && tela.w > 100, `la tela della torre c\u2019e\u2019 (${tela?.w}×${tela?.h})`);
  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  dice(http.length === 0, `nessuna richiesta fallita${http.length ? ': ' + http[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} prove andate male` : '\nnon si e\u2019 rotto niente');
process.exitCode = rotte ? 1 : 0;
