(function initDirectorsGlass() {
  "use strict";

  const hero = document.querySelector(".hero");
  const range = document.querySelector("#director-range");
  const output = document.querySelector("#director-output");
  const remix = document.querySelector("#signal-remix");
  if (!hero || !range || !output) return;

  const theme = document.querySelector('meta[name="theme-color"]');
  const states = [
    { max: 33, label: "REGIA UMANA", color: "#05070b" },
    { max: 67, label: "EQUILIBRIO", color: "#0d1118" },
    { max: 100, label: "SISTEMA ASSISTITO", color: "#101a2b" },
  ];

  function render() {
    const value = Number(range.value);
    const normalized = Math.max(0, Math.min(1, (value - Number(range.min)) / (Number(range.max) - Number(range.min))));
    const state = states.find((item) => value <= item.max) || states[1];
    hero.style.setProperty("--director-reveal", `${value}%`);
    hero.style.setProperty("--director-image-scale", (1.025 + normalized * .14).toFixed(3));
    hero.style.setProperty("--director-image-x", `${(4 - normalized * 10).toFixed(2)}%`);
    hero.style.setProperty("--director-image-y", `${(-3 + normalized * 6).toFixed(2)}%`);
    hero.style.setProperty("--director-image-rotate", `${(-2.4 + normalized * 5.2).toFixed(2)}deg`);
    hero.style.setProperty("--director-image-hue", `${Math.round(-18 + normalized * 76)}deg`);
    hero.style.setProperty("--director-image-saturation", (1.05 + normalized * 1.05).toFixed(2));
    hero.style.setProperty("--director-energy", (.3 + normalized * .7).toFixed(2));
    hero.dataset.directorState = state.label.toLowerCase().replace(/\s+/g, "-");
    output.textContent = `${state.label} / ${value}% AI`;
    range.style.setProperty("--director-progress", `${value}%`);
    if (theme) theme.content = state.color;
    hero.dispatchEvent(new CustomEvent("director:change", {
      detail: { value, normalized, state: state.label },
    }));
  }

  let vibrationReady = true;
  const drag = {
    pointerId: null,
    startX: 0,
    startValue: Number(range.value),
    moved: false,
  };

  range.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    range.focus({ preventScroll: true });
    drag.pointerId = event.pointerId;
    drag.startX = event.clientX;
    drag.startValue = Number(range.value);
    drag.moved = false;
    range.dataset.gesture = "press";
    range.setPointerCapture?.(event.pointerId);
  });

  range.addEventListener("pointermove", (event) => {
    if (drag.pointerId === null || event.pointerId !== drag.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(deltaX) < 8) return;
    drag.moved = true;
    range.dataset.gesture = "drag";
    const rect = (range.parentElement || range).getBoundingClientRect();
    const minimum = Number(range.min);
    const maximum = Number(range.max);
    const nextValue = drag.startValue - (deltaX / Math.max(rect.width, 1)) * (maximum - minimum);
    range.value = String(Math.round(Math.max(minimum, Math.min(maximum, nextValue))));
    range.dispatchEvent(new Event("input", { bubbles: true }));
  });

  function finishRangeDrag(event) {
    if (drag.pointerId === null || event.pointerId !== drag.pointerId) return;
    const finishedPointer = drag.pointerId;
    const changed = drag.moved;
    drag.pointerId = null;
    drag.moved = false;
    delete range.dataset.gesture;
    if (range.hasPointerCapture?.(finishedPointer)) range.releasePointerCapture(finishedPointer);
    if (changed) range.dispatchEvent(new Event("change", { bubbles: true }));
  }

  range.addEventListener("pointerup", finishRangeDrag);
  range.addEventListener("pointercancel", finishRangeDrag);
  range.addEventListener("lostpointercapture", (event) => {
    if (drag.pointerId !== null && event.pointerId === drag.pointerId) finishRangeDrag(event);
  });

  range.addEventListener("input", () => {
    render();
    if (
      vibrationReady &&
      navigator.vibrate &&
      matchMedia("(pointer: coarse)").matches &&
      Number(range.value) % 10 === 0
    ) {
      vibrationReady = false;
      navigator.vibrate(6);
      window.setTimeout(() => {
        vibrationReady = true;
      }, 90);
    }
  });

  range.addEventListener("change", () => {
    if (navigator.vibrate && matchMedia("(pointer: coarse)").matches) {
      navigator.vibrate(10);
    }
  });

  remix?.addEventListener("click", () => {
    const nextValue = 18 + Math.round(Math.random() * 64);
    range.value = String(nextValue);
    render();
    hero.classList.remove("director-cut");
    void hero.offsetWidth;
    hero.classList.add("director-cut");
    window.setTimeout(() => hero.classList.remove("director-cut"), 520);
  });

  render();
})();

(function initWorkRail() {
  "use strict";

  const deck = document.querySelector(".work-deck");
  const cards = Array.from(document.querySelectorAll(".work-card"));
  const previous = document.querySelector("#work-prev");
  const next = document.querySelector("#work-next");
  const position = document.querySelector("#work-position");
  if (!deck || cards.length < 2 || !previous || !next || !position) return;

  cards.forEach((card, index) => {
    const title = card.querySelector("h3")?.textContent?.trim() || `Lavoro ${index + 1}`;
    card.setAttribute("aria-label", `${index + 1} di ${cards.length}: ${title}`);
  });

  let activeIndex = 0;
  let scrollFrame = 0;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startScroll = 0;
  let dragAxis = "";
  let suppressClick = false;

  function isRail() {
    return deck.scrollWidth > deck.clientWidth + 2;
  }

  function cardLeft(card) {
    const padding = Number.parseFloat(getComputedStyle(deck).paddingLeft) || 0;
    return Math.max(0, card.offsetLeft - padding);
  }

  function nearestIndex() {
    return cards.reduce((best, card, index) => {
      const distance = Math.abs(cardLeft(card) - deck.scrollLeft);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
  }

  function render(index = nearestIndex()) {
    activeIndex = Math.max(0, Math.min(cards.length - 1, index));
    position.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
    previous.disabled = activeIndex === 0;
    next.disabled = activeIndex === cards.length - 1;
    cards.forEach((card, cardIndex) => {
      if (cardIndex === activeIndex) card.setAttribute("aria-current", "true");
      else card.removeAttribute("aria-current");
    });
  }

  function goTo(index, behavior = "smooth") {
    const target = Math.max(0, Math.min(cards.length - 1, index));
    deck.scrollTo({ left: cardLeft(cards[target]), behavior });
    render(target);
  }

  function finishDrag(event) {
    if (pointerId === null || event.pointerId !== pointerId) return;
    const wasHorizontal = dragAxis === "x";
    const finishedPointer = pointerId;
    pointerId = null;
    if (deck.hasPointerCapture?.(finishedPointer)) deck.releasePointerCapture(finishedPointer);
    dragAxis = "";
    deck.classList.remove("is-dragging");
    if (wasHorizontal) {
      suppressClick = Math.abs(event.clientX - startX) > 8;
      goTo(nearestIndex(), "smooth");
    }
  }

  deck.addEventListener("pointerdown", (event) => {
    if (!isRail() || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (event.target instanceof Element && event.target.closest("a, button, input, summary, label")) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startScroll = deck.scrollLeft;
    dragAxis = "";
    suppressClick = false;
    deck.setPointerCapture?.(pointerId);
  });

  deck.addEventListener("pointermove", (event) => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (!dragAxis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 6) {
      dragAxis = Math.abs(deltaX) > Math.abs(deltaY) * 1.12 ? "x" : "y";
      if (dragAxis === "x") deck.classList.add("is-dragging");
    }
    if (dragAxis !== "x") return;
    if (event.cancelable) event.preventDefault();
    deck.scrollLeft = startScroll - deltaX;
  });

  deck.addEventListener("pointerup", finishDrag);
  deck.addEventListener("pointercancel", finishDrag);
  deck.addEventListener("lostpointercapture", (event) => {
    if (pointerId !== null && event.pointerId === pointerId) finishDrag(event);
  });

  deck.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);

  deck.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (!deck.classList.contains("is-dragging")) render();
    });
  }, { passive: true });

  deck.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    goTo(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
  });

  previous.addEventListener("click", () => goTo(activeIndex - 1));
  next.addEventListener("click", () => goTo(activeIndex + 1));
  window.addEventListener("resize", () => render());

  render(0);
})();

/* ── Restyling 30.08.2026 ──────────────────────────────────────────────
   Mette in pausa le animazioni decorative dell'hero quando esce dal
   viewport. Il canvas ha già il suo observer in next.js; queste erano
   cinque animation:infinite che giravano comunque a fondo pagina. */
(() => {
  const hero = document.querySelector(".hero");
  if (!hero || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    ([entry]) => document.body.classList.toggle("hero-out", !entry.isIntersecting),
    { rootMargin: "80px" },
  );
  observer.observe(hero);
})();
