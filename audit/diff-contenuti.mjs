import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});

async function testi(url){
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  await p.goto(url,{waitUntil:'networkidle'});
  await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  await p.waitForTimeout(1800);
  const h=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(90);}
  await p.evaluate(()=>{document.body.classList.remove('loaded');
    document.querySelectorAll('.reveal,.rv').forEach(e=>e.classList.add('in-view','in'));});
  await p.waitForTimeout(500);
  const t=await p.evaluate(()=>{
    const out=new Set();
    document.querySelectorAll('body *').forEach(e=>{
      if(e.children.length) return;
      const s=(e.textContent||'').replace(/\s+/g,' ').trim();
      if(s.length>2 && s.length<120) out.add(s);
    });
    /* anche i valori dei campi e i placeholder */
    document.querySelectorAll('input,textarea,select,option').forEach(e=>{
      if(e.placeholder) out.add(e.placeholder);
      if(e.value && isNaN(+e.value)) out.add(e.value);
    });
    return [...out];
  });
  await p.close();
  return new Set(t.map(s=>s.toLowerCase()));
}

const orig = await testi('http://localhost:8899/portfolio.html');
const v2   = await testi('http://localhost:8899/v2/index.html');
const mancanti = [...orig].filter(s => !v2.has(s));
console.log('frasi nell\'originale:', orig.size, '· nella v2:', v2.size);
console.log('── presenti nell\'originale e ASSENTI nella v2:', mancanti.length, '──');
mancanti.slice(0,80).forEach(s=>console.log('  ·', s));
await b.close();
