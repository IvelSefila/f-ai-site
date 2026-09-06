import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2000);
const R = await p.evaluate(async () => {
  const dorme=ms=>new Promise(r=>setTimeout(r,ms));
  const leggi=(sel,pseudo)=>getComputedStyle(document.querySelector(sel),pseudo);
  const out={};
  const e=document.querySelector('#lavori .sec__head');
  const doc=e.getBoundingClientRect().top+scrollY;
  scrollTo(0,doc-800); await dorme(160);
  const a=leggi('#lavori .sec__head','::before').translate;
  scrollTo(0,doc-200); await dorme(160);
  const c=leggi('#lavori .sec__head','::before').translate;
  out.numerone = `translate: ${a}  →  ${c}`;

  /* la soglia: esiste, ha il colore giusto, si apre? */
  const s=document.querySelector('#lavori');
  const sd=s.getBoundingClientRect().top+scrollY;
  scrollTo(0,sd-980); await dorme(160);
  const p1=leggi('#lavori','::before');
  scrollTo(0,sd-300); await dorme(160);
  const p2=leggi('#lavori','::before');
  out.soglia = `scale ${p1.scale} (fuori) → ${p2.scale} (dentro) · opacità ${p1.opacity} → ${p2.opacity} · h ${p2.height} · ${p2.backgroundImage.slice(0,52)}`;

  /* la soglia esiste anche sul blocco scuro che segue un chiaro? */
  const dopo=document.querySelector('#lavori + .sec');
  out.dopoUnChiaro = dopo ? `${dopo.id}: ${getComputedStyle(dopo,'::before').height} alta, ${getComputedStyle(dopo,'::before').backgroundImage.slice(0,40)}` : 'nessuna';
  return out;
});
for (const [k,v] of Object.entries(R)) console.log(`${k.padEnd(14)} ${v}`);
await b.close();
