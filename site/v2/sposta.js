/* ═══════════════════════════════════════════════════════════════════
 * SPOSTA — lo stesso dito che sceglie il colore sposta anche il pezzo
 *
 * La pressione lunga apriva il pannello e basta. Ora fa due cose, e
 * quale delle due lo decide il dito dopo, come sulle icone del
 * telefono: dopo mezzo secondo il pezzo si stacca (una vibrazione, si
 * solleva). Se a quel punto muovi, lo stai trascinando; se lasci senza
 * muovere, si apre il pannello del colore come prima.
 *
 * Si muove tutto: le carte dentro i loro gruppi, i due lati di un
 * banco, i passi del metodo, i gruppi di strumenti, e le sezioni
 * dell'intera pagina.
 *
 * ── MA NON DOVUNQUE ───────────────────────────────────────────────
 * Poter spostare tutto e poter rovinare tutto sarebbero la stessa cosa
 * senza delle regole, e queste sono lette dal foglio di stile, non
 * decise a gusto:
 *
 *  · Chiaro e scuro si alternano. Dalla seconda sezione in poi la
 *    pagina alterna carta e fondo scuro, e la cucitura fra i blocchi —
 *    il blocco che sale di 44px sul precedente, angoli arrotondati,
 *    ombra — e' scritta con `.sec--chiara + .sec`: due blocchi chiari
 *    di fila fanno una scheda che scivola sopra un'altra dello stesso
 *    colore, cioe' un solco in mezzo al nulla. Quindi una sezione puo'
 *    solo SCAMBIARSI con una del suo stesso tono. Mentre la si
 *    trascina, le altre si vedono spente: il rifiuto si vede prima di
 *    sbagliare, non dopo.
 *
 *  · L'apertura resta prima e il contatto resta ultimo. Sono i due capi
 *    del racconto, e l'apertura per giunta non e' una sezione come le
 *    altre.
 *
 *  · I numeri seguono. "01 02 03" sulle carte, "Prova 04" negli
 *    occhielli, il numerone dietro i titoli e i numeri della testata si
 *    riscrivono dopo ogni spostamento. Senza, la prima cosa che si vede
 *    dopo aver mosso una carta e' un 02 prima di un 01.
 *
 *  · Il banco che si specchia. Le due colonne di un banco sono 1,42fr e
 *    0,58fr: scambiando la scena col pannello, il canvas finirebbe in
 *    300px e il testo largo il doppio. Quando i due si scambiano si
 *    scambiano anche le colonne, e il banco viene specchiato invece che
 *    storto.
 *
 * ── LE SEZIONI SI SPOSTANO DA UNA MAPPA ───────────────────────────
 * Una sezione e' alta fra 500 e 4800 px: trascinarla mentre e' aperta
 * non si puo' fare ne' su un telefono ne' su un monitor. Appena una
 * sezione si stacca, la pagina si richiude in una mappa — una banda per
 * sezione, col suo numero, il suo nome e il suo tono — che sta tutta in
 * uno schermo di telefono. Si sposta la banda, si lascia, la pagina si
 * riapre dov'e' finita.
 * ═══════════════════════════════════════════════════════════════════ */

const CHIAVE = 'fai-ordine';

/* ── i gruppi di pezzi intercambiabili ────────────────────────────
   `numeri` e' il selettore del pezzo di testo che porta il numero
   stampato: dopo ogni spostamento le cifre iniziali si riscrivono con
   la posizione, e l'etichetta accanto resta com'e'. */
export const GRUPPI = [
  ['.deck',          { numeri: '.work__meta b' }],
  ['.offerta__grid', { numeri: 'span.mono' }],
  ['.lab',           { numeri: 'span.mono' }],
  ['.formats',       {}],
  ['.pipe',          { numeri: 'b.mono' }],
  ['.istruzioni',    { numeri: 'b.mono' }],
  ['.appmie__grid',  { numeri: 'span.mono' }],
  ['.union__lavori', {}],
  ['.eso__lavori', {}],
  ['.locanda__lavori', {}],
  ['.stack__grid',   {}],
  ['.bench',         { specchio: true }],
];

/* i nomi con cui le sezioni compaiono nella mappa */
const NOMI = {
  top: 'Apertura', regia: 'Control room', lavori: 'Lavori', banchi: 'Servizi',
  come: 'Istruzioni', metodo: 'Metodo', tecnologia: 'Tecnologia', laboratorio: 'Playlab',
  materia: 'Materia', profilo: 'Profilo', verdetto: 'Verdetto',
  brief: 'Brief', contatto: 'Contatto',
};
/* i due capi del racconto non si spostano */
const FISSE = ['top', 'contatto'];

const pezziDi = (c) => [...c.children].filter(e => e.nodeType === 1);
const pagina = () => document.getElementById('main');
const sezioni = () => (pagina() ? pezziDi(pagina()).filter(s => s.tagName === 'SECTION') : []);
const tonoDi = (s) => s.classList.contains('sec--chiara') ? 'chiara' : 'scura';
const fissa = (s) => FISSE.includes(s.id);
const due = (n) => String(n).padStart(2, '0');
/* translate3d e non translate: chiede al browser un piano di
   composizione suo, cosi' muovere il pezzo non ridisegna la pagina */
const TRAS = (x, y) => 'translate3d(' + x + 'px,' + y + 'px,0)';

/* ── nomi stabili ─────────────────────────────────────────────────
   L'ordine salvato deve ritrovare i suoi pezzi al carico dopo, quando
   il DOM e' di nuovo quello di partenza. Il nome di un pezzo e' quindi
   la sua posizione ORIGINALE nel gruppo, assegnata una volta sola prima
   di rimescolare: quella non cambia mai, perche' l'HTML esce sempre
   uguale dal server e le carte costruite a codice escono sempre dalla
   stessa lista nello stesso ordine.

   Il gruppo invece si chiama col suo id, o con le sue classi. Le classi
   pero' non bastano: i banchi sono quattro e tre di loro scrivono
   "bench bench--stretto". Ci aggiungo il posto che occupano fra gli
   omonimi, che e' deterministico anche lui. */
function chiaveGruppo(el) {
  if (el === pagina()) return 'main';
  const base = el.id || String(el.className).trim().split(/\s+/).join('.');
  if (el.id) return base;
  const pari = [...document.querySelectorAll(el.tagName)]
    .filter(o => String(o.className).trim().split(/\s+/).join('.') === base);
  return pari.length > 1 ? `${base}#${pari.indexOf(el)}` : base;
}

/* ── cosa c'e' sotto il dito ──────────────────────────────────────
   Un gruppo prima di tutto: se il dito e' su una carta si muove la
   carta, non la sezione che la contiene. La sezione e' quello che resta
   — l'intestazione, il testo, i margini. */
export function bersaglioDi(box) {
  if (!box) return null;
  for (const [sel, regole] of GRUPPI) {
    const c = box.closest(sel);
    if (!c || c === box) continue;
    let p = box;
    while (p && p.parentElement !== c) p = p.parentElement;
    if (p && pezziDi(c).length > 1)
      return { tipo: 'gruppo', gruppo: c, pezzo: p, regole };
  }
  const s = box.closest('main > section');
  if (s && !fissa(s)) return { tipo: 'sezione', gruppo: pagina(), pezzo: s, regole: {} };
  return null;
}

/* chi puo' ricevere questo pezzo */
function ammessi(b) {
  if (b.tipo !== 'sezione') return () => true;
  const t = tonoDi(b.pezzo);
  return (v) => v.tagName === 'SECTION' && !fissa(v) && tonoDi(v) === t;
}

/* ── memoria ──────────────────────────────────────────────────────── */
function leggi() { try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}'); } catch { return {}; } }
function scrivi(m) { try { localStorage.setItem(CHIAVE, JSON.stringify(m)); } catch {} }

function ricorda(gruppo) {
  const m = leggi();
  const k = chiaveGruppo(gruppo);
  const ordine = pezziDi(gruppo).filter(p => p.dataset.ordId != null).map(p => p.dataset.ordId);
  /* se e' tornato quello di partenza non lascio traccia: cosi' un
     domani in cui cambio l'HTML non trova una scelta che lo ingessa */
  if (ordine.every((v, i) => +v === i)) delete m[k]; else m[k] = ordine;
  scrivi(m);
  rifinisci(gruppo);
}

export function ordineCambiato(gruppo) { return !!leggi()[chiaveGruppo(gruppo)]; }

export function rimetti(gruppo) {
  const pezzi = pezziDi(gruppo).filter(p => p.dataset.ordId != null)
    .sort((a, b) => +a.dataset.ordId - +b.dataset.ordId);
  conVolo(gruppo, () => pezzi.forEach(p => gruppo.appendChild(p)));
  ricorda(gruppo);
}

/* ── quello che va rimesso a posto dopo ogni spostamento ─────────── */
function rifinisci(gruppo) {
  if (gruppo === pagina()) { rinumeraSezioni(); return; }
  const voce = GRUPPI.find(([sel]) => gruppo.matches(sel));
  const regole = voce ? voce[1] : {};
  if (regole.numeri) {
    pezziDi(gruppo).forEach((p, i) => {
      const n = p.querySelector(regole.numeri);
      if (n) n.textContent = n.textContent.replace(/^\s*\d+/, due(i + 1));
    });
  }
  /* il banco specchiato: le colonne seguono i due lati, senno' il
     canvas finisce in quella stretta */
  if (regole.specchio) {
    const primo = pezziDi(gruppo)[0];
    gruppo.toggleAttribute('data-ord-specchio',
      !!primo && primo.classList.contains('bench__panel'));
  }
}

/* I sette numeri delle prove, l'occhiello, il numerone dietro il titolo
   e i numeri della testata dicono tutti la stessa cosa e devono
   continuare a dirla anche dopo che una sezione ha cambiato posto. */
function rinumeraSezioni() {
  const prove = sezioni().filter(s => s.dataset.ordProva != null);
  prove.forEach((s, i) => {
    const occhio = s.querySelector('.eyebrow .n');
    if (occhio) occhio.textContent = `Prova ${due(i + 1)}`;
    const testa = s.querySelector('.sec__head[data-num]');
    if (testa) testa.dataset.num = due(i + 1);
  });
  const nav = document.querySelector('.bar__nav');
  if (!nav) return;
  const per = new Map([...nav.querySelectorAll('a')]
    .map(a => [a.getAttribute('href').slice(1), a]));
  prove.forEach((s, i) => {
    const a = per.get(s.id);
    if (!a) return;
    a.textContent = due(i + 1);
    nav.appendChild(a);                     /* in fila come stanno in pagina */
  });
  const p = per.get('profilo');             /* la P del profilo resta in coda */
  if (p) nav.appendChild(p);
}

/* ── l'animazione del riassestamento ──────────────────────────────
   Senza, i vicini saltano di colpo nel posto nuovo e sembra un errore
   di disegno. E' la tecnica FLIP: misuro dove sono, cambio il DOM,
   misuro dove sono finiti, li rimetto visivamente da dove venivano e li
   lascio scivolare. Costa due letture di geometria e nessun fotogramma
   calcolato a mano. */
const quieti = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function conVolo(gruppo, cambia, gia = null) {
  const pezzi = pezziDi(gruppo);
  /* `gia` sono i rettangoli che il trascinamento ha appena misurato:
     rileggerli qui vorrebbe dire ricalcolare il layout una seconda
     volta nello stesso fotogramma, per sapere una cosa che si sa. */
  const prima = quieti() ? null
    : gia ? new Map(gia.map(({ v, r }) => [v, r]))
          : new Map(pezzi.map(p => [p, p.getBoundingClientRect()]));
  cambia();
  if (!prima) return;
  for (const p of pezziDi(gruppo)) {
    const a = prima.get(p); if (!a || p.dataset.ordPreso) continue;
    const b = p.getBoundingClientRect();
    const dx = a.left - b.left, dy = a.top - b.top;
    if (!dx && !dy) continue;
    p.style.transition = 'none';
    p.style.transform = TRAS(dx, dy);
    requestAnimationFrame(() => {
      p.style.transition = 'transform .22s cubic-bezier(.2,.7,.3,1)';
      p.style.transform = '';
      setTimeout(() => { p.style.transition = ''; }, 260);
    });
  }
}

/* scambiare due elementi di posto senza toccare nessun altro */
function scambia(a, b) {
  const segno = document.createComment('');
  a.parentNode.insertBefore(segno, a);
  b.parentNode.insertBefore(a, b);
  segno.parentNode.insertBefore(b, segno);
  segno.remove();
}

/* ── spostare di un posto (i comandi del pannello) ────────────────── */
export function spostaDi(b, passo) {
  const g = b.gruppo, pezzi = pezziDi(g);
  if (b.tipo === 'sezione') {
    const ok = ammessi(b);
    const i = pezzi.indexOf(b.pezzo);
    for (let j = i + passo; j >= 0 && j < pezzi.length; j += passo)
      if (ok(pezzi[j])) { conVolo(g, () => scambia(b.pezzo, pezzi[j])); ricorda(g); return true; }
    return false;
  }
  const i = pezzi.indexOf(b.pezzo), j = i + passo;
  if (j < 0 || j >= pezzi.length) return false;
  conVolo(g, () => passo < 0 ? g.insertBefore(b.pezzo, pezzi[j])
                             : g.insertBefore(b.pezzo, pezzi[j].nextSibling));
  ricorda(g);
  return true;
}

/* c'e' un posto dove mandarlo, da quella parte? */
export function puoAndare(b, passo) {
  const pezzi = pezziDi(b.gruppo), i = pezzi.indexOf(b.pezzo);
  if (b.tipo !== 'sezione') return i + passo >= 0 && i + passo < pezzi.length;
  const ok = ammessi(b);
  for (let j = i + passo; j >= 0 && j < pezzi.length; j += passo) if (ok(pezzi[j])) return true;
  return false;
}

/* ── la mappa della pagina ────────────────────────────────────────── */
function apriMappa(ok) {
  for (const s of sezioni()) {
    if (s.querySelector(':scope > .ord-banda')) continue;
    const e = document.createElement('div');
    e.className = 'ord-banda mono';
    e.innerHTML = '<b></b><span></span><i aria-hidden="true"></i>';
    e.querySelector('span').textContent = NOMI[s.id] || s.id;
    s.appendChild(e);
  }
  aggiornaBande();
  for (const s of sezioni()) {
    const buono = ok(s);
    s.classList.toggle('ord-si', buono && !s.dataset.ordPreso);
    s.classList.toggle('ord-no', !buono && !s.dataset.ordPreso);
  }
  document.body.classList.add('ord-mappa');
}

function aggiornaBande() {
  const prove = sezioni().filter(s => s.dataset.ordProva != null);
  for (const s of sezioni()) {
    const b = s.querySelector(':scope > .ord-banda');
    if (!b) continue;
    const i = prove.indexOf(s);
    b.querySelector('b').textContent = i >= 0 ? due(i + 1) : fissa(s) ? '—' : '·';
    b.querySelector('i').textContent = fissa(s) ? 'fissa'
                                     : tonoDi(s) === 'chiara' ? 'carta' : 'scuro';
  }
}

function chiudiMappa() {
  document.body.classList.remove('ord-mappa');
  for (const s of sezioni()) {
    s.classList.remove('ord-si', 'ord-no');
    const b = s.querySelector(':scope > .ord-banda');
    if (b) b.remove();
  }
}

/* ── il trascinamento ────────────────────────────────
   La prima versione faceva, a ogni fotogramma: spegneva la
   trasformazione del pezzo, ne rileggeva la posizione, la riaccendeva,
   e per capire dove stava andando rileggeva la posizione di tutti i
   vicini. Ogni lettura di geometria obbliga il browser a ricalcolare il
   layout di quattordicimila pixel di pagina con sedici canvas dentro, e
   non si puo' rimandare: la risposta serve subito.

   A schermo pieno non si vedeva — sessanta fotogrammi pieni anche con
   la CPU rallentata quattro volte — ma rallentandola otto volte, che e'
   un telefono vero di qualche anno fa, il conto arrivava: 121
   fotogrammi saltati su 122, e due secondi e mezzo di lavoro lungo.

   Adesso la geometria si legge UNA VOLTA quando parte, e poi solo
   quando il DOM cambia davvero. Nei fotogrammi in mezzo si scrive una
   trasformazione e basta, che il browser compone senza ricalcolare
   niente. E il ciclo gira per conto suo invece di aspettare il
   puntatore, cosi' il pezzo si muove liscio anche quando gli eventi
   arrivano a singhiozzo. */
let inCorso = null;

export function traTrascinando() { return !!inCorso; }

const RIPOSO = 90;      /* ms fra un riordino e il successivo */

/* La posizione che il layout darebbe al pezzo, senza la trasformazione
   che gli stiamo applicando: si ricava sottraendo, senza spegnerla. */
function rimisura() {
  const c = inCorso;
  if (!c) return;
  const r = c.pezzo.getBoundingClientRect();
  c.orx = r.left - c.tx; c.ory = r.top - c.ty;
  c.vicini = pezziDi(c.gruppo)
    .filter(v => v !== c.pezzo && c.ok(v))
    .map(v => ({ v, r: v.getBoundingClientRect() }));
}

export function iniziaTrascino(b, e) {
  if (inCorso) return;
  const { pezzo, gruppo } = b;
  const mappa = b.tipo === 'sezione';
  const ok = ammessi(b);

  pezzo.dataset.ordPreso = '1';
  if (mappa) {
    apriMappa(ok);
    /* la mappa sta in uno schermo: la porto tutta a vista, senno' il
       dito si ritrova a trascinare una banda che non vede */
    pagina().scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  const r = pezzo.getBoundingClientRect();
  /* In riga o in colonna? Va deciso ORA, con il pezzo ancora al suo
     posto: appena parte porta con se' una trasformazione, e la sua
     geometria non dice piu' dove il layout lo terrebbe. La stessa
     griglia a dodici colonne diventa una colonna sola sul telefono,
     quindi non basta guardare il preset: si guardano i vicini. */
  const inRiga = pezziDi(gruppo).some(p =>
    p !== pezzo && Math.abs(p.getBoundingClientRect().top - r.top) < r.height * .6);

  inCorso = {
    b, pezzo, gruppo, mappa, ok, inRiga, id: e.pointerId,
    /* nella mappa il pezzo si e' appena rimpicciolito sotto il dito: lo
       prendo per il centro, senno' scappa via */
    presaX: mappa ? r.width / 2 : e.clientX - r.left,
    presaY: mappa ? r.height / 2 : e.clientY - r.top,
    x: e.clientX, y: e.clientY,
    tx: 0, ty: 0, orx: r.left, ory: r.top,
    vicini: [], ultimo: 0, vivo: true,
  };
  pezzo.classList.add('ord-preso');
  pezzo.style.willChange = 'transform';    /* un piano suo: niente ridisegno */
  gruppo.classList.add('ord-gruppo');
  document.body.classList.add('ord-in-corso');
  try { pezzo.setPointerCapture(e.pointerId); } catch {}
  rimisura();

  /* Su un telefono il dito che trascina farebbe anche scorrere la
     pagina. touch-action messo adesso non serve — il browser decide a
     inizio gesto — quindi tocca fermare il touchmove a mano. Si puo',
     perche' per staccare il pezzo il dito e' rimasto fermo mezzo
     secondo: nessuno scorrimento e' ancora partito. */
  addEventListener('touchmove', ferma, { passive: false });
  addEventListener('pointermove', muovi);
  addEventListener('pointerup', posa);
  addEventListener('pointercancel', posa);
  addEventListener('scroll', rimisura, { passive: true });
  requestAnimationFrame(giro);
}

const ferma = (e) => e.preventDefault();

/* l'evento segna solo dov'e' il dito: disegnare e' compito del ciclo,
   che gira comunque */
function muovi(e) {
  if (!inCorso || e.pointerId !== inCorso.id) return;
  inCorso.x = e.clientX; inCorso.y = e.clientY;
}

function giro(t) {
  const c = inCorso;
  if (!c || !c.vivo) return;
  requestAnimationFrame(giro);
  const { pezzo, gruppo, x, y, presaX, presaY, inRiga, mappa } = c;

  /* Dove finirebbe il pezzo se lo lasciassi qui. I rettangoli sono
     quelli misurati all'ultimo cambiamento: fra un riordino e l'altro
     non si muove niente, quindi rileggerli sarebbe lavoro buttato. */
  if (t - c.ultimo > RIPOSO) {
    for (const { v, r } of c.vicini) {
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      let cambiato = false;
      if (mappa) {             /* fra sezioni si scambia, non si infila:
                                  e' l'unico modo di tenere l'alternanza */
        conVolo(gruppo, () => scambia(pezzo, v), c.vicini);
        aggiornaBande();
        cambiato = true;
      } else {
        /* in riga si guarda la meta' sinistra/destra, in colonna sopra/sotto */
        const dopo = inRiga ? x > r.left + r.width / 2 : y > r.top + r.height / 2;
        const dove = dopo ? v.nextSibling : v;
        if (dove !== pezzo && dove !== pezzo.nextSibling) {
          conVolo(gruppo, () => gruppo.insertBefore(pezzo, dove), c.vicini);
          cambiato = true;
        }
      }
      if (cambiato) { c.ultimo = t; rimisura(); }
      break;
    }
  }

  /* e qui non si legge niente: solo una trasformazione da comporre */
  const tx = x - presaX - c.orx, ty = y - presaY - c.ory;
  if (tx !== c.tx || ty !== c.ty) {
    c.tx = tx; c.ty = ty;
    pezzo.style.transform = TRAS(tx, ty);
  }
}

function posa(e) {
  if (!inCorso || (e && e.pointerId !== inCorso.id)) return;
  const { pezzo, gruppo, mappa } = inCorso;
  inCorso.vivo = false;
  removeEventListener('touchmove', ferma, { passive: false });
  removeEventListener('pointermove', muovi);
  removeEventListener('pointerup', posa);
  removeEventListener('pointercancel', posa);
  removeEventListener('scroll', rimisura);
  inCorso = null;

  delete pezzo.dataset.ordPreso;
  pezzo.classList.remove('ord-preso');
  gruppo.classList.remove('ord-gruppo');
  document.body.classList.remove('ord-in-corso');

  if (mappa) {
    pezzo.style.transform = '';
    pezzo.style.willChange = '';
    chiudiMappa();
    ricorda(gruppo);
    /* la pagina si riapre dove il pezzo e' finito, non dov'era la mappa */
    pezzo.scrollIntoView({ block: 'start', behavior: quieti() ? 'instant' : 'smooth' });
  } else if (quieti()) {
    pezzo.style.transform = ''; pezzo.style.willChange = '';
    ricorda(gruppo);
  } else {
    /* l'ultimo scivolamento: dal posto dove sta il dito a quello vero */
    pezzo.style.transition = 'transform .2s cubic-bezier(.2,.7,.3,1)';
    pezzo.style.transform = '';
    setTimeout(() => { pezzo.style.transition = ''; pezzo.style.willChange = ''; }, 240);
    ricorda(gruppo);
  }
  document.dispatchEvent(new CustomEvent('ordine', { detail: { gruppo, pezzo } }));
}

/* ── all'avvio: dare un nome ai pezzi, poi rimetterli come li aveva
      lasciati chi guarda ──────────────────────────────────────────── */
export function initOrdine() {
  const gruppi = [];
  for (const [sel] of GRUPPI) document.querySelectorAll(sel).forEach(g => gruppi.push(g));

  const pag = pagina();
  if (pag) {
    gruppi.push(pag);
    let prova = 0;
    sezioni().forEach(s => {
      const n = s.querySelector('.eyebrow .n');
      if (n && n.textContent.trim().startsWith('Prova')) s.dataset.ordProva = ++prova;
    });
  }

  /* le fisse restano senza nome, cosi' nessun ordine salvato puo'
     spostarle nemmeno per sbaglio */
  for (const g of gruppi)
    pezziDi(g).forEach((p, i) => {
      if (g === pag && (p.tagName !== 'SECTION' || fissa(p))) return;
      p.dataset.ordId = i;
    });

  const m = leggi();
  if (!Object.keys(m).length) return;
  for (const g of gruppi) {
    const ordine = m[chiaveGruppo(g)];
    if (!Array.isArray(ordine)) continue;
    const mobili = pezziDi(g).filter(p => p.dataset.ordId != null);
    const per = new Map(mobili.map(p => [p.dataset.ordId, p]));
    const nuovi = [];
    for (const id of ordine) {
      const p = per.get(String(id));
      if (p) { nuovi.push(p); per.delete(String(id)); }
    }
    for (const p of per.values()) nuovi.push(p);   /* pezzi nuovi: in fondo */
    if (nuovi.length !== mobili.length) continue;
    /* Rimettere in fila i pezzi mobili senza toccare i fissi: ogni pezzo
       mobile torna in uno dei buchi che i mobili occupavano. Cosi'
       l'apertura resta prima e il contatto ultimo qualunque cosa dica
       la memoria. */
    const segni = mobili.map(p => { const c = document.createComment(''); p.before(c); return c; });
    nuovi.forEach((p, i) => segni[i].replaceWith(p));
    rifinisci(g);
  }
}
