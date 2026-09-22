import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:8899/v2/index.html',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2200);
const h=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(90);}
await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
await p.waitForTimeout(400);

const r = await p.evaluate(() => {
  const secs = [...document.querySelectorAll('main > section[id]')];
  const righe = secs.map(s => {
    const cs = getComputedStyle(s);
    const h2 = s.querySelector('h2');
    const eyebrow = s.querySelector('.eyebrow');
    const lede = s.querySelector('.sec__lede');
    const bench = s.querySelector('.bench');
    return {
      id: s.id,
      padTop: cs.paddingTop,
      fondo: cs.backgroundColor,
      h2px: h2 ? getComputedStyle(h2).fontSize : '—',
      h2righe: h2 ? h2.innerHTML.split(/<br\s*\/?>/i).length : 0,
      accento: h2 ? !!h2.querySelector('em') : false,
      eyebrow: !!eyebrow,
      lede: !!lede,
      /* la struttura del corpo: è la firma della sezione */
      impianto: bench ? (getComputedStyle(bench).gridTemplateColumns.split(' ').length === 2 ? 'bench 2 colonne' : 'bench 1 colonna')
              : s.querySelector('.deck') ? 'griglia card'
              : s.querySelector('.pipe') ? 'pipeline'
              : s.querySelector('.lab') ? 'griglia card'
              : s.querySelector('.dossier') ? 'dossier'
              : s.querySelector('.brief__shell') ? 'form'
              : s.querySelector('.profilo') ? 'due colonne testo'
              : s.querySelector('#gl') ? 'hero' : 'altro',
    };
  });
  const conta = (k) => righe.reduce((m, r) => (m[r[k]] = (m[r[k]] || 0) + 1, m), {});
  return { righe, impianti: conta('impianto'), padding: conta('padTop'), h2: conta('h2px'), fondi: conta('fondo') };
});

console.log('sez'.padEnd(13), 'pad'.padEnd(9), 'h2'.padEnd(7), 'righe', 'acc', 'eyeb', 'lede', 'impianto');
for (const x of r.righe) console.log(
  x.id.padEnd(13), x.padTop.padEnd(9), String(x.h2px).padEnd(7),
  String(x.h2righe).padEnd(5), (x.accento?'sì':'no').padEnd(3), (x.eyebrow?'sì':'no').padEnd(4),
  (x.lede?'sì':'no').padEnd(4), x.impianto);
console.log('\nimpianti:', JSON.stringify(r.impianti));
console.log('padding :', JSON.stringify(r.padding));
console.log('h2      :', JSON.stringify(r.h2));
console.log('fondi   :', JSON.stringify(r.fondi));
await b.close();
