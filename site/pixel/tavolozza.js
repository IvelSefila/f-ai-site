/* ═══════════════════════════════════════════════════════════════════
 * TAVOLOZZA ALCHEMICA
 *
 * Quindici pigmenti, e sono pigmenti veri: quelli con cui si dipingeva
 * prima che esistesse la chimica industriale. L'orpimento è solfuro
 * d'arsenico e avvelenava chi lo macinava; il cinabro è solfuro di
 * mercurio; l'oltremare si ricavava dal lapislazzuli e costava più
 * dell'oro. Il fondo è inchiostro ferro-gallico, quello dei manoscritti:
 * non nero, un viola bruciato.
 *
 * I rapporti di contrasto sono misurati sul fondo (audit/alchimia.mjs).
 * Un pigmento che non arriva a 4,5:1 resta pigmento: si usa per il
 * disegno, non per le scritte. Sotto, il ruolo di ognuno.
 * ═══════════════════════════════════════════════════════════════════ */

export const TAVOLOZZA = [
  /*  0 */ ['#140f1a', 'ferro-gallico',   'fondo'],
  /*  1 */ ['#241a2e', 'ombra',           'seconda ombra'],
  /*  2 */ ['#3d2b4f', 'porpora cupa',    'murice diluito'],
  /*  3 */ ['#7b3f9d', 'porpora',         'murice'],
  /*  4 */ ['#2e5f8a', 'lapislazzuli',    'oltremare'],
  /*  5 */ ['#4a90c2', 'azzurrite',       'testo · 5,44:1'],
  /*  6 */ ['#1f6f5c', 'verderame',       'rame ossidato'],
  /*  7 */ ['#3fae7f', 'malachite',       'testo · 6,80:1'],
  /*  8 */ ['#8b1a1a', 'sangue di drago', 'resina'],
  /*  9 */ ['#c8102e', 'cinabro',         'titoli · 3,21:1'],
  /* 10 */ ['#e2622f', 'minio',           'testo · 5,41:1'],
  /* 11 */ ['#e8a317', 'orpimento',       'testo · 8,70:1'],
  /* 12 */ ['#d4af37', 'oro',             'testo · 8,97:1'],
  /* 13 */ ['#e8dcc0', 'pergamena',       'testo · 13,86:1'],
  /* 14 */ ['#f6efe0', 'calce',           'testo · 16,48:1'],

  /* ── le mezze tinte ────────────────────────────────────────────
     Aggiunte dopo, per i fondali generati: con quindici pigmenti una
     parete di pietra diventava una campitura sola, e il retino faceva
     tutto il lavoro. Un miniaturista le mescolava sulla tavolozza —
     terre, ocre, grigi di pietra — e sono queste. Vanno in coda:
     gli indici da 0 a 14 restano quelli di prima, quindi nessun
     disegno gia' scritto cambia. */
  /* 15 */ ['#5a4632', 'terra d’ombra',   'mezza tinta'],
  /* 16 */ ['#8a5a2b', 'terra di Siena',  'mezza tinta'],
  /* 17 */ ['#c9973f', 'ocra gialla',     'mezza tinta'],
  /* 18 */ ['#6b6a78', 'grigio di pietra','mezza tinta'],
  /* 19 */ ['#9a97a8', 'pietra chiara',   'mezza tinta'],
  /* 20 */ ['#35406b', 'indaco',          'mezza tinta'],
  /* 21 */ ['#4a7a5c', 'verde terra',     'mezza tinta'],
  /* 22 */ ['#b9736f', 'rosa antico',     'mezza tinta'],
  /* 23 */ ['#6e3a2e', 'bruno rosso',     'mezza tinta'],

  /* ── LE RAMPE ──────────────────────────────────────────────────
     Quaranta gradazioni, quattro per ogni famiglia di colore: due
     verso l'ombra, due verso la luce. È la differenza fra un otto e
     un sedici bit — non più tinte, ma più gradini dentro ogni tinta,
     così una parete di pietra ha il suo volume invece di una
     campitura sola. Generate da audit/rampe.mjs.
     Anche queste in coda: 0-23 restano quelli di prima. */
  /* 24 */ ['#422555', 'porpora ombra profonda', 'gradazione'],
  /* 25 */ ['#5c3176', 'porpora ombra',       'gradazione'],
  /* 26 */ ['#9767ac', 'porpora chiaro',      'gradazione'],
  /* 27 */ ['#b590bc', 'porpora luce',        'gradazione'],
  /* 28 */ ['#223b58', 'lapis ombra profonda', 'gradazione'],
  /* 29 */ ['#284d71', 'lapis ombra',         'gradazione'],
  /* 30 */ ['#6385a1', 'lapis chiaro',        'gradazione'],
  /* 31 */ ['#95a9b6', 'lapis luce',          'gradazione'],
  /* 32 */ ['#1a4740', 'verderame ombra profonda', 'gradazione'],
  /* 33 */ ['#1d5c4f', 'verderame ombra',     'gradazione'],
  /* 34 */ ['#5d9482', 'verderame chiaro',    'gradazione'],
  /* 35 */ ['#91b4a2', 'verderame luce',      'gradazione'],
  /* 36 */ ['#650f23', 'cinabro ombra profonda', 'gradazione'],
  /* 37 */ ['#961028', 'cinabro ombra',       'gradazione'],
  /* 38 */ ['#d44659', 'cinabro chiaro',      'gradazione'],
  /* 39 */ ['#e07d84', 'cinabro luce',        'gradazione'],
  /* 40 */ ['#7b3925', 'minio ombra profonda', 'gradazione'],
  /* 41 */ ['#af4d2a', 'minio ombra',         'gradazione'],
  /* 42 */ ['#e88256', 'minio chiaro',        'gradazione'],
  /* 43 */ ['#eda27e', 'minio luce',          'gradazione'],
  /* 44 */ ['#705c28', 'oro ombra profonda',  'gradazione'],
  /* 45 */ ['#a2852f', 'oro ombra',           'gradazione'],
  /* 46 */ ['#dcbd59', 'oro chiaro',          'gradazione'],
  /* 47 */ ['#e4cc7f', 'oro luce',            'gradazione'],
  /* 48 */ ['#413e4b', 'pietra ombra profonda', 'gradazione'],
  /* 49 */ ['#565461', 'pietra ombra',        'gradazione'],
  /* 50 */ ['#908e94', 'pietra chiaro',       'gradazione'],
  /* 51 */ ['#b3afad', 'pietra luce',         'gradazione'],
  /* 52 */ ['#4f3523', 'terra ombra profonda', 'gradazione'],
  /* 53 */ ['#6d4727', 'terra ombra',         'gradazione'],
  /* 54 */ ['#a57f57', 'terra chiaro',        'gradazione'],
  /* 55 */ ['#c0a383', 'terra luce',          'gradazione'],
  /* 56 */ ['#272b49', 'indaco ombra profonda', 'gradazione'],
  /* 57 */ ['#2e365b', 'indaco ombra',        'gradazione'],
  /* 58 */ ['#686f8a', 'indaco chiaro',       'gradazione'],
  /* 59 */ ['#989aa7', 'indaco luce',         'gradazione'],
  /* 60 */ ['#6f4649', 'carne ombra profonda', 'gradazione'],
  /* 61 */ ['#955d5c', 'carne ombra',         'gradazione'],
  /* 62 */ ['#c88f88', 'carne chiaro',        'gradazione'],
  /* 63 */ ['#d7aea4', 'carne luce',          'gradazione'],
];

/* nomi comodi, così il codice del disegno si legge */
export const C = {
  FONDO: 0, OMBRA: 1, PORPORA_CUPA: 2, PORPORA: 3,
  LAPIS: 4, AZZURRITE: 5, VERDERAME: 6, MALACHITE: 7,
  DRAGO: 8, CINABRO: 9, MINIO: 10, ORPIMENTO: 11,
  ORO: 12, PERGAMENA: 13, CALCE: 14,
  OMBRA_TERRA: 15, SIENA: 16, OCRA: 17, PIETRA: 18, PIETRA_CHIARA: 19,
  INDACO: 20, VERDE_TERRA: 21, ROSA: 22, BRUNO: 23,
};

/* la tavolozza in byte, pronta per essere versata nel fotogramma */
export const RGB = TAVOLOZZA.map(([h]) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]);

/* rampe: sequenze di pigmenti che stanno bene insieme, per le sfumature
   a retino. Sono le stesse che userebbe un miniaturista per passare
   dall'ombra alla luce senza mescolare i colori. */
export const RAMPE = {
  notte:  [C.FONDO, C.OMBRA, C.PORPORA_CUPA, C.PORPORA],
  acqua:  [C.FONDO, C.PORPORA_CUPA, C.LAPIS, C.AZZURRITE, C.CALCE],
  bosco:  [C.FONDO, C.OMBRA, C.VERDERAME, C.MALACHITE, C.PERGAMENA],
  fuoco:  [C.FONDO, C.DRAGO, C.CINABRO, C.MINIO, C.ORPIMENTO, C.CALCE],
  oro:    [C.OMBRA, C.DRAGO, C.MINIO, C.ORPIMENTO, C.ORO, C.CALCE],
};

/* ═══════════════════════════════════════════════════════════════════
 * LA TRASMUTAZIONE
 *
 * Il sogno degli alchimisti: il piombo in oro. Qui è una tabella —
 * ogni pigmento trova, fra quelli della famiglia dell'oro, quello che
 * gli somiglia per luminosità. Così un'immagine trasmutata conserva le
 * ombre e le luci: cambia la materia, non il disegno.
 * ═══════════════════════════════════════════════════════════════════ */

const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/* la famiglia dell'oro: i pigmenti caldi, ordinati dall'ombra alla luce */
const FAMIGLIA_ORO = TAVOLOZZA
  .map(([h, nome], i) => ({ i, l: lum(RGB[i]), nome }))
  .filter(x => /oro|orpimento|ocra|minio|siena|bruno|terra d/.test(x.nome))
  .sort((a, b) => a.l - b.l);

/* e la stessa cosa verso il piombo, per l'effetto contrario */
const FAMIGLIA_PIOMBO = TAVOLOZZA
  .map(([h, nome], i) => ({ i, l: lum(RGB[i]), nome }))
  .filter(x => /pietra|indaco|lapis|ombra|ferro/.test(x.nome))
  .sort((a, b) => a.l - b.l);

function tabella(famiglia) {
  const t = new Uint8Array(TAVOLOZZA.length);
  for (let i = 0; i < TAVOLOZZA.length; i++) {
    const l = lum(RGB[i]);
    let best = famiglia[0].i, d = Infinity;
    for (const c of famiglia) {
      const dd = Math.abs(c.l - l);
      if (dd < d) { d = dd; best = c.i; }
    }
    t[i] = best;
  }
  return t;
}

export const VERSO_ORO = tabella(FAMIGLIA_ORO);
export const VERSO_PIOMBO = tabella(FAMIGLIA_PIOMBO);
