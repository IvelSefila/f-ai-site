import { chromium } from 'playwright';
const EXE='C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const b=await chromium.launch({executablePath:EXE});
for (const [name,url] of [['prima','http://localhost:8898/public/portfolio.html'],['dopo','http://localhost:8899/portfolio.html']]) {
  const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
  await p.goto(url,{waitUntil:'networkidle'}); await p.waitForTimeout(2500);
  const clip=await p.evaluate(()=>{const c=document.querySelector('.hero__copy').getBoundingClientRect();
    return {x:Math.max(0,c.x-16), y:c.y-14, width:Math.min(1440-Math.max(0,c.x-16), c.width+130), height:c.height+28};});
  await p.screenshot({path:`audit/hero-${name}.png`,clip});
  console.log(name, JSON.stringify(clip));
  await p.close();
}
await b.close();
