"""Server statico per lo sviluppo, senza cache.

`python -m http.server` manda Last-Modified e il browser tiene i moduli
in memoria: capitava di ricaricare la pagina e vedere l'HTML nuovo con
il JavaScript vecchio, che e' il modo peggiore di sbagliarsi. Qui ogni
risposta dice esplicitamente di non conservare niente.
"""
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


if __name__ == "__main__":
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    radice = sys.argv[2] if len(sys.argv) > 2 else "."
    srv = ThreadingHTTPServer(("127.0.0.1", porta), partial(SenzaCache, directory=radice))
    print(f"senza cache su http://127.0.0.1:{porta}/  (radice: {radice})", flush=True)
    srv.serve_forever()
