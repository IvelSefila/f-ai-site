# -*- coding: utf-8 -*-
"""Le ultime due cose che stonavano sui fondali nuovi.

1 · LA MATERIA. La disposizione "griglia" era un rettangolo di puntini
    perfettamente regolare steso sopra la nebulosa dipinta: leggeva
    come una zanzariera, non come materia messa in ordine. Ora le tre
    disposizioni stanno dentro un'ellisse — la stessa forma della
    nuvola dipinta — e la griglia ha i suoi fili, cosi' si capisce che
    e' la stessa sostanza che si ordina.

2 · LA BILANCIA. L'artefatto era un rettangolo nero con dentro dei
    rettangoli colorati a caso, appeso in mezzo alla stanza. Ora e' un
    quadro incorniciato d'oro appeso al muro, e la sua materia cambia
    col peso: pergamena e forme grandi quando comanda la mano, lastra
    scura e forme piccole e fitte quando comanda la macchina.
"""
import io

P = 'site/pixel/stanze.js'
s = io.open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s


def n(t):
    return t.replace('\n', '\r\n') if crlf else t


def scambia(v, nu, cosa):
    global s
    a = n(v)
    assert s.count(a) == 1, 'non trovato: ' + cosa
    s = s.replace(a, n(nu))


# ═══ 1 · LA MATERIA ═════════════════════════════════════════════════
scambia('''    for (let i = 0; i < N; i++) {
      const u = r(), v = r(), w = r();
      let x, y;
      if (f === 0) {                              /* griglia */
        x = cx - 74 + (i % 48) * 3.1; y = cy - 26 + Math.floor(i / 48) * 1.9;
      } else if (f === 1) {                       /* nastro */
        const a = u * 6.28 * 2;
        x = cx + Math.cos(a) * (78 - v * 9) * soffio;
        y = cy + Math.sin(a * 0.5 + t * 0.3) * 26 * (0.4 + v * 0.6) * soffio;
      } else {                                    /* rete */
        const a = u * 6.28, d = Math.sqrt(v) * 74 * soffio;
        x = cx + Math.cos(a) * d; y = cy + Math.sin(a) * d * 0.42;
      }
      if (y < 12 || y > 104) continue;
      const c = w > 0.86 ? C.ORO : w > 0.66 ? C.MALACHITE
              : w > 0.42 ? C.LAPIS : w > 0.2 ? C.PORPORA : C.MINIO;
      sc.punto(x, y, c);
    }''',
'''    /* La nuvola dipinta e' un'ellisse: le tre disposizioni ci stanno
       dentro. Prima la griglia era un rettangolo pieno di puntini
       regolari steso sopra la nebulosa, e sembrava una zanzariera. */
    const RX = 84, RY = 38;
    const dentro = (x, y) => {
      const u = (x - cx) / RX, v = (y - cy) / RY;
      return u * u + v * v;
    };
    const tinta = (w) => w > 0.86 ? C.ORO : w > 0.66 ? C.MALACHITE
                       : w > 0.42 ? C.LAPIS : w > 0.2 ? C.PORPORA : C.MINIO;

    if (f === 0) {
      /* La griglia: un reticolo con i suoi fili, che si dirada verso
         il bordo. Con i fili si legge come ordine; senza, come rumore. */
      const PX = 6, PY = 5;
      for (let gy = -7; gy <= 7; gy++)
        for (let gx = -15; gx <= 15; gx++) {
          const x = cx + gx * PX, y = cy + gy * PY;
          const d = dentro(x, y);
          if (d > 1) continue;
          const forza = 1 - d;
          if (r() > 0.25 + forza * 0.8) continue;
          if (gx < 15 && dentro(x + PX, y) <= 1 && forza > 0.35)
            sc.linea(x, y, x + PX, y, C.PORPORA_CUPA);
          if (gy < 7 && dentro(x, y + PY) <= 1 && forza > 0.55)
            sc.linea(x, y, x, y + PY, C.PORPORA_CUPA);
          sc.punto(x, y, forza > 0.72 ? C.ORO : forza > 0.4 ? tinta(r()) : C.PORPORA);
        }
    } else if (f === 1) {
      /* Il nastro: un fiume di punti che si attorciglia su se stesso */
      for (let i = 0; i < N; i++) {
        const u = r(), v = r(), w = r();
        const a = u * 6.28 * 2;
        const x = cx + Math.cos(a) * (RX - 6 - v * 9) * soffio;
        const y = cy + Math.sin(a * 0.5 + t * 0.3) * (RY - 8) * (0.4 + v * 0.6) * soffio;
        if (dentro(x, y) > 1) continue;
        sc.punto(x, y, tinta(w));
      }
    } else {
      /* La rete: nodi che si legano fra loro */
      const nodi = [];
      for (let i = 0; i < 26; i++) {
        const a = r() * 6.28, d = Math.sqrt(r());
        nodi.push([cx + Math.cos(a) * d * (RX - 8) * soffio,
                   cy + Math.sin(a) * d * (RY - 6) * soffio]);
      }
      for (let i = 0; i < nodi.length; i++)
        for (let j = i + 1; j < nodi.length; j++) {
          const dx = nodi[i][0] - nodi[j][0], dy = (nodi[i][1] - nodi[j][1]) * 2.2;
          if (dx * dx + dy * dy < 900)
            sc.linea(nodi[i][0], nodi[i][1], nodi[j][0], nodi[j][1], C.PORPORA_CUPA);
        }
      for (let i = 0; i < N; i++) {
        const u = r(), v = r(), w = r();
        const a = u * 6.28, d = Math.sqrt(v);
        const x = cx + Math.cos(a) * d * RX * soffio;
        const y = cy + Math.sin(a) * d * RY * soffio;
        if (dentro(x, y) > 1) continue;
        sc.punto(x, y, tinta(w));
      }
      for (const [nx, ny] of nodi) {
        sc.cerchio(nx, ny, 2, C.CALCE, true);
        sc.alone(nx, ny, 6, C.ORO, 0.4);
      }
    }''',
        'le tre disposizioni')

# ═══ 2 · LA BILANCIA ════════════════════════════════════════════════
scambia('''    /* Il grano d'oro che scorre sulla stanga dipinta: e' lui a dire
       dove sta la bilancia, senza ridisegnare la stanga. */
    const gx = 108 + q * 100, gy = 41 + (q - 0.5) * 3;
    sc.linea(108, 41, 208, 41, C.PORPORA_CUPA);
    sc.cerchio(gx, gy, 3, C.ORO, true);
    sc.cerchio(gx, gy, 1, C.CALCE, true);
    sc.alone(gx, gy, 8, C.ORPIMENTO, 0.5);''',
'''    /* Il grano d'oro che scorre sulla stanga dipinta: e' lui a dire
       dove sta la bilancia, senza ridisegnare la stanga. Il filo che
       gli avevo messo sotto per guidarlo si vedeva come una riga scura
       in mezzo all'ottone: tolto, il grano basta da solo. */
    const gx = 108 + q * 100, gy = 41 + (q - 0.5) * 3;
    sc.alone(gx, gy, 9, C.ORPIMENTO, 0.55);
    sc.cerchio(gx, gy, 3, C.ORO, true);
    sc.punto(gx, gy, C.CALCE);''',
        'il grano sulla stanga')

VECCHIO_ART = '''    /* l'artefatto: appeso al muro nudo fra i due piatti */
    const ax = 128, ay = 48, aw = 66, ah = 44;
    sc.rettPieno(ax, ay, aw, ah, C.FONDO);
    sc.rett(ax - 1, ay - 1, aw + 2, ah + 2, C.PORPORA);
    const ra = caso(1000 + Math.round(q * 20));
    const forme = 3 + Math.round(q * 9);
    for (let i = 0; i < forme; i++) {
      const w = 6 + ra() * 30 * (1 - q * 0.5), h = 4 + ra() * 15;
      const x = ax + 3 + ra() * (aw - w - 6), y = ay + 3 + ra() * (ah - h - 6);
      const c = i % 3 === 0 ? C.MINIO : q > 0.5 ? C.LAPIS : C.VERDERAME;
      if (ra() > 0.5) sc.rett(x, y, w, h, c); else sc.rettPieno(x, y, w, h, c);
    }'''

NUOVO_ART = '''    /* ── l'artefatto ─────────────────────────────────────────────
       Un quadro appeso al muro nudo fra i due piatti. Prima era un
       rettangolo nero con dentro dei rettangoli a caso: pareva un
       errore di disegno appeso in mezzo alla stanza. Ora ha la sua
       cornice d'oro, e cambia materia col peso — pergamena e forme
       grandi quando comanda la mano, lastra scura e forme piccole e
       fitte quando comanda la macchina. */
    const ax = 134, ay = 58, aw = 54, ah = 44;
    sc.rettPieno(ax - 3, ay - 3, aw + 6, ah + 6, C.OMBRA_TERRA);
    sc.rett(ax - 3, ay - 3, aw + 6, ah + 6, C.ORO);
    sc.rett(ax - 1, ay - 1, aw + 2, ah + 2, C.ORO);
    sc.linea(ax + aw / 2, ay - 4, ax + aw / 2, ay - 12, C.OMBRA_TERRA);

    const carta = q < 0.5 ? C.PERGAMENA : C.INDACO;
    sc.rettPieno(ax, ay, aw, ah, carta);
    const ra = caso(1000 + Math.round(q * 20));
    const forme = 3 + Math.round(q * 11);
    const CALDE = [C.CINABRO, C.MINIO, C.SIENA, C.ORPIMENTO];
    const FREDDE = [C.AZZURRITE, C.MALACHITE, C.LAPIS, C.CALCE];
    for (let i = 0; i < forme; i++) {
      const scala = 1 - q * 0.62;
      const w = Math.max(3, (4 + ra() * 26) * scala);
      const h = Math.max(3, (4 + ra() * 18) * scala);
      const x = ax + 2 + ra() * (aw - w - 4), y = ay + 2 + ra() * (ah - h - 4);
      const tav = q > 0.5 ? FREDDE : CALDE;
      const c = tav[Math.floor(ra() * tav.length)];
      sc.rettPieno(x, y, w, h, c);
      sc.rett(x, y, w, h, q > 0.5 ? C.FONDO : C.OMBRA_TERRA);
    }
    /* il velo che tiene insieme la composizione */
    sc.retino(ax, ay, aw, ah, carta, q > 0.5 ? C.LAPIS : C.OCRA, 0.12);
    sc.rett(ax, ay, aw, ah, C.OMBRA_TERRA);'''
scambia(VECCHIO_ART, NUOVO_ART, "l'artefatto")

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('materia e bilancia ritoccate')
