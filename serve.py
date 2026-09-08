"""Server statico per lo sviluppo: senza cache, ma con la compressione.

`python -m http.server` manda Last-Modified e il browser tiene i moduli
in memoria: capitava di ricaricare la pagina e vedere l'HTML nuovo con
il JavaScript vecchio, che e' il modo peggiore di sbagliarsi. Qui ogni
risposta dice esplicitamente di non conservare niente.

E comprime, perche' senza compressione le misure di peso mentono. Un
hosting vero — GitHub Pages, Netlify, qualunque — comprime da solo: se
il server di prova non lo fa, si finisce per ottimizzare un peso che
nessun visitatore vedra' mai. sfondi.js sono 1,46 MB sul disco e 1,10
MB sul filo, e la seconda e' la cifra che conta.
"""
import gzip
import io
import socket
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

COMPRIMIBILI = (".js", ".css", ".html", ".svg", ".json", ".txt", ".map")
SOGLIA = 1024          # sotto questa misura comprimere costa piu' di quanto rende


class SenzaCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_head(self):
        """Come l'originale, ma il corpo esce compresso quando conviene.

        Riscrivo Content-Length con la misura compressa: sbagliarlo
        lascia il browser in attesa di byte che non arrivano piu'.
        """
        percorso = self.translate_path(self.path)
        vuole = "gzip" in self.headers.get("Accept-Encoding", "")
        if not (vuole and percorso.endswith(COMPRIMIBILI)):
            return super().send_head()
        try:
            with open(percorso, "rb") as f:
                crudo = f.read()
        except OSError:
            return super().send_head()          # 404 e simili: al gestore di sempre
        if len(crudo) < SOGLIA:
            return super().send_head()

        stretto = gzip.compress(crudo, 6)
        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(percorso))
        self.send_header("Content-Encoding", "gzip")
        self.send_header("Content-Length", str(len(stretto)))
        self.send_header("Vary", "Accept-Encoding")
        self.end_headers()
        return io.BytesIO(stretto)

    def log_message(self, fmt, *a):        # meno rumore nel terminale
        if "404" in (fmt % a):
            super().log_message(fmt, *a)


class DoppiaPila(ThreadingHTTPServer):
    """Ascolta su IPv6 e IPv4 insieme.

    Su Windows `localhost` spesso si risolve prima in ::1: un server
    legato al solo 127.0.0.1 risponde "connessione rifiutata" anche se
    e' vivo. Un socket IPv6 con V6ONLY spento accetta entrambi.
    """
    address_family = socket.AF_INET6

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except OSError:
            pass
        super().server_bind()


if __name__ == "__main__":
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    radice = sys.argv[2] if len(sys.argv) > 2 else "."
    gestore = partial(SenzaCache, directory=radice)
    try:
        srv = DoppiaPila(("::", porta), gestore)
        pila = "IPv6+IPv4"
    except OSError:                      # sistema senza IPv6: ripiego
        srv = ThreadingHTTPServer(("0.0.0.0", porta), gestore)
        pila = "solo IPv4"
    print(f"senza cache su http://localhost:{porta}/  ({pila}, radice: {radice})", flush=True)
    srv.serve_forever()
