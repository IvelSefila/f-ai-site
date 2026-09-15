/* ═══════════════════════════════════════════════════════════════════
 * SI SPOSTA TUTTO, MA NON DOVUNQUE
 *
 * Telefono per primo: e' li' che una sezione alta 4800 px non si puo'
 * trascinare, ed e' li' che due blocchi chiari attaccati si vedono
 * peggio, perche' tutto e' incolonnato e la cucitura fra i blocchi e'
 * l'unica cosa che separa una sezione dall'altra.
 *
 * Le cose che devono restare vere qualunque cosa si sposti — le chiamo
 * INVARIANTI, e sono controllate dopo ogni mossa:
 *
 *   1 · l'apertura e' la prima sezione, il contatto e' l'ultima
 *   2 · dalla seconda sezione in poi chiaro e scuro si alternano
 *   3 · le cinque prove sono numerate 01…05 nell'ordine della pagina,
 *       e occhiello, numerone e testata dicono tutti lo stesso numero
 *   4 · dentro ogni gruppo i numeri stampati vanno 01, 02, 03…
 *   5 · niente scorrimento orizzontale
 *   6 · nessuna sezione schiacciata a zero
 *
 * uso: node audit/sposta-tutto.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html?probe=1';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

async function pagina(ctx) {
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2200);
  p.errs = errs;
  return p;
}

/* ── gli invarianti, misurati dentro la pagina ─────────────────────
   Tornano una lista di guasti: vuota vuol dire che la pagina regge. */
const GUARDA = () => {
  const guasti = [];
  const sez = [...document.querySelectorAll('#main > section')];
  const due = (n) => String(n).padStart(2, '0');

  if (sez[0]?.id !== 'top') guasti.push(`prima sezione: ${sez[0]?.id}`);
  if (sez[sez.length - 1]?.id !== 'contatto') guasti.push(`ultima sezione: ${sez[sez.length - 1]?.id}`);

  /* l'apertura e la prima sezione sono lo stesso blocco scuro: si
     alterna da li' in poi */
  for (let i = 2; i < sez.length; i++) {
    const a = sez[i - 1].classList.contains('sec--chiara');
    const c = sez[i].classList.contains('sec--chiara');
    if (a === c) guasti.push(`due blocchi ${c ? 'chiari' : 'scuri'} attaccati: ${sez[i - 1].id} + ${sez[i].id}`);
  }

  /* Cinque e non piu' sette: il metodo e' diventato un blocco dentro la
     control room e la materia un blocco dentro il laboratorio, perche'
     dicevano le stesse cose delle sezioni vicine. Le prove numerate
     sono servizi, lavori, control room, tecnologia, laboratorio. */
  const prove = sez.filter(s => s.dataset.ordProva != null);
  if (prove.length !== 5) guasti.push(`prove trovate: ${prove.length}`);
  prove.forEach((s, i) => {
    const atteso = due(i + 1);
    const occhio = s.querySelector('.eyebrow .n')?.textContent.trim();
    if (occhio !== `Prova ${atteso}`) guasti.push(`occhiello di ${s.id}: "${occhio}" invece di "Prova ${atteso}"`);
    const testa = s.querySelector('.sec__head[data-num]');
    if (testa && testa.dataset.num !== atteso) guasti.push(`numerone di ${s.id}: ${testa.dataset.num} invece di ${atteso}`);
  });
  /* La testata adesso dice "01 Servizi", non "01": la cifra sta in uno
     <span class="n"> e la parola le sta accanto. Si controlla la cifra,
     che e' la parte che deve seguire lo spostamento, e si escludono le
     due voci che prove non sono — profilo e contatto — che stanno in
     coda e non si rinumerano. */
  const FUORI = new Set(['#profilo', '#contatto']);
  const nav = [...document.querySelectorAll('.bar__nav a')]
    .filter(a => !FUORI.has(a.getAttribute('href')));
  nav.forEach((a, i) => {
    const cifra = (a.querySelector('.n') || a).textContent.trim();
    if (cifra !== due(i + 1)) guasti.push(`testata in posizione ${i + 1}: "${cifra}"`);
    const s = document.querySelector(a.getAttribute('href'));
    if (s && prove.indexOf(s) !== i) guasti.push(`la testata manda a ${a.getAttribute('href')} col numero sbagliato`);
  });

  for (const [sel, num] of [['.deck', '.work__meta b'], ['.offerta__grid', 'span.mono'],
                            ['.lab', 'span.mono'], ['.pipe', 'b.mono']])
    document.querySelectorAll(sel).forEach(g => {
      [...g.children].forEach((p, i) => {
        const n = p.querySelector(num);
        if (n && !n.textContent.trim().startsWith(due(i + 1)))
          guasti.push(`${sel} in posizione ${i + 1}: "${n.textContent.trim().slice(0, 14)}"`);
      });
    });

  if (document.documentElement.scrollWidth > innerWidth + 1)
    guasti.push(`scorrimento orizzontale: ${document.documentElement.scrollWidth} > ${innerWidth}`);
  for (const s of sez)
    if (s.getBoundingClientRect().height < 40) guasti.push(`sezione schiacciata: ${s.id}`);

  return guasti;
};

const idSezioni = (p) => p.evaluate(() =>
  [...document.querySelectorAll('#main > section')].map(s => s.id).join(' '));

/* ── il gesto ─────────────────────────────────────────────────────── */
const dorme = (p, ms) => p.waitForTimeout(ms);
const dove = (p, sel, i, fx, fy) => p.evaluate(({ s, i, fx, fy }) => {
  const r = document.querySelectorAll(s)[i].getBoundingClientRect();
  return { x: Math.round(r.left + r.width * fx), y: Math.round(r.top + r.height * fy) };
}, { s: sel, i, fx, fy });

/* Dove appoggiare il dito per prendere una SEZIONE.

   Il primo tentativo prendeva il 2% dell'altezza dopo averla centrata:
   ma "lavori" e' alta 2742 px, centrarla mette il suo bordo di sopra a
   -949, e il 2% cadeva fuori dallo schermo. Il puntatore finiva sulla
   testata fissa e non succedeva niente — la prova diceva "la mappa non
   si apre" per il motivo sbagliato.

   Il punto giusto e' l'intestazione della sezione: e' l'unico pezzo che
   non sta dentro nessun gruppo, quindi prende la sezione intera, e
   portata a vista sta sempre dentro lo schermo. */
async function presaSezione(p, id) {
  await p.evaluate(i => {
    const s = document.getElementById(i);
    (s.querySelector('.sec__head') || s).scrollIntoView({ block: 'center', behavior: 'instant' });
  }, id);
  return p.evaluate(i => {
    const s = document.getElementById(i);
    const h = s.querySelector('.sec__head') || s;
    const r = h.getBoundingClientRect();
    return { x: Math.round(r.left + Math.min(40, r.width / 2)),
             y: Math.round(Math.max(90, Math.min(innerHeight - 40, r.top + Math.min(22, r.height / 2)))) };
  }, id);
}

/* prende una sezione, apre la mappa, la porta sopra un'altra e la
   lascia li' (il rilascio lo fa chi chiama) */
async function scambiaSezioni(p, da, a) {
  const q = await presaSezione(p, da);
  await p.mouse.move(q.x, q.y);
  await p.mouse.down();
  await dorme(p, 750);                    /* stacco */
  await p.mouse.move(q.x + 14, q.y + 6);  /* parte, e la pagina si richiude */
  await dorme(p, 200);
  const m = await dove(p, '#' + a, 0, 0.5, 0.5);
  for (let k = 1; k <= 10; k++) {
    await p.mouse.move(q.x + (m.x - q.x) * k / 10, q.y + (m.y - q.y) * k / 10);
    await dorme(p, 22);
  }
  return q;
}

async function trascina(p, daSel, daI, aSel, aI, passi = 10, fy = 0.5) {
  await p.evaluate(({ s, i }) => document.querySelectorAll(s)[i]
    .scrollIntoView({ block: 'center', behavior: 'instant' }), { s: daSel, i: daI });
  const a = await dove(p, daSel, daI, 0.06, 0.06);
  await p.mouse.move(a.x, a.y);
  await p.mouse.down();
  await dorme(p, 750);                                /* stacco */
  await p.mouse.move(a.x + 14, a.y + 4);              /* parte il trascinamento */
  await dorme(p, 120);
  const m = await dove(p, aSel, aI, 0.5, fy);         /* ora, a mappa aperta */
  for (let k = 1; k <= passi; k++) {
    await p.mouse.move(a.x + (m.x - a.x) * k / passi, a.y + (m.y - a.y) * k / passi);
    await dorme(p, 22);
  }
  await p.mouse.up();
  await dorme(p, 450);
}

/* ═════ TELEFONO ═════════════════════════════════════════════════ */
for (const [nome, vp, dito] of [['telefono', { width: 390, height: 844 }, true],
                                ['desktop',  { width: 1440, height: 900 }, false]]) {
  console.log(`\n════ ${nome} ${vp.width}×${vp.height} ════`);
  const ctx = await b.newContext({ viewport: vp, isMobile: dito, hasTouch: dito });
  const p = await pagina(ctx);

  dice((await p.evaluate(GUARDA)).length === 0, 'la pagina appena aperta regge tutti gli invarianti');

  /* ── una sezione si sposta dalla mappa ───────────────────────── */
  const prima = await idSezioni(p);
  /* "lavori" e' chiara: la porto sul posto di "come", chiara anche lei.
     A meta' corsa guardo la mappa: e' li' che si vede il rifiuto. */
  const q = await presaSezione(p, 'lavori');
  await p.mouse.move(q.x, q.y);
  await p.mouse.down();
  await dorme(p, 750);
  await p.mouse.move(q.x + 14, q.y + 6);
  await dorme(p, 200);
  dice(await p.evaluate(() => document.body.classList.contains('ord-mappa')),
       'la pagina si richiude nella mappa');
  dice(await p.evaluate(() =>
         document.getElementById('main').getBoundingClientRect().height <= innerHeight),
       'la mappa sta tutta in uno schermo');
  const spenti = await p.evaluate(() =>
    [...document.querySelectorAll('#main > section.ord-no')].map(s => s.id));
  dice(spenti.includes('top') && spenti.includes('contatto'),
       'apertura e contatto sono spenti: non si puo’ atterrare li’');
  dice(spenti.includes('regia') && spenti.includes('banchi'),
       'e sono spente anche le scure, che romperebbero l’alternanza');

  /* Si atterra su "come" e non piu' sul brief: il brief non e' piu' una
     sezione, e' un blocco dentro il contatto — e il contatto e' una
     delle caselle spente, quindi la prova trascinava nel vuoto e non
     scambiava piu' niente. Due sezioni chiare si scambiano senza
     rompere l'alternanza. */
  const bersaglio = await dove(p, '#come', 0, 0.5, 0.5);
  for (let k = 1; k <= 10; k++) {
    await p.mouse.move(q.x + (bersaglio.x - q.x) * k / 10, q.y + (bersaglio.y - q.y) * k / 10);
    await dorme(p, 22);
  }
  await p.mouse.up();
  await dorme(p, 700);

  dice(!(await p.evaluate(() => document.body.classList.contains('ord-mappa'))),
       'lasciando, la pagina si riapre');
  const dopo = await idSezioni(p);
  dice(dopo !== prima, `le due sezioni si sono scambiate`);
  console.log(`     ${dopo}`);
  let g = await p.evaluate(GUARDA);
  dice(g.length === 0, `dopo lo scambio regge tutto${g.length ? ': ' + g[0] : ''}`);

  /* ── il rifiuto: chiara su scura non si scambia ──────────────── */
  /* Non "non si muove": mentre attraversa la mappa la sezione scambia
     con le bande buone che incontra, ed e' giusto cosi'. Quello che non
     deve MAI succedere e' finire al posto di una scura — la prima
     versione di questa prova chiedeva l'immobilita' e falliva su
     desktop, dove il tragitto passa sopra due bande chiare. */
  const doveEra = (id) => p.evaluate(i =>
    [...document.querySelectorAll('#main > section')].findIndex(s => s.id === i), id);
  const toni = () => p.evaluate(() =>
    [...document.querySelectorAll('#main > section')]
      .map(s => s.classList.contains('sec--chiara') ? 'c' : 's').join(''));

  const regiaEra = await doveEra('regia'), toniEra = await toni();
  await scambiaSezioni(p, 'metodo', 'regia');
  await p.mouse.up(); await dorme(p, 700);
  dice(await doveEra('regia') === regiaEra,
       'lasciata su una scura, la sezione chiara non le prende il posto');
  dice(await toni() === toniEra, `la fila dei toni e' quella di prima: ${toniEra}`);

  /* ── cento mosse a caso ──────────────────────────────────────── */
  const esito = await p.evaluate((sorgente) => {
    const guarda = new Function('return (' + sorgente + ')()');
    const S = window.__sposta;
    const bersagli = [
      ...[...document.querySelectorAll('#main > section')],
      ...[...document.querySelectorAll('.work, .offerta__card, .lab__card, .pipe li, .stack__group, .bench__panel, .formats figure')],
    ];
    let mosse = 0;
    for (let k = 0; k < 100; k++) {
      const el = bersagli[(Math.random() * bersagli.length) | 0];
      if (!el.isConnected) continue;
      const b = S.bersaglioDi(el);
      if (!b) continue;
      const passo = Math.random() < .5 ? -1 : 1;
      if (!S.puoAndare(b, passo)) continue;
      S.spostaDi(b, passo);
      mosse++;
      const g = guarda();
      if (g.length) return { mosse, guasti: g.slice(0, 3) };
    }
    return { mosse, guasti: [] };
  }, GUARDA.toString());
  dice(esito.guasti.length === 0,
       `${esito.mosse} mosse a caso e la pagina regge${esito.guasti.length ? ': ' + esito.guasti.join(' | ') : ''}`);

  /* ── il banco specchiato ─────────────────────────────────────── */
  const banco = await p.evaluate(() => {
    const S = window.__sposta;
    const b = S.bersaglioDi(document.querySelector('.bench__panel'));
    S.spostaDi(b, -1);
    const bench = document.querySelector('.bench');
    const figli = [...bench.children];
    const r = figli.map(f => Math.round(f.getBoundingClientRect().width));
    return { specchio: bench.hasAttribute('data-ord-specchio'),
             primo: figli[0].className, larghezze: r, largo: innerWidth };
  });
  dice(banco.specchio, 'scambiando i due lati il banco si segna come specchiato');
  if (banco.largo >= 1000)
    dice(banco.larghezze[1] > banco.larghezze[0],
         `e la scena resta la colonna larga (${banco.larghezze.join(' / ')})`);
  else
    dice(banco.larghezze[0] === banco.larghezze[1],
         'sul telefono le due colonne sono una sola: niente da specchiare');

  /* ── ricaricando resta tutto, e i fissi restano fissi ────────── */
  const finale = await idSezioni(p);
  await p.reload({ waitUntil: 'networkidle' });
  await dorme(p, 2300);
  dice(await idSezioni(p) === finale, 'ricaricando l\u2019ordine e\u2019 ancora quello');
  g = await p.evaluate(GUARDA);
  dice(g.length === 0, `e regge ancora tutto${g.length ? ': ' + g[0] : ''}`);
  dice(p.errs.length === 0, `nessun errore${p.errs.length ? ': ' + p.errs[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} prove rotte` : '\ntutto a posto');
process.exitCode = rotte ? 1 : 0;
