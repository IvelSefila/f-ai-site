import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const cdp = await p.context().newCDPSession(p);
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2200);
await p.evaluate(()=>{document.querySelectorAll('[role=tabpanel]').forEach(e=>e.hidden=false);
  document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));});
const H=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=700){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(60);}
await p.waitForTimeout(400);

const dorme = ms => new Promise(r=>setTimeout(r,ms));
/* swipe verticale col dito vero: il browser rispetta touch-action */
async function swipeSu(x,y,dist){
  await cdp.send('Input.synthesizeScrollGesture',
    {x,y,xDistance:0,yDistance:-dist,gestureSourceType:'touch',speed:1600,preventFling:true});
  await dorme(450);
}
/* trascinamento orizzontale col dito */
async function trascina(x,y,dx){
  const t=(type,px)=>cdp.send('Input.dispatchTouchEvent',
    {type,touchPoints:type==='touchEnd'?[]:[{x:px,y,radiusX:12,radiusY:12,force:1}]});
  await t('touchStart',x);
  for(let i=1;i<=12;i++){ await t('touchMove', x+dx*i/12); await dorme(16); }
  await t('touchEnd',x+dx);
  await dorme(300);
}

const posti = ['#gl','#kvCanvas','#mix','#tlCanvas','#tlPace','#radar','#matCanvas','#socDens','.graph .node','.formats figure','.phases button'];
const righe=[];
for (const sel of posti){
  const el = await p.$(sel); if(!el){righe.push(`✗ ${sel} assente`);continue;}
  await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:'center'}), sel);
  await dorme(250);
  const r = await el.boundingBox();
  const cx = Math.round(r.x + r.width/2);
  const cy = Math.round(Math.min(720, Math.max(200, r.y + r.height/2)));
  const prima = await p.evaluate(()=>scrollY);
  await swipeSu(cx,cy,240);
  const d = Math.round(await p.evaluate(()=>scrollY) - prima);
  righe.push(`${d>150?'OK ':'NO '} ${sel.padEnd(18)} swipe verticale → pagina scesa di ${d}px`);
}
console.log(righe.join('\n'));

const leve=[];
for (const id of ['#mix','#fmtIdea','#tlPace','#socDens']){
  await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:'center'}), id);
  await dorme(250);
  const r = await p.locator(id).boundingBox();
  const prima = await p.evaluate(s=>document.querySelector(s).value, id);
  await trascina(Math.round(r.x+r.width*0.15), Math.round(r.y+r.height/2), Math.round(r.width*0.7));
  const dopo = await p.evaluate(s=>document.querySelector(s).value, id);
  leve.push(`${prima!==dopo?'OK ':'NO '} ${id.padEnd(10)} trascinamento orizzontale ${prima} → ${dopo}`);
}
console.log(leve.join('\n'));

/* il confine dell'hero si sposta col dito? */
await p.evaluate(()=>scrollTo(0,0)); await dorme(400);
const s0 = await p.evaluate(()=>document.querySelector('#hAi').textContent);
await trascina(90, 420, 200);
const s1 = await p.evaluate(()=>document.querySelector('#hAi').textContent);
console.log(`${s0!==s1?'OK ':'NO '} hero      confine trascinato col dito ${s0} → ${s1}`);
await b.close();
