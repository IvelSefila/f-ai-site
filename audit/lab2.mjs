import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
p.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),r.url())});
await p.goto('http://localhost:8899/lab/hero-v2.html',{waitUntil:'networkidle'});
await p.waitForTimeout(4000);
console.log(JSON.stringify(await p.evaluate(()=>({
  t: document.getElementById('t').textContent,
  fps: document.getElementById('fps').textContent,
  h1lines: [...document.querySelectorAll('h1 span')].map(s=>{const r=s.getBoundingClientRect();return s.textContent+' → right '+Math.round(r.right)}),
  h1width: Math.round(document.querySelector('h1').getBoundingClientRect().width),
})),null,1));
await b.close();
