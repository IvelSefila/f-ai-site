import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/v2/index.html?probe=1',{waitUntil:'networkidle'});
await p.waitForTimeout(3000);
console.log(JSON.stringify(await p.evaluate(()=>{
  const q=s=>{const e=document.querySelector(s),c=getComputedStyle(e),r=e.getBoundingClientRect();
    return `${s} ${c.position} ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}`;};
  return ['.read','.rail','.hud','.scene-pick','.hud__hint--puntatore','.hud__hint--dito'].map(q);
}),null,1));
await p.screenshot({path:'audit/scrivania-hero.png'});
await b.close();
