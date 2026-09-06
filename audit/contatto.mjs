import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
await p.waitForTimeout(2000);
const R = await p.evaluate(()=>{
  const e=document.querySelector('#contatto');
  const cat=[]; for(let n=e;n&&n!==document.body;n=n.parentElement)
    cat.push(`${n.tagName.toLowerCase()}${n.id?'#'+n.id:''}${n.className?'.'+n.className.toString().split(' ').join('.'):''}`);
  const cs=getComputedStyle(e);
  const h2=e.querySelector('h2');
  return {catena:cat.reverse().join('  ›  '),
    dentroChiaro: !!e.closest('.sec--chiara'),
    stage:cs.getPropertyValue('--stage').trim(), ink:cs.getPropertyValue('--ink').trim(),
    coloreTitolo: h2?getComputedStyle(h2).color:'—'};
});
console.log(JSON.stringify(R,null,1));
await b.close();
