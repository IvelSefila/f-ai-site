# -*- coding: utf-8 -*-
"""Studio CETS: dalla cartella al sito.

Qui non c'e' niente da scremare — la cartella ha sei file finiti e
basta, nessuno e' l'esportazione doppia di un altro (i provini di
audit/provini-cest.py lo mostrano riga per riga). Il lavoro e' solo
portarli a un peso da pagina web.

Due note sulle copertine.

La prima: per i due pezzi del marchio il fotogramma buono NON e' quello
iniziale. Il logo si costruisce da una linea che gira, quindi al
ventiquattresimo fotogramma sullo schermo c'e' mezzo cerchio verde e
nient'altro. La copertina di quei due si prende alla fine.

La seconda: "antincendio primo" parte da 1440x2560, cioe' piu' alto di
un 9:16 pieno. Non lo si taglia — la scritta con la data sta in basso e
tagliare vorrebbe dire buttare via proprio l'informazione per cui il
video esiste. Entra intero nella cornice 16:9 come gli altri verticali.

uso: python audit/porta-cest.py
"""
import os, subprocess, sys, json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CASA = os.environ['USERPROFILE']
FFMPEG = os.path.join(CASA, 'Desktop', 'Robe varie', 'Progetti AI', 'downloader', 'bin', 'ffmpeg.exe')
DENTRO = os.path.join(CASA, 'Desktop', 'Robe varie', 'lavori', 'portfolio', 'Cest')
FUORI = os.path.join('site', 'v2', 'cest')

# file di partenza → nome breve nel sito, crf, dove prendere la copertina
#   'presto' = poco dopo l'inizio (il primo fotogramma e' spesso nero)
#   'fine'   = ultimo fotogramma utile (i due pezzi del marchio)
SCELTI = [
    ('antincendio primo.mp4',        'antincendio',  26, 'presto'),
    ('amministratori completo .mp4', 'amministratori', 26, 'presto'),
    ('ced 3.mp4',                    'ced-voce',     26, 'presto'),
    ('ced finito .mp4',              'ced-vita',     26, 'presto'),
    ('logo cets animato 16 9.mp4',   'marchio-largo', 24, 'fine'),
    ('logo cets animato 9 16 2.mp4', 'marchio-alto',  24, 'fine'),
]

AUDIO = ['-c:a', 'aac', '-b:a', '96k', '-ac', '2']

os.makedirs(FUORI, exist_ok=True)
if not os.path.isfile(FFMPEG):
    sys.exit('ffmpeg non trovato in ' + FFMPEG)
PROBE = FFMPEG.replace('ffmpeg.exe', 'ffprobe.exe')


def durata(f):
    r = subprocess.run([PROBE, '-v', 'quiet', '-show_entries', 'format=duration',
                        '-of', 'csv=p=0', f], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0


schede, prima_tot, dopo_tot = [], 0, 0
for i, (rel, breve, crf, quando) in enumerate(SCELTI, 1):
    src = os.path.join(DENTRO, rel)
    if not os.path.isfile(src):
        print('   manca:', rel)
        continue
    dst = os.path.join(FUORI, breve + '.mp4')
    prima = os.path.getsize(src)
    print('[%d/%d] %s → %s.mp4  (crf %d)' % (i, len(SCELTI), rel[:38], breve, crf), flush=True)
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
    print('       %.1f MB → %.1f MB  (%.0f%% in meno)  %.1f s'
          % (prima / 1048576, dopo / 1048576, 100 - dopo * 100 / prima, durata(dst)), flush=True)

    cop = os.path.join(FUORI, breve + '.jpg')
    scala = 'scale=w=640:h=640:force_original_aspect_ratio=decrease'
    if quando == 'fine':
        # -sseof torna indietro dalla coda: qui il marchio e' finito di montarsi
        arg = ['-sseof', '-1.3' if breve == 'marchio-largo' else '-0.35', '-i', dst, '-vf', scala, '-frames:v', '1']
    else:
        arg = ['-i', dst, '-vf', "select='gte(n\\,24)'," + scala, '-frames:v', '1']
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error'] + arg + ['-q:v', '4', cop])
    schede.append({'id': breve, 'da': rel, 'mb': round(dopo / 1048576, 1),
                   's': round(durata(dst), 1)})

print('\n%d pezzi · da %.0f MB a %.1f MB (%.0f%% in meno)'
      % (len(schede), prima_tot / 1048576, dopo_tot / 1048576,
         100 - dopo_tot * 100 / prima_tot))
json.dump(schede, open(os.path.join('audit', 'presi-cest.json'), 'w'),
          indent=1, ensure_ascii=False)
