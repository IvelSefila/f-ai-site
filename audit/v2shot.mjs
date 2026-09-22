import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
await p.goto('http://localhost:8899/v2/index.html?probe=1',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2500);
const ids=await p.evaluate(()=>[...document.querySelectorAll('main > section[id]')].map(s=>s.id));
for(const id of ids){
  await p.evaluate(i=>{const s=document.getElementById(i);window.scrollTo(0,s.getBoundingClientRect().top+scrollY-70);},id);
  await p.waitForTimeout(900);
  await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
  await p.waitForTimeout(400);
  await p.screenshot({path:`audit/v2shots/${id}.jpg`,type:'jpeg',quality:80});
  console.log(id);
}
// banchi: apro le altre schede
for (const [tab,name] of [['#t-video','video'],['#t-social','social'],['#t-ai','ai']]) {
  await p.evaluate(i=>{const s=document.getElementById('banchi');window.scrollTo(0,s.getBoundingClientRect().top+scrollY-70);},0);
  await p.click(tab); await p.waitForTimeout(700);
  if(name==='ai'){ await p.click('#grRun'); await p.waitForTimeout(2000); }
  await p.screenshot({path:`audit/v2shots/banco-${name}.jpg`,type:'jpeg',quality:80});
  console.log('banco',name);
}
await b.close();
