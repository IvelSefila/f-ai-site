import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:686,height:749}});   /* identico al pannello */
await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
await p.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';
  const s=document.querySelector('#lavori'); scrollTo(0, s.getBoundingClientRect().top+scrollY-260);});
await p.waitForTimeout(1500);
console.log('scrollY:', await p.evaluate(()=>Math.round(scrollY)));
await p.screenshot({path:'audit/stessa-vista.png'});
/* conto i pixel chiari nella schermata, invece di fidarmi dell'occhio */
const chiari = await p.evaluate(()=>{
  /* campiono il colore calcolato lungo una colonna */
  const out=[];
  for(let y=20;y<innerHeight;y+=60){
    let n=document.elementFromPoint(343,y), bg='—';
    for(let k=n;k;k=k.parentElement){const c=getComputedStyle(k).backgroundColor;
      if(c&&!/rgba\(0, 0, 0, 0\)/.test(c)){bg=c;break;}}
    out.push(`${String(y).padStart(4)} ${bg}`);
  }
  return out;
});
console.log(chiari.join('\n'));
await b.close();
