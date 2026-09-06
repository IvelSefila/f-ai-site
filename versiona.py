"""Mette una versione negli indirizzi di fogli e moduli.

Serve perche' un browser che ha gia' in cache app.js continua a eseguire
quello vecchio anche quando il server dice no-store: la voce era stata
salvata prima, e la nuova intestazione non la sfratta. Con la versione
nell'indirizzo l'URL e' diverso e non c'e' cache che tenga.

Si lancia dopo ogni modifica:   python versiona.py
"""
import io, re, time, pathlib

RADICE = pathlib.Path(__file__).parent / "site" / "v2"
STAMPA = time.strftime("%Y%m%d-%H%M%S")

def scrivi(p, s):
    io.open(p, "w", encoding="utf-8", newline="").write(s)

# ── gli import fra moduli ──
tocchi = 0
for f in RADICE.glob("*.js"):
    s = io.open(f, encoding="utf-8", newline="").read()
    n = re.sub(r"from '\./([a-zA-Z0-9._-]+\.js)(\?v=[^']*)?'",
               lambda m: f"from './{m.group(1)}?v={STAMPA}'", s)
    if n != s:
        scrivi(f, n); tocchi += 1

# ── il foglio di stile e il modulo d'ingresso ──
idx = RADICE / "index.html"
s = io.open(idx, encoding="utf-8", newline="").read()
s = re.sub(r'href="v2\.css(\?v=[^"]*)?"', f'href="v2.css?v={STAMPA}"', s)
s = re.sub(r'src="app\.js(\?v=[^"]*)?"',  f'src="app.js?v={STAMPA}"',  s)
scrivi(idx, s)

print(f"versione {STAMPA} · {tocchi} moduli e l'index aggiornati")
