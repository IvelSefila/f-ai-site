# -*- coding: utf-8 -*-
"""La Locanda del Castello: dalla cartella di lavoro al sito.

La cartella ha 247 file e 456 MB di video. Quasi tutto e' materiale di
lavorazione: anteprime di Premiere, salvataggi automatici, e una
cinquantina di spezzoni generati che servono in montaggio e da soli non
dicono niente. I pezzi finiti sono una ventina, e diversi sono lo stesso
video esportato due o tre volte.

Il confronto l'ha fatto audit/provini-locanda.py con i fotogrammi, non
con i nomi dei file: "serata fritto misto finito2", "finito3" e "4"
durano tutti 27 secondi e pesano tutti 24,5 MB, ma prendendo un
fotogramma ogni pochi secondi e riducendolo a 32 pixel si vede che
finito3 e 4 sono identici in tutto e finito2 cambia solo l'ultima
inquadratura. Stessa cosa per "terza degustazione finale" e "terza
degustazione serata champagne": gemelli.

Di quello che resta ho tenuto nove pezzi, uno per ogni cosa diversa che
sanno fare: il posto, il dehor, tre serate a tema, una locandina ferma,
il karaoke, la giornata benessere e la pagina degli eventi privati.
Cinque locandine di champagne tutte uguali fra loro non dimostrano
niente in piu' della prima.

Codifica come per Union Energia: riquadro 1280, CRF 26, faststart. Le
canzoni scendono a 112k, che per trenta secondi di anteprima e' piu'
che onesto.

uso: python audit/porta-la-locanda.py
"""
import os, subprocess, sys, json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CASA = os.environ['USERPROFILE']
FFMPEG = os.path.join(CASA, 'Desktop', 'Robe varie', 'Progetti AI', 'downloader', 'bin', 'ffmpeg.exe')
DENTRO = os.path.join(CASA, 'Desktop', 'Robe varie', 'Locanda del Castello')
FUORI = os.path.join('site', 'v2', 'locanda')

# file di partenza (dentro la cartella) → nome breve nel sito
VIDEO_SCELTI = [
    ('generico/generico.mp4',                                'posto'),
    ('serata champagne/serata champagne finito.mp4',         'dehor'),
    ('serata champagne/ultima locandina.mp4',                'champagne'),
    ('serata champagne/primo flute.mp4',                     'tradition'),
    ('serata fritto misto/serata fritto misto4.mp4',         'fritto'),
    ('serata fritto misto/video2.mp4',                       'fritto-locandina'),
    ('Serata Karaoke/serata karaoke corretto1.mp4',          'karaoke'),
    ('video/giornata benessere.mp4',                         'benessere'),
    ('video/comunioni e cresime etc + musica.mp4',           'eventi'),
]

# Le cinque di canzoni/: quella cartella e' gia' una scelta sua.
# musiche/ ne ha otto, tre delle quali sono lo stesso file (md5 uguale).
CANZONI = [
    ('canzoni/Copper_and_Stone.mp3',        'copper-and-stone'),
    ('canzoni/Rafters_Under_Gold.mp3',      'rafters-under-gold'),
    ('canzoni/Salt_And_Golden_Light.mp3',   'salt-and-golden-light'),
    ('canzoni/The_Shared_Table.mp3',        'the-shared-table'),
    ('canzoni/Where_the_Shadows_Dance.mp3', 'where-the-shadows-dance'),
]

VIDEO = ['-c:v', 'libx264', '-crf', '26', '-preset', 'slow',
         '-profile:v', 'high', '-pix_fmt', 'yuv420p',
         '-vf', 'scale=w=1280:h=1280:force_original_aspect_ratio=decrease:force_divisible_by=2',
         '-movflags', '+faststart']
AUDIO = ['-c:a', 'aac', '-b:a', '96k', '-ac', '2']

os.makedirs(FUORI, exist_ok=True)
if not os.path.isfile(FFMPEG):
    sys.exit('ffmpeg non trovato in ' + FFMPEG)

schede, prima_tot, dopo_tot = [], 0, 0
for i, (rel, breve) in enumerate(VIDEO_SCELTI, 1):
    src = os.path.join(DENTRO, *rel.split('/'))
    if not os.path.isfile(src):
        print('   manca:', rel)
        continue
    dst = os.path.join(FUORI, breve + '.mp4')
    prima = os.path.getsize(src)
    print('[%d/%d] %s → %s.mp4' % (i, len(VIDEO_SCELTI), rel.split('/')[-1][:40], breve), flush=True)
    r = subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', src] + VIDEO + AUDIO + [dst])
    if r.returncode != 0:
        print('   ffmpeg ha fallito')
        continue
    dopo = os.path.getsize(dst)
    prima_tot += prima
    dopo_tot += dopo
    print('       %.1f MB → %.1f MB  (%.0f%% in meno)'
          % (prima / 1048576, dopo / 1048576, 100 - dopo * 100 / prima), flush=True)

    # la copertina: non il primo fotogramma, che spesso e' ancora nero
    cop = os.path.join(FUORI, breve + '.jpg')
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', dst,
                    '-vf', "select='gte(n\\,18)',scale=w=640:h=640:force_original_aspect_ratio=decrease",
                    '-frames:v', '1', '-q:v', '4', cop])
    schede.append({'id': breve, 'da': rel, 'mb': round(dopo / 1048576, 1)})

print()
for i, (rel, breve) in enumerate(CANZONI, 1):
    src = os.path.join(DENTRO, *rel.split('/'))
    if not os.path.isfile(src):
        print('   manca:', rel)
        continue
    dst = os.path.join(FUORI, breve + '.m4a')
    prima = os.path.getsize(src)
    r = subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', src,
                        '-c:a', 'aac', '-b:a', '112k', '-movflags', '+faststart', dst])
    if r.returncode != 0:
        print('   ffmpeg ha fallito su', rel)
        continue
    dopo = os.path.getsize(dst)
    prima_tot += prima
    dopo_tot += dopo
    print('[%d/%d] %-26s %.2f MB → %.2f MB' % (i, len(CANZONI), breve, prima / 1048576, dopo / 1048576))

print('\n%d video e %d brani · da %.0f MB a %.1f MB (%.0f%% in meno)'
      % (len(schede), len(CANZONI), prima_tot / 1048576, dopo_tot / 1048576,
         100 - dopo_tot * 100 / prima_tot))
json.dump(schede, open(os.path.join(FUORI, 'elenco.json'), 'w'), indent=1, ensure_ascii=False)
