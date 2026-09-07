import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1500,height:900},deviceScaleFactor:1});
const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important;scroll-snap-type:none!important}'});
await p.waitForTimeout(2200);
await p.evaluate(()=>document.querySelector('#s-alchimista').scrollIntoView({block:'center'}));
await p.waitForTimeout(900);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
const box = await p.locator('#schermo').boundingBox();
/* dalle coordinate logiche (320×180) a quelle dello schermo */
const tocca = async (lx, ly) => {
  await p.mouse.click(box.x + box.width * lx/320, box.y + box.height * ly/180);
};
/* quanto e' acceso un riquadro in coordinate logiche */
const luce = (lx,ly,lw,lh) => p.evaluate(({lx,ly,lw,lh})=>{
  const cv=document.querySelector('#schermo'), g=cv.getContext('2d');
  const k=cv.width/320;
  const d=g.getImageData(lx*k, ly*k, lw*k, lh*k).data;
  let s=0; for(let i=0;i<d.length;i+=4) s+=d[i]+d[i+1]+d[i+2];
  return Math.round(s/(d.length/4)/3);
}, {lx,ly,lw,lh});

console.log('── LA CANDELA ──');
console.log('  luminosita attorno alla fiamma, accesa:', await luce(112,52,40,44));
await tocca(128, 80);
await dorme(700);
console.log('  subito dopo il tocco (deve calare):   ', await luce(112,52,40,44));
await p.screenshot({path:'audit/ogg-candela-spenta.png', clip:{x:box.x,y:box.y,width:box.width,height:box.height}});
await dorme(2600);
console.log('  dopo tre secondi (riaccesa):          ', await luce(112,52,40,44));

console.log('\n── L\'AMPOLLA ──');
const a0 = await luce(144,80,36,40);
await tocca(161, 96);
await dorme(900);
const a1 = await luce(144,80,36,40);
console.log(`  luminosita nella pancia: ${a0} → ${a1}  ${a1>a0?'ribolle ✓':'nessun cambio'}`);
await p.screenshot({path:'audit/ogg-ampolla.png', clip:{x:box.x,y:box.y,width:box.width,height:box.height}});

console.log('\n── I LIBRI ──');
const l0 = await luce(150,152,120,16);
for (const x of [200, 236, 268]) { await tocca(x, 56); await dorme(260); }
await dorme(1500);
const l1 = await luce(150,152,120,16);
console.log(`  luminosita sul pavimento: ${l0} → ${l1}  ${l1!==l0?'qualcosa e caduto ✓':'niente'}`);
await p.screenshot({path:'audit/ogg-libri.png', clip:{x:box.x,y:box.y,width:box.width,height:box.height}});
console.log('\nerrori:', err.length?err.slice(0,3):0);
await b.close();
