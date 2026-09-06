import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);

/* swipe verticale PARTENDO DAL CANVAS dell'hero: prima restava bloccato */
const prima = await p.evaluate(()=>scrollY);
const c = await p.locator('#gl').boundingBox();
await p.touchscreen.tap(c.x + c.width/2, c.y + c.height/2);
for (let k=0;k<3;k++){
  await p.evaluate(({x,y})=>{
    const t = (tipo, cy) => {
      const to = new Touch({identifier:1, target:document.elementFromPoint(x,cy)||document.body, clientX:x, clientY:cy});
      document.elementFromPoint(x,cy)?.dispatchEvent(new TouchEvent(tipo,{touches:tipo==='touchend'?[]:[to],targetTouches:tipo==='touchend'?[]:[to],changedTouches:[to],bubbles:true,cancelable:true}));
    };
    t('touchstart', y+180); t('touchmove', y+40); t('touchend', y+40);
  }, {x: Math.round(c.x+c.width/2), y: Math.round(c.y+c.height/2)});
  await p.mouse.wheel(0, 500);
  await p.waitForTimeout(180);
}
const dopo = await p.evaluate(()=>scrollY);
console.log('scorrimento dal canvas:', prima, '→', Math.round(dopo), dopo>300 ? '✓ si muove' : '✗ bloccato');

/* la navigazione funziona? */
await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(300);
const navBox = await p.locator('.bar__nav a').nth(3).boundingBox();
await p.touchscreen.tap(navBox.x+navBox.width/2, navBox.y+navBox.height/2);
await p.waitForTimeout(900);
console.log('tocco su nav 04 → sezione:', await p.evaluate(()=>{
  const y=scrollY+120; let id='—';
  document.querySelectorAll('main > section[id]').forEach(s=>{const r=s.getBoundingClientRect();
    if(r.top+scrollY<=y && r.bottom+scrollY>y) id=s.id;}); return id;}));
console.log('errori:', errs.length?errs:'nessuno');
await b.close();
