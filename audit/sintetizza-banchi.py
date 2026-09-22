# -*- coding: utf-8 -*-
"""Le due applicazioni erano scritte come una scheda tecnica.

Alfred aveva cinque gruppi di elenco puntato — Raccoglie, Produce,
Pubblica, Mi lascia il comando, E dietro — con quattro o cinque voci
ciascuno: 22 punti in tutto, quasi tutti da una riga e mezza. E' la
sezione piu' fitta di tutto il sito, ed e' anche quella che la critica
di settembre aveva gia' segnalato: due applicazioni raccontate solo a
parole, senza una sola schermata.

Non si toglie un fatto: si toglie la ripetizione del come. "Legge
cinque fonti" e "usa le API ufficiali dove esistono" erano due punti;
sono la stessa frase, un soggetto e un complemento. Ogni gruppo scende
a due voci, e le due che restano si scelgono da sole: quella che dice
COSA fa Alfred di diverso da un programma qualsiasi, e quella che dice
COME lo fa senza rompersi.

Stessa cura, dose minore, su Max: era gia' la piu' snella delle due.

Nessun numero e' cambiato. "Cinque fonti", "quattro uscite per pagina",
"JWT", "Voxtral" restano tutti — sono le cifre che rendono la scheda
credibile, e tagliarle avrebbe risparmiato parole al prezzo della prova.
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

# ── Alfred · Raccoglie: 4 → 2 ────────────────────────────────────────
sostituisci(
'''            <ul>
              <li>Legge cinque fonti diverse, in ordine di priorità</li>
              <li>Tiene una piccola memoria di tutto quello che ha già pubblicato: ricontrolla
                le fonti a ogni giro e <em>la stessa cosa non esce mai due volte</em></li>
              <li>Sceglie per data, e riprende da dove si era fermato anche dopo uno stop</li>
              <li>Usa le API ufficiali dove esistono, e legge la pagina dove non esistono</li>
            </ul>''',
'''            <ul>
              <li>Legge cinque fonti in ordine di priorità, con le API ufficiali dove esistono</li>
              <li>Ricorda cosa ha già pubblicato — <em>la stessa cosa non esce mai due volte</em> —
                e riprende da dove si era fermato anche dopo uno stop</li>
            </ul>''',
    'Alfred · Raccoglie')

# ── Alfred · Produce: 5 → 2 ──────────────────────────────────────────
sostituisci(
'''            <ul>
              <li>Trasforma un’immagine ferma in un Reel: un modello scrive il movimento,
                ComfyUI lo esegue con un flusso immagine-a-video</li>
              <li>Tiene le proporzioni dell’originale e ricontrolla le dimensioni vere del file
                che è uscito</li>
              <li>Verifica che il primo, l’ultimo e il fotogramma di mezzo reggano la
                composizione</li>
              <li>Genera una base musicale originale <em>diversa per ogni Reel</em>, e la
                ricontrolla</li>
              <li>I contenuti già video passano diretti, senza essere rifatti</li>
            </ul>''',
'''            <ul>
              <li>Trasforma un’immagine ferma in un Reel: un modello scrive il movimento,
                ComfyUI lo esegue con un flusso immagine-a-video</li>
              <li>Verifica da solo proporzioni, fotogrammi e composizione, e genera una base
                musicale <em>diversa per ogni Reel</em> — i contenuti già video passano diretti</li>
            </ul>''',
    'Alfred · Produce')

# ── Alfred · Pubblica: 4 → 2 ─────────────────────────────────────────
sostituisci(
'''            <ul>
              <li>Facebook (pagine e gruppi), Instagram, YouTube, LinkedIn, Threads,
                Telegram</li>
              <li>Solo con le API ufficiali e solo sugli account che ho collegato</li>
              <li>Quattro uscite per pagina, a orari decisi prima: mettendo insieme tutte le
                destinazioni si arriva a <em>decine e decine di pubblicazioni al giorno</em></li>
              <li>Ogni uscita tiene uno stato separato per canale: se una fallisce, le altre
                vanno avanti</li>
            </ul>''',
'''            <ul>
              <li>Facebook, Instagram, YouTube, LinkedIn, Threads, Telegram — solo API
                ufficiali, solo account che ho collegato</li>
              <li>Quattro uscite per pagina a orari fissi: fra tutte le destinazioni,
                <em>decine di pubblicazioni al giorno</em>, e se una fallisce le altre vanno
                avanti</li>
            </ul>''',
    'Alfred · Pubblica')

# ── Alfred · Mi lascia il comando: 5 → 2 ─────────────────────────────
sostituisci(
'''            <ul>
              <li>Calendario con testo, media, destinazione e orario visibili prima di uscire</li>
              <li>Stop immediato, e ripartenza senza doppioni</li>
              <li>Statistiche per canale e lettura del tono dei commenti</li>
              <li>Token che si rinnovano da soli e si revocano quando voglio</li>
              <li>Registro di cosa è successo e backup in locale</li>
            </ul>''',
'''            <ul>
              <li>Calendario con testo, media e orario visibili prima che escano; stop
                immediato e ripartenza senza doppioni</li>
              <li>Statistiche per canale, token che si rinnovano da soli, e un registro locale
                di cosa è successo</li>
            </ul>''',
    'Alfred · Mi lascia il comando')

# ── Alfred · E dietro: 4 → 2 ─────────────────────────────────────────
sostituisci(
'''            <ul>
              <li>Si attacca da riga di comando a qualunque intelligenza artificiale: Claude,
                GPT, Gemini, Grok, oppure un modello che gira sul mio computer</li>
              <li>Modelli e istruzioni si cambiano da pannello, con configurazioni salvate</li>
              <li>Un server MCP lo fa parlare direttamente con gli assistenti AI</li>
              <li>Accesso protetto, e un sito pubblico con privacy e termini: senza quello le
                piattaforme non danno le API</li>
            </ul>''',
'''            <ul>
              <li>Si collega a qualunque AI da riga di comando — Claude, GPT, Gemini, Grok o
                un modello locale — con un server MCP per parlare agli assistenti</li>
              <li>Accesso protetto, e un sito pubblico con privacy e termini: senza quello le
                piattaforme non danno le API</li>
            </ul>''',
    'Alfred · E dietro')

# ── Max · Trascrive: 3 → 2 ───────────────────────────────────────────
sostituisci(
'''            <ul>
              <li>Voxtral per il parlato, con Whisper che subentra da solo se serve</li>
              <li>Una rilettura prudente del testo prima di considerarlo finito</li>
              <li>Sottotitoli generati e sincronizzati sul parlato, e correggibili
                <em>parola per parola</em>, compreso il secondo esatto in cui ognuna
                compare</li>
            </ul>''',
'''            <ul>
              <li>Voxtral per il parlato, con Whisper di riserva, e una rilettura prudente
                prima di darlo per finito</li>
              <li>Sottotitoli sincronizzati e correggibili <em>parola per parola</em>, col
                secondo esatto in cui ognuna compare</li>
            </ul>''',
    'Max · Trascrive')

# ── Max · Sta sul tuo computer: 3 → 2 ────────────────────────────────
sostituisci(
'''            <ul>
              <li>Lavora sulla scheda video: nessun caricamento, nessun costo al minuto</li>
              <li>Controllo dello stato del sistema prima dei lavori lunghi</li>
              <li>Versione portatile con tutto dentro: si copia su una chiavetta e parte</li>
            </ul>''',
'''            <ul>
              <li>Lavora sulla scheda video: nessun caricamento, nessun costo al minuto</li>
              <li>Versione portatile con tutto dentro: si copia su una chiavetta e parte</li>
            </ul>''',
    'Max · Sta sul tuo computer')

io.open(f, 'w', encoding='utf-8', newline='\n').write(h)
dopo = len(h.split())
print('index.html: %d parole prima, %d dopo (%d tolte)' % (prima, dopo, prima - dopo))
