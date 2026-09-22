# -*- coding: utf-8 -*-
"""Le didascalie sotto le copertine: tagliate solo le piu' lunghe.

Trenta video, trenta didascalie da una riga: la maggior parte era gia'
minima e li' non si tocca. Si accorciano solo le nove che superavano le
venti parole — spesso perche' avevano una seconda frase che spiegava
l'ovvio ("e' il pezzo che...") invece di aggiungere un'informazione.
"""
import io, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def sostituisci(f, vecchio, nuovo, nome):
    s = io.open(f, encoding='utf-8').read()
    assert vecchio in s, 'non trovato: ' + nome
    io.open(f, 'w', encoding='utf-8', newline='\n').write(s.replace(vecchio, nuovo, 1))

# ── union.js ──────────────────────────────────────────────────────────
sostituisci('site/v2/union.js',
    "n: 'L’origine di tutto: una cometa a forma di 0 entra nell’atmosfera. È il pezzo che spiega da dove nasce il mondo parallelo.' },",
    "n: 'L’origine di tutto: una cometa a forma di 0 entra nell’atmosfera, e nasce il mondo parallelo.' },",
    "union davide-03")
sostituisci('site/v2/union.js',
    "n: 'Sembra una ripresa dal vivo in un viale alberato e non lo è: persona, luce e movimento sono generati, con una serie di effetti costruiti per reggere il gancio dei primi secondi.' },",
    "n: 'Sembra una ripresa dal vivo in un viale alberato e non lo è: persona, luce e movimento sono tutti generati.' },",
    "union marco")

# ── locanda.js ────────────────────────────────────────────────────────
sostituisci('site/v2/locanda.js',
    "n: 'Il giro della casa: il calice, il parco, la corte del castello e la scritta che chiude. Serve a far capire dove ci si siede.' },",
    "n: 'Il giro della casa: calice, parco, corte del castello e la scritta che chiude — dove ci si siede.' },",
    "locanda posto")
sostituisci('site/v2/locanda.js',
    "n: 'Una scheda per ogni champagne in degustazione. Stessa impaginazione, contenuto diverso: è il pezzo che dimostra che c’è un sistema, non una grafica sola.' },",
    "n: 'Una scheda per ogni champagne in degustazione: stessa impaginazione, contenuto diverso — il sistema, non una grafica sola.' },",
    "locanda tradition")
sostituisci('site/v2/locanda.js',
    "n: 'Una giornata nel parco del castello fra trattamento viso e buffet: un servizio che non c’entra niente col resto e deve sembrare comunque della stessa casa.' },",
    "n: 'Una giornata fra trattamento viso e buffet nel parco: un servizio fuori tema che deve sembrare comunque la stessa casa.' },",
    "locanda benessere")

# ── cest.js ───────────────────────────────────────────────────────────
sostituisci('site/v2/cest.js',
    "n: 'Una scintilla dentro un quadro elettrico, poi la data: da fine settembre la manutenzione antincendio la può firmare solo un tecnico qualificato. È il pezzo che ha un motivo per essere guardato adesso.' },",
    "n: 'Una scintilla in un quadro elettrico, poi la data: da fine settembre la manutenzione antincendio la firma solo un tecnico qualificato.' },",
    "cest antincendio")
sostituisci('site/v2/cest.js',
    "n: 'Il giro completo: la firma che non copre, la rivalsa, il rilievo con drone, e alla fine lo scudo. Il pezzo lungo, quello che si manda a chi ha già chiesto.' },",
    "n: 'Il giro completo: la firma che non copre, la rivalsa, il rilievo con drone, lo scudo — il pezzo da mandare a chi ha già chiesto.' },",
    "cest amministratori")
sostituisci('site/v2/cest.js',
    "n: 'Stessa promessa senza una parola detta: i fogli che sommergono la scrivania, poi lo stesso uomo che esce dallo studio. Il taglio da mettere in cima a una campagna.' },",
    "n: 'Stessa promessa senza parole: i fogli che sommergono la scrivania, poi lo stesso uomo che esce dallo studio.' },",
    "cest ced-vita")
sostituisci('site/v2/cest.js',
    "n: 'La versione 9:16 per le storie. Non è il 16:9 ritagliato: l’aria intorno allo scudo si sposta dai lati a sopra e sotto, se no lo scudo resta minuscolo in mezzo.' },",
    "n: 'La versione 9:16 per le storie: non il 16:9 ritagliato, ma l’aria ridistribuita sopra e sotto — se no lo scudo resta minuscolo.' },",
    "cest marchio-alto")

print('nove didascalie video accorciate')
