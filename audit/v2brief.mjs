import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:1000}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,180))});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2500);
await p.evaluate(()=>{const s=document.getElementById('brief');scrollTo(0,s.getBoundingClientRect().top+scrollY-60)});
await p.waitForTimeout(700);
console.log('passi:', await p.evaluate(()=>document.querySelectorAll('.brief-step').length));
console.log('contatore:', await p.evaluate(()=>document.getElementById('brief-counter')?.textContent));
await p.screenshot({path:'audit/v2shots/brief-1.jpg',type:'jpeg',quality:84});

/* compilo davvero le sei domande */
const passo = async (n) => {
  const st = await p.evaluate(()=>{const f=document.querySelector('.brief-step:not([hidden])');
    return {n:f?.dataset.step, legenda:f?.querySelector('legend')?.textContent.replace(/\s+/g,' ').trim()};});
  const scelte = await p.$$('.brief-step:not([hidden]) .brief-options input');
  if (scelte.length) await scelte[0].click();
  const campi = await p.$$('.brief-step:not([hidden]) .brief-fields input[type=text], .brief-step:not([hidden]) .brief-fields input:not([type])');
  for (const c of campi) await c.fill('Prova');
  const mail = await p.$('.brief-step:not([hidden]) input[type=email]');
  if (mail) await mail.fill('cliente@esempio.it');
  const consenso = await p.$('.brief-step:not([hidden]) .brief-consent input');
  if (consenso) await consenso.check();  // solo nel passo visibile
  console.log('  passo', st.n, '·', (st.legenda||'').slice(0,44));
  await p.click('#brief-next'); await p.waitForTimeout(500);
};
for (let k=0;k<6;k++) await passo(k);
await p.waitForTimeout(900);
const fine = await p.evaluate(()=>({
  riepilogoVisibile: !document.getElementById('brief-summary').hidden,
  righeRiepilogo: (document.getElementById('brief-copy')?.textContent||'').split('\n').filter(Boolean).length,
  /* Il tasto della posta e' tornato, adesso che un indirizzo c'e'.
     Si guarda che punti davvero a una casella e che si porti dietro il
     riepilogo: un mailto senza corpo sarebbe un tasto che apre una
     lettera vuota. */
  tastoPosta: (() => {
    const m = document.getElementById('brief-mail');
    if (!m || m.hidden) return 'MANCA';
    const h = m.getAttribute('href') || '';
    return /^mailto:[^?]+@/.test(h) && /[?&]body=.+/.test(h)
      ? 'porta a ' + h.slice(7, h.indexOf('?')) + ' col riepilogo dentro'
      : 'ROTTO: ' + h.slice(0, 60);
  })(),
  tastoCopia: (document.getElementById('brief-copy-button')?.textContent||'').trim(),
  errore: document.getElementById('brief-error')?.hidden ? 'nessuno' : document.getElementById('brief-error')?.textContent,
}));
console.log(JSON.stringify(fine,null,1));
await p.screenshot({path:'audit/v2shots/brief-riepilogo.jpg',type:'jpeg',quality:84});
console.log('errori:', errs.length? errs.slice(0,4):'nessuno');
await b.close();
