import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2400);
await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
const H=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(50);}
const dorme=ms=>new Promise(r=>setTimeout(r,ms));

/* pannello aperto sul deck */
await p.evaluate(()=>{const d=document.querySelector('.deck');
  scrollTo(0,d.getBoundingClientRect().top+scrollY-160);});
await dorme(600);
await p.evaluate(async()=>{const m=await import('./palette.js');
  m.apriPannello(document.querySelector('.work'));});
await dorme(700);
await p.screenshot({path:'audit/pannello.png'});

/* griglia accesa */
await p.evaluate(async()=>{const g=await import('./griglia.js'); g.mostraGriglia(true);
  document.querySelector('#palPanel').close();});
await dorme(600);
await p.screenshot({path:'audit/griglia-accesa.png'});
await p.evaluate(async()=>{const g=await import('./griglia.js'); g.mostraGriglia(false);});

/* testata a colori diversi */
await p.evaluate(()=>scrollTo(0,0)); await dorme(900);
await p.screenshot({path:'audit/testata.png', clip:{x:0,y:0,width:1280,height:70}});
console.log('errori:', err.length?err.slice(0,2):0);
await b.close();
