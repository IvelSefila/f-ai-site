import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1000,height:620}});
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(1200);
const quale = process.argv[2] || 'alchimista';
await p.evaluate(async (quale)=>{
  const { sfondo } = await import('./sfondi.js');
  const { RGB } = await import('./tavolozza.js');
  const a = sfondo(quale);
  const W = 960, H = 540;
  document.body.innerHTML = '';
  document.body.style.cssText='margin:0;background:#0c0910';
  const cv = document.createElement('canvas');
  cv.width=W; cv.height=H;
  cv.style.cssText='width:960px;height:540px;image-rendering:pixelated;display:block';
  const g = cv.getContext('2d');
  const im = g.createImageData(W,H);
  for (let i=0;i<a.length;i++){ const [r,gg,bb]=RGB[a[i]];
    im.data[i*4]=r; im.data[i*4+1]=gg; im.data[i*4+2]=bb; im.data[i*4+3]=255; }
  g.putImageData(im,0,0);
  /* griglia in coordinate LOGICHE (320×180), che e' la lingua delle stanze */
  g.font='11px monospace'; g.textBaseline='top';
  for (let x=0; x<=320; x+=20){
    const rx = x*3;
    g.strokeStyle = x%40===0 ? 'rgba(255,80,80,.85)' : 'rgba(255,255,255,.22)';
    g.beginPath(); g.moveTo(rx+.5,0); g.lineTo(rx+.5,H); g.stroke();
    if (x%40===0){ g.fillStyle='#000'; g.fillRect(rx+2,2,22,13);
      g.fillStyle='#ff8'; g.fillText(String(x), rx+4, 3); }
  }
  for (let y=0; y<=180; y+=20){
    const ry = y*3;
    g.strokeStyle = y%40===0 ? 'rgba(255,80,80,.85)' : 'rgba(255,255,255,.22)';
    g.beginPath(); g.moveTo(0,ry+.5); g.lineTo(W,ry+.5); g.stroke();
    if (y%40===0){ g.fillStyle='#000'; g.fillRect(2,ry+2,22,13);
      g.fillStyle='#ff8'; g.fillText(String(y), 4, ry+3); }
  }
  document.body.appendChild(cv);
}, quale);
await p.waitForTimeout(300);
await p.screenshot({path:`audit/griglia-${quale}.png`, clip:{x:0,y:0,width:960,height:540}});
console.log('griglia su', quale);
await b.close();
