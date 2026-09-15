@echo off
REM Apre il sito in locale. Niente internet, niente pubblicazione:
REM il server sta su questo computer e si spegne chiudendo la finestra.
title Sito F/AI - locale
cd /d "%~dp0site"
start "" http://localhost:8899/
echo.
echo   Sito F/AI su  http://localhost:8899/
echo   Chiudi questa finestra per spegnerlo.
echo.
python ..\serve.py 8899 .
