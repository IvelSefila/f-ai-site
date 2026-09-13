/* ═══════════════════════════════════════════════════════════════════
 * UNO ALLA VOLTA — fra i casi, non solo dentro un caso
 *
 * Ogni blocco dei casi sapeva gia' fermare i propri video: apri il
 * secondo e il primo si ferma. Nessuno pero' sapeva dell'esistenza
 * degli altri due, e la revisione generale ha trovato la crepa che
 * stava in mezzo: aperti un video di Union Energia, uno degli
 * esoscheletri e uno della Locanda, suonavano tutti e tre insieme, piu'
 * una canzone della Locanda sopra.
 *
 * Qui ogni blocco lascia detto come si ferma. Chi parte chiama
 * soloIo(propria) e gli altri si spengono, senza che nessuno dei tre
 * debba sapere come sono fatti i suoi vicini.
 * ═══════════════════════════════════════════════════════════════════ */

const blocchi = new Set();

/* Si registra la funzione che ferma tutto quello che suona in un
   blocco. Torna indietro la stessa funzione, che serve come nome
   proprio: e' cosi' che soloIo sa chi non deve fermare. */
export function registra(ferma) {
  blocchi.add(ferma);
  return ferma;
}

export function soloIo(mia) {
  for (const ferma of blocchi) if (ferma !== mia) ferma();
}
