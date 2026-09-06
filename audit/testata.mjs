import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const w of [390,430,760,899]){
  const p=await b.newPage({viewport:{width:w,height:844},isMobile:true,hasTouch:true});
  await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
  await p.waitForTimeout(1200);
  console.log(w, JSON.stringify(await p.evaluate(()=>{
    const bar=document.querySelector('.bar').getBoundingClientRect();
    const eye=document.querySelector('.hero .eyebrow').getBoundingClientRect();
    const h1=document.querySelector('#heroTitle').getBoundingClientRect();
    const atti=document.querySelector('.hero__actions').getBoundingClientRect();
    return {bar:Math.round(bar.height), pos:getComputedStyle(document.querySelector('.bar')).position,
      occhielloTop:Math.round(eye.top), coperto:Math.round(bar.bottom-eye.top),
      titoloTop:Math.round(h1.top), bottoniBottom:Math.round(atti.bottom), schermo:844};
  })));
  await p.close();
}
await b.close();
