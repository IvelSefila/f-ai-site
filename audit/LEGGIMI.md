# Cosa c'è dentro questa cartella

Centocinquantadue script, e non sono tutti la stessa cosa. Alcuni
guardano il sito e dicono se va bene. Altri **fabbricano** roba: alcuni
spendono crediti veri, altri vogliono argomenti sulla riga di comando e
senza si piantano.

La differenza non si vedeva da fuori, e lanciandoli tutti in fila per la
revisione generale ne è partito uno che genera video: ventiquattro
crediti Higgsfield spesi per niente. Adesso quello chiede conferma, e
questa pagina dice chi è chi.

## I controlli — si possono lanciare tutti, non costano niente

Serve il server sulla porta 8899 (`python server.py` dalla cartella
`site/`, o quello che c'è già acceso).

| script | cosa guarda |
|---|---|
| `revisione.mjs` | **passa su tutto e cerca i guai**: link morti, id doppi, richieste fallite, casi che suonano insieme, pagina a JS spento, peso e velocità |
| `stress.mjs` | **prova a romperlo**: 320px, doppi clic, colonne cambiate mentre un video suona, ordine spostato e ricaricato, avanti e indietro |
| `v2.mjs` `v2mob.mjs` `v2click.mjs` | il sito intero, sul telefono, e dopo una serie di clic |
| `v2a11y.mjs` | contrasti e accessibilità, leggendo il foglio di stile |
| `contrasto-vero.mjs` | contrasti misurati **sui pixel**, sulle tre lastre dei casi |
| `amichevole.mjs` | corpo del testo, bersagli, righe troppo lunghe, graffe del CSS |
| `union.mjs` `eso.mjs` `locanda.mjs` | i tre casi: pezzi, copertine, un video alla volta |
| `scalette.mjs` | che gli elenchi nell'HTML non si allontanino dai moduli |
| `colonne-tengono.mjs` | sette gruppi per sette preset per tre larghezze |
| `sposta-tutto.mjs` | che spostando i blocchi non si rompa niente |
| `strumenti.mjs` | che tutte le schede degli strumenti si aprano |
| `radice.mjs` `solo-tuo.mjs` | la radice porta al sito; quello che uno cambia lo vede solo lui |
| `v2brief.mjs` `v2lab.mjs` `v2mat.mjs` | brief, laboratorio, materia |
| `finale.mjs` `mobile.mjs` `mobile-touch.mjs` | quattro larghezze, col dito |

## Le macchine — fabbricano, non controllano

**Costano crediti Higgsfield.** Non partono da sole: chiedono conferma.

- `due-video.mjs` — 24 crediti. `--spendi` per farlo partire davvero.
- `video-stadera.mjs`, `bilancia-fotogrammi.mjs`, `stanze-prompt.mjs` — generano materiale per la torre.

**Non costano ma vogliono argomenti** (senza, si piantano e basta):
`che-resta.mjs`, `fascia.mjs`, `guarda-oggetto.mjs`, `identiche.mjs`,
`quali-pigmenti.mjs`, `rifila.mjs`, `rimetti-altezza.mjs`,
`ritaglio.mjs`.

**Preparano i file del sito** (da rilanciare solo se cambia il materiale
di partenza):
`porta-i-lavori.py`, `porta-la-locanda.py`, `porta-eso.py`,
`porta-il-marchio.py`, `porta-il-prodotto.py`, `scontorna-davide.py`,
`provini-locanda.py`, `provini-eso.py`, `misura-locanda.py`.

## Le fotografie

Gli script che finiscono in `-foto` o `-lastra` non controllano niente:
fanno schermate dentro `audit/v2shots/`, che serve guardarle con gli
occhi. Le immagini non entrano nel repository (stanno in `.gitignore`):
si rifanno quando servono.
