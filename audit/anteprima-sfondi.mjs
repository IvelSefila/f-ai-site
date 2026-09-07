import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1300,height:760}});
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'domcontentloaded'});
const R = await p.evaluate(async ()=>{
  const { sfondo, NOMI } = await import('./sfondi.js');
  const { RGB } = await import('./tavolozza.js');
  document.body.innerHTML = '<div id="w" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;background:#0c0910"></div>';
  const w = document.querySelector('#w');
  for (const n of NOMI){
    const a = sfondo(n);
    const cv = document.createElement('canvas');
    cv.width=320; cv.height=180;
    cv.style.cssText='width:100%;image-rendering:pixelated;border:1px solid #3d2b4f';
    const g = cv.getContext('2d');
    const im = g.createImageData(320,180);
    for (let i=0;i<a.length;i++){
      const [r,gg,bb] = RGB[a[i]];
      im.data[i*4]=r; im.data[i*4+1]=gg; im.data[i*4+2]=bb; im.data[i*4+3]=255;
    }
    g.putImageData(im,0,0);
    const box = document.createElement('div');
    box.innerHTML = `<p style="margin:0 0 4px;color:#d4af37;font:600 12px monospace">${n}</p>`;
    box.appendChild(cv); w.appendChild(box);
  }
  return NOMI;
});
await p.waitForTimeout(400);
await p.screenshot({path:'audit/sfondi-anteprima.png', fullPage:true});
console.log('anteprima di', R.join(', '));
await b.close();
