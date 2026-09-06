import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/portfolio.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const a=document.querySelector('.hero__atlas'); const A=getComputedStyle(a);
  const props=['left','right','top','translate','scale','rotate','marginInlineStart','marginInlineEnd','justifySelf','alignSelf','inset','zoom','writingMode','direction','order','float'];
  const own = Object.fromEntries(props.map(k=>[k,A[k]]));
  // which rules match
  const matched=[];
  for(const s of document.styleSheets){ let rules; try{rules=s.cssRules}catch{continue}
    for(const rule of rules){
      const scan=(rl,media)=>{ if(rl.selectorText){ try{ if(a.matches(rl.selectorText) && /left|translate|margin|justify|inset|position/.test(rl.style.cssText)) matched.push((media?media+' :: ':'')+rl.selectorText+' { '+rl.style.cssText+' }'); }catch{} }
        else if(rl.cssRules) for(const sub of rl.cssRules) scan(sub, rl.conditionText||rl.media?.mediaText); };
      scan(rule);
    }}
  return {own, matched, rect:a.getBoundingClientRect().toJSON(), parentRect:a.parentElement.getBoundingClientRect().toJSON()};
});
console.log(JSON.stringify(r,null,1));
await b.close();
