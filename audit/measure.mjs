import { chromium } from 'playwright';
const EXE='C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const b=await chromium.launch({executablePath:EXE});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/portfolio.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1200);
const h=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<h;y+=800){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(120);}
await p.evaluate(()=>{document.body.classList.remove('loaded');document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in-view'))});
await p.waitForTimeout(400);

const out = await p.evaluate(() => {
  const R = e => { const r = e.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y+scrollY),w:Math.round(r.width),h:Math.round(r.height)} };
  const lum = c => { const [r,g,bl]=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4}); return 0.2126*r+0.7152*g+0.0722*bl };
  const ratio=(f,bg)=>{const a=lum(f),b=lum(bg);return +(((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)).toFixed(2))};
  const bgOf = e => { let n=e; while(n){const c=getComputedStyle(n).backgroundColor; if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; n=n.parentElement;} return 'rgb(0,0,0)' };

  // 1. hero overlap
  const copy=document.querySelector('.hero__copy'), atlas=document.querySelector('.hero__atlas'), tools=document.querySelector('.hero__capabilities')||document.querySelector('.hero__toolbelt');
  const overlap=(a,b)=>{if(!a||!b)return null;const A=a.getBoundingClientRect(),B=b.getBoundingClientRect();const ox=Math.min(A.right,B.right)-Math.max(A.left,B.left);const oy=Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top);return {ox:Math.round(ox),oy:Math.round(oy),overlapping:ox>0&&oy>0}};

  // 2. section openers
  const secs=[...document.querySelectorAll('main > section[id]')].map(s=>{
    const h2=s.querySelector('h1,h2'); const eyebrow=s.querySelector('.section-index,[class*=eyebrow],[class*=__head] > *');
    const cs=getComputedStyle(s);
    const lines = h2 ? [...h2.querySelectorAll('span,em')].map(x=>getComputedStyle(x).color) : [];
    return {id:s.id, padTop:cs.paddingTop, bg:cs.backgroundColor,
      h2:h2?h2.textContent.trim().replace(/\s+/g,' ').slice(0,60):null,
      h2size:h2?getComputedStyle(h2).fontSize:null,
      h2rect:h2?R(h2):null,
      accentLines:lines.filter(c=>/109, 168|110, 168|1[0-9][0-9], 1[6-9][0-9], 2[0-9][0-9]/.test(c)).length,
      lineColors:[...new Set(lines)],
      firstChildTop: s.firstElementChild? Math.round(s.firstElementChild.getBoundingClientRect().top - s.getBoundingClientRect().top):null};
  });

  // 3. contrast on key text
  const probes=['.hero__copy','.hero__eyebrow','.section-index','p','.muted'].flatMap(sel=>[...document.querySelectorAll(sel)].slice(0,3));
  const contrast=[...new Set(probes)].map(e=>({sel:e.className||e.tagName, color:getComputedStyle(e).color, bg:bgOf(e), size:getComputedStyle(e).fontSize, ratio:ratio(getComputedStyle(e).color,bgOf(e)), text:e.textContent.trim().slice(0,40)})).filter(x=>x.text);

  // 4. type scale in use
  const sizes={};
  document.querySelectorAll('main *').forEach(e=>{ if(e.children.length===0 && e.textContent.trim()){const s=getComputedStyle(e).fontSize; sizes[s]=(sizes[s]||0)+1;}});

  // 5. colors in use for text
  const colors={};
  document.querySelectorAll('main *').forEach(e=>{ if(e.children.length===0 && e.textContent.trim()){const c=getComputedStyle(e).color; colors[c]=(colors[c]||0)+1;}});

  return {heroOverlapCopyAtlas:overlap(copy,atlas), heroOverlapToolsAtlas:overlap(tools,atlas),
    heroCopy:copy?R(copy):null, heroAtlas:atlas?R(atlas):null,
    secs, contrast,
    typeScale:Object.entries(sizes).sort((a,b)=>b[1]-a[1]).slice(0,18),
    textColors:Object.entries(colors).sort((a,b)=>b[1]-a[1]).slice(0,12)};
});
console.log(JSON.stringify(out,null,1));
await b.close();
