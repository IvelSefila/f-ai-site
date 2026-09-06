import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:860}});
const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
await p.waitForTimeout(2600);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
console.log('── tinta media del key visual, per palette ──');
console.log('   (se il motore segue, la tonalità deve spostarsi)');
for (const id of ['smeraldo','magenta','ambra','indaco']){
  const r = await p.evaluate(async id=>{
    const m=await import('./palette.js'); m.applica(id);
    await new Promise(r=>setTimeout(r,500));
    const cv=document.querySelector('#kvCanvas'), g=cv.getContext('2d');
    const d=g.getImageData(0,0,cv.width,cv.height).data;
    let R=0,G=0,B=0,n=0, sat=[0,0,0], best=-1;
    for(let i=0;i<d.length;i+=4*97){
      R+=d[i];G+=d[i+1];B+=d[i+2];n++;
      const s=Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]);
      if(s>best){best=s;sat=[d[i],d[i+1],d[i+2]];}
    }
    const media=[R/n,G/n,B/n].map(Math.round);
    const tinta=c=>{const [r,g,b]=c.map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b);
      if(mx===mn)return '—';
      let h; if(mx===r)h=((g-b)/(mx-mn))%6; else if(mx===g)h=(b-r)/(mx-mn)+2; else h=(r-g)/(mx-mn)+4;
      return Math.round(((h*60)+360)%360)+'°'};
    return {media:`rgb(${media.join(',')})`, tintaMedia:tinta(media),
      piuSaturo:`rgb(${sat.join(',')})`, tintaSatura:tinta(sat),
      accento:getComputedStyle(document.documentElement).getPropertyValue('--em').trim()};
  }, id);
  console.log(`  ${id.padEnd(9)} accento ${r.accento}  ·  media ${r.media.padEnd(20)} tinta ${r.tintaMedia.padStart(5)}  ·  più saturo tinta ${r.tintaSatura}`);
}
console.log('\nerrori:', err.length?err.slice(0,3):0);
await b.close();
