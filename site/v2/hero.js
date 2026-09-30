import { accentoGL } from './palette.js?v=20260928-140';
import { emetti, mirinoTieni, mirinoDati } from './mirino.js?v=20260928-140';
/* ═══════════════════════════════════════════════════════════════════
 * hero.js — il confine fra mano e macchina, calcolato a ogni frame.
 * WebGL2, nessuna libreria. Se manca, la pagina resta intera.
 * ═══════════════════════════════════════════════════════════════════ */

const VERT = `#version 300 es
in vec2 p; out vec2 v;
void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D uA, uB;
uniform vec2  uRes, uTexA, uTexB;
uniform float uT, uSplit, uErode;
uniform float uKick;             /* scossa: cresce quando trascini in fretta, poi si spegne */
uniform vec3  uWave;             /* onda d'urto: x, y del clic e avanzamento 0..1 (>1 = spenta) */

uniform vec3 uEm;                 /* l'accento arriva dal foglio di stile */
#define EM uEm
#define EMLO (uEm * .58)         /* segue l'accento della scena */

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
/* Tre ottave invece di cinque. Le ultime due lavoravano sotto il pixel:
   costavano il 40% del rumore e non si vedevano. */
float fbm(vec2 p){
  float s = 0., a = .5;
  for (int i = 0; i < 3; i++){ s += a * vnoise(p); p *= 2.02; a *= .5; }
  return s;
}
vec2 cover(vec2 uv, vec2 tex){
  float rs = uRes.x / uRes.y, rt = tex.x / tex.y;
  vec2 s = rs > rt ? vec2(1., rt / rs) : vec2(rs / rt, 1.);
  return (uv - .5) * s + .5;
}
float lum(vec3 c){ return dot(c, vec3(.2126, .7152, .0722)); }

void main(){
  vec2 uv = v;
  float t = uT;

  /* onda d'urto: nasce dove clicchi, si allarga e piega l'immagine mentre passa */
  vec2 wq = (uv - uWave.xy) * vec2(uRes.x / uRes.y, 1.);
  float wd = length(wq);
  float ring = exp(-pow((wd - uWave.z * 1.1) / .02, 2.)) * (1. - clamp(uWave.z, 0., 1.));
  uv += (wq / max(wd, .0001)) * ring * .012 * vec2(uRes.y / uRes.x, 1.);

  float big  = fbm(vec2(uv.y * 3.2, t * .06)) - .5;
  float fine = fbm(vec2(uv.y * 22., t * .35)) - .5;
  float warp = big * .085 + fine * (.012 + uErode * .07 + uKick * .05);
  float edge = uv.x - uSplit + warp;

  float pull = exp(-abs(edge) * 9.) * (.02 + uErode * .09);
  vec2 dir   = vec2(sign(edge), 0.);

  vec3 human = texture(uA, cover(uv - dir * pull * .6, uTexA)).rgb;
  vec3 ai    = texture(uB, cover(uv + dir * pull, uTexB)).rgb;

  /* lato umano: pellicola. La cromia originale scende dal 12% al 5%:
     quel che restava bastava a far leggere ancora l'azzurro della sorgente. */
  float g = lum(human);
  human = mix(vec3(g), human, .05);
  human = pow(human, vec3(1.06)) * 1.04;
  human += (hash(uv * uRes + t) - .5) * .045;

  /* lato macchina: prima il canale blu sopravviveva due volte — nel 28% di
     cromia originale e nel moltiplicatore .78. Ora la sorgente conta il 10%
     e il blu viene compresso a .34: lo smeraldo arriva anche nelle luci. */
  float ga = lum(ai);
  ai = mix(vec3(ga), ai, .10);
  /* la base segue l'accento scelto (prima aveva un residuo verde fisso: con palette
     calde il lato macchina restava grigio-giallastro) */
  vec3 tint = EM / max(max(EM.r, EM.g), EM.b);
  ai = mix(ga * mix(vec3(1.), tint, .8), EM * (ga * 1.55), .42);
  ai += EM * smoothstep(.60, 1., ga) * .58;

  float m = smoothstep(-.012, .012, edge);
  vec3 col = mix(human, ai, m);

  float line = exp(-pow(edge / .0028, 2.));
  col += EM * line * (1.5 + uKick * 3.);
  col += (EM + vec3(.35)) * ring * 1.3;
  col += EMLO * exp(-pow(edge / .028, 2.)) * .3;

  float fl = step(.80, fbm(uv * vec2(28., 46.) + vec2(t * .5, -t * .3)));
  col += EM * fl * exp(-pow(edge / (.03 + uErode * .1), 2.)) * (.55 + uErode);

  vec2 gp = fract(uv * vec2(46., 26.));
  float grid = smoothstep(.965, 1., max(gp.x, gp.y));
  col += EMLO * grid * m * .10;

  col *= 1. - .55 * pow(length((uv - .5) * vec2(1.05, 1.)), 2.4);
  o = vec4(col, 1.);
}`;

/* Il colore e' sempre quello della palette scelta, uguale in tutte le scene: a cambiare
   e' l'immagine. Lo sfasamento di tonalita' per scena esiste ancora (uno per scena, in
   gradi) ma e' a zero; basta metterci un numero per riavere un colore diverso a scena. */
const SFASAMENTO_TONALITA = [0, 0, 0];
function ruotaTonalita([r, g, b], gradi) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d > 1e-6) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  h = (h + gradi + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [rr, gg, bb] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [rr + m, gg + m, bb + m];
}
const esadecimale = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');

/* Ogni scena esiste in due versioni: orizzontale (-l, 2560 px) per schermi larghi
   e verticale (-p, 1080x1928) per telefoni. Il lato "sistema" e' lo stesso soggetto del lato
   in bianco e nero, riscritto come sistema di AI: stessa composizione, cosi' le due meta' si corrispondono. */
const SCENES = [
  ['film',   'film-sistema',   'Regia video'],
  ['design', 'design-sistema', 'Sistema visivo'],
  ['atlas',  'atlas-sistema',  'Flussi e agenti'],
];
const percorso = (nome, orientamento) => `../assets/hero/${nome}-${orientamento}.webp`;

export function initHero(canvas, onState) {
  let accento = accentoGL();
  document.addEventListener('palette', () => { accento = accentoGL(); });
  /* preserveDrawingBuffer costa una copia per fotogramma e in produzione non
     serve. Ma senza, uno screenshot del canvas cattura un buffer già svuotato
     e viene bianco: mi ha fatto inseguire un difetto che non esisteva.
     Si attiva a richiesta con ?probe=1 per catturare o ispezionare. */
  const probe = new URLSearchParams(location.search).has('probe');
  const gl = canvas.getContext('webgl2', {
    antialias: false, alpha: false, powerPreference: 'high-performance',
    preserveDrawingBuffer: probe,
  });
  if (!gl) { document.body.classList.add('no-gl'); return null; }

  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { document.body.classList.add('no-gl'); return null; }
  gl.useProgram(prog);

  gl.bindVertexArray(gl.createVertexArray());
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = n => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uT = U('uT'), uSplit = U('uSplit'), uErode = U('uErode'),
        uTexA = U('uTexA'), uTexB = U('uTexB'), uEm = U('uEm'),
        uKick = U('uKick'), uWave = U('uWave');
  gl.uniform1i(U('uA'), 0); gl.uniform1i(U('uB'), 1);

  const mk = unit => {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([8, 10, 14, 255]));
    for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
                          [gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]])
      gl.texParameteri(gl.TEXTURE_2D, k, v);
    return tex;
  };
  const texA = mk(0), texB = mk(1);
  const size = { a: [1600, 1024], b: [1600, 1024] };
  const load = src => new Promise(res => {
    const i = new Image(); i.decoding = 'async';
    i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
  });
  const upload = (unit, tex, img, key) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);   // niente sfarfallio quando l'immagine viene ridotta
    size[key] = [img.naturalWidth, img.naturalHeight];
  };

  let sceneIx = 0;
  /* verticale se il canvas e' piu' alto che largo (telefono), orizzontale altrimenti */
  const orientamentoAttuale = () => {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    return h > w ? 'p' : 'l';
  };
  let orient = orientamentoAttuale();
  async function setScene(i) {
    sceneIx = (i + SCENES.length) % SCENES.length;
    const [a, b, name] = SCENES[sceneIx];
    const o = orient;
    const [ia, ib] = await Promise.all([load(percorso(a, o)), load(percorso(b, o))]);
    if (o !== orient) return;   // nel frattempo il telefono e' stato ruotato: ci pensa la nuova richiesta
    if (ia) upload(0, texA, ia, 'a');
    if (ib) upload(1, texB, ib, 'b');
    state.scene = sceneIx; state.sceneName = name;
    pubblicaTinta();
    if (!reduce.matches) { kick = 1; wave.x = .5; wave.y = .5; wave.t = 0; }
    onState?.(state, 'scene');
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const state = { split: .5, erode: 0, fps: 0, elapsed: 0, scene: 0, sceneName: SCENES[0][2], touched: false };
  let split = .5, target = .5, erode = 0, holding = false, dragging = false;
  let raf = 0, startedAt = 0, last = 0, frames = 0, lastFps = 0;

  /* Il costo di questo shader scala coi pixel, non con la finestra: misurato
     1,3 Mpx = 31 fps, 5,2 Mpx = 8 fps. Su uno schermo ad alta densità il conto
     quadruplica. Qui il numero di frammenti ha un tetto: sotto la soglia si usa
     la densità piena, sopra si scala. Su una scena fatta di rumore e fotografia
     la differenza non si vede; il dimezzamento del frame time sì. */
  /* Sui computer (puntatore preciso) il tetto e' piu' alto: lo sfondo esce piu' nitido.
     Sui telefoni resta basso. Se il frame rate scende sotto 26 il tetto cala del 20%. */
  let tetto = matchMedia('(pointer: fine)').matches ? 3.4e6 : 2.2e6;
  function resize() {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return;
    const o = ch > cw ? 'p' : 'l';
    if (o !== orient) { orient = o; setScene(sceneIx); }
    let scala = Math.min(devicePixelRatio || 1, 2);
    if (cw * ch * scala * scala > tetto)
      scala = Math.max(0.6, Math.sqrt(tetto / (cw * ch)));
    const w = Math.round(cw * scala), h = Math.round(ch * scala);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  /* il canvas si rimisura solo quando cambia qualcosa, non a ogni frame (evita riletture di layout) */
  let sporco = true;
  new ResizeObserver(() => { sporco = true; }).observe(canvas);
  addEventListener('resize', () => { sporco = true; }, { passive: true });

  const fromX = x => {
    const r = canvas.getBoundingClientRect();
    target = Math.min(.94, Math.max(.06, (x - r.left) / r.width));
    state.touched = true;
  };
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId); dragging = holding = true; fromX(e.clientX);
    onState?.(state, 'grab');
  });
  canvas.addEventListener('pointermove', e => { if (dragging) fromX(e.clientX); });
  for (const ev of ['pointerup', 'pointercancel'])
    canvas.addEventListener(ev, () => { dragging = holding = false; });
  canvas.addEventListener('dblclick', () => setScene(sceneIx + 1));
  addEventListener('keydown', e => {
    if (document.activeElement !== document.body && document.activeElement !== canvas) return;
    if (e.key === 'ArrowLeft')  { target = Math.max(.06, target - .04); state.touched = true; e.preventDefault(); }
    if (e.key === 'ArrowRight') { target = Math.min(.94, target + .04); state.touched = true; e.preventDefault(); }
    if (e.key === ' ' && scrollY < innerHeight * .9) { setScene(sceneIx + 1); e.preventDefault(); }
  });

  /* ── effetti del trascinamento (solo con il mouse) ──
     Cursore a mirino che segue il puntatore con inerzia, scintille lungo il
     movimento, scossa del confine e onda d'urto al clic. Tutto con transform e
     opacita', pausa fuori schermo, versione statica con "riduci movimento". */
  let kick = 0, splitPrev = .5;
  let tinta = null;   // colore corrente dell'accento, raggiunge quello della scena con una dissolvenza
  const tintaDiScena = i => ruotaTonalita(accento, SFASAMENTO_TONALITA[i % SFASAMENTO_TONALITA.length]);
  const pubblicaTinta = () => document.documentElement.style.setProperty('--scena-em', esadecimale(tintaDiScena(sceneIx)));
  document.addEventListener('palette', () => { queueMicrotask(pubblicaTinta); });
  const wave = { x: .5, y: .5, t: 2 };
  canvas.addEventListener('pointerdown', e => {
    if (reduce.matches) return;
    const r = canvas.getBoundingClientRect();
    wave.x = (e.clientX - r.left) / r.width;
    wave.y = 1 - (e.clientY - r.top) / r.height;
    wave.t = 0;
    kick = Math.min(1, kick + .6);
  });


  let glitchUntil = 0;
  let speedMult = 1.0;

  document.addEventListener('hero:glitch', e => {
    glitchUntil = performance.now() + (e.detail?.duration || 2000);
    holding = true;
  });
  document.addEventListener('hero:scene', e => {
    if (typeof e.detail?.index === 'number') setScene(e.detail.index);
    else setScene(sceneIx + 1);
  });
  document.addEventListener('hero:speed', e => {
    if (typeof e.detail?.multiplier === 'number') speedMult = e.detail.multiplier;
  });
  document.addEventListener('hero:set-split', e => {
    if (typeof e.detail?.split === 'number') {
      target = Math.min(.94, Math.max(.06, e.detail.split));
      state.touched = true;
    }
  });

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, .05); last = now;
    const isGlitch = now < glitchUntil;
    if (isGlitch) {
      target = 0.5 + Math.sin(now * 0.08) * 0.32 + (Math.random() - 0.5) * 0.2;
      holding = true;
    } else {
      if (holding && !dragging) holding = false;
      if (!dragging && !reduce.matches) target += Math.sin(now * .00016) * .00035;
    }
    split += (target - split) * Math.min(1, dt * (isGlitch ? 18 : 6));
    erode += ((holding ? 1 : 0) - erode) * Math.min(1, dt * (holding ? 3.2 : 1.8));

    if (sporco) { sporco = false; resize(); }
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uTexA, size.a[0], size.a[1]);
    gl.uniform2f(uTexB, size.b[0], size.b[1]);
    gl.uniform1f(uT, reduce.matches ? 12 : ((now - startedAt) * speedMult) / 1000);
    gl.uniform1f(uSplit, split);
    gl.uniform1f(uErode, erode);
    const bersaglio = tintaDiScena(sceneIx);
    if (!tinta) tinta = bersaglio.slice();
    else { const k = 1 - Math.exp(-dt * 4); for (let i = 0; i < 3; i++) tinta[i] += (bersaglio[i] - tinta[i]) * k; }
    gl.uniform3fv(uEm, tinta);
    const dS = Math.abs(split - splitPrev); splitPrev = split;
    if (!reduce.matches) kick = Math.min(1, kick + dS * 22);
    kick *= Math.exp(-dt * 3.2);
    if (wave.t < 2) wave.t += dt / 1.1;
    gl.uniform1f(uKick, reduce.matches ? 0 : kick);
    gl.uniform3f(uWave, wave.x, wave.y, reduce.matches ? 2 : wave.t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    /* cursore globale (mirino.js): tiene, etichetta, scintille lungo il confine */
    mirinoTieni(holding);
    mirinoDati(dragging ? `TU ${100 - Math.round(split * 100)} · AI ${Math.round(split * 100)}` : null);
    if (!reduce.matches && kick > .25) {
      const rc = canvas.getBoundingClientRect();
      emetti(rc.left + split * rc.width + (Math.random() - .5) * 6, rc.top + Math.random() * rc.height, 1, 60);
    }

    frames++;
    if (now - lastFps > 500) {
      state.fps = Math.round(frames * 1000 / (now - lastFps));
      frames = 0; lastFps = now;
      if (state.fps > 0 && state.fps < 40 && now - startedAt > 3000 && tetto > 1.3e6) { tetto *= 0.8; sporco = true; }
    }
    state.split = split; state.erode = erode; state.elapsed = now - startedAt;
    onState?.(state, 'frame');
  }
  const start = () => { if (raf) return; last = performance.now(); if (!startedAt) startedAt = last; lastFps = last; raf = requestAnimationFrame(frame); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; mirinoTieni(false); mirinoDati(null); };
  let inVista = false;
  new IntersectionObserver(([e]) => { inVista = e.isIntersecting; inVista ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden || !inVista) ? stop() : start());

  setScene(0).then(start);
  const controls = {
    state,
    nextScene: () => setScene(sceneIx + 1),
    vaiAScena: i => setScene(i),
    glitch: (duration = 2000) => { glitchUntil = performance.now() + duration; holding = true; },
    setSpeed: (m = 1.0) => { speedMult = m; },
    setSplit: (s) => { target = Math.min(.94, Math.max(.06, s)); state.touched = true; }
  };
  if (typeof window !== 'undefined') window.__fai_hero = controls;
  return controls;
}
