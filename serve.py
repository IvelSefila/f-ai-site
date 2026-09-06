"""Server statico per lo sviluppo, senza cache.

`python -m http.server` manda Last-Modified e il browser tiene i moduli
in memoria: capitava di ricaricare la pagina e vedere l'HTML nuovo con
il JavaScript vecchio, che e' il modo peggiore di sbagliarsi. Qui ogni
risposta dice esplicitamente di non conservare niente.
"""
import socket
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class SenzaCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

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
