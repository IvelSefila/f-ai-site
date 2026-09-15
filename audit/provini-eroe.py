# -*- coding: utf-8 -*-
"""Le quattro copertine della prima schermata.

Nella prima schermata non c'era un solo lavoro: un titolo, sette righe
di paragrafo, due bottoni e un render astratto. La roba che vende —
quattro marchi veri e trenta copertine — cominciava al 25% della pagina,
cioe' dodici schermate piu' in giu' su un telefono.

Queste quattro non sono scelte dai nomi dei file: sono uscite da un
provino con tutti i candidati messi in fila (trenta copertine) e
guardati. Il criterio era uno solo: si capisce cosa sono a 96 pixel di
larghezza? Le locandine fitte di testo, per esempio, a quella misura
diventano rumore grigio e sono rimaste fuori.

  davide-02   il lama nel maglione — il segno di Union, e l'immagine
              piu' memorabile di tutto il sito
  trekking    un uomo che sale un crinale con l'esoscheletro addosso:
              dice "prodotto vero, usato da qualcuno" senza una parola
  champagne   oro su fondo scuro: la Locanda si riconosce dal colore
              prima che dal contenuto
  ced-voce    "Caro AMMINISTRATORE": l'unica delle quattro in cui una
              scritta resta leggibile anche piccola, e serve — e' il
              caso che altrimenti si spiegherebbe peggio

Ritaglio 3:4 per tutte e quattro. Il ritaglio NON e' centrato: le
verticali hanno il soggetto in alto (volti, teste) e centrando si
taglierebbero le facce. Si taglia da sotto.

uso: python audit/provini-eroe.py
"""
import io, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from PIL import Image

SCELTE = [
    ('lavori/davide-02',   'union',   0.00),   # il lama sta al centro-alto
    # trekking era la prima scelta ma il suo fotogramma inquadra
    # l'uomo dalle spalle in giu': ritagliato resta un torso senza testa.
    # e-legs ha la figura intera contro il cielo e si legge anche a 132px.
    ('eso/e-legs',         'eso',     0.00),
    ('locanda/champagne',  'locanda', 0.00),
    # ced-voce era il candidato migliore a prima vista, ma e' orizzontale
    # (1280x860): ritagliato a 3:4 restava mezzo uomo e "IISTRATORE".
    # antincendio e' verticale e la scritta ci sta intera.
    ('cest/antincendio',   'cest',    0.00),
]

LARGO = 264            # 132 px sullo schermo, il doppio per gli schermi fitti
FORMA = 4 / 3          # altezza / larghezza
FUORI = os.path.join('site', 'v2', 'eroe')
os.makedirs(FUORI, exist_ok=True)

for rel, nome, dallalto in SCELTE:
    src = os.path.join('site', 'v2', *rel.split('/')) + '.jpg'
    if not os.path.isfile(src):
        print('   manca:', src)
        continue
    im = Image.open(src).convert('RGB')
    alto = round(im.width * FORMA)
    if alto <= im.height:
        # immagine piu' alta del ritaglio: si taglia in verticale
        y = round((im.height - alto) * dallalto) if dallalto else 0
        im = im.crop((0, y, im.width, y + alto))
    else:
        # immagine piu' larga: si taglia ai lati, e li' il centro va bene
        largo = round(im.height / FORMA)
        x = (im.width - largo) // 2
        im = im.crop((x, 0, x + largo, im.height))
    im = im.resize((LARGO, round(LARGO * FORMA)), Image.LANCZOS)
    dst = os.path.join(FUORI, nome + '.webp')
    im.save(dst, 'WEBP', quality=82, method=6)
    print('%-22s → %s  %dx%d  %.0f KB'
          % (rel, dst, im.width, im.height, os.path.getsize(dst) / 1024))

tot = sum(os.path.getsize(os.path.join(FUORI, f)) for f in os.listdir(FUORI))
print('\nquattro copertine, %.0f KB in tutto' % (tot / 1024))
