import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8899/lab/hero-v2.html',{waitUntil:'networkidle'});
await p.waitForTimeout(3000);
const st=await p.evaluate(()=>({
  gl: !!document.querySelector('canvas').getContext('webgl2'),
  fallback: document.body.classList.contains('no-gl'),
  hud: {t:t.textContent, human:human.textContent, ai:ai.textContent, fps:fps.textContent, scene:scene.textContent},
  verdetto: document.getElementById('verdict').textContent.slice(0,60),
  size: [document.querySelector('canvas').width, document.querySelector('canvas').height],
}));
console.log(JSON.stringify(st,null,1));
console.log('errori:', errs.length? errs.slice(0,4) : 'nessuno');
await p.screenshot({path:'audit/lab-hero-50.jpg',type:'jpeg',quality:82});
// trascina il confine
const box=await p.locator('#gl').boundingBox();
await p.mouse.move(box.x+box.width*0.5, box.y+box.height*0.5);
await p.mouse.down();
await p.mouse.move(box.x+box.width*0.22, box.y+box.height*0.5,{steps:14});
await p.waitForTimeout(1400);           // tenendo premuto: erosione
await p.screenshot({path:'audit/lab-hero-22.jpg',type:'jpeg',quality:82});
await p.mouse.up();
await p.mouse.move(box.x+box.width*0.8, box.y+box.height*0.5);
await p.mouse.down(); await p.mouse.move(box.x+box.width*0.8, box.y+box.height*0.5,{steps:4}); await p.mouse.up();
await p.waitForTimeout(1200);
await p.screenshot({path:'audit/lab-hero-80.jpg',type:'jpeg',quality:82});
console.log('hud finale:', JSON.stringify(await p.evaluate(()=>({ai:ai.textContent,er:erode.textContent,fps:fps.textContent}))));
await b.close();
