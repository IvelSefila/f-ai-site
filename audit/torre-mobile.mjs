import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const [w,h,tocco] of [[390,844,true],[768,1024,true],[1400,900,false]]){
  const p=await b.newPage({viewport:{width:w,height:h},isMobile:tocco,hasTouch:tocco});
  const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
  p.on('console',m=>m.type()==='error'&&err.push(m.text()));
  await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
  await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  await p.waitForTimeout(1800);
  const R = await p.evaluate(()=>{
    const piccoli=[];
    document.querySelectorAll('a,button').forEach(e=>{
      const c=getComputedStyle(e); if(c.display==='none')return;
      const r=e.getBoundingClientRect(); if(!r.width||!r.height)return;
      if(r.width<44||r.height<44) piccoli.push(`${e.textContent.trim().slice(0,14)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    const cv=document.querySelector('#schermo').getBoundingClientRect();
    return {sottoIl44:piccoli, schermo:`${Math.round(cv.width)}x${Math.round(cv.height)}`,
      oriz:document.documentElement.scrollWidth-innerWidth,
      touchAction:getComputedStyle(document.querySelector('#schermo')).touchAction,
      sezioni:document.querySelectorAll('[data-stanza]').length};
  });
  /* scorro e guardo se la stanza segue */
  const seq=[];
  for (const id of ['s-bilancia','s-forgia','s-scheda']){
    await p.evaluate(i=>document.querySelector('#'+i).scrollIntoView({block:'start'}), id);
    await p.waitForTimeout(700);
    seq.push(await p.evaluate(()=>document.querySelector('#nomeStanza').textContent));
  }
  console.log(`${String(w).padStart(4)}px  schermo ${R.schermo} · oriz ${R.oriz} · touch-action ${R.touchAction} · ${R.sezioni} sezioni`);
  console.log(`        scorrendo: ${seq.join(' → ')}`);
  console.log(`        sotto 44px: ${R.sottoIl44.length? R.sottoIl44.join(', ') : 'nessuno'}${err.length?'  ERRORI '+err[0]:''}`);
  if (w===390){ await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(900);
    await p.screenshot({path:'audit/torre-telefono.png'}); }
  await p.close();
}
await b.close();
