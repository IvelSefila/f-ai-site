# -*- coding: utf-8 -*-
"""Secondo giro: ovunque, non solo dove pesava di piu'.

Il primo giro aveva tagliato le due sezioni piu' fitte e lasciato stare
il resto perche' "gia' corto". Ma corto non vuol dire senza grasso: ogni
paragrafo di due frasi che si poteva scrivere in una ne aveva una di
troppo, anche nell'eroe, anche nel profilo, anche nelle parti di banchi
e lavori che il primo giro non aveva toccato.

Stessa regola di prima: si taglia la ripetizione del come, mai una
cifra o un nome di strumento. "38 voci", "cinque fonti", "quattro
rogne diverse" restano tutti.
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

# ══ EROE ══════════════════════════════════════════════════════════════
sostituisci(
'''    <p class="hero__copy">Grafico pubblicitario, video editor e AI builder. Campagne che si declinano su ogni formato, video montati sul ritmo, contenuti social che si producono con continuità, flussi automatici che tolgono di mezzo il lavoro ripetitivo. Strumenti tradizionali e modelli AI, in locale o in cloud: scelgo di volta in volta quello che dà il risultato migliore.</p>''',
'''    <p class="hero__copy">Grafico pubblicitario, video editor e AI builder: campagne su ogni formato, video montati sul ritmo, sistemi social che si producono da soli. Strumenti tradizionali o modelli AI, in locale o in cloud — quello che dà il risultato migliore.</p>''',
    'hero__copy')

sostituisci(
'''    <p class="hero__nota">Questo confine non è un’immagine: è calcolato fotogramma per fotogramma. Trascinalo e decidi quanta macchina entra nel lavoro.</p>''',
'''    <p class="hero__nota">Questo confine non è un’immagine: è calcolato fotogramma per fotogramma — trascinalo e decidi quanta macchina entra nel lavoro.</p>''',
    'hero__nota')

# ══ LAVORI · testata della sezione ═══════════════════════════════════
sostituisci(
'''    <p class="sec__lede">Una campagna con un mondo inventato, il lancio italiano di un prodotto che
      non si poteva fotografare, l’identità di una locanda dentro un castello e un marchio nato da
      zero per chi tiene i conti dei condomìni. Per ognuno c’è il marchio o il personaggio, i pezzi
      finiti che puoi <strong>guardare qui</strong>, e la lista di cosa c’è sotto. Nessun video
      parte da solo: si scarica solo quello che apri.</p>''',
'''    <p class="sec__lede">Un mondo inventato, il lancio di un prodotto che non si poteva
      fotografare, l’identità di una locanda in un castello, un marchio nato da zero per chi
      amministra condomìni. Per ognuno: il marchio, i pezzi finiti da <strong>guardare qui</strong>,
      la lista di cosa c’è sotto. Nessun video parte da solo.</p>''',
    'lavori sec__lede')

# ══ ESO · caso-firma e come/dl ════════════════════════════════════════
sostituisci(
'''      <p class="caso-firma">Le scene nascono come immagini con <b>GPT Image</b>, vengono
        sistemate in <b>Photoshop</b> e montate in <b>Adobe Premiere Pro</b>. Le inquadrature sono
        generate una per una: di una cinquantina di spezzoni ne entra in montaggio meno della
        metà.</p>''',
'''      <p class="caso-firma">Le scene nascono come immagini con <b>GPT Image</b>, si sistemano in
        <b>Photoshop</b> e si montano in <b>Adobe Premiere Pro</b>: inquadrature generate una per
        una, di una cinquantina di spezzoni ne entra meno della metà.</p>''',
    'eso caso-firma')

# ══ CETS · come/dl ════════════════════════════════════════════════════
sostituisci(
'''          <div><dt>Marchio</dt><dd>Scudo, tricolore, palazzo e drone: disegnato da zero e poi
            animato in due formati, 16:9 e 9:16 — due montaggi, non un ritaglio</dd></div>
          <div><dt>Campagna</dt><dd>Quattro pezzi che partono da quattro rogne diverse dello stesso
            mestiere, non quattro versioni dello stesso spot: la scadenza di legge, il servizio per
            intero, la testimonianza e il prima‑e‑dopo muto</dd></div>''',
'''          <div><dt>Marchio</dt><dd>Scudo, tricolore, palazzo e drone: disegnato da zero, animato
            in due formati — due montaggi, non un ritaglio</dd></div>
          <div><dt>Campagna</dt><dd>Quattro rogne diverse dello stesso mestiere, non quattro
            versioni dello stesso spot: la scadenza di legge, il servizio intero, la testimonianza,
            il prima‑e‑dopo muto</dd></div>''',
    'cest come/dl')

# ══ BANCHI · testata, appmie, sotto il cofano ═════════════════════════
sostituisci(
'''    <p class="sec__lede">Qui sotto c'è cosa consegno per ognuna delle quattro. E per ognuna c'è
      uno strumento che funziona davvero: muovi le leve e cambia il lavoro, non la descrizione
      del lavoro.</p>''',
'''    <p class="sec__lede">Qui sotto c'è cosa consegno per ognuna delle quattro, e uno strumento
      che funziona davvero: muovi le leve e cambia il lavoro, non la descrizione del lavoro.</p>''',
    'banchi sec__lede')

sostituisci(
'''      <p class="appmie__lede">Non sono dimostrazioni fatte per il portfolio: sono programmi nati
        perché quello che mi serviva non esisteva, o costava un abbonamento al mese per una
        funzione sola. Sono anche la risposta più diretta alla domanda «ma tu cosa sai
        costruire».</p>''',
'''      <p class="appmie__lede">Non sono dimostrazioni per il portfolio: sono nati perché quello
        che mi serviva non esisteva, o costava un abbonamento al mese per una funzione sola — la
        risposta più diretta a «ma tu cosa sai costruire».</p>''',
    'appmie__lede')

sostituisci(
'''        <p class="appmie__cos">Un’applicazione web che porta i miei canali social dall’inizio alla
          fine: legge le fonti, sceglie cosa vale, produce i video, mette tutto in calendario e
          pubblica. Ogni passaggio resta visibile e fermabile — non è una scatola nera che posta
          da sola.</p>''',
'''        <p class="appmie__cos">Un’applicazione web che porta i miei canali social dall’inizio
          alla fine: legge le fonti, sceglie cosa vale, produce i video, pubblica. Ogni passaggio
          resta visibile e fermabile — non è una scatola nera.</p>''',
    'appmie__cos Alfred')

sostituisci(
'''        <p class="appmie__cos">Un’applicazione per Windows che scarica video autorizzati e ne
          ricava trascrizione e sottotitoli. Gira tutta sul computer: i materiali non vengono
          caricati da nessuna parte, e non c’è un costo al minuto.</p>''',
'''        <p class="appmie__cos">Un’applicazione per Windows che scarica video autorizzati e ne
          ricava trascrizione e sottotitoli — tutta sul computer, senza caricamenti né costo al
          minuto.</p>''',
    'appmie__cos Max')

# ══ REGIA ═════════════════════════════════════════════════════════════
sostituisci(
'''    <p class="sec__lede">La domanda che mi fanno tutti è quanta AI c’è dentro un lavoro. Qui la
      risposta si vede: trascina la testina, a sinistra c’è quello che decido io, a destra quello
      che genera il sistema. Cambia <strong>l’immagine vera</strong>, non una barra di
      avanzamento — e sotto resta scritta ogni decisione presa.</p>''',
'''    <p class="sec__lede">La domanda che mi fanno tutti è quanta AI c’è in un lavoro: qui si vede,
      trascinando la testina fra quello che decido io e quello che genera il sistema — cambia
      <strong>l’immagine vera</strong>, non una barra di avanzamento.</p>''',
    'regia sec__lede')

sostituisci(
'''    <p class="sec__lede">Le stesse cinque fasi del pannello, tutte insieme: l’input entra in
      cima e lo vedi attraversarle, con lo stato che cambia a ogni passaggio.</p>''',
'''    <p class="sec__lede">Le stesse cinque fasi del pannello, in fila: l’input entra in cima e
      lo vedi attraversarle.</p>''',
    'regia metodo sec__lede')

sostituisci(
'''    <p class="sec__lede">Queste tre non sono immagini caricate: <strong>le disegna questa pagina,
      adesso</strong>. Ognuna nasce da un numero, il seed. Cambialo e ne esce un’altra, diversa ma
      della stessa famiglia — e fra sei mesi ne escono altre che stanno ancora insieme a queste.</p>''',
'''    <p class="sec__lede">Queste tre non sono immagini caricate: <strong>le disegna questa
      pagina, adesso</strong>, da un numero — il seed. Cambialo e ne esce un’altra, diversa ma
      della stessa famiglia.</p>''',
    'regia immagini sec__lede')

# ══ TECNOLOGIA ════════════════════════════════════════════════════════
sostituisci(
'''    <p class="sec__lede">Ho una workstation su cui installo, confronto e integro modelli. Scelgo fra locale, cloud e ibrido su assi vere — e i numeri qui sotto sono dichiarati per quello che sono: <strong>stime dalla mia esperienza</strong>, non misure di laboratorio.</p>''',
'''    <p class="sec__lede">Installo, confronto e integro modelli su una workstation mia. Scelgo fra locale, cloud e ibrido su assi vere — i numeri sotto sono <strong>stime dalla mia esperienza</strong>, non misure di laboratorio.</p>''',
    'tecnologia sec__lede')

# ══ PROFILO ═══════════════════════════════════════════════════════════
sostituisci(
'''      <p class="profilo__lead">Vengo dalla grafica e dal montaggio, e ci sono arrivato prima che
        esistessero questi strumenti. È la ragione per cui non mi impressionano: so ancora
        distinguere un lavoro finito da un lavoro che sembra finito.</p>''',
'''      <p class="profilo__lead">Vengo dalla grafica e dal montaggio, prima che esistessero questi
        strumenti: per questo non mi impressionano — so distinguere un lavoro finito da uno che
        sembra finito.</p>''',
    'profilo lead')

sostituisci(
'''      <p>Il valore non è “usare l’AI”, ma sapere quale usare, quando evitarla e come dirigere il
        risultato. Quello che vedi in questa pagina — i lavori, gli strumenti, le due applicazioni
        — è tutto lavoro mio, e questo è il modo più onesto che ho trovato per mostrarlo.</p>''',
'''      <p>Il valore non è “usare l’AI”, ma sapere quale usare, quando evitarla e come dirigere il
        risultato. Quello che vedi qui — lavori, strumenti, le due applicazioni — è tutto lavoro
        mio: il modo più onesto che ho trovato per mostrarlo.</p>''',
    'profilo secondo paragrafo')

# ══ CONTATTO ══════════════════════════════════════════════════════════
sostituisci(
'''  <p class="contatto__come">Rispondi a quello che sai già e salta il resto: alla fine ti ritrovi
    un testo pronto da copiare e mandarmi. Si compila <strong>nel tuo browser</strong>, il sito
    non lo salva e non lo invia.</p>''',
'''  <p class="contatto__come">Rispondi a quello che sai già, salta il resto: un testo pronto da
    copiare e mandarmi, compilato <strong>nel tuo browser</strong> — il sito non lo salva né lo
    invia.</p>''',
    'contatto__come')

io.open(f, 'w', encoding='utf-8', newline='\n').write(h)
dopo = len(h.split())
print('index.html: %d parole prima, %d dopo (%d tolte)' % (prima, dopo, prima - dopo))
