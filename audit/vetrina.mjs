import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important;scroll-snap-type:none!important}'});
await p.waitForTimeout(2200);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
for (const id of ['soglia','scriptorium','banchi','forgia','alchimista']){
  await p.evaluate(i=>document.querySelector('#s-'+i).scrollIntoView({block:'center'}), id);
  await dorme(800);
  await p.screenshot({path:`audit/vetrina-${id}.png`});
}
await b.close();
