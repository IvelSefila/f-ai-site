/* ═══════════════════════════════════════════════════════════════
 * cookie.js — avviso su cookie e memoria del browser.
 * Il sito non usa cookie di profilazione ne' di statistica: usa solo la memoria
 * locale per ricordare le scelte dell'utente (colori, caratteri, chat). L'avviso lo
 * dice in modo chiaro, rimanda all'informativa e si puo' riaprire in ogni momento
 * (link nel piede della pagina o pulsante nell'informativa).
 * ═══════════════════════════════════════════════════════════════ */

const CHIAVE = 'mfai_cookie_ok';
const MESI = 12;

function letto() {
  try {
    const v = JSON.parse(localStorage.getItem(CHIAVE) || 'null');
    return !!(v && v.fino && v.fino > Date.now());
  } catch { return false; }
}

function salva() {
  try { localStorage.setItem(CHIAVE, JSON.stringify({ fino: Date.now() + MESI * 30 * 864e5 })); } catch { /* memoria non disponibile */ }
}

let banner = null;
let ultimoFuoco = null;

function chiudi() {
  if (!banner) return;
  salva();
  const b = banner;
  banner = null;
  b.classList.add('cookie--via');
  setTimeout(() => b.remove(), 260);
  ultimoFuoco?.focus?.({ preventScroll: true });
}

function apri(conFuoco) {
  if (banner) return;
  ultimoFuoco = document.activeElement;
  const inPrivacy = /privacy\.html$/.test(location.pathname);
  banner = document.createElement('div');
  banner.className = 'cookie';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'false');
  banner.setAttribute('aria-labelledby', 'cookie-titolo');
  banner.innerHTML = `
    <div class="cookie__testo">
      <p class="cookie__titolo" id="cookie-titolo">Cookie e privacy</p>
      <p>Questo sito <strong>non usa cookie di profilazione</strong> e non ha pubblicità né statistiche. Ricorda le tue scelte (colori, caratteri, chat) solo nel tuo browser. Dati verso l'esterno partono solo se li usi tu: la chat con Nous in modalità cloud e l'invio del brief. Nous può ricordarsi di te (visite e nome) nel browser, ma solo se glielo permetti tu.</p>
    </div>
    <div class="cookie__azioni">
      ${inPrivacy ? '' : '<a class="cookie__link" href="privacy.html">Leggi l\'informativa</a>'}
      <button type="button" class="cookie__ok">Ho capito</button>
    </div>`;
  document.body.appendChild(banner);
  banner.querySelector('.cookie__ok').addEventListener('click', chiudi);
  banner.addEventListener('keydown', e => { if (e.key === 'Escape') chiudi(); });
  if (conFuoco) banner.querySelector('.cookie__ok').focus({ preventScroll: true });
}

export function initCookie() {
  document.addEventListener('click', e => {
    const t = e.target instanceof Element ? e.target.closest('[data-cookie-apri]') : null;
    if (t) { e.preventDefault(); apri(true); }
  });
  if (!letto()) setTimeout(() => apri(false), 1200);
}

initCookie();
