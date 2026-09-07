/* ═══════════════════════════════════════════════════════════════════
 * IL BRIEF FINISCE DAVVERO NEGLI APPUNTI?
 *
 * Tolto l'indirizzo di posta, il brief si copia. Un pulsante che dice
 * di aver copiato senza aver copiato sarebbe peggio del pulsante che
 * apriva la posta su una casella inventata. Quindi rispondo alle sei
 * domande, premo, e vado a leggere gli appunti veri.
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage();
const errori = [];
p.on('pageerror', e => errori.push(String(e)));
p.on('console', m => m.type() === 'error' && errori.push(m.text()));

await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelector('#s-alchimista').scrollIntoView());
await p.waitForTimeout(700);

/* le sei domande, rispondendo sempre con il primo tasto */
for (let i = 0; i < 6; i++) {
  const tasti = p.locator('#risposteBrief .tasto');
  if (!await tasti.count()) break;
  await tasti.first().click();
  await p.waitForTimeout(220);
}

const stato = await p.evaluate(() => ({
  righe: [...document.querySelectorAll('#riepilogo li')].map(l => l.textContent.trim()),
  cta: !document.querySelector('#mandaBrief').hidden,
  etichetta: document.querySelector('#mandaBrief').textContent.trim(),
  tag: document.querySelector('#mandaBrief').tagName,
  href: document.querySelector('#mandaBrief').getAttribute('href'),
}));
console.log('risposte raccolte :', stato.righe.length);
stato.righe.forEach(r => console.log('   ' + r));
console.log('tasto             :', stato.tag, `"${stato.etichetta}"`, '· visibile:', stato.cta,
            '· href:', stato.href === null ? 'nessuno' : stato.href);

await p.locator('#mandaBrief').click();
await p.waitForTimeout(400);
const appunti = await p.evaluate(() => navigator.clipboard.readText());
const detto = await p.locator('#statoBrief').textContent();

console.log('\nnegli appunti     :', JSON.stringify(appunti.slice(0, 60)) + (appunti.length > 60 ? '…' : ''));
/* gli appunti di Windows tornano con \r\n, e la riga vuota in mezzo
   resta un "\r": contando con filter(Boolean) ne venivano due di piu' */
const righe = appunti.split(/\r?\n/).filter(r => r.trim());
console.log('righe copiate     :', righe.length);
console.log('la pagina dice    :', detto.trim());
console.log('errori            :', errori.length, errori.slice(0, 3).join(' | '));

const ok = stato.cta && stato.href === null && appunti.includes('Brief F/AI')
  && righe.length === stato.righe.length + 1
  && /copiato/i.test(detto) && !errori.length;
console.log('\n' + (ok ? 'il brief finisce negli appunti' : 'QUALCOSA NON TORNA'));
await b.close();
process.exit(ok ? 0 : 1);
