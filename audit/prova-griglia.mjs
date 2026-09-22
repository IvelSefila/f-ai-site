import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const err=[]; p.on('console',m=>m.type()==='error'&&err.push(m.text()));
p.on('pageerror',e=>err.push('PAGEERROR '+(e.stack||e.message).split('\n')[0]));
await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2400);
await p.evaluate(()=>{document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));
  document.querySelectorAll('[role=tabpanel]').forEach(e=>e.hidden=false);});
const H=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(50);}
const dorme=ms=>new Promise(r=>setTimeout(r,ms));

console.log('── i valori di partenza riproducono l\'impaginazione di prima? ──');
console.log('   (misurato prima: deck 3 · offerta 4 · lab 4 · formati 3)');
const larg = await p.evaluate(()=>['.deck','.offerta__grid','.lab','.formats'].map(s=>{
  const e=document.querySelector(s);
  const f=[...e.children].map(c=>Math.round(c.getBoundingClientRect().width));
  const righe=new Set([...e.children].map(c=>Math.round(c.getBoundingClientRect().top)));
  return `${s.padEnd(16)} data-gr="${e.dataset.gr}" · ${f.length} riquadri su ${righe.size} riga/e · larghezze ${f.join('/')}`;
}));
console.log('  '+larg.join('\n  '));

console.log('\n── cambio impaginazione del deck e guardo cosa succede ──');
for (const g of ['3','2','1','6-3-3','4']){
  const r = await p.evaluate(async g=>{
    const m=await import('./griglia.js');
    m.applicaGriglia(document.querySelector('.deck'), g);
    await new Promise(r=>setTimeout(r,120));
    const e=document.querySelector('.deck');
    const f=[...e.children].map(c=>Math.round(c.getBoundingClientRect().width));
    const righe=new Set([...e.children].map(c=>Math.round(c.getBoundingClientRect().top)));
    return `${f.length} riquadri su ${righe.size} riga/e · larghezze ${f.join('/')}`;
  }, g);
  console.log(`  ${g.padEnd(6)} ${r}`);
}
await p.evaluate(async()=>{const m=await import('./griglia.js');
  m.applicaGriglia(document.querySelector('.deck'),'3');});

console.log('\n── i campioni in testata ──');
const t = await p.evaluate(async()=>{
  const b=[...document.querySelectorAll('[data-pal-veloce]')];
  const r=b.map(x=>`${x.dataset.palVeloce}(${getComputedStyle(x).getPropertyValue('--campione').trim()})`);
  b[1].click(); await new Promise(r=>setTimeout(r,200));
  return {campioni:r.join(' '), dopoClick:getComputedStyle(document.documentElement).getPropertyValue('--em').trim(),
    segnato:b.filter(x=>x.getAttribute('aria-checked')==='true').map(x=>x.dataset.palVeloce).join()};
});
console.log('  '+t.campioni);
console.log(`  click sul secondo → --em ${t.dopoClick} · segnato "${t.segnato}"`);

console.log('\nerrori:', err.length?err.slice(0,3):0);
await b.close();
