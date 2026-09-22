import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const norm = s => s.toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').replace(/[·:.,;]/g,'').trim();

async function corpo(url, extra){
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  await p.goto(url,{waitUntil:'networkidle'});
  await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  await p.waitForTimeout(1800);
  const h=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(90);}
  await p.evaluate(()=>{document.body.classList.remove('loaded');
    document.querySelectorAll('.reveal,.rv').forEach(e=>e.classList.add('in-view','in'));
    document.querySelectorAll('details').forEach(d=>d.open=true);});
  if (extra) await p.evaluate(extra);
  await p.waitForTimeout(400);
  const t = await p.evaluate(()=>document.body.innerText);
  await p.close();
  return t;
}
const testoOrig = await corpo('http://localhost:8899/portfolio.html');
const testoV2   = await corpo('http://localhost:8899/v2/index.html');
const v2n = norm(testoV2);

/* solo le frasi vere: almeno 40 caratteri */
const frasi = [...new Set(testoOrig.split('\n').map(s=>s.trim()).filter(s=>s.length>=40))];
const assenti = frasi.filter(f => !v2n.includes(norm(f)));
console.log('frasi di contenuto nell\'originale:', frasi.length);
console.log('ANCORA ASSENTI nella v2:', assenti.length);
assenti.forEach(f=>console.log('  ·', f.slice(0,110)));
await b.close();
