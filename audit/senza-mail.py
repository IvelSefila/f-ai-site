# -*- coding: utf-8 -*-
"""Via l'indirizzo di posta, dentro la copia negli appunti.

hello@f-ai.studio non esiste: un brief compilato per intero finiva in
un programma di posta con un destinatario inventato, cioe' da nessuna
parte. Peggio di non avere un pulsante.

Al suo posto il brief si copia. Il visitatore lo incolla dove vuole -
posta, messaggio, modulo - e la scelta di dove mandarlo resta a lui.
La versione classica sapeva gia' farlo: aveva il pulsante "copia il
riepilogo" accanto a quello della posta. Basta togliere il secondo.
La versione pixel invece aveva solo la posta, e la copia gliela do.

Quando ci sara' un indirizzo vero, si rimette: e' una riga per parte.
"""
import io

def apri(p):
    s = io.open(p, encoding='utf-8', newline='').read()
    return s, ('\r\n' in s)

def salva(p, s):
    io.open(p, 'w', encoding='utf-8', newline='').write(s)

def fai(p, coppie):
    s, crlf = apri(p)
    for vecchio, nuovo, cosa in coppie:
        v = vecchio.replace('\n', '\r\n') if crlf else vecchio
        nu = nuovo.replace('\n', '\r\n') if crlf else nuovo
        assert s.count(v) == 1, f'{p}: non trovato ({cosa})'
        s = s.replace(v, nu)
    salva(p, s)
    print('  ' + p)


# ══ la torre ══════════════════════════════════════════════════════
fai('site/pixel/index.html', [
(
 '        <a class="tasto tasto--pieno" id="mandaBrief" href="#" hidden>Manda il brief ↗</a>',
 '        <button class="tasto tasto--pieno" id="mandaBrief" type="button" hidden>Copia il brief ▢</button>',
 'il tasto'),
(
 '''      <p class="piccolo">Preferisci scrivere e basta?
        <a href="mailto:hello@f-ai.studio">hello@f-ai.studio</a></p>''',
 '''      <p class="piccolo" id="statoBrief" role="status" aria-live="polite">Alla sesta
        risposta il brief si copia negli appunti: lo incolli dove preferisci.</p>''',
 'la riga della posta'),
])

fai('site/pixel/gioco.js', [
(
 """  const cta = $('#mandaBrief');
  cta.hidden = !fatto;
  if (fatto) cta.href = 'mailto:hello@f-ai.studio?subject='
    + encodeURIComponent('Brief F/AI — la torre')
    + '&body=' + scelte.map((s, i) => `${i + 1}. ${s}`).join('%0D%0A');
}""",
 """  const cta = $('#mandaBrief');
  cta.hidden = !fatto;
  testoBrief = fatto
    ? 'Brief F/AI — la torre\\n\\n' + scelte.map((s, i) => `${i + 1}. ${s}`).join('\\n')
    : '';
}

/* Il brief si copia, non si spedisce: un indirizzo non c'e' ancora, e
   un pulsante che apre la posta su una casella inventata e' peggio di
   nessun pulsante. Il testo va negli appunti e il visitatore lo porta
   dove vuole. */
let testoBrief = '';
$('#mandaBrief').addEventListener('click', async () => {
  const dove = $('#statoBrief');
  let fatta = false;
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try { await navigator.clipboard.writeText(testoBrief); fatta = true; } catch { /* si ripiega */ }
  }
  if (!fatta) {
    /* il ripiego di sempre, per quando gli appunti non si lasciano
       toccare: una casella fuori campo, seleziona, copia */
    const t = document.createElement('textarea');
    t.value = testoBrief;
    t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.appendChild(t);
    t.select();
    try { fatta = document.execCommand('copy'); } catch { fatta = false; }
    t.remove();
  }
  if (dove) dove.textContent = fatta
    ? 'Brief copiato. Incollalo dove preferisci.'
    : 'Copia non riuscita: seleziona il riepilogo qui sopra e copialo a mano.';
});""",
 'la copia'),
])

# ══ la versione classica ══════════════════════════════════════════
fai('site/v2/index.html', [
(
 '  "email": "mailto:hello@f-ai.studio",\n',
 '',
 'la scheda leggibile dalle macchine'),
(
 '          <p>Controlla il riepilogo, poi copialo o aprilo nel tuo programma email.</p>',
 '          <p>Controlla il riepilogo, poi copialo: lo incolli dove preferisci.</p>',
 'il testo del riepilogo'),
(
 '''            <a id="brief-mail" href="mailto:"><span>APRI NELL’EMAIL</span><i aria-hidden="true">↗</i></a>\n''',
 '',
 'il tasto della posta'),
(
 '            <p class="brief-step__hint">Il riepilogo viene preparato nel browser. Potrai copiarlo o aprirlo nel tuo programma email.</p>',
 '            <p class="brief-step__hint">Il riepilogo viene preparato nel browser: potrai copiarlo e incollarlo dove preferisci.</p>',
 'il suggerimento'),
(
 '  <a class="btn btn--solid btn--lg" href="mailto:hello@f-ai.studio?subject=Brief%20F%2FAI">Raccontami il progetto <i aria-hidden="true">↗</i></a>',
 '  <a class="btn btn--solid btn--lg" href="#brief">Raccontami il progetto <i aria-hidden="true">↓</i></a>',
 'il richiamo del contatto'),
])

fai('site/v2/brief.js', [
(
 '''      if (mailLink) {
        const subject = `Nuovo brief F/AI — ${built.projectLabel} — ${built.name}`;
        mailLink.href = `mailto:hello@f-ai.studio?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(preparedSummary)}`;
      }''',
 '''      /* Il tasto della posta non c'e' piu': un indirizzo non c'e'
         ancora, e aprire il programma di posta su una casella
         inventata mandava il brief da nessuna parte. Resta la copia,
         che qui esisteva gia'. */''',
 'la posta del brief'),
])

# ══ la prima versione, non piu' raggiungibile ma servita ══════════
fai('site/script.js', [
(
 '        mailLink.href = `mailto:hello@f-ai.studio?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(preparedSummary)}`;',
 '        mailLink.href = "#brief";   /* nessun indirizzo, per ora: resta la copia */',
 'la posta della prima versione'),
])

print('nessun indirizzo di posta resta nel sito')
