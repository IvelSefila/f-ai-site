import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1280,height:800}});
await p.goto('http://localhost:8899/portfolio.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto !important}'});
await p.waitForTimeout(2000);
for (const deg of ['16deg','-55deg','-70deg','-85deg']) {
  await p.evaluate(d=>document.documentElement.style.setProperty('--director-image-hue',d), deg);
  await p.waitForTimeout(500);
  const clip=await p.evaluate(()=>{const r=document.querySelector('.hero__atlas').getBoundingClientRect();
    return {x:Math.round(r.x),y:Math.max(0,Math.round(r.y)),width:Math.round(r.width),height:Math.min(660,Math.round(r.height))};});
  await p.screenshot({path:`audit/hue${deg.replace('-','m')}.jpg`,type:'jpeg',quality:78,clip});
  console.log(deg,'ok');
}
await b.close();
