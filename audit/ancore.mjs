import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const err=[]; p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2000);
const out=[];
for (const a of await p.$$eval('.bar__nav a', ls=>ls.map(l=>l.getAttribute('href')))) {
  await p.evaluate(h=>{document.documentElement.style.scrollBehavior='auto';location.hash=h;},a);
  await p.waitForTimeout(220);
  out.push(a+' → titolo a '+Math.round(await p.evaluate(h=>{
    const s=document.querySelector(h); const t=s.querySelector('h2,h1');
    return (t||s).getBoundingClientRect().top;},a))+'px (barra 113)');
}
console.log(out.join('\n'));
console.log('errori console:', err.length ? err : 'nessuno');
await p.evaluate(()=>{location.hash='';scrollTo(0,900);});
await p.waitForTimeout(1400);
await p.screenshot({path:'audit/telefono-coda.png'});
await b.close();
