import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const [w,h,tocco] of [[390,844,true],[1440,900,false]]){
  const p=await b.newPage({viewport:{width:w,height:h},isMobile:tocco,hasTouch:tocco});
  const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
  p.on('console',m=>m.type()==='error'&&err.push(m.text()));
  await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
  await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  await p.waitForTimeout(2000);
  const dorme=ms=>new Promise(r=>setTimeout(r,ms));

  const base = await p.evaluate(()=>({
    menu: document.querySelectorAll('nav button, .stanza').length,
    canvasPointer: getComputedStyle(document.querySelector('#schermo').parentElement).pointerEvents,
    snap: getComputedStyle(document.documentElement).scrollSnapType,
    pagine: document.querySelectorAll('.pagina').length,
    oriz: document.documentElement.scrollWidth-innerWidth,
  }));

  /* sfoglio come col dito e guardo se la stanza segue */
  const seq=[];
  for (const id of ['s-bilancia','s-scriptorium','s-forgia','s-alchimista']){
    await p.evaluate(i=>document.querySelector('#'+i).scrollIntoView({block:'center'}), id);
    await dorme(600);
    seq.push(await p.evaluate(()=>document.querySelector('#statoStanza').textContent.replace('Stanza ','')));
  }

  /* provo i comandi veri */
  await p.evaluate(()=>document.querySelector('#s-bilancia').scrollIntoView({block:'center'}));
  await dorme(400);
  await p.evaluate(()=>{const l=document.querySelector('#levaMix');
    l.value=80; l.dispatchEvent(new Event('input',{bubbles:true}));});
  await dorme(300);
  const leva = await p.evaluate(()=>document.querySelector('#levaVal').textContent);

  await p.evaluate(()=>document.querySelector('#s-alchimista').scrollIntoView({block:'center'}));
  await dorme(400);
  for (let k=0;k<6;k++){
    await p.evaluate(()=>document.querySelector('#risposteBrief button')?.click());
    await dorme(180);
  }
  const brief = await p.evaluate(()=>({
    risposte: document.querySelectorAll('#riepilogo li:not(.vuoto)').length,
    cta: !document.querySelector('#mandaBrief').hidden}));

  const piccoli = await p.evaluate(()=>{
    const out=[];
    document.querySelectorAll('a,button,input').forEach(e=>{
      const c=getComputedStyle(e); if(c.display==='none'||e.hidden)return;
      const r=e.getBoundingClientRect(); if(!r.width||!r.height)return;
      if(r.height<44) out.push(`${(e.textContent||e.id).trim().slice(0,16)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }); return out;});

  console.log(`${String(w).padStart(4)}px  menù da cliccare: ${base.menu} · aggancio: ${base.snap} · ${base.pagine} pagine · oriz ${base.oriz}`);
  console.log(`        il canvas ignora il dito: ${base.canvasPointer==='none'?'sì':'NO'}`);
  console.log(`        sfogliando: ${seq.join(' → ')}`);
  console.log(`        leva: ${leva} · brief: ${brief.risposte}/6 risposte, tasto invio ${brief.cta}`);
  console.log(`        sotto 44px: ${piccoli.length?piccoli.join(', '):'nessuno'}${err.length?'  ERRORI '+err[0]:''}`);
  if (w===390){ await p.evaluate(()=>scrollTo(0,0)); await dorme(900);
    await p.screenshot({path:'audit/una-pagina-telefono.png'}); }
  else { await p.evaluate(()=>document.querySelector('#s-bilancia').scrollIntoView({block:'center'})); await dorme(900);
    await p.screenshot({path:'audit/una-pagina-desktop.png'}); }
  await p.close();
}
await b.close();
