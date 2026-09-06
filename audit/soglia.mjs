import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(1800);
const R = await p.evaluate(()=>{
  const c=getComputedStyle(document.querySelector('#lavori'),'::before');
  const n=getComputedStyle(document.querySelector('#lavori .sec__head'),'::before');
  const q=s=>({nome:s.animationName,timeline:s.animationTimeline,range:s.animationRange,
    fill:s.animationFillMode,scale:s.scale,translate:s.translate,pos:s.position,w:s.width});
  return {soglia:q(c), numerone:q(n),
    animazioniInCorso: document.getAnimations().length,
    conTimeline: document.getAnimations().filter(a=>a.timeline && a.timeline.constructor.name!=='DocumentTimeline').length};
});
console.log(JSON.stringify(R,null,1));
await b.close();
