import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const w of [1280,686,390]){
  const p=await b.newPage({viewport:{width:w,height:820},isMobile:w<700,hasTouch:w<700});
  const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
  await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
  await p.waitForTimeout(2400);
  const R = await p.evaluate(()=>{
    const b=[...document.querySelectorAll('[data-pal-veloce]')];
    const vis=b.filter(x=>getComputedStyle(x).display!=='none');
    return {
      pallini: b.length,
      visibili: vis.length,
      colori: vis.map(x=>getComputedStyle(x,'::before').backgroundColor),
      bersaglio: vis[0]?(()=>{const r=vis[0].getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)})():'—',
      pallinoVisibile: vis[0]?getComputedStyle(vis[0],'::before').width:'—',
      barra: Math.round(document.querySelector('.bar').getBoundingClientRect().height),
      griglia: document.querySelectorAll('[data-gr]').length,
      segnato: b.filter(x=>x.getAttribute('aria-checked')==='true').map(x=>x.dataset.palVeloce).join(),
    };
  });
  /* provo a cliccare il secondo campione (o i tre punti se sono nascosti) */
  let esito='—';
  if (R.visibili>1){
    await p.evaluate(()=>[...document.querySelectorAll('[data-pal-veloce]')]
      .filter(x=>getComputedStyle(x).display!=='none')[1].click());
    await p.waitForTimeout(300);
    esito = await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--em').trim());
  } else {
    await p.evaluate(()=>document.querySelector('[data-pal-apri]').click());
    await p.waitForTimeout(400);
    esito = await p.evaluate(()=>document.querySelector('#palPanel[open]')?'pannello aperto':'NON si apre');
  }
  console.log(`${String(w).padStart(4)}px  barra ${R.barra}px · pallini ${R.visibili}/${R.pallini} visibili (${R.bersaglio}, cerchio ${R.pallinoVisibile}) · griglia su ${R.griglia} contenitori · attivo "${R.segnato}"`);
  console.log(`        colori: ${R.colori.join('  ')}`);
  console.log(`        click → ${esito}${err.length?'  ERRORI: '+err[0]:''}`);
  await p.close();
}
await b.close();
