# -*- coding: utf-8 -*-
"""Le sei istruzioni: ogni voce a una frase sola.

Ognuna delle sei aveva due frasi — la prima spiega il gesto, la seconda
ne descrive l'effetto o aggiunge una postilla. Diventano una frase con
un due punti o un trattino in mezzo: l'effetto resta scritto, la
postilla (quando era solo una spiegazione dell'ovvio, tipo "nessuno dei
quattro e' una libreria presa in prestito" dopo aver appena detto
"scritti da zero") no.
"""
import io, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

f = 'site/v2/index.html'
h = io.open(f, encoding='utf-8').read()
prima = len(h.split())

def sostituisci(vecchio, nuovo, nome):
    global h
    assert vecchio in h, 'non trovato: ' + nome
    h = h.replace(vecchio, nuovo, 1)

sostituisci(
'''    <p class="sec__lede">L'ho progettato e scritto io, riga per riga: grafica, animazioni,
      interazioni, codice. Le immagini che vedi non sono file caricati — le disegna il tuo
      browser adesso, e infatti puoi cambiarle. Sotto c'è l'elenco di cosa puoi toccare.
      Tutto quello che cambi resta nel tuo browser: il sito non salva e non manda niente a nessuno.</p>''',
'''    <p class="sec__lede">L'ho progettato e scritto io, riga per riga: grafica, animazioni,
      interazioni, codice. Le immagini che vedi non sono file caricati — le disegna il tuo
      browser adesso, e infatti puoi cambiarle. Tutto quello che cambi resta nel tuo browser:
      il sito non salva e non manda niente a nessuno.</p>''',
    'come sec__lede')

sostituisci(
'''    <li><b class="mono">01</b><h3>Il colore di tutto il sito</h3>
      <p>Sette palette, dai pallini in alto a destra. Ogni colore è calcolato perché il testo
        resti leggibile sia sul fondo scuro sia sulle pagine bianche.</p></li>''',
'''    <li><b class="mono">01</b><h3>Il colore di tutto il sito</h3>
      <p>Sette palette, dai pallini in alto a destra: ognuna calcolata perché il testo resti
        leggibile su fondo scuro e su carta.</p></li>''',
    'istruzione 01')

sostituisci(
'''    <li><b class="mono">02</b><h3>Sposta qualsiasi riquadro</h3>
      <p>Tieni premuto mezzo secondo su una scheda e trascinala dove vuoi: i lavori, i servizi,
        i passi del metodo, gli strumenti. I numeri si riscrivono da soli.</p></li>''',
'''    <li><b class="mono">02</b><h3>Sposta qualsiasi riquadro</h3>
      <p>Tieni premuto mezzo secondo su una scheda e trascinala dove vuoi — lavori, servizi,
        passi del metodo, strumenti — e i numeri si riscrivono da soli.</p></li>''',
    'istruzione 02')

sostituisci(
'''    <li><b class="mono">03</b><h3>Sposta le sezioni intere</h3>
      <p>Tieni premuto sul titolo di una sezione: la pagina si richiude in una mappa e la sposti
        come una carta. Chiaro e scuro devono restare alternati, quindi le caselle dove non si
        può atterrare si spengono da sole.</p></li>''',
'''    <li><b class="mono">03</b><h3>Sposta le sezioni intere</h3>
      <p>Tieni premuto sul titolo di una sezione: la pagina si richiude in una mappa, la sposti
        come una carta, e le caselle dove non può atterrare si spengono da sole.</p></li>''',
    'istruzione 03')

sostituisci(
'''    <li><b class="mono">04</b><h3>Cambia l'impaginazione</h3>
      <p>Sotto tutto il sito ci sono dodici colonne invisibili. Lascia il dito senza trascinare
        e scegli come si dispone quel gruppo: una colonna, due, tre, quattro, o larghezze
        diverse.</p></li>''',
'''    <li><b class="mono">04</b><h3>Cambia l'impaginazione</h3>
      <p>Dodici colonne invisibili sotto tutto il sito: lascia il dito senza trascinare e
        scegli come si dispone quel gruppo, da una colonna a quattro.</p></li>''',
    'istruzione 04')

sostituisci(
'''    <li><b class="mono">05</b><h3>Rigenera le immagini</h3>
      <p>Ogni lavoro ha un <em>seed</em>, il numero da cui nasce. Cambialo e viene fuori
        un'immagine diversa che parla ancora la stessa lingua: è questo che vuol dire avere un
        sistema visivo invece di un pezzo fortunato.</p></li>''',
'''    <li><b class="mono">05</b><h3>Rigenera le immagini</h3>
      <p>Ogni lavoro ha un <em>seed</em>, il numero da cui nasce: cambialo e viene fuori
        un'immagine diversa che parla ancora la stessa lingua — un sistema, non un pezzo
        fortunato.</p></li>''',
    'istruzione 05')

sostituisci(
'''    <li><b class="mono">06</b><h3>Gioca nel laboratorio</h3>
      <p>Quattro giochi completi, scritti da zero e giocabili qui dentro: si sceglie il motore, si
        cambiano le regole e si prova. Nessuno dei quattro è una libreria presa in prestito.</p></li>''',
'''    <li><b class="mono">06</b><h3>Gioca nel laboratorio</h3>
      <p>Quattro giochi scritti da zero, giocabili qui dentro: si sceglie il motore, si cambiano
        le regole, si prova.</p></li>''',
    'istruzione 06')

sostituisci(
'''    <p class="union__lede">Brand identity dentro un marchio che esisteva già: un universo
          parallelo dove una cometa a forma di <b>0</b> azzera le bollette e trasforma gli animali
          in bipedi che parlano. Da lì nascono Davide il lama, Luca l’asino e gli altri — energia
          pulita raccontata senza fare una lezione, con <b>una storia che continua a crescere</b>.</p>''',
'''    <p class="union__lede">Brand identity dentro un marchio che esisteva già: un universo
          parallelo dove una cometa a forma di <b>0</b> azzera le bollette e trasforma gli animali
          in bipedi che parlano — Davide il lama, Luca l’asino e gli altri, energia pulita
          raccontata senza fare una lezione, con <b>una storia che continua a crescere</b>.</p>''',
    'union lede (rifinitura)')

sostituisci(
'''      <p class="caso-firma">I pezzi nascono come immagini con <b>GPT Image</b>, si muovono con
        <b>Gemini Omni</b> — che costruisce anche i personaggi che sembrano persone vere — e si
        montano in <b>Adobe Premiere Pro</b>, dove entrano ritmo, sottotitoli, grafica di campagna
        e outro del marchio.</p>''',
'''      <p class="caso-firma">I pezzi nascono come immagini con <b>GPT Image</b>, si muovono con
        <b>Gemini Omni</b> — che costruisce anche i personaggi che sembrano persone vere — e si
        montano in <b>Adobe Premiere Pro</b>, con ritmo, sottotitoli e grafica di campagna.</p>''',
    'union caso-firma')

io.open(f, 'w', encoding='utf-8', newline='\n').write(h)
dopo = len(h.split())
print('index.html: %d parole prima, %d dopo (%d tolte)' % (prima, dopo, prima - dopo))
