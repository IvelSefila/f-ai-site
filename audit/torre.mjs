import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1400,height:820},deviceScaleFactor:1});
const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important;scroll-snap-type:none!important}'});
await p.waitForTimeout(2000);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
const IDS=['soglia','bilancia','scriptorium','banchi','forgia','materia','scheda','alchimista'];
for (const id of IDS){
  await p.evaluate(i=>document.querySelector('#s-'+i).scrollIntoView({block:'center'}), id);
  await dorme(750);
  const q = await p.evaluate(()=>{
    const cv=document.querySelector('#schermo'), g=cv.getContext('2d');
    const d=g.getImageData(0,0,320,180).data;
    const set=new Set();
    for(let k=0;k<d.length;k+=4) set.add(`${d[k]},${d[k+1]},${d[k+2]}`);
    return {colori:set.size, stato:document.querySelector('#statoStanza').textContent};
  });
  console.log(`  ${id.padEnd(12)} ${q.stato.padEnd(24)} ${q.colori} pigmenti`);
  await p.screenshot({path:`audit/torre-${id}.png`, clip:{x:0,y:0,width:900,height:520}});
}
console.log('errori:', err.length?err.slice(0,3):0);
await b.close();
