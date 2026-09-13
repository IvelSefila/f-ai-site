# -*- coding: utf-8 -*-
"""Il progetto esoscheletro: dalla cartella al sito.

2311 file. Dentro ci sono tre copie di un sito web con tutto
node_modules, una ventina di spezzoni generati da 10 secondi che sono
materiale da montaggio, le anteprime di Premiere e i salvataggi
automatici. I pezzi finiti sono una quindicina.

La scelta (vedi i provini di audit/provini-eso.py) tiene sei cose che
fanno sei mestieri diversi, non sei volte lo stesso: il trailer, un
verticale outdoor, uno spot da borgo, uno spot che finisce su una
scheda prodotto, una locandina di un secondo marchio e un product film
sul dispositivo.

Fuori anche la camminata dentro il sito (2:32) e un video di
approfondimento nato dalla ricerca (2:58). Sono lavoro vero e restano
scritti nella tabella, ma in una fila di spot da dieci secondi due
registrazioni lunghe non le guarda nessuno, e da sole pesavano 10,4 MB
dei 24,3 di tutta la sezione.

Scartato l'endcard "HUMAN ROBOTS": nei fotogrammi dopo il primo la
scritta diventa "HUJMAN ROBOTS". Un difetto di generazione che sul
primo fotogramma non si vede, e che si vede solo guardando il video
avanti — che e' il motivo per cui i provini prendono tre fotogrammi e
non uno.

uso: python audit/porta-eso.py
"""
import os, subprocess, sys, json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CASA = os.environ['USERPROFILE']
FFMPEG = os.path.join(CASA, 'Desktop', 'Robe varie', 'Progetti AI', 'downloader', 'bin', 'ffmpeg.exe')
DENTRO = os.path.join(CASA, 'Desktop', 'Robe varie', 'Esoscheletro')
FUORI = os.path.join('site', 'v2', 'eso')

# file di partenza → nome breve nel sito, qualita'
SCELTI = [
    ('video/video nuovi/trailer completo.mp4',                       'trailer',  26),
    ('video/video nuovi/trekking 1.mp4',                             'trekking', 26),
    ('video/video vecchi/mp_.mp4',                                   'borgo',    26),
    ('video/video vecchi/spot 2a.mp4',                               'spot',     26),
    ('video/video vecchi/hf_20260526_101421_8ca385ac-d7fe-4379-91be-72f89f59fa6d.mp4',
                                                                     'e-legs',   26),
    ('esoscheletri/video/creati/prova 4.mp4',                        'prodotto', 26),
]

AUDIO = ['-c:a', 'aac', '-b:a', '96k', '-ac', '2']

os.makedirs(FUORI, exist_ok=True)
if not os.path.isfile(FFMPEG):
    sys.exit('ffmpeg non trovato in ' + FFMPEG)

schede, prima_tot, dopo_tot = [], 0, 0
for i, (rel, breve, crf) in enumerate(SCELTI, 1):
    src = os.path.join(DENTRO, *rel.split('/'))
    if not os.path.isfile(src):
        print('   manca:', rel)
        continue
    dst = os.path.join(FUORI, breve + '.mp4')
    prima = os.path.getsize(src)
    print('[%d/%d] %s → %s.mp4  (crf %d)' % (i, len(SCELTI), rel.split('/')[-1][:38], breve, crf),
          flush=True)
    video = ['-c:v', 'libx264', '-crf', str(crf), '-preset', 'slow',
             '-profile:v', 'high', '-pix_fmt', 'yuv420p',
             '-vf', 'scale=w=1280:h=1280:force_original_aspect_ratio=decrease:force_divisible_by=2',
             '-movflags', '+faststart']
    r = subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', src] + video + AUDIO + [dst])
    if r.returncode != 0:
        print('   ffmpeg ha fallito')
        continue
    dopo = os.path.getsize(dst)
    prima_tot += prima
    dopo_tot += dopo
    print('       %.1f MB → %.1f MB  (%.0f%% in meno)'
          % (prima / 1048576, dopo / 1048576, 100 - dopo * 100 / prima), flush=True)

    cop = os.path.join(FUORI, breve + '.jpg')
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', dst,
                    '-vf', "select='gte(n\\,24)',scale=w=640:h=640:force_original_aspect_ratio=decrease",
                    '-frames:v', '1', '-q:v', '4', cop])
    schede.append({'id': breve, 'da': rel, 'mb': round(dopo / 1048576, 1)})

print('\n%d pezzi · da %.0f MB a %.1f MB (%.0f%% in meno)'
      % (len(schede), prima_tot / 1048576, dopo_tot / 1048576,
         100 - dopo_tot * 100 / prima_tot))
json.dump(schede, open(os.path.join(FUORI, 'elenco.json'), 'w'), indent=1, ensure_ascii=False)
