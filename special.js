(function () {
  "use strict";

  const SPECIAL_STORAGE_KEY = "stillUsSpecialLayerV3";
  const EGG_STORAGE_KEY = "stillUsEggProgressV3";

  const BIRTHDAY_MONTH = 3;
  const BIRTHDAY_DAY = 29;
  const STAR_LIMIT = 28;
  const CONNECTION_DISTANCE = 180;
  const UNLOCK_ANIMATION_MS = 1700;

  const IDLE_RAIN_MS = 18000;
  const HEARTBEAT_HOLD_MS = 6000;
  const HEARTBEAT_EGG_COOLDOWN_MS = 14000;
  const WEATHER_POLL_MS = 1000;

  const RESET_ARM_TAPS = 7;
  const RESET_ARM_WINDOW_MS = 4500;
  const RESET_HOLD_MS = 3000;

  const SLOW_CLICK_MIN_MS = 650;
  const SLOW_CLICK_MAX_MS = 4200;
  const SLOW_CLICK_TARGET = 20;

  const PROMISES = [
    "I will keep choosing you in ordinary moments, not only perfect ones.",
    "I will remember your quiet moods, not just your loud laughs.",
    "I will make room for your dreams, even the changing ones.",
    "I will hold your hand through uncertainty without rushing your healing.",
    "I will keep finding small ways to make your day softer.",
    "I will treat your heart like something sacred, never convenient.",
    "I will still flirt with you when we're old and dramatic.",
    "I will protect your peace as fiercely as I protect my own."
  ];

  const POETIC_UNLOCK_LINES = [
    "A quiet sky opened because you asked gently.",
    "Some constellations only appear for patient hearts.",
    "You touched the lock and the night remembered your name."
  ];

  const WHISPER_LINES = [
    "Tonight feels like a letter we never had to send.",
    "The softest memories are still the loudest in my chest.",
    "Even the stars are trying to say your name carefully.",
    "If silence had a color, it would look like this moment."
  ];

  const state = {
    stars: [],
    promiseIndex: 0,
    constellationUnlocked: false,
    constellationEggGranted: false,
    unlockAnimationStartedAt: 0,
    dpr: 1,
    shootingTimerId: null,
    holdTimerId: null,
    resetHoldTimerId: null,
    secretTapTimerId: null,
    weatherPollTimerId: null,
    heartbeatTimerId: null,
    doNothingCount: 0,
    doNothingLastClickAt: 0,
    doNothingUnlocked: false,
    scratchDone: false,
    scratchStrokeCount: 0,
    resetArmedUntil: 0,
    secretTapCount: 0,
    lastUserActionAt: Date.now(),
    previousWeatherMode: "none",
    weatherEggGranted: false,
    warmGlowUntil: 0,
    observedEggCount: 0,
    starTapCount: 0,
    starEggCooldownUntil: 0,
    lastHeartbeatEggAt: 0,
    keyboardBuffer: []
  };

  const el = {};
  const scratch = {
    drawing: false,
    revealed: false,
    ctx: null,
    canvas: null
  };

  document.addEventListener("DOMContentLoaded", initSpecialLayer);

  function initSpecialLayer() {
    cacheElements();
    if (!el.canvas || !el.storyApp) {
      return;
    }

    hydrate();
    setCanvasSize();
    bindEvents();
    updateCountdown();
    updateMoodLine();
    renderPromise(state.promiseIndex, false);
    applyNightModeIfNeeded();
    refreshUnlockUI();
    initScratchCard();

    requestAnimationFrame(drawConstellation);
    startShootingStars();
    startMemoryWeatherSystem();
  }

  function cacheElements() {
    el.canvas = document.getElementById("constellation-canvas");
    el.ctx = el.canvas ? el.canvas.getContext("2d") : null;
    el.tip = document.getElementById("constellation-tip");
    el.storyApp = document.getElementById("story-app");
    el.shootingLayer = document.getElementById("shooting-star-layer");
    el.weatherLayer = document.getElementById("memory-weather-layer");

    el.unlockButton = document.getElementById("constellation-unlock-btn");
    el.whisperButton = document.getElementById("whisper-btn");
    el.eggCount = document.querySelector(".egg-count");
    el.eggCountValue = document.getElementById("egg-count-value");
    el.eggHint = document.getElementById("egg-hint");

    el.countdownLine = document.getElementById("countdown-line");
    el.moodLine = document.getElementById("mood-line");
    el.promiseCard = document.getElementById("promise-card");
    el.promiseText = document.getElementById("promise-text");
    el.promiseReveal = document.getElementById("promise-reveal");
    el.promiseSecret = document.getElementById("promise-secret");
    el.pauseSection = document.getElementById("pause");

    el.doNothingButton = document.getElementById("do-nothing-btn");
    el.doNothingFeedback = document.getElementById("do-nothing-feedback");

    el.fakeEndingButton = document.getElementById("fake-ending-btn");
    el.fakeEndingOverlay = document.getElementById("fake-ending-overlay");
    el.reviveWord = document.getElementById("revive-word");

    el.scratchCanvas = document.getElementById("scratch-canvas");
    el.scratchRevealText = document.getElementById("scratch-reveal-text");

    el.feedback = document.getElementById("egg-feedback");
  }

  function hydrate() {
    const saved = readJSON(SPECIAL_STORAGE_KEY, {
      stars: [],
      promiseIndex: 0,
      constellationUnlocked: false,
      constellationEggGranted: false,
      weatherEggGranted: false,
      doNothingUnlocked: false,
      scratchDone: false
    });

    state.promiseIndex = clamp(Math.floor(saved.promiseIndex || 0), 0, PROMISES.length - 1);
    state.constellationUnlocked = Boolean(saved.constellationUnlocked);
    state.constellationEggGranted = Boolean(saved.constellationEggGranted);
    state.weatherEggGranted = Boolean(saved.weatherEggGranted);
    state.doNothingUnlocked = Boolean(saved.doNothingUnlocked);
    state.scratchDone = Boolean(saved.scratchDone);

    state.stars = (saved.stars || [])
      .map((star) => ({
        x: clamp(Number(star.x) * window.innerWidth, 0, window.innerWidth),
        y: clamp(Number(star.y) * window.innerHeight, 0, window.innerHeight),
        born: Number.isFinite(star.born) ? star.born : Date.now()
      }))
      .slice(-STAR_LIMIT);

    state.observedEggCount = getEggCountFromStorage();
  }

  function persist() {
    const normalizedStars = state.stars.map((star) => ({
      x: safeRatio(star.x, window.innerWidth),
      y: safeRatio(star.y, window.innerHeight),
      born: star.born
    }));

    localStorage.setItem(
      SPECIAL_STORAGE_KEY,
      JSON.stringify({
        stars: normalizedStars,
        promiseIndex: state.promiseIndex,
        constellationUnlocked: state.constellationUnlocked,
        constellationEggGranted: state.constellationEggGranted,
        weatherEggGranted: state.weatherEggGranted,
        doNothingUnlocked: state.doNothingUnlocked,
        scratchDone: state.scratchDone
      })
    );
  }

  function bindEvents() {
    window.addEventListener("resize", () => {
      setCanvasSize();
      updateCountdown();
      updateMoodLine();
      resizeScratchCanvas();
    });

    ["mousemove", "pointerdown", "scroll", "touchstart", "click"].forEach((eventName) => {
      document.addEventListener(
        eventName,
        () => {
          state.lastUserActionAt = Date.now();
        },
        { passive: true }
      );
    });

    el.storyApp.addEventListener("click", (event) => {
      if (!document.body.classList.contains("experience-active")) {
        return;
      }

      if (event.target.closest("button, input, label, #waypoint-nav, #music-bar, #egg-hud, #scratch-canvas")) {
        return;
      }

      if (!state.constellationUnlocked) {
        setTip("The sky is still sleeping. Press Wake the sky.");
        playHintTone();
        return;
      }

      addStar(event.clientX, event.clientY);
      onConstellationTap();
    });

    setupHeartbeatInteraction();
    setupSecretButtons();
    setupPromiseInteractions();
    setupDoNothingButton();
    setupFakeEnding();
    setupHiddenFactoryReset();
  }

  function setupSecretButtons() {
    if (el.unlockButton) {
      el.unlockButton.addEventListener("click", unlockConstellation);
    }

    if (el.whisperButton) {
      el.whisperButton.addEventListener("click", () => {
        flashFeedback(pickRandom(WHISPER_LINES));
        playWhisperTone();
      });
    }
  }

  function setupPromiseInteractions() {
    if (!el.promiseReveal) {
      return;
    }

    el.promiseReveal.addEventListener("click", revealNextPromise);

    const startHold = () => {
      clearTimeout(state.holdTimerId);
      state.holdTimerId = window.setTimeout(() => {
        el.promiseSecret?.classList.add("show");
        flashFeedback("Pinned promise unlocked. Keep this one close.");
      }, 1200);
    };

    const clearHold = () => clearTimeout(state.holdTimerId);

    el.promiseReveal.addEventListener("mousedown", startHold);
    el.promiseReveal.addEventListener("touchstart", startHold, { passive: true });
    el.promiseReveal.addEventListener("mouseup", clearHold);
    el.promiseReveal.addEventListener("mouseleave", clearHold);
    el.promiseReveal.addEventListener("touchend", clearHold);
    el.promiseReveal.addEventListener("touchcancel", clearHold);
  }

  function setupDoNothingButton() {
    if (!el.doNothingButton) {
      return;
    }

    el.doNothingButton.addEventListener("click", () => {
      const now = Date.now();
      const delta = now - state.doNothingLastClickAt;

      if (delta >= SLOW_CLICK_MIN_MS && delta <= SLOW_CLICK_MAX_MS) {
        state.doNothingCount += 1;
      } else {
        state.doNothingCount = 1;
      }

      state.doNothingLastClickAt = now;

      if (el.doNothingFeedback) {
        el.doNothingFeedback.textContent = `Nothing count: ${state.doNothingCount} / ${SLOW_CLICK_TARGET}`;
      }

      if (state.doNothingCount >= SLOW_CLICK_TARGET && !state.doNothingUnlocked) {
        state.doNothingUnlocked = true;
        if (el.doNothingFeedback) {
          el.doNothingFeedback.textContent = "You did nothing beautifully.";
        }
        el.promiseCard?.classList.add("flipped");
        window.setTimeout(() => el.promiseCard?.classList.remove("flipped"), 700);
        awardFirstMissingEgg("Even doing nothing was a hidden ritual.");
        playUnlockTone();
        persist();
      }
    });
  }

  function setupFakeEnding() {
    if (el.fakeEndingButton) {
      el.fakeEndingButton.addEventListener("click", () => {
        el.fakeEndingOverlay?.classList.remove("hidden-panel");
        document.body.classList.add("fake-ending-mode");
        flashFeedback("A quiet ending arrived.");
        playHintTone();
      });
    }

    if (el.reviveWord) {
      el.reviveWord.addEventListener("click", () => {
        el.fakeEndingOverlay?.classList.add("hidden-panel");
        document.body.classList.remove("fake-ending-mode");
        flashFeedback("You found the word that brings everything back.");
        awardFirstMissingEgg("Fake ending revived.");
        if (el.eggHint) {
          el.eggHint.textContent = "Hint: endings can be doors if you read softly.";
        }
      });
    }
  }

  // Heartbeat mechanic: a sustained hold creates a soft pulse and can unlock eggs in key sections.
  function setupHeartbeatInteraction() {
    const startHold = () => {
      clearTimeout(state.heartbeatTimerId);
      state.heartbeatTimerId = window.setTimeout(() => {
        triggerHeartbeat();
      }, HEARTBEAT_HOLD_MS);
    };

    const clearHold = () => clearTimeout(state.heartbeatTimerId);

    el.storyApp.addEventListener("mousedown", startHold);
    el.storyApp.addEventListener("touchstart", startHold, { passive: true });
    el.storyApp.addEventListener("mouseup", clearHold);
    el.storyApp.addEventListener("mouseleave", clearHold);
    el.storyApp.addEventListener("touchend", clearHold);
    el.storyApp.addEventListener("touchcancel", clearHold);
  }

  function triggerHeartbeat() {
    document.body.classList.remove("heartbeat-pulse");
    void document.body.offsetWidth;
    document.body.classList.add("heartbeat-pulse");
    window.setTimeout(() => document.body.classList.remove("heartbeat-pulse"), 2200);
    playHeartbeatTone();

    const sectionId = getCurrentSectionId();
    const now = Date.now();
    if (now - state.lastHeartbeatEggAt < HEARTBEAT_EGG_COOLDOWN_MS) {
      return;
    }

    if (sectionId === "pause" || sectionId === "stillus" || sectionId === "ending") {
      awardFirstMissingEgg(`Heartbeat heard in ${sectionId}.`);
      state.lastHeartbeatEggAt = now;
    }
  }

  function getCurrentSectionId() {
    const centerY = window.innerHeight * 0.45;
    let bestId = "start";
    let bestCoverage = -1;

    document.querySelectorAll(".story-section").forEach((section) => {
      const rect = section.getBoundingClientRect();
      const top = Math.max(rect.top, 0);
      const bottom = Math.min(rect.bottom, window.innerHeight);
      const coverage = Math.max(0, bottom - top);

      if (coverage > bestCoverage && rect.top <= centerY && rect.bottom >= centerY) {
        bestCoverage = coverage;
        bestId = section.id;
      }
    });

    return bestId;
  }

  // Factory reset is intentionally hidden behind a secret click sequence or admin keyboard combo.
  function setupHiddenFactoryReset() {
    if (el.eggCount) {
      el.eggCount.addEventListener("click", () => {
        state.secretTapCount += 1;
        clearTimeout(state.secretTapTimerId);
        state.secretTapTimerId = window.setTimeout(() => {
          state.secretTapCount = 0;
        }, RESET_ARM_WINDOW_MS);

        if (state.secretTapCount >= RESET_ARM_TAPS) {
          armReset("Reset whisper armed. Hold Whisper for 3 seconds.");
          state.secretTapCount = 0;
        }
      });
    }

    if (el.whisperButton) {
      const startHold = () => {
        if (Date.now() > state.resetArmedUntil) {
          return;
        }
        clearTimeout(state.resetHoldTimerId);
        state.resetHoldTimerId = window.setTimeout(factoryResetAllProgress, RESET_HOLD_MS);
      };

      const clearHold = () => clearTimeout(state.resetHoldTimerId);

      el.whisperButton.addEventListener("mousedown", startHold);
      el.whisperButton.addEventListener("touchstart", startHold, { passive: true });
      el.whisperButton.addEventListener("mouseup", clearHold);
      el.whisperButton.addEventListener("mouseleave", clearHold);
      el.whisperButton.addEventListener("touchend", clearHold);
      el.whisperButton.addEventListener("touchcancel", clearHold);
    }

    document.addEventListener("keydown", (event) => {
      if (!(event.ctrlKey && event.altKey && event.shiftKey)) {
        return;
      }

      state.keyboardBuffer.push(event.code);
      state.keyboardBuffer = state.keyboardBuffer.slice(-5);

      if (state.keyboardBuffer.join("-") === "KeyR-KeyE-KeyS-KeyE-KeyT") {
        armReset("Admin combo accepted. Hold Whisper for 3 seconds.");
      }
    });
  }

  function armReset(message) {
    state.resetArmedUntil = Date.now() + 9000;
    el.whisperButton?.classList.add("armed");
    flashFeedback(message);
    window.setTimeout(() => el.whisperButton?.classList.remove("armed"), 9200);
  }

  function factoryResetAllProgress() {
    flashFeedback("Factory reset initiated. Closing this memory and starting fresh.");
    playResetTone();

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("stillUs")) {
        localStorage.removeItem(key);
      }
    });

    window.setTimeout(() => {
      window.location.reload();
    }, 900);
  }

  function unlockConstellation() {
    if (state.constellationUnlocked) {
      flashFeedback("The constellation gate is already open.");
      playHintTone();
      return;
    }

    state.constellationUnlocked = true;
    state.unlockAnimationStartedAt = performance.now();
    setTip("The sky woke up. Tap anywhere in the story.");
    flashFeedback(pickRandom(POETIC_UNLOCK_LINES));
    playUnlockTone();

    if (!state.constellationEggGranted) {
      awardFirstMissingEgg("Constellation unlocked.");
      state.constellationEggGranted = true;
    }

    refreshUnlockUI();
    persist();
  }

  function refreshUnlockUI() {
    document.body.classList.toggle("constellation-locked", !state.constellationUnlocked);

    if (el.unlockButton) {
      el.unlockButton.textContent = state.constellationUnlocked ? "Sky Awake" : "Wake the sky";
      el.unlockButton.classList.toggle("unlocked", state.constellationUnlocked);
    }
  }

  function onConstellationTap() {
    state.starTapCount += 1;
    playStarTone();

    const now = Date.now();
    if (now < state.starEggCooldownUntil) {
      return;
    }

    const chanceBoost = Math.min(0.5, 0.08 + state.starTapCount * 0.01);
    if (Math.random() < chanceBoost) {
      awardFirstMissingEgg("A star aligned with your touch.");
      state.starTapCount = 0;
      state.starEggCooldownUntil = now + 5500;
    }
  }

  function addStar(x, y) {
    state.stars.push({ x, y, born: Date.now() });
    if (state.stars.length > STAR_LIMIT) {
      state.stars.shift();
    }

    if (state.stars.length === 1) {
      setTip("First star saved. Keep drawing our sky.");
    } else if (state.stars.length === 8) {
      setTip("Eight stars. The shape feels familiar.");
      flashFeedback("The sky remembered your touch.");
    } else if (state.stars.length === 15) {
      setTip("Fifteen stars. It looks like a secret map.");
    } else if (state.stars.length === STAR_LIMIT) {
      setTip("Maximum stars reached. Keep tapping to rewrite it.");
      flashFeedback("Constellation complete.");
    }

    persist();
  }

  function setCanvasSize() {
    if (!el.canvas || !el.ctx) {
      return;
    }

    state.dpr = Math.max(1, window.devicePixelRatio || 1);
    el.canvas.width = Math.floor(window.innerWidth * state.dpr);
    el.canvas.height = Math.floor(window.innerHeight * state.dpr);
    el.canvas.style.width = `${window.innerWidth}px`;
    el.canvas.style.height = `${window.innerHeight}px`;
    el.ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function drawConstellation() {
    if (!el.ctx || !el.canvas) {
      return;
    }

    const ctx = el.ctx;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (!state.constellationUnlocked) {
      requestAnimationFrame(drawConstellation);
      return;
    }

    const now = Date.now();
    let unlockProgress = 1;

    if (state.unlockAnimationStartedAt > 0) {
      const elapsed = performance.now() - state.unlockAnimationStartedAt;
      unlockProgress = easeOutCubic(clamp(elapsed / UNLOCK_ANIMATION_MS, 0, 1));
      if (elapsed >= UNLOCK_ANIMATION_MS) {
        state.unlockAnimationStartedAt = 0;
      }
    }

    for (let i = 0; i < state.stars.length; i += 1) {
      for (let j = i + 1; j < state.stars.length; j += 1) {
        const a = state.stars[i];
        const b = state.stars[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);

        if (distance > CONNECTION_DISTANCE) {
          continue;
        }

        const alpha = 0.22 * (1 - distance / CONNECTION_DISTANCE) * unlockProgress;
        ctx.strokeStyle = `rgba(255, 228, 242, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    state.stars.forEach((star) => {
      const age = now - star.born;
      const pulse = 0.65 + Math.sin((age / 380) % (Math.PI * 2)) * 0.35;
      const size = (1.6 + pulse * 1.4) * (0.65 + unlockProgress * 0.35);

      ctx.fillStyle = `rgba(255, 245, 251, ${(0.72 + pulse * 0.22).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(drawConstellation);
  }

  // Memory weather reacts to stillness and discovery progress.
  function startMemoryWeatherSystem() {
    clearInterval(state.weatherPollTimerId);
    state.weatherPollTimerId = window.setInterval(updateMemoryWeather, WEATHER_POLL_MS);
    updateMemoryWeather();
  }

  function updateMemoryWeather() {
    const now = Date.now();
    const idleMs = now - state.lastUserActionAt;
    const eggCount = getEggCountFromStorage();

    if (eggCount > state.observedEggCount) {
      state.warmGlowUntil = now + 9000;
      state.observedEggCount = eggCount;
    }

    let mode = "none";
    if (idleMs >= IDLE_RAIN_MS) {
      mode = "rain";
    } else if (now < state.warmGlowUntil || eggCount >= 20) {
      mode = "glow";
    }

    if (mode !== state.previousWeatherMode) {
      document.body.classList.toggle("weather-rain", mode === "rain");
      document.body.classList.toggle("weather-glow", mode === "glow");

      if (mode === "rain") {
        setTip("Soft weather arrived while you stayed still.");
        playRainTone();
        if (!state.weatherEggGranted) {
          awardFirstMissingEgg("You noticed the memory weather shift.");
          state.weatherEggGranted = true;
          persist();
        }
      } else if (mode === "glow") {
        setTip("A warm glow answered your discoveries.");
        playGlowTone();
      }
    }

    state.previousWeatherMode = mode;
  }

  function getEggCountFromStorage() {
    const data = readJSON(EGG_STORAGE_KEY, { found: [] });
    return Array.isArray(data.found) ? data.found.length : 0;
  }

  // Dynamic egg allocator used by optional/new interactions without changing the 1..50 registry.
  function awardFirstMissingEgg(customMessage) {
    const targetEggId = findFirstMissingEggId();
    if (!targetEggId) {
      return false;
    }

    let awarded = false;
    let usedPrimaryUnlock = false;
    let primaryUnlockErrored = false;
    if (typeof window.unlockEgg === "function") {
      usedPrimaryUnlock = true;
      try {
        awarded = Boolean(window.unlockEgg(targetEggId, customMessage));
      } catch (error) {
        primaryUnlockErrored = true;
      }
    }

    // Only fall back to direct localStorage writes if the global handler is unavailable
    // or throws. If unlockEgg returns false intentionally (already found / locked),
    // respect that decision.
    if (!awarded && (!usedPrimaryUnlock || primaryUnlockErrored)) {
      const eggData = readJSON(EGG_STORAGE_KEY, { found: [] });
      const foundSet = new Set(eggData.found || []);
      if (foundSet.has(targetEggId)) {
        return false;
      }

      foundSet.add(targetEggId);
      localStorage.setItem(EGG_STORAGE_KEY, JSON.stringify({ found: Array.from(foundSet) }));

      if (el.eggCountValue) {
        el.eggCountValue.textContent = String(foundSet.size);
      }
      if (el.eggHint) {
        el.eggHint.textContent = `Find hidden moments. ${Math.max(0, 50 - foundSet.size)} remaining.`;
      }
      flashFeedback(customMessage);
    }

    if (!awarded && usedPrimaryUnlock && !primaryUnlockErrored) {
      return false;
    }

    state.observedEggCount = getEggCountFromStorage();
    return true;
  }

  function findFirstMissingEggId() {
    const eggData = readJSON(EGG_STORAGE_KEY, { found: [] });
    const found = new Set(eggData.found || []);

    for (let i = 1; i <= 50; i += 1) {
      const id = `egg${String(i).padStart(2, "0")}`;
      if (!found.has(id)) {
        return id;
      }
    }

    return "";
  }

  function initScratchCard() {
    if (!el.scratchCanvas) {
      return;
    }

    scratch.canvas = el.scratchCanvas;
    scratch.ctx = scratch.canvas.getContext("2d");
    if (!scratch.ctx) {
      return;
    }

    resizeScratchCanvas();
    drawScratchCover();

    const start = (event) => {
      scratch.drawing = true;
      scratchAt(event);
    };

    const move = (event) => {
      if (!scratch.drawing) {
        return;
      }
      scratchAt(event);
    };

    const end = () => {
      scratch.drawing = false;
      checkScratchReveal();
    };

    scratch.canvas.addEventListener("mousedown", start);
    scratch.canvas.addEventListener("touchstart", start, { passive: false });
    scratch.canvas.addEventListener("mousemove", move);
    scratch.canvas.addEventListener("touchmove", move, { passive: false });
    scratch.canvas.addEventListener("mouseup", end);
    scratch.canvas.addEventListener("mouseleave", end);
    scratch.canvas.addEventListener("touchend", end);
    scratch.canvas.addEventListener("touchcancel", end);

    if (state.scratchDone) {
      revealScratchImmediately();
    }
  }

  function resizeScratchCanvas() {
    if (!scratch.canvas || !scratch.ctx) {
      return;
    }

    const rect = scratch.canvas.getBoundingClientRect();
    scratch.canvas.width = Math.max(1, Math.floor(rect.width));
    scratch.canvas.height = Math.max(1, Math.floor(rect.height));

    if (!state.scratchDone) {
      drawScratchCover();
    }
  }

  function drawScratchCover() {
    if (!scratch.ctx || !scratch.canvas) {
      return;
    }

    scratch.ctx.globalCompositeOperation = "source-over";
    scratch.ctx.fillStyle = "rgba(249, 225, 238, 0.92)";
    scratch.ctx.fillRect(0, 0, scratch.canvas.width, scratch.canvas.height);

    scratch.ctx.fillStyle = "rgba(134, 68, 96, 0.82)";
    scratch.ctx.font = "600 22px Caveat, cursive";
    scratch.ctx.textAlign = "center";
    scratch.ctx.fillText("scratch gently", scratch.canvas.width / 2, scratch.canvas.height / 2 + 8);

    scratch.ctx.globalCompositeOperation = "destination-out";
  }

  function scratchAt(event) {
    if (!scratch.ctx || !scratch.canvas) {
      return;
    }

    event.preventDefault();
    const rect = scratch.canvas.getBoundingClientRect();
    const point = getPointer(event);
    const x = point.x - rect.left;
    const y = point.y - rect.top;

    scratch.ctx.beginPath();
    scratch.ctx.arc(x, y, 18, 0, Math.PI * 2);
    scratch.ctx.fill();
    state.scratchStrokeCount += 1;
  }

  function getPointer(event) {
    if (event.touches && event.touches[0]) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    if (event.changedTouches && event.changedTouches[0]) {
      return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }
    return { x: event.clientX || 0, y: event.clientY || 0 };
  }

  function checkScratchReveal() {
    if (scratch.revealed || !scratch.ctx || !scratch.canvas || state.scratchStrokeCount < 14) {
      return;
    }

    const data = scratch.ctx.getImageData(0, 0, scratch.canvas.width, scratch.canvas.height).data;
    let transparent = 0;
    const stride = 32;

    for (let i = 3; i < data.length; i += stride) {
      if (data[i] === 0) {
        transparent += 1;
      }
    }

    const ratio = transparent / Math.ceil(data.length / stride);
    if (ratio > 0.35) {
      revealScratchImmediately();
      awardFirstMissingEgg("A hidden sentence appeared under your touch.");
      flashFeedback("Scratch card revealed.");
      state.scratchDone = true;
      persist();
    }
  }

  function revealScratchImmediately() {
    if (!scratch.canvas) {
      return;
    }

    scratch.revealed = true;
    scratch.canvas.style.opacity = "0";
    scratch.canvas.style.pointerEvents = "none";
  }

  function revealNextPromise() {
    state.promiseIndex = (state.promiseIndex + 1) % PROMISES.length;
    renderPromise(state.promiseIndex, true);
    persist();
  }

  function renderPromise(index, animate) {
    if (!el.promiseText || !el.promiseCard) {
      return;
    }

    el.promiseText.textContent = PROMISES[index];

    if (!animate) {
      return;
    }

    el.promiseCard.classList.remove("flipped");
    void el.promiseCard.offsetWidth;
    el.promiseCard.classList.add("flipped");
    setTimeout(() => el.promiseCard.classList.remove("flipped"), 420);
  }

  function updateCountdown() {
    if (!el.countdownLine) {
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    let target = new Date(currentYear, BIRTHDAY_MONTH - 1, BIRTHDAY_DAY, 0, 0, 0, 0);

    if (target < now) {
      target = new Date(currentYear + 1, BIRTHDAY_MONTH - 1, BIRTHDAY_DAY, 0, 0, 0, 0);
    }

    const dayMs = 1000 * 60 * 60 * 24;
    const days = Math.ceil((target.getTime() - now.getTime()) / dayMs);

    if (days <= 0) {
      el.countdownLine.textContent = "It is your day today. Stay here as long as you want.";
      return;
    }

    el.countdownLine.textContent = `${days} day${days === 1 ? "" : "s"} until the next birthday chapter.`;
  }

  function updateMoodLine() {
    if (!el.moodLine) {
      return;
    }

    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      el.moodLine.textContent = "Morning mood: light, shy, and full of soft starts.";
      return;
    }
    if (hour >= 12 && hour < 18) {
      el.moodLine.textContent = "Afternoon mood: golden, warm, and a little playful.";
      return;
    }
    if (hour >= 18 && hour < 23) {
      el.moodLine.textContent = "Evening mood: cinematic glow, low music, slow hearts.";
      return;
    }

    el.moodLine.textContent = "Night mood: whispered sky, gentle constellations, just us.";
  }

  function applyNightModeIfNeeded() {
    const hour = new Date().getHours();
    if (hour >= 23 || hour <= 4) {
      document.body.classList.add("night-whisper");
      setTip("Night mode is active. The sky responds softly now.");
    }
  }

  function startShootingStars() {
    if (!el.shootingLayer) {
      return;
    }

    const spawn = () => {
      if (!document.body.classList.contains("experience-active")) {
        schedule();
        return;
      }

      if (Math.random() < 0.38) {
        const star = document.createElement("span");
        star.className = "shooting-star";
        star.style.left = `${randomBetween(36, window.innerWidth - 60).toFixed(1)}px`;
        star.style.top = `${randomBetween(20, Math.max(40, window.innerHeight * 0.35)).toFixed(1)}px`;
        star.style.setProperty("--shoot-duration", `${randomBetween(1200, 1900).toFixed(0)}ms`);
        el.shootingLayer.append(star);
        setTimeout(() => star.remove(), 2200);
      }

      schedule();
    };

    const schedule = () => {
      clearTimeout(state.shootingTimerId);
      state.shootingTimerId = setTimeout(spawn, randomBetween(8000, 16000));
    };

    schedule();
  }

  function setTip(text) {
    if (el.tip) {
      el.tip.textContent = text;
    }
  }

  function flashFeedback(text) {
    if (!el.feedback) {
      return;
    }

    el.feedback.textContent = text;
    el.feedback.classList.add("show");
    setTimeout(() => el.feedback.classList.remove("show"), 2600);
  }

  function playUnlockTone() {
    playToneSequence([
      { freq: 392, length: 0.12, gain: 0.05 },
      { freq: 523, length: 0.14, gain: 0.05 },
      { freq: 659, length: 0.16, gain: 0.045 }
    ]);
  }

  function playStarTone() {
    playToneSequence([{ freq: 620, length: 0.08, gain: 0.03 }]);
  }

  function playHintTone() {
    playToneSequence([{ freq: 280, length: 0.09, gain: 0.02 }]);
  }

  function playWhisperTone() {
    playToneSequence([
      { freq: 330, length: 0.09, gain: 0.02 },
      { freq: 294, length: 0.09, gain: 0.018 }
    ]);
  }

  function playHeartbeatTone() {
    playToneSequence([
      { freq: 180, length: 0.11, gain: 0.028 },
      { freq: 160, length: 0.11, gain: 0.024 }
    ]);
  }

  function playRainTone() {
    playToneSequence([{ freq: 250, length: 0.08, gain: 0.016 }]);
  }

  function playGlowTone() {
    playToneSequence([{ freq: 500, length: 0.1, gain: 0.02 }]);
  }

  function playResetTone() {
    playToneSequence([
      { freq: 440, length: 0.11, gain: 0.03 },
      { freq: 370, length: 0.11, gain: 0.028 },
      { freq: 294, length: 0.12, gain: 0.025 }
    ]);
  }

  function playToneSequence(notes) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    const context = new AudioCtx();
    const startedAt = context.currentTime;

    notes.forEach((note, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      const start = startedAt + index * 0.11;
      const end = start + note.length;

      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(note.gain, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    });

    setTimeout(() => context.close(), 900);
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function safeRatio(value, size) {
    if (!size || size <= 0) {
      return 0.5;
    }
    return clamp(value / size, 0, 1);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
})();
