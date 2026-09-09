import { CONTENITORI } from './griglia.js?v=20260909-105737';

/* ═══════════════════════════════════════════════════════════════════
 * SPOSTA — lo stesso dito che sceglie il colore sposta anche il pezzo
 *
 * La pressione lunga apriva il pannello e basta. Ora fa due cose, e
 * quale delle due lo decide il dito dopo, come sulle icone del
 * telefono: dopo mezzo secondo il riquadro si stacca (una vibrazione,
 * si solleva). Se a quel punto muovi, lo stai trascinando; se lasci
 * senza muovere, si apre il pannello del colore come prima.
 *
 * Un riquadro si sposta solo dentro il suo gruppo — i lavori con i
 * lavori, i formati con i formati — perché quello è il gruppo che sta
 * sulle dodici colonne della griglia. Fuori di lì non c'è un posto
 * dove atterrare che voglia dire qualcosa.
 *
 * L'ordine si ricorda come si ricordano la palette e l'impaginazione:
 * in localStorage, per gruppo. Chi non può o non vuole trascinare —
 * tastiera, lettore di schermo, dita poco ferme — ha nel pannello due
 * frecce e un "rimetti come prima", che fanno esattamente la stessa
 * cosa passando dalle stesse funzioni.
 * ═══════════════════════════════════════════════════════════════════ */

const CHIAVE = 'fai-ordine';

/* ── nomi stabili ─────────────────────────────────────────────────
   L'ordine salvato deve ritrovare i suoi pezzi al carico dopo, quando
   il DOM è di nuovo quello di partenza. L'id di un pezzo è quindi la
   sua posizione ORIGINALE nel gruppo, assegnata una volta sola prima
   di rimescolare: quella non cambia mai, perché l'HTML esce sempre
   uguale dal server e le carte costruite a codice escono sempre dalla
   stessa lista nello stesso ordine.

   Il gruppo invece si chiama col suo id, o con le sue classi. Le
   classi però non bastano: i banchi sono quattro e tre di loro
   scrivono "bench bench--stretto". Ci aggiungo il posto che occupano
   fra gli omonimi, che è deterministico anche lui. */
function chiaveGruppo(el) {
  const base = el.id || String(el.className).trim().split(/\s+/).join('.');
  if (el.id) return base;
  const pari = [...document.querySelectorAll(el.tagName)]
    .filter(o => String(o.className).trim().split(/\s+/).join('.') === base);
  return pari.length > 1 ? `${base}#${pari.indexOf(el)}` : base;
}

const pezziDi = (c) => [...c.children].filter(e => e.nodeType === 1);

/* Il gruppo di un riquadro, e il pezzo che davvero si muove: non
   sempre sono la stessa cosa. Il dito può finire su una figura dentro
   la carta; a spostarsi è la carta, cioè il figlio diretto del
   gruppo. */
export function pezzoDi(box) {
  if (!box) return null;
  for (const [sel] of CONTENITORI) {
    const c = box.closest(sel);
    if (!c || c === box) continue;
    let p = box;
    while (p && p.parentElement !== c) p = p.parentElement;
    if (p && pezziDi(c).length > 1) return { gruppo: c, pezzo: p };
  }
  return null;
}

/* ── memoria ──────────────────────────────────────────────────────── */
function leggi() { try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}'); } catch { return {}; } }
function scrivi(m) { try { localStorage.setItem(CHIAVE, JSON.stringify(m)); } catch {} }

function ricorda(gruppo) {
  const m = leggi();
  const k = chiaveGruppo(gruppo);
  const ordine = pezziDi(gruppo).map(p => p.dataset.ordId);
  /* se è tornato quello di partenza non lascio traccia: così un
     domani in cui cambio l'HTML non trova una scelta che lo ingessa */
  const dipartenza = ordine.every((v, i) => +v === i);
  if (dipartenza) delete m[k]; else m[k] = ordine;
  scrivi(m);
}

export function ordineCambiato(gruppo) {
  return !!leggi()[chiaveGruppo(gruppo)];
}

export function rimetti(gruppo) {
  const pezzi = pezziDi(gruppo).sort((a, b) => +a.dataset.ordId - +b.dataset.ordId);
  conVolo(gruppo, () => pezzi.forEach(p => gruppo.appendChild(p)));
  ricorda(gruppo);
}

/* ── l'animazione del riassestamento ──────────────────────────────
   Senza, i vicini saltano di colpo nel posto nuovo e sembra un errore
   di disegno. È la tecnica FLIP: misuro dove sono, cambio il DOM,
   misuro dove sono finiti, li rimetto visivamente da dove venivano e
   li lascio scivolare. Costa due letture di geometria e nessun
   fotogramma calcolato a mano. */
function conVolo(gruppo, cambia) {
  const quieti = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pezzi = pezziDi(gruppo);
  const prima = quieti ? null : new Map(pezzi.map(p => [p, p.getBoundingClientRect()]));
  cambia();
  if (!prima) return;
  for (const p of pezziDi(gruppo)) {
    const a = prima.get(p); if (!a || p.dataset.ordPreso) continue;
    const b = p.getBoundingClientRect();
    const dx = a.left - b.left, dy = a.top - b.top;
    if (!dx && !dy) continue;
    p.style.transition = 'none';
    p.style.transform = `translate(${dx}px,${dy}px)`;
    requestAnimationFrame(() => {
      p.style.transition = 'transform .22s cubic-bezier(.2,.7,.3,1)';
      p.style.transform = '';
      setTimeout(() => { p.style.transition = ''; }, 260);
    });
  }
}

/* ── spostare di un posto (le frecce del pannello) ────────────────── */
export function spostaDi(pezzo, passo) {
  const g = pezzo.parentElement;
  const pezzi = pezziDi(g);
  const i = pezzi.indexOf(pezzo), j = i + passo;
  if (j < 0 || j >= pezzi.length) return false;
  conVolo(g, () => passo < 0 ? g.insertBefore(pezzo, pezzi[j])
                             : g.insertBefore(pezzo, pezzi[j].nextSibling));
  ricorda(g);
  return true;
}

/* ── il trascinamento ─────────────────────────────────────────────── */
let inCorso = null;

export function traTrascinando() { return !!inCorso; }

export function iniziaTrascino(pezzo, gruppo, e) {
  if (inCorso) return;
  const r = pezzo.getBoundingClientRect();
  /* In riga o in colonna? Va deciso ORA, con il pezzo ancora al suo
     posto: appena parte porta con se' una trasformazione, e la sua
     geometria non dice piu' dove il layout lo terrebbe. La stessa
     griglia a dodici colonne diventa una colonna sola sul telefono,
     quindi non basta guardare il preset: si guardano i vicini. */
  const inRiga = pezziDi(gruppo).some(p =>
    p !== pezzo && Math.abs(p.getBoundingClientRect().top - r.top) < r.height * .6);
  inCorso = {
    pezzo, gruppo, id: e.pointerId, inRiga,
    presaX: e.clientX - r.left, presaY: e.clientY - r.top,
    x: e.clientX, y: e.clientY, chiesto: false,
  };
  pezzo.dataset.ordPreso = '1';
  pezzo.classList.add('ord-preso');
  gruppo.classList.add('ord-gruppo');
  document.body.classList.add('ord-in-corso');
  try { pezzo.setPointerCapture(e.pointerId); } catch {}

  /* Su un telefono il dito che trascina farebbe anche scorrere la
     pagina. touch-action messo adesso non serve — il browser decide a
     inizio gesto — quindi tocca fermare il touchmove a mano. Si può,
     perché per staccare il pezzo il dito è rimasto fermo mezzo
     secondo: nessuno scorrimento è ancora partito. */
  addEventListener('touchmove', ferma, { passive: false });
  addEventListener('pointermove', muovi);
  addEventListener('pointerup', posa);
  addEventListener('pointercancel', posa);
  segui();
}

const ferma = (e) => e.preventDefault();

function muovi(e) {
  if (!inCorso || e.pointerId !== inCorso.id) return;
  inCorso.x = e.clientX; inCorso.y = e.clientY;
  if (inCorso.chiesto) return;
  inCorso.chiesto = true;
  requestAnimationFrame(segui);
}

function segui() {
  if (!inCorso) return;
  inCorso.chiesto = false;
  const { pezzo, gruppo, x, y, presaX, presaY, inRiga } = inCorso;

  /* dove finirebbe il pezzo se lo lasciassi qui */
  const vicini = pezziDi(gruppo).filter(p => p !== pezzo);
  for (const v of vicini) {
    const r = v.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
    /* in riga si guarda la metà sinistra/destra, in colonna sopra/sotto */
    const dopo = inRiga ? x > r.left + r.width / 2 : y > r.top + r.height / 2;
    const dove = dopo ? v.nextSibling : v;
    if (dove !== pezzo && dove !== pezzo.nextSibling)
      conVolo(gruppo, () => gruppo.insertBefore(pezzo, dove));
    break;
  }

  /* Il pezzo segue il dito senza uscire dal flusso: leggo dove lo
     mette il layout in questo istante — a trasformazione spenta — e
     lo sposto della differenza. Così quando il DOM cambia sotto, lui
     resta sotto il dito invece di saltare. */
  pezzo.style.transform = '';
  const r = pezzo.getBoundingClientRect();
  pezzo.style.transform = `translate(${x - presaX - r.left}px,${y - presaY - r.top}px)`;
}

function posa(e) {
  if (!inCorso || (e && e.pointerId !== inCorso.id)) return;
  const { pezzo, gruppo } = inCorso;
  removeEventListener('touchmove', ferma, { passive: false });
  removeEventListener('pointermove', muovi);
  removeEventListener('pointerup', posa);
  removeEventListener('pointercancel', posa);
  inCorso = null;

  delete pezzo.dataset.ordPreso;
  pezzo.classList.remove('ord-preso');
  gruppo.classList.remove('ord-gruppo');
  document.body.classList.remove('ord-in-corso');

  /* l'ultimo scivolamento: dal posto dove sta il dito a quello vero */
  const quieti = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (quieti) { pezzo.style.transform = ''; }
  else {
    pezzo.style.transition = 'transform .2s cubic-bezier(.2,.7,.3,1)';
    pezzo.style.transform = '';
    setTimeout(() => { pezzo.style.transition = ''; }, 240);
  }
  ricorda(gruppo);
  document.dispatchEvent(new CustomEvent('ordine', { detail: { gruppo, pezzo } }));
}

/* ── all'avvio: dare un nome ai pezzi, poi rimetterli come li aveva
      lasciati chi guarda ──────────────────────────────────────────── */
export function initOrdine() {
  for (const [sel] of CONTENITORI)
    document.querySelectorAll(sel).forEach(g =>
      pezziDi(g).forEach((p, i) => { p.dataset.ordId = i; }));

  const m = leggi();
  if (!Object.keys(m).length) return;
  for (const [sel] of CONTENITORI)
    document.querySelectorAll(sel).forEach(g => {
      const ordine = m[chiaveGruppo(g)];
      if (!Array.isArray(ordine)) return;
      const per = new Map(pezziDi(g).map(p => [p.dataset.ordId, p]));
      /* prima quelli che l'ordine nomina, poi gli eventuali nuovi:
         se un domani aggiungo una carta, compare in fondo invece di
         far sparire tutto */
      for (const id of ordine) { const p = per.get(String(id)); if (p) { g.appendChild(p); per.delete(String(id)); } }
      for (const p of per.values()) g.appendChild(p);
    });
}
