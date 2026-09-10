/* ═══════════════════════════════════════════════════════════════════
 * GLI STRUMENTI SI APRONO
 *
 * Il controllo che conta e' il primo: OGNI pastiglia deve avere la sua
 * scheda. Una voce aggiunta all'elenco senza la descrizione resterebbe
 * una pastiglia morta in mezzo a trentaquattro vive, e guardando la
 * pagina non si noterebbe — si nota solo cliccandoci sopra, cioe' mai
 * durante una rilettura.
 *
 * Poi: che si apra davvero col dito e con la tastiera, che si chiuda con
 * Esc, che il fuoco torni da dove era partito (senza, chi naviga a
 * tastiera si ritrova in cima alla pagina), che il testo dentro sia
 * quello dello strumento giusto, e che col pollice si prendano.
 *
 * uso: node audit/strumenti.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html?probe=1';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

for (const [nome, vp, dito] of [['telefono', { width: 390, height: 844 }, true],
                                ['desktop', { width: 1440, height: 900 }, false]]) {
  console.log(`\n════ ${nome} ${vp.width}×${vp.height} ════`);
  const ctx = await b.newContext({ viewport: vp, isMobile: dito, hasTouch: dito });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  /* Gli avvisi contano — e' con un console.warn che strumenti.js segnala
     una pastiglia senza scheda. Tranne quelli del driver grafico finto
     di questa prova, che parla di stalli della GPU che sul computer di
     chi guarda non esistono. */
  p.on('console', m => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const t = m.text();
    if (/WebGL|GL Driver|GPU stall|SwiftShader/i.test(t)) return;
    errs.push(t.slice(0, 160));
  });
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2300);

  /* ── dove sta il blocco ─────────────────────────────────────────── */
  const dove = await p.evaluate(() => {
    const st = document.querySelector('.stack');
    if (!st) return null;
    const sez = st.closest('#main > section');
    const tutte = [...document.querySelectorAll('#main > section')];
    return { sezione: sez.id, posizione: tutte.indexOf(sez) + 1, quante: tutte.length };
  });
  dice(!!dove && dove.sezione === 'banchi',
       `il blocco sta nei servizi, sezione ${dove?.posizione} di ${dove?.quante}`);

  /* ── ogni pastiglia ha la sua scheda ────────────────────────────── */
  const conto = await p.evaluate(() => {
    const voci = [...document.querySelectorAll('.stack__group > div > *')];
    return {
      totale: voci.length,
      bottoni: voci.filter(e => e.tagName === 'BUTTON').length,
      morte: voci.filter(e => e.tagName !== 'BUTTON').map(e => e.textContent.trim()),
      dichiarate: (document.querySelector('.stack__head span') || {}).textContent || '',
    };
  });
  dice(conto.morte.length === 0,
       `tutte e ${conto.totale} le voci si aprono${conto.morte.length ? ' — senza scheda: ' + conto.morte.join(', ') : ''}`);
  dice(conto.dichiarate.includes(String(conto.totale)),
       `l'intestazione dice ${conto.totale} e le voci sono ${conto.totale}`);

  /* ── col pollice ────────────────────────────────────────────────── */
  if (dito) {
    const piccole = await p.evaluate(() => [...document.querySelectorAll('.stack__group > div > button')]
      .map(e => ({ n: e.textContent.trim(), h: Math.round(e.getBoundingClientRect().height) }))
      .filter(x => x.h < 44).slice(0, 4));
    dice(piccole.length === 0,
         `tutte alte almeno 44px${piccole.length ? ' — ' + piccole.map(x => `${x.n} ${x.h}px`).join(', ') : ''}`);
  }

  /* ── si apre, dice la cosa giusta, si chiude ────────────────────── */
  await p.evaluate(() => document.querySelector('.stack')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(300);

  const primo = await p.evaluate(() => {
    const b = document.querySelector('.stack__group--creative button');
    return b ? b.textContent.trim() : null;
  });
  await p.click('.stack__group--creative button');
  await p.waitForTimeout(350);
  const dentro = await p.evaluate(() => {
    const d = document.getElementById('schedaStrumento');
    if (!d || !d.open) return null;
    return {
      titolo: d.querySelector('h3').textContent.trim(),
      categoria: d.querySelector('.scheda__cat').textContent.trim(),
      cos: d.querySelector('.scheda__cos').textContent.trim(),
      voci: [...d.querySelectorAll('.scheda__lista li')].map(li => li.textContent.trim()),
      dentroSchermo: d.getBoundingClientRect().height <= innerHeight + 1,
    };
  });
  dice(!!dentro, 'la scheda si apre');
  dice(dentro && dentro.titolo === primo, `dice il nome giusto: "${dentro?.titolo}"`);
  dice(dentro && dentro.cos.length > 40, `dice che cos'e' (${dentro?.cos.length} battute)`);
  dice(dentro && dentro.voci.length >= 2,
       `e ${dentro?.voci.length} cose che ci faccio: "${dentro?.voci[0]}"`);
  /* Schematico vuol dire voci corte. Un elenco puntato in cui ogni voce
     e' un paragrafo e' un paragrafo travestito. */
  const lunghe = (dentro?.voci || []).filter(v => v.length > 90);
  dice(lunghe.length === 0, `le voci restano corte${lunghe.length ? ' — ' + lunghe[0].slice(0, 50) : ''}`);
  dice(dentro && !/^\d/.test(dentro.categoria) && dentro.categoria.length > 3,
       `col nome del gruppo senza il numero: "${dentro?.categoria}"`);
  dice(dentro && dentro.dentroSchermo, 'e sta dentro lo schermo');

  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  dice(await p.evaluate(() => !document.getElementById('schedaStrumento').open),
       'Esc la chiude');

  /* ── la tastiera: si arriva e si torna ──────────────────────────── */
  const tornato = await p.evaluate(async () => {
    const b = document.querySelectorAll('.stack__group--local button')[0];
    b.focus();
    b.click();
    await new Promise(r => setTimeout(r, 250));
    const aperta = document.getElementById('schedaStrumento').open;
    const fuoco = document.activeElement;
    const dentroLaScheda = document.getElementById('schedaStrumento').contains(fuoco);
    document.getElementById('schedaStrumento').close();
    await new Promise(r => setTimeout(r, 250));
    return { aperta, dentroLaScheda, torna: document.activeElement === b, nome: b.textContent.trim() };
  });
  dice(tornato.aperta, `si apre anche da tastiera (${tornato.nome})`);
  dice(tornato.dentroLaScheda, 'il fuoco entra nella scheda');
  dice(tornato.torna, 'e chiudendola torna sulla pastiglia da cui era partito');

  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\ntutti gli strumenti si aprono');
process.exitCode = rotte ? 1 : 0;
