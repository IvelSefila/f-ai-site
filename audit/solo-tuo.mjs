/* ═══════════════════════════════════════════════════════════════════
 * QUELLO CHE CAMBI LO VEDI SOLO TU
 *
 * La pagina invita a spostare i blocchi e a cambiare colore, e la
 * domanda che viene subito dopo e' giusta: se un cliente sposta una
 * cosa, la sposta per tutti? Leggere il codice dice di no — sono
 * quattro voci in localStorage e nessuna richiesta a un server — ma
 * leggere non e' provare.
 *
 * Qui ci sono DUE visitatori veri, cioe' due profili di browser
 * separati che non condividono niente. Il primo cambia colore, sposta
 * una carta, sposta una sezione e cambia l'impaginazione. Il secondo
 * apre la stessa pagina e deve trovare tutto come nasce.
 *
 * E si controlla anche il contrario: che il primo, ricaricando, le sue
 * scelte le ritrovi — un cambiamento che sparisce al ricarico sarebbe
 * inutile quanto uno che si propaga.
 *
 * uso: node audit/solo-tuo.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html?probe=1';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

/* la fotografia di come sta la pagina, in quattro numeri */
const COMESTA = () => ({
  colore: document.documentElement.dataset.palette,
  carte: [...document.querySelectorAll('#deck > *')].map(e => e.dataset.ordId).join(','),
  sezioni: [...document.querySelectorAll('#main > section')].map(s => s.id).join(' '),
  impaginazione: document.querySelector('.deck')?.dataset.gr || '',
  memoria: Object.keys(localStorage).filter(k => k.startsWith('fai-')).sort().join(', '),
});

async function apri(ctx, spia) {
  const p = await ctx.newPage();
  if (spia) p.on('request', r => {
    const u = r.url();
    /* tutto quello che non e' la pagina stessa e i suoi file */
    if (!u.startsWith('http://localhost:8899/')) spia.push(r.method() + ' ' + u);
    else if (r.method() !== 'GET') spia.push(r.method() + ' ' + u);
  });
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2300);
  return p;
}

/* ── il primo visitatore cambia quattro cose ──────────────────────── */
console.log('── il primo visitatore ──');
const uscite = [];
const ctx1 = await b.newContext({ viewport: { width: 1280, height: 860 } });
const p1 = await apri(ctx1, uscite);
const partenza = await p1.evaluate(COMESTA);

await p1.click('[data-pal-veloce="magenta"]');
await p1.waitForTimeout(300);
await p1.evaluate(() => {
  const S = window.__sposta;
  S.spostaDi(S.bersaglioDi(document.querySelector('.work')), 1);          /* una carta */
  S.spostaDi(S.bersaglioDi(document.getElementById('lavori')), 1);        /* una sezione */
  document.querySelector('.deck').dataset.gr = '1';
});
await p1.evaluate(() => {
  /* l'impaginazione passa dal pannello, che e' l'unico a scriverla */
  const m = JSON.parse(localStorage.getItem('fai-griglia') || '{}');
  m.deck = '1';
  localStorage.setItem('fai-griglia', JSON.stringify(m));
});
await p1.waitForTimeout(400);
const cambiato = await p1.evaluate(COMESTA);

dice(cambiato.colore !== partenza.colore, `ha cambiato colore: ${partenza.colore} → ${cambiato.colore}`);
dice(cambiato.carte !== partenza.carte, `ha spostato una carta: ${partenza.carte} → ${cambiato.carte}`);
dice(cambiato.sezioni !== partenza.sezioni, 'ha spostato una sezione');
dice(cambiato.memoria.length > 0, `nel suo browser restano: ${cambiato.memoria}`);

/* ── e ricaricando le ritrova ─────────────────────────────────────── */
await p1.reload({ waitUntil: 'networkidle' });
await p1.waitForTimeout(2300);
const dopoRicarico = await p1.evaluate(COMESTA);
dice(dopoRicarico.colore === cambiato.colore, 'ricaricando ritrova il suo colore');
dice(dopoRicarico.carte === cambiato.carte, 'e la carta dove l’aveva messa');
dice(dopoRicarico.sezioni === cambiato.sezioni, 'e la sezione dove l’aveva messa');
dice(dopoRicarico.impaginazione === '1', 'e l’impaginazione che aveva scelto');

/* ── il secondo visitatore non vede niente di tutto questo ────────── */
console.log('── il secondo visitatore, su un altro browser ──');
const ctx2 = await b.newContext({ viewport: { width: 1280, height: 860 } });
const p2 = await apri(ctx2);
const secondo = await p2.evaluate(COMESTA);

dice(secondo.colore === partenza.colore, `trova il colore di sempre: ${secondo.colore}`);
dice(secondo.carte === partenza.carte, `le carte nell’ordine di sempre: ${secondo.carte}`);
dice(secondo.sezioni === partenza.sezioni, 'le sezioni nell’ordine di sempre');
dice(secondo.impaginazione === partenza.impaginazione, 'l’impaginazione di sempre');
dice(secondo.memoria === '', 'e la sua memoria e’ vuota: non ha ereditato niente');

/* ── e niente e’ uscito dal computer ──────────────────────────────── */
console.log('── cos’e’ uscito dal computer ──');
dice(uscite.length === 0,
     `nessuna richiesta fuori dal sito, e nessuna scrittura${uscite.length ? ': ' + uscite.slice(0, 3).join(' · ') : ''}`);

await ctx1.close(); await ctx2.close(); await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\nquello che cambi lo vedi solo tu');
process.exitCode = rotte ? 1 : 0;
