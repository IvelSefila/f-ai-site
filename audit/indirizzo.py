# -*- coding: utf-8 -*-
"""L'indirizzo pubblico del sito, scritto in sei posti, cambiato da uno.

Canonical, og:url, le due immagini social, la scheda Person, robots.txt
e sitemap.xml devono dire tutti lo stesso indirizzo. Erano allineati su
https://f-ai.studio, che pero' e' un dominio che non esiste: un
canonical che punta altrove dice a Google "la pagina vera non e'
questa", e il risultato e' che la tua non viene indicizzata affatto.
Meglio nessun canonical che uno sbagliato.

Finche' non c'e' un dominio il sito sta su GitHub Pages, e l'indirizzo
e' quello del repo. Il giorno che ne compri uno, questo script lo
riscrive dappertutto in un colpo:

    python audit/indirizzo.py https://iltuodominio.it

uso senza argomenti: rimette l'indirizzo di GitHub Pages.

Nota sul percorso. La pagina vera sta in /v2/index.html; la radice e'
un rimando che ci porta. Il canonical indica la pagina VERA, non il
rimando: a un motore si dice dove sta la roba, non da dove si passa.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PAGES = 'https://ivelsefila.github.io/f-ai-site'
base = (sys.argv[1] if len(sys.argv) > 1 else PAGES).rstrip('/')

# Su un dominio tutto suo la pagina puo' stare in radice; su Pages sta
# sotto la cartella del repo. Il rimando in site/index.html vale in
# tutti e due i casi, ma l'indirizzo da dichiarare e' quello della
# pagina vera.
pagina = base + '/v2/index.html'
immagine = base + '/assets/og-fai.jpg'

f = os.path.join('site', 'v2', 'index.html')
h = io.open(f, encoding='utf-8').read()
prima = h

def sostituisci(attributo, chiave, valore):
    """Riscrive il content/href di un tag identificato da chiave."""
    global h
    rx = re.compile(r'(<[^>]*%s[^>]*%s=")([^"]*)(")' % (re.escape(chiave), attributo))
    h, n = rx.subn(lambda m: m.group(1) + valore + m.group(3), h)
    return n

conti = {
    'canonical':   sostituisci('href', 'rel="canonical"', pagina),
    'og:url':      sostituisci('content', 'property="og:url"', pagina),
    'og:image':    sostituisci('content', 'property="og:image"', immagine),
    'twitter:image': sostituisci('content', 'name="twitter:image"', immagine),
}
# la scheda Person: "url" punta al sito, non alla pagina
h, conti['schema url'] = re.subn(r'("url":\s*")[^"]*(",)',
                                 lambda m: m.group(1) + base + '/' + m.group(2), h, count=1)

io.open(f, 'w', encoding='utf-8', newline='\n').write(h)
for k, v in conti.items():
    print('  %-16s %d' % (k, v))
assert all(conti.values()), 'qualche tag non e\' stato trovato'

io.open(os.path.join('site', 'robots.txt'), 'w', encoding='utf-8', newline='\n').write(
    """# Tutto aperto: non c'e' niente da nascondere e la pagina e' una sola.
User-agent: *
Allow: /

# I motori che alimentano le risposte degli assistenti passano di qui e
# leggono questa riga per prima.
Sitemap: %s/sitemap.xml
""" % base)

io.open(os.path.join('site', 'sitemap.xml'), 'w', encoding='utf-8', newline='\n').write(
    """<?xml version="1.0" encoding="UTF-8"?>
<!-- Una pagina sola: la mappa e' corta per davvero. Serve comunque,
     perche' e' il posto da cui un motore parte quando non ha ancora
     nessun collegamento verso il sito. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>%s</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
""" % pagina)

print('\nindirizzo pubblico: %s' % pagina)
print('%s' % ('cambiato' if h != prima else 'era gia\' questo'))
