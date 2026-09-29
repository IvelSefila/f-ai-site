/* ═══════════════════════════════════════════════════════════════
 * tipografia.js — carattere e grandezza di testi e titoli.
 * Testi e titoli si scelgono separatamente: ognuno ha il suo font (da
 * Google Fonts) e la sua scala. La scala moltiplica i token --d1..--d7
 * (titoli) e --t-* (testi) del foglio di stile; il font sostituisce
 * --display e --body. La scelta si ricorda nel browser.
 * ═══════════════════════════════════════════════════════════════ */

const CHIAVE = 'mfai_caratteri';

export const FONT_TITOLI = [
  { nome: 'Barlow Condensed', google: null },   // quello del sito
  { nome: 'Bebas Neue', google: 'Bebas+Neue' },
  { nome: 'Oswald', google: 'Oswald:wght@500;600;700' },
  { nome: 'Anton', google: 'Anton' },
  { nome: 'Archivo Narrow', google: 'Archivo+Narrow:wght@500;600;700' },
  { nome: 'Big Shoulders Display', google: 'Big+Shoulders+Display:wght@600;700' },
  { nome: 'Space Grotesk', google: 'Space+Grotesk:wght@500;600;700' },
  { nome: 'Sora', google: 'Sora:wght@600;700' },
  { nome: 'Syne', google: 'Syne:wght@600;700' },
  { nome: 'Unbounded', google: 'Unbounded:wght@600' },
  { nome: 'Bricolage Grotesque', google: 'Bricolage+Grotesque:wght@600;700' },
  { nome: 'Playfair Display', google: 'Playfair+Display:wght@600;700' },
  { nome: 'DM Serif Display', google: 'DM+Serif+Display' },
  { nome: 'Fraunces', google: 'Fraunces:wght@600;700' },
];

export const FONT_TESTI = [
  { nome: 'Manrope', google: null },              // quello del sito
  { nome: 'Inter', google: 'Inter:wght@400;500;600;700' },
  { nome: 'DM Sans', google: 'DM+Sans:wght@400;500;600;700' },
  { nome: 'IBM Plex Sans', google: 'IBM+Plex+Sans:wght@400;500;600;700' },
  { nome: 'Work Sans', google: 'Work+Sans:wght@400;500;600;700' },
  { nome: 'Public Sans', google: 'Public+Sans:wght@400;500;600;700' },
  { nome: 'Nunito Sans', google: 'Nunito+Sans:wght@400;600;700' },
  { nome: 'Outfit', google: 'Outfit:wght@400;500;600;700' },
  { nome: 'Space Grotesk', google: 'Space+Grotesk:wght@400;500;600;700' },
  { nome: 'Source Serif 4', google: 'Source+Serif+4:wght@400;600;700' },
  { nome: 'Lora', google: 'Lora:wght@400;500;600;700' },
  { nome: 'Merriweather', google: 'Merriweather:wght@400;700' },
];

const SCALA_MIN = 85, SCALA_MAX = 160;
const iniziale = () => ({ titoli: { font: FONT_TITOLI[0].nome, scala: 100 }, testi: { font: FONT_TESTI[0].nome, scala: 100 } });
let stato = iniziale();

const elenco = ruolo => (ruolo === 'titoli' ? FONT_TITOLI : FONT_TESTI);
const trova = (ruolo, nome) => elenco(ruolo).find(f => f.nome === nome) || elenco(ruolo)[0];

const caricati = new Set();
function caricaFont(f) {
  if (!f || !f.google || caricati.has(f.google)) return Promise.resolve();
  caricati.add(f.google);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`;
  document.head.appendChild(link);
  return new Promise(risolvi => {
    link.addEventListener('load', () => risolvi());
    link.addEventListener('error', () => risolvi());
    setTimeout(risolvi, 2500);
  });
}

function salva() {
  try { localStorage.setItem(CHIAVE, JSON.stringify(stato)); } catch { /* memoria non disponibile */ }
}

function applicaStato() {
  const r = document.documentElement.style;
  for (const ruolo of ['titoli', 'testi']) {
    const s = stato[ruolo];
    const f = trova(ruolo, s.font);
    const variabile = ruolo === 'titoli' ? '--f-titoli' : '--f-testi';
    const scala = ruolo === 'titoli' ? '--sc-titoli' : '--sc-testi';
    if (f.google) r.setProperty(variabile, `"${f.nome}"`); else r.removeProperty(variabile);
    if (s.scala !== 100) r.setProperty(scala, String(s.scala / 100)); else r.removeProperty(scala);
  }
}

/* all'avvio: rimette la scelta salvata */
export function initTipografia() {
  try {
    const salvato = JSON.parse(localStorage.getItem(CHIAVE) || 'null');
    if (salvato) {
      for (const ruolo of ['titoli', 'testi']) {
        const s = salvato[ruolo];
        if (!s) continue;
        stato[ruolo].font = trova(ruolo, s.font).nome;
        stato[ruolo].scala = Math.min(SCALA_MAX, Math.max(SCALA_MIN, Number(s.scala) || 100));
      }
    }
  } catch { /* scelta illeggibile: si parte da quella del sito */ }
  applicaStato();
  caricaFont(trova('titoli', stato.titoli.font));
  caricaFont(trova('testi', stato.testi.font));
  document.querySelector('[data-tipo-meno]')?.addEventListener('click', () => cambiaScalaGenerale(-10));
  document.querySelector('[data-tipo-piu]')?.addEventListener('click', () => cambiaScalaGenerale(10));
  segnaComandiTestata();
}

/* i comandi rapidi in testata: A− / A+ cambiano insieme titoli e testi di 10 punti */
export function cambiaScalaGenerale(delta) {
  for (const ruolo of ['titoli', 'testi']) {
    stato[ruolo].scala = Math.min(SCALA_MAX, Math.max(SCALA_MIN, stato[ruolo].scala + delta));
  }
  salva();
  applicaStato();
  document.dispatchEvent(new Event('caratteri'));
  segnaComandiTestata();
}

function segnaComandiTestata() {
  const meno = document.querySelector('[data-tipo-meno]'), piu = document.querySelector('[data-tipo-piu]');
  if (!meno || !piu) return;
  const min = Math.min(stato.titoli.scala, stato.testi.scala), max = Math.max(stato.titoli.scala, stato.testi.scala);
  meno.disabled = min <= SCALA_MIN;
  piu.disabled = max >= SCALA_MAX;
}

export function azzeraTipo() {
  stato = iniziale();
  try { localStorage.removeItem(CHIAVE); } catch { /* niente */ }
  applicaStato();
  segnaComandiTestata();
}

/* ── la sezione dentro il pannello dei colori ── */
const opzioni = ruolo => elenco(ruolo).map(f => `<option value="${f.nome}">${f.nome}${f.google ? '' : ' (del sito)'}</option>`).join('');

export function htmlSezioneTipo() {
  const gruppo = (ruolo, etichetta, nota) => `
      <fieldset class="pal__tipo-gruppo">
        <legend class="mono">${etichetta}</legend>
        <p class="pal__sub" style="margin:0 0 8px">${nota}</p>
        <label class="pal__tipo-riga"><span>Carattere</span>
          <select data-tipo-font="${ruolo}">${opzioni(ruolo)}</select></label>
        <label class="pal__tipo-riga"><span>Grandezza</span>
          <input type="range" min="${SCALA_MIN}" max="${SCALA_MAX}" step="5" value="100" data-tipo-scala="${ruolo}">
          <output data-tipo-out="${ruolo}">100%</output></label>
      </fieldset>`;
  return `
    <div class="pal__sez pal__sez--tipo">
      <p class="pal__tit mono">Caratteri</p>
      <p class="pal__sub" style="margin-inline:0">Scegli il carattere e la grandezza, separati per
        i titoli e per i testi. I caratteri vengono da Google Fonts.</p>
      <div class="pal__tipo">
        ${gruppo('titoli', 'Titoli', 'I titoli grandi di ogni sezione.')}
        ${gruppo('testi', 'Testi', 'Paragrafi, elenchi e didascalie.')}
      </div>
      <button type="button" class="btn btn--sm" data-tipo-reset>Rimetti i caratteri del sito</button>
    </div>`;
}

export function armaSezioneTipo(d) {
  const sincronizza = () => {
    for (const ruolo of ['titoli', 'testi']) {
      d.querySelector(`[data-tipo-font="${ruolo}"]`).value = stato[ruolo].font;
      d.querySelector(`[data-tipo-scala="${ruolo}"]`).value = String(stato[ruolo].scala);
      d.querySelector(`[data-tipo-out="${ruolo}"]`).textContent = `${stato[ruolo].scala}%`;
    }
    d.querySelector('[data-tipo-reset]').disabled =
      JSON.stringify(stato) === JSON.stringify(iniziale());
  };
  for (const ruolo of ['titoli', 'testi']) {
    d.querySelector(`[data-tipo-font="${ruolo}"]`).addEventListener('change', async e => {
      stato[ruolo].font = e.target.value;
      salva();
      await caricaFont(trova(ruolo, stato[ruolo].font));
      applicaStato();
      sincronizza();
    });
    d.querySelector(`[data-tipo-scala="${ruolo}"]`).addEventListener('input', e => {
      stato[ruolo].scala = Number(e.target.value);
      salva();
      applicaStato();
      sincronizza();
    });
  }
  d.querySelector('[data-tipo-reset]').addEventListener('click', () => { azzeraTipo(); sincronizza(); });
  d.tipoSincronizza = sincronizza;
  document.addEventListener('caratteri', sincronizza);
  sincronizza();
}
