/* ═══════════════════════════════════════════════════════════════════
 * LE COLONNE TENGONO?
 *
 * Il pannello offre sette impaginazioni per ogni gruppo — una colonna,
 * due, tre, quattro, 8+4, 4+8, 6+3+3 — e finora nessuno aveva guardato
 * cosa succede davvero a sceglierle. Qui si guardano tutte, su ogni
 * gruppo, a tre larghezze.
 *
 * Tre domande, e sono diverse fra loro:
 *
 *  · SBORDA? Un testo che non entra nella sua colonna. Si vede
 *    confrontando scrollWidth e clientWidth: se il contenuto e' piu'
 *    largo del contenitore, o esce o viene tagliato, e nessuna delle
 *    due va bene. Una parola lunga in una colonna da 3/12 e' il caso
 *    tipico.
 *
 *  · ESCE DAL GRUPPO? Il bordo destro di una carta oltre il bordo
 *    destro del gruppo che la contiene.
 *
 *  · I TESTI SONO IN RIGA? Due carte affiancate devono cominciare a
 *    scrivere alla stessa altezza. Con colonne di larghezza diversa
 *    (8+4, 6+3+3) le immagini dentro le carte hanno proporzioni fisse,
 *    quindi altezze diverse, e il titolo di una scende piu' in basso
 *    di quello dell'altra: la riga di testo si sfalsa. E' la cosa che
 *    si nota per prima e la piu' facile da non vedere scrivendo il CSS.
 *
 * uso: node audit/colonne-tengono.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html?probe=1';
const PRESET = ['1', '2', '3', '4', '8-4', '4-8', '6-3-3'];
const GRUPPI = ['.deck', '.offerta__grid', '.lab', '.istruzioni', '.appmie__grid', '#formats', '#socials', '.bench'];
const LARGHEZZE = [[390, 844], [1024, 900], [1440, 900]];
const SFALSO = 4;        /* px di tolleranza sull'allineamento dei testi */

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

/* ── la misura, dentro la pagina ──────────────────────────────────── */
const MISURA = (sel) => {
  const g = document.querySelector(sel);
  if (!g) return { assente: true };
  const gr = g.getBoundingClientRect();
  const figli = [...g.children];
  const guai = [];

  /* sborda: contenuto piu' largo del suo contenitore */
  for (const f of figli)
    for (const e of [f, ...f.querySelectorAll('*')]) {
      if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible') {
        const t = (e.textContent || '').trim().slice(0, 26);
        guai.push(`sborda ${e.scrollWidth - e.clientWidth}px: "${t}"`);
        break;
      }
    }

  /* esce dal gruppo */
  for (const f of figli) {
    const r = f.getBoundingClientRect();
    if (r.right > gr.right + 1) guai.push(`esce a destra di ${Math.round(r.right - gr.right)}px`);
    if (r.left < gr.left - 1) guai.push(`esce a sinistra di ${Math.round(gr.left - r.left)}px`);
  }

  /* i testi in riga: per ogni riga visiva, quanto si sfalsa il primo
     testo delle carte affiancate */
  const righe = new Map();
  for (const f of figli) {
    const y = Math.round(f.getBoundingClientRect().top);
    const k = [...righe.keys()].find(v => Math.abs(v - y) < 6);
    (righe.get(k ?? y) || righe.set(y, []).get(y)).push(f);
  }
  /* Solo fra carte LARGHE UGUALE. Con colonne diverse — 8+4, 6+3+3 —
     una carta e' il doppio dell'altra e la sua immagine, che ha le
     proporzioni fisse, e' il doppio piu' alta: il titolo sotto scende, e
     deve scendere. Guardato a schermo e' un impaginato da rivista, non
     un difetto. La prima versione di questa misura le confrontava
     comunque e gridava "347px di sfalsamento" su una pagina giusta.
     Fra carte della stessa larghezza invece il testo DEVE partire alla
     stessa altezza, e li' uno sfalsamento e' un difetto vero. */
  let sfalso = 0, dove = '';
  for (const [, riga] of righe) {
    if (riga.length < 2) continue;
    /* ...e solo fra blocchi DELLO STESSO TIPO. In un banco, sotto certe
       impaginazioni, la fila dei formati e il pannello di testo
       diventano larghi uguale: la misura li confrontava e trovava 500px
       di sfalsamento fra tre canvas e un paragrafo, che non e' un
       difetto ma un paragone che non ha senso fare. */
    const tipo = (f) => String(f.className).split(' ')[0];
    const pari = riga.filter(f => tipo(f) === tipo(riga[0])
      && Math.abs(f.getBoundingClientRect().width - riga[0].getBoundingClientRect().width) < 2);
    if (pari.length < 2) continue;
    const y = pari.map(f => {
      const t = f.querySelector('h3, h2, figcaption, p');
      return t ? t.getBoundingClientRect().top : f.getBoundingClientRect().top;
    });
    const d = Math.round(Math.max(...y) - Math.min(...y));
    if (d > sfalso) { sfalso = d; dove = pari.map(f => f.className.split(' ')[0]).join('+'); }
  }

  const larghezze = figli.map(f => Math.round(f.getBoundingClientRect().width));
  return {
    guai: [...new Set(guai)],
    sfalso, dove,
    stretta: Math.min(...larghezze),
    orizzontale: document.documentElement.scrollWidth > innerWidth + 1,
  };
};

let rotte = 0;
for (const [w, h] of LARGHEZZE) {
  console.log(`\n════ ${w}×${h} ════`);
  const ctx = await b.newContext({ viewport: { width: w, height: h },
    isMobile: w < 700, hasTouch: w < 700 });
  const p = await ctx.newPage();
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2200);

  for (const sel of GRUPPI) {
    const righe = [];
    for (const preset of PRESET) {
      await p.evaluate(({ s, v }) => {
        const g = document.querySelector(s);
        if (g) { g.dataset.gr = v; g.scrollIntoView({ block: 'center', behavior: 'instant' }); }
      }, { s: sel, v: preset });
      await p.waitForTimeout(160);
      const m = await p.evaluate(MISURA, sel);
      if (m.assente) { righe.push(`${preset}: gruppo assente`); continue; }
      const male = m.guai.length || m.sfalso > SFALSO || m.orizzontale;
      if (male) rotte++;
      righe.push(`  ${male ? '✗' : '✓'} ${preset.padEnd(5)} larghezza minima ${String(m.stretta).padStart(4)}px`
        + (m.sfalso > SFALSO ? ` · testi sfalsati di ${m.sfalso}px (${m.dove})` : '')
        + (m.orizzontale ? ' · SCORRIMENTO ORIZZONTALE' : '')
        + (m.guai.length ? ' · ' + m.guai.slice(0, 2).join(' · ') : ''));
    }
    console.log(` ${sel}`);
    righe.forEach(r => console.log(r));
    /* rimetto il gruppo com'era */
    await p.evaluate(s => { const g = document.querySelector(s); if (g) delete g.dataset.gr; }, sel);
  }
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} combinazioni con problemi` : '\ntutte le combinazioni tengono');
process.exitCode = rotte ? 1 : 0;
