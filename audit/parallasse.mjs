import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const err=[]; p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2200);

console.log('view() supportato dal browser di prova:',
  await p.evaluate(()=>CSS.supports('animation-timeline','view()')));

/* misuro lo spostamento reale di ogni strato rispetto alla pagina */
const R = await p.evaluate(async () => {
  const dorme=ms=>new Promise(r=>setTimeout(r,ms));
  const strati = {
    'visuale (bench__stage)':'#banchi .bench__stage',
    'numerone (::before)'   :'#lavori .sec__head',
    'marchio ART × AI'      :'.profilo__mark',
  };
  const out=[];
  for (const [nome,sel] of Object.entries(strati)){
    const e=document.querySelector(sel); if(!e){out.push({nome,stato:'assente'});continue;}
    const doc = e.getBoundingClientRect().top + scrollY;   /* posizione nel documento */
    /* due letture a 300px di scorrimento di distanza */
    scrollTo(0, doc - 700); await dorme(140);
    const a = e.getBoundingClientRect().top;
    scrollTo(0, doc - 400); await dorme(140);
    const c = e.getBoundingClientRect().top;
    const attesoSenzaParallasse = -300;      /* scorro 300 → sale di 300 */
    const reale = c - a;
    out.push({nome, spostamentoReale:Math.round(reale),
      seFermo:attesoSenzaParallasse, deriva:Math.round(reale-attesoSenzaParallasse)});
  }
  return out;
});
console.log('\n── quanto si muove ogni strato per 300px di scorrimento ──');
for (const x of R) console.log(x.stato ? `  ${x.nome}: ${x.stato}`
  : `  ${x.nome.padEnd(24)} ${String(x.spostamentoReale).padStart(5)}px  (senza parallasse ${x.seFermo}px)  →  deriva ${x.deriva>0?'+':''}${x.deriva}px`);

/* fotogrammi durante uno scorrimento continuo */
const fps = await p.evaluate(async () => {
  const dorme=ms=>new Promise(r=>setTimeout(r,ms));
  scrollTo(0,0); await dorme(300);
  let n=0, stop=false;
  const tic=()=>{ if(!stop){n++;requestAnimationFrame(tic);} }; requestAnimationFrame(tic);
  const t0=performance.now();
  for(let y=0;y<9000;y+=45){ scrollTo(0,y); await dorme(8); }
  const dt=performance.now()-t0; stop=true;
  return { fotogrammi:n, secondi:+(dt/1000).toFixed(2), fps:Math.round(n/(dt/1000)) };
});
console.log(`\n── scorrimento continuo di 9000px ──\n  ${fps.fotogrammi} fotogrammi in ${fps.secondi}s = ${fps.fps} fps  (swiftshader software, non GPU)`);
console.log('errori console:', err.length?err:0);
await b.close();
