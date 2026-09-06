import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:860},deviceScaleFactor:1});
const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n').slice(0,2).join(' | ')));
p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
console.log('errori:', err.length?err.slice(0,3):0);
const R = await p.evaluate(()=>{
  const cv=document.querySelector('#schermo');
  const g=cv.getContext('2d');
  const d=g.getImageData(0,0,cv.width,cv.height).data;
  const conta={};
  for(let i=0;i<d.length;i+=4){
    const k=`${d[i]},${d[i+1]},${d[i+2]}`;
    conta[k]=(conta[k]||0)+1;
  }
  const ord=Object.entries(conta).sort((a,b)=>b[1]-a[1]);
  return {misura:cv.width+'x'+cv.height, pixel:cv.width*cv.height,
    coloriDistinti:ord.length,
    primi:ord.slice(0,8).map(([c,n])=>`rgb(${c})×${n}`),
    pigmenti:document.querySelectorAll('#listaPigmenti li').length};
});
console.log(JSON.stringify(R,null,1));
await p.screenshot({path:'audit/pixel-titolo.png', clip:{x:0,y:0,width:1280,height:800}});
/* tocco al centro e guardo le scintille */
const box=await p.locator('#schermo').boundingBox();
await p.mouse.move(box.x+box.width*0.3, box.y+box.height*0.55);
await p.mouse.down(); await p.waitForTimeout(700);
await p.screenshot({path:'audit/pixel-torcia.png', clip:{x:0,y:0,width:1280,height:800}});
await p.mouse.up();
const dopo = await p.evaluate(()=>document.querySelector('#schermo').getContext('2d')
  .getImageData(0,0,320,180).data.filter((v,i)=>i%4===0).reduce((a,b)=>a+b,0));
console.log('somma canale rosso dopo la torcia:', dopo);
await b.close();
