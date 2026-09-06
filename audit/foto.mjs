import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2500);
const H=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=700){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(70);}
await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
await p.waitForTimeout(400);
const scatti = [['#mix','regia'],['#fmtIdea','grafica'],['#grRun','flusso'],['.modes[aria-label*="Disposizioni"]','materia']];
for (const [sel,nome] of scatti){
  await p.evaluate(s=>{const t=document.querySelector(s.startsWith('#grRun')?'#t-ai':s);
    if(s==='#grRun'){document.querySelector('#t-ai').click();}}, sel);
  await p.waitForTimeout(700);
  const el=await p.$(sel); if(!el){console.log('salto',nome);continue;}
  await p.evaluate(s=>{const e=document.querySelector(s);const r=e.getBoundingClientRect();
    scrollTo(0, scrollY + r.top + r.height/2 - (113+(844-113)*0.78));}, sel);
  await p.waitForTimeout(900);
  await p.screenshot({path:`audit/tocco-${nome}.png`});
  console.log('scatto', nome);
}
await b.close();
