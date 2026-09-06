import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2200);
await p.evaluate(()=>{document.querySelectorAll('[role=tabpanel]').forEach(e=>e.hidden=false);
  document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));});
const H=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=700){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(70);}
await p.waitForTimeout(500);
const R = await p.evaluate(()=>{
  const d=(s)=>[...document.querySelectorAll(s)].map(e=>{const r=e.getBoundingClientRect();
    return `${Math.round(r.width)}×${Math.round(r.height)} ${(e.querySelector('figcaption,b')?.textContent||'').replace(/\s+/g,' ').trim().slice(0,22)}`;});
  return {formats:d('#formats > figure'), socials:d('#socials > figure'),
    nodi:d('#graph .node'), fasi:d('.phases button'),
    colFormats:getComputedStyle(document.querySelector('#formats')).gridTemplateColumns,
    colGraph:getComputedStyle(document.querySelector('#graph')).gridTemplateColumns};
});
console.log(JSON.stringify(R,null,1));
await b.close();
