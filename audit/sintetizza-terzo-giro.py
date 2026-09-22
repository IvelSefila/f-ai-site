# -*- coding: utf-8 -*-
"""Terzo giro: le schede tecniche e i pezzi rimasti indietro.

"Sotto il cofano" di Alfred e Max erano liste dt/dd gia' brevi, ma ogni
dd aveva ancora una clausola di troppo. Le quattro schede dei servizi
in cima a banchi avevano descrizioni a una frase che si potevano dire
in mezza. E in laboratorio la testata ripeteva "sedici domande" due
volte in due frasi vicine.
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

# ══ offerta · le quattro schede dei servizi ═══════════════════════════
sostituisci(
'''        <p>Creo la direzione visiva e la porto nei formati che servono alla campagna.</p>''',
'''        <p>Creo la direzione visiva e la porto nei formati della campagna.</p>''',
    'offerta grafica')
sostituisci(
'''        <p>Costruisco ritmo, racconto e finitura con riprese esistenti, materiali creati o generazione assistita.</p>''',
'''        <p>Costruisco ritmo, racconto e finitura con riprese esistenti o generazione assistita.</p>''',
    'offerta video')
sostituisci(
'''        <p>Trasformo una direzione creativa in format riconoscibili e facili da produrre con continuità.</p>''',
'''        <p>Trasformo una direzione creativa in format riconoscibili, facili da produrre con continuità.</p>''',
    'offerta social')
sostituisci(
'''        <p>Collego strumenti, passaggi e controlli umani per ridurre il lavoro ripetitivo e verificare rapidamente nuove idee.</p>''',
'''        <p>Collego strumenti e controlli umani per ridurre il lavoro ripetitivo e provare nuove idee in fretta.</p>''',
    'offerta ai')

# ══ Alfred · sotto il cofano ══════════════════════════════════════════
sostituisci(
'''            <div><dt>Impianto</dt><dd>Python con FastAPI e Uvicorn per l’API e il pannello,
              APScheduler per gli orari, PostgreSQL per i dati, Docker per farlo girare uguale
              ovunque</dd></div>
            <div><dt>Browser</dt><dd>Playwright con anti-rilevamento, e Selenium dove
              serve</dd></div>
            <div><dt>Sicurezza</dt><dd>Accesso con JWT, password e segreti cifrati, un lucchetto
              sui file perché due lavori non si pestino i piedi</dd></div>''',
'''            <div><dt>Impianto</dt><dd>Python con FastAPI e Uvicorn, APScheduler per gli orari,
              PostgreSQL per i dati, Docker per farlo girare uguale ovunque</dd></div>
            <div><dt>Browser</dt><dd>Playwright con anti-rilevamento, Selenium dove serve</dd></div>
            <div><dt>Sicurezza</dt><dd>Accesso con JWT, segreti cifrati, un lucchetto sui file
              perché due lavori non si pestino i piedi</dd></div>''',
    'Alfred sotto il cofano')

# ══ Max · sotto il cofano ═════════════════════════════════════════════
sostituisci(
'''            <div><dt>Interfaccia</dt><dd>Tauri 2 con React e TypeScript: un’applicazione desktop
              vera, non una pagina web travestita da programma</dd></div>
            <div><dt>Motore</dt><dd>Python, e la scheda video del PC via CUDA</dd></div>
            <div><dt>Rilettura</dt><dd>Un’AI da riga di comando ripassa il testo trascritto,
              con la mano leggera: corregge, non riscrive</dd></div>
            <div><dt>Consegna</dt><dd>Build portatile con runtime, binari e modelli dentro: si
              copia e parte</dd></div>''',
'''            <div><dt>Interfaccia</dt><dd>Tauri 2 con React e TypeScript: applicazione desktop
              vera, non una pagina web travestita</dd></div>
            <div><dt>Motore</dt><dd>Python, scheda video del PC via CUDA</dd></div>
            <div><dt>Rilettura</dt><dd>Un’AI da riga di comando ripassa il testo con mano
              leggera: corregge, non riscrive</dd></div>
            <div><dt>Consegna</dt><dd>Build portatile con runtime e modelli dentro: si copia e
              parte</dd></div>''',
    'Max sotto il cofano')

# ══ ESO · come/dl residuo ═════════════════════════════════════════════
sostituisci(
'''          <div><dt>Prodotto</dt><dd>Una tavola di riferimento con quattro viste, perché il
            dispositivo sia identico in ogni inquadratura</dd></div>
          <div><dt>Sito</dt><dd>Scritto in codice su misura, non montato su un tema: schede
            tecniche, configuratore, dati di mercato e modulo di pre-ordine</dd></div>''',
'''          <div><dt>Prodotto</dt><dd>Una tavola con quattro viste, perché il dispositivo sia
            identico in ogni inquadratura</dd></div>
          <div><dt>Sito</dt><dd>Codice su misura, non un tema: schede tecniche, configuratore,
            dati di mercato, modulo di pre-ordine</dd></div>''',
    'eso come/dl residuo')

# ══ LABORATORIO · testata ═════════════════════════════════════════════
sostituisci(
'''    <p class="sec__lede">Quattro giochi originali che girano dentro questa pagina, più un
      costruttore che te ne fa uno rispondendo a sedici domande. Non è un passatempo: se so
      scrivere un motore che risponde al dito in sedici millesimi di secondo, so costruire anche
      l’applicazione o il configuratore che ti serve.</p>''',
'''    <p class="sec__lede">Quattro giochi originali dentro questa pagina, più un costruttore che
      ne fa uno in sedici domande. Non è un passatempo: se so scrivere un motore che risponde al
      dito in sedici millesimi di secondo, so costruire l’applicazione che ti serve.</p>''',
    'laboratorio sec__lede')

io.open(f, 'w', encoding='utf-8', newline='\n').write(h)
dopo = len(h.split())
print('index.html: %d parole prima, %d dopo (%d tolte)' % (prima, dopo, prima - dopo))
