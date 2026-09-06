import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2200);
const H=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=700){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(70);}
await p.evaluate(()=>{document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));
  document.querySelectorAll('[role=tabpanel]').forEach(e=>e.hidden=false);});
await p.waitForTimeout(600);

const COPPIE = [
  ['#mix','#kvCanvas','regia · leva umano/AI'],
  ['.phases','#kvCanvas','regia · cinque fasi'],
  ['#fmtIdea','#formats','banchi · grafica'],
  ['#tlPace','#tlCanvas','banchi · video'],
  ['#socDens','#socials','banchi · social'],
  ['#grRun','#graph','banchi · flussi AI'],
  ['.modes[aria-label*="Modalit"]','#radar','tecnologia · radar'],
  ['.modes[aria-label*="Disposizioni"]','#matCanvas','materia · nuvola'],
  ['#gl','#gl','hero · confine'],
];

const out = await p.evaluate(async COPPIE => {
  const BARRA = 113, SCH = 844;
  const dorme = ms => new Promise(r => setTimeout(r, ms));
  const res = [];
  for (const [cs, vs, nome] of COPPIE) {
    const c = document.querySelector(cs), v = document.querySelector(vs);
    if (!c || !v) { res.push({ nome, stato: 'ASSENTE ' + (c ? vs : cs) }); continue; }
    /* porto il comando nella zona del pollice: 78% dell'area utile */
    const rc0 = c.getBoundingClientRect();
    const bersaglio = BARRA + (SCH - BARRA) * 0.78;
    scrollTo(0, Math.max(0, scrollY + rc0.top + rc0.height / 2 - bersaglio));
    await dorme(60);
    const rc = c.getBoundingClientRect(), rv = v.getBoundingClientRect();
    const dentro = Math.max(0, Math.min(rv.bottom, SCH) - Math.max(rv.top, BARRA));
    res.push({ nome,
      comandoA: Math.round(rc.top),
      visuale: `${Math.round(rv.top)}→${Math.round(rv.bottom)}`,
      alta: Math.round(rv.height),
      visibile: Math.round(dentro),
      quota: rv.height ? Math.round(dentro / rv.height * 100) : 0 });
  }
  return res;
}, COPPIE);

console.log(out.map(x => x.stato ? `✗ ${x.nome} — ${x.stato}`
 : `${x.quota>=85?'OK ':x.quota>=50?'—  ':'NO '} ${x.nome.padEnd(24)} risultato visibile ${String(x.quota).padStart(3)}%  (${x.visibile}/${x.alta}px, box ${x.visuale}, barra a 113)`).join('\n'));
await b.close();
