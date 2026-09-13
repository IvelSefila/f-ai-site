import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/v2/index.html?probe=1',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2000);

/* ── il controllo che controlla se stesso ─────────────────────────
   `node audit/v2a11y.mjs prova` infila nella pagina due scritte
   illeggibili sul serio e si aspetta di beccarle tutte e due. Serve
   perche' la misura del contrasto e' appena stata resa piu' furba —
   compone l'alfa dei fondi, e legge la sfumatura delle scritte
   ritagliate — e una misura piu' furba puo' anche diventare cieca
   invece che precisa. Se questa prova passa e la pagina non da'
   problemi, il silenzio vuol dire davvero silenzio. */
const PROVA = process.argv[2] === 'prova';
if (PROVA) await p.evaluate(() => {
  const m = document.querySelector('main');
  const grigio = document.createElement('p');
  grigio.textContent = 'ESCA GRIGIA';                    /* ~1,9:1 sul nero */
  grigio.style.cssText = 'color:#2b3138;background:#05070b;font-size:14px';
  const sfumata = document.createElement('p');
  sfumata.textContent = 'ESCA SFUMATA';                  /* chiara che finisce quasi nera */
  sfumata.style.cssText = 'font-size:40px;background-image:linear-gradient(90deg,#eaf5f0,#0a0f14);' +
                          '-webkit-background-clip:text;background-clip:text;color:transparent';
  m.append(grigio, sfumata);
});

const r = await p.evaluate(() => {
  const out = { problemi: [], ok: [] };
  const push = (sev, msg) => out.problemi.push(`${sev} · ${msg}`);

  /* 1 · gerarchia dei titoli */
  const hs = [...document.querySelectorAll('h1,h2,h3')].map(h => +h.tagName[1]);
  let salti = 0, prev = hs[0];
  for (const l of hs.slice(1)) { if (l - prev > 1) salti++; prev = l; }
  salti ? push('A11Y', `${salti} salti di livello nei titoli`) : out.ok.push('gerarchia titoli continua');
  if (document.querySelectorAll('h1').length !== 1) push('A11Y', 'h1 non unico');

  /* 2 · tab senza gestione tastiera */
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const conTabindex = tabs.filter(t => t.hasAttribute('tabindex')).length;
  out.ok.push(`${tabs.length} elementi role=tab`);
  if (conTabindex === 0) push('A11Y', 'role=tab senza gestione frecce/tabindex (pattern ARIA incompleto)');
  const senzaControls = tabs.filter(t => !t.getAttribute('aria-controls')).length;
  if (senzaControls) push('A11Y', `${senzaControls} role=tab senza aria-controls`);

  /* 3 · tabpanel */
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const senzaTabindex = panels.filter(x => !x.hasAttribute('tabindex')).length;
  if (senzaTabindex) push('A11Y', `${senzaTabindex} tabpanel non focalizzabili`);

  /* 4 · controlli senza nome accessibile */
  const nudi = [...document.querySelectorAll('button,a,input')].filter(el => {
    const t = (el.textContent || '').trim();
    return !t && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.labels?.length;
  });
  nudi.length ? push('A11Y', `${nudi.length} controlli senza nome accessibile`) : out.ok.push('tutti i controlli hanno un nome');

  /* 5 · contrasto del testo minuto */
  /* Il fondo di questa pagina non e' quasi mai una tinta piatta, e la
     versione precedente di questo pezzo lo dava per scontato in due
     modi. Tutte e due davano falsi allarmi, e un controllo che grida al
     lupo due volte nasconde la terza volta che il lupo c'e' davvero.

     Primo: prendeva il primo fondo non trasparente che trovava salendo,
     ALFA COMPRESA. Le linguette dei banchi hanno rgba(20,192,138,.14)
     sopra il nero: letta come smeraldo pieno dava 1,00:1 contro un
     testo smeraldo, cioe' "invisibile". Composta davvero sul nero fa
     7,2:1. Adesso i fondi si sovrappongono uno sull'altro con la loro
     alfa, come fa il browser.

     Secondo: il testo dell'apertura e' una scritta riempita di sfumatura
     con background-clip:text, quindi il suo `color` e' trasparente.
     Misurare il trasparente contro il fondo dava 1,04:1 su una riga che
     si legge benissimo. Adesso, quando il colore e' trasparente e c'e'
     una sfumatura ritagliata sul testo, si misura la fermata PIU' SCURA
     della sfumatura — il caso peggiore lungo la riga. */
  const rgba = c => { const v=(c||'').match(/[\d.]+/g); if(!v) return null;
    return [ +v[0], +v[1], +v[2], v.length>3 ? +v[3] : 1 ]; };
  const sopra = (f, d) => f.slice(0,3).map((x,i)=> x*f[3] + d[i]*(1-f[3]));   /* f sopra d */
  const lumRGB = v => { const l=v.slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4});
    return .2126*l[0]+.7152*l[1]+.0722*l[2]; };

  /* i fondi, dal piu' esterno al piu' interno, composti in ordine.

     Un fondo scritto come sfumatura non ha backgroundColor: quella
     proprieta' resta trasparente e il colore sta dentro
     backgroundImage. La versione prima lo saltava e andava a cercare
     un fondo piu' su — su una lastra lime ha misurato del testo bianco
     contro il bianco della scheda sotto e ha detto 1,00:1, cioe' "non
     si vede", su un testo che si vedeva benissimo (e che comunque era
     da correggere, ma per un altro motivo).

     Di una sfumatura si prende la fermata PEGGIORE per quel testo: la
     piu' vicina di luminosita' al colore della scritta. E' il punto in
     cui la scritta si legge meno, ed e' quello che conta. */
  const fermate = (cs) => {
    const im = cs.backgroundImage;
    if (!im || im === 'none' || !/gradient/.test(im)) return null;
    return [...im.matchAll(/rgba?\(([^)]+)\)/g)].map(m => rgba('rgba(' + m[1] + ')')).filter(Boolean);
  };
  const bgOf = (e, fg) => {
    const strati = [];
    for (let n=e; n; n=n.parentElement) {
      const cs = getComputedStyle(n);
      /* Una sfumatura ritagliata sul testo NON e' un fondo: e' il
         colore della scritta. Senza questa riga il titolo d'apertura
         veniva misurato contro se stesso — 1,00:1 su una riga che si
         legge benissimo. Ci ero appena cascato aggiungendo la lettura
         delle sfumature. */
      if ((cs.webkitBackgroundClip || cs.backgroundClip) === 'text') continue;
      const g = fermate(cs);
      if (g && g.length) {
        const lf = fg ? lumRGB(fg) : 0;
        strati.push(g.slice().sort((a,b) => Math.abs(lumRGB(a)-lf) - Math.abs(lumRGB(b)-lf))[0]);
        continue;
      }
      const c = rgba(cs.backgroundColor);
      if (c && c[3] > 0) strati.push(c);
    }
    let d = [5,7,11];
    for (const s of strati.reverse()) d = sopra(s, d);
    return d;
  };

  /* il colore che si vede davvero: la tinta, o la fermata piu' scura
     della sfumatura quando la scritta e' ritagliata sopra una */
  const fgOf = (e, cs) => {
    const c = rgba(cs.color);
    if (c && c[3] > 0.05) return sopra(c, bgOf(e, c));
    const clip = cs.webkitBackgroundClip || cs.backgroundClip;
    if (clip === 'text' && cs.backgroundImage !== 'none') {
      const fermate = [...cs.backgroundImage.matchAll(/rgba?\(([^)]+)\)/g)]
        .map(m => rgba('rgb(' + m[1] + ')')).filter(Boolean);
      if (fermate.length) return fermate.sort((a,b)=>lumRGB(a)-lumRGB(b))[0];
    }
    return null;                       /* niente da misurare: non e' un difetto */
  };
  const ratio = (f,b) => { const a=lumRGB(f),c=lumRGB(b); return (Math.max(a,c)+.05)/(Math.min(a,c)+.05); };
  const bassi = [];
  document.querySelectorAll('main *, .bar *, .voice *').forEach(e => {
    if (e.children.length || !e.textContent.trim()) return;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const grande = size >= 24 || (size >= 18.66 && bold);
    const req = grande ? 3 : 4.5;
    const fg = fgOf(e, cs);
    if (!fg) return;
    const rr = ratio(fg, bgOf(e, fg));
    if (rr < req) bassi.push(`${rr.toFixed(2)}:1 (serve ${req}) ${size}px · ${e.textContent.trim().slice(0,32)}`);
  });
  bassi.length ? push('A11Y', `${bassi.length} testi sotto contrasto AA`) : out.ok.push('contrasto AA rispettato ovunque');
  out.contrastiBassi = bassi.slice(0, 8);

  /* 6 · dimensione minima del testo */
  const micro = [];
  document.querySelectorAll('main *').forEach(e => {
    if (e.children.length || !e.textContent.trim()) return;
    const s = parseFloat(getComputedStyle(e).fontSize);
    if (s < 11) micro.push(`${s}px · ${e.textContent.trim().slice(0,24)}`);
  });
  micro.length ? push('QUAL', `${micro.length} testi sotto 11px`) : out.ok.push('nessun testo sotto 11px');
  out.micro = micro.slice(0,5);

  /* 7 · lang, title, landmark */
  if (!document.documentElement.lang) push('A11Y','manca lang su html');
  if (!document.querySelector('main')) push('A11Y','manca landmark main');
  return out;
});

console.log('── PROBLEMI ──');
r.problemi.length ? r.problemi.forEach(x=>console.log('  '+x)) : console.log('  nessuno');
if (r.contrastiBassi?.length) { console.log('── contrasti bassi ──'); r.contrastiBassi.forEach(x=>console.log('  '+x)); }
if (r.micro?.length) { console.log('── micro-testi ──'); r.micro.forEach(x=>console.log('  '+x)); }
console.log('── OK ──'); r.ok.forEach(x=>console.log('  '+x));

if (PROVA) {
  const prese = ['ESCA GRIGIA','ESCA SFUMATA'].filter(t => (r.contrastiBassi||[]).some(x => x.includes(t)));
  console.log(`── esche ── ${prese.length}/2 prese${prese.length===2 ? ' ✓ la misura ci vede' : " ✗ LA MISURA NON CI VEDE PIU'"}`);
  if (prese.length !== 2) process.exitCode = 1;
}

/* 8 · navigazione da tastiera reale */
const seq=[];
for (let i=0;i<14;i++){ await p.keyboard.press('Tab');
  seq.push(await p.evaluate(()=>{const a=document.activeElement;
    const st=getComputedStyle(a); const vis=st.outlineStyle!=='none'&&parseFloat(st.outlineWidth)>0;
    return (a.tagName+'.'+String(a.className).split(' ')[0]).slice(0,34)+(vis?' [focus visibile]':' [SENZA FOCUS]');})); }
console.log('── ordine di tabulazione ──');
seq.forEach((s,i)=>console.log(`  ${String(i+1).padStart(2)} ${s}`));
await b.close();
