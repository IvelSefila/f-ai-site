import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/portfolio.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
const probe = async (label) => {
  const r = await p.evaluate(() => new Promise(res => {
    let n=0; const t0=performance.now();
    const tick=()=>{ n++; if(performance.now()-t0 < 1000) requestAnimationFrame(tick);
      else res({ rafPerSec:n,
        cssAnims: document.getAnimations().filter(a=>a.playState==='running').length,
        names: [...new Set(document.getAnimations().filter(a=>a.playState==='running')
          .map(a=>(a.animationName||a.transitionProperty||'?')+'@'+(a.effect?.target?.className||'').split(' ')[0]))].slice(0,10) }); };
    requestAnimationFrame(tick);
  }));
  console.log(label, JSON.stringify(r));
};
await probe('hero visibile ');
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
await p.waitForTimeout(2500);
await probe('fondo pagina ');
await b.close();
