import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2400);
const h=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(80);}
await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
await p.waitForTimeout(400);

const r = await p.evaluate(() => {
  const vis = e => { const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  const testo = e => (e.textContent || '').replace(/\s+/g,' ').trim().slice(0, 46);

  /* 1 · elementi presenti nel markup ma invisibili su telefono */
  const nascosti = [];
  for (const sel of ['.read','.hud__hint','.mat__hint','.bar__sess','.hint','.phases__come','.hud dl > div'])
    document.querySelectorAll(sel).forEach(e => { if (!vis(e)) nascosti.push(sel + '  →  ' + testo(e)); });

  /* 2 · istruzioni d'uso ancora visibili */
  const istruzioni = [...document.querySelectorAll('.hud__hint,.mat__hint,.phases__come,.hint,.lab__note')]
    .filter(vis).map(testo);

  /* 3 · regole :hover che al tocco non esistono */
  const hover = [];
  for (const ss of document.styleSheets) {
    try { for (const rule of ss.cssRules)
      if (rule.selectorText && rule.selectorText.includes(':hover')
          && !rule.selectorText.includes('hover: hover')) hover.push(rule.selectorText.slice(0,58));
    } catch {}
  }

  /* 4 · cursori: area del pollice */
  const cursori = [...document.querySelectorAll('input[type=range]')].map(e => {
    const r = e.getBoundingClientRect();
    return (e.id || '(senza id)') + ' ' + Math.round(r.width) + '×' + Math.round(r.height);
  });

  /* 5 · superfici trascinabili e cosa succede al tocco */
  const trascinabili = [...document.querySelectorAll('canvas')].map(c => {
    const r = c.getBoundingClientRect();
    return (c.id || c.parentElement.className) + ' · ' + Math.round(r.width) + '×' + Math.round(r.height)
         + ' · touch-action:' + getComputedStyle(c).touchAction;
  });

  return { nascostiSuTelefono: nascosti, istruzioniVisibili: istruzioni,
           regoleHover: hover.length, esempiHover: hover.slice(0,6), cursori, trascinabili };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
