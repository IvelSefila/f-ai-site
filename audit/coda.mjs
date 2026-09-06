import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
const box = await p.evaluate(()=>{
  const a=document.querySelector('.read').getBoundingClientRect();
  const c=document.querySelector('.hud').getBoundingClientRect();
  return {x:0,y:a.top+scrollY-16,width:390,height:c.bottom-a.top+32};
});
await p.evaluate(y=>scrollTo(0,y), box.y);
await p.waitForTimeout(600);
await p.screenshot({path:'audit/telefono-strumenti.png', clip:{x:0,y:0,width:390,height:Math.min(844,box.height)}});
await b.close();
