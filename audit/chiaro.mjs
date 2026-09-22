import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const err=[]; p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2200);
const H=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(70);}
await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
await p.waitForTimeout(400);

/* contrasto reale di ogni testo dentro i blocchi chiari */
const R = await p.evaluate(() => {
  const lin=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4};
  const L=([r,g,bl])=>.2126*lin(r)+.7152*lin(g)+.0722*lin(bl);
  const rgb=s=>s.match(/\d+/g).slice(0,3).map(Number);
  const fondo=e=>{for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n).backgroundColor;
    if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return rgb(c);}return [247,248,250]};
  const out=[];
  document.querySelectorAll('.sec--chiara').forEach(sec=>{
    const peggio={r:99,chi:''};
    sec.querySelectorAll('h2,h3,p,li,span,a,button,dt,dd,label,output,summary,strong').forEach(e=>{
      const t=(e.textContent||'').trim(); if(!t||e.children.length&&!e.matches('a,button,summary'))return;
      const cs=getComputedStyle(e);
      if(cs.display==='none'||cs.visibility==='hidden')return;
      const rr=e.getBoundingClientRect(); if(!rr.width||!rr.height)return;
      const f=rgb(cs.color), bg=fondo(e);
      const x=L(f),y=L(bg), r=(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
      const px=parseFloat(cs.fontSize), grande = px>=24 || (px>=18.66 && +cs.fontWeight>=700);
      const soglia = grande?3:4.5;
      if(r<soglia && r<peggio.r) { peggio.r=r; peggio.chi=`${e.tagName.toLowerCase()} ${px}px "${t.slice(0,30)}"`; }
    });
    out.push({sezione:sec.id, sfondo:getComputedStyle(sec).backgroundColor,
      peggiore: peggio.chi ? `${peggio.r.toFixed(2)}:1 — ${peggio.chi}` : 'nessun testo sotto soglia'});
  });
  return out;
});
console.log(R.map(x=>`${x.sezione.padEnd(12)} ${x.sfondo.padEnd(20)} ${x.peggiore}`).join('\n'));
console.log('errori console:', err.length?err:0);

for (const id of ['lavori','metodo','profilo']) {
  await p.evaluate(s=>document.querySelector('#'+s).scrollIntoView({block:'start'}), id);
  await p.waitForTimeout(500);
  await p.screenshot({path:`audit/chiaro-${id}.png`});
}
await b.close();
