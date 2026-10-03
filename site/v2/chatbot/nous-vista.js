/* ═══════════════════════════════════════════════════════════════════
 * nous-vista.js — gli occhi di Nous.
 * Legge, al momento e a pixel, la parte di pagina che il visitatore ha davanti: non si basa sugli id delle sezioni ma
 * sugli elementi realmente visibili (titoli, testi, immagini, video, pulsanti), con il loro rettangolo in pixel,
 * quanta parte dello schermo occupano e quanto sono vicini al centro. Da questo ricava il punto "in primo piano"
 * (quello che con più probabilità si sta guardando) e una descrizione in italiano.
 * Tutto in locale: non legge niente al di fuori della pagina e non manda niente in rete. La descrizione viene
 * allegata a una domanda solo quando il visitatore chiede di ciò che vede.
 * ═══════════════════════════════════════════════════════════════════ */

/* cosa non conta come "contenuto del sito": l'interfaccia di Nous, le barre fisse, gli avvisi, il cursore */
const ESCLUDI = '#gl,.nodo-window,.nodo-fab,.nodo-hint,.nodo-tour-bubble,.nodo-guida,.nodo-vista,.cookie,.bar,.navdock,.navdock-apri,.hero-cursore,.hero-scia,#palPanel,dialog,[hidden],[inert],[aria-hidden="true"]';
const BLOCCHI = 'h1,h2,h3,h4,p,li,figure,img,video,canvas,button,a,label,summary,dt,dd,[role="slider"],.eso__360-stage,.vetrina__caso';

const NOMI_SEZIONE = {
  top: "l'inizio del sito (header)",
  come: 'le istruzioni del sito',
  banchi: 'i servizi',
  lavori: 'i lavori',
  'caso-union': 'Union Energia',
  'caso-eso': 'Human Robots, l’esoscheletro',
  'caso-cest': 'Studio CETS',
  'caso-locanda': 'La Locanda del Castello',
  'caso-cdi': 'CDI Infissi',
  strumenti: 'gli strumenti',
  profilo: 'il profilo',
  contatto: 'il contatto',
  brief: 'il modulo del brief',
  piede: 'il piè di pagina',
};

const TIPO = {
  h1: 'titolo', h2: 'titolo', h3: 'sottotitolo', h4: 'sottotitolo', p: 'testo', li: 'voce di elenco', img: 'immagine',
  video: 'video', canvas: 'grafica animata', button: 'pulsante', a: 'link', figure: 'figura', label: 'campo', summary: 'voce che si apre',
  dt: 'etichetta', dd: 'dettaglio',
};

const pulisci = (t, max = 120) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, max);

function etichetta(el) {
  const tag = el.tagName.toLowerCase();
  if (el.id === 'gl') return "sfondo dell'header: la stessa scena in due versioni, da trascinare";
  if (el.classList.contains('eso__360-stage')) return 'il dispositivo a 360 gradi, che si gira trascinandolo';
  if (tag === 'img') return pulisci(el.getAttribute('alt') || el.getAttribute('aria-label') || '');
  if (tag === 'video') return pulisci(el.getAttribute('aria-label') || el.getAttribute('title') || el.closest('figure')?.querySelector('figcaption')?.textContent || 'video');
  if (tag === 'canvas') return pulisci(el.getAttribute('aria-label') || el.closest('figure')?.querySelector('figcaption')?.textContent || 'grafica animata');
  return pulisci(el.getAttribute('aria-label') || el.innerText || el.textContent);
}

function sezioneDi(el) {
  const s = el.closest('section[id], [id^="caso-"], footer[id]') || el.closest('section');
  if (!s) return { id: '', nome: '' };
  const id = s.id || '';
  if (NOMI_SEZIONE[id]) return { id, nome: NOMI_SEZIONE[id] };
  const tit = s.querySelector('h2, h3');
  return { id, nome: pulisci(tit ? tit.textContent : id, 80) };
}

/* Legge la vista attuale. Restituisce anche i rettangoli in pixel CSS (con lo scorrimento già tolto). */
export function leggiVista() {
  const W = innerWidth, H = innerHeight;
  const docH = Math.max(document.documentElement.scrollHeight, 1);
  const scrollPct = Math.round((scrollY / Math.max(1, docH - H)) * 100);

  let candidati = [];
  for (const el of document.querySelectorAll(BLOCCHI)) {
    if (el.closest(ESCLUDI)) continue;
    const r = el.getBoundingClientRect();
    const x0 = Math.max(0, r.left), y0 = Math.max(0, r.top), x1 = Math.min(W, r.right), y1 = Math.min(H, r.bottom);
    const w = x1 - x0, h = y1 - y0;
    if (w < 8 || h < 8) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.2) continue;
    const testo = etichetta(el);
    const tag = el.tagName.toLowerCase();
    const senzaTesto = !testo && tag !== 'img' && tag !== 'video' && tag !== 'canvas' && !el.classList.contains('eso__360-stage');
    if (senzaTesto) continue;
    candidati.push({ el, tag, testo, x: Math.round(x0), y: Math.round(y0), w: Math.round(w), h: Math.round(h), area: w * h, intero: r.top >= 0 && r.bottom <= H });
  }
  /* si tengono gli elementi piu' interni: un <li> che contiene un <p> conta come il <p> */
  candidati = candidati.filter(c => !candidati.some(o => o !== c && c.el.contains(o.el)));

  const cy = H / 2;
  for (const c of candidati) {
    const dy = ((c.y + c.h / 2) - cy) / cy, dx = ((c.x + c.w / 2) - W / 2) / (W / 2);
    const dist = Math.min(1, Math.hypot(dx, dy));
    const peso = /^h[1-3]$/.test(c.tag) ? 1.6 : (c.tag === 'img' || c.tag === 'video' || c.tag === 'canvas') ? 1.3 : (c.tag === 'button' || c.tag === 'a') ? 0.45 : 1;
    c.punteggio = c.area * (1 - dist * 0.8) * peso;
    c.occupa = Math.round((c.area / (W * H)) * 100);
    c.sezione = sezioneDi(c.el);
  }
  candidati.sort((a, b) => b.punteggio - a.punteggio);
  const principali = candidati.slice(0, 8);
  const focus = principali[0] || null;

  /* cosa c'e' esattamente al centro dello schermo */
  let alCentro = null;
  const puntoEl = document.elementFromPoint(W / 2, H / 2);
  if (puntoEl && !puntoEl.closest(ESCLUDI)) {
    alCentro = candidati.find(c => c.el === puntoEl || c.el.contains(puntoEl) || puntoEl.contains(c.el)) || null;
  }
  const inOrdine = [...principali].sort((a, b) => a.y - b.y);
  const sezione = (alCentro?.sezione || focus?.sezione || { id: '', nome: '' });

  const nomeDi = c => `${c.tag === 'img' || c.tag === 'video' || c.tag === 'canvas' ? '' : ''}${TIPO[c.tag] || 'elemento'} «${c.testo || '(senza testo)'}»`;
  const righe = [];
  righe.push(`VISTA ATTUALE DEL VISITATORE (letta dalla pagina, schermo ${W}x${H} pixel, scorrimento al ${scrollPct}% della pagina).`);
  righe.push(`Sezione in vista: ${sezione.nome || 'non riconosciuta'}.`);
  if (alCentro || focus) {
    const c = alCentro || focus;
    righe.push(`Al centro dello schermo: ${nomeDi(c)}, a ${c.x},${c.y} pixel, grande ${c.w}x${c.h} (${c.occupa}% dello schermo).`);
  }
  const altri = inOrdine.filter(c => c !== (alCentro || focus)).slice(0, 6).map(c => `${nomeDi(c)} (${c.occupa}%)`);
  if (altri.length) righe.push(`Altri elementi visibili, dall'alto: ${altri.join('; ')}.`);
  let descrizione = righe.join(' ');
  if (descrizione.length > 690) descrizione = descrizione.slice(0, 687) + '...';

  const cuore = alCentro || focus;
  const rispostaLocale = cuore
    ? `In questo momento stai guardando ${sezione.nome ? '**' + sezione.nome + '**' : 'una parte del sito'}. Al centro dello schermo c'è ${TIPO[cuore.tag] || 'un elemento'}: «${cuore.testo || '(senza testo)'}».` +
      (altri.length ? `\n\nInsieme vedi anche: ${altri.slice(0, 3).join('; ')}.` : '') +
      `\n\nSe vuoi ti racconto meglio questa parte, oppure ti dico cosa c'è subito dopo.`
    : 'In questo momento non vedo contenuti particolari sullo schermo. Scorri un po’ e dimmi cosa ti interessa.';

  return {
    schermo: { w: W, h: H, dpr: Math.round((devicePixelRatio || 1) * 100) / 100 },
    scrollPct,
    sezione,
    focus: cuore ? { el: cuore.el, tipo: TIPO[cuore.tag] || cuore.tag, testo: cuore.testo, x: cuore.x, y: cuore.y, w: cuore.w, h: cuore.h, occupa: cuore.occupa } : null,
    elementi: principali.map(c => ({ tipo: TIPO[c.tag] || c.tag, testo: c.testo, x: c.x, y: c.y, w: c.w, h: c.h, occupa: c.occupa, focus: c === cuore })),
    descrizione,
    rispostaLocale,
  };
}

/* Mostra per qualche secondo cosa vede Nous: rettangoli in pixel sugli elementi e un mirino al centro dello schermo. */
let overlay = null, timer = 0;
export function mostraVista(vista, ms = 8000) {
  nascondiVista();
  const v = vista || leggiVista();
  overlay = document.createElement('div');
  overlay.className = 'nodo-vista';
  overlay.setAttribute('aria-hidden', 'true');
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  overlay.innerHTML = v.elementi.map((e, i) =>
    `<div class="nodo-vista__r${e.focus ? ' is-focus' : ''}" style="left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px">
       <span>${i + 1} · ${esc(e.tipo)} ${esc((e.testo || '').slice(0, 26))} · ${e.x},${e.y} ${e.w}×${e.h}</span></div>`).join('') +
    `<div class="nodo-vista__mirino" style="left:${v.schermo.w / 2}px;top:${v.schermo.h / 2}px"></div>`;
  document.body.appendChild(overlay);
  timer = setTimeout(nascondiVista, ms);
}
export function nascondiVista() {
  clearTimeout(timer);
  overlay?.remove();
  overlay = null;
}
