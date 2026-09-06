import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2200);
const h=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(90);}
await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
await p.waitForTimeout(400);

const r = await p.evaluate(() => {
  const nome = e => (e.tagName + '.' + String(e.className).split(' ')[0]).slice(0, 30);
  /* 1 · aree di tocco sotto i 44px */
  const piccoli = [];
  document.querySelectorAll('a, button, input, summary, label, [role=tab]').forEach(e => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || !r.width) return;
    if (r.height < 44 || r.width < 44)
      piccoli.push(`${Math.round(r.width)}×${Math.round(r.height)} ${nome(e)} "${(e.textContent||'').trim().slice(0,20)}"`);
  });
  /* 2 · elementi che bloccano lo scorrimento al tocco */
  const bloccanti = [];
  document.querySelectorAll('canvas, [data-wipe], .mat-holder').forEach(e => {
    const ta = getComputedStyle(e).touchAction;
    const r = e.getBoundingClientRect();
    if (ta === 'none' && r.width > 100)
      bloccanti.push(`${nome(e)} · ${Math.round(r.width)}×${Math.round(r.height)} · touch-action:${ta}`);
  });
  /* 3 · navigazione disponibile su mobile? */
  const nav = document.querySelector('.bar__nav');
  const navVisibile = nav && getComputedStyle(nav).display !== 'none';
  /* 4 · quanto è lunga la pagina */
  const schermate = Math.round(document.body.scrollHeight / innerHeight);
  /* 5 · testo sotto 15px nel corpo */
  const minuto = [];
  document.querySelectorAll('main p, main li, main dd').forEach(e => {
    if (e.children.length) return;
    const s = parseFloat(getComputedStyle(e).fontSize);
    if (s < 14) minuto.push(s + 'px · ' + (e.textContent||'').trim().slice(0, 30));
  });
  return {
    tocchiPiccoli: piccoli.length, esempi: piccoli.slice(0, 12),
    bloccanti, navVisibile, schermate,
    altezza: document.body.scrollHeight,
    testoMinuto: minuto.length, esempiTesto: minuto.slice(0, 5),
    barraAltezza: Math.round(document.querySelector('.bar').getBoundingClientRect().height),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
