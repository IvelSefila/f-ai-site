(function initPlaylabChoir(global) {
  "use strict";

  const root = global.FAIPlaylab = global.FAIPlaylab || {};
  const TAU = Math.PI * 2;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const wrap = angle => ((angle % TAU) + TAU) % TAU;
  const phaseDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

  function seedValue(input) {
    const text = String(input == null ? "choir-01" : input);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0 || 1;
  }

  function seededRandom(seed) {
    let value = seedValue(seed);
    return () => {
      value += 0x6D2B79F5;
      let next = value;
      next = Math.imul(next ^ next >>> 15, next | 1);
      next ^= next + Math.imul(next ^ next >>> 7, next | 61);
      return ((next ^ next >>> 14) >>> 0) / 4294967296;
    };
  }

  function normaliseConfig(input) {
    const source = input || {};
    const bandCount = [3, 4, 5].includes(Number(source.bandCount)) ? Number(source.bandCount) : 4;
    const tuningRatios = ["open", "fifth", "spectral"].includes(source.tuningRatios) ? source.tuningRatios : "fifth";
    const tempoDrift = ["calm", "alive", "volatile"].includes(source.tempoDrift) ? source.tempoDrift : "alive";
    const harmonicRule = ["consonance", "orbit", "counterpoint"].includes(source.harmonicRule) ? source.harmonicRule : "consonance";
    const spectralMaterial = ["silk", "glass", "plasma"].includes(source.spectralMaterial) ? source.spectralMaterial : "glass";
    return {
      bandCount,
      tuningRatios,
      tempoDrift,
      harmonicRule,
      spectralMaterial,
      intensity: clamp(Number(source.intensity) || 2, 1, 3),
      seed: source.seed == null ? "choir-01" : source.seed,
      reducedMotion: Boolean(source.reducedMotion),
    };
  }

  function createChoir(options) {
    const settings = options || {};
    const canvas = settings.canvas;
    if (!canvas || typeof canvas.getContext !== "function") throw new TypeError("Choir requires a canvas.");
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) throw new Error("Choir could not acquire a 2D context.");

    const config = normaliseConfig(settings.config);
    const emit = typeof settings.onEvent === "function" ? settings.onEvent : () => {};
    const random = seededRandom(config.seed);
    const palette = {
      silk: ["#f7f5ee", "#caff3d", "#7f6cff", "#69e5f5", "#ff7557"],
      glass: ["#effffa", "#73f2d1", "#8e7dff", "#d2ff42", "#ff9d66"],
      plasma: ["#fff6f0", "#ff5ca8", "#7f6cff", "#74f3ff", "#ffd84c"],
    }[config.spectralMaterial];
    const tempoBase = { calm: 1.05, alive: 1.34, volatile: 1.66 }[config.tempoDrift] * (0.9 + config.intensity * 0.08);
    const tolerance = { consonance: 0.32, orbit: 0.27, counterpoint: 0.23 }[config.harmonicRule];
    const targetSets = {
      open: [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI / 4],
      fifth: [0, Math.PI * 0.72, Math.PI * 1.18, Math.PI * 1.66, Math.PI * 0.34],
      spectral: [0, Math.PI * 0.38, Math.PI * 0.91, Math.PI * 1.43, Math.PI * 1.87],
    }[config.tuningRatios];

    let width = 1;
    let height = 1;
    let dpr = 1;
    let centerX = 0;
    let centerY = 0;
    let outerRadius = 1;
    let frame = 0;
    let lastTime = 0;
    let accumulator = 0;
    let running = false;
    let paused = false;
    let destroyed = false;
    let pointerBand = -1;
    let pointerAngle = 0;
    let selectedBand = 0;
    const activePointers = new Map();

    const state = {
      status: "ready",
      score: 0,
      level: 1,
      combo: 0,
      harmony: 0,
      stability: 100,
      lockedChords: 0,
      targetChords: 6 + config.intensity,
      beat: 0,
      beatWindow: 0,
      elapsed: 0,
      selectedBand: 0,
      message: "ACCORDA I CERCHI",
      bands: [],
      targets: [],
      sparks: [],
    };

    function makeTargets() {
      const rotation = random() * TAU;
      state.targets = Array.from({ length: config.bandCount }, (_, index) => {
        const counter = config.harmonicRule === "counterpoint" && index % 2 ? -1 : 1;
        const offset = targetSets[index] == null ? index * TAU / config.bandCount : targetSets[index];
        return wrap(rotation + offset * counter + (random() - 0.5) * 0.12);
      });
    }

    function resetState() {
      state.status = "ready";
      state.score = 0;
      state.level = 1;
      state.combo = 0;
      state.harmony = 0;
      state.stability = 100;
      state.lockedChords = 0;
      state.targetChords = 6 + config.intensity;
      state.beat = 0;
      state.beatWindow = 0;
      state.elapsed = 0;
      state.message = "ACCORDA I CERCHI";
      state.sparks = [];
      state.bands = Array.from({ length: config.bandCount }, (_, index) => ({
        angle: wrap(random() * TAU),
        velocity: 0,
        frequency: 0.78 + index * 0.17,
        energy: 0,
      }));
      selectedBand = 0;
      state.selectedBand = 0;
      makeTargets();
      emit("state", publicState());
    }

    function publicState() {
      return {
        status: state.status,
        score: state.score,
        level: state.level,
        combo: state.combo,
        harmony: Math.round(state.harmony * 100),
        stability: Math.round(state.stability),
        progress: state.lockedChords / state.targetChords,
        lockedChords: state.lockedChords,
        targetChords: state.targetChords,
        selectedBand: state.selectedBand,
        message: state.message,
        engine: "choir",
      };
    }

    function resize() {
      const rect = typeof canvas.getBoundingClientRect === "function" ? canvas.getBoundingClientRect() : { width: canvas.width || 640, height: canvas.height || 640 };
      width = Math.max(1, Math.round(rect.width || canvas.width || 640));
      height = Math.max(1, Math.round(rect.height || canvas.height || 640));
      dpr = clamp(global.devicePixelRatio || 1, 1, 2);
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      if (typeof ctx.setTransform === "function") ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      centerX = width * 0.5;
      centerY = height * 0.49;
      outerRadius = Math.max(54, Math.min(width, height) * 0.39);
      draw();
      return { width, height, dpr };
    }

    function bandRadius(index) {
      const inner = outerRadius * 0.32;
      return inner + (outerRadius - inner) * (index / Math.max(1, config.bandCount - 1));
    }

    function calculateHarmony() {
      let sum = 0;
      state.bands.forEach((band, index) => {
        const error = phaseDistance(band.angle, state.targets[index]);
        sum += clamp(1 - error / Math.PI, 0, 1);
        band.energy += (clamp(1 - error / tolerance, 0, 1) - band.energy) * 0.14;
      });
      return Math.pow(sum / state.bands.length, 1.35);
    }

    function burst(success) {
      const count = config.reducedMotion ? 8 : success ? 32 : 14;
      for (let index = 0; index < count; index += 1) {
        const angle = random() * TAU;
        const speed = (success ? 42 : 20) + random() * (success ? 92 : 45);
        state.sparks.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.55 + random() * 0.65,
          age: 0,
          color: palette[1 + Math.floor(random() * (palette.length - 1))],
        });
      }
      if (state.sparks.length > 100) state.sparks.splice(0, state.sparks.length - 100);
    }

    function conduct() {
      if (state.status !== "playing") return false;
      const beatQuality = 1 - Math.min(1, Math.abs(Math.sin(state.beat * Math.PI)));
      const tuned = state.harmony >= 0.78;
      const rhythmic = beatQuality >= 0.34;
      if (tuned && rhythmic) {
        const precision = clamp((state.harmony - 0.72) / 0.28, 0, 1);
        state.combo += 1;
        state.lockedChords += 1;
        state.score += Math.round((500 + precision * 900) * (1 + Math.min(6, state.combo) * 0.16));
        state.stability = clamp(state.stability + 9, 0, 100);
        state.message = precision > 0.76 ? "RISONANZA PERFETTA" : "RISONANZA CATTURATA";
        burst(true);
        emit("chord", { precision, ...publicState() });
        if (state.lockedChords >= state.targetChords) {
          state.status = "won";
          state.message = "CAMPO ARMONICO COMPLETATO";
          running = false;
          emit("win", publicState());
        } else {
          state.level = 1 + Math.floor(state.lockedChords / 2);
          state.bands.forEach((band, index) => {
            band.angle = wrap(band.angle + (random() - 0.5) * (0.9 + index * 0.1));
            band.velocity *= 0.2;
          });
          makeTargets();
        }
      } else {
        state.combo = 0;
        state.stability = clamp(state.stability - (rhythmic ? 5 : 8), 0, 100);
        state.message = tuned ? "ASPETTA IL BATTITO" : "I CERCHI NON SONO ALLINEATI";
        burst(false);
        emit("miss", publicState());
      }
      emit("score", publicState());
      return tuned && rhythmic;
    }

    function update(dt) {
      if (state.status !== "playing") return;
      state.elapsed += dt;
      const oldBeat = state.beat;
      const drift = config.tempoDrift === "volatile" ? Math.sin(state.elapsed * 0.43) * 0.14 : config.tempoDrift === "alive" ? Math.sin(state.elapsed * 0.21) * 0.06 : 0;
      state.beat = wrap(state.beat + dt * (tempoBase + drift)) / TAU * TAU;
      state.beatWindow = 1 - Math.abs(Math.sin(state.beat * Math.PI));
      if (state.beat < oldBeat) emit("beat", publicState());

      state.bands.forEach((band, index) => {
        band.angle = wrap(band.angle + band.velocity * dt);
        band.velocity *= Math.pow(0.07, dt);
        const idleDrift = config.harmonicRule === "orbit" ? (index % 2 ? -1 : 1) * 0.018 : 0;
        band.angle = wrap(band.angle + idleDrift * dt);
      });
      state.harmony += (calculateHarmony() - state.harmony) * Math.min(1, dt * 8);
      state.stability = clamp(state.stability - dt * (0.52 + config.intensity * 0.13), 0, 100);
      for (let index = state.sparks.length - 1; index >= 0; index -= 1) {
        const spark = state.sparks[index];
        spark.age += dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        spark.vx *= Math.pow(0.08, dt);
        spark.vy *= Math.pow(0.08, dt);
        if (spark.age >= spark.life) state.sparks.splice(index, 1);
      }
      if (state.stability <= 0) {
        state.status = "over";
        state.message = "IL CAMPO SI È DISSOLTO";
        running = false;
        emit("gameover", publicState());
      }
      emit("state", publicState());
    }

    function circle(context, x, y, radius) {
      context.beginPath();
      context.arc(x, y, radius, 0, TAU);
    }

    function drawBackground() {
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.72);
      gradient.addColorStop(0, config.spectralMaterial === "plasma" ? "#1b0b1d" : "#101713");
      gradient.addColorStop(0.55, "#080b0a");
      gradient.addColorStop(1, "#040505");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.strokeStyle = "rgba(255,255,255,.035)";
      ctx.lineWidth = 1;
      for (let radius = outerRadius * 0.22; radius < outerRadius * 1.23; radius += outerRadius * 0.12) {
        circle(ctx, 0, 0, radius);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawWaveField() {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      state.bands.forEach((band, index) => {
        const radius = bandRadius(index);
        ctx.beginPath();
        for (let step = 0; step <= 96; step += 1) {
          const angle = step / 96 * TAU;
          const wave = Math.sin(angle * (2 + index) + band.angle * 2 + state.elapsed * band.frequency) * (3 + band.energy * 7);
          const x = centerX + Math.cos(angle) * (radius + wave);
          const y = centerY + Math.sin(angle) * (radius + wave);
          if (!step) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `${palette[(index + 1) % palette.length]}${Math.round((0.14 + band.energy * 0.28) * 255).toString(16).padStart(2, "0")}`;
        ctx.lineWidth = 1 + band.energy * 2;
        ctx.stroke();
      });
      ctx.restore();
    }

    function drawBands() {
      state.bands.forEach((band, index) => {
        const radius = bandRadius(index);
        const color = palette[(index + 1) % palette.length];
        const target = state.targets[index];
        const thickness = Math.max(8, outerRadius * 0.035);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.strokeStyle = index === selectedBand ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.09)";
        ctx.lineWidth = thickness;
        circle(ctx, 0, 0, radius);
        ctx.stroke();

        ctx.lineCap = "round";
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12 + band.energy * 20;
        ctx.lineWidth = Math.max(3, thickness * 0.36);
        ctx.beginPath();
        ctx.arc(0, 0, radius, band.angle - 0.22, band.angle + 0.22);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,.76)";
        ctx.lineWidth = Math.max(2, thickness * 0.22);
        ctx.beginPath();
        ctx.arc(0, 0, radius, target - tolerance, target + tolerance);
        ctx.stroke();
        const tx = Math.cos(target) * radius;
        const ty = Math.sin(target) * radius;
        ctx.fillStyle = color;
        circle(ctx, tx, ty, 2.5 + band.energy * 2.5);
        ctx.fill();
        ctx.restore();
      });
    }

    function drawCore() {
      const pulse = 0.5 + 0.5 * Math.cos(state.beat * 2);
      const coreRadius = outerRadius * (0.15 + pulse * 0.025);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.globalCompositeOperation = "lighter";
      const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 2.5);
      coreGradient.addColorStop(0, `rgba(255,255,255,${0.4 + state.harmony * 0.5})`);
      coreGradient.addColorStop(0.22, palette[1]);
      coreGradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = coreGradient;
      circle(ctx, 0, 0, coreRadius * 2.5);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#090c0a";
      circle(ctx, 0, 0, coreRadius);
      ctx.fill();
      ctx.strokeStyle = state.harmony > 0.78 ? palette[1] : "rgba(255,255,255,.5)";
      ctx.lineWidth = 2;
      circle(ctx, 0, 0, coreRadius);
      ctx.stroke();
      ctx.fillStyle = "#f5f7f3";
      ctx.font = `500 ${Math.max(8, outerRadius * 0.04)}px DM Mono, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TOCCA", 0, 0);
      ctx.restore();
    }

    function drawSparks() {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      state.sparks.forEach(spark => {
        const alpha = clamp(1 - spark.age / spark.life, 0, 1);
        ctx.fillStyle = `${spark.color}${Math.round(alpha * 220).toString(16).padStart(2, "0")}`;
        circle(ctx, spark.x, spark.y, 1.2 + alpha * 2.4);
        ctx.fill();
      });
      ctx.restore();
    }

    function draw() {
      if (!width || !height) return;
      drawBackground();
      drawWaveField();
      drawBands();
      drawCore();
      drawSparks();
    }

    const requestFrame = global.requestAnimationFrame || (callback => setTimeout(() => callback(Date.now()), 16));
    const cancelFrame = global.cancelAnimationFrame || clearTimeout;
    function scheduleTick() {
      if (frame || destroyed || !running || paused) return;
      frame = requestFrame(tick);
    }

    function tick(time) {
      frame = 0;
      if (destroyed) return;
      if (!lastTime) lastTime = time;
      const delta = clamp((time - lastTime) / 1000, 0, 0.05);
      lastTime = time;
      if (running && !paused) {
        accumulator += delta;
        const step = 1 / 60;
        let iterations = 0;
        while (accumulator >= step && iterations < 4) {
          update(step);
          accumulator -= step;
          iterations += 1;
        }
      }
      draw();
      scheduleTick();
    }

    function rotateBand(index, delta) {
      if (!state.bands[index] || state.status !== "playing") return;
      state.bands[index].angle = wrap(state.bands[index].angle + delta);
      state.bands[index].velocity = clamp(delta * 9, -3.4, 3.4);
      selectedBand = index;
      state.selectedBand = index;
    }

    function pointFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function bandAt(point) {
      const distance = Math.hypot(point.x - centerX, point.y - centerY);
      const core = outerRadius * 0.22;
      if (distance < core) return -2;
      let best = -1;
      let nearest = Infinity;
      for (let index = 0; index < state.bands.length; index += 1) {
        const error = Math.abs(distance - bandRadius(index));
        if (error < nearest) { nearest = error; best = index; }
      }
      return nearest < Math.max(28, outerRadius * 0.11) ? best : -1;
    }

    function onPointerDown(event) {
      if (destroyed) return;
      if (typeof canvas.setPointerCapture === "function") canvas.setPointerCapture(event.pointerId);
      const point = pointFromEvent(event);
      const band = bandAt(point);
      const angle = Math.atan2(point.y - centerY, point.x - centerX);
      activePointers.set(event.pointerId, { point, angle, band });
      pointerBand = band;
      pointerAngle = angle;
      if (band === -2) conduct();
      else if (band >= 0) {
        selectedBand = band;
        state.selectedBand = band;
      }
      event.preventDefault();
    }

    function onPointerMove(event) {
      const saved = activePointers.get(event.pointerId);
      if (!saved) return;
      const point = pointFromEvent(event);
      const angle = Math.atan2(point.y - centerY, point.x - centerX);
      const delta = Math.atan2(Math.sin(angle - saved.angle), Math.cos(angle - saved.angle));
      const touches = activePointers.size;
      if (saved.band >= 0) {
        rotateBand(saved.band, delta);
        if (touches > 1) {
          const neighbour = (saved.band + 1) % state.bands.length;
          rotateBand(neighbour, -delta * 0.32);
        }
      }
      saved.point = point;
      saved.angle = angle;
      pointerAngle = angle;
      event.preventDefault();
    }

    function onPointerUp(event) {
      activePointers.delete(event.pointerId);
      pointerBand = -1;
      if (typeof canvas.releasePointerCapture === "function" && canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      event.preventDefault();
    }

    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    canvas.addEventListener("pointermove", onPointerMove, { passive: false });
    canvas.addEventListener("pointerup", onPointerUp, { passive: false });
    canvas.addEventListener("pointercancel", onPointerUp, { passive: false });

    function input(command) {
      const data = typeof command === "string" ? { type: command } : command || {};
      const type = data.type || data.direction;
      if (type === "left") rotateBand(selectedBand, -0.16);
      else if (type === "right") rotateBand(selectedBand, 0.16);
      else if (type === "up") {
        selectedBand = (selectedBand - 1 + state.bands.length) % state.bands.length;
        state.selectedBand = selectedBand;
      } else if (type === "down") {
        selectedBand = (selectedBand + 1) % state.bands.length;
        state.selectedBand = selectedBand;
      } else if (type === "action" || type === "tap") conduct();
      else if (type === "rotate") rotateBand(clamp(Number(data.band) || 0, 0, state.bands.length - 1), Number(data.delta) || 0);
      else if (type === "pause") pause();
      return publicState();
    }

    function start() {
      if (destroyed) return publicState();
      if (["won", "over"].includes(state.status)) resetState();
      state.status = "playing";
      state.message = "ALLINEA / TOCCA IL CENTRO";
      paused = false;
      running = true;
      lastTime = 0;
      emit("start", publicState());
      scheduleTick();
      return publicState();
    }

    function pause() {
      if (state.status !== "playing") return publicState();
      paused = true;
      running = false;
      state.status = "paused";
      state.message = "GIOCO IN PAUSA";
      if (frame) cancelFrame(frame);
      frame = 0;
      draw();
      emit("pause", publicState());
      return publicState();
    }

    function resume() {
      if (state.status !== "paused") return publicState();
      paused = false;
      running = true;
      lastTime = 0;
      state.status = "playing";
      state.message = "ALLINEA / TOCCA IL CENTRO";
      emit("resume", publicState());
      scheduleTick();
      return publicState();
    }

    function restart() {
      resetState();
      return start();
    }

    function destroy() {
      destroyed = true;
      running = false;
      paused = false;
      if (frame) cancelFrame(frame);
      frame = 0;
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      activePointers.clear();
      emit("destroy", publicState());
    }

    resetState();
    resize();

    return {
      start,
      pause,
      resume,
      restart,
      destroy,
      resize,
      input,
      getState: publicState,
      snapshot: () => ({ ...publicState(), config: { ...config } }),
    };
  }

  root.createChoir = createChoir;
})(typeof window !== "undefined" ? window : globalThis);
