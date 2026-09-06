import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:820}});
const err=[]; p.on('pageerror',e=>{ if(err.length<2) err.push(e.stack||e.message); });
await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
await p.waitForTimeout(2200);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));

console.log('A · dopo il cambio palette (senza materia):');
await p.evaluate(async()=>{const m=await import('./palette.js'); m.applica('magenta');});
await dorme(1200);
console.log(err.length?err[0].split('\n').slice(0,5).join('\n'):'  nessun errore');

err.length=0;
console.log('\nB · dopo aver caricato la nuvola di punti:');
await p.evaluate(()=>{document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));
  document.querySelector('#materia').scrollIntoView();});
await dorme(3500);
console.log(err.length?err[0].split('\n').slice(0,6).join('\n'):'  nessun errore');
await b.close();
