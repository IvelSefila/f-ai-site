import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const [w,h,tocco] of [[390,844,true],[430,932,true],[768,1024,true],[1440,900,false]]) {
  const p=await b.newPage({viewport:{width:w,height:h},isMobile:tocco,hasTouch:tocco});
  const err=[]; p.on('console',m=>m.type()==='error'&&err.push(m.text()));
  p.on('pageerror',e=>err.push('PAGE '+e.message));
  await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
  await p.waitForTimeout(1800);
  const H=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<H;y+=700){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(60);}
  await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
  await p.waitForTimeout(300);
  const r = await p.evaluate(()=>{
    const piccoli=[];
    document.querySelectorAll('a,button,summary,[role=tab]').forEach(e=>{
      const c=getComputedStyle(e); if(c.display==='none'||c.visibility==='hidden')return;
      const b=e.getBoundingClientRect(); if(!b.width||!b.height)return;
      if(b.width<44||b.height<44) piccoli.push(`${e.tagName.toLowerCase()} "${(e.textContent||'').trim().slice(0,20)}" ${Math.round(b.width)}×${Math.round(b.height)}`);
    });
    const conta=s=>document.querySelectorAll(s).length;
    return {tocchiPiccoli:piccoli, sezioni:conta('section'), prove:conta('.proof,[data-proof]'),
      strumenti:conta('.stack__group span'), bottoniScena:conta('.scene-pick button'),
      briefPassi:conta('.brief-step'), oriz:document.documentElement.scrollWidth-innerWidth};
  });
  console.log(`${w}×${h} tocco:${tocco}`, JSON.stringify({...r, errori:err.length?err:0}));
  await p.close();
}
await b.close();
