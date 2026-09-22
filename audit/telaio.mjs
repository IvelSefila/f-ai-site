import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const [w,h] of [[1440,900],[390,844]]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
  await p.waitForTimeout(1500);
  const R = await p.evaluate(()=>{
    const q = s => { const e=document.querySelector(s); if(!e) return s+' assente';
      const r=e.getBoundingClientRect();
      return `${Math.round(r.width)}×${Math.round(r.height)} (rapporto ${(r.width/r.height).toFixed(2)}) @ ${Math.round(r.left)},${Math.round(r.top)}`; };
    const t=document.querySelector('.telaio');
    return {scena:q('.scena'), telaio:q('.telaio'), canvas:q('#schermo'),
      aspetto:getComputedStyle(t).aspectRatio,
      allineamento:getComputedStyle(document.querySelector('.scena')).placeItems,
      scala:(t.getBoundingClientRect().width/320).toFixed(2)+'× i pixel'};
  });
  console.log(`══ ${w}×${h} ══`);
  for (const [k,v] of Object.entries(R)) console.log(`  ${k.padEnd(13)} ${v}`);
  await p.close();
}
await b.close();
