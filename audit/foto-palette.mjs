import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1180,height:760},deviceScaleFactor:1});
const err=[]; p.on('pageerror',e=>err.push(e.message));
await p.goto('http://localhost:8899/?probe=1',{waitUntil:'networkidle'});
console.log('arrivato su:', await p.evaluate(()=>location.pathname+location.search));
await p.waitForTimeout(3200);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
await p.evaluate(()=>{document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));
  document.querySelector('#materia').scrollIntoView();});
await dorme(3200);
for (const id of ['smeraldo','magenta']){
  await p.evaluate(async id=>{const m=await import('./palette.js'); m.applica(id);}, id);
  await dorme(1100);
  await p.evaluate(()=>document.querySelector('#materia').scrollIntoView({block:'center'}));
  await dorme(700);
  await p.screenshot({path:`audit/pal-materia-${id}.png`});
  await p.evaluate(()=>scrollTo(0,0)); await dorme(1400);
  await p.screenshot({path:`audit/pal-hero-${id}.png`});
  await p.evaluate(()=>document.querySelector('#materia').scrollIntoView()); await dorme(500);
}
console.log('errori:', err.length?err.slice(0,2):0);
await b.close();
