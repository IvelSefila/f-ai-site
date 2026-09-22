import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important;scroll-snap-type:none!important}'});
await p.waitForTimeout(2200);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
console.log('risoluzione del fotogramma:', await p.evaluate(()=>{
  const c=document.querySelector('#schermo'); return c.width+'×'+c.height; }));
console.log('pigmenti nella tavolozza:', await p.evaluate(async()=>
  (await import('./tavolozza.js')).TAVOLOZZA.length));

const prove = [
  ['bilancia', 0.85, 0.5, ()=>document.querySelector('#levaVal').textContent],
  ['banchi',   0.30, 0.5, ()=>[...document.querySelectorAll('[data-banco]')].findIndex(x=>x.getAttribute('aria-checked')==='true')],
  ['forgia',   0.85, 0.5, ()=>[...document.querySelectorAll('[data-forgia]')].findIndex(x=>x.getAttribute('aria-checked')==='true')],
  ['materia',  0.50, 0.5, ()=>[...document.querySelectorAll('[data-materia]')].findIndex(x=>x.getAttribute('aria-checked')==='true')],
  ['alchimista',0.5, 0.25, ()=>document.querySelectorAll('#riepilogo li:not(.vuoto)').length],
];
console.log('\n── un colpetto sullo schermo, stanza per stanza ──');
for (const [id, fx, fy, leggi] of prove){
  await p.evaluate(i=>document.querySelector('#s-'+i).scrollIntoView({block:'center'}), id);
  await dorme(600);
  const prima = await p.evaluate(leggi);
  const box = await p.locator('#schermo').boundingBox();
  await p.mouse.click(box.x+box.width*fx, box.y+box.height*fy);
  await dorme(500);
  const dopo = await p.evaluate(leggi);
  console.log(`  ${id.padEnd(11)} ${String(prima).slice(0,26).padEnd(28)} → ${String(dopo).slice(0,26)}  ${prima!==dopo?'✓':'nessun cambio'}`);
}
/* trascinare non deve scattare */
await p.evaluate(()=>document.querySelector('#s-banchi').scrollIntoView({block:'center'}));
await dorme(500);
const pr = await p.evaluate(()=>[...document.querySelectorAll('[data-banco]')].findIndex(x=>x.getAttribute('aria-checked')==='true'));
const bb = await p.locator('#schermo').boundingBox();
await p.mouse.move(bb.x+bb.width*0.8, bb.y+bb.height*0.5);
await p.mouse.down(); await p.mouse.move(bb.x+bb.width*0.8, bb.y+bb.height*0.5-90,{steps:8}); await p.mouse.up();
await dorme(400);
const dp = await p.evaluate(()=>[...document.querySelectorAll('[data-banco]')].findIndex(x=>x.getAttribute('aria-checked')==='true'));
console.log(`\n  trascinando invece di toccare: ${pr===dp?'non scatta ✓':'SCATTA ✗'}`);
console.log('errori:', err.length?err.slice(0,3):0);
await b.close();
