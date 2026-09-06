/* ═══════════════════════════════════════════════════════════════════
 * engine.js — i motori che disegnano le prove.
 * Tutto in canvas 2D, nessuna libreria. Ogni funzione restituisce
 * l'elenco delle decisioni prese: è quello che rende la prova leggibile.
 * ═══════════════════════════════════════════════════════════════════ */

export const EM = '#14c08a';
export const EM_BRIGHT = '#4fe3b0';
export const EM_LIGHT = '#7fe3bd';
export const EM_DEEP = '#0a8f63';
const INK = '#f2f4f7';
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
  const title = (o.title ?? 'Un’idea,\npiù formati').toUpperCase();
  const kicker = (o.kicker ?? 'F/AI · key visual').toUpperCase();
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
  field.addColorStop(0, '#050a09');
  field.addColorStop(lerp(0.55, 0.38, ai), '#06110d');
  field.addColorStop(1, '#040707');
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, w, h);

  const gx = lerp(0.74, 0.52, ai) * w, gy = lerp(0.3, 0.42, ai) * h;
  const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * lerp(0.52, 0.8, ai));
  glow.addColorStop(0, `rgba(20,192,138,${(0.3 + ai * 0.22).toFixed(3)})`);
  glow.addColorStop(0.45, `rgba(10,143,99,${(0.1 + ai * 0.1).toFixed(3)})`);
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
    ctx.strokeStyle = `rgba(127,227,189,${(0.26 + ai * 0.32 - ring * 0.07).toFixed(3)})`;
    ctx.lineWidth = Math.max(1, (2.4 - ring * 0.6) * S);
    ctx.stroke();
    if (ring === 1) {
      const inner = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
      inner.addColorStop(0, `rgba(20,192,138,${(0.14 + ai * 0.26).toFixed(2)})`);
      inner.addColorStop(1, 'rgba(20,192,138,0)');
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
  band.addColorStop(0, 'rgba(20,192,138,0)');
  band.addColorStop(0.5, `rgba(79,227,176,${(0.1 + ai * 0.14).toFixed(3)})`);
  band.addColorStop(1, 'rgba(20,192,138,0)');
  ctx.fillStyle = band;
  ctx.fillRect(-w, -bandH / 2, w * 2, bandH);
  ctx.restore();

  /* 3 · struttura — la griglia si legge solo dove serve */
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin, margin, w - margin * 2, h - margin * 2);
  ctx.clip();
  ctx.strokeStyle = `rgba(127,227,189,${(0.06 + ai * 0.07).toFixed(3)})`;
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
      g.addColorStop(0, `rgba(20,192,138,${(a * 0.55).toFixed(3)})`);
      g.addColorStop(1, 'rgba(20,192,138,0.02)');
      ctx.fillStyle = g;
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
    }
    ctx.strokeStyle = `rgba(127,227,189,${a.toFixed(3)})`;
    ctx.lineWidth = Math.max(1, 1.3 * S);
    ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }

  /* 5 · velo — riporta il piede a leggibilità garantita, sempre */
  const veil = ctx.createLinearGradient(0, h * 0.34, 0, h);
  veil.addColorStop(0, 'rgba(4,7,9,0)');
  veil.addColorStop(0.55, 'rgba(4,7,9,.72)');
  veil.addColorStop(1, 'rgba(4,7,9,.96)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, h * 0.34, w, h * 0.66);

  /* 6 · blocco tipografico — misurato per stare sempre dentro */
  const kickSize = Math.max(9, 12 * S);
  ctx.font = `600 ${kickSize}px ui-monospace, Consolas, monospace`;
  const metaSize = kickSize;

  let tSize = lerp(88, 66, ai) * S * (0.66 + weight * 0.78);
  let lines, lh;
  const maxW = w - margin * 2;
  const maxBlock = h * 0.52;
  for (let guard = 0; guard < 24; guard++) {
    ctx.font = `600 ${tSize}px "Barlow Condensed", "Arial Narrow", sans-serif`;
    lines = title.split('\n').flatMap(l => wrap(ctx, l, maxW));
    lh = tSize * 0.85;
    if (lh * lines.length <= maxBlock && lines.every(l => ctx.measureText(l).width <= maxW)) break;
    tSize *= 0.92;
  }

  const barH = Math.round(Math.max(3, 7 * S));
  const baseY = h - margin - metaSize * 2.1;
  let ty = baseY - lh * (lines.length - 1);

  /* accenti: uno solo quando decido io */
  const barY = ty - tSize * 0.86 - barH * 2.6;
  for (let i = 0; i < accents; i++) {
    const bw = maxW * (i === 0 ? lerp(0.34, 0.15, ai) : 0.05 + r() * 0.12);
    const bx = margin + (i === 0 ? 0 : maxW * (0.4 + r() * 0.55));
    ctx.fillStyle = i === 0 ? EM : `rgba(20,192,138,${(0.45 + r() * 0.4).toFixed(2)})`;
    ctx.fillRect(Math.round(bx), Math.round(barY), Math.round(bw), barH);
  }

  ctx.font = `600 ${kickSize}px ui-monospace, Consolas, monospace`;
  ctx.fillStyle = EM;
  ctx.fillText(kicker, margin, barY - barH * 2.2);

  ctx.font = `600 ${tSize}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  ctx.fillStyle = INK;
  for (const l of lines) { ctx.fillText(l, margin, ty); ty += lh; }

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
          ctx.fillStyle = `rgba(20,192,138,${(0.35 + r() * 0.4).toFixed(2)})`;
          ctx.fillRect(x + b * 5, y + rowH / 2 - amp / 2, 2, amp);
        }
      } else {
        const on = row === 1 ? r() < 0.45 + pace * 0.3 : row === 3 ? r() < 0.6 : true;
        if (on) {
          const a = row === 0 ? 0.9 : row === 3 ? 0.34 : 0.5;
          ctx.fillStyle = i % 2 ? `rgba(20,192,138,${a * 0.42})` : `rgba(79,227,176,${a * 0.3})`;
          ctx.fillRect(x + 1, y + 3, Math.max(2, cw - 3), rowH - 6);
          ctx.strokeStyle = `rgba(127,227,189,${a * 0.45})`;
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
    ctx.fillStyle = `rgba(20,192,138,${(0.2 + (durs[i] / Math.max(...durs)) * 0.55).toFixed(2)})`;
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
    ctx.fillStyle = on ? 'rgba(20,192,138,.2)' : 'rgba(221,231,242,.03)';
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
