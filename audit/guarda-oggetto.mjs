/* Fotografa un oggetto nel mezzo della sua animazione: quando un
   numero dice "non cambia niente" la cosa da fare e' guardare.
   uso: node audit/guarda-oggetto.mjs stanza tx ty attesa nome */
import { chromium } from 'playwright';
const [stanza, tx, ty, attesa, nome] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('ERRORE', String(e)));
p.on('console', m => m.type() === 'error' && console.log('console', m.text()));
await p.goto('http://localhost:8899/pixel/index.html', { waitUntil: 'networkidle' });
await p.evaluate(id => document.querySelector('#s-' + id).scrollIntoView(), stanza);
await p.waitForTimeout(900);
const dentro = await p.evaluate(() => window.__stanzaViva ?? null);
const tel = await p.locator('.telaio').boundingBox();
await p.screenshot({ path: `audit/guarda-${nome}-prima.png`, clip: tel });
await p.mouse.click(tel.x + tel.width * +tx / 320, tel.y + tel.height * +ty / 180);
await p.waitForTimeout(+attesa);
await p.screenshot({ path: `audit/guarda-${nome}.png`, clip: tel });
console.log('scattato', nome, 'stanza viva:', dentro);
await b.close();
