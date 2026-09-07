import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1400,height:900}});
const err=[]; p.on('pageerror',e=>err.push((e.stack||e.message).split('\n')[0]));
p.on('console',m=>m.type()==='error'&&err.push(m.text()));
await p.goto('http://localhost:8899/pixel/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2000);
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
/* Da quando la torre e' una pagina sola non c'e' piu' un menu' da
   cliccare: alla stanza dell'alchimista ci si arriva scorrendo. Questa
   riga cercava ancora [data-vai="7"] e la prova andava in errore. */
await p.evaluate(()=>document.querySelector('#s-alchimista').scrollIntoView());
await dorme(800);
/* Le scorciatoie a numero non ci sono piu' dalla riscrittura a pagina
   sola: si risponde toccando, e da tastiera con Tab e Invio, perche'
   le risposte sono bottoni veri. Qui li premo. */
console.log('── rispondo alle sei domande ──');
for (let i = 0; i < 6; i++){
  const tasti = p.locator('#risposteBrief .tasto');
  if (!await tasti.count()) break;
  await tasti.nth(i % await tasti.count()).click();
  await dorme(260);
}
const R = await p.evaluate(()=>({
  righe:[...document.querySelectorAll('#riepilogo li')].map(l=>l.textContent.trim()),
  ctaVisibile: !document.querySelector('#mandaBrief').hidden,
  /* non c'e' piu' un indirizzo: il brief si copia, e il tasto e' un
     bottone senza href */
  etichetta: document.querySelector('#mandaBrief').textContent.trim(),
}));
console.log(R.righe.map(r=>'  '+r).join('\n'));
console.log('  tasto "manda il brief" visibile:', R.ctaVisibile);
console.log('  dice:', R.etichetta);
await p.screenshot({path:'audit/torre-brief-fatto.png', clip:{x:0,y:0,width:800,height:520}});
/* azzero e controllo che riparta */
await p.evaluate(()=>document.querySelector('#azzeraBrief').click());
await dorme(600);
console.log('  dopo l\'azzeramento, risposte:',
  await p.evaluate(()=>document.querySelectorAll('#riepilogo li:not(.vuoto)').length));
console.log('errori:', err.length?err.slice(0,2):0);
await b.close();
