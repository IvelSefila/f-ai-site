import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const err=[]; p.on('console',m=>m.type()==='error'&&err.push(m.text()));
p.on('pageerror',e=>err.push('PAGEERROR '+e.message));
await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2500);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
const cdp=await p.context().newCDPSession(p);

/* porto un riquadro a schermo */
await p.evaluate(()=>{document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));
  const w=document.querySelector('.work'); scrollTo(0,w.getBoundingClientRect().top+scrollY-200);});
await dorme(700);
const box = await p.locator('.work').first().boundingBox();
const x=Math.round(box.x+box.width/2), y=Math.round(box.y+30);

/* pressione lunga col dito, ferma */
const t=(type,px,py)=>cdp.send('Input.dispatchTouchEvent',
  {type,touchPoints:type==='touchEnd'?[]:[{x:px,y:py,radiusX:12,radiusY:12,force:1}]});
await t('touchStart',x,y);
await dorme(320);
const durante = await p.evaluate(()=>!!document.querySelector('.pal-attesa'));
await dorme(420);
const aperto = await p.evaluate(()=>!!document.querySelector('#palPanel[open]'));
await t('touchEnd',x,y);
console.log(`segnale di attesa sul riquadro: ${durante?'sì':'NO'}`);
console.log(`pannello aperto dopo 740ms di pressione: ${aperto?'sì':'NO'}`);

/* uno scorrimento non deve aprirlo */
await p.evaluate(()=>document.querySelector('#palPanel')?.close());
await dorme(200);
await t('touchStart',x,y); await dorme(150);
for(let i=1;i<=8;i++){await t('touchMove',x,y-i*14); await dorme(20);}
await t('touchEnd',x,y-112); await dorme(500);
console.log(`scorrendo col dito si apre per sbaglio: ${await p.evaluate(()=>!!document.querySelector('#palPanel[open]'))?'SÌ ✗':'no ✓'}`);

/* provo tutte le palette e verifico che foglio e canvas seguano */
await p.evaluate(()=>{document.querySelector('#palPanel')?.close();});
const righe=[];
for (const id of ['smeraldo','ciano','indaco','magenta','corallo','ambra','lime']){
  const r = await p.evaluate(async id=>{
    const m = await import('./palette.js');
    m.applica(id);
    await new Promise(r=>setTimeout(r,260));
    const c=getComputedStyle(document.documentElement);
    const eng = await import('./engine.js');
    /* leggo un pixel dell'accento dal canvas del key visual */
    const cv=document.querySelector('#kvCanvas');
    const g=cv.getContext('2d');
    const d=g.getImageData(0,0,cv.width,cv.height).data;
    let piuSaturo=[0,0,0], best=-1;
    for(let i=0;i<d.length;i+=4*997){
      const [R,G,B]=[d[i],d[i+1],d[i+2]];
      const s=Math.max(R,G,B)-Math.min(R,G,B);
      if(s>best){best=s;piuSaturo=[R,G,B];}
    }
    return {em:c.getPropertyValue('--em').trim(), banda:c.getPropertyValue('--em-banda').trim(),
      motore:eng.EM, canvas:`rgb(${piuSaturo.join(',')})`};
  }, id);
  righe.push(`  ${id.padEnd(9)} css ${r.em.padEnd(8)} banda ${r.banda.padEnd(8)} motore ${r.motore.padEnd(8)} pixel più saturo del key visual ${r.canvas}`);
}
console.log('\n── il colore scelto arriva ovunque? ──');
console.log(righe.join('\n'));
console.log('\nerrori:', err.length?err:0);
await b.close();
