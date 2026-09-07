import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1400,height:900}});
const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2000);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
await p.evaluate(()=>document.querySelector('[data-vai="7"]').click());
await dorme(800);
console.log('── rispondo alle sei domande coi tasti ──');
for (const k of ['1','2','3','1','2','1']){
  await p.keyboard.press(k); await dorme(320);
}
const R = await p.evaluate(()=>({
  righe:[...document.querySelectorAll('#riepilogo li')].map(l=>l.textContent.trim()),
  ctaVisibile: !document.querySelector('#mandaBrief').hidden,
  mailto: document.querySelector('#mandaBrief').getAttribute('href').slice(0,74),
}));
console.log(R.righe.map(r=>'  '+r).join('\n'));
console.log('  tasto "manda il brief" visibile:', R.ctaVisibile);
console.log('  ' + R.mailto + '…');
await p.screenshot({path:'audit/torre-brief-fatto.png', clip:{x:0,y:0,width:800,height:520}});
/* azzero e controllo che riparta */
await p.evaluate(()=>document.querySelector('#azzeraBrief').click());
await dorme(600);
console.log('  dopo l\'azzeramento, risposte:',
  await p.evaluate(()=>document.querySelectorAll('#riepilogo li:not(.vuoto)').length));
console.log('errori:', err.length?err.slice(0,2):0);
await b.close();
