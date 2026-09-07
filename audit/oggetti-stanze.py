# -*- coding: utf-8 -*-
"""Oggetti che si toccano nelle altre quattro stanze dipinte.

Stessa idea dell'alchimista: le coordinate vengono dalla griglia
stampata sul fondale vero (audit/griglia.mjs), non a occhio.

Qui pero' c'e' un vincolo in piu'. Nello scriptorium, nei banchi e
nella forgia il colpetto sceglie gia' qualcosa - quale pagina, quale
banco, dove gira il modello - e quella scelta e' legata ai tasti della
carta accanto. Quindi gli oggetti non se lo prendono: reagiscono e
lasciano passare il tocco, cosi' toccare la bobina fa girare la bobina
E sceglie la moviola. L'interazione diventa la scelta.
"""
import io

P = 'site/pixel/stanze.js'
s = io.open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s


def n(t):
    return t.replace('\n', '\r\n') if crlf else t


def dopo(ancora, testo):
    """Infila testo subito dopo la riga dell'ancora."""
    global s
    a = n(ancora)
    assert s.count(a) == 1, 'ancora non unica: ' + ancora[:50]
    i = s.index(a) + len(a)
    s = s[:i] + n(testo) + s[i:]


# -- gli attrezzi condivisi ------------------------------------------
ATTREZZI = '''
/* -- gli oggetti che si toccano ----------------------------------
   Un rettangolo in coordinate logiche (320x180) e un nome. Il nome
   entra in `vivi` col suo cronometro, e il disegno lo consuma. */
function preso(lista, p) {
  for (const o of lista)
    if (p.x >= o.x && p.x < o.x + o.w && p.y >= o.y && p.y < o.y + o.h) return o.nome;
  return null;
}

/* Smorzare una luce dipinta: un alone di colore cupo, denso, sopra la
   fiamma. Piu' onesto del timbro clone quando intorno non c'e' un
   pezzo di muro pulito da cui copiare. */
function smorza(sc, x, y, r, forza = 0.92) {
  sc.alone(x, y, r, C.OMBRA, forza);
  sc.alone(x, y, r * 0.6, C.FONDO, forza);
}

/* il cronometro di un oggetto: avanza, e restituisce 0..1 o null */
function corsa(vivi, nome, durata) {
  const v = vivi[nome];
  if (!v) return null;
  v.t += 1 / 60;
  const q = v.t / durata;
  if (q >= 1) { vivi[nome] = null; return null; }
  return q;
}

'''
ANC = "/* ═══ 1 · LA SOGLIA"
assert s.count(n(ANC)) == 1, 'ancora soglia non trovata'
i = s.index(n(ANC))
s = s[:i] + n(ATTREZZI) + s[i:]

# === SOGLIA =========================================================
SOGLIA = '''
  /* la finestra accesa in cima alla torre, e le due lune */
  oggetti: [
    { nome: 'finestra', x: 199, y: 50, w: 28, h: 36 },
    { nome: 'lunaA',    x: 48,  y: 18, w: 64, h: 64 },
    { nome: 'lunaB',    x: 216, y: 8,  w: 64, h: 64 },
  ],
  vivi: {},
  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0 };
    return true;                 /* qui il tocco se lo prende l'oggetto */
  },
  animaOggetti(sc, S, t) {
    const V = this.vivi;

    /* dentro la torre passa qualcuno: l'ombra attraversa la finestra
       e per un istante la luce cala */
    const q = corsa(V, 'finestra', 1.5);
    if (q !== null) {
      const x = 200 + q * 26;
      sc.rettPieno(x, 57, 6, 25, C.FONDO);
      sc.rettPieno(x, 57, 1, 25, C.OMBRA);
      sc.alone(213, 69, 26, C.ORPIMENTO, 0.30 * (1 - Math.sin(q * Math.PI) * 0.85));
    }

    /* una nuvola passa davanti alla luna e se ne va */
    for (const [nome, cx, cy] of [['lunaA', 79, 50], ['lunaB', 248, 40]]) {
      const c = corsa(V, nome, 3.4);
      if (c === null) continue;
      const nx = cx - 80 + c * 160;
      const d = Math.sin(c * Math.PI);            /* entra e esce piano */
      for (const [dx, dy, r] of [[-22, 4, 9], [-10, -4, 13], [2, -7, 15], [14, -3, 12], [24, 4, 9]])
        sc.alone(nx + dx, cy + dy, r * (0.6 + d * 0.4), C.PORPORA_CUPA, 0.95);
      for (const [dx, dy, r] of [[-8, -8, 7], [4, -11, 8]])
        sc.alone(nx + dx, cy + dy, r * (0.6 + d * 0.4), C.PORPORA, 0.5);
    }
  },
'''
dopo("  id: 'soglia', nome: 'LA SOGLIA', num: '00',", SOGLIA)

# === SCRIPTORIUM ====================================================
SCRIPT = '''
  /* i tre leggii e il candelabro. Le pagine sono dipinte nel fondale:
     quella che si volta la disegna il codice sopra. */
  oggetti: [
    { nome: 'libro0',     x: 30,  y: 76, w: 70, h: 40 },
    { nome: 'libro1',     x: 142, y: 76, w: 64, h: 40 },
    { nome: 'libro2',     x: 240, y: 76, w: 70, h: 40 },
    { nome: 'candelabro', x: 196, y: 48, w: 40, h: 62 },
  ],
  vivi: {},
  LEGGII: [[65, 96, 64], [174, 96, 58], [275, 96, 64]],
  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0 };
    /* il candelabro se lo prende; una pagina no, perche' il tocco deve
       anche scegliere quale lavoro guardare */
    return o === 'candelabro';
  },
  animaOggetti(sc, S, t) {
    const V = this.vivi;

    /* la pagina si volta: una falda di pergamena che si stringe da un
       lato e si apre dall'altro, con l'ombra che la segue */
    for (let i = 0; i < 3; i++) {
      const q = corsa(V, 'libro' + i, 0.75);
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
    }

    /* il candelabro: le tre fiamme si spengono una dopo l'altra, poi
       tornano tutte insieme */
    const c = corsa(V, 'candelabro', 2.8);
    if (c !== null) {
      const FIAMME = [[205, 63], [216, 56], [228, 63]];
      FIAMME.forEach(([x, y], i) => {
        const spegne = 0.10 + i * 0.14, riaccende = 0.72 + i * 0.06;
        if (c > spegne && c < riaccende) {
          smorza(sc, x, y, 6);
          /* il filo di fumo */
          for (let k = 0; k < 9; k++) {
            const f = k / 9, yy = y - 4 - f * 16 - (c - spegne) * 14;
            if (yy < 4) break;
            if ((k + ((t * 16) | 0)) % 3)
              sc.punto(x + Math.sin(f * 5 + t * 2) * (1 + f * 3), yy,
                       f < 0.4 ? C.PIETRA : C.OMBRA);
          }
        } else if (c >= riaccende) {
          const s0 = Math.min(1, (c - riaccende) / 0.14);
          sc.alone(x, y, 9 * s0, C.ORPIMENTO, 0.55 * s0);
          sc.alone(x, y, 4 * s0, C.CALCE, 0.7 * s0);
        }
      });
    }
  },
'''
dopo("  stato: { semi: [1207, 3390, 7714], scelta: 0 },", SCRIPT)

# === BANCHI =========================================================
BANCHI = '''
  /* i quattro banchi, oggetto per oggetto */
  oggetti: [
    { nome: 'pennelli', x: 2,   y: 82, w: 76, h: 42 },
    { nome: 'bobina',   x: 82,  y: 84, w: 46, h: 40 },
    { nome: 'scudi',    x: 166, y: 82, w: 66, h: 46 },
    { nome: 'automi',   x: 248, y: 80, w: 68, h: 44 },
  ],
  vivi: {},
  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0, x: p.x, y: p.y };
    return false;             /* il tocco prosegue e sceglie il banco */
  },
  animaOggetti(sc, S, t) {
    const V = this.vivi;

    /* i pennelli dipingono una pennellata sul banco */
    let q = corsa(V, 'pennelli', 1.9);
    if (q !== null) {
      const COL = [C.CINABRO, C.LAPIS, C.MALACHITE, C.ORPIMENTO, C.PORPORA];
      for (let i = 0; i < 5; i++) {
        const avvio = i * 0.11;
        if (q < avvio) break;
        const f = Math.min(1, (q - avvio) / 0.5);
        const y = 128 + i * 4;
        const larga = f * 62;
        sc.rettPieno(8, y, larga, 3, COL[i]);
        sc.rettPieno(8, y, larga, 1, C.CALCE);
        if (f < 1) sc.alone(8 + larga, y + 1, 4, COL[i], 0.6);
      }
    }

    /* la bobina gira, e la pellicola scorre sotto */
    q = corsa(V, 'bobina', 2.6);
    if (q !== null) {
      const gir = q * 15, spinta = Math.min(1, (1 - q) * 3);
      for (let i = 0; i < 6; i++) {
        const a = gir + i * Math.PI / 3;
        sc.linea(105, 105, 105 + Math.cos(a) * 15, 105 + Math.sin(a) * 15,
                 i % 2 ? C.PIETRA_CHIARA : C.PIETRA);
      }
      sc.cerchio(105, 105, 4, C.CALCE, true);
      sc.alone(105, 105, 22, C.AZZURRITE, 0.20 * spinta);
      /* i fotogrammi che scorrono sul banco */
      for (let i = 0; i < 7; i++) {
        const x = 84 + ((i * 8 + q * 130) % 56);
        sc.rettPieno(x, 126, 6, 7, C.PIETRA);
        sc.rett(x, 126, 6, 7, C.FONDO);
        sc.rettPieno(x + 1, 128, 4, 3, C.LAPIS);
      }
    }

    /* lo scudo toccato squilla: due onde d'oro che si allargano */
    q = corsa(V, 'scudi', 1.5);
    if (q !== null) {
      const mira = V.scudi ? V.scudi.x : 200;
      const cx = [180, 200, 220].reduce((a, b) =>
        Math.abs(b - mira) < Math.abs(a - mira) ? b : a);
      const tremo = Math.sin(q * 40) * (1 - q) * 2;
      for (const r of [q * 34, q * 34 - 11]) {
        if (r <= 0) continue;
        sc.cerchio(cx + tremo, 104, r, C.ORO, false);
      }
      sc.alone(cx + tremo, 104, 16, C.ORPIMENTO, 0.36 * (1 - q));
    }

    /* gli automi si svegliano: occhi accesi e ingranaggio che gira */
    q = corsa(V, 'automi', 2.4);
    if (q !== null) {
      const acceso = q < 0.85 ? (Math.sin(q * 26) > -0.4 ? 1 : 0.25) : (1 - q) / 0.15;
      for (const x of [259, 265, 297, 303]) {
        sc.punto(x, 92, C.CINABRO);
        sc.alone(x, 92, 3.2, C.MINIO, 0.85 * acceso);
      }
      const g = q * 11;
      for (let i = 0; i < 8; i++) {
        const a = g + i * Math.PI / 4;
        sc.rettPieno(281 + Math.cos(a) * 9 - 1, 106 + Math.sin(a) * 9 - 1, 2, 2, C.ORO);
      }
      sc.cerchio(281, 106, 4, C.ORPIMENTO, true);
      sc.alone(281, 106, 14, C.ORO, 0.22 * Math.min(1, (1 - q) * 4));
    }
  },
'''
dopo("  stato: { scelto: 0 },", BANCHI)

# === FORGIA =========================================================
FORGIA = '''
  /* la fornace, gli utensili appesi e la finestra col temporale */
  oggetti: [
    { nome: 'fornace',  x: 18,  y: 48, w: 66, h: 76 },
    { nome: 'utensili', x: 88,  y: 42, w: 98, h: 56 },
    { nome: 'finestra', x: 214, y: 2,  w: 92, h: 122 },
  ],
  vivi: {},
  toccaOggetto(p) {
    const o = preso(this.oggetti, p);
    if (!o) return false;
    this.vivi[o] = { t: 0 };
    return false;             /* il tocco prosegue e sceglie il modo */
  },
  animaOggetti(sc, S, t) {
    const V = this.vivi;

    /* la fornace divampa: il mantice soffia e salgono le faville */
    let q = corsa(V, 'fornace', 2.2);
    if (q !== null) {
      const soffio = Math.sin(q * Math.PI) ** 0.6;
      sc.alone(48, 92, 46 * (0.6 + soffio * 0.7), C.MINIO, 0.42 * soffio);
      sc.alone(48, 92, 24 * (0.6 + soffio * 0.7), C.ORPIMENTO, 0.5 * soffio);
      sc.alone(48, 92, 12, C.CALCE, 0.5 * soffio);
      const r = caso(77);
      for (let i = 0; i < 26; i++) {
        const fase = r(), vel = 0.6 + r() * 1.1;
        const su = (q * vel * 1.6 + fase) % 1;
        const y = 104 - su * 96;
        if (y < 4) continue;
        const x = 48 + (r() - 0.5) * 34 + Math.sin(su * 7 + fase * 9) * 5;
        sc.punto(x, y, su < 0.3 ? C.CALCE : su < 0.6 ? C.ORPIMENTO : C.MINIO);
      }
    }

    /* gli utensili oscillano e il martello batte sull'incudine */
    q = corsa(V, 'utensili', 1.8);
    if (q !== null) {
      const dondolo = Math.sin(q * 19) * (1 - q) * 2.2;
      for (const [x, y, h] of [[100, 48, 30], [116, 46, 34], [132, 50, 26], [150, 46, 32], [166, 50, 28]]) {
        sc.linea(x, y, x + dondolo, y + h, C.PIETRA_CHIARA);
        sc.rettPieno(x + dondolo - 2, y + h - 3, 5, 4, C.PIETRA);
      }
      /* i colpi: tre, a distanza calante */
      for (const colpo of [0.18, 0.44, 0.66]) {
        const d = q - colpo;
        if (d < 0 || d > 0.16) continue;
        const f = 1 - d / 0.16;
        sc.alone(140, 118, 18 * f, C.ORPIMENTO, 0.55 * f);
        const r = caso(31 + Math.round(colpo * 100));
        for (let i = 0; i < 14; i++) {
          const a = -Math.PI * r(), v = (0.4 + r()) * 26 * (1 - f);
          sc.punto(140 + Math.cos(a) * v, 118 + Math.sin(a) * v * 0.7,
                   i % 3 ? C.ORPIMENTO : C.CALCE);
        }
      }
    }

    /* il lampo: tre bagliori, e la stanza intera si illumina */
    q = corsa(V, 'finestra', 1.7);
    if (q !== null) {
      const lampo = (a, b) => q > a && q < b ? 1 - (q - a) / (b - a) : 0;
      const f = Math.max(lampo(0.02, 0.16), lampo(0.24, 0.34) * 0.8, lampo(0.40, 0.62) * 0.55);
      if (f > 0.01) {
        sc.alone(258, 60, 300, C.AZZURRITE, 0.30 * f);
        sc.alone(258, 60, 120, C.CALCE, 0.45 * f);
        sc.retino(216, 6, 88, 116, C.CALCE, C.CALCE, f * 0.9);
      }
      /* la saetta, cinque segmenti a zigzag */
      if (q < 0.2) {
        let x = 250, y = 10;
        for (let i = 0; i < 5; i++) {
          const nx = x + (i % 2 ? 9 : -7), ny = y + 12;
          sc.linea(x, y, nx, ny, C.CALCE);
          sc.linea(x + 1, y, nx + 1, ny, C.AZZURRITE);
          x = nx; y = ny;
        }
      }
    }
  },
'''
dopo("  stato: { modo: 2 },", FORGIA)

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('oggetti aggiunti a soglia, scriptorium, banchi, forgia')
