import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const errori=[]; p.on('console',m=>m.type()==='error'&&errori.push(m.text()));
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);

const media = await p.evaluate(()=>({coarse:matchMedia('(pointer:coarse)').matches, noHover:matchMedia('(hover:none)').matches}));

/* la coda dell'hero: cosa si vede davvero, e dove */
const coda = await p.evaluate(()=>{
  const q=s=>{const e=document.querySelector(s); if(!e) return s+' ASSENTE';
    const c=getComputedStyle(e), r=e.getBoundingClientRect();
    return `${s} · ${c.display==='none'?'NASCOSTO':'visibile'} · ${Math.round(r.top)}→${Math.round(r.bottom)} · ${Math.round(r.width)}px`;};
  return ['.read','.rail','.hud','.hud__hint--dito','.hud__hint--puntatore','.scene-pick',
          '.hud div:nth-child(4)','.hud div:nth-child(5)'].map(q);
});

/* i bottoni di scena si toccano e funzionano? */
await p.evaluate(()=>document.querySelector('.scene-pick').scrollIntoView({block:'center'}));
await p.waitForTimeout(400);
const btn = p.locator('.scene-pick button[data-scena="2"]');
const bb = await btn.boundingBox();
await btn.tap();
await p.waitForTimeout(900);
const dopoTap = await p.evaluate(()=>({
  scena: document.querySelector('#hScene')?.textContent,
  eyebrow: document.querySelector('#heroScene')?.textContent,
  premuti: [...document.querySelectorAll('.scene-pick button')].map(b=>b.getAttribute('aria-pressed')).join(',')
}));

/* la pagina scorre ancora con il dito sull'hero? */
await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(300);
await p.touchscreen.tap(195,300);
const y0=await p.evaluate(()=>scrollY);
await p.mouse.move(195,600); await p.mouse.down(); await p.mouse.move(195,200,{steps:8}); await p.mouse.up();
await p.waitForTimeout(400);

/* pollice del cursore, misurato dal vero */
await p.evaluate(()=>document.querySelector('#mix')?.scrollIntoView({block:'center'}));
await p.waitForTimeout(300);
const pollice = await p.evaluate(()=>{
  const e=document.querySelector('#mix'); if(!e) return 'assente';
  const r=e.getBoundingClientRect(), prima=e.value;
  return {traccia:`${Math.round(r.width)}×${Math.round(r.height)}`, valore:prima};
});
/* trascino il cursore col dito e guardo se il valore cambia */
const rm = await p.locator('#mix').boundingBox();
await p.mouse.move(rm.x+rm.width*0.2, rm.y+rm.height/2); await p.mouse.down();
await p.mouse.move(rm.x+rm.width*0.8, rm.y+rm.height/2,{steps:10}); await p.mouse.up();
await p.waitForTimeout(300);
const dopoCursore = await p.evaluate(()=>document.querySelector('#mix')?.value);

/* i radio del brief: il bersaglio vero è l'etichetta? */
const radio = await p.evaluate(()=>{
  const i=document.querySelector('.brief-options input[type=radio]'); if(!i) return 'assente';
  const l=i.closest('label'); const r=l?.getBoundingClientRect();
  return {dentroEtichetta: !!l, etichetta: r?`${Math.round(r.width)}×${Math.round(r.height)}`:'—'};
});

/* scorrimento orizzontale */
const oriz = await p.evaluate(()=>document.documentElement.scrollWidth - innerWidth);

console.log(JSON.stringify({media, coda, bottoneScena:bb&&`${Math.round(bb.width)}×${Math.round(bb.height)}`,
  dopoTap, pollice, cursoreDa:pollice.valore, cursoreA:dopoCursore, radio,
  scrollOrizzontale:oriz, erroriConsole:errori}, null, 1));

await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(1200);
await p.screenshot({path:'audit/telefono-hero.png'});
await b.close();
