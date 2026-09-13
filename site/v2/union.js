/* ═══════════════════════════════════════════════════════════════════
 * UNION ENERGIA — i video, e come si aprono
 *
 * Nove video per 4:09 di girato. Gli originali, esportati da Premiere,
 * pesavano 299 MB: a 21 Mbit/s un video da sette secondi fa 17 MB e su
 * un telefono in giro non parte. Rientrati in un riquadro da 1280 e
 * ricodificati a qualita' costante fanno 34,6 MB — l'88% in meno, e a
 * guardarli non si vede la differenza.
 *
 * Ma 34 MB sono comunque troppi da far scaricare a chi passa di qui per
 * leggere. Quindi la pagina non carica NESSUN video: mette una
 * copertina (una cinquantina di KB) e un bottone. Il video nasce al
 * clic, con preload="none", e prima di quel clic dal server non e'
 * uscito un byte di filmato. E' la stessa idea del laboratorio, dove i
 * giochi si scaricano solo se li apri.
 *
 * Uno alla volta: farne partire un secondo ferma il primo. Due video
 * che parlano insieme non sono una scelta, sono una dimenticanza.
 * ═══════════════════════════════════════════════════════════════════ */

/* forma: 'alto' = 9:16 (i social), 'largo' = 16:9.
   Le didascalie descrivono quello che si vede, non quello che mi
   piacerebbe che si vedesse.

   L'ORDINE E' QUELLO DELLA STORIA, non quello delle date: prima i corti
   che presentano Davide, poi Luca, poi la cometa che spiega da dove
   viene tutto, poi i pezzi lunghi. In fondo la locandina e l'unico
   orizzontale. Chi arriva qui non conosce il mondo: se il primo video
   che apre e' quello lungo non capisce chi sono questi animali. */
export const PEZZI = [
  { id: 'davide-01', t: 'Caro benzina', d: '0:04', forma: 'alto',
    n: 'Davide il lama davanti a una pompa di benzina. Il primo dei corti che lo hanno presentato.' },
  { id: 'davide-02', t: 'La bolletta di luce e gas', d: '0:08', forma: 'alto',
    n: 'Davide sulla porta di casa, con la bolletta appena arrivata.' },
  { id: 'luca-asino', t: 'Luca l’asino sommerso', d: '0:07', forma: 'alto',
    n: 'Un salotto sepolto sotto un mare di bollette, e Luca l’asino in mezzo.' },
  { id: 'davide-03', t: 'La cometa a forma di zero', d: '0:12', forma: 'alto',
    n: 'L’origine di tutto: una cometa a forma di 0 entra nell’atmosfera. È il pezzo che spiega da dove nasce il mondo parallelo.' },
  { id: 'insieme', t: 'Insieme si può', d: '1:18', forma: 'alto',
    n: 'Il pezzo lungo: la richiesta di partecipazione e il gancio finale, sottotitolato.' },
  { id: 'bollette-roby', t: 'Rapito dalle bollette', d: '0:30', forma: 'alto',
    n: 'Un uomo sollevato in cielo da un disco volante sopra un prato: le bollette che ti portano via.' },
  { id: 'marco', t: 'Marco', d: '0:35', forma: 'alto',
    n: 'Sembra una ripresa dal vivo in un viale alberato e non lo è: persona, luce e movimento sono generati, con una serie di effetti costruiti per reggere il gancio dei primi secondi.' },
  { id: 'locandina', t: 'Azzeriamola green', d: '0:07', forma: 'alto',
    n: 'La locandina animata della campagna: il payoff, i tre passaggi e l’invito a scrivere.' },
  { id: 'dialogo-roby', t: 'Quanto ti costa la tua casa', d: '1:08', forma: 'largo',
    n: 'Un dialogo fra due persone su una panchina. L’unico orizzontale della serie.' },
];

const CARTELLA = 'lavori/';

export function initUnion() {
  const griglia = document.querySelector('.union__lavori');
  if (!griglia) return 0;

  for (const p of PEZZI) {
    const art = document.createElement('article');
    art.className = 'union__pezzo';
    art.dataset.forma = p.forma;
    art.innerHTML = `
      <button type="button" class="union__via" aria-label="Guarda &quot;${p.t}&quot;, ${p.d}">
        <img class="union__fermo" src="${CARTELLA}${p.id}.jpg" alt=""
             loading="lazy" decoding="async">
        <span class="union__play" aria-hidden="true"></span>
        <span class="union__durata mono" aria-hidden="true">${p.d}</span>
      </button>
      <h4>${p.t}</h4>
      <p>${p.n}</p>`;

    art.querySelector('.union__via').addEventListener('click', (e) => parte(art, p, e.currentTarget));
    griglia.appendChild(art);
  }
  return PEZZI.length;
}

function parte(art, p, bottone) {
  /* uno alla volta */
  for (const altro of document.querySelectorAll('.union__lavori video')) {
    altro.pause();
    const suo = altro.closest('.union__pezzo');
    if (suo !== art) { altro.remove(); suo.classList.remove('in-onda'); }
  }

  const v = document.createElement('video');
  v.src = CARTELLA + p.id + '.mp4';
  v.poster = CARTELLA + p.id + '.jpg';
  v.controls = true;
  v.playsInline = true;
  v.preload = 'none';                 /* niente byte prima del clic */
  v.setAttribute('aria-label', p.t);
  bottone.replaceWith(v);
  art.classList.add('in-onda');
  v.play().catch(() => {
    /* se il browser rifiuta di partire da solo, restano i comandi:
       meglio un video fermo con il tasto play che un errore muto */
  });
}
