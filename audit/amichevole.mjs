/* ═══════════════════════════════════════════════════════════════════
 * IL SITO E' DAVVERO ACCOGLIENTE?
 *
 * Il contrasto e la gerarchia dei titoli li guarda gia' v2a11y. Qui ci
 * sono le cose che rendono una pagina scomoda senza essere sbagliate,
 * e che si vedono solo misurando sezione per sezione. Telefono per
 * primo, perche' e' li' che si stringe tutto.
 *
 *  1 · BERSAGLI PICCOLI — un bottone sotto i 44px non si prende col
 *      pollice. E' la misura che usano sia Apple sia Google, e sotto
 *      quella soglia si sbaglia clic, non ci si sforza di piu'.
 *
 *  2 · RIGHE TROPPO LUNGHE — oltre le ~85 battute l'occhio perde il
 *      capo riga e si rilegge la stessa. Vale per il corpo del testo,
 *      non per i titoli.
 *
 *  3 · TESTO MINUTO — sotto i 15px il corpo del testo su un telefono
 *      si legge male. Le etichette in maiuscoletto sono un'altra cosa
 *      e restano fuori dal conto.
 *
 *  4 · ROBA SOTTO LA TESTATA — la barra sta fissa in cima: se il primo
 *      contenuto di una sezione ci finisce sotto, e' invisibile finche'
 *      non si scorre all'indietro.
 *
 *  5 · SEZIONI CHE NON SI ACCENDONO — ogni blocco compare in dissolvenza
 *      quando entra nello schermo. Se un blocco resta trasparente dopo
 *      esserci entrato, quella parte di pagina e' semplicemente sparita.
 *
 *  6 · LA TESTATA CHE MENTE — il numero acceso nella barra deve essere
 *      quello della sezione che si sta guardando. Dopo aver cambiato
 *      l'ordine delle sezioni e' la prima cosa che puo' non tornare.
 *
 * uso: node audit/amichevole.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html?probe=1';
const BATTUTE = 85;
const POLLICE = 44;

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

/* ── la misura, dentro la pagina ──────────────────────────────────── */
const GUARDA = ({ battute, pollice, dito }) => {
  const fuori = { piccoli: [], lunghe: [], minuti: [], coperti: [], spente: [] };
  const bar = document.querySelector('.bar');
  const altezzaBar = bar ? bar.getBoundingClientRect().height : 0;
  const nome = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30)
    || e.getAttribute('aria-label') || e.className || e.tagName;

  for (const s of document.querySelectorAll('#main > section')) {
    /* 1 · bersagli */
    if (dito)
      for (const c of s.querySelectorAll('button, a, input, summary, [role="tab"]')) {
        const r = c.getBoundingClientRect();
        if (!r.width || !r.height) continue;                 /* nascosto */
        if (getComputedStyle(c).visibility === 'hidden') continue;
        /* Una casella da 18px dentro un'etichetta alta 50 si prende
           benissimo: il bersaglio e' l'etichetta, non la casella. */
        const eti = c.closest('label');
        const grande = eti && eti.getBoundingClientRect().height >= pollice - .5;
        if (!grande && (r.height < pollice - .5 || r.width < 18))
          fuori.piccoli.push(`${s.id}: ${Math.round(r.width)}×${Math.round(r.height)} "${nome(c)}"`);
      }

    /* 2 e 3 · righe lunghe e testo minuto, solo sul corpo del testo */
    for (const p of s.querySelectorAll('p, li')) {
      if (p.querySelector('p, li')) continue;
      const t = (p.textContent || '').trim();
      if (t.length < 60) continue;
      const cs = getComputedStyle(p);
      if (cs.textTransform === 'uppercase' || cs.fontFamily.includes('mono')) continue;
      const dimensione = parseFloat(cs.fontSize);
      /* quante battute stanno in una riga: larghezza / larghezza media
         di un carattere, presa dalla misura vera del testo */
      const misura = (() => {
        const c = document.createElement('canvas').getContext('2d');
        c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        return c.measureText('abcdefghij klmnopqrst uvwxyz').width / 27;
      })();
      const perRiga = Math.round(p.getBoundingClientRect().width / misura);
      if (perRiga > battute) fuori.lunghe.push(`${s.id}: ${perRiga} battute · "${t.slice(0, 34)}…"`);
      if (dito && dimensione < 15) fuori.minuti.push(`${s.id}: ${dimensione}px · "${t.slice(0, 34)}…"`);
    }
  }
  return { fuori, altezzaBar };
};

for (const [nome, vp, dito] of [['telefono', { width: 390, height: 844 }, true],
                                ['desktop', { width: 1440, height: 900 }, false]]) {
  console.log(`\n════ ${nome} ${vp.width}×${vp.height} ════`);
  const ctx = await b.newContext({ viewport: vp, isMobile: dito, hasTouch: dito });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2300);

  /* Scorrere la pagina UNA SCHERMATA PER VOLTA, non di sezione in
     sezione. La prima versione saltava da un titolo all'altro, e le
     carte che stavano in mezzo a una sezione alta non entravano mai
     nello schermo: risultavano "mai accese", che e' vero solo perche'
     nessuno c'era passato sopra.

     E le linguette dei banchi vanno aperte tutte e quattro: tre pannelli
     su quattro nascono nascosti, quindi non si accendono finche' non li
     si guarda — di nuovo, un difetto della prova e non della pagina. */
  const alto = await p.evaluate(() => innerHeight);
  const fondo = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < fondo; y += Math.round(alto * .6)) {
    await p.evaluate(v => scrollTo(0, v), y);
    await p.waitForTimeout(150);
  }
  for (const t of ['#t-video', '#t-social', '#t-ai', '#t-grafica']) {
    const el = await p.$(t);
    if (!el) continue;
    await p.evaluate(s => document.querySelector(s)
      .scrollIntoView({ block: 'center', behavior: 'instant' }), t);
    await el.click();
    await p.waitForTimeout(400);
  }
  await p.waitForTimeout(600);

  /* 5 · blocchi rimasti trasparenti dopo esserci passati sopra */
  const spente = await p.evaluate(() => [...document.querySelectorAll('.rv')]
    .filter(e => +getComputedStyle(e).opacity < .9)
    .map(e => (e.closest('#main > section') || {}).id + ' · ' + (e.className || e.tagName))
    .slice(0, 6));

  /* 4 · primo contenuto di una sezione sotto la barra fissa */
  const coperti = await p.evaluate(() => {
    const bar = document.querySelector('.bar');
    const h = bar ? bar.getBoundingClientRect().height : 0;
    const male = [];
    for (const s of document.querySelectorAll('#main > section')) {
      if (s.id === 'top') continue;
      s.scrollIntoView({ block: 'start', behavior: 'instant' });
      const primo = s.querySelector('.eyebrow, h2, h3, p');
      if (!primo) continue;
      const r = primo.getBoundingClientRect();
      if (r.top < h - 1) male.push(`${s.id}: "${(primo.textContent || '').trim().slice(0, 24)}" sotto la barra di ${Math.round(h - r.top)}px`);
    }
    return male;
  });

  /* 6 · il numero acceso nella testata e' quello della sezione */
  const spia = await p.evaluate(async () => {
    const male = [];
    for (const a of document.querySelectorAll('.bar__nav a')) {
      const id = a.getAttribute('href').slice(1);
      const s = document.getElementById(id);
      if (!s) { male.push(`la testata manda a #${id}, che non esiste`); continue; }
      s.scrollIntoView({ block: 'start', behavior: 'instant' });
      await new Promise(r => setTimeout(r, 260));
      const acceso = document.querySelector('.bar__nav a.on');
      if (acceso && acceso !== a) male.push(`su #${id} si accende ${acceso.textContent.trim()}`);
    }
    return male;
  });

  const { fuori } = await p.evaluate(GUARDA, { battute: BATTUTE, pollice: POLLICE, dito });
  fuori.spente = spente; fuori.coperti = coperti;

  const mostra = (chiave, testo, quanti = 4) => {
    const l = fuori[chiave] || [];
    dice(l.length === 0, `${testo}${l.length ? ` — ${l.length}` : ''}`);
    l.slice(0, quanti).forEach(x => console.log(`      ${x}`));
  };
  if (dito) mostra('piccoli', `nessun bersaglio sotto ${POLLICE}px`);
  mostra('lunghe', `nessuna riga oltre ${BATTUTE} battute`);
  if (dito) mostra('minuti', 'nessun corpo di testo sotto 15px');
  mostra('coperti', 'niente finisce sotto la testata');
  mostra('spente', 'tutti i blocchi si accendono');
  dice(spia.length === 0, `la testata accende il numero giusto${spia.length ? ' — ' + spia[0] : ''}`);
  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\ntutto accogliente');
process.exitCode = rotte ? 1 : 0;
