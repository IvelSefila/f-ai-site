import { accentoGL } from './palette.js?v=20260908-202839';
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

uniform vec3 uEm;                 /* l'accento arriva dal foglio di stile */
#define EM uEm
const vec3 EMLO = vec3(.039, .561, .388);

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

  float big  = fbm(vec2(uv.y * 3.2, t * .06)) - .5;
  float fine = fbm(vec2(uv.y * 22., t * .35)) - .5;
  float warp = big * .085 + fine * (.012 + uErode * .07);
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
  ai = mix(ai * vec3(.30, 1., .34), EM * (ga * 1.55), .42);
  ai += EM * smoothstep(.60, 1., ga) * .58;

  float m = smoothstep(-.012, .012, edge);
  vec3 col = mix(human, ai, m);

  float line = exp(-pow(edge / .0028, 2.));
  col += EM * line * 1.5;
  col += EMLO * exp(-pow(edge / .028, 2.)) * .3;

  float fl = step(.80, fbm(uv * vec2(28., 46.) + vec2(t * .5, -t * .3)));
  col += EM * fl * exp(-pow(edge / (.03 + uErode * .1), 2.)) * (.55 + uErode);

  vec2 gp = fract(uv * vec2(46., 26.));
  float grid = smoothstep(.965, 1., max(gp.x, gp.y));
  col += EMLO * grid * m * .10;

  col *= 1. - .55 * pow(length((uv - .5) * vec2(1.05, 1.)), 2.4);
  o = vec4(col, 1.);
}`;

const SCENES = [
  ['../assets/director-scene-film.webp',   '../assets/director-scene-system.webp', 'Regia video'],
  ['../assets/director-scene-design.webp', '../assets/director-scene-system.webp', 'Sistema visivo'],
  ['../assets/signal-atlas-v1.webp',       '../assets/director-scene-system.webp', 'Flussi e agenti'],
];

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
        uTexA = U('uTexA'), uTexB = U('uTexB'), uEm = U('uEm');
  gl.uniform1i(U('uA'), 0); gl.uniform1i(U('uB'), 1);

  const mk = unit => {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([8, 10, 14, 255]));
    for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
                          [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]])
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
    size[key] = [img.naturalWidth, img.naturalHeight];
  };

  let sceneIx = 0;
  async function setScene(i) {
    sceneIx = (i + SCENES.length) % SCENES.length;
    const [a, b, name] = SCENES[sceneIx];
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia) upload(0, texA, ia, 'a');
    if (ib) upload(1, texB, ib, 'b');
    state.scene = sceneIx; state.sceneName = name;
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
  const MAX_FRAMMENTI = 2.6e6;
  function resize() {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return;
    let scala = Math.min(devicePixelRatio || 1, 2);
    if (cw * ch * scala * scala > MAX_FRAMMENTI)
      scala = Math.max(0.75, Math.sqrt(MAX_FRAMMENTI / (cw * ch)));
    const w = Math.round(cw * scala), h = Math.round(ch * scala);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  new ResizeObserver(resize).observe(canvas);

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

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, .05); last = now;
    if (!dragging && !reduce.matches) target += Math.sin(now * .00016) * .00035;
    split += (target - split) * Math.min(1, dt * 6);
    erode += ((holding ? 1 : 0) - erode) * Math.min(1, dt * (holding ? 3.2 : 1.8));

    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uTexA, size.a[0], size.a[1]);
    gl.uniform2f(uTexB, size.b[0], size.b[1]);
    gl.uniform1f(uT, reduce.matches ? 12 : (now - startedAt) / 1000);
    gl.uniform1f(uSplit, split);
    gl.uniform1f(uErode, erode);
    gl.uniform3fv(uEm, accento);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    frames++;
    if (now - lastFps > 500) {
      state.fps = Math.round(frames * 1000 / (now - lastFps));
      frames = 0; lastFps = now;
    }
    state.split = split; state.erode = erode; state.elapsed = now - startedAt;
    onState?.(state, 'frame');
  }
  const start = () => { if (raf) return; last = performance.now(); if (!startedAt) startedAt = last; lastFps = last; raf = requestAnimationFrame(frame); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => e.isIntersecting ? start() : stop()).observe(canvas);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  setScene(0).then(start);
  return { state, nextScene: () => setScene(sceneIx + 1), vaiAScena: i => setScene(i) };
}
