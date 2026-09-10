import { accentoGL } from './palette.js?v=20260910-144416';
/* ═══════════════════════════════════════════════════════════════════
 * materia.js — Prova 07.
 *
 * La stessa materia, tre disposizioni. I punti nascono campionando
 * un'immagine reale: ognuno tiene il colore del pixel da cui viene e
 * poi si riorganizza in griglia (grafica), nastro (video) o rete
 * (sistemi). Non è una transizione fra tre immagini: è una sola
 * materia che cambia ordine — che è poi quello che faccio.
 *
 * OGL, non Three: qui servono camera, geometria e profondità, non un
 * motore di scena. 15 KB gzip, caricati solo quando la sezione entra
 * nel viewport.
 * ═══════════════════════════════════════════════════════════════════ */

const COLS = 132, ROWS = 96;      /* ~12.600 punti */
/* Scelta consapevole: riusare un'immagine già in cache avrebbe risparmiato
   166 KB, ma quella scena è troppo affollata e nella nuvola diventa rumore.
   Qui il punto è vedere che ogni punto tiene il colore del pixel da cui
   viene: se l'immagine non si legge, la prova non prova niente.
   Il costo resta comunque differito. */
const SRC = '../assets/director-scene-design.webp';

const VERT = `
precision highp float;
attribute vec3 aGrid, aRibbon, aNet;
attribute vec3 aColor;
attribute float aSeed;

uniform mat4 modelViewMatrix, projectionMatrix;
uniform float uMixA, uMixB, uMixC;   /* pesi delle tre disposizioni */
uniform float uTime, uBurst, uSize;

varying vec3 vColor;
varying float vDepth;

void main(){
  vec3 p = aGrid * uMixA + aRibbon * uMixB + aNet * uMixC;

  /* respiro: la materia non sta mai perfettamente ferma */
  p.z += sin(uTime * .8 + aSeed * 6.28) * .015;
  p.x += sin(uTime * .5 + aSeed * 3.14) * .006;

  /* dispersione: i punti scappano lungo la propria direzione */
  vec3 away = normalize(p + vec3(aSeed - .5, aSeed * .7 - .35, aSeed * .3));
  p += away * uBurst * (.35 + aSeed * .9);

  vec4 mv = modelViewMatrix * vec4(p, 1.);
  vDepth = clamp(1.6 / -mv.z, 0., 2.);
  gl_PointSize = uSize * vDepth * (.55 + aSeed * .75);
  gl_Position = projectionMatrix * mv;
  vColor = aColor;
}`;

const FRAG = `
precision highp float;
varying vec3 vColor;
varying float vDepth;
uniform float uBurst;
uniform vec3  uEm;      /* l'accento: arriva dal foglio di stile, non e' piu' fisso */

void main(){
  vec2 c = gl_PointCoord - .5;
  float d = dot(c, c);
  if (d > .25) discard;
  float soft = smoothstep(.25, .02, d);

  /* verso lo smeraldo quando la materia si disperde */
  vec3 em = uEm;
  vec3 col = mix(vColor, em, .22 + uBurst * .45);
  col *= .78 + vDepth * .55;

  gl_FragColor = vec4(col, soft * (.72 + vDepth * .38));
}`;

/* le tre disposizioni, calcolate una volta sola */
function layouts(cols, rows) {
  const n = cols * rows;
  const grid = new Float32Array(n * 3);
  const ribbon = new Float32Array(n * 3);
  const net = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  let i = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++, i++) {
      const u = x / (cols - 1), v = y / (rows - 1);
      const sx = (u - .5) * 2.6, sy = -(v - .5) * 1.9;
      const rnd = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
      seed[i] = rnd;

      /* 1 · griglia — il piano editoriale: tutto su un asse, niente profondità */
      grid[i * 3] = sx;
      grid[i * 3 + 1] = sy;
      grid[i * 3 + 2] = (rnd - .5) * .05;

      /* 2 · nastro — la pellicola: il piano si arrotola nel tempo */
      const a = (u - .5) * 2.4;
      ribbon[i * 3] = Math.sin(a) * 1.55;
      ribbon[i * 3 + 1] = sy * .82 + Math.sin(u * 9.4) * .06;
      ribbon[i * 3 + 2] = Math.cos(a) * 1.55 - 1.2;

      /* 3 · rete — il sistema: la materia si distribuisce nello spazio */
      const phi = Math.acos(1 - 2 * (i + .5) / n);
      const th = Math.PI * (1 + Math.sqrt(5)) * i;
      const rad = 1.05 + rnd * .18;
      net[i * 3] = Math.sin(phi) * Math.cos(th) * rad;
      net[i * 3 + 1] = Math.cos(phi) * rad * .78;
      net[i * 3 + 2] = Math.sin(phi) * Math.sin(th) * rad;
    }
  }
  return { grid, ribbon, net, seed, n };
}

/* colori: presi da un'immagine vera, non generati */
async function sample(cols, rows) {
  const img = await new Promise(res => {
    const i = new Image(); i.decoding = 'async';
    i.onload = () => res(i); i.onerror = () => res(null); i.src = SRC;
  });
  const colors = new Float32Array(cols * rows * 3);
  if (!img) { colors.fill(.4); return colors; }
  const c = document.createElement('canvas');
  c.width = cols; c.height = rows;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, cols, rows);
  const px = ctx.getImageData(0, 0, cols, rows).data;
  const n = cols * rows;

  /* auto-livelli: la scena sorgente è volutamente buia e i punti
     ereditavano quel buio. Si porta il 98° percentile a fondo scala,
     si alzano i mezzitoni e si mette un pavimento, così anche i pixel
     più scuri restano visibili senza appiattire i chiari. */
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    lum[i] = (px[i * 4] * .2126 + px[i * 4 + 1] * .7152 + px[i * 4 + 2] * .0722) / 255;
  }
  const sorted = Float32Array.from(lum).sort();
  const hi = Math.max(sorted[Math.floor(n * 0.98)], 0.12);
  const gain = 1 / hi;

  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) {
      let v = (px[i * 4 + c] / 255) * gain;
      v = Math.min(1, v) ** 0.68;              /* mezzitoni sollevati */
      colors[i * 3 + c] = 0.16 + v * 0.94;     /* pavimento: nessun punto spento */
    }
  }
  return colors;
}

export async function initMateria(canvas, onState) {
  const { Renderer, Camera, Transform, Program, Geometry, Mesh } =
    await import('./vendor/ogl.min.js');

  const renderer = new Renderer({
    canvas, dpr: Math.min(devicePixelRatio || 1, 2),
    alpha: true, antialias: false, premultipliedAlpha: false,
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  const camera = new Camera(gl, { fov: 42, near: .1, far: 40 });
  camera.position.set(0, 0, 2.6);
  const scene = new Transform();

  const L = layouts(COLS, ROWS);
  const colors = await sample(COLS, ROWS);

  const geometry = new Geometry(gl, {
    position: { size: 3, data: L.grid },
    aGrid:    { size: 3, data: L.grid },
    aRibbon:  { size: 3, data: L.ribbon },
    aNet:     { size: 3, data: L.net },
    aColor:   { size: 3, data: colors },
    aSeed:    { size: 1, data: L.seed },
  });

  const uniforms = {
    uMixA: { value: 1 }, uMixB: { value: 0 }, uMixC: { value: 0 },
    uTime: { value: 0 }, uBurst: { value: 0 }, uSize: { value: 4.2 },
    uEm: { value: accentoGL() },
  };
  document.addEventListener('palette', () => { uniforms.uEm.value = accentoGL(); });

  const program = new Program(gl, {
    vertex: VERT, fragment: FRAG, uniforms,
    transparent: true, depthTest: false, depthWrite: false, cullFace: null,
  });
  new Mesh(gl, { mode: gl.POINTS, geometry, program }).setParent(scene);

  /* stato */
  const NAMES = ['Griglia · grafica', 'Nastro · video', 'Rete · sistemi'];
  const target = [1, 0, 0];
  const cur = [1, 0, 0];
  let mode = 0, burst = 0, burstT = 0, holding = false;
  let px = 0, py = 0, tx = 0, ty = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  function setMode(i) {
    mode = ((i % 3) + 3) % 3;
    target[0] = mode === 0 ? 1 : 0;
    target[1] = mode === 1 ? 1 : 0;
    target[2] = mode === 2 ? 1 : 0;
    onState?.({ mode, name: NAMES[mode] }, 'mode');
  }

  function resize() {
    /* OGL scrive width/height inline sul canvas: le rimettiamo al 100%
       subito dopo, altrimenti litiga con l'altezza decisa dal CSS. */
    const r = canvas.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (!w || !h) return;
    renderer.setSize(w, h);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    camera.perspective({ aspect: w / h });
    /* la nuvola riempie il campo anche sui formati molto larghi */
    camera.position.z = 2.75 + Math.max(0, 1.5 - w / h) * 1.05;
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const fromEvent = e => {
    const r = canvas.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - .5) * 2;
    ty = ((e.clientY - r.top) / r.height - .5) * 2;
  };
  canvas.addEventListener('pointermove', fromEvent);
  canvas.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId); holding = true; fromEvent(e);
    onState?.({ mode, name: NAMES[mode] }, 'grab');
  });
  for (const ev of ['pointerup', 'pointercancel'])
    canvas.addEventListener(ev, () => { holding = false; });

  let raf = 0, last = 0, t0 = 0, frames = 0, acc = 0, lastFps = 0, fps = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, .05); last = now;
    if (!t0) t0 = now;

    for (let i = 0; i < 3; i++) cur[i] += (target[i] - cur[i]) * Math.min(1, dt * 3.4);
    uniforms.uMixA.value = cur[0];
    uniforms.uMixB.value = cur[1];
    uniforms.uMixC.value = cur[2];

    burstT = holding ? 1 : 0;
    burst += (burstT - burst) * Math.min(1, dt * (holding ? 4 : 2.2));
    uniforms.uBurst.value = burst;
    uniforms.uTime.value = reduce.matches ? 4 : (now - t0) / 1000;

    /* parallasse: la camera segue il puntatore, non il contrario */
    px += (tx - px) * Math.min(1, dt * 2.6);
    py += (ty - py) * Math.min(1, dt * 2.6);
    const spin = reduce.matches ? 0 : (now - t0) / 1000 * .09;
    scene.rotation.y = px * .5 + spin * (cur[2] > .5 ? 1 : .25);
    scene.rotation.x = -py * .32;

    renderer.render({ scene, camera });

    frames++; acc += dt;
    if (now - lastFps > 500) { fps = Math.round(frames / acc); frames = 0; acc = 0; lastFps = now; }
    onState?.({ mode, name: NAMES[mode], burst, fps, points: L.n }, 'frame');
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => e.isIntersecting ? start() : stop()).observe(canvas);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  start();

  return { setMode, points: L.n, names: NAMES };
}
