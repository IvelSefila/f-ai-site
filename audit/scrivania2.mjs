import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2500);
const H=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(70);}
await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
const R = await p.evaluate(()=>{
  const g=s=>getComputedStyle(document.querySelector(s));
  const pan=document.querySelector('#b-grafica .bench__panel');
  return {formats:g('#formats').gridTemplateColumns, graph:g('#graph').gridTemplateColumns,
    fasi:g('.phases').gridTemplateColumns, pannello:g('#b-grafica .bench__panel').display,
    ordineCtl:g('#b-grafica .ctl').order, benchGap:g('.bench').gap};
});
console.log(JSON.stringify(R,null,1));
await p.evaluate(()=>{location.hash='#banchi';});
await p.waitForTimeout(900);
await p.screenshot({path:'audit/scrivania-banchi.png'});
await b.close();
