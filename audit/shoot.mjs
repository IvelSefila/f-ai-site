import { chromium } from 'playwright';

const URL = process.env.URL || 'http://localhost:8899/portfolio.html';
const OUT = 'audit/shots';

const freeze = () => {
  document.body.classList.remove('loaded');
  document.querySelectorAll('.reveal').forEach(e => { e.classList.add('in-view'); e.style.opacity = 1; e.style.transform = 'none'; });
  const st = document.createElement('style');
  st.textContent = '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}';
  document.head.appendChild(st);
};

async function shoot(name, width, height) {
  const browser = await chromium.launch({ executablePath: 'C:/Users/fabri/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  // scroll through to trigger content-visibility + reveal observers
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += height) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(180); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.evaluate(freeze);
  await page.waitForTimeout(400);
  const sections = await page.evaluate(() =>
    [...document.querySelectorAll('main > section[id]')].map(s => ({ id: s.id, top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.offsetHeight) })));
  for (const s of sections) {
    await page.evaluate(v => window.scrollTo(0, v), s.top);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${name}-${s.id}.png` });
    console.log(`${name}-${s.id}.png  top=${s.top} h=${s.h}`);
  }
  await browser.close();
}

await shoot('desk', 1440, 900);
if(!process.env.DESKONLY) await shoot('mob', 390, 844);
console.log('done');
