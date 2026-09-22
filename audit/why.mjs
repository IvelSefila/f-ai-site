import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/portfolio.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const hero=document.querySelector('.hero'),a=document.querySelector('.hero__atlas'),c=document.querySelector('.hero__copy');
  const g=getComputedStyle(hero), A=getComputedStyle(a), C=getComputedStyle(c);
  return {
    heroCols:g.gridTemplateColumns, heroGap:g.columnGap, heroPad:g.paddingLeft+' / '+g.paddingRight,
    heroDisplay:g.display, heroWidth:hero.offsetWidth,
    atlas:{col:A.gridColumnStart+'/'+A.gridColumnEnd, row:A.gridRowStart+'/'+A.gridRowEnd, margin:A.margin, transform:A.transform, width:A.width, pos:A.position, left:Math.round(a.getBoundingClientRect().x)},
    copy:{col:C.gridColumnStart+'/'+C.gridColumnEnd, row:C.gridRowStart+'/'+C.gridRowEnd, maxW:C.maxWidth, width:C.width, right:Math.round(c.getBoundingClientRect().right)},
    kids:[...hero.children].map(e=>{const s=getComputedStyle(e);const q=e.getBoundingClientRect();return e.className.split(' ')[0]+' | col'+s.gridColumnStart+' row'+s.gridRowStart+' | x'+Math.round(q.x)+' w'+Math.round(q.width)+' | pos:'+s.position;})
  };
});
console.log(JSON.stringify(r,null,1));
await b.close();
