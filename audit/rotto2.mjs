import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const err=[]; p.on('console',m=>m.type()==='error'&&err.push(m.text()));
p.on('pageerror',e=>err.push('PAGEERROR '+e.message));
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
console.log('── scorro come un umano e conto quanto si rivela ──');
for (const y of [0,900,1800,2700,3600,4800,6000,7500,9000,11000]){
  await p.evaluate(v=>scrollTo({top:v,behavior:'instant'}),y);
  await dorme(700);
  const s = await p.evaluate(()=>{
    const rv=[...document.querySelectorAll('.rv')];
    const inSchermo = rv.filter(e=>{const r=e.getBoundingClientRect();
      return r.bottom>0 && r.top<innerHeight});
    const visibili = inSchermo.filter(e=>+getComputedStyle(e).opacity>.5);
    return `${rv.length} totali · ${rv.filter(e=>e.classList.contains('in')).length} rivelati · in schermo ${inSchermo.length}, di cui visibili ${visibili.length}`;
  });
  console.log(`  y=${String(y).padStart(5)}  ${s}`);
}
console.log('errori:', err.length?err:0);
await p.evaluate(()=>scrollTo(0,2900)); await dorme(1200);
await p.screenshot({path:'audit/rotto-scorso.png'});
await b.close();
