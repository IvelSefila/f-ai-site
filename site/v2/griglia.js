/* ═══════════════════════════════════════════════════════════════════
 * GRIGLIA — dodici colonne invisibili sotto tutto il sito
 *
 * È la stessa idea di Bootstrap, scritta a mano in una trentina di
 * righe di CSS: dodici colonne uguali e una gronda. Non si vede, ma
 * ogni contenitore ci si appoggia, e ogni riquadro occupa un numero
 * intero di colonne. Dodici perché si divide per 2, 3, 4 e 6: sono le
 * impaginazioni che servono davvero.
 *
 * I valori di partenza riproducono esattamente quello che il sito
 * faceva prima (misurato: deck 3 in fila, offerta e laboratorio 4,
 * formati 3). Cambiare preset è una scelta in più, non un cambiamento
 * imposto. E la griglia si può accendere per vederla.
 * ═══════════════════════════════════════════════════════════════════ */

export const PRESET = {
  '1':     { nome: 'Una colonna',   segno: '████████████', nota: 'tutto in fila, uno sotto l’altro' },
  '2':     { nome: 'Due',           segno: '██████ ██████', nota: '6 + 6' },
  '3':     { nome: 'Tre',           segno: '████ ████ ████', nota: '4 + 4 + 4' },
  '4':     { nome: 'Quattro',       segno: '███ ███ ███ ███', nota: '3 + 3 + 3 + 3' },
  '8-4':   { nome: 'Larga a destra',segno: '████████ ████', nota: '8 + 4, alternati' },
  '4-8':   { nome: 'Larga a sinistra', segno: '████ ████████', nota: '4 + 8, alternati' },
  '6-3-3': { nome: 'Una e due',     segno: '██████ ███ ███', nota: '6 + 3 + 3' },
};

/* i contenitori che stanno sulla griglia, col preset che riproduce
   l'impaginazione misurata prima di introdurla */
export const CONTENITORI = [
  ['.deck',          '3', 'I lavori'],
  ['.offerta__grid', '4', 'I servizi'],
  ['.lab',           '4', 'Le carte del laboratorio'],
  ['.formats',       '3', 'I formati'],
  ['.istruzioni',     '2', 'Le istruzioni'],
  ['.appmie__grid',   '1', 'Le mie app'],
  ['.union__lavori',  '4', 'I pezzi di Union Energia'],
  ['.eso__lavori',     '4', 'I pezzi del lancio esoscheletri'],
  ['.locanda__lavori', '4', 'Le locandine della Locanda'],
  ['.bench',         '',  'Banco: visuale e pannello'],   /* '' = proporzioni originali */
];

const CHIAVE = 'fai-griglia';

function chiave(el) {
  /* un nome stabile per ricordarsi la scelta fra una visita e l'altra */
  return el.id || el.className.toString().trim().split(/\s+/).join('.');
}

export function applicaGriglia(el, preset, ricorda = true) {
  if (!el) return;
  if (preset) el.dataset.gr = preset; else delete el.dataset.gr;
  if (!ricorda) return;
  try {
    const m = JSON.parse(localStorage.getItem(CHIAVE) || '{}');
    if (preset) m[chiave(el)] = preset; else delete m[chiave(el)];
    localStorage.setItem(CHIAVE, JSON.stringify(m));
  } catch {}
}

/* il contenitore a cui appartiene il riquadro toccato: è quello che
   decide come stanno il riquadro e i suoi vicini sopra e sotto */
export function contenitoreDi(box) {
  if (!box) return null;
  for (const [sel] of CONTENITORI) {
    if (box.matches(sel)) return box;
    const c = box.closest(sel);
    if (c) return c;
  }
  return box.parentElement?.closest('[data-gr]') || null;
}

export function nomeContenitore(el) {
  for (const [sel, , nome] of CONTENITORI) if (el?.matches(sel)) return nome;
  return 'Questo gruppo';
}

/* ── far vedere la griglia ────────────────────────────────────────── */
export function mostraGriglia(on) {
  document.documentElement.toggleAttribute('data-gr-visibile', on);
  try { localStorage.setItem(CHIAVE + '-vista', on ? '1' : ''); } catch {}
}
export function grigliaVisibile() {
  return document.documentElement.hasAttribute('data-gr-visibile');
}

/* Rimette ogni contenitore al preset di partenza, spegne la griglia a
   vista e butta le due chiavi di memoria. Non si limita a cancellare la
   memoria: senza rimettere anche i data-gr, il reso resterebbe quello
   scelto fino al prossimo ricarico, e un tasto "rimetti com'era" che
   chiede di ricaricare non e' un tasto, e' un consiglio. */
export function azzeraGriglia() {
  for (const [sel, def] of CONTENITORI)
    document.querySelectorAll(sel).forEach(el => {
      if (def) el.dataset.gr = def; else delete el.dataset.gr;
    });
  document.documentElement.removeAttribute('data-gr-visibile');
  try {
    localStorage.removeItem(CHIAVE);
    localStorage.removeItem(CHIAVE + '-vista');
  } catch {}
}

export function initGriglia() {
  /* i valori di partenza: nessun cambiamento rispetto a prima */
  for (const [sel, def] of CONTENITORI)
    document.querySelectorAll(sel).forEach(el => { if (def) el.dataset.gr = def; });

  /* poi, se l'utente aveva scelto altro, vince la sua scelta */
  try {
    const m = JSON.parse(localStorage.getItem(CHIAVE) || '{}');
    for (const [sel] of CONTENITORI)
      document.querySelectorAll(sel).forEach(el => {
        const v = m[chiave(el)];
        if (v) el.dataset.gr = v;
      });
    if (localStorage.getItem(CHIAVE + '-vista')) mostraGriglia(true);
  } catch {}
}
