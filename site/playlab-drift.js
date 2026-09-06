(function initFAIPlaylabDrift(global) {
  "use strict";

  const LOGICAL_WIDTH = 100;
  const LOGICAL_HEIGHT = 150;
  const FIXED_STEP_MS = 1000 / 60;
  const MAX_STEPS_PER_FRAME = 12;
  const ROLE_IDS = Object.freeze(["glide", "link", "pulse"]);

  const PALETTES = Object.freeze({
    nocturne: Object.freeze({
      background: "#050914",
      field: "#091326",
      ink: "#f4f8ff",
      muted: "#8da1ba",
      current: "#65e8d0",
      front: "#8b72ff",
      roles: Object.freeze(["#72f3d1", "#ffcc75", "#bd93ff"]),
    }),
    mineral: Object.freeze({
      background: "#061012",
      field: "#0a1d1d",
      ink: "#effffa",
      muted: "#8ea9a3",
      current: "#8df2bd",
      front: "#6bb6d9",
      roles: Object.freeze(["#8ef0bd", "#e9d58a", "#86c9d8"]),
    }),
    ember: Object.freeze({
      background: "#12090b",
      field: "#241013",
      ink: "#fff6ed",
      muted: "#b69a91",
      current: "#ffba72",
      front: "#d778ae",
      roles: Object.freeze(["#ffbe72", "#f78378", "#d89cff"]),
    }),
  });

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function round(value, digits = 4) {
    const scale = 10 ** digits;
    return Math.round(value * scale) / scale;
  }

  function oneOf(value, choices, fallback) {
    const normalized = String(value ?? "").trim().toLowerCase();
    return choices.includes(normalized) ? normalized : fallback;
  }

  function hashSeed(value) {
    const text = String(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function makeRandom(seed) {
    let state = hashSeed(seed) || 0x6d2b79f5;
    return function random() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalizeConfig(source) {
    const raw = source || {};
    const roleAliases = {
      balanced: "triad",
      trio: "triad",
      specialists: "specialist",
      specialized: "specialist",
      fluid: "adaptive",
    };
    const memoryAliases = {
      short: "fleeting",
      brief: "fleeting",
      medium: "echo",
      balanced: "echo",
      long: "persistent",
    };
    const targetAliases = {
      orbital: "orbit",
      braided: "weave",
      breathing: "breathe",
      pulse: "breathe",
    };
    const frontAliases = {
      calm: "breeze",
      split: "shear",
      spiral: "vortex",
    };
    const feedbackAliases = {
      trail: "trails",
      ripple: "ripples",
      glow: "aurora",
    };
    const normalizeAlias = (value, aliases) => aliases[String(value ?? "").trim().toLowerCase()] || value;
    const seed = raw.seed ?? "drift-default-seed";
    const paletteName = oneOf(raw.palette, Object.keys(PALETTES), "nocturne");
    return Object.freeze({
      moteRoles: oneOf(normalizeAlias(raw.moteRoles, roleAliases), ["triad", "specialist", "adaptive"], "triad"),
      flowMemory: oneOf(normalizeAlias(raw.flowMemory, memoryAliases), ["fleeting", "echo", "persistent"], "echo"),
      targetChoreography: oneOf(normalizeAlias(raw.targetChoreography, targetAliases), ["orbit", "weave", "breathe"], "orbit"),
      frontBehavior: oneOf(normalizeAlias(raw.frontBehavior, frontAliases), ["breeze", "shear", "vortex"], "breeze"),
      ambientFeedback: oneOf(normalizeAlias(raw.ambientFeedback, feedbackAliases), ["trails", "ripples", "aurora"], "trails"),
      palette: paletteName,
      seed: String(seed),
      externalHud: raw.externalHud === true,
      reduceMotion: raw.reduceMotion === true
        || Boolean(global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches),
      debug: raw.debug === true,
    });
  }

  function createDrift(options) {
    const settings = options || {};
    const canvas = settings.canvas;
    if (!canvas || typeof canvas.getContext !== "function") {
      throw new TypeError("FAIPlaylab.createDrift requires a canvas element");
    }
    const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!context) throw new Error("Canvas 2D is not available");

    const config = normalizeConfig(settings.config);
    const palette = PALETTES[config.palette];
    const onEvent = typeof settings.onEvent === "function" ? settings.onEvent : () => {};
    const requestFrame = global.requestAnimationFrame
      ? global.requestAnimationFrame.bind(global)
      : (callback) => global.setTimeout(() => callback(Date.now()), 16);
    const cancelFrame = global.cancelAnimationFrame
      ? global.cancelAnimationFrame.bind(global)
      : global.clearTimeout.bind(global);

    let random = makeRandom(config.seed);
    let status = "idle";
    let motes = [];
    let targets = [];
    let currents = [];
    let fronts = [];
    let activeBrushes = new Map();
    let scoreFloat = 0;
    let energy = 100;
    let resonance = 0;
    let constellationCharge = 0;
    let constellation = 1;
    let gestures = 0;
    let frontCount = 0;
    let simulationTime = 0;
    let nextFrontAt = 0;
    let nextId = 1;
    let lastScoreEvent = -1;
    let rafId = 0;
    let lastFrame = 0;
    let accumulator = 0;
    let cssWidth = 1;
    let cssHeight = 1;
    let dpr = 1;
    let viewport = { x: 0, y: 0, width: 1, height: 1, scale: 1 };
    let destroyedTouchAction = null;

    function emit(type, payload) {
      try { onEvent(type, payload || statePayload()); } catch (_error) {}
    }

    function roleForIndex(index) {
      if (config.moteRoles === "specialist") {
        const sequence = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 0, 1, 2, 2, 1, 0];
        return ROLE_IDS[sequence[index % sequence.length]];
      }
      return ROLE_IDS[index % ROLE_IDS.length];
    }

    function createMote(index) {
      const angle = random() * Math.PI * 2;
      const speed = 2.2 + random() * 2.6;
      return {
        id: nextId++,
        role: roleForIndex(index),
        x: 10 + random() * 80,
        y: 25 + random() * 105,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        phase: random() * Math.PI * 2,
        affinity: 0.78 + random() * 0.44,
        trail: [],
      };
    }

    function targetPositions(timeMs = simulationTime) {
      const seconds = timeMs / 1000;
      const stageOffset = (constellation - 1) * 0.39;
      return ROLE_IDS.map((role, index) => {
        const phase = index * Math.PI * 2 / ROLE_IDS.length + stageOffset;
        let x;
        let y;
        if (config.targetChoreography === "weave") {
          x = 50 + Math.sin(seconds * 0.46 + phase) * 29;
          y = 35 + index * 39 + Math.sin(seconds * 0.71 + phase * 1.7) * 9;
        } else if (config.targetChoreography === "breathe") {
          const radius = 22 + Math.sin(seconds * 0.82 + stageOffset) * 9;
          x = 50 + Math.cos(phase - Math.PI / 2) * radius;
          y = 77 + Math.sin(phase - Math.PI / 2) * radius * 1.22;
        } else {
          const orbit = seconds * 0.27 + phase;
          x = 50 + Math.cos(orbit) * 27;
          y = 77 + Math.sin(orbit) * 38;
        }
        return { role, x, y, phase };
      });
    }

    function scheduleNextFront(first = false) {
      const base = config.frontBehavior === "breeze" ? 9000 : config.frontBehavior === "shear" ? 7600 : 8200;
      nextFrontAt = simulationTime + (first ? 700 : base + random() * 2100);
    }

    function addFront(silent = false) {
      const front = {
        id: nextId++,
        behavior: config.frontBehavior,
        bornAt: simulationTime,
        duration: config.frontBehavior === "breeze" ? 10500 : 9200,
        phase: random() * Math.PI * 2,
        strength: 0.72 + random() * 0.48,
      };
      fronts.push(front);
      frontCount += 1;
      scheduleNextFront(false);
      if (!silent) emit("front", { front: publicFront(front), frontCount });
      return front;
    }

    function resetState(nextStatus) {
      if (rafId) cancelFrame(rafId);
      rafId = 0;
      random = makeRandom(config.seed);
      nextId = 1;
      status = nextStatus;
      motes = [];
      targets = [];
      currents = [];
      fronts = [];
      activeBrushes = new Map();
      scoreFloat = 0;
      energy = 100;
      resonance = 0;
      constellationCharge = 0;
      constellation = 1;
      gestures = 0;
      frontCount = 0;
      simulationTime = 0;
      accumulator = 0;
      lastFrame = 0;
      lastScoreEvent = -1;
      const moteCount = config.moteRoles === "specialist" ? 18 : config.moteRoles === "adaptive" ? 15 : 15;
      for (let index = 0; index < moteCount; index += 1) motes.push(createMote(index));
      targets = targetPositions(0);
      scheduleNextFront(true);
      addFront(true);
    }

    function memoryDuration() {
      return { fleeting: 1500, echo: 3400, persistent: 6200 }[config.flowMemory];
    }

    function pointFromInput(source) {
      if (!source || typeof source !== "object") return null;
      const rect = typeof canvas.getBoundingClientRect === "function"
        ? canvas.getBoundingClientRect()
        : { left: 0, top: 0, width: cssWidth, height: cssHeight };
      let canvasX;
      let canvasY;
      if (Number.isFinite(Number(source.clientX)) && Number.isFinite(Number(source.clientY))) {
        canvasX = Number(source.clientX) - (Number(rect.left) || 0);
        canvasY = Number(source.clientY) - (Number(rect.top) || 0);
      } else if (Number.isFinite(Number(source.normalizedX)) && Number.isFinite(Number(source.normalizedY))) {
        canvasX = Number(source.normalizedX) * (Number(rect.width) || cssWidth);
        canvasY = Number(source.normalizedY) * (Number(rect.height) || cssHeight);
      } else {
        const x = Number(source.x);
        const y = Number(source.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        if (source.coordinateSpace === "client") {
          canvasX = x - (Number(rect.left) || 0);
          canvasY = y - (Number(rect.top) || 0);
        } else if (source.coordinateSpace === "logical") {
          return { x: clamp(x, 0, LOGICAL_WIDTH), y: clamp(y, 0, LOGICAL_HEIGHT) };
        } else if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
          canvasX = x * (Number(rect.width) || cssWidth);
          canvasY = y * (Number(rect.height) || cssHeight);
        } else {
          return { x: clamp(x, 0, LOGICAL_WIDTH), y: clamp(y, 0, LOGICAL_HEIGHT) };
        }
      }
      return {
        x: clamp((canvasX - viewport.x) / viewport.scale, 0, LOGICAL_WIDTH),
        y: clamp((canvasY - viewport.y) / viewport.scale, 0, LOGICAL_HEIGHT),
      };
    }

    function addCurrent(from, to, source = "brush") {
      if (status !== "running") return false;
      let dx = to.x - from.x;
      let dy = to.y - from.y;
      let distance = Math.hypot(dx, dy);
      if (distance < 0.35) {
        const angle = Math.atan2(from.y - LOGICAL_HEIGHT / 2, from.x - LOGICAL_WIDTH / 2) + Math.PI / 2;
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        distance = 1;
      }
      const requestedCost = 1.1 + distance * 0.12;
      if (energy < 0.75) {
        emit("depleted", { energy: round(energy) });
        return false;
      }
      const accepted = Math.min(1, energy / requestedCost);
      const length = Math.max(0.001, Math.hypot(dx, dy));
      const current = {
        id: nextId++,
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
        dx: dx / length,
        dy: dy / length,
        radius: clamp(15 + distance * 0.55, 17, 34),
        strength: (9 + distance * 0.48) * accepted,
        bornAt: simulationTime,
        duration: memoryDuration(),
        source,
      };
      currents.push(current);
      if (currents.length > 36) currents.splice(0, currents.length - 36);
      energy = clamp(energy - requestedCost * accepted, 0, 100);
      gestures += 1;
      emit("gesture", {
        gesture: gestures,
        energy: round(energy),
        current: publicCurrent(current),
      });
      return true;
    }

    function adaptiveRole(mote) {
      if (config.moteRoles !== "adaptive") return mote.role;
      const interval = Math.floor(simulationTime / 5400);
      return ROLE_IDS[(ROLE_IDS.indexOf(mote.role) + interval + mote.id) % ROLE_IDS.length];
    }

    function forceFromFront(mote, front) {
      const age = simulationTime - front.bornAt;
      const progress = clamp(age / front.duration, 0, 1);
      const envelope = Math.sin(progress * Math.PI) * front.strength;
      if (front.behavior === "shear") {
        const lineX = -15 + progress * 130;
        const proximity = Math.exp(-((mote.x - lineX) ** 2) / 220);
        const side = mote.y < LOGICAL_HEIGHT / 2 ? 1 : -1;
        return { x: side * 7.5 * proximity * envelope, y: Math.sin(front.phase) * 1.8 * proximity };
      }
      if (front.behavior === "vortex") {
        const centerX = 50 + Math.cos(front.phase + progress * Math.PI * 2) * 18;
        const centerY = 76 + Math.sin(front.phase + progress * Math.PI * 2) * 24;
        const dx = mote.x - centerX;
        const dy = mote.y - centerY;
        const distance = Math.max(5, Math.hypot(dx, dy));
        const proximity = Math.exp(-(distance ** 2) / 1450);
        return { x: -dy / distance * 8 * proximity * envelope, y: dx / distance * 8 * proximity * envelope };
      }
      const lineY = -15 + progress * 180;
      const proximity = Math.exp(-((mote.y - lineY) ** 2) / 360);
      const angle = front.phase + Math.sin(progress * Math.PI * 2) * 0.24;
      return {
        x: Math.cos(angle) * 6.2 * proximity * envelope,
        y: Math.sin(angle) * 3.8 * proximity * envelope,
      };
    }

    function simulateMotes(dt) {
      const sourcePositions = motes.map((mote) => ({ x: mote.x, y: mote.y, role: adaptiveRole(mote) }));
      for (let index = 0; index < motes.length; index += 1) {
        const mote = motes[index];
        const role = sourcePositions[index].role;
        const roleIndex = ROLE_IDS.indexOf(role);
        const target = targets[roleIndex];
        let ax = Math.sin(simulationTime * 0.0011 + mote.phase) * 0.9;
        let ay = Math.cos(simulationTime * 0.00083 + mote.phase * 1.37) * 0.9;

        const targetDx = target.x - mote.x;
        const targetDy = target.y - mote.y;
        const targetDistance = Math.max(2, Math.hypot(targetDx, targetDy));
        const targetStrength = role === "pulse" ? 7.2 : role === "link" ? 5.2 : 4.4;
        ax += targetDx / targetDistance * targetStrength * mote.affinity;
        ay += targetDy / targetDistance * targetStrength * mote.affinity;

        let neighborX = 0;
        let neighborY = 0;
        let neighbors = 0;
        for (let otherIndex = 0; otherIndex < sourcePositions.length; otherIndex += 1) {
          if (otherIndex === index) continue;
          const other = sourcePositions[otherIndex];
          const dx = mote.x - other.x;
          const dy = mote.y - other.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < 32 && distanceSquared > 0.001) {
            const inverse = 1 / Math.sqrt(distanceSquared);
            ax += dx * inverse * (6 - Math.sqrt(distanceSquared)) * 1.15;
            ay += dy * inverse * (6 - Math.sqrt(distanceSquared)) * 1.15;
          }
          if (distanceSquared < 430 && other.role !== role) {
            neighborX += other.x;
            neighborY += other.y;
            neighbors += 1;
          }
        }
        if (neighbors && role === "link") {
          ax += (neighborX / neighbors - mote.x) * 0.055;
          ay += (neighborY / neighbors - mote.y) * 0.055;
        }

        const flowScale = role === "glide" ? 1.28 : role === "link" ? 0.94 : 0.76;
        for (const current of currents) {
          const dx = mote.x - current.x;
          const dy = mote.y - current.y;
          const distanceSquared = dx * dx + dy * dy;
          const radiusSquared = current.radius * current.radius;
          if (distanceSquared >= radiusSquared) continue;
          const age = (simulationTime - current.bornAt) / current.duration;
          const falloff = (1 - distanceSquared / radiusSquared) * (1 - clamp(age, 0, 1));
          ax += current.dx * current.strength * falloff * flowScale;
          ay += current.dy * current.strength * falloff * flowScale;
        }
        for (const front of fronts) {
          const force = forceFromFront(mote, front);
          ax += force.x;
          ay += force.y;
        }

        mote.vx = (mote.vx + ax * dt) * 0.989;
        mote.vy = (mote.vy + ay * dt) * 0.989;
        const maxSpeed = role === "glide" ? 19 : 15;
        const speed = Math.hypot(mote.vx, mote.vy);
        if (speed > maxSpeed) {
          mote.vx = mote.vx / speed * maxSpeed;
          mote.vy = mote.vy / speed * maxSpeed;
        }
        mote.x += mote.vx * dt;
        mote.y += mote.vy * dt;
        if (mote.x < 3) { mote.x = 3; mote.vx = Math.abs(mote.vx) * 0.72; }
        if (mote.x > LOGICAL_WIDTH - 3) { mote.x = LOGICAL_WIDTH - 3; mote.vx = -Math.abs(mote.vx) * 0.72; }
        if (mote.y < 4) { mote.y = 4; mote.vy = Math.abs(mote.vy) * 0.72; }
        if (mote.y > LOGICAL_HEIGHT - 4) { mote.y = LOGICAL_HEIGHT - 4; mote.vy = -Math.abs(mote.vy) * 0.72; }
        if (!config.reduceMotion) {
          mote.trail.push({ x: mote.x, y: mote.y });
          if (mote.trail.length > 9) mote.trail.shift();
        }
      }
    }

    function updateResonance(dt) {
      let proximityTotal = 0;
      let cooperativeNodes = 0;
      for (let roleIndex = 0; roleIndex < ROLE_IDS.length; roleIndex += 1) {
        const target = targets[roleIndex];
        const matching = motes.filter((mote) => adaptiveRole(mote) === target.role);
        let closest = Infinity;
        let nearby = 0;
        for (const mote of matching) {
          const distance = Math.hypot(mote.x - target.x, mote.y - target.y);
          closest = Math.min(closest, distance);
          if (distance < 16) nearby += 1;
        }
        proximityTotal += Math.exp(-closest / 20);
        if (nearby >= 2) cooperativeNodes += 1;
      }
      const raw = clamp(proximityTotal / ROLE_IDS.length * 0.78 + cooperativeNodes / ROLE_IDS.length * 0.22, 0, 1);
      resonance += (raw - resonance) * Math.min(1, dt * 2.4);
      const cooperative = cooperativeNodes === ROLE_IDS.length;
      if (resonance > 0.5) constellationCharge += (resonance - 0.42) * dt * (cooperative ? 16 : 10);
      else constellationCharge = Math.max(0, constellationCharge - dt * 1.8);
      scoreFloat += resonance * dt * (cooperative ? 28 : 18);
      energy = clamp(energy + dt * (3.6 + resonance * 2.1), 0, 100);

      if (constellationCharge >= 100) {
        constellationCharge -= 100;
        constellation += 1;
        scoreFloat += 300 + constellation * 60;
        emit("constellation", { constellation, score: Math.floor(scoreFloat) });
        if (constellation > 4) {
          status = "complete";
          if (rafId) cancelFrame(rafId);
          rafId = 0;
          emit("complete", statePayload());
        }
      }
      const score = Math.floor(scoreFloat);
      if (score !== lastScoreEvent && score % 25 === 0) {
        lastScoreEvent = score;
        emit("score", { score, resonance: round(resonance), constellation });
      }
    }

    function simulate(stepMs) {
      const dt = stepMs / 1000;
      simulationTime += stepMs;
      targets = targetPositions(simulationTime);
      currents = currents.filter((current) => simulationTime - current.bornAt < current.duration);
      fronts = fronts.filter((front) => simulationTime - front.bornAt < front.duration);
      if (simulationTime >= nextFrontAt) addFront(false);
      simulateMotes(dt);
      updateResonance(dt);
    }

    function syncCanvasSize() {
      const rect = typeof canvas.getBoundingClientRect === "function" ? canvas.getBoundingClientRect() : null;
      cssWidth = Math.max(1, Math.round(rect?.width || canvas.clientWidth || canvas.width || 320));
      cssHeight = Math.max(1, Math.round(rect?.height || canvas.clientHeight || canvas.height || 568));
      dpr = clamp(Number(global.devicePixelRatio) || 1, 1, 2);
      const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
      const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      context.setTransform?.(dpr, 0, 0, dpr, 0, 0);
      const topInset = config.externalHud ? 7 : 37;
      const usableHeight = Math.max(1, cssHeight - topInset - 7);
      const scale = Math.min(cssWidth / LOGICAL_WIDTH, usableHeight / LOGICAL_HEIGHT);
      viewport = {
        scale,
        width: LOGICAL_WIDTH * scale,
        height: LOGICAL_HEIGHT * scale,
        x: (cssWidth - LOGICAL_WIDTH * scale) / 2,
        y: topInset + (usableHeight - LOGICAL_HEIGHT * scale) / 2,
      };
      return { width: cssWidth, height: cssHeight, dpr };
    }

    function canvasPoint(x, y) {
      return { x: viewport.x + x * viewport.scale, y: viewport.y + y * viewport.scale };
    }

    function strokePath(points, color, width, alpha = 1) {
      if (!points.length) return;
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = color;
      context.lineWidth = width;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      const first = canvasPoint(points[0].x, points[0].y);
      context.moveTo(first.x, first.y);
      for (let index = 1; index < points.length; index += 1) {
        const point = canvasPoint(points[index].x, points[index].y);
        context.lineTo(point.x, point.y);
      }
      context.stroke();
      context.restore();
    }

    function drawBackground() {
      context.fillStyle = palette.background;
      context.fillRect(0, 0, cssWidth, cssHeight);
      const gradient = context.createLinearGradient?.(viewport.x, viewport.y, viewport.x, viewport.y + viewport.height);
      if (gradient) {
        gradient.addColorStop(0, palette.field);
        gradient.addColorStop(1, palette.background);
        context.fillStyle = gradient;
      } else context.fillStyle = palette.field;
      context.fillRect(viewport.x, viewport.y, viewport.width, viewport.height);

      context.save();
      context.strokeStyle = `${palette.muted}18`;
      context.lineWidth = 1;
      for (let y = 15; y < LOGICAL_HEIGHT; y += 15) {
        const a = canvasPoint(0, y);
        const b = canvasPoint(LOGICAL_WIDTH, y + Math.sin(y * 0.17) * 2);
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
      context.restore();
    }

    function drawAmbient() {
      if (config.ambientFeedback === "aurora") {
        context.save();
        context.globalAlpha = 0.12 + resonance * 0.2;
        context.strokeStyle = palette.current;
        context.lineWidth = Math.max(3, viewport.scale * 5);
        for (let band = 0; band < 3; band += 1) {
          context.beginPath();
          for (let step = 0; step <= 12; step += 1) {
            const x = step / 12 * LOGICAL_WIDTH;
            const y = 32 + band * 40 + Math.sin(step * 0.74 + simulationTime * 0.0007 + band) * (5 + resonance * 5);
            const point = canvasPoint(x, y);
            if (!step) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y);
          }
          context.stroke();
        }
        context.restore();
      }
      if (config.ambientFeedback === "ripples") {
        context.save();
        context.strokeStyle = palette.current;
        for (const current of currents) {
          const age = clamp((simulationTime - current.bornAt) / current.duration, 0, 1);
          const point = canvasPoint(current.x, current.y);
          context.globalAlpha = (1 - age) * 0.24;
          context.lineWidth = Math.max(1, viewport.scale * 0.7);
          context.beginPath();
          context.arc(point.x, point.y, viewport.scale * current.radius * (0.35 + age * 0.65), 0, Math.PI * 2);
          context.stroke();
        }
        context.restore();
      }
    }

    function drawFronts() {
      context.save();
      context.strokeStyle = palette.front;
      context.lineWidth = Math.max(1, viewport.scale * 0.8);
      for (const front of fronts) {
        const progress = clamp((simulationTime - front.bornAt) / front.duration, 0, 1);
        context.globalAlpha = Math.sin(progress * Math.PI) * 0.3;
        if (front.behavior === "vortex") {
          const center = canvasPoint(
            50 + Math.cos(front.phase + progress * Math.PI * 2) * 18,
            76 + Math.sin(front.phase + progress * Math.PI * 2) * 24,
          );
          context.beginPath();
          context.arc(center.x, center.y, viewport.scale * (10 + progress * 14), front.phase, front.phase + Math.PI * 1.55);
          context.stroke();
        } else {
          const from = front.behavior === "shear"
            ? canvasPoint(-15 + progress * 130, 0)
            : canvasPoint(0, -15 + progress * 180);
          const to = front.behavior === "shear"
            ? canvasPoint(-15 + progress * 130, LOGICAL_HEIGHT)
            : canvasPoint(LOGICAL_WIDTH, -15 + progress * 180 + Math.sin(front.phase) * 7);
          context.beginPath();
          context.moveTo(from.x, from.y);
          context.lineTo(to.x, to.y);
          context.stroke();
        }
      }
      context.restore();
    }

    function drawCurrents() {
      for (const current of currents) {
        const age = clamp((simulationTime - current.bornAt) / current.duration, 0, 1);
        const half = Math.min(10, current.radius * 0.45);
        strokePath([
          { x: current.x - current.dx * half, y: current.y - current.dy * half },
          { x: current.x + current.dx * half, y: current.y + current.dy * half },
        ], palette.current, Math.max(1.2, viewport.scale * 1.25), (1 - age) * 0.62);
      }
    }

    function drawTargets() {
      targets.forEach((target, index) => {
        const point = canvasPoint(target.x, target.y);
        const radius = viewport.scale * (5.2 + resonance * 1.8);
        context.save();
        context.translate(point.x, point.y);
        context.rotate(target.phase + simulationTime * 0.00022);
        context.strokeStyle = palette.roles[index];
        context.globalAlpha = 0.42 + resonance * 0.35;
        context.lineWidth = Math.max(1.2, viewport.scale * 0.85);
        context.beginPath();
        for (let vertex = 0; vertex < 4; vertex += 1) {
          const angle = vertex * Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (!vertex) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.closePath();
        context.stroke();
        context.restore();
      });
    }

    function drawMotes() {
      for (const mote of motes) {
        const role = adaptiveRole(mote);
        const roleIndex = ROLE_IDS.indexOf(role);
        const color = palette.roles[roleIndex];
        if (config.ambientFeedback === "trails" && mote.trail.length > 1) {
          strokePath(mote.trail, color, Math.max(1, viewport.scale * 0.75), 0.18 + resonance * 0.18);
        }
        const point = canvasPoint(mote.x, mote.y);
        const radius = viewport.scale * (role === "pulse" ? 2.15 : role === "link" ? 1.9 : 1.65);
        context.save();
        context.translate(point.x, point.y);
        context.rotate(Math.atan2(mote.vy, mote.vx));
        context.fillStyle = color;
        context.globalAlpha = 0.82 + resonance * 0.18;
        context.beginPath();
        if (role === "glide") {
          context.moveTo(radius * 1.45, 0);
          context.lineTo(-radius, radius * 0.72);
          context.lineTo(-radius * 0.55, 0);
          context.lineTo(-radius, -radius * 0.72);
        } else if (role === "link") {
          context.moveTo(0, -radius);
          context.lineTo(radius, 0);
          context.lineTo(0, radius);
          context.lineTo(-radius, 0);
        } else {
          context.arc(0, 0, radius, 0, Math.PI * 2);
        }
        context.closePath();
        context.fill();
        context.restore();
      }
    }

    function drawHud() {
      if (config.externalHud) return;
      context.save();
      context.fillStyle = palette.ink;
      context.font = "800 12px system-ui, sans-serif";
      context.textAlign = "left";
      context.fillText(`RISONANZA ${Math.round(resonance * 100)}%`, 10, 22);
      context.textAlign = "right";
      context.fillStyle = palette.muted;
      context.fillText(`ENERGIA ${Math.round(energy)} · ${Math.floor(scoreFloat)}`, cssWidth - 10, 22);
      context.restore();
    }

    function render() {
      if (status === "destroyed") return;
      drawBackground();
      drawAmbient();
      drawFronts();
      drawCurrents();
      drawTargets();
      drawMotes();
      drawHud();
    }

    function scheduleLoop() {
      if (status === "running" && !rafId) rafId = requestFrame(loop);
    }

    function loop(timestamp) {
      rafId = 0;
      if (status !== "running") return;
      if (!lastFrame) lastFrame = timestamp;
      const delta = clamp(timestamp - lastFrame, 0, 180);
      lastFrame = timestamp;
      accumulator += delta;
      let steps = 0;
      while (accumulator + 1e-7 >= FIXED_STEP_MS && status === "running" && steps < MAX_STEPS_PER_FRAME) {
        accumulator -= FIXED_STEP_MS;
        simulate(FIXED_STEP_MS);
        steps += 1;
      }
      if (steps >= MAX_STEPS_PER_FRAME && accumulator >= FIXED_STEP_MS) accumulator %= FIXED_STEP_MS;
      render();
      scheduleLoop();
    }

    function start() {
      if (status === "destroyed") return false;
      if (status === "running") return true;
      if (status === "paused") return resume();
      resetState("running");
      syncCanvasSize();
      render();
      emit("state", statePayload());
      scheduleLoop();
      return true;
    }

    function pause() {
      if (status !== "running") return false;
      status = "paused";
      if (rafId) cancelFrame(rafId);
      rafId = 0;
      activeBrushes.clear();
      render();
      emit("state", statePayload());
      return true;
    }

    function resume() {
      if (status !== "paused") return false;
      status = "running";
      lastFrame = 0;
      accumulator = 0;
      render();
      emit("state", statePayload());
      scheduleLoop();
      return true;
    }

    function restart() {
      if (status === "destroyed") return false;
      resetState("running");
      syncCanvasSize();
      render();
      emit("state", statePayload());
      scheduleLoop();
      return true;
    }

    function resize() {
      if (status === "destroyed") return { width: cssWidth, height: cssHeight, dpr };
      const dimensions = syncCanvasSize();
      render();
      return dimensions;
    }

    function brushStart(source) {
      if (status !== "running") return false;
      const point = pointFromInput(source);
      if (!point) return false;
      const pointerId = source.pointerId ?? "primary";
      activeBrushes.set(pointerId, point);
      return true;
    }

    function brushMove(source) {
      if (status !== "running") return false;
      const pointerId = source.pointerId ?? "primary";
      const previous = activeBrushes.get(pointerId);
      const point = pointFromInput(source);
      if (!previous || !point) return false;
      if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1.25) return true;
      const accepted = addCurrent(previous, point);
      activeBrushes.set(pointerId, point);
      render();
      return accepted;
    }

    function brushEnd(source) {
      const pointerId = source?.pointerId ?? "primary";
      if (!activeBrushes.has(pointerId)) return false;
      const previous = activeBrushes.get(pointerId);
      const point = pointFromInput(source);
      if (status === "running" && point && Math.hypot(point.x - previous.x, point.y - previous.y) >= 1.25) {
        addCurrent(previous, point);
      }
      activeBrushes.delete(pointerId);
      render();
      return true;
    }

    function accessibleNudge(direction) {
      const vectors = {
        left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1],
        "flow-left": [-1, 0], "flow-right": [1, 0], "flow-up": [0, -1], "flow-down": [0, 1],
      };
      const vector = vectors[direction];
      if (!vector) return false;
      return addCurrent(
        { x: 50 - vector[0] * 12, y: 78 - vector[1] * 12 },
        { x: 50 + vector[0] * 12, y: 78 + vector[1] * 12 },
        "accessible",
      );
    }

    function input(action) {
      if (typeof action === "string") {
        const normalized = action.trim().toLowerCase();
        if (normalized === "pause") return pause();
        if (normalized === "resume") return resume();
        if (normalized === "restart") return restart();
        return accessibleNudge(normalized);
      }
      if (!action || typeof action !== "object") return false;
      const type = String(action.type || action.phase || "").trim().toLowerCase();
      if (["brush-start", "stroke-start", "pointerdown", "begin"].includes(type)) return brushStart(action);
      if (["brush-move", "stroke-move", "pointermove", "move"].includes(type)) return brushMove(action);
      if (["brush-end", "stroke-end", "pointerup", "pointercancel", "end"].includes(type)) return brushEnd(action);
      if (type === "stroke") {
        const from = pointFromInput(action.from || {});
        const to = pointFromInput(action.to || {});
        return Boolean(from && to && addCurrent(from, to));
      }
      if (type === "pause") return pause();
      if (type === "resume") return resume();
      if (type === "restart") return restart();
      if (type === "nudge") return accessibleNudge(String(action.direction || "").toLowerCase());
      return false;
    }

    function publicMote(mote) {
      return {
        id: mote.id,
        role: adaptiveRole(mote),
        x: round(mote.x),
        y: round(mote.y),
        vx: round(mote.vx),
        vy: round(mote.vy),
      };
    }

    function publicTarget(target) {
      return { role: target.role, x: round(target.x), y: round(target.y) };
    }

    function publicCurrent(current) {
      return {
        id: current.id,
        x: round(current.x),
        y: round(current.y),
        dx: round(current.dx),
        dy: round(current.dy),
        radius: round(current.radius),
        strength: round(current.strength),
        remainingMs: Math.max(0, round(current.duration - (simulationTime - current.bornAt), 2)),
      };
    }

    function publicFront(front) {
      return {
        id: front.id,
        behavior: front.behavior,
        progress: round(clamp((simulationTime - front.bornAt) / front.duration, 0, 1)),
        strength: round(front.strength),
      };
    }

    function statePayload() {
      return {
        status,
        score: Math.floor(scoreFloat),
        energy: round(energy),
        resonance: round(resonance),
        constellationCharge: round(constellationCharge),
        constellation,
        gestures,
        frontCount,
        elapsedMs: round(simulationTime, 2),
        config: { ...config },
        motes: motes.map(publicMote),
        targets: targets.map(publicTarget),
        currents: currents.map(publicCurrent),
        fronts: fronts.map(publicFront),
      };
    }

    function getState() {
      return statePayload();
    }

    function destroy() {
      if (status === "destroyed") return;
      if (rafId) cancelFrame(rafId);
      rafId = 0;
      status = "destroyed";
      activeBrushes.clear();
      removeNativeListeners();
      if (canvas.style && destroyedTouchAction !== null) canvas.style.touchAction = destroyedTouchAction;
      emit("state", statePayload());
    }

    function nativePointerDown(event) {
      if (status !== "running") return;
      event.preventDefault?.();
      canvas.setPointerCapture?.(event.pointerId);
      brushStart(event);
    }

    function nativePointerMove(event) {
      if (!activeBrushes.has(event.pointerId)) return;
      event.preventDefault?.();
      brushMove(event);
    }

    function nativePointerEnd(event) {
      if (!activeBrushes.has(event.pointerId)) return;
      event.preventDefault?.();
      brushEnd(event);
      canvas.releasePointerCapture?.(event.pointerId);
    }

    function addNativeListeners() {
      if (typeof canvas.addEventListener !== "function") return;
      canvas.addEventListener("pointerdown", nativePointerDown, { passive: false });
      canvas.addEventListener("pointermove", nativePointerMove, { passive: false });
      canvas.addEventListener("pointerup", nativePointerEnd, { passive: false });
      canvas.addEventListener("pointercancel", nativePointerEnd, { passive: false });
    }

    function removeNativeListeners() {
      if (typeof canvas.removeEventListener !== "function") return;
      canvas.removeEventListener("pointerdown", nativePointerDown);
      canvas.removeEventListener("pointermove", nativePointerMove);
      canvas.removeEventListener("pointerup", nativePointerEnd);
      canvas.removeEventListener("pointercancel", nativePointerEnd);
    }

    resetState("idle");
    syncCanvasSize();
    if (canvas.style) {
      destroyedTouchAction = canvas.style.touchAction || "";
      canvas.style.touchAction = "none";
    }
    addNativeListeners();
    render();

    const api = {
      start,
      pause,
      resume,
      restart,
      destroy,
      resize,
      input,
      getState,
      snapshot: getState,
    };
    if (config.debug) {
      api.debug = Object.freeze({
        step(count = 1) {
          if (status !== "running") return false;
          const iterations = clamp(Math.round(Number(count) || 1), 1, 120000);
          for (let index = 0; index < iterations && status === "running"; index += 1) simulate(FIXED_STEP_MS);
          render();
          return true;
        },
        addFront() { return status === "running" ? publicFront(addFront(false)) : false; },
        constants: Object.freeze({ LOGICAL_WIDTH, LOGICAL_HEIGHT, FIXED_STEP_MS }),
      });
    }
    return Object.freeze(api);
  }

  global.FAIPlaylab = global.FAIPlaylab || {};
  global.FAIPlaylab.createDrift = createDrift;
})(typeof window !== "undefined" ? window : globalThis);
