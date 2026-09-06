import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2400);
const H=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(70);}
await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
await p.waitForTimeout(400);

const sezioni = await p.evaluate(()=>[...document.querySelectorAll('main > section')].map(s=>({
  id:s.id, chiaro:s.classList.contains('sec--chiara'),
  top:Math.round(s.getBoundingClientRect().top+scrollY),
  bot:Math.round(s.getBoundingClientRect().bottom+scrollY)})));

const confini=[];
for(let i=1;i<sezioni.length;i++)
  if(sezioni[i].chiaro!==sezioni[i-1].chiaro)
    confini.push({da:sezioni[i-1].id, a:sezioni[i].id, y:sezioni[i].top,
      verso:sezioni[i].chiaro?'scuro→chiaro':'chiaro→scuro'});

console.log('── confini di tono ──');
for(const c of confini) console.log(`  y=${String(c.y).padStart(6)}  ${c.verso}  ${c.da} → ${c.a}`);

for(const c of confini){
  await p.evaluate(y=>scrollTo(0,y-300), c.y);
  await p.waitForTimeout(400);
  await p.screenshot({path:`audit/confine-${c.da}-${c.a}.png`, clip:{x:0,y:240,width:1440,height:180}});
}
console.log(`\n${confini.length} ritagli salvati`);
await b.close();
