import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2000);
await p.evaluate(()=>document.querySelectorAll('[role=tabpanel]').forEach(e=>e.hidden=false));
await p.waitForTimeout(300);
const R = await p.evaluate(()=>[...document.querySelectorAll('.bench__panel')].map(pan=>{
  const nome = pan.closest('.bench').id || pan.closest('.bench').className.split(' ')[1] || '?';
  const figli = [...pan.children].sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top)
    .map(e=>(e.className||e.tagName).toString().split(' ')[0] || e.tagName.toLowerCase());
  return nome+': '+figli.join(' › ');
}));
console.log(R.join('\n'));
await b.close();
