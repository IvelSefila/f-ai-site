/* ═══════════════════════════════════════════════════════════════════
 * LA RADICE
 *
 * E' lo schermo che un cliente incontra per primo, e finora nessuna
 * prova lo guardava: le prove partivano tutte da /v2/. Qui si controlla
 * che dica cosa faccio PRIMA di chiedere di scegliere fra due versioni,
 * che le due porte funzionino, e che i numeri che promette siano quelli
 * veri — "undici sezioni" e "quindici pigmenti" erano rimasti indietro
 * di parecchio.
 *
 * uso: node audit/radice.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';
import fs from 'node:fs';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

/* i numeri veri, letti dai file e non ricopiati a mano */
const sezioni = (fs.readFileSync('site/v2/index.html', 'utf8').match(/^<section/gm) || []).length;
const pigmenti = (fs.readFileSync('site/pixel/tavolozza.js', 'utf8').match(/'#[0-9a-f]{6}'/g) || []).length;
console.log(`nei file: ${sezioni} sezioni · ${pigmenti} pigmenti`);

for (const [nome, vp] of [['telefono', { width: 390, height: 844 }],
                          ['desktop', { width: 1440, height: 900 }]]) {
  console.log(`\n════ ${nome} ${vp.width}×${vp.height} ════`);
  const ctx = await b.newContext({ viewport: vp, isMobile: vp.width < 700, hasTouch: vp.width < 700 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('response', r => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
  await p.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);

  const m = await p.evaluate(() => {
    const t = (s) => (document.querySelector(s)?.textContent || '').replace(/\s+/g, ' ').trim();
    const porte = [...document.querySelectorAll('.porta')];
    const cosa = document.querySelector('.cosa');
    const primaPorta = porte[0]?.getBoundingClientRect().top ?? 0;
    return {
      cosa: t('.cosa'),
      cosaPrima: !!cosa && cosa.getBoundingClientRect().bottom <= primaPorta + 1,
      porte: porte.map(a => ({ href: a.getAttribute('href'),
                               alto: Math.round(a.getBoundingClientRect().height) })),
      testo: document.body.innerText.replace(/\s+/g, ' '),
      orizzontale: document.documentElement.scrollWidth > innerWidth + 1,
      largo: Math.round(document.querySelector('main').getBoundingClientRect().width),
      schermo: innerWidth,
    };
  });

  dice(m.cosa.length > 80, 'la pagina dice cosa faccio prima di far scegliere');
  dice(m.cosaPrima, 'e lo dice SOPRA le due porte, non sotto');
  dice(m.porte.length === 2, `due porte (${m.porte.map(x => x.href).join(', ')})`);
  dice(m.porte.every(x => x.alto >= 44), 'tutte e due si prendono col pollice');
  dice(!m.orizzontale, `niente scorrimento orizzontale (main ${m.largo} su ${m.schermo})`);
  dice(m.testo.includes(`Tredici sezioni`) && sezioni === 13,
       `dice "Tredici sezioni" e nei file sono ${sezioni}`);
  dice(m.testo.includes('sessantaquattro') && pigmenti === 64,
       `dice "sessantaquattro pigmenti" e nei file sono ${pigmenti}`);
  dice(!/8 bit/.test(m.testo), 'non promette piu\u2019 8 bit: la torre e\u2019 a 16');

  /* le due porte portano davvero da qualche parte */
  for (const { href } of m.porte) {
    const r = await p.goto('http://localhost:8899/' + href, { waitUntil: 'domcontentloaded' });
    dice(r.status() === 200, `${href} risponde ${r.status()}`);
    await p.goBack({ waitUntil: 'domcontentloaded' });
  }
  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\nla radice regge');
process.exitCode = rotte ? 1 : 0;
