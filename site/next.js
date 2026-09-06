(() => {
  "use strict";

  const canvas = document.querySelector("#hero-signal-field");
  const hero = document.querySelector(".hero");
  const atlas = document.querySelector(".hero__atlas");
  const remixButton = document.querySelector("#signal-remix");
  const particleSwitch = document.querySelector("#particle-switch");
  const particleMode = document.querySelector("#particle-mode");
  const gestureLabel = document.querySelector("#glass-gesture-label");
  const humanImage = document.querySelector(".hero__atlas-image--human");
  const systemImage = document.querySelector(".hero__atlas-image--system");
  const sceneFrame = document.querySelector("#director-scene-frame");
  const sceneTitle = document.querySelector("#director-scene-title");
  const scenePurpose = document.querySelector("#director-scene-purpose");
  const sceneDescription = document.querySelector("#director-scene-description");
  const sceneNote = document.querySelector("#director-scene-note");
  const autoState = document.querySelector("#director-auto-state");
  const sceneDots = Array.from(document.querySelectorAll("[data-scene-index]"));
  const presetButtons = Array.from(document.querySelectorAll("[data-particle-preset]"));
  const status = document.querySelector("#particle-status");
  const controls = {
    density: document.querySelector("#particle-density"),
    force: document.querySelector("#particle-force"),
    trail: document.querySelector("#particle-trail"),
  };
  if (!(canvas instanceof HTMLCanvasElement) || !hero) return;

  const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!context) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const pointer = { x: .5, y: .5, active: false };
  const hold = { x: .5, y: .5, active: false, pointerId: null, charge: 0 };
  const settings = {
    preset: "network",
    density: Number(controls.density?.value || 56),
    force: Number(controls.force?.value || 64),
    trail: Number(controls.trail?.value || 38),
    director: .5,
  };
  const presetLabels = {
    network: "RETE DINAMICA",
    orbit: "CAMPO ORBITALE",
    pulse: "IMPULSO RADIALE",
    pixel: "PIXEL ARCADE",
  };
  const presetShortLabels = {
    network: "RETE",
    orbit: "ORBITA",
    pulse: "IMPULSO",
    pixel: "PIXEL",
  };
  const holdLabels = {
    network: "COMPONGO IL SIGILLO NEURALE…",
    orbit: "CREO LA SINGOLARITÀ…",
    pulse: "CARICO IL REATTORE…",
    pixel: "CARICAMENTO CORE ARCADE…",
  };
  const morphDurations = {
    network: 3,
    orbit: 3.2,
    pulse: 2.8,
    pixel: 3,
  };
  const scenes = [
    {
      src: "assets/director-scene-film.webp",
      frame: "SCENA 01 / REGIA VIDEO",
      title: "REGIA IN MOVIMENTO",
      purpose: "FOTOGRAMMI · RITMO · MONTAGGIO",
      description: "Ritmo e atmosfera, frame dopo frame.",
      note: "Monto, rifinisco e guido lo sguardo.",
      alt: "Scena astratta dedicata alla regia video: fotogrammi sospesi, diaframma ottico e traiettorie luminose.",
      preset: "network",
      density: 58,
      force: 68,
      trail: 42,
    },
    {
      src: "assets/director-scene-design.webp",
      frame: "SCENA 02 / SISTEMA VISIVO",
      title: "UN’IDEA, PIÙ FORMATI",
      purpose: "CARTA · GRIGLIA · ADATTAMENTI",
      description: "Un’identità forte, in ogni formato.",
      note: "Adatto la stessa idea a ogni canale.",
      alt: "Scena astratta dedicata alla grafica pubblicitaria: formati cartacei, griglie, vetro e particelle tipografiche.",
      preset: "pulse",
      density: 76,
      force: 38,
      trail: 22,
    },
    {
      src: "assets/director-scene-system.webp",
      frame: "SCENA 03 / FLUSSO AI",
      title: "SISTEMI CHE COOPERANO",
      purpose: "AGENTI · NODI · OUTPUT",
      description: "Automazioni AI, sempre sotto regia umana.",
      note: "Coordino modelli e agenti con controllo umano.",
      alt: "Scena astratta dedicata ai sistemi AI: nodi coordinati, flussi luminosi e moduli di contenuto.",
      preset: "orbit",
      density: 48,
      force: 86,
      trail: 76,
    },
  ];
  const palettes = [
    ["#f1a457", "#f5f6f7", "#89a7c8", "#dfe6ee"],
    ["#6ea8ff", "#326dff", "#f5f6f7", "#a9c9ff"],
    ["#6ea8ff", "#88d5ff", "#ad8cff", "#f5f6f7"],
  ];

  let points = [];
  let width = 1;
  let height = 1;
  let dpr = 1;
  let visible = true;
  let animationFrame = 0;
  let previousTime = 0;
  let elapsed = 0;
  let rebuildFrame = 0;
  let sceneIndex = 0;
  let pointerReleaseTimer = 0;
  let idleSceneTimer = 0;
  let activityFrame = 0;
  let morphUntil = 0;
  let morphDuration = 1.8;
  let morphPreset = "network";
  const morphOrigin = { x: .5, y: .5 };
  const sceneSwipe = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
  };

  function pointCount() {
    const ceiling = window.innerWidth < 520 ? 34 : window.innerWidth < 980 ? 46 : 62;
    return Math.round(10 + (settings.density / 100) * (ceiling - 10));
  }

  function activePalette() {
    if (settings.preset === "pixel") return ["#7cff6b", "#ffd34e", "#ff4fd8", "#6ef2ff"];
    return palettes[sceneIndex] || palettes[1];
  }

  function makePoint(index, total) {
    const angle = (index / Math.max(total, 1)) * Math.PI * 2 + Math.random() * .24;
    const radius = .13 + Math.random() * .35;
    const palette = activePalette();
    let x = .5 + Math.cos(angle) * radius;
    let y = .49 + Math.sin(angle) * radius * .7;

    if (settings.preset === "network") {
      x += (Math.random() - .5) * .2;
      y += (Math.random() - .5) * .16;
    } else if (settings.preset === "pulse") {
      const band = .1 + (index % 4) * .085 + Math.random() * .035;
      x = .5 + Math.cos(angle) * band;
      y = .5 + Math.sin(angle) * band * .74;
    } else if (settings.preset === "pixel") {
      const columns = 12;
      x = ((index % columns) + .5) / columns;
      y = ((Math.floor(index / columns) % 8) + .5) / 8;
    }

    return {
      x,
      y,
      vx: (Math.random() - .5) * .015,
      vy: (Math.random() - .5) * .015,
      size: 1.25 + Math.random() * 2.4,
      colorIndex: index % palette.length,
      phase: Math.random() * Math.PI * 2,
      angle,
      radius,
    };
  }

  function clearCanvas() {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }

  function resetPoints() {
    const total = pointCount();
    points = Array.from({ length: total }, (_, index) => makePoint(index, total));
    clearCanvas();
    draw(0, true);
  }

  function queueReset() {
    cancelAnimationFrame(rebuildFrame);
    rebuildFrame = requestAnimationFrame(resetPoints);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1.2 : 1.55);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (points.length !== pointCount()) resetPoints();
    else {
      clearCanvas();
      draw(0, true);
    }
  }

  function normalizedPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(rect.width, 1)));
    pointer.y = Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(rect.height, 1)));
  }

  function update(delta) {
    const step = Math.min(delta / 1000, .034) * 60;
    const forceLevel = settings.force / 100;
    const centerX = .5 + (settings.director - .5) * .16;
    const centerY = .5;
    elapsed += delta / 1000;
    if (hold.active) hold.charge = Math.min(1.25, hold.charge + delta / 850);

    for (const point of points) {
      const dxCenter = point.x - centerX;
      const dyCenter = point.y - centerY;
      const centerDistance = Math.max(.025, Math.hypot(dxCenter, dyCenter));

      if (pointer.active) {
        const dx = pointer.x - point.x;
        const dy = pointer.y - point.y;
        const distance = Math.max(Math.hypot(dx, dy), .035);
        const pull = Math.min((.00018 + forceLevel * .0008) / distance, .011);
        point.vx += (dx / distance) * pull;
        point.vy += (dy / distance) * pull;
      }

      if (hold.active) {
        const dx = hold.x - point.x;
        const dy = hold.y - point.y;
        const distance = Math.max(Math.hypot(dx, dy), .022);
        const collapse = Math.max(0, (hold.charge - .22) / .78);
        const pull = Math.min((.0018 + hold.charge * (settings.preset === "pixel" ? .012 : .009)) / distance, settings.preset === "pixel" ? .085 : .068);
        point.vx += (dx / distance) * pull;
        point.vy += (dy / distance) * pull;
        if (collapse > 0) {
          point.x += dx * collapse * .2 * step;
          point.y += dy * collapse * .2 * step;
        }
        point.vx *= settings.preset === "pixel" ? .84 : .87;
        point.vy *= settings.preset === "pixel" ? .84 : .87;
      }

      if (settings.preset === "pixel") {
        const beat = Math.floor(elapsed * (3.2 + forceLevel * 4));
        const direction = (point.colorIndex + beat + Math.floor(point.phase)) % 4;
        const pixelForce = .00018 + forceLevel * .00036;
        point.vx += (direction === 0 ? 1 : direction === 2 ? -1 : 0) * pixelForce;
        point.vy += (direction === 1 ? 1 : direction === 3 ? -1 : 0) * pixelForce;
      } else if (settings.preset === "orbit") {
        const targetRadius = .16 + (point.radius * .72);
        const radialError = centerDistance - targetRadius;
        point.vx += (-dyCenter / centerDistance) * (.00022 + forceLevel * .00032);
        point.vy += (dxCenter / centerDistance) * (.00022 + forceLevel * .00032);
        point.vx -= (dxCenter / centerDistance) * radialError * .0017;
        point.vy -= (dyCenter / centerDistance) * radialError * .0017;
      } else if (settings.preset === "pulse") {
        const wave = Math.sin(elapsed * (1.8 + forceLevel * 2.8) + point.phase);
        point.vx += (dxCenter / centerDistance) * wave * (.0001 + forceLevel * .00038);
        point.vy += (dyCenter / centerDistance) * wave * (.0001 + forceLevel * .00038);
        point.vx += Math.cos(point.angle + elapsed) * .00005;
        point.vy += Math.sin(point.angle + elapsed) * .00005;
      } else {
        point.vx += Math.sin(point.phase + point.y * 8 + elapsed * .35) * .00005;
        point.vy += Math.cos(point.phase + point.x * 7 - elapsed * .3) * .00004;
      }

      const damping = settings.preset === "orbit" ? .992 : settings.preset === "pixel" ? .955 : .986;
      point.vx *= damping;
      point.vy *= damping;
      point.x += point.vx * step;
      point.y += point.vy * step;

      if (point.x < -.07) point.x = 1.07;
      if (point.x > 1.07) point.x = -.07;
      if (point.y < -.09) point.y = 1.09;
      if (point.y > 1.09) point.y = -.09;
    }
  }

  function fadeFrame(force) {
    if (force || settings.trail < 4 || reduceMotion.matches) {
      context.clearRect(0, 0, width, height);
      return;
    }
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.globalAlpha = .08 + (1 - settings.trail / 100) * .34;
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);
    context.restore();
  }

  function drawPulseRings() {
    if (settings.preset !== "pulse") return;
    const palette = activePalette();
    for (let index = 0; index < 3; index += 1) {
      const cycle = (elapsed * (.22 + settings.force / 420) + index / 3) % 1;
      context.globalAlpha = (1 - cycle) * .25;
      context.strokeStyle = palette[(index + 1) % palette.length];
      context.lineWidth = 1;
      context.beginPath();
      context.ellipse(
        (.5 + (settings.director - .5) * .16) * width,
        .5 * height,
        cycle * width * .38,
        cycle * height * .3,
        0,
        0,
        Math.PI * 2
      );
      context.stroke();
    }
  }

  function drawConnections() {
    if (settings.preset !== "network") return;
    const threshold = Math.min(width, height) * .27;
    for (let first = 0; first < points.length; first += 1) {
      const a = points[first];
      for (let second = first + 1; second < points.length; second += 1) {
        const b = points[second];
        const distance = Math.hypot((a.x - b.x) * width, (a.y - b.y) * height);
        if (distance > threshold) continue;
        context.globalAlpha = Math.max(0, 1 - distance / threshold) * .29;
        context.strokeStyle = activePalette()[a.colorIndex % activePalette().length];
        context.lineWidth = .75;
        context.beginPath();
        context.moveTo(a.x * width, a.y * height);
        context.lineTo(b.x * width, b.y * height);
        context.stroke();
      }
    }
  }

  function drawOrbitGuides() {
    if (settings.preset !== "orbit") return;
    const palette = activePalette();
    const centerX = (.5 + (settings.director - .5) * .16) * width;
    context.save();
    context.translate(centerX, height * .5);
    context.rotate(elapsed * .08);
    for (let index = 0; index < 4; index += 1) {
      context.globalAlpha = .1 + index * .035;
      context.strokeStyle = palette[index % palette.length];
      context.lineWidth = index === 2 ? 1.4 : .65;
      context.setLineDash(index % 2 ? [7, 11] : [2, 8]);
      context.beginPath();
      context.ellipse(0, 0, width * (.12 + index * .07), height * (.1 + index * .047), index * .28, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
    context.setLineDash([]);
  }

  function drawPixelField() {
    if (settings.preset !== "pixel") return;
    context.save();
    context.globalCompositeOperation = "source-over";
    const palette = activePalette();
    for (let index = 0; index < 15; index += 1) {
      const x = ((index * 83 + 29) % 997) / 997 * width;
      const y = ((index * 137 + 71) % 991) / 991 * height;
      const blink = .18 + Math.max(0, Math.sin(elapsed * 3 + index * 1.7)) * .5;
      const size = index % 4 === 0 ? 3 : 2;
      context.globalAlpha = blink;
      context.fillStyle = palette[index % palette.length];
      context.fillRect(Math.round(x), Math.round(y), size, size);
    }
    const scanY = Math.round(((elapsed * 42) % Math.max(height, 1)));
    context.globalAlpha = .1;
    context.fillStyle = "#6ef2ff";
    context.fillRect(0, scanY, width, 2);
    context.restore();
  }

  function drawPixelSprite(centerX, centerY, scale, alpha, phase = 0) {
    const sprite = [
      "00111100",
      "01111110",
      "11011011",
      "11111111",
      "10111101",
      "00100100",
      "01100110",
      "11000011",
    ];
    const palette = activePalette();
    const cell = Math.max(2, Math.round(scale));
    const spriteWidth = sprite[0].length * cell;
    const spriteHeight = sprite.length * cell;
    context.save();
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = Math.max(0, Math.min(1, alpha));
    context.translate(Math.round(centerX - spriteWidth / 2), Math.round(centerY - spriteHeight / 2));
    sprite.forEach((row, rowIndex) => {
      Array.from(row).forEach((pixel, columnIndex) => {
        if (pixel !== "1") return;
        context.fillStyle = palette[(rowIndex + columnIndex + phase) % palette.length];
        context.fillRect(columnIndex * cell, rowIndex * cell, cell, cell);
      });
    });
    context.globalAlpha *= .32;
    context.strokeStyle = "#ffffff";
    context.lineWidth = Math.max(1, Math.round(cell / 2));
    context.strokeRect(-cell * 2, -cell * 2, spriteWidth + cell * 4, spriteHeight + cell * 4);
    context.restore();
  }

  function morphState(name) {
    if (hold.active && settings.preset === name && hold.charge > .28) {
      return {
        centerX: hold.x * width,
        centerY: hold.y * height,
        readiness: Math.min(1, (hold.charge - .28) / .72),
        life: 1,
        expansion: 0,
        holding: true,
      };
    }
    if (morphPreset !== name || morphUntil <= elapsed) return null;
    const life = Math.max(0, Math.min(1, (morphUntil - elapsed) / morphDuration));
    return {
      centerX: morphOrigin.x * width,
      centerY: morphOrigin.y * height,
      readiness: 1,
      life,
      expansion: 1 - life,
      holding: false,
    };
  }

  function drawNetworkMorph() {
    const state = morphState("network");
    if (!state) return;
    const palette = activePalette();
    const baseRadius = state.holding ? 16 + state.readiness * 30 : 42 + state.expansion * Math.min(width, height) * .34;
    const branches = 7;
    context.save();
    context.translate(state.centerX, state.centerY);
    context.rotate(elapsed * (state.holding ? .35 : 1.2));
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = (.18 + state.readiness * .36) * state.life;
    context.fillStyle = "#05070b";
    context.beginPath();
    context.arc(0, 0, baseRadius * .92, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = "lighter";
    context.globalAlpha = (.3 + state.readiness * .7) * state.life;
    context.beginPath();
    for (let index = 0; index < branches; index += 1) {
      const angle = (index / branches) * Math.PI * 2;
      const radius = baseRadius * (index % 2 ? .78 : 1);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.strokeStyle = palette[1 % palette.length];
    context.lineWidth = state.holding ? 1.5 : 3.4 * state.life;
    context.stroke();
    for (let index = 0; index < branches; index += 1) {
      const angle = (index / branches) * Math.PI * 2;
      const radius = baseRadius * (index % 2 ? .78 : 1);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      context.strokeStyle = palette[index % palette.length];
      context.lineWidth = state.holding ? 1.8 : 3.2 * state.life;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(x, y);
      context.stroke();
      context.fillStyle = palette[(index + 1) % palette.length];
      context.beginPath();
      context.arc(x, y, state.holding ? 3.4 + state.readiness * 2.6 : 6 * state.life, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = "#f7fbff";
    context.beginPath();
    context.arc(0, 0, state.holding ? 5 + state.readiness * 8 : 12 * state.life, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawOrbitMorph() {
    const state = morphState("orbit");
    if (!state) return;
    const radius = state.holding ? 14 + state.readiness * 26 : 38 + state.expansion * Math.min(width, height) * .3;
    context.save();
    context.translate(state.centerX, state.centerY);
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = state.life;
    const halo = context.createRadialGradient(0, 0, 0, 0, 0, radius * 1.8);
    halo.addColorStop(0, "#ffffff");
    halo.addColorStop(.12, "#6ef2ff");
    halo.addColorStop(.34, "#7a5cff");
    halo.addColorStop(.58, "rgba(5,7,11,.96)");
    halo.addColorStop(1, "transparent");
    context.fillStyle = halo;
    context.beginPath();
    context.arc(0, 0, radius * 1.8, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = "lighter";
    for (let index = 0; index < 3; index += 1) {
      context.save();
      context.rotate(elapsed * (index % 2 ? -.8 : .65) + index * .72);
      context.globalAlpha = (.35 + index * .16) * state.life;
      context.strokeStyle = ["#6ef2ff", "#ad8cff", "#ffffff"][index];
      context.lineWidth = 1.2 + index;
      context.beginPath();
      context.ellipse(0, 0, radius * (1.3 + index * .36), radius * (.32 + index * .12), 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
    context.restore();
  }

  function drawPulseMorph() {
    const state = morphState("pulse");
    if (!state) return;
    const palette = activePalette();
    const coreRadius = state.holding ? 5 + state.readiness * 15 : Math.max(2, 18 * state.life);
    context.save();
    context.translate(state.centerX, state.centerY);
    context.globalCompositeOperation = "lighter";
    const core = context.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 2.6);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(.2, palette[0]);
    core.addColorStop(1, "transparent");
    context.globalAlpha = state.life;
    context.fillStyle = core;
    context.beginPath();
    context.arc(0, 0, coreRadius * 2.6, 0, Math.PI * 2);
    context.fill();
    for (let index = 0; index < 4; index += 1) {
      const radius = state.holding
        ? coreRadius + index * (5 + state.readiness * 4)
        : 18 + (state.expansion * 1.3 + index * .2) * Math.min(width, height) * .34;
      context.globalAlpha = Math.max(0, state.life * (1 - index * .14));
      context.strokeStyle = palette[index % palette.length];
      context.lineWidth = Math.max(1, (4 - index * .65) * state.life);
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }

  function drawPixelMorph() {
    const state = morphState("pixel");
    if (!state) return;
    drawPixelSprite(
      state.centerX,
      state.centerY,
      state.holding ? 2.5 + state.readiness * 3.4 : 5 + state.expansion * 7,
      state.holding ? .35 + state.readiness * .65 : state.life,
      Math.floor(elapsed * (state.holding ? 8 : 12))
    );
    if (state.holding) return;
    context.save();
    context.globalCompositeOperation = "lighter";
    context.globalAlpha = state.life * .7;
    context.strokeStyle = state.expansion > .45 ? "#ff4fd8" : "#7cff6b";
    context.lineWidth = Math.max(2, 5 * state.life);
    const radius = 18 + state.expansion * Math.min(width, height) * .42;
    context.strokeRect(state.centerX - radius, state.centerY - radius, radius * 2, radius * 2);
    context.restore();
  }

  function drawPresetMorph() {
    drawNetworkMorph();
    drawOrbitMorph();
    drawPulseMorph();
    drawPixelMorph();
  }

  function draw(delta, force = false) {
    if (!force && (!visible || document.hidden)) return;
    if (!reduceMotion.matches && delta > 0) update(delta);
    fadeFrame(force);

    context.globalCompositeOperation = "lighter";
    drawPixelField();
    drawPulseRings();
    drawOrbitGuides();
    drawConnections();
    const palette = activePalette();

    for (const point of points) {
      const pixelCell = Math.max(7, Math.round(Math.min(width, height) / 34));
      const x = settings.preset === "pixel" ? Math.round(point.x * width / pixelCell) * pixelCell : point.x * width;
      const y = settings.preset === "pixel" ? Math.round(point.y * height / pixelCell) * pixelCell : point.y * height;
      const color = palette[point.colorIndex % palette.length];
      const energy = .72 + settings.director * .5;
      if (settings.preset === "pixel") {
        const size = pixelCell * (point.colorIndex % 3 === 0 ? .82 : .55);
        context.globalCompositeOperation = "source-over";
        context.globalAlpha = .34;
        context.fillStyle = "#02040a";
        context.fillRect(Math.round(x - size / 2 + 3), Math.round(y - size / 2 + 3), Math.ceil(size), Math.ceil(size));
        context.globalAlpha = .94;
        context.fillStyle = color;
        context.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), Math.ceil(size), Math.ceil(size));
        context.globalAlpha = .75;
        context.fillStyle = "#ffffff";
        context.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), Math.max(1, Math.round(size * .3)), Math.max(1, Math.round(size * .24)));
        continue;
      }
      const glowRadius = point.size * (5.5 + settings.trail / 18);
      const glow = context.createRadialGradient(x, y, 0, x, y, glowRadius);
      glow.addColorStop(0, color);
      glow.addColorStop(.18, color);
      glow.addColorStop(1, "transparent");
      context.globalAlpha = Math.min(1, .68 * energy);
      context.fillStyle = glow;
      context.beginPath();
      context.arc(x, y, glowRadius, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, point.size * (settings.preset === "pulse" ? 1.16 : 1), 0, Math.PI * 2);
      context.fill();
    }

    drawPresetMorph();
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
  }

  function animate(time) {
    const delta = previousTime ? Math.min(time - previousTime, 34) : 16;
    previousTime = time;
    draw(delta);
    animationFrame = requestAnimationFrame(animate);
  }

  function startAnimation() {
    cancelAnimationFrame(animationFrame);
    previousTime = 0;
    if (reduceMotion.matches) {
      draw(0, true);
      return;
    }
    animationFrame = requestAnimationFrame(animate);
  }

  function setPreset(name, announce = true) {
    if (!presetLabels[name]) return;
    settings.preset = name;
    presetButtons.forEach((button) => {
      const active = button.dataset.particlePreset === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (status) status.textContent = presetLabels[name];
    if (particleMode) particleMode.textContent = presetShortLabels[name];
    if (particleSwitch) {
      particleSwitch.setAttribute("aria-label", `Tipo particelle: ${presetLabels[name].toLowerCase()}. Tocca per cambiare`);
    }
    hero.dataset.particlePreset = name;
    canvas.dataset.particlePreset = name;
    resetPoints();
    if (announce) navigator.vibrate?.(8);
  }

  function updateHoldPosition(event) {
    const rect = canvas.getBoundingClientRect();
    hold.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(rect.width, 1)));
    hold.y = Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(rect.height, 1)));
    hero.style.setProperty("--hold-x", `${(hold.x * 100).toFixed(2)}%`);
    hero.style.setProperty("--hold-y", `${(hold.y * 100).toFixed(2)}%`);
  }

  function explodeHeldParticles() {
    const baseEnergy = .012 + Math.min(hold.charge, 1) * .032;
    for (const point of points) {
      const dx = point.x - hold.x;
      const dy = point.y - hold.y;
      const distance = Math.max(.026, Math.hypot(dx, dy));
      const falloff = Math.max(.32, 1 - distance * .58);
      let directionX = dx / distance;
      let directionY = dy / distance;
      let energy = baseEnergy;
      if (settings.preset === "network") {
        const branchStep = (Math.PI * 2) / 7;
        const branchAngle = Math.round(Math.atan2(dy, dx) / branchStep) * branchStep;
        directionX = Math.cos(branchAngle);
        directionY = Math.sin(branchAngle);
      } else if (settings.preset === "orbit") {
        const radialX = directionX;
        const radialY = directionY;
        directionX = radialX * .35 - radialY * .94;
        directionY = radialY * .35 + radialX * .94;
        energy *= 1.16;
      } else if (settings.preset === "pulse") {
        energy *= 1.45;
      } else if (settings.preset === "pixel") {
        if (Math.abs(directionX) > Math.abs(directionY)) {
          directionX = Math.sign(directionX) || 1;
          directionY = 0;
        } else {
          directionX = 0;
          directionY = Math.sign(directionY) || 1;
        }
      }
      point.vx += directionX * energy * falloff;
      point.vy += directionY * energy * falloff;
    }
    hero.classList.remove("particles-burst");
    void hero.offsetWidth;
    hero.classList.add("particles-burst");
    canvas.dataset.burstCount = String(Number(canvas.dataset.burstCount || 0) + 1);
    window.setTimeout(() => hero.classList.remove("particles-burst"), 540);
    draw(16, true);
  }

  function finishHold(event, explode = true) {
    if (!hold.active || (event?.pointerId != null && event.pointerId !== hold.pointerId)) return;
    hold.active = false;
    hold.pointerId = null;
    hero.classList.remove("particles-holding");
    canvas.dataset.particleState = explode ? "burst" : "idle";
    if (gestureLabel) gestureLabel.textContent = "SCORRI LE SCENE · TIENI LE PARTICELLE";
    if (explode) {
      if (hold.charge > .25) {
        morphOrigin.x = hold.x;
        morphOrigin.y = hold.y;
        morphPreset = settings.preset;
        morphDuration = morphDurations[morphPreset] || 1.8;
        morphUntil = elapsed + morphDuration;
        canvas.dataset.lastMorph = morphPreset;
        canvas.dataset.morphCount = String(Number(canvas.dataset.morphCount || 0) + 1);
        if (morphPreset === "pixel") {
          canvas.dataset.pixelMorphCount = String(Number(canvas.dataset.pixelMorphCount || 0) + 1);
        }
      }
      explodeHeldParticles();
      navigator.vibrate?.([8, 22, 12]);
    }
    hold.charge = 0;
    window.setTimeout(() => {
      if (!hold.active) canvas.dataset.particleState = "idle";
    }, 560);
  }

  function applyScene(index, animate = true) {
    sceneIndex = (index + scenes.length) % scenes.length;
    const scene = scenes[sceneIndex];
    sceneDots.forEach((dot, dotIndex) => {
      dot.setAttribute("aria-pressed", String(dotIndex === sceneIndex));
    });
    if (animate) {
      hero.classList.remove("scene-changing");
      void hero.offsetWidth;
      hero.classList.add("scene-changing");
    }
    window.setTimeout(() => {
      if (humanImage instanceof HTMLImageElement) {
        humanImage.src = scene.src;
        humanImage.alt = scene.alt;
      }
      if (systemImage instanceof HTMLImageElement) systemImage.src = scene.src;
      if (sceneFrame) sceneFrame.textContent = scene.frame;
      if (sceneTitle) sceneTitle.textContent = scene.title;
      if (scenePurpose) scenePurpose.textContent = scene.purpose;
      if (sceneDescription) sceneDescription.textContent = scene.description;
      if (sceneNote) sceneNote.textContent = scene.note;
      settings.density = scene.density;
      settings.force = scene.force;
      settings.trail = scene.trail;
      setPreset(scene.preset, false);
    }, animate && !reduceMotion.matches ? 390 : 0);
    window.setTimeout(() => hero.classList.remove("scene-changing"), reduceMotion.matches ? 0 : 920);
  }

  const autoSceneDelay = 3250;

  function clearSceneAutoplay() {
    window.clearTimeout(idleSceneTimer);
    idleSceneTimer = 0;
  }

  function scheduleSceneAutoplay() {
    clearSceneAutoplay();
    if (!visible || document.hidden) {
      if (autoState) autoState.textContent = "AUTO CUT / PAUSA";
      return;
    }
    if (autoState) autoState.textContent = "AUTO CUT / 03S";
    idleSceneTimer = window.setTimeout(() => {
      if (!visible || document.hidden || hold.active) {
        scheduleSceneAutoplay();
        return;
      }
      applyScene(sceneIndex + 1, true);
      canvas.dataset.autoSceneCount = String(Number(canvas.dataset.autoSceneCount || 0) + 1);
      if (autoState) autoState.textContent = `AUTO CUT / SCENA ${String(sceneIndex + 1).padStart(2, "0")}`;
      idleSceneTimer = window.setTimeout(scheduleSceneAutoplay, 850);
    }, autoSceneDelay);
  }

  function registerActivity() {
    if (activityFrame) return;
    activityFrame = requestAnimationFrame(() => {
      activityFrame = 0;
      scheduleSceneAutoplay();
    });
  }

  function bindVariable(key, control) {
    if (!(control instanceof HTMLInputElement)) return;
    const valueOutput = document.querySelector(`#particle-${key}-value`);
    const renderControl = () => {
      const value = Number(control.value);
      settings[key] = value;
      control.style.setProperty("--particle-value", `${value}%`);
      if (valueOutput) valueOutput.textContent = String(value);
      if (key === "density") queueReset();
      else draw(0, true);
    };
    control.addEventListener("input", renderControl);
    control.addEventListener("change", () => navigator.vibrate?.(6));
    renderControl();
  }

  function beginSceneSwipe(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button, input")) return;
    sceneSwipe.active = true;
    sceneSwipe.pointerId = event.pointerId;
    sceneSwipe.startX = event.clientX;
    sceneSwipe.startY = event.clientY;
    sceneSwipe.deltaX = 0;
    sceneSwipe.deltaY = 0;
  }

  function updateSceneSwipe(event) {
    if (!sceneSwipe.active || event.pointerId !== sceneSwipe.pointerId) return;
    sceneSwipe.deltaX = event.clientX - sceneSwipe.startX;
    sceneSwipe.deltaY = event.clientY - sceneSwipe.startY;
  }

  function completeSceneSwipe(event, cancelled = false) {
    if (!sceneSwipe.active || event.pointerId !== sceneSwipe.pointerId) return false;
    updateSceneSwipe(event);
    const horizontal = !cancelled &&
      Math.abs(sceneSwipe.deltaX) >= 46 &&
      Math.abs(sceneSwipe.deltaX) > Math.abs(sceneSwipe.deltaY) * 1.2;
    const direction = sceneSwipe.deltaX < 0 ? 1 : -1;
    sceneSwipe.active = false;
    sceneSwipe.pointerId = null;
    if (!horizontal) return false;
    applyScene(sceneIndex + direction, true);
    canvas.dataset.sceneSwipeCount = String(Number(canvas.dataset.sceneSwipeCount || 0) + 1);
    navigator.vibrate?.([6, 18, 8]);
    return true;
  }

  atlas?.addEventListener("pointerdown", beginSceneSwipe);
  atlas?.addEventListener("pointermove", updateSceneSwipe);
  atlas?.addEventListener("pointerup", (event) => completeSceneSwipe(event, false));
  atlas?.addEventListener("pointercancel", (event) => completeSceneSwipe(event, true));

  canvas.addEventListener("pointerdown", (event) => {
    updateHoldPosition(event);
    hold.active = true;
    hold.pointerId = event.pointerId;
    hold.charge = 0;
    pointer.active = false;
    canvas.dataset.particleState = "holding";
    hero.classList.remove("particles-burst");
    hero.classList.add("particles-holding");
    if (gestureLabel) gestureLabel.textContent = holdLabels[settings.preset] || "TRATTIENI · POI RILASCIA";
    canvas.setPointerCapture?.(event.pointerId);
    navigator.vibrate?.(6);
    draw(16, true);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (hold.active && event.pointerId === hold.pointerId) {
      updateHoldPosition(event);
      return;
    }
    if (event.pointerType !== "mouse") return;
    normalizedPointer(event);
    pointer.active = true;
    draw(16, true);
  });

  function releasePointer(event, explode = true) {
    const swiped = explode && completeSceneSwipe(event, false);
    if (!explode) completeSceneSwipe(event, true);
    if (hold.active && event.pointerId === hold.pointerId) finishHold(event, explode && !swiped);
    pointer.active = false;
    if (event?.pointerId != null && canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  canvas.addEventListener("pointerup", (event) => releasePointer(event, true));
  canvas.addEventListener("pointercancel", (event) => releasePointer(event, false));
  canvas.addEventListener("lostpointercapture", (event) => {
    if (hold.active && event.pointerId === hold.pointerId) finishHold(event, true);
  });
  canvas.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse" && !hold.active) pointer.active = false;
  });

  canvas.addEventListener("keydown", (event) => {
    const distance = event.shiftKey ? .08 : .035;
    if (event.key === "ArrowLeft") pointer.x -= distance;
    else if (event.key === "ArrowRight") pointer.x += distance;
    else if (event.key === "ArrowUp") pointer.y -= distance;
    else if (event.key === "ArrowDown") pointer.y += distance;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const names = Object.keys(presetLabels);
      setPreset(names[(names.indexOf(settings.preset) + 1) % names.length]);
      return;
    } else return;
    event.preventDefault();
    pointer.x = Math.min(1, Math.max(0, pointer.x));
    pointer.y = Math.min(1, Math.max(0, pointer.y));
    pointer.active = true;
    update(34);
    draw(0, true);
    window.setTimeout(() => { pointer.active = false; }, 180);
  });

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => setPreset(button.dataset.particlePreset));
  });
  particleSwitch?.addEventListener("click", () => {
    const names = Object.keys(presetLabels);
    setPreset(names[(names.indexOf(settings.preset) + 1) % names.length]);
  });
  sceneDots.forEach((dot) => {
    dot.addEventListener("click", () => applyScene(Number(dot.dataset.sceneIndex), true));
  });
  bindVariable("density", controls.density);
  bindVariable("force", controls.force);
  bindVariable("trail", controls.trail);

  hero.addEventListener("director:change", (event) => {
    settings.director = Number(event.detail?.normalized ?? settings.director);
    if (hold.active) {
      draw(0, true);
      return;
    }
    pointer.x = settings.director;
    pointer.y = .5;
    pointer.active = true;
    window.clearTimeout(pointerReleaseTimer);
    pointerReleaseTimer = window.setTimeout(() => { pointer.active = false; }, 130);
    draw(0, true);
  });

  remixButton?.addEventListener("click", () => {
    applyScene(sceneIndex + 1);
    pointer.active = true;
    window.setTimeout(() => { pointer.active = false; }, 420);
    navigator.vibrate?.([7, 28, 9]);
    const label = remixButton.querySelector("span");
    if (label) {
      label.textContent = "SCENA GENERATA";
      window.setTimeout(() => { label.textContent = "CAMBIA SCENA"; }, 900);
    }
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      startAnimation();
      scheduleSceneAutoplay();
    } else {
      cancelAnimationFrame(animationFrame);
      clearSceneAutoplay();
      if (autoState) autoState.textContent = "AUTO CUT / PAUSA";
    }
  }, { rootMargin: "120px" });
  visibilityObserver.observe(canvas);

  reduceMotion.addEventListener?.("change", startAnimation);
  document.addEventListener("pointerdown", registerActivity, { passive: true });
  document.addEventListener("keydown", registerActivity);
  window.addEventListener("scroll", registerActivity, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearSceneAutoplay();
      if (autoState) autoState.textContent = "AUTO CUT / PAUSA";
    } else {
      scheduleSceneAutoplay();
    }
  });
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(animationFrame);
    cancelAnimationFrame(activityFrame);
    clearSceneAutoplay();
  }, { once: true });

  scenes.forEach((scene) => {
    const image = new Image();
    image.src = scene.src;
  });
  applyScene(0, false);
  resize();
  startAnimation();
  scheduleSceneAutoplay();
})();
