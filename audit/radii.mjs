import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/portfolio.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1000);
const h=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(90);}
const r=await p.evaluate(()=>{const m={};
 document.querySelectorAll('main *').forEach(e=>{const v=getComputedStyle(e).borderRadius;
  if(!v||['0px','999px','50%','16px'].includes(v))return;
  const k=v; (m[k]=m[k]||[]).push((e.tagName.toLowerCase()+'.'+String(e.className).trim().split(/\s+/).slice(0,2).join('.')));});
 return Object.fromEntries(Object.entries(m).map(([k,v])=>[k,[...new Set(v)].slice(0,4)]));});
console.log(JSON.stringify(r,null,1));
await b.close();
