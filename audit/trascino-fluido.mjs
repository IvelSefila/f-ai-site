/* ═══════════════════════════════════════════════════════════════════
 * QUANTO E' FLUIDO IL TRASCINAMENTO
 *
 * "Scatta" non e' una misura. Questa lo e': mentre il dito trascina,
 * un ciclo di requestAnimationFrame segna la distanza fra un fotogramma
 * e il successivo. Su uno schermo a 60 Hz un fotogramma dura 16,7 ms;
 * quello che si vede come scatto sono i fotogrammi saltati, cioe' gli
 * intervalli sopra i 33 ms.
 *
 * Si misura due volte: sul computer com'e', e con la CPU rallentata
 * quattro volte, che e' l'approssimazione di un telefono di fascia
 * media — la stessa che si usa per la torre in pixel art.
 *
 * E si misurano due trascinamenti diversi, perche' fanno lavori
 * diversi: una carta dentro il suo gruppo (tre vicini, un canvas
 * ciascuno) e una sezione nella mappa (dodici bande).
 *
 * uso: node audit/trascino-fluido.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html?probe=1';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const dorme = (p, ms) => p.waitForTimeout(ms);

/* Quanto LAVORO fa ogni fotogramma, non solo se arriva in tempo.

   La cadenza da sola non bastava: a 60 fps pieni anche con la CPU
   rallentata quattro volte, il trascinamento restava legnoso. Quello
   che si sente e' il lavoro di layout: ogni chiamata a
   getBoundingClientRect obbliga il browser a ricalcolare la geometria
   della pagina — 14.000 px di contenuto e sedici canvas — prima di
   poter rispondere. Contarle e' una misura pulita, che non dipende da
   quanto e' carica la macchina in quel momento. */
const AVVIA = () => {
  window.__geo = 0;
  if (!Element.prototype.__vero) {
    Element.prototype.__vero = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      window.__geo = (window.__geo | 0) + 1;
      return Element.prototype.__vero.call(this);
    };
  }
  window.__geo = 0;
  window.__f = [];
  window.__t0 = performance.now();
  let ultimo = performance.now();
  const giro = (t) => { window.__f.push(t - ultimo); ultimo = t; window.__r = requestAnimationFrame(giro); };
  window.__r = requestAnimationFrame(giro);
  window.__lunghi = 0;
  /* long-animation-frame dice DOVE va il tempo dentro un fotogramma
     lento: quanto in script, quanto in stile e layout, quanto a
     disegnare. Senza, si tira a indovinare. */
  window.__loaf = { n: 0, stile: 0, disegno: 0, script: 0, chi: {} };
  try {
    window.__po = new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lunghi += e.duration; });
    window.__po.observe({ entryTypes: ['longtask'] });
  } catch {}
  try {
    window.__po2 = new PerformanceObserver(l => {
      for (const e of l.getEntries()) {
        window.__loaf.n++;
        window.__loaf.stile += e.styleAndLayoutDuration || 0;
        window.__loaf.disegno += (e.duration || 0) - (e.renderStart ? e.renderStart - e.startTime : 0);
        for (const sc of e.scripts || []) {
          window.__loaf.script += sc.duration || 0;
          const k = ((sc.invoker || '?') + ' ' + (sc.sourceFunctionName || '')
                   + ' ' + String(sc.sourceURL || '').split('/').pop()).slice(0, 62);
          window.__loaf.chi[k] = Math.round((window.__loaf.chi[k] || 0) + sc.duration);
        }
      }
    });
    window.__po2.observe({ type: 'long-animation-frame', buffered: false });
  } catch {}
};
const FERMA = () => {
  cancelAnimationFrame(window.__r);
  try { window.__po.disconnect(); } catch {}
  try { window.__po2.disconnect(); } catch {}
  const f = window.__f.slice(2);         /* i primi due sono il rodaggio */
  const ordinati = [...f].sort((a, b) => a - b);
  const q = (x) => ordinati[Math.min(ordinati.length - 1, Math.round(x * (ordinati.length - 1)))] || 0;
  return {
    geo: window.__geo,
    fotogrammi: f.length,
    medio: +(f.reduce((s, v) => s + v, 0) / (f.length || 1)).toFixed(1),
    p95: +q(.95).toFixed(1),
    peggio: +Math.max(...f, 0).toFixed(1),
    saltati: f.filter(v => v > 33).length,
    lunghi: Math.round(window.__lunghi),
    loaf: window.__loaf,
  };
};

function riga(nome, m) {
  console.log(`  ${nome.padEnd(21)} medio ${String(m.medio).padStart(5)} ms`
    + ` · peggio ${String(m.peggio).padStart(6)} ms · saltati ${String(m.saltati).padStart(3)}`
    + ` · geometrie ${String(m.geo).padStart(4)}`
    + (m.lunghi ? ` · ${m.lunghi} ms lunghi` : ''));
  const L = m.loaf;
  if (L && L.n) {
    const chi = Object.entries(L.chi).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([k, v]) => `${k} ${v}ms`).join(' · ');
    console.log(`${' '.repeat(23)}└ ${L.n} fotogrammi lenti · stile+layout ${Math.round(L.stile)} ms`
      + ` · script ${Math.round(L.script)} ms${chi ? ' · ' + chi : ''}`);
  }
}

for (const [nome, freno] of [['computer', 1], ['telefono (CPU ÷4)', 4], ['lento (CPU ÷8)', 8]]) {
  console.log(`\n════ ${nome} ════`);
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await dorme(p, 2400);
  if (freno > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: freno });

  /* ── il metro di paragone ────────────────────────────────────────
     Le stesse sessanta mosse del puntatore SENZA trascinare niente. Se
     la pagina salta lo stesso, quello che si vede non e' colpa del
     trascinamento ed e' inutile ottimizzarlo ancora: sarebbe come
     lucidare una maniglia su una porta che non si apre. */
  await p.evaluate(() => document.querySelectorAll('.work')[0]
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await dorme(p, 400);
  const c0 = await p.evaluate(() => {
    const r = document.querySelectorAll('.work')[0].getBoundingClientRect();
    return { x: Math.round(r.left + 16), y: Math.round(r.top + 12) };
  });
  await p.mouse.move(c0.x, c0.y);
  await p.evaluate(AVVIA);
  for (let k = 0; k < 60; k++) {
    const t = k / 59, sn = Math.sin(t * Math.PI * 2);
    await p.mouse.move(Math.round(c0.x + sn * 520), Math.round(c0.y + sn * 40));
    await dorme(p, 12);
  }
  riga('solo il puntatore', await p.evaluate(FERMA));

  /* ── una carta dentro il suo gruppo ─────────────────────────────── */
  await p.evaluate(() => document.querySelectorAll('.work')[0]
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await dorme(p, 400);
  let a = await p.evaluate(() => {
    const r = document.querySelectorAll('.work')[0].getBoundingClientRect();
    return { x: Math.round(r.left + 16), y: Math.round(r.top + 12) };
  });
  await p.mouse.move(a.x, a.y);
  await p.mouse.down();
  await dorme(p, 780);
  await p.evaluate(AVVIA);
  /* una corsa avanti e indietro, cosi' il riordino scatta piu' volte */
  for (let k = 0; k < 60; k++) {
    const t = k / 59, s = Math.sin(t * Math.PI * 2);
    await p.mouse.move(Math.round(a.x + s * 520), Math.round(a.y + s * 40));
    await dorme(p, 12);
  }
  riga('carta nel gruppo', await p.evaluate(FERMA));
  await p.mouse.up();
  await dorme(p, 600);

  /* ── la stessa carta, ma senza mai entrare in un vicino ──────────
     Serve a separare due costi che si sommano: muovere il pezzo, e
     riordinare il gruppo. Se questa corsa e' liscia e l'altra no, non
     c'e' niente da limare nel ciclo: e' lo spostamento nel DOM che
     costa, e va diradato. */
  await p.evaluate(() => document.querySelectorAll('.work')[0]
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await dorme(p, 400);
  const c1 = await p.evaluate(() => {
    const r = document.querySelectorAll('.work')[0].getBoundingClientRect();
    return { x: Math.round(r.left + 16), y: Math.round(r.top + 12) };
  });
  await p.mouse.move(c1.x, c1.y);
  await p.mouse.down();
  await dorme(p, 780);
  await p.evaluate(AVVIA);
  for (let k = 0; k < 60; k++) {
    const t = k / 59, sn = Math.sin(t * Math.PI * 2);
    await p.mouse.move(Math.round(c1.x + sn * 60), Math.round(c1.y + sn * 30));
    await dorme(p, 12);
  }
  riga('carta senza riordini', await p.evaluate(FERMA));
  await p.mouse.up();
  await dorme(p, 600);

  /* ── una sezione nella mappa ────────────────────────────────────── */
  await p.evaluate(() => document.querySelector('#lavori .sec__head')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await dorme(p, 400);
  a = await p.evaluate(() => {
    const r = document.querySelector('#lavori .sec__head').getBoundingClientRect();
    return { x: Math.round(r.left + 40), y: Math.round(Math.max(90, r.top + 20)) };
  });
  await p.mouse.move(a.x, a.y);
  await p.mouse.down();
  await dorme(p, 780);
  await p.mouse.move(a.x + 14, a.y + 6);
  await dorme(p, 300);
  const alto = await p.evaluate(() => innerHeight);
  await p.evaluate(AVVIA);
  for (let k = 0; k < 60; k++) {
    const t = k / 59, s = Math.sin(t * Math.PI * 2);
    await p.mouse.move(a.x + 14, Math.round(alto / 2 + s * (alto / 2 - 80)));
    await dorme(p, 12);
  }
  riga('sezione nella mappa', await p.evaluate(FERMA));
  await p.mouse.up();
  await dorme(p, 800);

  if (freno > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await ctx.close();
}

await b.close();
