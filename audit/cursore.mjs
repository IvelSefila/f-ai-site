import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2000);
const info = await p.evaluate(()=>{
  const e=document.querySelector('#mix');
  return e?{tag:e.tagName,type:e.type,min:e.min,max:e.max,value:e.value,
    ta:getComputedStyle(e).touchAction, disabled:e.disabled}:'assente';
});
await p.evaluate(()=>document.querySelector('#mix').scrollIntoView({block:'center'}));
await p.waitForTimeout(600);
const r = await p.locator('#mix').boundingBox();
/* tap secco all'80% della traccia */
await p.touchscreen.tap(r.x+r.width*0.8, r.y+r.height/2);
await p.waitForTimeout(400);
const dopoTap = await p.evaluate(()=>document.querySelector('#mix').value);
/* trascinamento vero: touch down, move, up */
await p.evaluate(()=>{ window.__ev=[]; const e=document.querySelector('#mix');
  ['pointerdown','touchstart','input'].forEach(t=>e.addEventListener(t,ev=>window.__ev.push(t))); });
await p.mouse.move(r.x+r.width*0.8, r.y+r.height/2);
await p.mouse.down();
for(let i=1;i<=10;i++) await p.mouse.move(r.x+r.width*(0.8-0.06*i), r.y+r.height/2);
await p.mouse.up();
await p.waitForTimeout(400);
console.log(JSON.stringify({info, dopoTap,
  dopoTrascinamento: await p.evaluate(()=>document.querySelector('#mix').value),
  eventi: await p.evaluate(()=>[...new Set(window.__ev)])},null,1));
await b.close();
