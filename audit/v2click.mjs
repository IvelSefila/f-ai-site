import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900}});
/* L'LCP lo misuro da fuori, con un osservatore registrato prima che la
   pagina parta, e lo leggo PRIMA di toccare qualsiasi cosa: e' il
   numero che vede chi apre la pagina e basta. Leggerlo dalla casella
   del dossier a fine giro rispondeva a un'altra domanda — "la cosa piu'
   grande incontrata in quattordici manovre" — e infatti oscillava fra
   236 e 3388 ms per la stessa pagina, sullo stesso commit. */
await p.addInitScript(() => {
  window.__lcp = 0;
  try {
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = Math.round(e.startTime); })
      .observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8899/v2/index.html?probe=1',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2500);

const lcpApertura = await p.evaluate(() => window.__lcp || 0);

const go=async id=>{await p.evaluate(i=>{const s=document.getElementById(i);scrollTo(0,s.getBoundingClientRect().top+scrollY-70)},id);await p.waitForTimeout(500);};

// hero: trascina il confine
const gl=await p.locator('#gl').boundingBox();
await p.mouse.move(gl.x+gl.width*.5,gl.y+gl.height*.5); await p.mouse.down();
await p.mouse.move(gl.x+gl.width*.75,gl.y+gl.height*.5,{steps:10}); await p.mouse.up();

await go('regia');
await p.locator('#mix').fill('78'); await p.waitForTimeout(300);
await p.locator('.phases button[data-phase="2"]').click(); await p.waitForTimeout(400);
await p.locator('#kvNew').click(); await p.waitForTimeout(300);

await go('lavori');
await p.locator('.work button').first().click(); await p.waitForTimeout(300);

await go('banchi');
await p.locator('#fmtIdea').fill('80'); await p.waitForTimeout(250);
await p.locator('#t-video').click(); await p.locator('#tlPace').fill('85'); await p.waitForTimeout(300);
await p.locator('#t-ai').click(); await p.locator('#grRun').click(); await p.waitForTimeout(3200);

await go('metodo'); await p.waitForTimeout(600);
for (const id of ['metodo','tecnologia']) await go(id);
await p.locator('.modes button[data-mode="2"]').click(); await p.waitForTimeout(300);
await go('laboratorio');
await p.click('#open-playlab'); await p.waitForTimeout(4200);
await p.evaluate(()=>document.getElementById('original-playlab').close()); await p.waitForTimeout(400);
await go('materia'); await p.waitForTimeout(3500);
await p.click('.modes button[data-mat="2"]'); await p.waitForTimeout(1200);
const mh=await p.locator('#matCanvas').boundingBox();
await p.mouse.move(mh.x+mh.width*.5,mh.y+mh.height*.5); await p.mouse.down();
await p.waitForTimeout(900); await p.mouse.up();
await go('verdetto'); await p.waitForTimeout(1600);

const d=await p.evaluate(()=>({
  durata:dsTime.textContent, prove:dsProofs.textContent, manovre:dsActions.textContent,
  mix:dsMix.textContent, fps:dsFps.textContent,
  verdetto:document.getElementById('dsVerdict').textContent,
  viste:[...document.querySelectorAll('#dsList li.seen')].length,
  lcp:mLcp.textContent, cls:mCls.textContent, inp:mInp.textContent, kb:mKb.textContent, req:mReq.textContent,
}));
console.log(JSON.stringify(d,null,1));
console.log(`LCP all'apertura: ${lcpApertura} ms`);
console.log('ERRORI:', errs.length? errs.slice(0,5):'nessuno');
await p.screenshot({path:'audit/v2shots/verdetto-pieno.jpg',type:'jpeg',quality:82});
await b.close();
