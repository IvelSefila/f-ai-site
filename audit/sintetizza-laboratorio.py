# -*- coding: utf-8 -*-
"""Il laboratorio ripeteva le quattro schede appena viste.

Le quattro card sopra dicono gia' "Trama / Piega / Flusso / Coro" coi
loro verbi ("Tendi/allinea/stabilizza" eccetera). Il primo paragrafo di
.lab__intro rifaceva lo stesso elenco in prosa — "Trama governa
tensioni, Piega deforma membrane..." — una frase in piu' per dire una
cosa che l'occhio ha appena letto in quattro riquadri. Tolto.

E la sec__lede di "Materia" era una catena di quattro proposizioni;
diventa due frasi che tengono l'idea (la stessa sostanza, non tre
immagini diverse) e l'esempio pratico (costa meno la seconda
declinazione), senza il passaggio di mezzo che le collegava a parole.
"""
import io, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

f = 'site/v2/index.html'
h = io.open(f, encoding='utf-8').read()
prima = len(h.split())

v = '''  <div class="lab__intro">
    <p class="mono">Trama / Piega / Flusso / Coro / Tela 2D / Gesti diretti / Sessione locale</p>
    <h3>Nuovi gesti. Nuove forme.<br><em>Risposte chiare.</em></h3>
    <p>Trama governa tensioni, Piega deforma membrane, Flusso compone correnti e Coro accorda cerchi. Ogni gioco usa gesti diretti e un linguaggio visivo diverso.</p>
    <p>Parti da uno stile pronto in pochi secondi oppure rispondi a sedici domande semplici e crea il tuo gioco.</p>
  </div>'''
n = '''  <div class="lab__intro">
    <p class="mono">Trama / Piega / Flusso / Coro / Tela 2D / Gesti diretti / Sessione locale</p>
    <h3>Nuovi gesti. Nuove forme.<br><em>Risposte chiare.</em></h3>
    <p>Parti da uno stile pronto in pochi secondi oppure rispondi a sedici domande semplici e crea il tuo gioco.</p>
  </div>'''
assert v in h, 'lab__intro non trovato'
h = h.replace(v, n, 1)

v = '''    <p class="sec__lede">Dodicimila punti presi da un’immagine vera, ognuno col colore del pixel
      da cui viene. Cambia disposizione e li vedi riorganizzarsi: è la stessa sostanza in un altro
      ordine, non tre immagini in dissolvenza. Detta in pratica — lo stesso materiale lo porto da
      un formato all’altro senza rifarlo da capo, ed è per questo che la seconda declinazione di
      una campagna costa meno della prima.</p>'''
n = '''    <p class="sec__lede">Dodicimila punti presi da un’immagine vera, ognuno col colore del pixel
      da cui viene: cambia disposizione e li vedi riorganizzarsi, la stessa sostanza in un altro
      ordine, non tre immagini in dissolvenza. Lo stesso materiale lo porto da un formato
      all’altro senza rifarlo da capo — per questo la seconda declinazione costa meno della
      prima.</p>'''
assert v in h, 'materia sec__lede non trovato'
h = h.replace(v, n, 1)

io.open(f, 'w', encoding='utf-8', newline='\n').write(h)
dopo = len(h.split())
print('index.html: %d parole prima, %d dopo (%d tolte)' % (prima, dopo, prima - dopo))
