/* ═══════════════════════════════════════════════════════════════════
 * engine.js — i motori che disegnano le prove.
 * Tutto in canvas 2D, nessuna libreria. Ogni funzione restituisce
 * l'elenco delle decisioni prese: è quello che rende la prova leggibile.
 * ═══════════════════════════════════════════════════════════════════ */

/* I colori dell'accento non sono piu' costanti: il sito lascia scegliere
   la palette e questi vanno riletti dalle variabili del foglio di stile.
   Sono `let` esportati: chi li importa vede il valore aggiornato, perche'
   fra moduli i binding sono vivi. */
export let EM = '#14c08a';
export let EM_BRIGHT = '#4fe3b0';
export let EM_LIGHT = '#7fe3bd';
export let EM_DEEP = '#0a8f63';

export function leggiColori() {
  const c = getComputedStyle(document.documentElement);
  const v = (k, d) => (c.getPropertyValue(k).trim() || d);
  EM        = v('--em', EM);
  EM_BRIGHT = v('--em-bright', EM_BRIGHT);
  EM_LIGHT  = v('--em-light', EM_LIGHT);
  EM_DEEP   = v('--em-deep', EM_DEEP);
}
const INK = '#f2f4f7';
/* letta da uno scope che non ombreggia mai EM: dentro keyVisual serve
   il valore ORIGINALE prima di ombreggiarlo con quello scelto e un
   "const EM" locale blocca (temporal dead zone) l'intero corpo della
   funzione, anche le righe scritte prima della sua dichiarazione. */
const coloriAttuali = () => [EM, EM_BRIGHT, EM_LIGHT, EM_DEEP];

/* ── i colori del disegno seguono la palette ──────────────────────
   Qui dentro c'erano quattordici rgba() verdi scritti a mano piu' tre
   quasi-neri con la dominante verde: cambiando palette il sito virava
   e il disegno restava smeraldo. Ora ogni tinta nasce da uno dei
   quattro ruoli dell'accento.
   Costruisco rgba() a mano invece di usare color-mix perche' dentro un
   gradiente di canvas la funzione non e' supportata ovunque. */
const _tri = h => { const v = parseInt(h.slice(1), 16);
  return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
const alfa = (col, a) => { const [r, g, b] = _tri(col);
  /* +a perche' le espressioni di partenza finivano gia' con .toFixed(),
     che restituisce una stringa: chiamarci sopra .toFixed() esplodeva */
  return `rgba(${r},${g},${b},${(+a).toFixed(3)})`; };
/* il campo non e' nero piatto: e' quasi-nero con dentro un soffio di
   accento. Le percentuali riproducono il duotono verde di partenza. */
const NERO = [4, 7, 8];
const campo = (col, forza) => { const [r, g, b] = _tri(col);
  const m = i => Math.round(NERO[i] + forza * ([r, g, b][i] - NERO[i]));
  return `rgb(${m(0)},${m(1)},${m(2)})`; };
const BG = '#06090e';

/* rumore riproducibile: stesso seed, stesso disegno */
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function grain(ctx, w, h, amount) {
  if (amount <= 0) return;
  const n = Math.round(w * h * 0.012 * amount);
  const r = rng(7);
  ctx.save();
  ctx.globalAlpha = 0.05 * amount;
  ctx.fillStyle = '#fff';
  for (let i = 0; i < n; i++) ctx.fillRect(r() * w | 0, r() * h | 0, 1, 1);
  ctx.restore();
}

function wrap(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/* ─────────────────────────────────────────────────────────────────
 * KEY VISUAL — il motore centrale.
 * Non è un generatore di forme a caso: è una composizione con una
 * gerarchia fissa (campo, soggetto, struttura, blocco tipografico)
 * dove la macchina può entrare solo su alcuni parametri.
 *
 * ai = 0 → una scelta, molta aria, un accento: la mano.
 * ai = 1 → molte varianti, densità, ripetizione: il sistema.
 * ───────────────────────────────────────────────────────────────── */
export function keyVisual(ctx, o) {
  const { w, h, seed } = o;
  const ai = clamp(o.ai ?? 0.3, 0, 1);
  const weight = clamp(o.weight ?? 0.55, 0, 1);
  const maiuscolo = o.maiuscolo ?? true;
  const titoloGrezzo = o.title ?? 'Un’idea,\npiù formati';
  const title = maiuscolo ? titoloGrezzo.toUpperCase() : titoloGrezzo;
  const kicker = (o.kicker ?? 'MF/AI · key visual').toUpperCase();
  const pos = o.pos || 'basso';   /* dove va il blocco titolo: basso, alto, centro, sinistra, destra, diagonale */
  const fontTitolo = o.font || '"Barlow Condensed","Arial Narrow",sans-serif';
  const pesoFont = o.grassetto ? 800 : (o.peso || 600);   /* normale o grassetto, sul font del titolo */
  const corsivoFont = o.corsivo ? 'italic ' : '';
  /* il "grassetto" richiesto al font non basta: i font caricati (sia
     quelli in dotazione al sito sia quelli di Google) portano un solo
     peso incorporato, quindi il canvas ignora silenziosamente 800 e
     disegna comunque a 600 — bottone senza effetto. Un ripasso col
     tratto (stroke sopra il riempimento) inspessisce le lettere
     davvero, qualunque sia il font scelto. */
  const grassettoFinto = !!o.grassetto;
  /* il colore della "grafica" ridisegna tutto il campo generativo —
     griglia, bagliore, diaframma, banda, schegge — non solo il kicker.
     Le tre tinte derivate (chiara, brillante, profonda) nascono dalla
     stessa base scelta, con lo stesso rapporto che il sito usa per la
     sua palette, cosi' la composizione resta coerente anche fuori dai
     nove colori predefiniti.
     Mai riassegnare le "let" esportate: sono lo stato condiviso di
     tutto il sito. Le ombreggio solo dentro questa funzione — const
     locali con lo stesso nome, valide solo qui, il resto del sito
     non se ne accorge. Devono stare PRIMA di ogni uso di EM qui sotto:
     una volta dichiarato un "const EM" in questo scope, il nome e'
     bloccato (temporal dead zone) dall'inizio della funzione. */
  const mix = (hex, verso, q) => { const [rr, gg, bb] = _tri(hex);
    const m = i => Math.round([rr, gg, bb][i] + q * (verso[i] - [rr, gg, bb][i]));
    /* esadecimale, non rgb(): alfa() e _tri() leggono solo #rrggbb e un
       rgb(...) diventava nero — anelli e griglia sparivano */
    return '#' + [0, 1, 2].map(i => m(i).toString(16).padStart(2, '0')).join(''); };
  const [EM0, EM_BRIGHT0, EM_LIGHT0, EM_DEEP0] = coloriAttuali();
  const EM = o.grafica || EM0;
  const EM_BRIGHT = o.grafica ? mix(o.grafica, [255, 255, 255], .35) : EM_BRIGHT0;
  const EM_LIGHT = o.grafica ? mix(o.grafica, [255, 255, 255], .55) : EM_LIGHT0;
  const EM_DEEP = o.grafica ? mix(o.grafica, [0, 0, 0], .35) : EM_DEEP0;
  const ACC = o.color || EM0;      /* il colore dell'accento, scelto o quello della palette del sito */
  const INKC = o.textColor || INK;             /* colore del testo del titolo */
  const fontScale = clamp(o.fontScale ?? 1, 0.5, 1.8);
  const letterSp = o.letterSpacing ?? 0;       /* px fra le lettere del titolo */
  const lineMul = clamp(o.lineHeight ?? 1, 0.7, 1.8);
  const allineaDefault = pos === 'destra' ? 'destra' : pos === 'diagonale' ? 'centro' : 'sinistra';
  const allinea = o.align || allineaDefault;   /* sinistra, centro, destra — indipendente dalla posizione */
  /* lo sfondo non e' piu' per forza quasi-nero: se scelto, il duotono e
     il velo dietro al testo nascono dalla stessa tinta scura scelta */
  const baseSfondo = o.bgColor ? _tri(o.bgColor) : NERO;
  const campoLocale = (col, forza) => { const [rr, gg, bb] = _tri(col);
    const m = i => Math.round(baseSfondo[i] + forza * ([rr, gg, bb][i] - baseSfondo[i]));
    return `rgb(${m(0)},${m(1)},${m(2)})`; };
  const velo = a => `rgba(${baseSfondo[0]},${baseSfondo[1]},${baseSfondo[2]},${a})`;
  const r = rng(seed);
  const S = Math.min(w, h) / 700;
  const margin = Math.round(lerp(58, 34, ai) * S);
  const cols = Math.round(lerp(8, 20, ai));
  const shards = Math.round(lerp(3, 15, ai));
  const accents = Math.round(lerp(1, 4, ai));
  const ratio = lerp(1.48, 1.14, ai);
  const discarded = Math.round(ai * 24);
  const diag = -0.42 + (r() - 0.5) * 0.3;          /* l'asse della composizione */

  ctx.save();
  ctx.clearRect(0, 0, w, h);

  /* 1 · campo — duotono, non nero piatto */
  const field = ctx.createLinearGradient(0, 0, w, h);
  field.addColorStop(0, campoLocale(EM, .02));
  field.addColorStop(lerp(0.55, 0.38, ai), campoLocale(EM, .06));
  field.addColorStop(1, campoLocale(EM, 0));
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, w, h);

  const gx = lerp(0.74, 0.52, ai) * w, gy = lerp(0.3, 0.42, ai) * h;
  const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * lerp(0.52, 0.8, ai));
  glow.addColorStop(0, `${alfa(EM, (0.3 + ai * 0.22).toFixed(3))}`);
  glow.addColorStop(0.45, `${alfa(EM_DEEP, (0.1 + ai * 0.1).toFixed(3))}`);
  glow.addColorStop(1, 'rgba(4,7,7,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  /* 2 · soggetto — il diaframma: una sola forma forte, sempre presente */
  const ar = Math.min(w, h) * lerp(0.4, 0.3, ai) * (0.74 + r() * 0.62);
  const ax = w * (0.42 + r() * 0.42), ay = h * (0.24 + r() * 0.24);
  ctx.save();
  ctx.translate(ax, ay);
  const blades = 6 + Math.floor(r() * 8);
  for (let ring = 0; ring < 3; ring++) {
    const rr = ar * (1 - ring * 0.22);
    ctx.beginPath();
    for (let i = 0; i <= blades; i++) {
      const a = (i / blades) * Math.PI * 2 + ring * 0.22 + diag;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = `${alfa(EM_LIGHT, (0.26 + ai * 0.32 - ring * 0.07).toFixed(3))}`;
    ctx.lineWidth = Math.max(1, (2.4 - ring * 0.6) * S);
    ctx.stroke();
    if (ring === 1) {
      const inner = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
      inner.addColorStop(0, `${alfa(EM, (0.14 + ai * 0.26).toFixed(2))}`);
      inner.addColorStop(1, `${alfa(EM, 0)}`);
      ctx.fillStyle = inner; ctx.fill();
    }
  }
  ctx.restore();

  /* 2b · banda di scansione: dà un asse a tutta la composizione */
  ctx.save();
  ctx.translate(w * 0.5, h * (0.3 + r() * 0.36));
  ctx.rotate(diag * 0.5);
  const bandH = h * lerp(0.035, 0.11, ai);
  const band = ctx.createLinearGradient(-w, 0, w, 0);
  band.addColorStop(0, `${alfa(EM, 0)}`);
  band.addColorStop(0.5, `${alfa(EM_BRIGHT, (0.1 + ai * 0.14).toFixed(3))}`);
  band.addColorStop(1, `${alfa(EM, 0)}`);
  ctx.fillStyle = band;
  ctx.fillRect(-w, -bandH / 2, w * 2, bandH);
  ctx.restore();

  /* 3 · struttura — la griglia si legge solo dove serve */
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin, margin, w - margin * 2, h - margin * 2);
  ctx.clip();
  ctx.strokeStyle = `${alfa(EM_LIGHT, (0.06 + ai * 0.07).toFixed(3))}`;
  ctx.lineWidth = 1;
  const step = (w - margin * 2) / cols;
  ctx.beginPath();
  for (let i = 0; i <= cols; i++) {
    const x = Math.round(margin + i * step) + 0.5;
    ctx.moveTo(x, margin); ctx.lineTo(x, h - margin);
  }
  for (let y = margin; y < h - margin; y += step) {
    const yy = Math.round(y) + 0.5;
    ctx.moveTo(margin, yy); ctx.lineTo(w - margin, yy);
  }
  ctx.stroke();
  ctx.restore();

  /* 4 · schegge — allineate all'asse, non sparse a caso */
  for (let i = 0; i < shards; i++) {
    const t = (i + 0.5) / shards;
    const jitter = (r() - 0.5) * lerp(0.1, 0.42, ai);
    const cx = w * (0.16 + t * 0.76) + jitter * w * 0.2;
    const cy = h * (0.68 + diag * (t - 0.5) * 1.1) + jitter * h * 0.34;
    const sw = lerp(0.17, 0.07, ai) * w * (0.55 + r() * 0.9);
    const sh = sw * lerp(1.25, 0.6, r());
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(diag * 0.42 + (r() - 0.5) * lerp(0.05, 0.42, ai));
    const a = lerp(0.4, 0.2, ai) + r() * 0.24;
    if (r() < 0.3 + ai * 0.34) {
      const g = ctx.createLinearGradient(-sw / 2, -sh / 2, sw / 2, sh / 2);
      g.addColorStop(0, `${alfa(EM, (a * 0.55).toFixed(3))}`);
      g.addColorStop(1, `${alfa(EM, 0.02)}`);
      ctx.fillStyle = g;
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
    }
    ctx.strokeStyle = `${alfa(EM_LIGHT, a.toFixed(3))}`;
    ctx.lineWidth = Math.max(1, 1.3 * S);
    ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }

  /* 5 · velo — riporta il testo a leggibilità garantita, dove che sia */
  const bandaCentrale = pos === 'centro' || pos === 'diagonale' || pos === 'sinistra' || pos === 'destra';
  const veil = pos === 'alto'
    ? ctx.createLinearGradient(0, 0, 0, h * 0.66)
    : bandaCentrale
      ? ctx.createLinearGradient(0, h * 0.24, 0, h * 0.76)
      : ctx.createLinearGradient(0, h * 0.34, 0, h);
  if (pos === 'alto') {
    veil.addColorStop(0, velo(.96));
    veil.addColorStop(0.55, velo(.72));
    veil.addColorStop(1, velo(0));
    ctx.fillStyle = veil; ctx.fillRect(0, 0, w, h * 0.66);
  } else if (bandaCentrale) {
    veil.addColorStop(0, velo(0));
    veil.addColorStop(0.5, velo(.82));
    veil.addColorStop(1, velo(0));
    ctx.fillStyle = veil; ctx.fillRect(0, h * 0.24, w, h * 0.52);
  } else {
    veil.addColorStop(0, velo(0));
    veil.addColorStop(0.55, velo(.72));
    veil.addColorStop(1, velo(.96));
    ctx.fillStyle = veil; ctx.fillRect(0, h * 0.34, w, h * 0.66);
  }

  /* 6 · blocco tipografico — misurato per stare sempre dentro, ovunque vada */
  const kickSize = Math.max(9, 12 * S);
  ctx.font = `600 ${kickSize}px ui-monospace, Consolas, monospace`;
  const metaSize = kickSize;

  let tSize = lerp(88, 66, ai) * S * (0.66 + weight * 0.78) * fontScale;
  if (pos === 'diagonale') tSize *= 0.86;   /* ruotato, deve restare dentro anche in diagonale */
  if (pos === 'sinistra' || pos === 'destra') tSize *= 0.9;   /* colonna piu' stretta */
  let lines, lh;
  ctx.letterSpacing = `${letterSp}px`;
  /* la regione dove il testo puo' stare: piena larghezza per basso/alto/
     centro, una colonna di lato per sinistra/destra, un fuso stretto
     per diagonale (che poi ruota) */
  const regionX0 = pos === 'destra' ? w - margin - (w - margin * 2) * 0.52 : margin;
  const regionX1 = pos === 'sinistra' ? margin + (w - margin * 2) * 0.52 : w - margin;
  const maxW = pos === 'diagonale' ? w * 0.86 - margin * 2 : regionX1 - regionX0;
  const maxBlock = h * 0.52;
  for (let guard = 0; guard < 24; guard++) {
    ctx.font = `${corsivoFont}${pesoFont} ${tSize}px ${fontTitolo}`;
    lines = title.split('\n').flatMap(l => wrap(ctx, l, maxW));
    lh = tSize * 0.85 * lineMul;
    if (lh * lines.length <= maxBlock && lines.every(l => ctx.measureText(l).width <= maxW)) break;
    tSize *= 0.92;
  }

  const barH = Math.round(Math.max(3, 7 * S));
  const blockH = lh * lines.length;

  /* il punto di ancoraggio orizzontale e l'allineamento del testo sono
     due scelte separate: dove sta la colonna (pos) e come il testo si
     mette in fila dentro quella colonna (allinea) */
  const ancoraX = allinea === 'destra' ? regionX1 : allinea === 'centro' ? (regionX0 + regionX1) / 2 : regionX0;

  if (pos === 'diagonale') {
    /* il titolo taglia il centro sull'asse della composizione, come una
       fascia stampata sopra — l'effetto che i punti fissi non possono dare */
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(diag * 0.5);
    ctx.textAlign = 'center';
    let ty = -blockH / 2 + tSize * 0.78;
    const barY = ty - tSize * 0.86 - barH * 2.6;
    ctx.fillStyle = ACC;
    ctx.fillRect(Math.round(-maxW * lerp(0.17, 0.075, ai)), Math.round(barY),
      Math.round(maxW * lerp(0.34, 0.15, ai)), barH);
    ctx.font = `600 ${kickSize}px ui-monospace, Consolas, monospace`;
    ctx.fillText(kicker, 0, barY - barH * 2.2);
    ctx.font = `${corsivoFont}${pesoFont} ${tSize}px ${fontTitolo}`;
    ctx.fillStyle = INKC;
    if (grassettoFinto) { ctx.strokeStyle = INKC; ctx.lineWidth = tSize * 0.035; ctx.lineJoin = 'round'; }
    /* alone scuro: le linee del fondo che sfiorano una lettera non devono sembrare accenti */
    ctx.shadowColor = 'rgba(4,8,12,.9)'; ctx.shadowBlur = tSize * 0.16;
    for (const l of lines) {
      if (grassettoFinto) ctx.strokeText(l, 0, ty);
      ctx.fillText(l, 0, ty); ty += lh;
    }
    ctx.restore();
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    ctx.textAlign = 'left';
  } else {
    const baseY = pos === 'alto' ? margin + metaSize * 1.4 + blockH
      : (pos === 'centro' || pos === 'sinistra' || pos === 'destra') ? h / 2 + blockH / 2 - lh * 0.15
      : h - margin - metaSize * 2.1;
    let ty = baseY - lh * (lines.length - 1);

    ctx.textAlign = allinea === 'destra' ? 'right' : allinea === 'centro' ? 'center' : 'left';

    /* accenti: uno solo quando decido io — parte dall'ancora, non
       sempre dal margine sinistro, cosi' segue l'allineamento scelto */
    const barY = ty - tSize * 0.86 - barH * 2.6;
    const barW0 = maxW * lerp(0.34, 0.15, ai);
    const barX0 = allinea === 'destra' ? ancoraX - barW0 : allinea === 'centro' ? ancoraX - barW0 / 2 : ancoraX;
    ctx.fillStyle = ACC;
    ctx.fillRect(Math.round(barX0), Math.round(barY), Math.round(barW0), barH);
    for (let i = 1; i < accents; i++) {
      const bw = maxW * (0.05 + r() * 0.12);
      const bx = regionX0 + maxW * (0.4 + r() * 0.55);
      ctx.fillStyle = alfa(ACC, 0.45 + r() * 0.4);
      ctx.fillRect(Math.round(bx), Math.round(barY), Math.round(bw), barH);
    }

    ctx.font = `600 ${kickSize}px ui-monospace, Consolas, monospace`;
    ctx.fillStyle = ACC;
    ctx.fillText(kicker, ancoraX, barY - barH * 2.2);

    ctx.font = `${corsivoFont}${pesoFont} ${tSize}px ${fontTitolo}`;
    ctx.fillStyle = INKC;
    if (grassettoFinto) { ctx.strokeStyle = INKC; ctx.lineWidth = tSize * 0.035; ctx.lineJoin = 'round'; }
    /* alone scuro: le linee del fondo che sfiorano una lettera non devono sembrare accenti */
    ctx.shadowColor = 'rgba(4,8,12,.9)'; ctx.shadowBlur = tSize * 0.16;
    for (const l of lines) {
      if (grassettoFinto) ctx.strokeText(l, ancoraX, ty);
      ctx.fillText(l, ancoraX, ty); ty += lh;
    }
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    ctx.textAlign = 'left';
  }
  ctx.letterSpacing = '0px';

  ctx.font = `600 ${metaSize}px ui-monospace, Consolas, monospace`;
  ctx.fillStyle = 'rgba(195,204,214,.6)';
  ctx.fillText(`${Math.round(w)}×${Math.round(h)} · SEED ${seed} · AI ${Math.round(ai * 100)}%`, margin, h - margin * 0.62);

  grain(ctx, w, h, 0.5 + ai * 0.7);
  ctx.restore();

  return [
    `griglia a <b>${cols}</b> colonne`,
    `scala tipografica <b>${ratio.toFixed(2)}</b>`,
    `margine ottico <b>${margin}px</b>`,
    `elementi generati: <b>${shards}</b>`,
    `accenti in campo: <b>${accents}</b>`,
    ai > 0.05 ? `varianti scartate: <b>${discarded}</b>` : `nessuna variante: <b>scelta unica</b>`,
  ];
}

/* ─────────────────────────────────────────────────────────────────
 * TIMELINE — il ritmo del montaggio si vede e si sente nella durata
 * ───────────────────────────────────────────────────────────────── */
export function timeline(ctx, o) {
  const { w, h } = o;
  const pace = clamp(o.pace ?? 0.4, 0, 1);
  const head = clamp(o.head ?? 0.35, 0, 1);
  const r = rng(o.seed ?? 42);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);

  /* i tagli: pochi e lunghi quando respira, molti e corti quando spinge */
  const n = Math.round(lerp(5, 26, pace));
  const durs = [];
  let total = 0;
  for (let i = 0; i < n; i++) { const d = lerp(1.6, 0.32, pace) * (0.55 + r()); durs.push(d); total += d; }

  const pad = 44, top = 74, rowH = 54, gap = 12;
  const usable = w - pad * 2;
  const labels = ['VIDEO', 'B-ROLL', 'AUDIO', 'GRADE'];

  /* righe */
  for (let row = 0; row < 4; row++) {
    const y = top + row * (rowH + gap);
    ctx.fillStyle = 'rgba(221,231,242,.04)';
    ctx.fillRect(pad, y, usable, rowH);
    ctx.font = '600 11px ui-monospace, Consolas, monospace';
    ctx.fillStyle = 'rgba(127,139,152,.9)';
    ctx.fillText(labels[row], pad, y - 7);

    let x = pad;
    for (let i = 0; i < n; i++) {
      const cw = (durs[i] / total) * usable;
      if (row === 2) {
        /* audio: forma d'onda continua */
        const bars = Math.max(3, Math.round(cw / 5));
        for (let b = 0; b < bars; b++) {
          const amp = (0.2 + r() * 0.8) * (rowH * 0.42);
          ctx.fillStyle = `${alfa(EM, (0.35 + r() * 0.4).toFixed(2))}`;
          ctx.fillRect(x + b * 5, y + rowH / 2 - amp / 2, 2, amp);
        }
      } else {
        const on = row === 1 ? r() < 0.45 + pace * 0.3 : row === 3 ? r() < 0.6 : true;
        if (on) {
          const a = row === 0 ? 0.9 : row === 3 ? 0.34 : 0.5;
          ctx.fillStyle = i % 2 ? `${alfa(EM, a * 0.42)}` : `${alfa(EM_BRIGHT, a * 0.3)}`;
          ctx.fillRect(x + 1, y + 3, Math.max(2, cw - 3), rowH - 6);
          ctx.strokeStyle = `${alfa(EM_LIGHT, a * 0.45)}`;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 1.5, y + 3.5, Math.max(2, cw - 4), rowH - 7);
        }
      }
      x += cw;
    }
  }

  /* istogramma delle durate: il ritmo reso visibile */
  const hy = top + 4 * (rowH + gap) + 16;
  const hh = h - hy - 40;
  let x = pad;
  for (let i = 0; i < n; i++) {
    const cw = (durs[i] / total) * usable;
    const bh = (durs[i] / Math.max(...durs)) * hh;
    ctx.fillStyle = `${alfa(EM, (0.2 + (durs[i] / Math.max(...durs)) * 0.55).toFixed(2))}`;
    ctx.fillRect(x + 1, hy + hh - bh, Math.max(2, cw - 3), bh);
    x += cw;
  }
  ctx.strokeStyle = 'rgba(221,231,242,.12)';
  ctx.beginPath(); ctx.moveTo(pad, hy + hh + .5); ctx.lineTo(w - pad, hy + hh + .5); ctx.stroke();

  /* testina */
  const px = pad + head * usable;
  ctx.strokeStyle = EM_BRIGHT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px, top - 22); ctx.lineTo(px, hy + hh); ctx.stroke();
  ctx.fillStyle = EM_BRIGHT;
  ctx.beginPath();
  ctx.moveTo(px - 7, top - 30); ctx.lineTo(px + 7, top - 30); ctx.lineTo(px, top - 20);
  ctx.closePath(); ctx.fill();

  /* quale taglio stiamo guardando */
  let acc = 0, cut = 1;
  for (let i = 0; i < n; i++) { acc += durs[i] / total; if (head <= acc) { cut = i + 1; break; } }
  const secs = head * total * 1.9;
  const tc = [0, Math.floor(secs / 60), Math.floor(secs % 60), Math.floor((secs % 1) * 25)]
    .map(v => String(v).padStart(2, '0')).join(':');

  const label = pace < 0.28 ? 'Contemplativo' : pace < 0.55 ? 'Narrativo' : pace < 0.8 ? 'Incalzante' : 'Serrato';
  return {
    tc, label, cut, n,
    decisions: [
      `<b>${n}</b> tagli su ${(total * 1.9).toFixed(1)}s`,
      `durata media <b>${((total * 1.9) / n).toFixed(2)}s</b>`,
      `taglio più lungo <b>${(Math.max(...durs) * 1.9).toFixed(2)}s</b>`,
      `b-roll sul <b>${Math.round((0.45 + pace * 0.3) * 100)}%</b> dei tagli`,
      `passo percepito: <b>${label.toLowerCase()}</b>`,
    ],
  };
}

/* ─────────────────────────────────────────────────────────────────
 * RADAR — locale / cloud / ibrido su assi dichiarati
 * ───────────────────────────────────────────────────────────────── */
const AXES = ['Controllo', 'Riservatezza', 'Velocità', 'Costo per uso', 'Scala'];
const MODES = [
  { name: 'Locale', v: [0.95, 0.95, 0.55, 0.85, 0.35] },
  { name: 'Cloud',  v: [0.45, 0.4,  0.9,  0.4,  0.95] },
  { name: 'Ibrido', v: [0.78, 0.75, 0.78, 0.65, 0.75] },
];
export function radar(ctx, o) {
  const { w, h } = o;
  const active = o.mode ?? 0;
  const cx = w / 2, cy = h / 2 + 8, R = Math.min(w, h) * 0.34;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (i / AXES.length) * Math.PI * 2;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v];
  };
  /* anelli */
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i <= AXES.length; i++) {
      const [x, y] = pt(i % AXES.length, ring / 4);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = 'rgba(221,231,242,.09)'; ctx.lineWidth = 1; ctx.stroke();
  }
  for (let i = 0; i < AXES.length; i++) {
    const [x, y] = pt(i, 1);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y);
    ctx.strokeStyle = 'rgba(221,231,242,.09)'; ctx.stroke();
    const [lx, ly] = pt(i, 1.19);
    ctx.font = '600 12px ui-monospace, Consolas, monospace';
    ctx.textAlign = lx > cx + 4 ? 'left' : lx < cx - 4 ? 'right' : 'center';
    ctx.fillStyle = 'rgba(127,139,152,.95)';
    ctx.fillText(AXES[i].toUpperCase(), lx, ly);
  }
  ctx.textAlign = 'left';
  /* poligoni */
  MODES.forEach((m, mi) => {
    const on = mi === active;
    ctx.beginPath();
    m.v.forEach((v, i) => { const [x, y] = pt(i, v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath();
    ctx.fillStyle = on ? `${alfa(EM, .2)}` : 'rgba(221,231,242,.03)';
    ctx.fill();
    ctx.strokeStyle = on ? EM : 'rgba(221,231,242,.18)';
    ctx.lineWidth = on ? 2 : 1;
    ctx.stroke();
    if (on) m.v.forEach((v, i) => {
      const [x, y] = pt(i, v);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fillStyle = EM_BRIGHT; ctx.fill();
    });
  });
  return MODES[active];
}
export { MODES, AXES };
