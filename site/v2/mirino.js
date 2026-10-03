/* ═══════════════════════════════════════════════════════════════
 * mirino.js — il cursore a mirino, in tutto il sito (solo con il mouse).
 * Segue il puntatore con inerzia, ruota, si stringe quando premi, si
 * allarga sui link, lascia una scia di scintille nel colore della palette.
 * Solo transform e opacita'; il ciclo si ferma quando il mouse sta fermo e non
 * ci sono scintille. Con "riduci movimento" niente rotazione ne' scintille.
 * Dove serve il cursore vero (campi di testo, video, finestre, iframe)
 * torna quello del browser e il mirino si nasconde.
 * ═══════════════════════════════════════════════════════════════ */

const NATIVI = 'input,textarea,select,video,iframe,dialog,[contenteditable="true"],[contenteditable=""]';
const LINK = 'a,button,summary,label,[role="button"],[data-cdi-attiva]';

const parti = [];
const stato = { tieni: false, dati: null };
let avviato = false;
let emettiSc = () => {};

/* usate anche dall'eroe: le scintille lungo il confine, l'etichetta e l'erosione */
export function emetti(x, y, n, forza) { emettiSc(x, y, n, forza); }
export function mirinoTieni(v) { stato.tieni = !!v; }
export function mirinoDati(testo) { stato.dati = testo || null; }
/* x del confine mano/macchina (px schermo): quando il mirino ci passa sopra si trasforma in una presa orizzontale */
export function mirinoConfine(x) { stato.confine = x == null ? null : x; }

export function initMirino() {
  if (avviato || !matchMedia('(pointer: fine)').matches) return;
  avviato = true;
  const ridotto = matchMedia('(prefers-reduced-motion: reduce)');

  const el = document.createElement('div');
  el.className = 'hero-cursore';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<svg viewBox="-48 -48 96 96" width="96" height="96">
      <g class="c-anello"><circle r="30" stroke-dasharray="3 8"/></g>
      <g class="c-archi"><path d="M-21 0A21 21 0 0 1 0 -21"/><path d="M21 0A21 21 0 0 1 0 21"/></g>
      <g class="c-angoli"><path d="M-40 -30V-40H-30M30 -40H40V-30M40 30V40H30M-30 40H-40V30"/></g>
      <g class="c-frecce"><path d="M-46 -10L-58 0L-46 10M46 -10L58 0L46 10"/><path d="M-36 0H-27M27 0H36"/></g>
      <path class="c-mirino" d="M-11 0H-4M4 0H11M0 -11V-4M0 4V11"/>
      <circle class="c-punto" r="1.8"/>
    </svg><span class="hero-cursore__dati mono"></span>`;
  document.body.append(el);
  const scia = document.createElement('canvas');
  scia.className = 'hero-scia';
  scia.setAttribute('aria-hidden', 'true');
  document.body.append(scia);
  const sctx = scia.getContext('2d');
  const anello = el.querySelector('.c-anello'), archi = el.querySelector('.c-archi'), angoli = el.querySelector('.c-angoli');
  const dati = el.querySelector('.hero-cursore__dati');

  let W = 0, H = 0;
  const misura = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    scia.width = W * dpr; scia.height = H * dpr;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  misura(); addEventListener('resize', misura);

  /* il colore delle scintille e' quello della palette/scena, riletto ogni mezzo secondo */
  let rgb = [108, 90, 230], ultimoColore = 0;
  const leggiColore = now => {
    if (now - ultimoColore < 500) return;
    ultimoColore = now;
    const cs = getComputedStyle(document.documentElement);
    const v = (cs.getPropertyValue('--scena-em') || cs.getPropertyValue('--em-vivo')).trim();
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (m) { const n = parseInt(m[1], 16); rgb = [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  };

  emettiSc = (x, y, n, forza) => {
    if (ridotto.matches) return;
    for (let i = 0; i < n && parti.length < 150; i++) {
      const a = Math.random() * 6.283, v = (.3 + Math.random()) * forza;
      parti.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0, vita: .5 + Math.random() * .7, s: 1 + Math.random() * 2.2 });
    }
  };

  const p = { x: -200, y: -200, tx: -200, ty: -200, a: 0, b: 0 };
  let sopra = false, nativo = false, giu = false, raf = 0, ultimo = 0, disegnato = false, ultimoDati = null;

  const aggiorna = now => {
    raf = requestAnimationFrame(aggiorna);
    const dt = Math.min((now - ultimo) / 1000 || .016, .05); ultimo = now;
    const k = 1 - Math.exp(-dt * 18);
    const ox = p.x, oy = p.y;
    p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
    const vel = Math.hypot(p.x - ox, p.y - oy) / Math.max(dt, .001);
    const fermo = ridotto.matches;

    el.classList.toggle('is-drag', giu);
    el.classList.toggle('is-hold', stato.tieni);
    p.a += (fermo ? 0 : 14 + Math.min(vel, 1600) * .03 + (giu ? 180 : 0) + (stato.tieni ? 260 : 0)) * dt;
    p.b -= (fermo ? 0 : 30 + (giu ? 240 : 0)) * dt;
    anello.setAttribute('transform', `rotate(${p.a.toFixed(1)})`);
    archi.setAttribute('transform', `rotate(${p.b.toFixed(1)})`);
    const link = el.classList.contains('is-link');
    const stringi = (giu ? .78 : link ? 1.14 : 1) + (stato.tieni ? Math.sin(now * .02) * .05 : 0);
    const presa = el.classList.contains('is-presa');
    angoli.setAttribute('transform', presa ? `scale(${(stringi * 1.45).toFixed(3)} ${(stringi * .62).toFixed(3)})` : `scale(${stringi.toFixed(3)})`);
    const sc = (giu ? .88 : 1) * (1 + Math.min(vel / 4000, .15));
    el.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
    if (stato.dati !== ultimoDati) { ultimoDati = stato.dati; dati.textContent = stato.dati || ''; }
    dati.style.display = stato.dati ? '' : 'none';

    if (!fermo && sopra && !nativo) {
      if (vel > 120) emettiSc(p.x, p.y, vel > 900 ? 3 : 1, 40 + vel * .04);
      if (stato.tieni) emettiSc(p.x, p.y, 2, 120);
    }
    if (parti.length || disegnato) {
      leggiColore(now);
      sctx.clearRect(0, 0, W, H);
      disegnato = parti.length > 0;
      sctx.globalCompositeOperation = 'lighter';
      for (let i = parti.length - 1; i >= 0; i--) {
        const q = parti[i];
        q.l += dt;
        if (q.l >= q.vita) { parti.splice(i, 1); continue; }
        q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .96; q.vy *= .96;
        const a = 1 - q.l / q.vita;
        sctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(a * a * .9).toFixed(3)})`;
        sctx.beginPath(); sctx.arc(q.x, q.y, q.s * (.4 + a * .6), 0, 6.283); sctx.fill();
      }
    }
    /* il ciclo si spegne quando il mouse e' fuori e non ci sono scintille */
    if (!sopra && !parti.length && !disegnato && Math.hypot(p.tx - p.x, p.ty - p.y) < .5) {
      cancelAnimationFrame(raf); raf = 0;
    }
  };
  const avvia = () => { if (!raf) { ultimo = performance.now(); raf = requestAnimationFrame(aggiorna); } };

  const guarda = e => {
    const t = e.target instanceof Element ? e.target : null;
    nativo = !!t && !!t.closest(NATIVI);
    const isLink = !!t && !nativo && !!t.closest(LINK);
    el.classList.toggle('on', sopra && !nativo);
    el.classList.toggle('is-link', isLink);
    const vicino = stato.confine != null && !!t && t.id === 'gl' && Math.abs(e.clientX - stato.confine) < 36;
    el.classList.toggle('is-presa', vicino);
    document.body.classList.toggle('mirino-on', sopra && !nativo);
  };
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (!sopra) { sopra = true; if (p.x < -100) { p.x = e.clientX; p.y = e.clientY; } }
    p.tx = e.clientX; p.ty = e.clientY;
    guarda(e);
    avvia();
  }, { passive: true });
  document.addEventListener('pointerover', e => { if (e.pointerType === 'mouse' && sopra) guarda(e); }, { passive: true });
  document.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    giu = true;
    if (!nativo) emettiSc(e.clientX, e.clientY, 26, 150);
    avvia();
  }, { passive: true });
  for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, () => { giu = false; });
  document.documentElement.addEventListener('mouseleave', () => {
    sopra = false;
    el.classList.remove('on', 'is-link', 'is-drag');
    document.body.classList.remove('mirino-on');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { parti.length = 0; sctx.clearRect(0, 0, W, H); } });
}
