import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1400,height:900},deviceScaleFactor:1});
const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n').slice(0,2).join(' | ')));
p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2200);
console.log('errori:', err.length?err.slice(0,3):0);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
const NOMI=['soglia','bilancia','scriptorium','banchi','forgia','materia','scheda','alchimista'];
for (let i=0;i<8;i++){
  await p.evaluate(i=>document.querySelector(`[data-vai="${i}"]`).click(), i);
  await dorme(900);
  const q = await p.evaluate(()=>{
    const cv=document.querySelector('#schermo'), g=cv.getContext('2d');
    const d=g.getImageData(0,0,320,180).data;
    const set=new Set();
    for(let k=0;k<d.length;k+=4) set.add(`${d[k]},${d[k+1]},${d[k+2]}`);
    return {colori:set.size, nome:document.querySelector('#nomeStanza').textContent};
  });
  console.log(`  ${String(i).padStart(2,'0')} ${NOMI[i].padEnd(12)} ${q.nome.padEnd(16)} ${q.colori} pigmenti in campo`);
  await p.screenshot({path:`audit/torre-${i}-${NOMI[i]}.png`, clip:{x:0,y:0,width:800,height:520}});
}
console.log('errori finali:', err.length?err.slice(0,3):0);
await b.close();
