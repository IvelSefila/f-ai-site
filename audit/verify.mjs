import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto(process.env.U || 'http://localhost:8899/portfolio.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1200);
const h=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(100);}
await p.evaluate(()=>{document.body.classList.remove('loaded');document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in-view'))});
await p.waitForTimeout(400);
const r=await p.evaluate(()=>{
  const art=e=>e.closest('.work-card__art, .campaign-stage, .system-flow');
  const leaf=[...document.querySelectorAll('main *')].filter(e=>!e.children.length&&e.textContent.trim());
  const ui=leaf.filter(e=>!art(e));
  const sizes=new Set(ui.map(e=>getComputedStyle(e).fontSize));
  const colors=new Set(ui.map(e=>getComputedStyle(e).color));
  const radii=new Set([...document.querySelectorAll('main *')].map(e=>getComputedStyle(e).borderRadius).filter(v=>v&&v!=='0px'));
  const c=document.querySelector('.hero__copy').getBoundingClientRect();
  const a=document.querySelector('.hero__atlas').getBoundingClientRect();
  const orange=[...document.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return /255, 93, 53|194, 54, 15/.test(s.color+s.backgroundColor+s.borderTopColor)}).length;
  const lefts=new Set([...document.querySelectorAll('main > section[id] h1, main > section[id] h2')].map(e=>Math.round(e.getBoundingClientRect().left)));
  return {
    distinctSizesUI:[...sizes].sort((x,y)=>parseFloat(x)-parseFloat(y)),
    distinctColorsUI:colors.size,
    distinctRadii:[...radii],
    heroGapPx: Math.round(a.left-c.right),
    orangeElements:orange,
    headlineLeftEdges:[...lefts].sort((x,y)=>x-y),
    pageHeight: document.body.scrollHeight,
  };
});
console.log(JSON.stringify(r,null,1));
await b.close();
