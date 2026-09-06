import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2200);
await p.evaluate(()=>{const s=document.querySelector('#lavori');
  scrollTo(0, s.getBoundingClientRect().top+scrollY-420);});
await p.waitForTimeout(800);
const stato = await p.evaluate(()=>{
  const c=getComputedStyle(document.querySelector('#lavori'),'::before');
  const r=document.querySelector('#lavori').getBoundingClientRect();
  return {scale:c.scale,opacity:c.opacity,h:c.height,z:c.zIndex,bordo:Math.round(r.top)};
});
console.log('pseudo-soglia:', JSON.stringify(stato));
/* leggo i pixel su una colonna al centro, attorno al confine */
const buf = await p.screenshot({clip:{x:700,y:stato.bordo-6,width:2,height:12}});
const { createCanvas, loadImage } = await import('canvas').catch(()=>({}));
if (!createCanvas) {
  /* niente libreria: leggo i pixel dentro la pagina con un canvas del browser */
  const px = await p.evaluate(async (y0)=>{
    const s=document.createElement('canvas'); s.width=1;s.height=14;
    /* non posso disegnare la pagina: uso elementFromPoint + colore calcolato */
    const out=[];
    for(let dy=-6;dy<=6;dy++){
      const e=document.elementFromPoint(700, y0+dy);
      out.push(`${String(dy).padStart(3)}  ${e?e.tagName.toLowerCase()+(e.id?'#'+e.id:''):'—'}`);
    }
    return out;
  }, stato.bordo);
  console.log('── cosa c\'è sotto il puntatore attorno al confine ──');
  console.log(px.join('\n'));
}
await p.screenshot({path:'audit/zoom-soglia.png', clip:{x:600,y:stato.bordo-14,width:700,height:30}});
console.log('ritaglio salvato: audit/zoom-soglia.png');
await b.close();
