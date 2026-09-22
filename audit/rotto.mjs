import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const err=[]; p.on('console',m=>m.type()==='error'&&err.push(m.text()));
p.on('pageerror',e=>err.push('PAGEERROR '+e.message));
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(3000);
/* NIENTE forzatura di .rv: guardo la pagina come la vede un umano */
console.log('errori:', err.length?err:0);
const R = await p.evaluate(()=>{
  const rv=[...document.querySelectorAll('.rv')];
  const vis=e=>{const c=getComputedStyle(e);return +c.opacity>.05};
  return {
    elementiRv: rv.length,
    rivelati: rv.filter(e=>e.classList.contains('in')).length,
    opachi: rv.filter(vis).length,
    hero: getComputedStyle(document.querySelector('.hero__content')).opacity,
    heroTranslate: getComputedStyle(document.querySelector('.hero__content')).translate,
    heroScale: getComputedStyle(document.querySelector('.hero__content')).scale,
    altezzaPagina: document.body.scrollHeight,
  };
});
console.log(JSON.stringify(R,null,1));
await p.screenshot({path:'audit/rotto-cima.png'});
await p.evaluate(()=>scrollTo(0,2600)); await p.waitForTimeout(900);
await p.screenshot({path:'audit/rotto-medio.png'});
await b.close();
