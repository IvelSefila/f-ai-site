import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1100,height:900}});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file:///C:/Users/fabri/AppData/Local/Temp/claude/C--Users-fabri-Documents-sito-internet-F-AI-sites/8d5506b5-d0d0-46f1-9be0-ac3b533f7113/scratchpad/prima-dopo.html');
await p.waitForTimeout(2500);
const geo=await p.evaluate(()=>{
  const w=document.querySelector('[data-wipe]');
  const a=w.querySelector('.wipe__after'), c=w.querySelector('.wipe__clip img');
  return {afterW:Math.round(a.clientWidth), afterH:Math.round(a.clientHeight),
    clipImgW:Math.round(c.clientWidth), clipImgH:Math.round(c.clientHeight),
    pos:getComputedStyle(w).getPropertyValue('--pos'), cards:document.querySelectorAll('[data-wipe]').length};
});
console.log('geometria iniziale:', JSON.stringify(geo));
// muovi lo slider
await p.evaluate(()=>{const r=document.querySelector('.wipe__range'); r.value=20; r.dispatchEvent(new Event('input',{bubbles:true}));});
await p.waitForTimeout(300);
const after=await p.evaluate(()=>{const w=document.querySelector('[data-wipe]');
  return {pos:getComputedStyle(w).getPropertyValue('--pos'), clipW:Math.round(w.querySelector('.wipe__clip').clientWidth),
          clipImgW:Math.round(w.querySelector('.wipe__clip img').clientWidth)};});
console.log('dopo slider a 20:', JSON.stringify(after));
console.log('errori console:', errs.length? errs : 'nessuno');
await p.screenshot({path:'audit/ba-check.png', clip:{x:0,y:0,width:1100,height:900}});
await b.close();
