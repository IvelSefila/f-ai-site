import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(String(e)));
p.on('response',r=>{if(r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url())});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(3500);
console.log('ERRORI:', errs.length? errs.slice(0,6) : 'nessuno');
const st=await p.evaluate(()=>({
  glOk: !document.body.classList.contains('no-gl'),
  sezioni: document.querySelectorAll('main > section[id]').length,
  canvas: document.querySelectorAll('canvas').length,
  works: document.querySelectorAll('.work').length,
  nodi: document.querySelectorAll('.node').length,
  decisioniKv: document.querySelectorAll('#kvDecisions li').length,
  decisioniFmt: document.querySelectorAll('#fmtDecisions li').length,
  decisioniTl: document.querySelectorAll('#tlDecisions li').length,
  dossier: document.getElementById('dsVerdict').textContent.slice(0,50),
  altezza: document.body.scrollHeight,
}));
console.log(JSON.stringify(st,null,1));
await b.close();
