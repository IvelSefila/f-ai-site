# -*- coding: utf-8 -*-
"""eso.js non era ancora stato toccato: sei didascalie, tutte intatte.
Piu' un ultimo giro sulle poche rimaste altrove che valeva la pena
stringere.
"""
import io, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def sostituisci(f, vecchio, nuovo, nome):
    s = io.open(f, encoding='utf-8').read()
    assert vecchio in s, 'non trovato: ' + nome
    io.open(f, 'w', encoding='utf-8', newline='\n').write(s.replace(vecchio, nuovo, 1))

sostituisci('site/v2/eso.js',
    "n: 'Ventiquattro secondi che fanno il giro delle tre vite del prodotto: la casa, la palestra di riabilitazione, la montagna.' },",
    "n: 'Ventiquattro secondi nelle tre vite del prodotto: casa, palestra di riabilitazione, montagna.' },",
    "eso trailer")
sostituisci('site/v2/eso.js',
    "n: 'Il verticale per i social: un uomo sale un crinale con l’esoscheletro addosso, e non si vede uno sforzo.' },",
    "n: 'Il verticale per i social: un uomo sale un crinale con l’esoscheletro, senza sforzo visibile.' },",
    "eso trekking")
sostituisci('site/v2/eso.js',
    "n: 'Un borgo italiano in pendenza, la spesa in mano. È l’inquadratura che spiega a chi serve senza dire una parola.' },",
    "n: 'Un borgo in pendenza, la spesa in mano: spiega a chi serve senza dire una parola.' },",
    "eso borgo")
sostituisci('site/v2/eso.js',
    "n: 'Product film: solo l’oggetto, fumo e luce radente. Serve a far vedere com’è fatto quando il resto è narrazione.' },",
    "n: 'Product film: solo l’oggetto, fumo e luce radente — com’è fatto, quando il resto è narrazione.' },",
    "eso prodotto")

sostituisci('site/v2/union.js',
    "n: 'Davide il lama davanti a una pompa di benzina. Il primo dei corti che lo hanno presentato.' },",
    "n: 'Davide il lama davanti a una pompa di benzina, nel primo dei corti che lo presentano.' },",
    "union davide-01")

sostituisci('site/v2/locanda.js',
    "n: 'Dall’alto fino alle luci del dehor, e sull’ultima inquadratura compare la locandina della serata di apertura.' },",
    "n: 'Dall’alto alle luci del dehor: sull’ultima inquadratura compare la locandina della serata di apertura.' },",
    "locanda dehor")

sostituisci('site/v2/cest.js',
    "n: 'Zero giorni liberi, sommerso dalle scartoffie. Parla uno che dice di esserci passato, e finisce con la lista di cosa cambia: niente più caos, tempi dimezzati.' },",
    "n: 'Zero giorni liberi, sommerso dalle scartoffie: parla uno che ci è passato, e finisce con cosa cambia — niente più caos, tempi dimezzati.' },",
    "cest ced-voce")
sostituisci('site/v2/cest.js',
    "n: 'Il logo animato in 16:9: la linea che gira, lo scudo tricolore, il drone che si posa. È la sigla di apertura e di chiusura di tutti gli altri pezzi.' },",
    "n: 'Il logo animato in 16:9: la linea che gira, lo scudo tricolore, il drone che si posa — sigla di apertura e chiusura degli altri pezzi.' },",
    "cest marchio-largo")

print('altre otto didascalie accorciate')
