import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:8899/',{waitUntil:'networkidle'});
await p.waitForTimeout(2000);
const R = await p.evaluate(()=>[...document.querySelectorAll('main > section')].map(s=>{
  const c=getComputedStyle(s);
  const trasparente = /rgba\(0, 0, 0, 0\)/.test(c.backgroundColor);
  return `${s.classList.contains('sec--chiara')?'▓ chiaro':'█ scuro '} ${s.id.padEnd(12)} fondo ${c.backgroundColor.padEnd(22)} ${trasparente?'⚠ TRASPARENTE':'opaco'}  ${c.backgroundImage!=='none'?'+gradiente':''}`;
}));
console.log(R.join('\n'));
const c = await p.evaluate(()=>{const e=document.querySelector('#contatto');
  return e?`contatto: padre=${e.parentElement.tagName.toLowerCase()}, fondo=${getComputedStyle(e).backgroundColor}`:'assente'});
console.log(c);
await b.close();
