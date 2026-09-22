import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});

async function misura(dpr, w, h, label) {
  const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor: dpr });
  await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => new Promise(res => {
    /* quante callback rAF girano davvero e quanto costa un fotogramma */
    let n = 0, t0 = performance.now(), longs = 0;
    const po = new PerformanceObserver(l => { longs += l.getEntries().length; });
    try { po.observe({ type:'longtask', buffered:true }); } catch {}
    const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick);
      else { po.disconnect(); res({ rafPerSec: +(n/2).toFixed(1), longtask: longs,
        canvas: (()=>{const c=document.querySelector('#gl');return c.width+'x'+c.height+' = '+(c.width*c.height/1e6).toFixed(1)+' Mpx'})(),
        fpsHud: document.getElementById('hFps').textContent,
        animazioniCss: document.getAnimations().filter(a=>a.playState==='running').length }); } };
    requestAnimationFrame(tick);
  }));
  console.log(label.padEnd(26), JSON.stringify(r));
  await p.close();
}
await misura(1, 1440, 900,  'dpr 1 · 1440x900');
await misura(2, 1440, 900,  'dpr 2 · 1440x900');
await misura(2, 1920, 1080, 'dpr 2 · 1920x1080');
await b.close();
