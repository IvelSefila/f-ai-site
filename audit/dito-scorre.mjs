import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2200);
await p.evaluate(()=>{document.querySelectorAll('[role=tabpanel]').forEach(e=>e.hidden=false);
  document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));});
const H = await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=700){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(60);}

/* la touch-action effettiva è l'intersezione di quelle della catena:
   se un punto qualsiasi della catena vieta il pan verticale, il dito
   su quel punto non porta su o giù la pagina. */
const BLOCCA = t => ['none','pan-x','pan-left','pan-right','pan-x pinch-zoom'].includes(t.trim());
const guai = [];
for (let y = 0; y < H; y += 120) {
  await p.evaluate(v=>scrollTo(0,v-300), y);
  await p.waitForTimeout(45);
  const r = await p.evaluate(([docY, blocca]) => {
    const fuori = [];
    const vy = docY - scrollY;
    if (vy < 0 || vy > innerHeight) return fuori;
    for (let x = 20; x < 390; x += 35) {
      let e = document.elementFromPoint(x, vy); if (!e) continue;
      let cattivo = null;
      for (let n = e; n && n !== document.documentElement; n = n.parentElement) {
        const t = getComputedStyle(n).touchAction;
        if (eval(blocca)(t)) { cattivo = `${n.tagName.toLowerCase()}${n.id?'#'+n.id:''}${n.className&&typeof n.className==='string'?'.'+n.className.split(' ')[0]:''} → ${t}`; break; }
      }
      if (cattivo) fuori.push({x, y: docY, chi: cattivo});
    }
    return fuori;
  }, [y, BLOCCA.toString()]);
  guai.push(...r);
}
const perChi = {};
for (const g of guai) (perChi[g.chi] ||= []).push(g.y);
const punti = Math.ceil(H/120) * 11;
console.log(`campionati ~${punti} punti su ${H}px di pagina`);
if (!Object.keys(perChi).length) console.log('OK — nessun punto della pagina impedisce al dito di scorrere su/giù');
else for (const [chi, ys] of Object.entries(perChi))
  console.log(`NO — ${chi}  (${ys.length} punti, da ${Math.min(...ys)} a ${Math.max(...ys)}px)`);
await b.close();
