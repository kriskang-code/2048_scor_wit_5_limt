// js/time_pressure.js
(function () {
  const MOVE_LIMIT_MS = 5000; // 5 seconds
  const TICK_MS = 100;        // smooth UI updates

  let remainingMs = MOVE_LIMIT_MS;
  let timer = null;
  let lastTick = null;

  let enabled = false;        // <-- do NOT start on page load
  let started = false;        // <-- start only after first move
  let isForcing = false;

  function getRandomDirection() {
    // 0 up, 1 right, 2 down, 3 left
    return Math.floor(Math.random() * 4);
  }

  function ensureTimerUI() {
    let el = document.getElementById("timePressureTimer");
    if (el) return el;

    el = document.createElement("div");
    el.id = "timePressureTimer";
    el.style.marginTop = "8px";
    el.style.fontSize = "16px";
    el.style.fontWeight = "600";
    el.textContent = "Next move in: 5.0s";

    const anchor = document.querySelector(".scores-container");
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(el, anchor.nextSibling);
    } else {
      document.body.appendChild(el);
    }
    return el;
  }

  function setUI(ms) {
    const el = ensureTimerUI();
    el.textContent = `Next move in: ${(ms / 1000).toFixed(1)}s`;
  }

  function reset() {
    remainingMs = MOVE_LIMIT_MS;
    lastTick = performance.now();
    setUI(remainingMs);
  }

  function startTimerLoop(inputManager) {
    if (timer) return; // already running
    timer = setInterval(function () {
      tick(inputManager);
    }, TICK_MS);
  }

  function stopTimerLoop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function tick(inputManager) {
    if (!enabled) return;

    const now = performance.now();
    const dt = now - (lastTick ?? now);
    lastTick = now;

    remainingMs -= dt;

    if (remainingMs <= 0) {
      isForcing = true;
      inputManager.emit("move", getRandomDirection());
      isForcing = false;

      reset();
      return;
    }

    setUI(remainingMs);
  }

  // Call after creating the game:
  // window.attachTimePressure(game.inputManager)
  window.attachTimePressure = function (inputManager) {
    // Show UI, but don't count down yet
    ensureTimerUI();
    setUI(MOVE_LIMIT_MS);

    // Start ONLY after the first player move
    inputManager.on("move", function () {
      if (isForcing) return;

      if (!started) {
        started = true;
        enabled = true;
        reset();
        startTimerLoop(inputManager);
        return;
      }

      // After any subsequent player move, reset back to 5 seconds
      reset();
    });

    // On restart: stop and wait again for the first move
    inputManager.on("restart", function () {
      enabled = false;
      started = false;
      stopTimerLoop();
      setUI(MOVE_LIMIT_MS);
    });

    inputManager.on("keepPlaying", function () {
      // no special handling needed
    });
  };
})();
