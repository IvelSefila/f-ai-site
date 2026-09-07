import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important;scroll-snap-type:none!important}'});
await p.waitForTimeout(2200);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
await p.evaluate(()=>document.querySelector('#s-alchimista').scrollIntoView({block:'center'}));
await dorme(900);

const conta = () => p.evaluate(()=>{
  const cv=document.querySelector('#schermo'), g=cv.getContext('2d');
  const d=g.getImageData(0,0,cv.width,cv.height).data;
  /* quanti pixel sono nella famiglia dell'oro: caldi e chiari */
  let oro=0, tot=0;
  for(let i=0;i<d.length;i+=4){
    tot++;
    const r=d[i],gg=d[i+1],bb=d[i+2];
    if (r>gg && gg>bb && r>90) oro++;
  }
  return Math.round(oro/tot*1000)/10;
});
console.log('pixel caldi prima del clic:', await conta() + '%');
await p.screenshot({path:'audit/trasmuta-prima.png', clip:{x:20,y:150,width:980,height:600}});

const box = await p.locator('#schermo').boundingBox();
for (const [fx,fy] of [[.28,.42],[.5,.55],[.72,.38],[.4,.72],[.62,.25]]){
  await p.mouse.click(box.x+box.width*fx, box.y+box.height*fy);
  await dorme(450);
}
await dorme(600);
console.log('pixel caldi dopo cinque clic:', await conta() + '%');
await p.screenshot({path:'audit/trasmuta-dopo.png', clip:{x:20,y:150,width:980,height:600}});

/* il tasto rigenera deve riportare tutto com'era */
await p.evaluate(()=>document.querySelector('#s-fine').scrollIntoView({block:'center'}));
await dorme(400);
await p.evaluate(()=>document.querySelector('#rigenera').click());
await p.evaluate(()=>document.querySelector('#s-alchimista').scrollIntoView({block:'center'}));
await dorme(900);
console.log('dopo "rigenera il mondo":', await conta() + '%');
console.log('errori:', err.length?err.slice(0,3):0);
await b.close();
