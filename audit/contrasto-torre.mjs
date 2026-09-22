import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1800);
const R = await p.evaluate(()=>{
  const lin=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4};
  const L=([r,g,b])=>.2126*lin(r)+.7152*lin(g)+.0722*lin(b);
  const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);
  const sopra=(f,b,a)=>f.map((v,i)=>v*a+b[i]*(1-a));
  const fondo=e=>{const veli=[];
    for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n).backgroundColor;
      if(!c||/rgba\(0, 0, 0, 0\)/.test(c))continue;
      const q=c.match(/[\d.]+/g).map(Number), a=q.length>3?q[3]:1;
      veli.push([q.slice(0,3),a]); if(a>=.999)break;}
    let base=rgb(getComputedStyle(document.body).backgroundColor);
    for(let i=veli.length-1;i>=0;i--) base=sopra(veli[i][0],base,veli[i][1]);
    return base};
  const male=[];
  document.querySelectorAll('.carta *').forEach(e=>{
    const t=(e.textContent||'').trim(); if(!t) return;
    if(e.children.length && !e.matches('a,button,h1,h2')) return;
    const cs=getComputedStyle(e);
    if(cs.display==='none'||e.hidden||e.closest('[hidden]')) return;
    const r=e.getBoundingClientRect(); if(r.width<4||r.height<4) return;
    const f=rgb(cs.color), bg=fondo(e);
    const x=L(f),y=L(bg), q=(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
    const px=parseFloat(cs.fontSize);
    const soglia=(px>=24||(px>=18.66&&+cs.fontWeight>=700))?3:4.5;
    if(q<soglia) male.push(`${q.toFixed(2)}:1 ${px}px "${t.slice(0,26)}"`);
  });
  return {male, briefNascosto: getComputedStyle(document.querySelector('#mandaBrief')).display};
});
console.log('tasto "manda il brief" da nascosto:', R.briefNascosto);
console.log(R.male.length ? 'SOTTO SOGLIA:\n  '+R.male.join('\n  ') : 'contrasto: nessun testo sotto soglia');
console.log('errori:', err.length?err.slice(0,2):0);
await b.close();
