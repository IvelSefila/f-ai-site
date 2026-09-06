import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/v2/index.html?probe=1',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2000);

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
  const lum = c => { const v = c.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4}); return .2126*v[0]+.7152*v[1]+.0722*v[2]; };
  const bgOf = e => { let n=e; while(n){const c=getComputedStyle(n).backgroundColor; if(c&&!/rgba\(0, 0, 0, 0\)/.test(c)) return c; n=n.parentElement;} return 'rgb(5,7,11)'; };
  const ratio = (f,b) => { const a=lum(f),c=lum(b); return (Math.max(a,c)+.05)/(Math.min(a,c)+.05); };
  const bassi = [];
  document.querySelectorAll('main *, .bar *, .voice *').forEach(e => {
    if (e.children.length || !e.textContent.trim()) return;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const grande = size >= 24 || (size >= 18.66 && bold);
    const req = grande ? 3 : 4.5;
    const rr = ratio(cs.color, bgOf(e));
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

/* 8 · navigazione da tastiera reale */
const seq=[];
for (let i=0;i<14;i++){ await p.keyboard.press('Tab');
  seq.push(await p.evaluate(()=>{const a=document.activeElement;
    const st=getComputedStyle(a); const vis=st.outlineStyle!=='none'&&parseFloat(st.outlineWidth)>0;
    return (a.tagName+'.'+String(a.className).split(' ')[0]).slice(0,34)+(vis?' [focus visibile]':' [SENZA FOCUS]');})); }
console.log('── ordine di tabulazione ──');
seq.forEach((s,i)=>console.log(`  ${String(i+1).padStart(2)} ${s}`));
await b.close();
