import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160))});
const req=[]; p.on('request',r=>req.push(r.url().split('/').pop().split('?')[0]));
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2200);
console.log('playlab al primo caricamento:', req.filter(u=>/playlab/.test(u)).length, '(atteso 0)');

await p.evaluate(()=>{const s=document.getElementById('laboratorio');scrollTo(0,s.getBoundingClientRect().top+scrollY-70)});
await p.waitForTimeout(600);
await p.click('#open-playlab');
await p.waitForTimeout(4000);
console.log('caricati dopo il clic:', [...new Set(req.filter(u=>/playlab/.test(u)))].join(', '));

const st = await p.evaluate(() => {
  const d = document.getElementById('original-playlab');
  return {
    dialogAperto: d.open,
    vista: d.querySelector('.playlab-app')?.dataset.view,
    motore: d.querySelector('.playlab-app')?.dataset.engine,
    motoriDisponibili: document.querySelectorAll('#playlab-engine-rail button').length,
    preset: document.querySelectorAll('#playlab-preset-rail button').length,
    canvas: !!document.getElementById('playlab-canvas'),
    apiGlobale: typeof window.FAIPlaylab,
    pulsanteCrea: !!document.getElementById('playlab-create'),
    percorsoGuidato: !!document.getElementById('playlab-guided-open'),
  };
});
console.log(JSON.stringify(st,null,1));
await p.screenshot({path:'audit/v2shots/laboratorio.jpg',type:'jpeg',quality:84});
console.log('errori:', errs.length? errs.slice(0,4):'nessuno');
await b.close();
