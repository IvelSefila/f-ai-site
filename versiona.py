"""Mette una versione negli indirizzi di fogli e moduli.

Serve perche' un browser che ha gia' in cache gioco.js continua a
eseguire quello vecchio anche quando il server dice no-store: la voce
era stata salvata prima, e la nuova intestazione non la sfratta. Con la
versione nell'indirizzo l'URL e' diverso e non c'e' cache che tenga.

Vale per tutte e due le versioni del sito. Prima toccava solo v2/, e
infatti la versione pixel restava indietro nel browser anche quando il
server mandava i file giusti: si vedeva il sito vecchio senza un solo
errore in console, che e' il modo peggiore di sbagliarsi.

Si lancia dopo ogni modifica:   python versiona.py
"""
import io, re, time, pathlib

BASE = pathlib.Path(__file__).parent / "site"
STAMPA = time.strftime("%Y%m%d-%H%M%S")

def leggi(p):
    return io.open(p, encoding="utf-8", newline="").read()

def scrivi(p, s):
    io.open(p, "w", encoding="utf-8", newline="").write(s)

tocchi = 0
for cartella in ("v2", "pixel"):
    radice = BASE / cartella
    if not radice.is_dir():
        continue

    # ── gli import fra moduli ──
    for f in radice.glob("*.js"):
        s = leggi(f)
        n = re.sub(r"from '\./([a-zA-Z0-9._-]+\.js)(\?v=[^']*)?'",
                   lambda m: f"from './{m.group(1)}?v={STAMPA}'", s)
        if n != s:
            scrivi(f, n); tocchi += 1

    # ── i fogli di stile e i moduli d'ingresso, dentro l'html ──
    for idx in radice.glob("*.html"):
        s = leggi(idx)
        n = re.sub(r'(href="[a-zA-Z0-9._-]+\.css)(\?v=[^"]*)?"',
                   lambda m: f'{m.group(1)}?v={STAMPA}"', s)
        n = re.sub(r'(src="[a-zA-Z0-9._-]+\.js)(\?v=[^"]*)?"',
                   lambda m: f'{m.group(1)}?v={STAMPA}"', n)
        # anche gli import dentro i moduli scritti nella pagina
        n = re.sub(r"from '\./([a-zA-Z0-9._-]+\.js)(\?v=[^']*)?'",
                   lambda m: f"from './{m.group(1)}?v={STAMPA}'", n)
        if n != s:
            scrivi(idx, n); tocchi += 1

print(f"versione {STAMPA} · {tocchi} file aggiornati")
