# Aggiunge gli oggetti sensibili alla stanza dell'alchimista.
# Le coordinate vengono dalla griglia stampata sul fondale vero
# (audit/griglia.mjs): sono i pixel dove stanno davvero la fiamma,
# l'ampolla e lo scaffale dei libri.
import io, sys

P = 'site/pixel/stanze.js'
s = io.open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s
def n(t):
    return t.replace('\n', '\r\n') if crlf else t

# ── il timbro del clonatore, condiviso ──────────────────────────────
CLONE = '''/* ── il timbro del clonatore ──────────────────────────────────────
   Per spegnere una fiamma dipinta nel fondale bisogna coprirla: ci
   copio sopra un pezzo di muro preso poco piu' in alto. E' il timbro
   clone dei fotoritocchi, in venti righe e a indici di tavolozza. */
function copri(sc, x, y, w, h, dx, dy) {
  const k = sc.k;
  const sx = Math.round(x * k), sy = Math.round(y * k);
  const sw = Math.round(w * k), sh = Math.round(h * k);
  const ox = Math.round(dx * k), oy = Math.round(dy * k);
  for (let j = 0; j < sh; j++)
    for (let i = 0; i < sw; i++) {
      const ax = sx + i, ay = sy + j, bx = sx + i + ox, by = sy + j + oy;
      if (ax < 0 || ay < 0 || ax >= sc.rw || ay >= sc.rh) continue;
      if (bx < 0 || by < 0 || bx >= sc.rw || by >= sc.rh) continue;
      sc.buf[ay * sc.rw + ax] = sc.buf[by * sc.rw + bx];
    }
}

'''
anc = '/* ═══ 1 · LA SOGLIA'
if 'function copri(' not in s:
    i = s.index(anc)
    s = s[:i] + n(CLONE) + s[i:]

# ── il colpetto: prima gli oggetti, poi le risposte ─────────────────
COLPETTO = '''  /* ── gli oggetti che si possono toccare ───────────────────────
     Coordinate prese dalla griglia sul fondale vero, non a occhio. */
  oggetti: [
    { nome: 'fiamma',  x: 115, y: 58, w: 28,  h: 58 },
    { nome: 'ampolla', x: 141, y: 52, w: 42,  h: 70 },
    { nome: 'libri',   x: 176, y: 38, w: 112, h: 42 },
  ],
  vivi: { fiamma: null, ampolla: null, libri: [] },

  colpetto(p, S, aggiorna) {
    for (const o of this.oggetti)
      if (p.x >= o.x && p.x < o.x + o.w && p.y >= o.y && p.y < o.y + o.h) {
        if (o.nome === 'fiamma')  this.vivi.fiamma  = { t: 0 };
        if (o.nome === 'ampolla') this.vivi.ampolla = { t: 0 };
        if (o.nome === 'libri' && this.vivi.libri.length < 9)
          this.vivi.libri.push({
            x: p.x, y: Math.max(44, p.y), vy: 0,
            vx: (Math.random() - 0.5) * 16, giro: 0, fermo: false,
            c: [C.CINABRO, C.LAPIS, C.VERDERAME, C.PORPORA, C.SIENA][this.vivi.libri.length % 5],
          });
        return true;
      }
    /* fuori dagli oggetti il colpetto risponde alla domanda */
    if (this.stato.fatto) return false;
    const [, risp] = DOMANDE[this.stato.passo];
    const i = Math.max(0, Math.min(risp.length - 1,
      Math.floor((p.y - 30) / (120 / risp.length))));
    if (this.rispondi(i)) { aggiorna(); return true; }
    return false;
  },
'''
# Attenzione all'ordine: nel file il colpetto sta PRIMA di disegna.
# Sostituendo da colpetto fino a rispondi mi portavo via anche il
# disegno della stanza. Quindi: prima il disegno, poi il solo colpetto.
COLPETTO_VECCHIO = n('''  /* il colpetto risponde alla domanda: alto la prima, giu' l'ultima */
  colpetto(p, S, aggiorna) {
    if (this.stato.fatto) return;
    const [, risp] = DOMANDE[this.stato.passo];
    const i = Math.max(0, Math.min(risp.length - 1,
      Math.floor((p.y - 30) / (120 / risp.length))));
    if (this.rispondi(i)) aggiorna();
  },
''')
assert s.count(COLPETTO_VECCHIO) == 1, 'colpetto vecchio non trovato'

# ── il disegno degli oggetti vivi ───────────────────────────────────
VECCHIO = n('''  disegna(sc, S, t) {
    /* la stanza e' dipinta: qui vive solo la fiamma della candela e,
       a brief finito, la luce verde dell'alambicco */
    const fh = 0.7 + Math.sin(t * 7) * 0.3;
    sc.alone(128, 92, 34, C.MINIO, 0.20 * fh);
    sc.alone(128, 92, 16, C.ORPIMENTO, 0.34 * fh);
    sc.alone(162, 108, 18, C.MALACHITE, 0.22 + Math.sin(t * 3) * 0.08);
    if (this.stato.fatto) {
      sc.alone(162, 108, 46, C.MALACHITE, 0.30);
      sc.alone(162, 108, 22, C.CALCE, 0.22);
    }
  },''')
assert s.count(VECCHIO) == 1, 'blocco disegna non trovato'

NUOVO = '''  disegna(sc, S, t) {
    const dt = 1 / 60;
    const V = this.vivi;

    /* ── la candela ──────────────────────────────────────────────
       Spenta: copro la fiamma dipinta col muro di sopra e mando su un
       filo di fumo. Dopo due secondi e mezzo l'alchimista la riaccende
       con l'acciarino, e la fiamma torna. */
    let viva = true;
    if (V.fiamma) {
      V.fiamma.t += dt;
      const q = V.fiamma.t;
      if (q < 2.5) {
        viva = false;
        copri(sc, 121, 59, 15, 23, 0, -27);
        for (let i = 0; i < 22; i++) {
          const f = i / 22, y = 80 - f * 46 - q * 6;
          if (y < 6) break;
          const x = 128 + Math.sin(f * 5 + q * 2.2) * (2 + f * 5);
          if ((i + ((q * 20) | 0)) % 3)
            sc.punto(x, y, f < 0.3 ? C.PIETRA_CHIARA : f < 0.65 ? C.PIETRA : C.OMBRA);
        }
      } else if (q < 3.1) {
        viva = false;
        copri(sc, 121, 59, 15, 23, 0, -27);
        const s0 = (q - 2.5) / 0.6;
        for (let i = 0; i < 8; i++) {
          const a = i * 0.9 + q * 9, d = s0 * 10;
          sc.punto(128 + Math.cos(a) * d, 74 + Math.sin(a) * d,
                   i % 2 ? C.CALCE : C.ORPIMENTO);
        }
        sc.alone(128, 74, 11 * s0, C.ORPIMENTO, 0.5);
      } else V.fiamma = null;
    }
    if (viva) {
      const fh = 0.7 + Math.sin(t * 7) * 0.3;
      sc.alone(128, 88, 36, C.MINIO, 0.20 * fh);
      sc.alone(128, 88, 17, C.ORPIMENTO, 0.32 * fh);
    }

    /* ── l'ampolla ───────────────────────────────────────────────
       A riposo pulsa piano. Toccata ribolle: le bolle salgono dentro
       la pancia di vetro e dal collo esce vapore. */
    let bolle = 0;
    if (V.ampolla) {
      V.ampolla.t += dt;
      const q = V.ampolla.t;
      bolle = q < 3.4 ? Math.min(1, q * 3) * (1 - Math.max(0, (q - 2.6) / 0.8)) : 0;
      if (q > 3.6) V.ampolla = null;
    }
    sc.alone(161, 100, 18 + bolle * 11, C.MALACHITE,
             0.20 + bolle * 0.34 + Math.sin(t * 3) * 0.06);
    if (bolle > 0.05) {
      const r = caso(31);
      for (let i = 0; i < 18; i++) {
        const fase = r(), vel = 0.5 + r() * 0.9, dx = (r() - 0.5) * 22;
        const su = (t * vel * 1.8 + fase) % 1;
        if (su > 0.92) continue;
        sc.cerchio(161 + dx * (1 - su * 0.5), 110 - su * 25,
                   su > 0.6 ? 2 : 1, su > 0.75 ? C.CALCE : C.MALACHITE, true);
      }
      for (let i = 0; i < 12; i++) {
        const f = i / 12, y = 56 - f * 34 - bolle * 4;
        if (y < 6) break;
        if ((i + ((t * 14) | 0)) % 3)
          sc.punto(161 + Math.sin(f * 6 + t * 3) * (1 + f * 6), y,
                   f < 0.4 ? C.MALACHITE : C.VERDE_TERRA);
      }
      sc.alone(161, 60, 11 * bolle, C.MALACHITE, 0.3 * bolle);
    }

    /* ── i libri che cadono ──────────────────────────────────────
       Girano a scatti di novanta gradi, come si conviene a un pixel,
       e restano dove sono caduti. */
    for (const L of V.libri) {
      if (!L.fermo) {
        L.vy += 210 * dt; L.y += L.vy * dt; L.x += L.vx * dt;
        L.giro += dt * 7;
        if (L.y >= 146) { L.y = 146; L.fermo = true; }
      }
      const dritto = (Math.round(L.giro / 1.57) % 2) === 0;
      const w = dritto ? 9 : 4, h = dritto ? 4 : 9;
      sc.rettPieno(L.x - w / 2, L.y - h / 2, w, h, L.c);
      sc.rettPieno(L.x - w / 2, L.y - h / 2, dritto ? 9 : 1, dritto ? 1 : 9, C.PERGAMENA);
      sc.rett(L.x - w / 2, L.y - h / 2, w, h, C.FONDO);
      if (!L.fermo) sc.alone(L.x, L.y, 7, C.OCRA, 0.18);
    }

    if (this.stato.fatto) {
      sc.alone(161, 100, 50, C.MALACHITE, 0.28);
      sc.alone(161, 100, 24, C.CALCE, 0.20);
    }
  },'''
s = s.replace(VECCHIO, n(NUOVO))
s = s.replace(COLPETTO_VECCHIO, n(COLPETTO))

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('alchimista: tre oggetti sensibili (fiamma, ampolla, libri)')
