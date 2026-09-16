/* ═══════════════════════════════════════════════════════════════════
 * LE QUATTRO FINESTRE DEI SERVIZI
 *
 * Le schede dicevano una riga a testa e chiedevano subito "Parliamo
 * della campagna". Adesso si aprono e spiegano il mestiere.
 *
 * Il contenuto di una finestra nessuna misura lo puo' giudicare — se
 * una frase e' vera o falsa lo sa solo chi l'ha scritta. Quello che si
 * puo' misurare e' tutto il resto, e serve perche' e' esattamente la
 * roba che marcisce in silenzio:
 *
 *  · che tutte e quattro si aprano, e con la roba dentro. Una finestra
 *    che si apre vuota non da' errore: da' una finestra vuota.
 *  · che i collegamenti di "dove si vede" portino a un'ancora che
 *    esiste. Se un giorno un caso cambia nome o sparisce, qui resta un
 *    collegamento che non porta da nessuna parte e nessuno se ne accorge
 *    finche' non lo prova.
 *  · che i nomi degli strumenti citati stiano DAVVERO nell'elenco degli
 *    strumenti di questa pagina. E' la promessa piu' facile da rompere:
 *    si aggiunge un nome alla finestra e ci si dimentica dell'elenco, e
 *    la pagina comincia a dire due cose diverse su di se'.
 *  · che si chiuda con Esc e che il fuoco della tastiera non resti
 *    intrappolato.
 *  · che "Parliamone" porti al brief con la risposta gia' segnata, che
 *    e' la ragione per cui l'invito e' stato spostato qui dentro.
 *
 * uso: node audit/servizi.mjs
 * ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';

const CROMO = 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const SITO = 'http://localhost:8899/v2/index.html';

const b = await chromium.launch({ executablePath: CROMO,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let rotte = 0;
const dice = (ok, t) => { if (!ok) rotte++; console.log(`  ${ok ? '✓' : '✗'} ${t}`); };

for (const [nome, vp, dito] of [['telefono', { width: 390, height: 844 }, true],
                                ['desktop', { width: 1440, height: 900 }, false]]) {
  console.log(`\n════ ${nome} ${vp.width}×${vp.height} ════`);
  const ctx = await b.newContext({ viewport: vp, isMobile: dito, hasTouch: dito });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(2400);

  const quante = await p.evaluate(() => document.querySelectorAll('.offerta__apri').length);
  dice(quante === 4, `tutte e quattro le schede si aprono (${quante})`);

  /* la scheda non deve contenere altri comandi: un collegamento dentro
     una scheda cliccabile e' una trappola per il dito e per la tastiera */
  const dentro = await p.evaluate(() => [...document.querySelectorAll('.offerta__card')]
    .map(c => c.querySelectorAll('a,button').length));
  dice(dentro.every(n => n === 1),
       `una scheda, un comando (${dentro.join(', ')})`);

  if (dito) {
    const piccoli = await p.evaluate(() => [...document.querySelectorAll('.offerta__apri')]
      .map(e => Math.round(e.getBoundingClientRect().height)).filter(h => h < 44).length);
    dice(piccoli === 0, 'i bottoni si prendono col pollice');
  }

  /* ── una per una ────────────────────────────────────────────────── */
  const CHIAVI = ['grafica', 'video', 'social', 'ai'];
  for (const chiave of CHIAVI) {
    await p.evaluate(k => document.querySelector(`.offerta__card[data-serv="${k}"]`)
      .scrollIntoView({ block: 'center', behavior: 'instant' }), chiave);
    await p.waitForTimeout(160);
    await p.click(`.offerta__card[data-serv="${chiave}"] .offerta__apri`);
    await p.waitForTimeout(420);

    const d = await p.evaluate(() => {
      const f = document.querySelector('.serv');
      if (!f || !f.open) return null;
      const testo = (s) => (f.querySelector(s)?.textContent || '').trim();
      return {
        titolo: testo('#servTit'),
        lede: testo('.serv__lede').length,
        consegno: f.querySelectorAll('.serv__lista li').length,
        passi: f.querySelectorAll('.serv__passi li').length,
        con: testo('.serv__con').split('·').map(x => x.trim()).filter(Boolean),
        dove: [...f.querySelectorAll('.serv__dove a')].map(a => a.getAttribute('href')),
        morte: [...f.querySelectorAll('.serv__dove a')]
          .filter(a => !document.querySelector(a.getAttribute('href')))
          .map(a => a.getAttribute('href')),
        /* i nomi scritti nell'elenco degli strumenti della pagina */
        fuoriElenco: (() => {
          const elenco = new Set([...document.querySelectorAll('.stack__group div > *')]
            .map(e => e.textContent.trim()));
          /* Alfred non e' uno strumento di altri: e' l'applicazione che
             ha scritto lui, e sta nel suo blocco, non nell'elenco */
          const suoi = new Set(['Alfred', 'Max Video Downloader']);
          return testo('.serv__con').split('·').map(x => x.trim()).filter(Boolean)
            .filter(n => !elenco.has(n) && !suoi.has(n));
        })(),
        invito: testo('[data-serv-brief]'),
      };
    });

    dice(!!d, `${chiave}: la finestra si apre`);
    if (!d) continue;
    dice(d.lede > 60 && d.consegno >= 4 && d.passi >= 3,
         `${chiave}: "${d.titolo}" — ${d.consegno} consegne, ${d.passi} passaggi`);
    dice(d.dove.length >= 2, `${chiave}: ${d.dove.length} collegamenti a lavori veri`);
    dice(d.morte.length === 0,
         `${chiave}: nessun collegamento morto${d.morte.length ? ' — ' + d.morte.join(', ') : ''}`);
    dice(d.fuoriElenco.length === 0,
         `${chiave}: gli strumenti citati stanno nell'elenco della pagina${d.fuoriElenco.length ? ' — fuori: ' + d.fuoriElenco.join(', ') : ''}`);

    await p.keyboard.press('Escape');
    await p.waitForTimeout(260);
    const chiusa = await p.evaluate(() => !document.querySelector('.serv')?.open);
    dice(chiusa, `${chiave}: Esc la chiude`);
  }

  /* ── e l'invito porta al brief gia' impostato ───────────────────── */
  await p.evaluate(() => document.querySelector('.offerta__card[data-serv="video"]')
    .scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(160);
  await p.click('.offerta__card[data-serv="video"] .offerta__apri');
  await p.waitForTimeout(400);
  await p.click('[data-serv-brief]');
  await p.waitForTimeout(900);
  const fine = await p.evaluate(() => ({
    chiusa: !document.querySelector('.serv')?.open,
    aperto: !document.getElementById('brief-form')?.hidden,
    scelto: document.querySelector('input[name="project_type"]:checked')?.value || '—',
  }));
  dice(fine.chiusa && fine.aperto && fine.scelto === 'video',
       `"Parliamone" porta al brief con la risposta gia' segnata (${fine.scelto})`);

  dice(errs.length === 0, `nessun errore${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}

await b.close();
console.log(rotte ? `\n${rotte} controlli con problemi` : '\nle quattro finestre reggono');
process.exitCode = rotte ? 1 : 0;
