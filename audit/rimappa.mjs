/* ═══════════════════════════════════════════════════════════════════
 * DA UN PNG AGLI INDICI DELLA TAVOLOZZA
 *
 * Stava dentro quantizza.mjs, e quando mi e' servito anche altrove
 * l'avevo ricopiato. Due copie della stessa cosa divergono: questa sta
 * in un posto solo.
 *
 * ── IL RETINO ORDINATO ────────────────────────────────────────────
 * Prima era Floyd-Steinberg, che sparge l'errore di ogni pixel sui
 * vicini. Fa sfumature morbide, ma ha due difetti che qui pesano.
 *
 * Il primo e' misurato: l'errore si propaga, quindi un pixel diverso
 * in cima cambia tutti quelli a valle. Fra due fotogrammi consecutivi
 * di uno stesso video — dove si muove solo la bilancia — cambiava il
 * 73% dei pixel anche nelle zone ferme, e salvare i fotogrammi sarebbe
 * costato 1,3 MB invece di poche decine di KB.
 *
 * Il secondo e' di gusto, ed e' quello che mi e' stato detto: la
 * diffusione d'errore fa quel brulichio morbido da Amiga. Le console a
 * 16 bit non potevano permettersela — non avevano la memoria per
 * ricalcolare — e usavano un retino ORDINATO: una matrice fissa di
 * soglie, uguale per tutti i fotogrammi. Ne viene il reticolo netto e
 * regolare del Mega Drive.
 *
 * Ordinato vuol dire anche deterministico: stesso pixel, stessa
 * posizione, stesso risultato. Ed e' esattamente cio' che serve per
 * salvare solo quello che cambia.
 * ═══════════════════════════════════════════════════════════════════ */

/* Bayer 8×8: la matrice classica, quella delle console. Ottantaquattro
   gradini di soglia invece dei sedici del 4×4 — il reticolo si vede
   ma non fa scacchiera. */
export const BAYER8 = [
  [ 0, 32,  8, 40,  2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44,  4, 36, 14, 46,  6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [ 3, 35, 11, 43,  1, 33,  9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47,  7, 39, 13, 45,  5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

/* Quanto forte spingere la soglia.

   A 34 il retino si vedeva dappertutto e faceva zanzariera: piu' rumore
   della diffusione d'errore, non meno. Il Mega Drive non fa cosi' — fa
   campiture piene con bordi netti, e il retino lo usa solo dove serve
   davvero, sui passaggi. A 8 le pietre e le fiamme tornano solide, la
   luna e' un disco pieno con l'alone a puntini, e il cielo va a fasce
   invece che a brulichio. Scelto guardando, con audit/prova-retino.mjs. */
export const FORZA = 8;

/* Fa il lavoro dentro la pagina di Playwright, che sa decodificare i
   PNG senza aggiungere librerie al progetto. */
/* `riferimento` e `tolleranza` fanno l'isteresi fra fotogrammi.

   Il retino ordinato rende i pixel fermi uguali fra un fotogramma e
   l'altro solo se il colore in ingresso e' identico. Ma un video
   generato ridisegna ogni fotogramma da capo, e anche dove non si
   muove niente il colore balla di un soffio — misurato: 3,5 su 255.
   Vicino al confine fra due pigmenti quel soffio basta a far cambiare
   indice, e cosi' cambiava il 53% dei pixel anche nelle zone ferme.

   Con l'isteresi il pixel guarda prima cosa era nel fotogramma di
   riposo: se il colore nuovo e' ancora abbastanza vicino a quel
   pigmento, se lo tiene. Cambia solo dove il colore si e' mosso
   davvero, cioe' dove si e' mossa la bilancia. */
export async function rimappa(p, pngBase64, { PIGMENTI, LARGO, ALTO, forza = FORZA,
                                              riferimento = null, tolleranza = 46 }) {
  return Uint8Array.from(await p.evaluate(async ({ dati, PIGMENTI, LARGO, ALTO, forza, B, rif, toll }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + dati;
    await img.decode();

    /* Alla misura dello schermo in due passi con un filtro morbido: un
       salto secco da 1920 a 960 perde i dettagli fini — i mattoni, i
       libri sugli scaffali — e resta una poltiglia. */
    const mezzo = document.createElement('canvas');
    mezzo.width = Math.round(LARGO * 1.6); mezzo.height = Math.round(ALTO * 1.6);
    const gm = mezzo.getContext('2d');
    gm.imageSmoothingEnabled = true; gm.imageSmoothingQuality = 'high';
    gm.drawImage(img, 0, 0, mezzo.width, mezzo.height);

    const cv = document.createElement('canvas');
    cv.width = LARGO; cv.height = ALTO;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(mezzo, 0, 0, LARGO, ALTO);
    const d = g.getImageData(0, 0, LARGO, ALTO).data;

    const tri = PIGMENTI.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
    /* La distanza fra colori pesa il verde piu' del blu: l'occhio fa
       cosi', e senza questa correzione i viola scuri finivano sul nero. */
    const vicino = (r, gg, bb) => {
      let best = 0, dmin = Infinity;
      for (let i = 0; i < tri.length; i++) {
        const [pr, pg, pb] = tri[i];
        const rm = (r + pr) / 2, dr = r - pr, dg = gg - pg, db = bb - pb;
        const dd = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
        if (dd < dmin) { dmin = dd; best = i; }
      }
      return best;
    };

    const t2 = toll * toll;
    const out = new Uint8Array(LARGO * ALTO);
    for (let y = 0; y < ALTO; y++)
      for (let x = 0; x < LARGO; x++) {
        const j = y * LARGO + x, k = j * 4;
        /* la soglia della matrice, centrata su zero */
        const s = (B[y & 7][x & 7] / 63 - 0.5) * forza;
        const r = Math.max(0, Math.min(255, d[k] + s));
        const gg = Math.max(0, Math.min(255, d[k + 1] + s));
        const bb = Math.max(0, Math.min(255, d[k + 2] + s));
        if (rif) {
          const [pr, pg, pb] = tri[rif[j]];
          const dd = (r - pr) * (r - pr) + (gg - pg) * (gg - pg) + (bb - pb) * (bb - pb);
          if (dd < t2) { out[j] = rif[j]; continue; }
        }
        out[j] = vicino(r, gg, bb);
      }
    return [...out];
  }, { dati: pngBase64, PIGMENTI, LARGO, ALTO, forza, B: BAYER8,
       rif: riferimento ? [...riferimento] : null, toll: tolleranza }));
}
