import { chromium } from 'playwright';
const EXE='C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const W=1280, H=800;
const SECTIONS=['home','live-cut','lavori','servizi','metodo','ai-locale','profilo','brief','game','contact'];

async function shoot(tag, url){
  const b=await chromium.launch({executablePath:EXE});
  const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
  await p.goto(url,{waitUntil:'networkidle'});
  // lo scroll fluido del sito fa slittare i target: qui va disattivato
  await p.addStyleTag({content:'html{scroll-behavior:auto !important}'});
  await p.waitForTimeout(1500);
  const h=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<h;y+=H){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(150);}
  await p.evaluate(()=>{document.body.classList.remove('loaded');
    document.querySelectorAll('.reveal').forEach(e=>{e.classList.add('in-view');e.style.opacity=1;e.style.transform='none';});});
  await p.waitForTimeout(600);
  for(const id of SECTIONS){
    // ricalcola il target ogni volta: le altezze cambiano man mano che le sezioni si rendono
    const landed = await p.evaluate((sid)=>{
      const s=document.getElementById(sid); if(!s) return null;
      const top=Math.round(s.getBoundingClientRect().top+scrollY);
      window.scrollTo(0,top);
      return {want:top, got:Math.round(scrollY)};
    }, id);
    if(!landed){ console.log('  !', id, 'assente'); continue; }
    await p.waitForTimeout(400);
    const check = await p.evaluate((sid)=>{
      const s=document.getElementById(sid);
      const top=Math.round(s.getBoundingClientRect().top+scrollY);
      if(Math.abs(top-scrollY)>4) window.scrollTo(0,top);
      return {delta: Math.round(top-scrollY)};
    }, id);
    await p.waitForTimeout(350);
    const final = await p.evaluate((sid)=>{
      const s=document.getElementById(sid);
      return Math.round(s.getBoundingClientRect().top);
    }, id);
    await p.screenshot({path:`audit/ba/${tag}-${id}.jpg`, type:'jpeg', quality:74});
    console.log(`  ${tag}-${id}  offset dal bordo sezione: ${final}px`);
  }
  await b.close();
}
await shoot('prima','http://localhost:8898/public/portfolio.html');
await shoot('dopo','http://localhost:8899/portfolio.html');
