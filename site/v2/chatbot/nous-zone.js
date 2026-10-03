/* ═══════════════════════════════════════════════════════════════════
 * nous-zone.js — Nous commenta quello che il visitatore ha davanti.
 * Il sito e' diviso in "zone immaginarie": ogni scheda, figura, pezzo di lavoro o sezione e' una zona.
 * Dalla lettura a pixel (nous-vista.js) si prende l'elemento in primo piano, si risale alla sua zona e
 * se ne ricava un commento breve, scritto sul momento a partire dal contenuto reale della zona.
 * Tutto in locale: nessuna chiamata di rete.
 * ═══════════════════════════════════════════════════════════════════ */

const UNITA = 'article, .union__pezzo, .vetrina__caso, figure, li, details, [class*="card"], [class*="banco"], [id^="caso-"], section[id], footer[id]';
/* Le spiegazioni sono scritte a mano (nous-spiega.json): Nous non rilegge il testo a schermo, dice cos'e' quel pezzo. */
let SPIEGA = {};
fetch(new URL('./nous-spiega.json?v=20260928-217', import.meta.url)).then(r => r.ok ? r.json() : {}).then(j => { SPIEGA = j || {}; for (const k of Object.keys(SPIEGA)) { if (/-/.test(k) && !k.startsWith('sez:')) { const sp = k.replace(/-/g, ' '); if (!SPIEGA[sp]) SPIEGA[sp] = SPIEGA[k]; } } }).catch(() => {});
/* Tono scelto dal visitatore all'ingresso: col = colloquiale, tec = super tecnico, hal = IA impazzita */
const CAMPI = { col: ['spiega', 'breve'], tec: ['tecnico', 'breve_tecnico'], hal: ['hal', 'breve_hal'] };
export function tono() { try { const t = sessionStorage.getItem('nodo_tono'); return CAMPI[t] ? t : 'col'; } catch (e) { return 'col'; } }
export function impostaTono(t) { if (!CAMPI[t]) return; try { sessionStorage.setItem('nodo_tono', t); } catch (e) {} }
export function tonoScelto() { try { return !!CAMPI[sessionStorage.getItem('nodo_tono')]; } catch (e) { return false; } }
const testoTono = (voce, breve) => { if (!voce) return ''; const [lungo, corto] = CAMPI[tono()]; return (breve ? voce[corto] || voce.breve : voce[lungo] || voce.spiega) || ''; };
/* testo del suggerimento di sezione nel tono scelto (voce "sez:#id" in nous-spiega.json), con ripiego sul testo di base */
export function testoSezione(id, base) { const v = SPIEGA['sez:' + id]; const t = v && ({ col: v.colloquiale || v.spiega, tec: v.tecnico, hal: v.hal }[tono()]); return t || base; }
const norma = t => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase().replace(/[\s.!?…:;,]+$/, '');
/* cerca la voce giusta provando piu' chiavi: id, titolo, grassetto, id interno, testo breve della scheda, poi la sezione (piede, profilo) */
const trovaVoce = e => {
  /* scheda-cliente della vetrina: spiega che azienda e', non il lavoro svolto */
  if (e.matches?.('.vetrina__caso')) { const az = SPIEGA['az:' + (e.getAttribute('href') || '').replace('#', '')]; if (az) return az; }
  const cand = [e.dataset?.id, e.id, e.querySelector('h1,h2,h3,h4,summary,figcaption,dt')?.innerText, e.querySelector('b')?.innerText, e.querySelector('[data-id]')?.dataset.id, e.innerText && e.innerText.length <= 60 ? e.innerText : ''];
  for (const c of cand) { const v = c && SPIEGA[norma(c)]; if (v) return v; }
  const sez = e.closest('footer[id], section[id]')?.id;
  return sez === 'piede' || sez === 'profilo' ? SPIEGA[sez] : undefined;
};
const chiaveDi = e => (e.dataset?.id || e.id || pulisci(e.querySelector('h1,h2,h3,h4,summary,figcaption,dt')?.innerText || e.querySelector('b')?.innerText || e.querySelector('[data-id]')?.dataset.id || (pulisci(e.innerText).length <= 40 ? e.innerText : ''))).toLowerCase().replace(/[\s.!?…:;,]+$/, '');

const pulisci = t => String(t || '').replace(/\s+/g, ' ').trim();

const APERTURE = [
  t => `${t}.`,
  t => `Stai guardando: ${t}.`,
  t => `In questa parte: ${t}.`,
];

let ultimoGiro = -1;
const scegli = (v, chiave) => { let i = Math.abs([...String(chiave)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % v.length; if (i === ultimoGiro) i = (i + 1) % v.length; ultimoGiro = i; return v[i]; };

function fraseUtile(el) {
  const p = [...el.querySelectorAll('p, dd')].map(x => pulisci(x.textContent)).find(t => t.length > 30);
  if (!p) return '';
  const fine = p.search(/[.!?](\s|$)/);
  let f = fine > 25 ? p.slice(0, fine + 1) : p;
  if (f.length > 150) f = f.slice(0, 147).replace(/\s+\S*$/, '') + '…';
  return f;
}

/* Restituisce { key, testo, domanda } per l'elemento in primo piano, o null se non c'e' nulla da dire. */
export function commentoZona(vista, puntato = false) {
  const f = vista?.focus;
  if (!f?.el) return null;
  const zona = f.el.closest(UNITA);
  if (!zona) return null;
  /* un contenitore che ne racchiude altri (per esempio #lavori coi suoi casi) non e' una zona: il titolo sarebbe quello sbagliato */
  if (!puntato && zona.querySelector(':scope [id^="caso-"], :scope section[id]')) return null;
  let titolo = pulisci(zona.querySelector('h1,h2,h3,h4,summary,figcaption,dt')?.innerText || zona.querySelector('b')?.innerText || zona.getAttribute('aria-label') || f.testo || chiaveDi(zona));
  if (!titolo) return null;
  if (titolo === titolo.toUpperCase()) titolo = titolo.charAt(0) + titolo.slice(1).toLowerCase();
  const primaFrase = titolo.search(/[.!?](?=\S)|[.!?]\s/);
  if (primaFrase > 8 && primaFrase < titolo.length - 1) titolo = titolo.slice(0, primaFrase);
  /* due schede con video una accanto all'altra: un solo commento che le sintetizza entrambe */
  const visibile = e => { const r = e.getBoundingClientRect(); return r.width > 40 && Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) > r.height * 0.4; };
  const haMedia = e => e.querySelector('video, img, canvas, button.union__via');
  const riga = !puntato && zona.parentElement && haMedia(zona)
    ? [...zona.parentElement.children].filter(e => e === zona || (e.tagName === zona.tagName && haMedia(e) && visibile(e) && Math.abs(e.getBoundingClientRect().top - zona.getBoundingClientRect().top) < 60))
    : [zona];
  if (riga.length === 2 && !puntato && riga.every(e => e.querySelector('h1,h2,h3,h4'))) {
    const [sx, dx] = riga.sort((x, y) => x.getBoundingClientRect().left - y.getBoundingClientRect().left);
    const nome = e => pulisci(e.querySelector('h1,h2,h3,h4').innerText).replace(/[\s.!?…:;,]+$/, '');
    const bs = testoTono(trovaVoce(sx), true), bd = testoTono(trovaVoce(dx), true);
    if (!bs || !bd) { const sp = testoTono(trovaVoce(zona)); return sp ? { key: `zona:${vista.sezione?.id || ''}:${zona.dataset.id || chiaveDi(zona)}`, testo: sp, domanda: `Parlami di ${nome(zona)}` } : null; }
    const fin = t => t.replace(/[\s.]+$/, '');
    const testo = `Due video affiancati. «${nome(sx)}»: ${fin(bs)}. «${nome(dx)}»: ${fin(bd)}.`;
    return { key: `coppia:${sx.dataset.id || nome(sx)}|${dx.dataset.id || nome(dx)}`, testo, domanda: `Confrontami «${nome(sx)}» e «${nome(dx)}»` };
  }
  const nomeTitolo = titolo.replace(/[\s.!?…:;,]+$/, '').length > 48 ? titolo.slice(0, 45).replace(/\s+\S*$/, '') + '…' : titolo.replace(/[\s.!?…:;,]+$/, '');
  const sez = vista.sezione?.id || '';
  const key = `zona:${sez}:${zona.dataset.id || titolo.slice(0, 40)}`;
  const spiega = testoTono(trovaVoce(zona));
  if (!spiega) return null;
  const testo = spiega;
  return { key, testo: testo.slice(0, 330), domanda: `Parlami di ${nomeTitolo}` };
}

/* Su desktop si commenta cio' che il puntatore sta indicando: l'elemento sotto il mouse, non quello al centro dello schermo. */
const NO_UI = '.nodo-window,.nodo-fab,.nodo-hint,.nodo-tour-bubble,.nodo-guida,.nodo-vista,.cookie,.bar,.navdock,.navdock-apri,dialog';
export function commentoPunto(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el || el.closest(NO_UI)) return null;
  const sez = el.closest('[id^="caso-"], section[id], footer[id]');
  return commentoZona({ focus: { el, testo: pulisci(el.innerText || el.getAttribute('alt') || el.getAttribute('aria-label')), occupa: 10 }, sezione: { id: sez?.id || '' } }, true);
}
