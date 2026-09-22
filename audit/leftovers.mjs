import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/portfolio.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1200);
const h=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(100);}
const r=await p.evaluate(()=>{
  const path=e=>{const s=[];let n=e;for(let i=0;i<3&&n&&n.tagName!=='BODY';i++){s.unshift(n.tagName.toLowerCase()+(n.className&&typeof n.className==='string'?'.'+n.className.trim().split(/\s+/).join('.'):''));n=n.parentElement;}return s.join(' > ');};
  const tiny=[...document.querySelectorAll('main *')].filter(e=>!e.children.length&&e.textContent.trim()&&parseFloat(getComputedStyle(e).fontSize)<11)
    .map(e=>getComputedStyle(e).fontSize+'  ::  '+path(e));
  const r14=[...document.querySelectorAll('main *')].filter(e=>getComputedStyle(e).borderRadius==='14px').map(e=>path(e));
  const other=[...document.querySelectorAll('main *')].map(e=>getComputedStyle(e).borderRadius).filter(v=>v&&!['0px','999px','50%','16px'].includes(v));
  return {tiny:[...new Set(tiny)], r14:[...new Set(r14)].slice(0,8), otherRadii:[...new Set(other)]};
});
console.log(JSON.stringify(r,null,1));
await b.close();
