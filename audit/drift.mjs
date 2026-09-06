import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/portfolio.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1000);
const h=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(90);}
const r=await p.evaluate(()=>{
  const nm=e=>e.tagName.toLowerCase()+'.'+String(e.className).trim().split(/\s+/).slice(0,2).join('.');
  const leaf=[...document.querySelectorAll('main *')].filter(e=>!e.children.length&&e.textContent.trim());
  const g=(pred)=>{const m={};leaf.forEach(e=>{const k=pred(e);if(!k)return;(m[k]=m[k]||[]).push(nm(e.parentElement)+' > '+nm(e));});
    return Object.fromEntries(Object.entries(m).map(([k,v])=>[k,[...new Set(v)].slice(0,5)]));};
  return {
    whites: g(e=>{const c=getComputedStyle(e).color; return ['rgb(238, 244, 252)','rgb(255, 255, 255)','rgb(174, 183, 194)'].includes(c)?c:null;}),
    bodySizes: g(e=>{const s=getComputedStyle(e).fontSize; return ['14px','15px','17px','18px','20px','11.6667px'].includes(s)?s:null;}),
  };
});
console.log(JSON.stringify(r,null,1));
await b.close();
