import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8899/v2/index.html?probe=1',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2500);
const over=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
console.log('scroll orizzontale:', over?'SÌ (problema)':'no');
for(const id of ['top','regia','banchi','verdetto']){
  await p.evaluate(i=>{const s=document.getElementById(i);scrollTo(0,s.getBoundingClientRect().top+scrollY-60)},id);
  await p.waitForTimeout(800);
  await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
  await p.waitForTimeout(300);
  await p.screenshot({path:`audit/v2shots/mob-${id}.jpg`,type:'jpeg',quality:80});
}
console.log('errori:', errs.length?errs:'nessuno');
await b.close();
