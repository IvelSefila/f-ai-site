/* ═══════════════════════════════════════════════════════════════════
 * IL PANNELLO CI STA NELLO SCHERMO?
 *
 * Aggiungendo i comandi di posizione il pannello si e' allungato, e a
 * 900 px di altezza il bottone "Chiudi" e' finito sotto il bordo dello
 * schermo. Aveva gia' un max-height ma nessun overflow: il contenuto
 * in piu' usciva invece di scorrere.
 *
 * Questa prova guarda tre cose, per tre schermi: che il pannello non
 * sia piu' alto dello schermo, che se il contenuto e' piu' alto si
 * possa scorrere, e che l'ultimo bottone sia raggiungibile davvero.
 *
 * uso: node audit/pannello-ci-sta.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const b = await chromium.launch({
  executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

const SCHERMI = [
  ['portatile piccolo', { width: 1280, height: 720 }, false],
  ['desktop',           { width: 1440, height: 900 }, false],
  ['telefono',          { width: 390,  height: 844 }, true],
];

for (const [nome, vp, dito] of SCHERMI) {
  const ctx = await b.newContext({ viewport: vp, isMobile: dito, hasTouch: dito });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8899/v2/index.html?probe=1', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2200);

  /* apro il pannello sul riquadro che ha PIU' roba dentro: uno che sta
     in un gruppo, quindi con colore, griglia e posizione tutti e tre */
  await p.evaluate(() => {
    document.querySelectorAll('.work')[0].scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  const a = await p.evaluate(() => {
    const r = document.querySelectorAll('.work')[0].getBoundingClientRect();
    return { x: Math.round(r.left + 14), y: Math.round(r.top + 12) };
  });
  await p.mouse.move(a.x, a.y);
  await p.mouse.down(); await p.waitForTimeout(750); await p.mouse.up();
  await p.waitForTimeout(400);

  const m = await p.evaluate(() => {
    const d = document.getElementById('palPanel');
    const r = d.getBoundingClientRect();
    const ch = d.querySelector('[data-pal-chiudi]');
    /* prima cosa: si vede senza dover scorrere? E' questo che fa il
       piede appiccicato, e senza questa domanda la prova passava
       anche prima, perche' un dialog scorre comunque. */
    d.scrollTop = 0;
    const su = ch.getBoundingClientRect();
    const subito = su.top >= -1 && su.bottom <= innerHeight + 1;
    d.scrollTop = d.scrollHeight;                 /* poi: fino in fondo */
    const rc = ch.getBoundingClientRect();
    return {
      aperto: d.open, subito,
      alto: Math.round(r.height), schermo: innerHeight,
      scorre: d.scrollHeight > d.clientHeight + 1,
      chiudiDentro: rc.top >= -1 && rc.bottom <= innerHeight + 1,
      sez: [...d.querySelectorAll('.pal__sez')].filter(s => !s.hidden).length,
    };
  });

  console.log(`── ${nome} ${vp.width}×${vp.height} ── pannello ${m.alto} px · ${m.sez} sezioni in piu'${m.scorre ? ' · scorre' : ''}`);
  dice(m.aperto, 'il pannello si apre');
  dice(m.alto <= m.schermo, `non e' piu' alto dello schermo (${m.alto} ≤ ${m.schermo})`);
  dice(m.chiudiDentro, 'il bottone "Chiudi" si raggiunge');
  dice(m.subito, 'e si vede subito, senza scorrere');
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} prove rotte` : '\ntutto a posto');
process.exitCode = rotte ? 1 : 0;
