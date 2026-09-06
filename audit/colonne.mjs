import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const w of [1440,1180]){
  const p=await b.newPage({viewport:{width:w,height:900}});
  await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
  await p.waitForTimeout(2000);
  await p.evaluate(()=>{document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));
    document.querySelectorAll('[role=tabpanel]').forEach(e=>e.hidden=false);});
  const H=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<H;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(50);}
  const R = await p.evaluate(()=>['.deck','.offerta__grid','.lab','.formats','.bench--ampio','.bench--stretto','.bench--medio','.bench--invertito','.stack__grid'].map(s=>{
    const e=document.querySelector(s); if(!e) return `${s}: assente`;
    const c=getComputedStyle(e).gridTemplateColumns.split(' ').filter(Boolean);
    return `${s.padEnd(18)} ${c.length} col · figli ${e.children.length} · ${c.map(v=>Math.round(parseFloat(v))).join('/')}`;
  }));
  console.log(`══ ${w}px ══\n  `+R.join('\n  '));
  await p.close();
}
await b.close();
