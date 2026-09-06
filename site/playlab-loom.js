(function initFAIPlaylabLoom(global) {
  "use strict";

  // Original Playlab / Engine A — independently authored procedural Canvas code.
  // The interaction is based on continuous-field shaping: two control points
  // define focus, phase and tension around moving anchors. No external assets.

  const VERSION = 1;
  const FIXED_STEP = 1 / 60;
  const FIXED_STEP_MS = FIXED_STEP * 1000;
  const MAX_FRAME_MS = 250;
  const MAX_STEPS = 18;
  const TAU = Math.PI * 2;

  const PHASE_WINDOWS = Object.freeze({
    wide: 0.62,
    balanced: 0.40,
    precise: 0.24,
  });

  const VISCOSITIES = Object.freeze({
    responsive: 0.075,
    flowing: 0.145,
    dense: 0.255,
  });

  const ENTROPY_RECOVERY = Object.freeze({
    gradual: 0.075,
    steady: 0.13,
    rapid: 0.205,
  });

  const MATERIALS = Object.freeze({
    silk: Object.freeze({
      palette: Object.freeze(["#b9ffef", "#7de2ff", "#9e8cff"]),
      backdrop: "#071015",
      orbitRate: 0.105,
      phaseRate: 0.31,
      idealSpan: 0.275,
      resonanceGain: 1.13,
      entropyGain: 0.72,
      strandCount: 5,
      bend: 0.12,
    }),
    fluid: Object.freeze({
      palette: Object.freeze(["#8fffd1", "#62bfff", "#ff90ce"]),
      backdrop: "#071019",
      orbitRate: 0.078,
      phaseRate: 0.235,
      idealSpan: 0.315,
      resonanceGain: 0.98,
      entropyGain: 0.52,
      strandCount: 7,
      bend: 0.18,
    }),
    crystal: Object.freeze({
      palette: Object.freeze(["#ecf4ff", "#b6a4ff", "#75f4ff"]),
      backdrop: "#090c18",
      orbitRate: 0.132,
      phaseRate: 0.39,
      idealSpan: 0.235,
      resonanceGain: 1.27,
      entropyGain: 0.9,
      strandCount: 3,
      bend: 0.075,
    }),
  });

  const DNA = Object.freeze({
    anchorCount: Object.freeze([3, 4, 5, 6, 7]),
    phaseWindow: Object.freeze(Object.keys(PHASE_WINDOWS)),
    viscosity: Object.freeze(Object.keys(VISCOSITIES)),
    entropyRecovery: Object.freeze(Object.keys(ENTROPY_RECOVERY)),
    fieldMaterial: Object.freeze(Object.keys(MATERIALS)),
  });

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function finite(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function round(value, digits = 6) {
    const power = 10 ** digits;
    return Math.round(value * power) / power;
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function mix(a, b, amount) {
    return a + (b - a) * amount;
  }

  function wrapAngle(value) {
    let angle = value % TAU;
    if (angle < 0) angle += TAU;
    return angle;
  }

  function lineAngleDistance(a, b) {
    let difference = Math.abs(wrapAngle(a) - wrapAngle(b)) % Math.PI;
    if (difference > Math.PI / 2) difference = Math.PI - difference;
    return difference;
  }

  function normalizeChoice(value, table, aliases, fallback) {
    const key = String(value ?? "").trim().toLowerCase();
    const normalized = aliases[key] || key;
    return Object.prototype.hasOwnProperty.call(table, normalized) ? normalized : fallback;
  }

  function hashSeed(value) {
    const text = String(value ?? "loom-seed");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createRandom(seed) {
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
    const anchorCount = clamp(Math.round(finite(raw.anchorCount, 5)), 3, 7);

    const phaseWindowName = normalizeChoice(raw.phaseWindow, PHASE_WINDOWS, {
      easy: "wide",
      broad: "wide",
      medium: "balanced",
      normal: "balanced",
      narrow: "precise",
      hard: "precise",
    }, "balanced");

    const viscosityName = normalizeChoice(raw.viscosity, VISCOSITIES, {
      low: "responsive",
      light: "responsive",
      medium: "flowing",
      normal: "flowing",
      high: "dense",
      heavy: "dense",
    }, "flowing");

    const recoveryName = normalizeChoice(raw.entropyRecovery, ENTROPY_RECOVERY, {
      slow: "gradual",
      low: "gradual",
      balanced: "steady",
      normal: "steady",
      fast: "rapid",
      high: "rapid",
    }, "steady");

    const materialName = normalizeChoice(raw.fieldMaterial, MATERIALS, {
      filament: "silk",
      textile: "silk",
      liquid: "fluid",
      glass: "crystal",
      mineral: "crystal",
    }, "silk");

    let phaseWindow = PHASE_WINDOWS[phaseWindowName];
    if (typeof raw.phaseWindow === "number" && Number.isFinite(raw.phaseWindow)) {
      phaseWindow = clamp(raw.phaseWindow > Math.PI ? raw.phaseWindow * Math.PI / 180 : raw.phaseWindow, 0.12, 0.9);
    }

    let viscosity = VISCOSITIES[viscosityName];
    if (typeof raw.viscosity === "number" && Number.isFinite(raw.viscosity)) {
      viscosity = clamp(raw.viscosity, 0.045, 0.4);
    }

    let entropyRecovery = ENTROPY_RECOVERY[recoveryName];
    if (typeof raw.entropyRecovery === "number" && Number.isFinite(raw.entropyRecovery)) {
      entropyRecovery = clamp(raw.entropyRecovery, 0.025, 0.35);
    }

    return {
      anchorCount,
      phaseWindow: phaseWindowName,
      phaseWindowRadians: phaseWindow,
      viscosity: viscosityName,
      viscositySeconds: viscosity,
      entropyRecovery: recoveryName,
      entropyRecoveryRate: entropyRecovery,
      fieldMaterial: materialName,
      seed: raw.seed ?? "loom-seed",
      duration: clamp(finite(raw.duration, 90), 15, 3600),
      sequenceLength: clamp(Math.round(finite(raw.sequenceLength, anchorCount * 3)), 3, 64),
      oneFinger: raw.oneFinger !== false,
      externalHud: raw.externalHud === true,
      reducedMotion: raw.reducedMotion === true
        || raw.reduceMotion === true
        || Boolean(global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches),
      dprLimit: clamp(finite(raw.dprLimit, 2), 1, 3),
    };
  }

  function createLoom(options) {
    const settings = options || {};
    const canvas = settings.canvas;
    if (!canvas || typeof canvas.getContext !== "function") {
      throw new TypeError("FAIPlaylab.createLoom requires a canvas element");
    }

    const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!context) throw new Error("Canvas 2D is not available");

    const config = normalizeConfig(settings.config);
    const material = MATERIALS[config.fieldMaterial];
    const onEvent = typeof settings.onEvent === "function" ? settings.onEvent : () => {};
    const onState = typeof settings.onState === "function" ? settings.onState : null;
    const requestFrame = typeof global.requestAnimationFrame === "function"
      ? global.requestAnimationFrame.bind(global)
      : (callback) => global.setTimeout(() => callback(Date.now()), 16);
    const cancelFrame = typeof global.cancelAnimationFrame === "function"
      ? global.cancelAnimationFrame.bind(global)
      : global.clearTimeout.bind(global);

    const viewport = { width: 390, height: 640, dpr: 1 };
    const pointers = new Map();
    const listeners = [];
    const previousCanvasStyle = {
      touchAction: canvas.style?.touchAction ?? "",
      userSelect: canvas.style?.userSelect ?? "",
    };

    let random = createRandom(config.seed);
    let anchors = [];
    let sequence = [];
    let sequenceCursor = 0;
    let status = "idle";
    let tick = 0;
    let elapsed = 0;
    let scoreFloat = 0;
    let entropy = 0;
    let entropyRecovered = 0;
    let resonance = 0;
    let resonanceTime = 0;
    let quality = 0;
    let symmetry = 1;
    let completions = 0;
    let coherence = 0;
    let lastCompletionQuality = 0;
    let controlsActive = false;
    let inputMode = "none";
    let syntheticPoint = { x: 0.5, y: 0.5 };
    let syntheticActive = false;
    let targetA = { x: 0.36, y: 0.5 };
    let targetB = { x: 0.64, y: 0.5 };
    let handleA = { ...targetA };
    let handleB = { ...targetB };
    let rafId = null;
    let lastTimestamp = null;
    let accumulator = 0;
    let destroyed = false;

    function emit(name, payload = {}) {
      const detail = { ...payload, tick, elapsed: round(elapsed) };
      try {
        onEvent(name, detail);
      } catch (_) {
        // Consumer callbacks cannot break the simulation owner.
      }
    }

    function notifyState(reason) {
      if (!onState) return;
      try {
        onState(getState(), reason);
      } catch (_) {
        // State observers are deliberately isolated from the engine.
      }
    }

    function makeAnchors() {
      const result = [];
      for (let index = 0; index < config.anchorCount; index += 1) {
        result.push({
          id: `a${index + 1}`,
          index,
          baseAngle: (index / config.anchorCount) * TAU - Math.PI / 2,
          radialOffset: (random() - 0.5) * 0.035,
          wobble: 0.75 + random() * 0.65,
          phaseOffset: random() * TAU,
          direction: random() < 0.5 ? -1 : 1,
          x: 0.5,
          y: 0.5,
          desiredAngle: 0,
          charge: 0,
        });
      }
      return result;
    }

    function refillSequence() {
      const bag = Array.from({ length: config.anchorCount }, (_, index) => index);
      for (let index = bag.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(random() * (index + 1));
        [bag[index], bag[swap]] = [bag[swap], bag[index]];
      }
      if (sequence.length && bag.length > 1 && bag[0] === sequence[sequence.length - 1]) {
        [bag[0], bag[1]] = [bag[1], bag[0]];
      }
      sequence.push(...bag);
    }

    function ensureSequence(index) {
      while (sequence.length <= index) refillSequence();
    }

    function updateAnchorGeometry() {
      const radiusBase = 0.29 + Math.min(0.035, config.anchorCount * 0.004);
      for (const anchor of anchors) {
        const orbit = elapsed * material.orbitRate * anchor.direction;
        const wobble = Math.sin(elapsed * (0.17 + anchor.wobble * 0.035) + anchor.phaseOffset) * 0.035;
        const angle = anchor.baseAngle + orbit + wobble;
        const radius = radiusBase + anchor.radialOffset
          + Math.sin(elapsed * 0.21 + anchor.phaseOffset) * 0.012;
        anchor.x = 0.5 + Math.cos(angle) * radius;
        anchor.y = 0.5 + Math.sin(angle) * radius;
        anchor.desiredAngle = wrapAngle(
          angle + Math.PI / 2
          + Math.sin(elapsed * material.phaseRate + anchor.phaseOffset) * 0.68,
        );
      }
    }

    function resetSimulation() {
      random = createRandom(config.seed);
      anchors = makeAnchors();
      sequence = [];
      sequenceCursor = 0;
      ensureSequence(config.sequenceLength + config.anchorCount);
      tick = 0;
      elapsed = 0;
      scoreFloat = 0;
      entropy = 0;
      entropyRecovered = 0;
      resonance = 0;
      resonanceTime = 0;
      quality = 0;
      symmetry = 1;
      completions = 0;
      coherence = 0;
      lastCompletionQuality = 0;
      pointers.clear();
      controlsActive = false;
      inputMode = "none";
      syntheticPoint = { x: 0.5, y: 0.5 };
      syntheticActive = false;
      targetA = { x: 0.36, y: 0.5 };
      targetB = { x: 0.64, y: 0.5 };
      handleA = { ...targetA };
      handleB = { ...targetB };
      accumulator = 0;
      lastTimestamp = null;
      updateAnchorGeometry();
    }

    function currentTargetIndex() {
      ensureSequence(sequenceCursor);
      return sequence[sequenceCursor];
    }

    function currentTarget() {
      return anchors[currentTargetIndex()] || anchors[0];
    }

    function clampPoint(point) {
      return {
        x: clamp(finite(point?.x, 0.5), 0.035, 0.965),
        y: clamp(finite(point?.y, 0.5), 0.055, 0.945),
      };
    }

    function pointFromClient(source) {
      const rect = typeof canvas.getBoundingClientRect === "function"
        ? canvas.getBoundingClientRect()
        : { left: 0, top: 0, width: viewport.width, height: viewport.height };
      const width = Math.max(1, finite(rect.width, viewport.width));
      const height = Math.max(1, finite(rect.height, viewport.height));
      const hasClient = Number.isFinite(Number(source?.clientX)) && Number.isFinite(Number(source?.clientY));
      if (source?.normalized === true || source?.space === "normalized") {
        return clampPoint(source);
      }
      if (!hasClient && Math.abs(finite(source?.x, 0)) <= 1 && Math.abs(finite(source?.y, 0)) <= 1) {
        return clampPoint(source);
      }
      const x = hasClient ? Number(source.clientX) - finite(rect.left, 0) : finite(source?.x, width / 2);
      const y = hasClient ? Number(source.clientY) - finite(rect.top, 0) : finite(source?.y, height / 2);
      return clampPoint({ x: x / width, y: y / height });
    }

    function deriveSingleFingerHandles(point) {
      const focus = clampPoint(point);
      // Accessible one-contact mode keeps the same focus gesture while the
      // phase guide supplies the missing second degree of freedom.
      const direction = currentTarget()?.desiredAngle ?? 0;
      const half = material.idealSpan * 0.5;
      return [
        clampPoint({ x: focus.x - Math.cos(direction) * half, y: focus.y - Math.sin(direction) * half }),
        clampPoint({ x: focus.x + Math.cos(direction) * half, y: focus.y + Math.sin(direction) * half }),
      ];
    }

    function refreshTargets() {
      const active = [...pointers.entries()]
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
        .map((entry) => entry[1]);

      if (active.length >= 2) {
        targetA = clampPoint(active[0]);
        targetB = clampPoint(active[1]);
        controlsActive = true;
        inputMode = "dual";
        return;
      }

      const single = active[0] || (syntheticActive ? syntheticPoint : null);
      if (single && config.oneFinger) {
        [targetA, targetB] = deriveSingleFingerHandles(single);
        controlsActive = true;
        inputMode = "single";
        return;
      }

      controlsActive = false;
      inputMode = "none";
    }

    function activateIfNeeded() {
      if (status === "idle") start();
      else if (status === "paused") resume();
    }

    function setPointer(identifier, point) {
      pointers.set(identifier, clampPoint(point));
      syntheticActive = false;
      refreshTargets();
      activateIfNeeded();
    }

    function removePointer(identifier) {
      pointers.delete(identifier);
      refreshTargets();
    }

    function completeResonance() {
      const target = currentTarget();
      const completionQuality = clamp((quality + symmetry + (1 - entropy)) / 3, 0, 1);
      const recoveryBurst = Math.min(entropy, config.entropyRecoveryRate * (0.42 + completionQuality * 0.44));
      entropy -= recoveryBurst;
      entropyRecovered += recoveryBurst;
      target.charge = 1;
      completions += 1;
      sequenceCursor += 1;
      ensureSequence(sequenceCursor + config.anchorCount);
      coherence = clamp(coherence * 0.72 + completionQuality * 0.48, 0, 1);
      lastCompletionQuality = completionQuality;
      scoreFloat += 420 + completionQuality * 580 + recoveryBurst * 700;
      resonance = 0;

      emit("resonance", {
        anchorId: target.id,
        completion: completions,
        completionQuality: round(completionQuality),
        entropyRecovered: round(recoveryBurst),
        score: Math.floor(scoreFloat),
      });

      if (completions >= config.sequenceLength) {
        finish("sequence");
      }
    }

    function finish(reason) {
      if (status !== "running") return;
      status = "complete";
      cancelLoop();
      emit("complete", {
        reason,
        score: Math.floor(scoreFloat),
        completions,
        coherence: round(coherence),
      });
      notifyState("complete");
    }

    function update(delta) {
      tick += 1;
      elapsed += delta;
      updateAnchorGeometry();

      if (controlsActive && inputMode === "single") refreshTargets();

      for (const anchor of anchors) {
        anchor.charge = Math.max(0, anchor.charge - delta * 0.3);
      }

      const previousA = { ...handleA };
      const previousB = { ...handleB };
      const blend = 1 - Math.exp(-delta / config.viscositySeconds);
      handleA.x = mix(handleA.x, targetA.x, blend);
      handleA.y = mix(handleA.y, targetA.y, blend);
      handleB.x = mix(handleB.x, targetB.x, blend);
      handleB.y = mix(handleB.y, targetB.y, blend);

      const moved = distance(previousA, handleA) + distance(previousB, handleB);
      const gestureMotion = moved / Math.max(delta, 1e-6);
      const target = currentTarget();
      const midpoint = { x: (handleA.x + handleB.x) / 2, y: (handleA.y + handleB.y) / 2 };
      const span = Math.max(0.001, distance(handleA, handleB));
      const angle = Math.atan2(handleB.y - handleA.y, handleB.x - handleA.x);
      const proximity = clamp(1 - distance(midpoint, target) / 0.255, 0, 1);
      const phaseError = lineAngleDistance(angle, target.desiredAngle);
      const phaseAlignment = clamp(1 - phaseError / config.phaseWindowRadians, 0, 1);
      const tensionAlignment = clamp(1 - Math.abs(span - material.idealSpan) / 0.21, 0, 1);
      const distanceA = distance(handleA, target);
      const distanceB = distance(handleB, target);
      symmetry = clamp(1 - Math.abs(distanceA - distanceB) / Math.max(span, 0.08), 0, 1);

      if (controlsActive) {
        const motionPressure = clamp((gestureMotion - 0.16) / 1.8, 0, 1);
        entropy = clamp(entropy + moved * material.entropyGain * (0.7 + motionPressure), 0, 1);
      }

      const entropyDamping = 0.48 + (1 - entropy) * 0.52;
      quality = controlsActive
        ? proximity
          * (0.24 + phaseAlignment * 0.76)
          * (0.38 + tensionAlignment * 0.62)
          * entropyDamping
        : 0;

      let recoveryMultiplier = controlsActive ? 0.55 + quality * 0.85 : 1.45;
      if (gestureMotion > 0.7) recoveryMultiplier *= 0.4;
      const recovery = Math.min(entropy, config.entropyRecoveryRate * recoveryMultiplier * delta);
      entropy -= recovery;
      entropyRecovered += recovery;

      if (quality > 0.28) {
        resonance += delta * material.resonanceGain * (0.28 + quality * 0.92);
        resonanceTime += delta * quality;
        scoreFloat += delta * quality * (44 + symmetry * 38) + recovery * 240;
      } else {
        resonance = Math.max(0, resonance - delta * (0.2 + (0.28 - quality) * 0.55));
        scoreFloat += recovery * 180;
      }

      if (resonance >= 1) completeResonance();
      if (status === "running" && elapsed >= config.duration) finish("time");

      if (tick % 12 === 0) notifyState("tick");
    }

    function canvasPoint(point) {
      return { x: point.x * viewport.width, y: point.y * viewport.height };
    }

    function pathLine(from, to) {
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
    }

    function drawBackdrop() {
      context.save();
      context.fillStyle = material.backdrop;
      context.fillRect(0, 0, viewport.width, viewport.height);

      if (typeof context.createRadialGradient === "function") {
        const gradient = context.createRadialGradient(
          viewport.width * 0.5,
          viewport.height * 0.48,
          0,
          viewport.width * 0.5,
          viewport.height * 0.48,
          Math.max(viewport.width, viewport.height) * 0.68,
        );
        gradient.addColorStop(0, "rgba(58, 106, 126, 0.18)");
        gradient.addColorStop(0.55, "rgba(48, 34, 98, 0.08)");
        gradient.addColorStop(1, "rgba(1, 4, 9, 0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, viewport.width, viewport.height);
      }

      const spacing = Math.max(28, Math.min(viewport.width, viewport.height) / 10);
      context.strokeStyle = "rgba(178, 232, 255, 0.045)";
      context.lineWidth = 1;
      context.beginPath();
      for (let x = spacing * 0.5; x < viewport.width; x += spacing) {
        context.moveTo(x, 0);
        context.lineTo(x, viewport.height);
      }
      for (let y = spacing * 0.5; y < viewport.height; y += spacing) {
        context.moveTo(0, y);
        context.lineTo(viewport.width, y);
      }
      context.stroke();
      context.restore();
    }

    function drawAnchorNetwork() {
      if (!anchors.length) return;
      context.save();
      context.beginPath();
      anchors.forEach((anchor, index) => {
        const point = canvasPoint(anchor);
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      const first = canvasPoint(anchors[0]);
      context.lineTo(first.x, first.y);
      context.strokeStyle = "rgba(151, 210, 230, 0.12)";
      context.lineWidth = Math.max(1, Math.min(viewport.width, viewport.height) * 0.0025);
      context.stroke();

      const center = { x: viewport.width * 0.5, y: viewport.height * 0.5 };
      context.beginPath();
      for (const anchor of anchors) {
        pathLine(center, canvasPoint(anchor));
      }
      context.strokeStyle = "rgba(151, 210, 230, 0.055)";
      context.stroke();
      context.restore();
    }

    function drawField() {
      const a = canvasPoint(handleA);
      const b = canvasPoint(handleB);
      const target = canvasPoint(currentTarget());
      const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const perpendicular = {
        x: -(b.y - a.y),
        y: b.x - a.x,
      };
      const perpendicularLength = Math.max(1, Math.hypot(perpendicular.x, perpendicular.y));
      perpendicular.x /= perpendicularLength;
      perpendicular.y /= perpendicularLength;

      context.save();
      context.globalCompositeOperation = "lighter";
      context.lineCap = "round";

      for (let index = 0; index < material.strandCount; index += 1) {
        const ratio = material.strandCount === 1 ? 0 : index / (material.strandCount - 1) - 0.5;
        const wave = Math.sin(elapsed * (config.reducedMotion ? 0 : material.phaseRate * 3.4) + index * 1.7);
        const offset = ratio * Math.min(viewport.width, viewport.height) * 0.035;
        const bend = material.bend * Math.min(viewport.width, viewport.height) * (0.65 + quality * 0.7);
        const control1 = {
          x: mix(a.x, midpoint.x, 0.62) + perpendicular.x * (offset + wave * bend),
          y: mix(a.y, midpoint.y, 0.62) + perpendicular.y * (offset + wave * bend),
        };
        const control2 = {
          x: mix(b.x, midpoint.x, 0.62) - perpendicular.x * (offset - wave * bend),
          y: mix(b.y, midpoint.y, 0.62) - perpendicular.y * (offset - wave * bend),
        };
        const color = material.palette[index % material.palette.length];
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, b.x, b.y);
        context.strokeStyle = color;
        context.globalAlpha = controlsActive ? 0.24 + quality * 0.5 : 0.11;
        context.lineWidth = 1 + quality * 2.3 + (index % 2) * 0.35;
        context.stroke();
      }

      context.beginPath();
      context.moveTo(midpoint.x, midpoint.y);
      context.lineTo(target.x, target.y);
      context.strokeStyle = material.palette[1];
      context.globalAlpha = controlsActive ? 0.12 + quality * 0.24 : 0.05;
      context.lineWidth = 1;
      context.stroke();
      context.restore();
    }

    function drawAnchors() {
      const target = currentTarget();
      const baseRadius = clamp(Math.min(viewport.width, viewport.height) * 0.026, 8, 17);

      for (const anchor of anchors) {
        const point = canvasPoint(anchor);
        const isTarget = anchor === target;
        const pulse = config.reducedMotion ? 0 : Math.sin(elapsed * 3 + anchor.phaseOffset) * 0.5 + 0.5;
        const radius = baseRadius * (1 + anchor.charge * 0.32);

        context.save();
        context.translate(point.x, point.y);
        context.beginPath();
        context.arc(0, 0, radius * (isTarget ? 2 + pulse * 0.16 : 1.45), 0, TAU);
        context.strokeStyle = isTarget ? material.palette[0] : "rgba(178, 222, 236, 0.18)";
        context.globalAlpha = isTarget ? 0.28 + resonance * 0.48 : 0.7;
        context.lineWidth = isTarget ? 2.2 : 1;
        context.stroke();

        context.beginPath();
        context.arc(0, 0, radius, 0, TAU);
        context.fillStyle = anchor.charge > 0 ? material.palette[2] : material.backdrop;
        context.globalAlpha = 0.9;
        context.fill();
        context.strokeStyle = material.palette[anchor.index % material.palette.length];
        context.lineWidth = isTarget ? 2.8 : 1.6;
        context.stroke();

        if (isTarget) {
          const guideLength = radius * 2.9;
          context.rotate(anchor.desiredAngle);
          context.beginPath();
          context.moveTo(-guideLength, 0);
          context.lineTo(guideLength, 0);
          context.strokeStyle = material.palette[0];
          context.globalAlpha = 0.72;
          context.lineWidth = 2;
          context.stroke();
        }
        context.restore();
      }
    }

    function drawControls() {
      if (!controlsActive) return;
      const radius = clamp(Math.min(viewport.width, viewport.height) * 0.019, 7, 13);
      for (const point of [canvasPoint(handleA), canvasPoint(handleB)]) {
        context.save();
        context.beginPath();
        context.arc(point.x, point.y, radius * 1.8, 0, TAU);
        context.fillStyle = "rgba(220, 250, 255, 0.05)";
        context.fill();
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, TAU);
        context.strokeStyle = "rgba(232, 253, 255, 0.88)";
        context.lineWidth = 1.5;
        context.stroke();
        context.restore();
      }
    }

    function drawHud() {
      if (config.externalHud) return;
      const padding = clamp(viewport.width * 0.045, 14, 24);
      const barWidth = Math.min(156, viewport.width * 0.42);
      const lineHeight = 7;
      context.save();
      context.font = "600 11px system-ui, sans-serif";
      context.textAlign = "left";
      context.textBaseline = "top";
      context.fillStyle = "rgba(225, 247, 255, 0.78)";
      context.fillText(`${completions}/${config.sequenceLength}  ·  ${Math.floor(scoreFloat)}`, padding, padding);

      context.fillStyle = "rgba(207, 235, 244, 0.12)";
      context.fillRect(padding, padding + 20, barWidth, lineHeight);
      context.fillStyle = material.palette[0];
      context.fillRect(padding, padding + 20, barWidth * clamp(resonance, 0, 1), lineHeight);

      const entropyX = viewport.width - padding - barWidth * 0.55;
      context.fillStyle = "rgba(207, 235, 244, 0.12)";
      context.fillRect(entropyX, padding + 20, barWidth * 0.55, lineHeight);
      context.fillStyle = material.palette[2];
      context.globalAlpha = 0.85;
      context.fillRect(entropyX, padding + 20, barWidth * 0.55 * entropy, lineHeight);
      context.restore();
    }

    function render() {
      if (destroyed) return;
      context.save();
      context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
      context.clearRect?.(0, 0, viewport.width, viewport.height);
      drawBackdrop();
      drawAnchorNetwork();
      drawField();
      drawAnchors();
      drawControls();
      drawHud();
      context.restore();
    }

    function scheduleLoop() {
      if (status !== "running" || rafId !== null || destroyed) return;
      rafId = requestFrame(frame);
    }

    function cancelLoop() {
      if (rafId !== null) {
        cancelFrame(rafId);
        rafId = null;
      }
      lastTimestamp = null;
      accumulator = 0;
    }

    function frame(timestamp) {
      rafId = null;
      if (status !== "running" || destroyed) return;
      const stamp = finite(timestamp, elapsed * 1000);
      if (lastTimestamp === null) lastTimestamp = stamp;
      const frameMilliseconds = clamp(stamp - lastTimestamp, 0, MAX_FRAME_MS);
      lastTimestamp = stamp;
      accumulator += frameMilliseconds;

      let steps = 0;
      while (accumulator + 1e-7 >= FIXED_STEP_MS && steps < MAX_STEPS && status === "running") {
        update(FIXED_STEP);
        accumulator -= FIXED_STEP_MS;
        steps += 1;
      }
      if (steps >= MAX_STEPS && accumulator >= FIXED_STEP_MS) {
        accumulator %= FIXED_STEP_MS;
      }

      render();
      scheduleLoop();
    }

    function start() {
      if (destroyed) return false;
      if (status === "complete") resetSimulation();
      if (status === "running") return true;
      status = "running";
      lastTimestamp = null;
      accumulator = 0;
      emit("start", { config: publicConfig() });
      notifyState("start");
      render();
      scheduleLoop();
      return true;
    }

    function pause() {
      if (destroyed || status !== "running") return false;
      status = "paused";
      cancelLoop();
      emit("pause");
      notifyState("pause");
      render();
      return true;
    }

    function resume() {
      if (destroyed || status !== "paused") return false;
      status = "running";
      lastTimestamp = null;
      accumulator = 0;
      emit("resume");
      notifyState("resume");
      scheduleLoop();
      return true;
    }

    function restart() {
      if (destroyed) return false;
      cancelLoop();
      resetSimulation();
      status = "running";
      emit("restart", { config: publicConfig() });
      notifyState("restart");
      render();
      scheduleLoop();
      return true;
    }

    function resize(width, height, pixelRatio) {
      if (destroyed) return false;
      const rect = typeof canvas.getBoundingClientRect === "function" ? canvas.getBoundingClientRect() : null;
      const cssWidth = Math.max(1, Math.round(finite(width, canvas.clientWidth || rect?.width || 390)));
      const cssHeight = Math.max(1, Math.round(finite(height, canvas.clientHeight || rect?.height || 640)));
      const dpr = clamp(finite(pixelRatio, global.devicePixelRatio || 1), 1, config.dprLimit);
      viewport.width = cssWidth;
      viewport.height = cssHeight;
      viewport.dpr = dpr;
      const bitmapWidth = Math.max(1, Math.round(cssWidth * dpr));
      const bitmapHeight = Math.max(1, Math.round(cssHeight * dpr));
      if (canvas.width !== bitmapWidth) canvas.width = bitmapWidth;
      if (canvas.height !== bitmapHeight) canvas.height = bitmapHeight;
      render();
      emit("resize", { width: cssWidth, height: cssHeight, dpr });
      return true;
    }

    function parseInput(action, payload) {
      if (typeof action === "string") return { type: action, ...(payload || {}) };
      return action && typeof action === "object" ? action : { type: "" };
    }

    function input(action, payload) {
      if (destroyed) return false;
      const command = parseInput(action, payload);
      const type = String(command.type || command.action || "").toLowerCase();

      if (type === "pointerdown" || type === "pointermove" || type === "down" || type === "move") {
        const identifier = command.pointerId ?? command.id ?? "external";
        setPointer(identifier, pointFromClient(command));
        return true;
      }
      if (type === "pointerup" || type === "pointercancel" || type === "up") {
        removePointer(command.pointerId ?? command.id ?? "external");
        return true;
      }
      if (type === "gesture") {
        pointers.clear();
        const points = Array.isArray(command.points) ? command.points.slice(0, 2) : [];
        points.forEach((point, index) => pointers.set(`gesture-${index}`, pointFromClient(point)));
        refreshTargets();
        if (points.length) activateIfNeeded();
        return points.length > 0;
      }
      if (type === "release" || type === "clear") {
        pointers.clear();
        syntheticActive = false;
        refreshTargets();
        return true;
      }
      if (type === "focus" || type === "tap") {
        syntheticPoint = pointFromClient(command);
        syntheticActive = true;
        refreshTargets();
        activateIfNeeded();
        return true;
      }
      if (["left", "right", "up", "down"].includes(type)) {
        const amount = clamp(finite(command.amount, 0.045), 0.005, 0.2);
        if (!syntheticActive) {
          const target = currentTarget();
          syntheticPoint = { x: target.x, y: target.y };
        }
        if (type === "left") syntheticPoint.x -= amount;
        if (type === "right") syntheticPoint.x += amount;
        if (type === "up") syntheticPoint.y -= amount;
        if (type === "down") syntheticPoint.y += amount;
        syntheticPoint = clampPoint(syntheticPoint);
        syntheticActive = true;
        pointers.clear();
        refreshTargets();
        activateIfNeeded();
        return true;
      }
      if (type === "pause") return pause();
      if (type === "resume") return resume();
      if (type === "restart") return restart();
      if (type === "start" || type === "primary") return start();
      return false;
    }

    function publicConfig() {
      return {
        anchorCount: config.anchorCount,
        phaseWindow: config.phaseWindow,
        phaseWindowRadians: round(config.phaseWindowRadians),
        viscosity: config.viscosity,
        viscositySeconds: round(config.viscositySeconds),
        entropyRecovery: config.entropyRecovery,
        entropyRecoveryRate: round(config.entropyRecoveryRate),
        fieldMaterial: config.fieldMaterial,
        seed: config.seed,
        duration: config.duration,
        sequenceLength: config.sequenceLength,
        oneFinger: config.oneFinger,
        reducedMotion: config.reducedMotion,
      };
    }

    function getState() {
      const target = currentTarget();
      const midpoint = { x: (handleA.x + handleB.x) / 2, y: (handleA.y + handleB.y) / 2 };
      const controlAngle = Math.atan2(handleB.y - handleA.y, handleB.x - handleA.x);
      return {
        version: VERSION,
        status,
        tick,
        elapsed: round(elapsed),
        remaining: round(Math.max(0, config.duration - elapsed)),
        score: Math.floor(scoreFloat),
        entropy: round(entropy),
        entropyRecovered: round(entropyRecovered),
        resonance: round(clamp(resonance, 0, 1)),
        resonanceTime: round(resonanceTime),
        quality: round(quality),
        symmetry: round(symmetry),
        coherence: round(coherence),
        completions,
        goal: config.sequenceLength,
        lastCompletionQuality: round(lastCompletionQuality),
        config: publicConfig(),
        viewport: { width: viewport.width, height: viewport.height, dpr: viewport.dpr },
        anchors: anchors.map((anchor) => ({
          id: anchor.id,
          index: anchor.index,
          x: round(anchor.x),
          y: round(anchor.y),
          desiredAngle: round(anchor.desiredAngle),
          charge: round(anchor.charge),
          target: anchor === target,
        })),
        target: {
          id: target?.id || null,
          index: target?.index ?? -1,
          x: round(target?.x ?? 0.5),
          y: round(target?.y ?? 0.5),
          desiredAngle: round(target?.desiredAngle ?? 0),
          phaseWindow: round(config.phaseWindowRadians),
          idealSpan: round(material.idealSpan),
          sequencePosition: completions,
        },
        controls: {
          active: controlsActive,
          pointerCount: pointers.size,
          mode: inputMode,
          a: { x: round(handleA.x), y: round(handleA.y) },
          b: { x: round(handleB.x), y: round(handleB.y) },
          midpoint: { x: round(midpoint.x), y: round(midpoint.y) },
          span: round(distance(handleA, handleB)),
          angle: round(controlAngle),
        },
      };
    }

    function snapshot() {
      const state = getState();
      return JSON.parse(JSON.stringify(state));
    }

    function addListener(target, type, handler, optionsValue) {
      if (!target || typeof target.addEventListener !== "function") return;
      target.addEventListener(type, handler, optionsValue);
      listeners.push(() => target.removeEventListener(type, handler, optionsValue));
    }

    function handlePointerDown(event) {
      if (event.cancelable) event.preventDefault();
      const identifier = event.pointerId ?? "pointer";
      setPointer(identifier, pointFromClient(event));
      try {
        canvas.setPointerCapture?.(identifier);
      } catch (_) {
        // Capture is an enhancement; input remains usable without it.
      }
    }

    function handlePointerMove(event) {
      const identifier = event.pointerId ?? "pointer";
      if (!pointers.has(identifier)) return;
      if (event.cancelable) event.preventDefault();
      setPointer(identifier, pointFromClient(event));
    }

    function handlePointerEnd(event) {
      if (event.cancelable) event.preventDefault();
      removePointer(event.pointerId ?? "pointer");
    }

    function handleTouch(event) {
      if (event.cancelable) event.preventDefault();
      pointers.clear();
      const touches = Array.from(event.touches || []).slice(0, 2);
      for (const touch of touches) {
        pointers.set(touch.identifier ?? pointers.size, pointFromClient(touch));
      }
      refreshTargets();
      if (touches.length) activateIfNeeded();
    }

    function bindInput() {
      if (canvas.style) {
        canvas.style.touchAction = "none";
        canvas.style.userSelect = "none";
      }
      addListener(canvas, "pointerdown", handlePointerDown, { passive: false });
      addListener(canvas, "pointermove", handlePointerMove, { passive: false });
      addListener(canvas, "pointerup", handlePointerEnd, { passive: false });
      addListener(canvas, "pointercancel", handlePointerEnd, { passive: false });
      if (typeof global.PointerEvent !== "function") {
        addListener(canvas, "touchstart", handleTouch, { passive: false });
        addListener(canvas, "touchmove", handleTouch, { passive: false });
        addListener(canvas, "touchend", handleTouch, { passive: false });
        addListener(canvas, "touchcancel", handleTouch, { passive: false });
      }
    }

    function destroy() {
      if (destroyed) return false;
      cancelLoop();
      for (const remove of listeners.splice(0)) remove();
      pointers.clear();
      if (canvas.style) {
        canvas.style.touchAction = previousCanvasStyle.touchAction;
        canvas.style.userSelect = previousCanvasStyle.userSelect;
      }
      controlsActive = false;
      syntheticActive = false;
      status = "destroyed";
      destroyed = true;
      emit("destroy");
      return true;
    }

    resetSimulation();
    resize();
    bindInput();

    return Object.freeze({
      start,
      pause,
      resume,
      restart,
      destroy,
      resize,
      input,
      getState,
      snapshot,
    });
  }

  const namespace = global.FAIPlaylab = global.FAIPlaylab || {};
  namespace.createLoom = createLoom;
  namespace.LOOM_DNA = DNA;
})(typeof window !== "undefined" ? window : globalThis);
