// js/time_pressure.js
(function () {
  // 0 up, 1 right, 2 down, 3 left
  const FORCED_DIR = 2
  const MOVE_LIMIT_MS = 5000

  let remainingMs = MOVE_LIMIT_MS
  let timer = null
  let lastTick = null
  let enabled = true

  function ensureTimerUI() {
    let el = document.getElementById("timePressureTimer")
    if (!el) {
      el = document.createElement("div")
      el.id = "timePressureTimer"
      el.style.marginTop = "8px"
      el.style.fontSize = "16px"
      el.style.fontWeight = "600"
      el.textContent = "Next move in: 5.0s"
      // put it near the top; adjust selector if you want
      const container = document.querySelector(".scores-container") || document.body
      container.parentNode.insertBefore(el, container.nextSibling)
    }
    return el
  }

  function setUI(ms) {
    const el = ensureTimerUI()
    el.textContent = `Next move in: ${(ms / 1000).toFixed(1)}s`
  }

  function reset() {
    remainingMs = MOVE_LIMIT_MS
    lastTick = performance.now()
    setUI(remainingMs)
  }

  function tick(inputManager) {
    if (!enabled) return
    const now = performance.now()
    const dt = now - (lastTick ?? now)
    lastTick = now
    remainingMs -= dt

    if (remainingMs <= 0) {
      // Force a DOWN move via the game's own event system
      inputManager.emit("move", FORCED_DIR)
      reset()
      return
    }

    setUI(remainingMs)
  }

  // Expose one global hook
  window.attachTimePressure = function (inputManager) {
    // reset whenever the player makes ANY move
    inputManager.on("move", function () {
      reset()
    })

    // optional: also reset on restart/keepPlaying if your fork uses these
    inputManager.on("restart", function () {
      reset()
    })
    inputManager.on("keepPlaying", function () {
      reset()
    })

    // start ticking
    reset()
    clearInterval(timer)
    timer = setInterval(function () {
      tick(inputManager)
    }, 100) // 10Hz for smooth countdown
  }
})()
