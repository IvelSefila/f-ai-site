# -*- coding: utf-8 -*-
"""L'onda d'oro passa e svanisce, invece di restare.

Quando le stanze erano disegnate a codice, l'oro che restava dov'era
passato il dito era una bella idea: il quadro portava i segni di chi
ci aveva giocato. Su un fondale dipinto e' un'altra cosa — e' una
chiazza sulla foto, e infatti me l'hanno segnalata cosi'.

Avevo gia' provato a salvarla facendola a vene invece che a macchia
piena. Non bastava: il problema non era la forma, era che restava.

Ora ogni onda ha la sua vita — si allarga, brilla, e sbiadisce fino a
sparire. Sparisce anche la mappa da mezzo megabyte per stanza che
teneva il conto, e con otto stanze erano quattro megabyte di memoria
buttati per tenere delle macchie.
"""
import io

P = 'site/pixel/gioco.js'
s = io.open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s


def n(t):
    return t.replace('\n', '\r\n') if crlf else t


def scambia(v, nu, cosa):
    global s
    a = n(v)
    assert s.count(a) == 1, 'non trovato: ' + cosa
    s = s.replace(a, n(nu))


scambia('''/* ── LA TRASMUTAZIONE ─────────────────────────────────────────────
   Il clic non fa solo cambiare stato: cambia l'immagine. Un'onda parte
   dal dito e, mentre si allarga, trasmuta i pigmenti che incontra verso
   la famiglia dell'oro — conservando le luci e le ombre, perche' la
   tabella accoppia i colori per luminosita'.
   Il cambiamento resta: ogni stanza tiene una mappa di quello che e'
   stato trasmutato, e "Rigenera il mondo" la azzera. Cosi' il quadro
   porta i segni di chi ci ha giocato. */
const trasmutate = new Map();          /* id stanza → Uint8Array o null */
const onde = [];                       /* { id, x, y, r, max } in pixel veri */

function mappaDi(id) {
  if (!trasmutate.has(id)) trasmutate.set(id, new Uint8Array(sc.rw * sc.rh));
  return trasmutate.get(id);
}

export function trasmuta(xLog, yLog) {
  onde.push({ id: STANZE[Math.max(0, S.stanza)].id,
              x: xLog * SCALA, y: yLog * SCALA, r: 0, max: 46 * SCALA });
}''',
'''/* ── LA TRASMUTAZIONE ─────────────────────────────────────────────
   Il clic non fa solo cambiare stato: cambia l'immagine. Un'onda parte
   dal dito e, mentre si allarga, trasmuta i pigmenti che incontra verso
   la famiglia dell'oro — conservando le luci e le ombre, perche' la
   tabella accoppia i colori per luminosita'.

   Prima il cambiamento restava: ogni stanza teneva una mappa di quello
   che era stato trasmutato, e il quadro portava i segni di chi ci
   aveva giocato. Con le stanze disegnate a codice era una bella idea.
   Sui fondali dipinti e' una chiazza sulla foto, ed e' esattamente
   cosi' che me l'hanno segnalata. Avevo gia' provato a salvarla
   facendola a vene invece che a macchia piena: non bastava, perche' il
   problema non era la forma ma il fatto che restasse.

   Ora l'onda ha una vita: si allarga, brilla, e sbiadisce fino a
   sparire. Resta il gesto, sparisce la cicatrice. E sparisce anche la
   mappa da mezzo mega per stanza che teneva il conto — con otto stanze
   erano quattro megabyte di memoria per ricordare delle macchie. */
const onde = [];        /* { id, x, y, t } in pixel veri, t in secondi */
const CRESCITA = 0.42;  /* quanto ci mette il fronte ad arrivare in fondo */
const SVANIRE  = 1.15;  /* e quanto ci mette poi a sbiadire */
const RAGGIO   = 46;    /* in coordinate logiche */

export function trasmuta(xLog, yLog) {
  onde.push({ id: STANZE[Math.max(0, S.stanza)].id,
              x: xLog * SCALA, y: yLog * SCALA, t: 0 });
}''',
        'la testa della trasmutazione')

scambia('''/* l'onda avanza: scrive nella mappa una corona di pixel trasmutati */
function avanzaOnde(dt) {
  for (let k = onde.length - 1; k >= 0; k--) {
    const o = onde[k];
    const r0 = o.r;
    o.r = Math.min(o.max, o.r + dt * 190 * SCALA);
    const m = mappaDi(o.id);
    const y0 = Math.max(0, Math.floor(o.y - o.r)), y1 = Math.min(sc.rh, Math.ceil(o.y + o.r));
    const x0 = Math.max(0, Math.floor(o.x - o.r)), x1 = Math.min(sc.rw, Math.ceil(o.x + o.r));
    const R1 = o.r * o.r, R0 = r0 * r0;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const d2 = (x - o.x) * (x - o.x) + (y - o.y) * (y - o.y);
        if (d2 > R1 || d2 < R0) continue;
        /* A chiazza piena sembrava una macchia. Qui la densita' cala
           dal centro al bordo e passa da un retino irregolare: l'oro
           si insinua per vene, come farebbe un metallo dentro la
           pietra, e sotto continua a vedersi il disegno. */
        const q = 1 - Math.sqrt(d2) / o.max;
        const grana = ((x * 7 + y * 13 + ((x >> 2) * (y >> 2))) & 15) / 16;
        if (grana < q * 0.92) m[y * sc.rw + x] = 1;
      }
    if (o.r >= o.max) onde.splice(k, 1);
  }
}''',
'''/* le onde invecchiano, e quando hanno finito se ne vanno */
function avanzaOnde(dt) {
  for (let k = onde.length - 1; k >= 0; k--)
    if ((onde[k].t += dt) > CRESCITA + SVANIRE) onde.splice(k, 1);
}''',
        'avanzamento delle onde')

scambia('''function applicaTrasmutazione(id, t) {
  const m = trasmutate.get(id);
  if (!m) return;
  const b = sc.buf;
  for (let i = 0; i < b.length; i++) if (m[i]) b[i] = VERSO_ORO[b[i]];
  /* il bordo delle onde ancora vive brilla */
  for (const o of onde) {
    if (o.id !== id) continue;
    const q = 1 - o.r / o.max;
    sc.alone(o.x / SCALA, o.y / SCALA, o.r / SCALA + 3, C.CALCE, 0.30 * q);
  }
}''',
'''function applicaTrasmutazione(id, t) {
  if (!onde.length) return;
  const b = sc.buf, R = RAGGIO * SCALA;
  for (const o of onde) {
    if (o.id !== id) continue;
    const cresciuta = Math.min(1, o.t / CRESCITA);
    const viva = 1 - Math.max(0, o.t - CRESCITA) / SVANIRE;
    if (viva <= 0) continue;
    const fronte = R * cresciuta;
    const y0 = Math.max(0, Math.floor(o.y - fronte)), y1 = Math.min(sc.rh, Math.ceil(o.y + fronte));
    const x0 = Math.max(0, Math.floor(o.x - fronte)), x1 = Math.min(sc.rw, Math.ceil(o.x + fronte));
    const F2 = fronte * fronte;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const d2 = (x - o.x) * (x - o.x) + (y - o.y) * (y - o.y);
        if (d2 > F2) continue;
        /* La densita' cala dal centro al bordo e passa da un retino
           irregolare: l'oro si insinua per vene, come farebbe un
           metallo dentro la pietra, e sotto continua a vedersi il
           disegno. Poi `viva` lo riassorbe. */
        const q = (1 - Math.sqrt(d2) / R) * viva;
        const grana = ((x * 7 + y * 13 + ((x >> 2) * (y >> 2))) & 15) / 16;
        const i = y * sc.rw + x;
        if (grana < q * 0.92) b[i] = VERSO_ORO[b[i]];
      }
    /* il fronte brilla mentre corre */
    if (cresciuta < 1)
      sc.alone(o.x / SCALA, o.y / SCALA, fronte / SCALA + 3, C.CALCE, 0.30 * (1 - cresciuta));
  }
}''',
        'applicazione della trasmutazione')

scambia("export function azzeraTrasmutazioni() { trasmutate.clear(); onde.length = 0; }",
        "export function azzeraTrasmutazioni() { onde.length = 0; }",
        'azzeramento')

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print("l'onda passa e svanisce")
