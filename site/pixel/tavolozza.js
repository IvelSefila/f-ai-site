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
];

/* nomi comodi, così il codice del disegno si legge */
export const C = {
  FONDO: 0, OMBRA: 1, PORPORA_CUPA: 2, PORPORA: 3,
  LAPIS: 4, AZZURRITE: 5, VERDERAME: 6, MALACHITE: 7,
  DRAGO: 8, CINABRO: 9, MINIO: 10, ORPIMENTO: 11,
  ORO: 12, PERGAMENA: 13, CALCE: 14,
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
