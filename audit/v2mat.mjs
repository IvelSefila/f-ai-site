import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(String(e)));
const reqs=[]; p.on('request',r=>reqs.push(r.url()));
await p.goto('http://localhost:8899/v2/index.html?probe=1',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2000);
const primoCarico = reqs.filter(u=>/ogl|materia/.test(u)).length;
console.log('richieste OGL al primo caricamento:', primoCarico, primoCarico===0?'✓ zero come promesso':'✗');
await p.evaluate(()=>{const s=document.getElementById('materia');scrollTo(0,s.getBoundingClientRect().top+scrollY-70)});
await p.waitForTimeout(3500);
console.log('dopo lo scroll:', reqs.filter(u=>/ogl\.min|materia\.js/.test(u)).map(u=>u.split('/').pop()).join(', ')||'niente');
const st=await p.evaluate(()=>({
  nome: document.getElementById('matName').textContent,
  meta: document.getElementById('matMeta').textContent,
  decisioni: document.querySelectorAll('#matDecisions li').length,
  loading: !!document.querySelector('.mat--loading'),
  canvasVisibile: getComputedStyle(document.getElementById('matCanvas')).display,
}));
console.log(JSON.stringify(st));
await p.click('.modes button[data-mat="2"]'); await p.waitForTimeout(1800);
await p.screenshot({path:'audit/v2shots/materia-rete.jpg',type:'jpeg',quality:82});
await p.click('.modes button[data-mat="1"]'); await p.waitForTimeout(1600);
await p.screenshot({path:'audit/v2shots/materia-nastro.jpg',type:'jpeg',quality:82});
console.log('stato finale:', await p.evaluate(()=>document.getElementById('matName').textContent+' | '+document.getElementById('matMeta').textContent));
console.log('ERRORI:', errs.length? errs.slice(0,5):'nessuno');
await b.close();
