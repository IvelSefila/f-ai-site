/* ═══════════════════════════════════════════════════════════════════
 * DOVE LA PAGINA SI RIPETE
 *
 * La pagina e' lunga venticinquemila pixel. Prima di tagliare a occhio
 * conviene misurare che cosa dice due volte: si prende tutto il testo
 * visibile, lo si spezza in frasi, e si confrontano tutte le frasi con
 * tutte le altre. Due frasi che condividono il 55% delle parole piene
 * (tolti articoli, preposizioni e verbi di servizio) dicono la stessa
 * cosa anche quando sono scritte diverse.
 *
 * Poi i CONCETTI: certe parole sono la firma di un'idea — "browser",
 * "seed", "dodici colonne", "GPT Image". Se la stessa idea compare in
 * quattro punti lontani, o e' un ritornello voluto o e' una ripetizione
 * che allunga e basta.
 *
 * E infine quanto pesa ogni pezzo in pixel, perche' tagliare dove non
 * c'e' peso non accorcia niente.
 *
 * uso: node audit/doppioni.mjs
 *      node audit/doppioni.mjs 40     (soglia di somiglianza in %)
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html';
const SOGLIA = (+process.argv[2] || 55) / 100;

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(SITO, { waitUntil: 'networkidle' });
await p.waitForTimeout(2400);

const dati = await p.evaluate(() => {
  const pezzi = [];
  /* ogni blocco che ha un nome proprio: sezione o sotto-blocco */
  const zone = [...document.querySelectorAll('#main > section, .sec__sub, .union, .eso, .locanda, .cest')];
  const zonaDi = (n) => {
    for (let e = n; e; e = e.parentElement) {
      if (e.matches?.('.sec__sub,.union,.eso,.locanda,.cest')) return e.id || e.className.split(' ')[0];
      if (e.matches?.('#main > section')) return e.id;
    }
    return '?';
  };
  const cammina = (n) => {
    for (const f of n.childNodes) {
      if (f.nodeType === 3) {
        const t = f.textContent.replace(/\s+/g, ' ').trim();
        if (t.length > 24) {
          const pe = f.parentElement;
          const cs = getComputedStyle(pe);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          pezzi.push({ zona: zonaDi(pe), tag: pe.tagName.toLowerCase(), testo: t });
        }
      } else if (f.nodeType === 1 && !f.matches('script,style,svg,canvas,noscript')) cammina(f);
    }
  };
  cammina(document.getElementById('main'));

  const alt = {};
  const H = document.body.scrollHeight;
  for (const z of zone) {
    const r = z.getBoundingClientRect();
    const id = z.id || z.className.split(' ')[0];
    alt[id] = { px: Math.round(r.height), pc: +(r.height * 100 / H).toFixed(1) };
  }
  return { pezzi, alt, H };
});
await b.close();

/* ── le frasi ────────────────────────────────────────────────────── */
const VUOTE = new Set(('il lo la i gli le un uno una di a da in con su per tra fra e o che chi cui non ne si ci vi mi ti ' +
  'del dello della dei degli delle al allo alla ai agli alle dal dallo dalla dai dagli dalle nel nello nella nei negli nelle ' +
  'sul sullo sulla sui sugli sulle col coi è e\' sono ha hai ho hanno essere avere come piu\' più anche solo ma se quando ' +
  'dove quello quella quelli quelle questo questa questi queste c\'è ce cosa cose fa fare faccio ogni tutto tutti tutte ' +
  'sua suo suoi sue mio mia miei mie tuo tua tuoi tue lui lei loro poi gia\' già qui li la\' là' ).split(' '));

const parole = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9' ]/g, ' ').split(/\s+/)
  .filter(w => w.length > 2 && !VUOTE.has(w));

const frasi = [];
for (const pz of dati.pezzi)
  for (const f of pz.testo.split(/(?<=[.:;!?])\s+/))
    if (f.trim().length > 34) frasi.push({ ...pz, f: f.trim(), w: new Set(parole(f)) });

const somiglia = (a, b) => {
  let c = 0;
  for (const w of a) if (b.has(w)) c++;
  return c / Math.min(a.size, b.size);
};

const coppie = [];
for (let i = 0; i < frasi.length; i++)
  for (let j = i + 1; j < frasi.length; j++) {
    if (frasi[i].w.size < 4 || frasi[j].w.size < 4) continue;
    const q = somiglia(frasi[i].w, frasi[j].w);
    if (q >= SOGLIA) coppie.push({ q, a: frasi[i], b: frasi[j] });
  }
coppie.sort((x, y) => y.q - x.q);

console.log(`\n════ FRASI CHE DICONO LA STESSA COSA (soglia ${Math.round(SOGLIA * 100)}%) ════`);
let mostrate = 0;
for (const c of coppie) {
  if (c.a.zona === c.b.zona && c.a.tag === c.b.tag) continue;   /* dentro lo stesso elenco e' una serie, non un doppione */
  console.log(`\n  ${Math.round(c.q * 100)}%  ${c.a.zona} ↔ ${c.b.zona}`);
  console.log(`    · ${c.a.f.slice(0, 118)}`);
  console.log(`    · ${c.b.f.slice(0, 118)}`);
  if (++mostrate >= 22) break;
}
if (!mostrate) console.log('  nessuna');

/* ── i concetti ripetuti ─────────────────────────────────────────── */
const CONCETTI = {
  'resta nel browser': /nel tuo browser|non salva|non manda|non lo invia|non esce dal|nessun server/i,
  'seed / immagini generate': /\bseed\b|le disegna (questa )?pagina|rigener/i,
  'dodici colonne / impaginazione': /dodici colonne|impaginazione|colonne invisibili/i,
  'sposta i blocchi': /trascina|tieni premuto|spostar|sposta/i,
  'GPT Image': /gpt image/i,
  'Premiere': /premiere/i,
  'Photoshop': /photoshop/i,
  'quanta AI entra': /quanta (macchina|ai)|con ai.{0,4}o.{0,4}senza ai|dove entra la macchina/i,
  'grafico + video + sistemi': /grafic[ao] pubblicitari|video editor|montaggio|social e flussi/i,
  'stime, non promesse': /stime|dichiarat|non promesse|non misure/i,
  'niente ripreso dal vivo': /nessuna ripresa|ripresa dal vivo|non si poteva fotografare|generat/i,
};
console.log('\n════ CONCETTI CHE TORNANO ════');
for (const [nome, re] of Object.entries(CONCETTI)) {
  const dove = {};
  for (const f of frasi) if (re.test(f.f)) dove[f.zona] = (dove[f.zona] || 0) + 1;
  const zone = Object.entries(dove);
  if (zone.length >= 2)
    console.log(`  ${nome.padEnd(30)} ${zone.length} zone: ${zone.map(([z, n]) => z + (n > 1 ? '×' + n : '')).join(', ')}`);
}

/* ── quanto pesa ogni pezzo ──────────────────────────────────────── */
console.log(`\n════ QUANTO PESA (pagina ${dati.H} px) ════`);
for (const [id, a] of Object.entries(dati.alt).sort((x, y) => y[1].px - x[1].px))
  console.log(`  ${String(a.pc).padStart(5)}%  ${String(a.px).padStart(6)} px  ${id}`);
