# -*- coding: utf-8 -*-
"""I quattro casi: lede e seguito diventano un paragrafo solo.

Ogni caso aveva due paragrafi separati — il "lede" che presenta il
lavoro e il "seguito" che aggiunge una coda. Letti in fila erano quasi
sempre la stessa idea spezzata in due: la prima meta' spiega cosa e',
la seconda aggiunge una sfumatura che poteva stare nella prima frase
con una virgola.

Uniti in un paragrafo solo, piu' corto della somma dei due: si tiene il
fatto piu' forte di ciascuno, si toglie la seconda inquadratura della
stessa idea. Nessun numero cambia — "nove pezzi", "sei documenti",
"quattro rogne diverse" restano tutti, perche' sono la prova, non
l'orpello.

Stesso principio su quattro dettagli minori, segnati uno per uno:
· la didascalia della tavola di riferimento di ESO, che spiegava due
  volte perche' serve una tavola;
· la riga della catena di produzione della Locanda, che elencava
  quattro passaggi con un verbo a testa quando bastavano tre frasi;
· due voci delle tabelle "E poi, di suo" (Union e Locanda), dove una
  frase finale ripeteva un'informazione gia' data sopra;
· la figcaption della tavola ESO.
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

# ══ UNION ═════════════════════════════════════════════════════════════
sostituisci(
'''        <p class="union__lede">Brand identity dentro un marchio che esisteva già. Ho inventato un
          universo parallelo: una cometa a forma di <b>0</b> arriva sulla Terra, azzera le bollette
          di luce e gas e trasforma gli animali in bipedi che parlano. Da lì nascono Davide il lama,
          Luca l’asino e gli altri, che raccontano l’energia pulita senza fare una lezione.</p>
        <p class="union__seguito"><b>La storia è in evoluzione:</b> i personaggi crescono, se ne
          aggiungono di nuovi e i prossimi episodi porteranno diversi colpi di scena.</p>''',
'''        <p class="union__lede">Brand identity dentro un marchio che esisteva già: un universo
          parallelo dove una cometa a forma di <b>0</b> azzera le bollette e trasforma gli animali
          in bipedi che parlano. Da lì nascono Davide il lama, Luca l’asino e gli altri — energia
          pulita raccontata senza fare una lezione, con <b>una storia che continua a crescere</b>.</p>''',
    'union lede+seguito')

sostituisci(
'''          <div><dt>Voci</dt><dd>Una parte generate dentro Omni insieme al video, una parte con
            ElevenLabs quando serve tenere la stessa voce da un episodio all’altro</dd></div>''',
'''          <div><dt>Voci</dt><dd>Generate dentro Omni insieme al video, o con ElevenLabs quando
            serve la stessa voce da un episodio all’altro</dd></div>''',
    'union voci')

# ══ ESOSCHELETRI ══════════════════════════════════════════════════════
sostituisci(
'''        <p class="eso__lede">Esoscheletri attivi per chi fatica a camminare e per chi va in montagna.
          Niente set, niente attori, niente prodotto in mano: <b>il lancio italiano è stato
          costruito tutto a monte</b> — ricerca di mercato, immagini del dispositivo, spot,
          documenti e il sito su cui atterrano le persone.</p>
        <p class="eso__seguito">La parte difficile non è fare un video bello: è che l’oggetto sia
          lo STESSO in tutte le inquadrature, che i numeri tecnici tornino con quelli del
          costruttore, e che il tono regga sia in una palestra di riabilitazione sia su un
          crinale a duemila metri.</p>''',
'''        <p class="eso__lede">Esoscheletri attivi per chi fatica a camminare e per chi va in
          montagna. Niente set, niente attori, niente prodotto in mano: <b>il lancio italiano è
          costruito tutto a monte</b> — ricerca di mercato, immagini del dispositivo, spot, sito.
          La parte difficile: che l’oggetto sia lo STESSO in ogni inquadratura, e il tono regga
          sia in una palestra di riabilitazione sia su un crinale a duemila metri.</p>''',
    'eso lede+seguito')

sostituisci(
'''        <figcaption>Il pezzo di lavoro che tiene in piedi tutto il resto: quattro viste master del
          dispositivo e i dettagli di ogni parte. Senza una tavola così, ogni inquadratura generata
          si inventa un oggetto leggermente diverso — e in due tagli di montaggio diventa evidente
          che il prodotto non esiste.</figcaption>''',
'''        <figcaption>Quattro viste master del dispositivo e i dettagli di ogni parte: senza,
          ogni inquadratura generata si inventa un oggetto leggermente diverso, e in due tagli si
          vede che il prodotto non esiste.</figcaption>''',
    'eso tavola figcaption')

sostituisci(
'''          <div><dt>Ricerca</dt><dd>Prima di tutto il resto: sei documenti di analisi del mercato
            italiano — numeri, concorrenti, canali, prezzi — e da lì i video di approfondimento,
            fatti con NotebookLM</dd></div>''',
'''          <div><dt>Ricerca</dt><dd>Sei documenti di analisi del mercato italiano — numeri,
            concorrenti, canali, prezzi — e i video di approfondimento fatti con NotebookLM</dd></div>''',
    'eso ricerca')

# ══ LOCANDA ═══════════════════════════════════════════════════════════
sostituisci(
'''        <p class="locanda__lede">Un ristorante dentro il parco di un castello, senza un’identità
          sua. Prima il marchio, poi tutto quello che ci sta sopra: una <b>locandina animata per
          ogni serata</b>, dalla degustazione di champagne al fritto misto al karaoke, e cinque
          brani scritti su misura per il posto.</p>
        <p class="locanda__seguito">Serate diverse, pubblico diverso, tono diverso — e si deve
          capire lo stesso, in due secondi su un telefono, che è sempre la stessa casa.</p>''',
'''        <p class="locanda__lede">Un ristorante nel parco di un castello, senza un’identità sua:
          prima il marchio, poi una <b>locandina animata per ogni serata</b> — dalla degustazione
          di champagne al karaoke — e cinque brani scritti su misura. Serate diverse, tono diverso,
          ma in due secondi su un telefono si deve capire che è sempre la stessa casa.</p>''',
    'locanda lede+seguito')

sostituisci(
'''      <p class="caso-firma">Le locandine animate nascono come immagini con <b>GPT Image</b>,
        vengono sistemate in <b>Photoshop</b>, messe in movimento con <b>Grok Video</b> e montate
        in <b>Adobe Premiere Pro</b>, che aggiunge i testi della serata, il prezzo, l’indirizzo e
        il marchio che chiude ogni pezzo.</p>''',
'''      <p class="caso-firma">Le locandine nascono come immagini con <b>GPT Image</b>, si sistemano
        in <b>Photoshop</b>, si muovono con <b>Grok Video</b> e si montano in <b>Adobe Premiere
        Pro</b>, che aggiunge testi, prezzo e il marchio di chiusura.</p>''',
    'locanda caso-firma')

sostituisci(
'''          <div><dt>Musica</dt><dd>Cinque brani generati con Lyria di Google e scritti per il
            posto, non presi da una libreria. Qui ne senti trenta secondi</dd></div>''',
'''          <div><dt>Musica</dt><dd>Cinque brani generati con Lyria di Google, scritti per il
            posto e non presi da una libreria</dd></div>''',
    'locanda musica')

# ══ CETS ══════════════════════════════════════════════════════════════
sostituisci(
'''        <p class="cest__lede">Un centro elaborazione dati per amministratori di condominio:
          antincendio, GSA, rilievi con drone e tutte le gestioni che un amministratore da solo si
          porta dietro la sera. <b>Il marchio non esisteva</b>: prima lo scudo, poi la campagna che
          lo mette in circolo.</p>
        <p class="cest__seguito">Il pubblico è uno e strettissimo — chi amministra condomìni — e non
          compra sogni: compra ore. Perciò ogni pezzo parte da una scadenza vera o da una rogna
          vera, e ognuno arriva alla stessa promessa da una porta diversa.</p>''',
'''        <p class="cest__lede">Un centro elaborazione dati per amministratori di condominio —
          antincendio, GSA, rilievi con drone — e <b>un marchio che non esisteva</b>: prima lo
          scudo, poi la campagna. Il pubblico è uno stretto e non compra sogni, compra ore: ogni
          pezzo parte da una rogna vera e arriva alla stessa promessa da una porta diversa.</p>''',
    'cest lede+seguito')

io.open(f, 'w', encoding='utf-8', newline='\n').write(h)
dopo = len(h.split())
print('index.html: %d parole prima, %d dopo (%d tolte)' % (prima, dopo, prima - dopo))
