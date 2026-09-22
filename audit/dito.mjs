import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2000);
const h=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(70);}
await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
await p.waitForTimeout(300);

const r = await p.evaluate(() => {
  const sel = 'a,button,input,label,summary,[role=tab],[tabindex]:not([tabindex="-1"])';
  const piccoli = [], vicini = [];
  const box = [];
  document.querySelectorAll(sel).forEach(e => {
    const c = getComputedStyle(e);
    if (c.display === 'none' || c.visibility === 'hidden') return;
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const et = (e.textContent||'').replace(/\s+/g,' ').trim().slice(0,28) || e.type || e.tagName;
    box.push({ e, r, et });
    if (r.width < 44 || r.height < 44)
      piccoli.push(`${e.tagName.toLowerCase()}.${(e.className||'').toString().split(' ')[0]} "${et}" ${Math.round(r.width)}×${Math.round(r.height)}`);
  });
  /* distanza fra bersagli vicini */
  for (let i=0;i<box.length;i++) for (let j=i+1;j<box.length;j++) {
    const a=box[i].r, c=box[j].r;
    if (box[i].e.contains(box[j].e) || box[j].e.contains(box[i].e)) continue;
    const dx = Math.max(0, Math.max(a.left,c.left) - Math.min(a.right,c.right));
    const dy = Math.max(0, Math.max(a.top,c.top) - Math.min(a.bottom,c.bottom));
    const d = Math.hypot(dx,dy);
    if (d < 8 && Math.abs(a.top-c.top) < 400) vicini.push(`${box[i].et} ↔ ${box[j].et} = ${d.toFixed(1)}px`);
  }
  /* pollice del cursore */
  const pollici = [...document.querySelectorAll('input[type=range]')].map(e=>{
    const s=document.createElement('style'); s.textContent='';
    return e.id;
  });
  return { sottoIl44: piccoli, totaleBersagli: box.length,
           troppoVicini: [...new Set(vicini)].slice(0,14) };
});

/* dimensione reale del pollice del cursore, letta dal CSS */
const thumb = await p.evaluate(() => {
  const out=[];
  for (const ss of document.styleSheets) { try { for (const r of ss.cssRules) {
    if (r.selectorText && /::-webkit-slider-thumb/.test(r.selectorText))
      out.push(r.selectorText.slice(0,40)+' → '+r.style.width+' / '+r.style.height);
  }} catch{} }
  return out;
});
console.log(JSON.stringify({...r, pollicreCursore: thumb}, null, 1));
await b.close();
