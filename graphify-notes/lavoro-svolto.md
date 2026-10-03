# Lavoro svolto sul sito MF/AI

Registro delle modifiche, più recente in fondo.

## 2026-10-03
- Union: cashback aggiunto come primo pezzo (10 pezzi, 4:30 di girato).
- Nous: commenti per zona e sul puntatore (0,1 s), spiegazioni scritte a mano in site/v2/chatbot/nous-spiega.json, testi riscritti sintetici e professionali.
- Didascalie dei video riscritte guardando i fotogrammi (union.js, eso.js, cest.js, locanda.js).
- Studio CETS: il marchio esisteva già, è stato animato e sono stati fatti i video dei servizi.
- Mirino sci-fi ripristinato su desktop, con presa orizzontale sul confine della tendina.
- Testata mobile: Contatti non viene più tagliato.
- Didascalie dei video e delle locandine riscritte per dire a cosa servono (non cosa si vede): union.js, eso.js, cest.js, locanda.js; allineati knowledge.json e questa nota.
- Nous: tre toni (colloquiale, tecnico, IA impazzita) scelti nel benvenuto, 119 voci in site/v2/chatbot/nous-spiega.json; copertura al 100% dei punti testati su desktop; benvenuto accorciato.
- Voce di Nous: sempre sintesi dal vivo con Azure tramite il Worker (voce e velocita per tono: Giuseppe multilingue, Isabella, Diego grave), niente file mp3 registrati; tour in tre toni da chatbot/nous-tour.json; la chat cloud riceve il tono (Worker aggiornato).
- Tono IA impazzita esasperato (testi, tour, frasi, prompt del Worker), voce Azure Isabella per tutti i toni, mirino ridotto a 60 px.
