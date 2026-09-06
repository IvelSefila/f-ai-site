import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:820}});
const err=[]; p.on('console',m=>m.type()==='error'&&err.push(m.text()));
p.on('pageerror',e=>err.push('PAGEERROR '+e.message));
await p.goto('http://localhost:8899/?probe=1',{waitUntil:'networkidle'});
await p.waitForTimeout(3200);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));

/* faccio caricare anche la nuvola di punti */
await p.evaluate(()=>{document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));
  document.querySelector('#materia')?.scrollIntoView();});
await dorme(3000);
await p.evaluate(()=>scrollTo(0,0)); await dorme(1200);

const righe=[];
for (const id of ['smeraldo','magenta','ambra','indaco']){
  const r = await p.evaluate(async id=>{
    const m=await import('./palette.js'); m.applica(id);
    await new Promise(r=>setTimeout(r,700));
    /* leggo il pixel più saturo dal canvas WebGL dell'hero */
    const leggi = cv => {
      if(!cv || !cv.width) return 'assente';
      const g = cv.getContext('webgl2') || cv.getContext('webgl');
      if(!g) return 'no-gl';
      const w=Math.min(cv.width,700), h=Math.min(cv.height,500);
      const px=new Uint8Array(w*h*4);
      g.readPixels(0,0,w,h,g.RGBA,g.UNSIGNED_BYTE,px);
      let best=-1,out=[0,0,0];
      for(let i=0;i<px.length;i+=4*331){
        const [R,G,B]=[px[i],px[i+1],px[i+2]];
        const s=Math.max(R,G,B)-Math.min(R,G,B);
        if(s>best && R+G+B>90){best=s;out=[R,G,B];}
      }
      return `rgb(${out.join(',')})`;
    };
    return { css:getComputedStyle(document.documentElement).getPropertyValue('--em-vivo').trim(),
      hero:leggi(document.querySelector('#gl')),
      materia:leggi(document.querySelector('#matCanvas')) };
  }, id);
  righe.push(`  ${id.padEnd(9)} atteso ${r.css.padEnd(8)}  hero ${String(r.hero).padEnd(18)} nuvola ${r.materia}`);
}
console.log('── il colore entra anche negli shader? ──');
console.log(righe.join('\n'));
console.log('\nerrori:', err.length?err:0);
await b.close();
