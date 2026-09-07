# -*- coding: utf-8 -*-
"""La pagina che si volta, rifatta.

Prima era una falda alta trenta su una pagina alta centoquattro: nella
fotografia sembrava un segnalibro infilato di traverso, non una pagina
che gira. Ora la falda copre la pagina in altezza e la attraversa da
destra a sinistra, con l'ombra davanti e il bordo curvo.

E il seme nuovo scatta a meta' corsa, quando la falda ha coperto la
miniatura: cosi' quando la falda passa oltre, sotto c'e' un'altra
pagina. Cambiava all'istante del tocco, e il colpo di scena si perdeva.
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


# il candelabro sta nel varco fra la seconda e la terza pagina, ed e'
# quel varco che si puo' toccare: le pagine coprono tutto il resto.
scambia('''    { nome: 'libro0',     x: 14,  y: 30, w: 84, h: 104 },
    { nome: 'libro1',     x: 114, y: 30, w: 84, h: 104 },
    { nome: 'libro2',     x: 214, y: 30, w: 84, h: 104 },
    { nome: 'candelabro', x: 199, y: 48, w: 34, h: 30 },''',
'''    { nome: 'candelabro', x: 198, y: 38, w: 16, h: 62 },
    { nome: 'libro0',     x: 14,  y: 30, w: 84, h: 104 },
    { nome: 'libro1',     x: 114, y: 30, w: 84, h: 104 },
    { nome: 'libro2',     x: 214, y: 30, w: 84, h: 104 },''',
        'ordine dei riquadri')

scambia("  LEGGII: [[56, 82, 80], [156, 82, 80], [256, 82, 80]],",
        "  PAGINE: [[14, 30, 84, 104], [114, 30, 84, 104], [214, 30, 84, 104]],",
        'misure delle pagine')

scambia('''  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0 };
    /* il candelabro se lo prende; una pagina no, perche' il tocco deve
       anche scegliere quale lavoro guardare */
    return o === 'candelabro';
  },''',
'''  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0, girata: false };
    /* il tocco su una pagina la sceglie e la volta: il seme nuovo non
       scatta adesso ma a meta' corsa, quando la falda l'ha coperta */
    if (o !== 'candelabro') this.stato.scelta = +o.slice(5);
    return true;
  },''',
        'tocco scriptorium')

scambia('''    /* la pagina si volta: una falda di pergamena che si stringe da un
       lato e si apre dall'altro, con l'ombra che la segue */
    for (let i = 0; i < 3; i++) {
      const q = corsa(V, 'libro' + i, 0.75, dt);
      if (q === null) continue;
      const [cx, cy, w] = this.LEGGII[i];
      const meta = w / 2 - 2, alt = 30;
      const larga = Math.abs(Math.cos(q * Math.PI)) * meta;
      const x = q < 0.5 ? cx : cx - larga;
      const piega = Math.sin(q * Math.PI) * 4;       /* la falda si incurva */
      sc.rettPieno(x, cy - alt / 2 - piega, larga, alt + piega, C.PERGAMENA);
      sc.rett(x, cy - alt / 2 - piega, larga, alt + piega, C.OMBRA_TERRA);
      sc.linea(cx, cy - alt / 2 - piega, cx, cy + alt / 2, C.SIENA);
      /* l'ombra che la falda getta sulla pagina sotto */
      const sx = q < 0.5 ? cx - Math.min(8, larga) : cx + larga;
      sc.retino(sx, cy - alt / 2, 6, alt, C.PERGAMENA, C.OMBRA_TERRA, 0.35);
    }''',
'''    /* La pagina si volta: una falda di pergamena entra da destra e
       attraversa la pagina fino a coprirla tutta, poi sparisce. Il
       bordo davanti si incurva, e davanti al bordo cammina l'ombra. */
    for (let i = 0; i < 3; i++) {
      const q = corsa(V, 'libro' + i, 0.8, dt);
      if (q === null) continue;
      const [px, py, pw, ph] = this.PAGINE[i];
      const v = V['libro' + i];

      /* a meta' corsa, sotto la falda, la miniatura diventa un'altra */
      if (v && !v.girata && q > 0.5) {
        v.girata = true;
        this.stato.semi[i] = 1000 + Math.floor(Math.random() * 8999);
      }

      /* larga da 0 a tutta la pagina, piano all'inizio e alla fine */
      const larga = (1 - Math.cos(Math.min(1, q * 1.15) * Math.PI)) / 2 * (pw - 6);
      if (larga < 1) continue;
      const x0 = px + pw - 3 - larga, y0 = py + 4, h = ph - 8;

      /* l'ombra che la falda getta sulla pagina, davanti al bordo */
      sc.retino(Math.max(px + 3, x0 - 7), y0 + 2, 7, h, C.PERGAMENA, C.OMBRA_TERRA, 0.4);

      sc.rettPieno(x0, y0, larga, h, C.PERGAMENA);
      /* il bordo davanti si incurva: tre scalini di pergamena piu' cupa */
      for (let k = 0; k < 3; k++)
        sc.rettPieno(x0 + k, y0 + k, 1, h - k * 2, k ? C.OMBRA_TERRA : C.SIENA);
      sc.rettPieno(x0, y0, larga, 1, C.CALCE);
      sc.rettPieno(x0, y0 + h - 1, larga, 1, C.OMBRA_TERRA);

      /* il verso della pagina: le righe si vedono in trasparenza */
      for (let r = 0; r < 9; r++) {
        const ry = y0 + 10 + r * 9;
        if (ry > y0 + h - 6) break;
        sc.retino(x0 + 6, ry, Math.max(0, larga - 12), 1, C.PERGAMENA, C.OMBRA_TERRA, 0.45);
      }
    }''',
        'la voltata')

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('pagina rifatta')
