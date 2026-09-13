# -*- coding: utf-8 -*-
"""I master di montaggio diventano file da web.

Gli originali sono esportazioni da Premiere: da 7 a 21 Mbit/s, 299 MB
per quattro minuti di girato. Vanno benissimo per archiviare e non
vanno per niente bene su una pagina — a 21 Mbit/s un video da sette
secondi pesa 17 MB, e su un telefono in giro non parte.

Qui diventano file da web: rientrati in un riquadro da 1280, H.264 a
qualita' costante (CRF 26, che su questo materiale sta fra 1,5 e 3
Mbit/s), audio AAC a 96k, e l'indice spostato in testa al file
(+faststart) perche' altrimenti il browser deve scaricare tutto prima
di far partire il primo fotogramma.

Il riquadro e' 1280x1280 "decrease": un verticale 1080x1920 diventa
720x1280, un orizzontale 1280x720 resta com'e'. Scalare a naso sul lato
lungo avrebbe INGRANDITO l'orizzontale a 2276x1280.

ffmpeg non e' installato sul computer: si usa quello che sta gia' dentro
MaxVideoDownloader, che e' roba sua.

uso: python audit/porta-i-lavori.py
"""
import os, subprocess, sys, json, shutil

# La console di Windows parla cp1252 e su una freccia si ferma: senza
# questa riga il programma muore dopo il primo nome di file.
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

FFMPEG = r'C:\Users\fabri\Desktop\Robe varie\Progetti AI\downloader\bin\ffmpeg.exe'
DENTRO = r'C:\Users\fabri\Desktop\Robe varie\lavori\portfolio\Union Energia per Roberto Baldizzone'
FUORI = os.path.join('site', 'v2', 'lavori')

# nome del file → nome breve con cui vive nel sito
NOMI = {
    'alpaca 1 finito.mp4': 'davide-01',
    'alpaca 2 finito.mp4': 'davide-02',
    'alpaca 3 finito.mp4': 'davide-03',
    'locandina alpaca 1.mp4': 'locandina',
    'asino nuovo_sottotitolato.mp4': 'luca-asino',
    'dialogo roby_sottotitolato.mp4': 'dialogo-roby',
    'video bollette roby finito_sottotitolato.mp4': 'bollette-roby',
    'marco finito_sottotitolato + outro.mp4': 'marco',
    'insieme si può richiesta partecipazione + gancio finale_sottotitolato.mp4': 'insieme',
}

os.makedirs(FUORI, exist_ok=True)
if not os.path.isfile(FFMPEG):
    sys.exit('ffmpeg non trovato in ' + FFMPEG)

VIDEO = ['-c:v', 'libx264', '-crf', '26', '-preset', 'slow',
         '-profile:v', 'high', '-pix_fmt', 'yuv420p',
         '-vf', 'scale=w=1280:h=1280:force_original_aspect_ratio=decrease:force_divisible_by=2',
         '-movflags', '+faststart']
AUDIO = ['-c:a', 'aac', '-b:a', '96k', '-ac', '2']

schede = []
for i, (file, breve) in enumerate(NOMI.items(), 1):
    src = os.path.join(DENTRO, file)
    if not os.path.isfile(src):
        print('   manca:', file); continue
    dst = os.path.join(FUORI, breve + '.mp4')
    prima = os.path.getsize(src)
    print('[%d/%d] %s → %s.mp4' % (i, len(NOMI), file[:44], breve), flush=True)
    r = subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', src] + VIDEO + AUDIO + [dst])
    if r.returncode != 0:
        print('   ffmpeg ha fallito'); continue
    dopo = os.path.getsize(dst)
    print('       %.1f MB → %.1f MB  (%.0f%% in meno)'
          % (prima / 1048576, dopo / 1048576, 100 - dopo * 100 / prima), flush=True)

    # la copertina, alla misura del sito
    cop = os.path.join(FUORI, breve + '.jpg')
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', dst,
                    '-vf', "select='gte(n\\,12)',scale=w=640:h=640:force_original_aspect_ratio=decrease",
                    '-frames:v', '1', '-q:v', '4', cop])
    schede.append({'id': breve, 'file': file, 'mb': round(dopo / 1048576, 1)})

tot = sum(s['mb'] for s in schede)
print('\n%d video · %.1f MB in tutto' % (len(schede), tot))
print('(gli originali erano 299 MB)')
# L'elenco di cosa e' stato preso da dove e' una nota di lavorazione:
# sta in audit/, non nella cartella che finisce online. Sul sito era
# un file che nessuno leggeva e che raccontava i nomi delle cartelle
# del mio computer.
json.dump(schede, open(os.path.join('audit', 'presi-' + os.path.basename(FUORI) + '.json'),
                       'w'), indent=1, ensure_ascii=False)
