/* ═══════════════════════════════════════════════════════════════════
 * IL TASTO CHE RIMETTE TUTTO COM'ERA
 *
 * Il sito lascia spostare qualunque riquadro, riordinare le sezioni,
 * cambiare l'impaginazione e la palette — e se lo ricorda fra una visita
 * e l'altra. Senza un modo per tornare indietro, l'unica uscita era
 * svuotare i dati del sito dalle impostazioni del browser: una cosa che
 * nessuno fa e quasi nessuno sa di poter fare.
 *
 * La prova che conta e' la TERZA, ed e' il motivo per cui questo file
 * esiste: dopo aver premuto il tasto si RICARICA la pagina. Un azzera
 * che rimette a posto lo schermo ma si dimentica di buttare la memoria
 * sembra funzionare benissimo — finche' uno non torna il giorno dopo e
 * ritrova il guaio dov'era. Qui si guarda anche dopo il ricarico.
 *
 * E si controlla che il brief NON venga toccato: chi preme "rimetti
 * l'aspetto com'era" non sta chiedendo di buttare via quello che ha
 * scritto. Sono due richieste diverse.
 *
 * uso: node audit/azzera.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html';
const CHIAVI = ['fai-palette', 'fai-griglia', 'fai-griglia-vista', 'fai-ordine'];

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

/* un contesto solo per tutta la prova: la memoria del browser deve
   sopravvivere ai ricarichi, se no non si sta misurando niente */
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e)));

const stato = () => p.evaluate(k => ({
  palette: document.documentElement.dataset.palette,
  ordine: [...document.querySelectorAll('#main > section')].map(s => s.id).join(' '),
  griglie: [...document.querySelectorAll('[data-gr]')].map(e => e.dataset.gr).join(','),
  vista: document.documentElement.hasAttribute('data-gr-visibile'),
  chiavi: k.filter(x => localStorage.getItem(x)),
}), CHIAVI);

await p.goto(SITO, { waitUntil: 'networkidle' });
await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
await p.waitForTimeout(2400);
const casa = await stato();
console.log('\n════ com\u2019e\u2019 appena aperto ════');
console.log('  ', casa.ordine);

/* ── 1 · si combina un guaio, di quelli veri ─────────────────────── */
console.log('\n════ si cambia tutto ════');
await p.click('[data-pal-veloce="magenta"]');
await p.waitForTimeout(300);

/* una sezione spostata col comando del pannello, che e' la strada vera */
await p.evaluate(() => document.getElementById('tecnologia')
  .scrollIntoView({ block: 'center', behavior: 'instant' }));
await p.waitForTimeout(200);
await p.evaluate(() => {
  const s = document.getElementById('tecnologia');
  s.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 60, clientY: 300 }));
});
await p.waitForTimeout(500);
const haPos = await p.evaluate(() =>
  !document.querySelector('.pal__sez--pos')?.hidden && !!document.querySelector('[data-pos="-1"]'));
if (haPos) {
  await p.click('[data-pos="-1"]');
  await p.waitForTimeout(600);
}
await p.evaluate(() => {
  const g = document.querySelector('[data-gr-set]:not([aria-checked="true"])');
  g && g.click();
  const v = document.querySelector('[data-gr-vedi]');
  if (v && !v.checked) { v.checked = true; v.dispatchEvent(new Event('change', { bubbles: true })); }
});
await p.waitForTimeout(500);

const guaio = await stato();
dice(guaio.palette !== casa.palette, `la palette e\u2019 cambiata (${guaio.palette})`);
dice(guaio.ordine !== casa.ordine || guaio.griglie !== casa.griglie,
     'e qualcosa si e\u2019 mosso');
dice(guaio.chiavi.length >= 2, `il browser se l\u2019e\u2019 segnato (${guaio.chiavi.join(', ')})`);

/* il brief: ci si scrive dentro, e deve restare */
await p.evaluate(() => document.getElementById('brief').scrollIntoView({ block: 'center', behavior: 'instant' }));
await p.waitForTimeout(250);
await p.evaluate(() => {
  const r = document.querySelector('input[name="project_type"][value="video"]');
  if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
});
await p.waitForTimeout(400);

/* ── 2 · il primo colpo chiede soltanto ──────────────────────────── */
console.log('\n════ il tasto ════');
await p.evaluate(() => document.querySelector('[data-pal-apri]').click());
await p.waitForTimeout(500);
await p.click('[data-pal-azzera]');
await p.waitForTimeout(250);
const chiesto = await p.evaluate(() => ({
  eti: document.querySelector('[data-pal-azzera]').textContent.trim(),
  palette: document.documentElement.dataset.palette,
}));
dice(/sicuro/i.test(chiesto.eti), `il primo colpo chiede e basta: "${chiesto.eti}"`);
dice(chiesto.palette === guaio.palette, 'e non ha ancora toccato niente');

/* ── 3 · il secondo azzera ───────────────────────────────────────── */
await p.click('[data-pal-azzera]');
await p.waitForTimeout(900);
const dopo = await stato();
dice(dopo.palette === casa.palette, `la palette e\u2019 tornata ${dopo.palette}`);
dice(dopo.ordine === casa.ordine, 'le sezioni sono in fila come all\u2019inizio');
dice(dopo.griglie === casa.griglie, 'l\u2019impaginazione e\u2019 quella di partenza');
dice(dopo.vista === false, 'la griglia a vista e\u2019 spenta');
dice(dopo.chiavi.length === 0, `e il browser ha dimenticato tutto (${dopo.chiavi.join(', ') || 'niente'})`);

/* ── 4 · la prova che conta: dopo il ricarico ────────────────────── */
console.log('\n════ e dopo il ricarico ════');
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(2400);
const domani = await stato();
dice(domani.palette === casa.palette, `la palette e\u2019 ancora ${domani.palette}`);
dice(domani.ordine === casa.ordine, 'le sezioni sono ancora in fila');
dice(domani.griglie === casa.griglie, 'l\u2019impaginazione regge');
dice(domani.chiavi.length === 0, 'e non e\u2019 rispuntato niente in memoria');

/* ── 5 · il brief non e' stato toccato ───────────────────────────── */
const brief = await p.evaluate(() => {
  const k = Object.keys(sessionStorage).filter(x => /brief/i.test(x));
  return { chiavi: k.length, roba: k.map(x => sessionStorage.getItem(x)).join('').includes('video') };
});
dice(brief.chiavi > 0 && brief.roba,
     `le risposte del brief sono ancora li\u2019 (${brief.chiavi} chiave/i)`);

dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\nil tasto rimette davvero tutto com\u2019era');
process.exitCode = rotte ? 1 : 0;
