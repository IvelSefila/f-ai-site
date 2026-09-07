import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2200);
await p.evaluate(()=>document.querySelector('#s-scriptorium').scrollIntoView({block:'start'}));
await p.waitForTimeout(1100);
await p.screenshot({path:'audit/torre-vista.png'});
await p.evaluate(()=>document.querySelector('#s-scheda').scrollIntoView({block:'start'}));
await p.waitForTimeout(1100);
await p.screenshot({path:'audit/torre-vista2.png'});
await b.close();
