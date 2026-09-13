import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const err=[]; p.on('console',m=>m.type()==='error'&&err.push(m.text()));
p.on('pageerror',e=>err.push('PAGEERROR '+e.message));
await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
await p.waitForTimeout(2400);
const H=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(60);}
await p.evaluate(()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in')));
await p.waitForTimeout(400);

const IDS=['smeraldo','ciano','indaco','magenta','corallo','ambra','lime'];
const R = await p.evaluate(async IDS=>{
  const m = await import('./palette.js');
  const lin=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4};
  const L=([r,g,b])=>.2126*lin(r)+.7152*lin(g)+.0722*lin(b);
  /* Un colore calcolato con color-mix() il browser lo restituisce come
     "color(srgb 0.357 0.818 0.678)": numeri da zero a uno, non da zero a
     255. Letto alla vecchia maniera diventava quasi nero e il controllo
     diceva 1,05:1 su una scritta chiarissima. */
  const rgb=s=>{const n=(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
    return /^color\(/.test(s) ? n.map(v=>v*255) : n;};
  /* compone gli strati semitrasparenti invece di fermarsi al primo:
     un fondo al 14% non e' il fondo, e' un velo su quello che sta sotto */
  const sopra=(f,b,a)=>f.map((v,i)=>v*a+b[i]*(1-a));
  /* Un fondo scritto come sfumatura non ha backgroundColor: quella
     proprieta' resta trasparente e il colore sta in backgroundImage.
     Saltandolo, il controllo andava a cercare un fondo piu' su e sulle
     lastre dei tre casi misurava il bianco contro il bianco: 1,00:1 su
     testo che si legge benissimo. Di una sfumatura si prende la fermata
     peggiore, cioe' quella piu' vicina al colore della scritta. */
  const lum1=c=>{const f=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4};
    return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])};
  const fermate=cs=>{const im=cs.backgroundImage;
    if(!im||im==='none'||!/gradient/.test(im)) return null;
    return [...im.matchAll(/rgba?\(([^)]+)\)/g)]
      .map(x=>x[1].split(',').map(Number))
      .filter(p=>p.length<4||p[3]>=.999);};
  const fondo=(e,tinta)=>{
    const veli=[];
    for(let n=e;n;n=n.parentElement){
      const cs=getComputedStyle(n);
      const g=fermate(cs);
      if(g&&g.length){
        const lt=tinta?lum1(tinta):0;
        veli.push([g.slice().sort((a,b)=>Math.abs(lum1(a)-lt)-Math.abs(lum1(b)-lt))[0].slice(0,3),1]);
        break;
      }
      const c=cs.backgroundColor;
      if(!c||/rgba\(0, 0, 0, 0\)|transparent/.test(c)) continue;
      const parti=c.match(/[\d.]+/g).map(Number);
      const a=parti.length>3?parti[3]:1;
      veli.push([parti.slice(0,3),a]);
      if(a>=.999) break;
    }
    let base=rgb(getComputedStyle(document.body).backgroundColor);
    for(let i=veli.length-1;i>=0;i--) base=sopra(veli[i][0],base,veli[i][1]);
    return base};
  const out=[];
  for (const id of IDS){
    m.applica(id, false);
    await new Promise(r=>setTimeout(r,140));
    let peggio={r:99,chi:'',dove:''}, contati=0;
    for (const e of document.querySelectorAll('p,h1,h2,h3,li,span,a,button,dt,dd,label,output,summary,strong,b,em,i')){
      const t=(e.textContent||'').trim();
      if(!t) continue;
      /* Conta solo il testo che sta DENTRO questo elemento, non quello
         dei figli: un bottone che contiene solo un'etichetta colorata
         per conto suo non dipinge mai il proprio colore. Senza questa
         riga il bottone di una copertina veniva misurato con l'inchiostro
         della scheda contro il nero della vetrina: 1,07:1 su un bottone
         che di testo proprio non ne ha. */
      const mio=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      if(!mio) continue;
      const cs=getComputedStyle(e);
      if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<.5) continue;
      const rr=e.getBoundingClientRect(); if(rr.width<4||rr.height<4) continue;
      if(e.closest('#palPanel')) continue;
      /* sopra il canvas WebGL non c'e' un fondo CSS: il colore reale lo
         decide lo shader, e questa misura non puo' vederlo */
      if(e.closest('.hero')) continue;
      /* Le lastre dei tre casi hanno fondi a sfumatura: leggendole dal
         CSS si puo' solo prendere la fermata peggiore, che e' un modello
         pessimista — la scritta in alto a sinistra sta sul lime chiaro,
         non su quello cupo dell'angolo opposto. Li' la verita' la dice
         audit/contrasto-vero.mjs, che spegne il testo, fotografa la
         lastra e guarda il pixel vero sotto ogni parola, a due
         larghezze. E basta una palette: i tre casi non seguono la
         palette del sito, e union/eso/locanda.mjs lo verificano. */
      if(e.closest('.union__slab,.eso__slab,.locanda__slab')) continue;
      const f=rgb(cs.color), bg=fondo(e,f);
      const x=L(f),y=L(bg), q=(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
      const px=parseFloat(cs.fontSize);
      const grande = px>=24 || (px>=18.66 && +cs.fontWeight>=700);
      const soglia = grande?3:4.5;
      contati++;
      if(q<soglia && q<peggio.r){ peggio={r:q, chi:`${e.tagName.toLowerCase()} ${px}px "${t.slice(0,26)}"`,
        dove: e.closest('.sec--chiara')?'su carta':'su scuro'}; }
    }
    out.push({id, contati, peggiore: peggio.chi?`${peggio.r.toFixed(2)}:1 ${peggio.dove} — ${peggio.chi}`:null});
  }
  m.applica('smeraldo', false);
  return out;
}, IDS);

console.log('── contrasto di ogni testo, per ogni palette, sui due toni ──');
let ok=true;
for (const r of R){
  console.log(`  ${r.id.padEnd(9)} ${String(r.contati).padStart(4)} testi   ${r.peggiore?('✗ '+r.peggiore):'✓ nessuno sotto soglia'}`);
  if(r.peggiore) ok=false;
}
console.log(ok?'\n✓ tutte e sette le palette passano ovunque':'\n✗ qualcuna non passa');
console.log('errori:', err.length?err.slice(0,3):0);
await b.close();
