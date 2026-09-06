import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/portfolio.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1000);
const h=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(100);}
const out=await p.evaluate(()=>{
  const tiny=[...document.querySelectorAll('main *')].filter(e=>!e.children.length&&e.textContent.trim()&&parseFloat(getComputedStyle(e).fontSize)<=8)
    .map(e=>getComputedStyle(e).fontSize+' | '+(e.className||e.tagName)+' | '+e.textContent.trim().slice(0,32));
  // where does --cut / orange live
  const orange=[...document.querySelectorAll('*')].filter(e=>{const c=getComputedStyle(e);return /255, 93, 53|255, 92|204, 255, 54/.test(c.color+c.backgroundColor+c.borderColor)}).length;
  const rootVars=['--cut','--selected','--ai-layer','--stage','--ink','--accent','--blue'].map(v=>v+'='+getComputedStyle(document.documentElement).getPropertyValue(v).trim());
  // widest content column vs viewport
  const gutters=[...document.querySelectorAll('main > section[id]')].map(s=>{const c=s.firstElementChild;return s.id+' left:'+Math.round(c.getBoundingClientRect().left)+' w:'+Math.round(c.getBoundingClientRect().width)});
  // radii inventory
  const radii={};document.querySelectorAll('main *').forEach(e=>{const r=getComputedStyle(e).borderRadius;if(r&&r!=='0px')radii[r]=(radii[r]||0)+1});
  // stylesheet sizes
  const sheets=[...document.styleSheets].map(s=>{try{return (s.href||'inline').split('/').pop()+' rules:'+s.cssRules.length}catch{return 'blocked'}});
  return {tinyCount:tiny.length, tiny:tiny.slice(0,20), orangeElements:orange, rootVars, gutters, radii:Object.entries(radii).sort((a,b)=>b[1]-a[1]).slice(0,12), sheets};
});
console.log(JSON.stringify(out,null,1));
await b.close();
