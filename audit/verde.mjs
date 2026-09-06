import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2400);
const H=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(70);}
await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
await p.waitForTimeout(500);
const R = await p.evaluate(()=>{
  const lin=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4};
  const L=([r,g,bl])=>.2126*lin(r)+.7152*lin(g)+.0722*lin(bl);
  const rgb=s=>s.match(/\d+/g).slice(0,3).map(Number);
  const rap=(a,bg)=>{const x=L(a),y=L(bg);return ((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2)};
  const carta=[247,248,250];
  const num=getComputedStyle(document.querySelector('#lavori .sec__head'),'::before');
  const et=document.querySelector('#lavori .work__meta');
  const cs=et?getComputedStyle(et):null;
  const fondoEt=(()=>{for(let n=et;n;n=n.parentElement){const c=getComputedStyle(n).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)/.test(c))return rgb(c);}return carta})();
  return {
    numerone:`colore ${num.color} · contorno "${num.webkitTextStrokeWidth}" · corpo ${num.fontSize} · contrasto ${rap(rgb(num.color),carta)}:1`,
    etichetta: cs?`colore ${cs.color} · corpo ${cs.fontSize} · su fondo rgb(${fondoEt}) · contrasto ${rap(rgb(cs.color),fondoEt)}:1 (soglia 4.5)`:'assente'
  };
});
console.log(R.numerone); console.log(R.etichetta);
await p.evaluate(()=>{const s=document.querySelector('#lavori');
  scrollTo(0,s.getBoundingClientRect().top+scrollY-120);});
await p.waitForTimeout(700);
await p.screenshot({path:'audit/verde-pieno.png',clip:{x:0,y:0,width:1440,height:760}});
await b.close();
