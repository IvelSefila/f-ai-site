import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});

/* desktop: il passaggio scuro → chiaro */
const d=await b.newPage({viewport:{width:1440,height:900}});
await d.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await d.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await d.waitForTimeout(2400);
const H=await d.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=800){await d.evaluate(v=>scrollTo(0,v),y);await d.waitForTimeout(70);}
await d.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
/* mi metto a cavallo del confine regia(scuro) → lavori(chiaro) */
await d.evaluate(()=>{const s=document.querySelector('#lavori');
  scrollTo(0, s.getBoundingClientRect().top+scrollY-420);});
await d.waitForTimeout(700);
await d.screenshot({path:'audit/blocchi-confine.png'});
/* e il confine chiaro → scuro */
await d.evaluate(()=>{const s=document.querySelector('#banchi');
  scrollTo(0, s.getBoundingClientRect().top+scrollY-380);});
await d.waitForTimeout(700);
await d.screenshot({path:'audit/blocchi-confine2.png'});

/* pagina intera in miniatura: si vede il ritmo dell'alternanza */
await d.setViewportSize({width:1440,height:900});
const ritmo = await d.evaluate(()=>[...document.querySelectorAll('main > section')].map(s=>{
  const r=s.getBoundingClientRect();
  return {id:s.id, chiaro:s.classList.contains('sec--chiara'),
    alt:Math.round(r.height)};}));
console.log('── ritmo dei blocchi ──');
console.log(ritmo.map(x=>`  ${x.chiaro?'▓ CHIARO':'█ scuro '}  ${x.id.padEnd(13)} ${x.alt}px`).join('\n'));
await d.close();

/* telefono: un blocco chiaro */
const m=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
await m.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await m.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await m.waitForTimeout(2400);
const H2=await m.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H2;y+=700){await m.evaluate(v=>scrollTo(0,v),y);await m.waitForTimeout(60);}
await m.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
await m.evaluate(()=>{const s=document.querySelector('#lavori');
  scrollTo(0, s.getBoundingClientRect().top+scrollY-140);});
await m.waitForTimeout(800);
await m.screenshot({path:'audit/blocchi-telefono.png'});
await b.close();
