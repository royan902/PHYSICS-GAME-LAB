(function () {
  "use strict";

  const errorScreen = document.getElementById("runtime-error");
  const canvas = document.getElementById("rocket-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  if (!canvas || !ctx || !window.MotionKernel) {
    if (errorScreen) errorScreen.hidden = false;
    return;
  }

  if (window.self !== window.top) {
    const backLink = document.querySelector(".game-tools .back-link");
    if (backLink) backLink.hidden = true;
  }

  const K = window.MotionKernel;
  const wrap = document.getElementById("canvas-wrap");

  const ui = {
    modeGameBtn: document.getElementById("mode-game-btn"),
    modeSimBtn: document.getElementById("mode-sim-btn"),
    panelGame: document.getElementById("panel-game-controls"),
    panelSim: document.getElementById("panel-sim-controls"),
    missionDesc: document.getElementById("mission-desc"),
    statusBanner: document.getElementById("status-banner"),
    statusText: document.getElementById("status-text"),
    telemMass: document.getElementById("telem-mass"),
    valAlt: document.getElementById("val-alt"),
    valVel: document.getElementById("val-vel"),
    valTheta: document.getElementById("val-theta"),
    valFuel: document.getElementById("val-fuel"),
    valThrust: document.getElementById("val-thrust"),
    valWeight: document.getElementById("val-weight"),
    gameThrottle: document.getElementById("game-throttle"),
    lblGameThrottle: document.getElementById("lbl-game-throttle"),
    btnRotLeft: document.getElementById("btn-rot-left"),
    btnRotRight: document.getElementById("btn-rot-right"),
    btnThrustHold: document.getElementById("btn-thrust-hold"),
    simGravity: document.getElementById("sim-gravity"),
    simThrust: document.getElementById("sim-thrust"),
    simFuel: document.getElementById("sim-fuel"),
    simThrottle: document.getElementById("sim-throttle"),
    lblSimG: document.getElementById("lbl-sim-g"),
    lblSimThrust: document.getElementById("lbl-sim-thrust"),
    lblSimFuel: document.getElementById("lbl-sim-fuel"),
    lblSimThrottle: document.getElementById("lbl-sim-throttle"),
    simPendingNote: document.getElementById("sim-pending-note"),
    btnPause: document.getElementById("btn-pause"),
    btnReset: document.getElementById("btn-reset"),
    btnHoverPreset: document.getElementById("btn-hover-preset"),
  };

  let activeMode = "game";
  let paused = false;
  let pendingSimParams = null;

  const held = {
    thrust: false,
    left: false,
    right: false,
  };

  // Precomputed stars for background
  const stars = Array.from({ length: 65 }, (_, i) => ({
    rx: ((i * 73) % 100) / 100,
    ry: ((i * 41) % 75) / 100,
    size: 1 + (i % 3) * 0.7,
    alpha: 0.35 + (i % 5) * 0.12,
  }));

  function readSimInputs() {
    return {
      gravity: parseFloat(ui.simGravity.value),
      maxThrust: parseFloat(ui.simThrust.value),
      fuelMass: parseFloat(ui.simFuel.value),
    };
  }

  let simState = createFreshState();

  function createFreshState() {
    if (activeMode === "simulation") {
      const cfg = pendingSimParams || readSimInputs();
      pendingSimParams = null;
      ui.simPendingNote.hidden = true;
      return K.createRocketState({
        mode: "simulation",
        x: 0,
        y: 24,
        vx: 0,
        vy: 0,
        theta: 0,
        omega: 0,
        gravity: cfg.gravity,
        maxThrust: cfg.maxThrust,
        fuelMass: cfg.fuelMass,
      });
    }
    return K.createRocketState({
      mode: "game",
      x: -3.5,
      y: 26,
      vx: 1.0,
      vy: -1.4,
      theta: 0.06,
      omega: 0,
    });
  }

  function syncLabels() {
    ui.lblGameThrottle.textContent = `${ui.gameThrottle.value}%`;
    ui.lblSimG.textContent = `${parseFloat(ui.simGravity.value).toFixed(2)} m/s²`;
    ui.lblSimThrust.textContent = `${ui.simThrust.value} N`;
    ui.lblSimFuel.textContent = `${ui.simFuel.value} kg`;
    ui.lblSimThrottle.textContent = `${ui.simThrottle.value}%`;
  }

  function resizeCanvas() {
    const w = wrap.clientWidth || window.innerWidth;
    const h = wrap.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const reasonLabels = {
    "outside-pad": "di luar landasan",
    "vertical-speed": "|vy| > 2,0 m/s",
    "horizontal-speed": "|vx| > 1,0 m/s",
    "tilt-angle": "kemiringan > 5°",
    "angular-rate": "laju putar terlalu tinggi",
  };

  function updateHUD() {
    const tel = K.getRocketTelemetry(simState);
    ui.telemMass.textContent = `Massa: ${tel.totalMass.toFixed(1)} kg`;
    ui.valAlt.textContent = `${tel.altitude.toFixed(2)} m`;
    const dispVx = simState.contactTelemetry ? simState.contactTelemetry.vx : tel.vx;
    const dispVy = simState.contactTelemetry ? simState.contactTelemetry.vy : tel.vy;
    const dispThetaDeg = simState.contactTelemetry
      ? (simState.contactTelemetry.theta * 180) / Math.PI
      : tel.thetaDeg;
    ui.valVel.textContent = `${dispVy.toFixed(2)} / ${dispVx.toFixed(2)} m/s`;
    ui.valTheta.textContent = `${dispThetaDeg.toFixed(1)}°`;
    ui.valFuel.textContent = `${tel.fuelMass.toFixed(2)} kg`;
    ui.valThrust.textContent = `${tel.thrust.toFixed(0)} N`;
    ui.valWeight.textContent = `${tel.weight.toFixed(0)} N`;

    ui.statusBanner.classList.remove("good", "danger");
    if (simState.status === "landed") {
      ui.statusBanner.classList.add("good");
      ui.statusText.textContent = `Pendaratan Sukses! (|vy| = ${Math.abs(dispVy).toFixed(2)} m/s, sisa BB ${tel.fuelMass.toFixed(1)} kg)`;
    } else if (simState.status === "crashed") {
      ui.statusBanner.classList.add("danger");
      const why = simState.crashReasons.map((r) => reasonLabels[r] || r).join(", ");
      ui.statusText.textContent = `Gagal mendarat (${why})`;
    } else if (paused) {
      ui.statusText.textContent = "Simulasi dijeda";
    } else if (tel.fuelMass <= 0.001) {
      ui.statusBanner.classList.add("danger");
      ui.statusText.textContent = "Bahan bakar habis! Roket jatuh bebas di bawah gravitasi";
    } else {
      ui.statusText.textContent =
        activeMode === "game"
          ? "Turunkan roket perlahan ke landasan tengah"
          : "Mode Simulasi: amati keseimbangan gaya dorong dan berat";
    }
  }

  function drawScene() {
    const w = wrap.clientWidth || window.innerWidth;
    const h = wrap.clientHeight || window.innerHeight;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#040814");
    grad.addColorStop(0.65, "#0d1b36");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      ctx.fillStyle = `rgba(226, 232, 240, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.rx * w, s.ry * h, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // World -> Screen mapping (padY = 0 sits near bottom fifth of safe area)
    const worldSpanY = 36;
    const scale = Math.min(w / 32, (h * 0.62) / worldSpanY);
    const originScreenX = w * 0.5;
    const groundScreenY = h * 0.72;
    const toSX = (wx) => originScreenX + wx * scale;
    const toSY = (wy) => groundScreenY - wy * scale;

    // Terrain ground
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, groundScreenY, w, h - groundScreenY);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundScreenY);
    ctx.lineTo(w, groundScreenY);
    ctx.stroke();

    // Vertical altitude scale ticks on left
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.font = "11px Consolas, monospace";
    for (let alt = 5; alt <= 30; alt += 5) {
      const sy = toSY(alt);
      if (sy > 80 && sy < groundScreenY) {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(w, sy);
        ctx.stroke();
        ctx.fillText(`${alt}m`, 14, sy - 3);
      }
    }

    // Landing pad
    const { padCenterX, padHalfWidth, padY } = simState.params;
    const padLeftX = toSX(padCenterX - padHalfWidth);
    const padRightX = toSX(padCenterX + padHalfWidth);
    const padTopY = toSY(padY);

    ctx.fillStyle = simState.status === "landed" ? "#22c55e" : "#38bdf8";
    ctx.fillRect(padLeftX, padTopY - 4, padRightX - padLeftX, 8);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(padLeftX - 3, padTopY - 12, 6, 12);
    ctx.fillRect(padRightX - 3, padTopY - 12, 6, 12);

    // Trajectory trail
    if (simState.trail.length > 1) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < simState.trail.length; i += 1) {
        const pt = simState.trail[i];
        const px = toSX(pt.x);
        const py = toSY(pt.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Draw Rocket at (simState.x, simState.y), rotated by -simState.theta in screen coords
    // Wait: screen Y points DOWN, world +theta is CCW from +Y -> top tilts LEFT -> canvas rotate(-theta)!
    const rx = toSX(simState.x);
    const ry = toSY(simState.y);
    const legPx = simState.params.legOffset * scale;
    const footPx = simState.params.footHalfSpan * scale;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(-simState.theta);

    // Exhaust flame proportional to thrust
    if (simState.status === "flying" && simState.currentThrust > 1) {
      const ratio = simState.currentThrust / simState.params.maxThrust;
      const flameLen = (14 + ratio * 28) * (0.85 + Math.random() * 0.3);
      const flameGrad = ctx.createLinearGradient(0, legPx * 0.45, 0, legPx * 0.45 + flameLen);
      flameGrad.addColorStop(0, "#fef08a");
      flameGrad.addColorStop(0.5, "#f97316");
      flameGrad.addColorStop(1, "rgba(239,68,68,0)");
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-footPx * 0.35, legPx * 0.45);
      ctx.lineTo(footPx * 0.35, legPx * 0.45);
      ctx.lineTo(0, legPx * 0.45 + flameLen);
      ctx.closePath();
      ctx.fill();
    }

    // RCS side plumes
    if (simState.status === "flying" && Math.abs(simState.torqueInput) > 0.05) {
      ctx.fillStyle = "#7dd3fc";
      const side = simState.torqueInput > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(side * footPx * 0.55, -legPx * 0.55);
      ctx.lineTo(side * (footPx * 0.55 + 14), -legPx * 0.65);
      ctx.lineTo(side * (footPx * 0.55 + 14), -legPx * 0.45);
      ctx.closePath();
      ctx.fill();
    }

    // Landing legs
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-footPx * 0.4, legPx * 0.3);
    ctx.lineTo(-footPx, legPx);
    ctx.moveTo(footPx * 0.4, legPx * 0.3);
    ctx.lineTo(footPx, legPx);
    ctx.stroke();

    // Foot pads
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-footPx - 5, legPx);
    ctx.lineTo(-footPx + 5, legPx);
    ctx.moveTo(footPx - 5, legPx);
    ctx.lineTo(footPx + 5, legPx);
    ctx.stroke();

    // Main Capsule Body
    const bodyW = Math.max(16, footPx * 0.9);
    const bodyH = Math.max(24, legPx * 1.15);
    ctx.fillStyle = simState.status === "crashed" ? "#ef4444" : "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(0, -bodyH * 0.72);
    ctx.quadraticCurveTo(bodyW * 0.65, -bodyH * 0.2, bodyW * 0.52, bodyH * 0.35);
    ctx.lineTo(-bodyW * 0.52, bodyH * 0.35);
    ctx.quadraticCurveTo(-bodyW * 0.65, -bodyH * 0.2, 0, -bodyH * 0.72);
    ctx.closePath();
    ctx.fill();

    // Window
    ctx.fillStyle = "#0ea5e9";
    ctx.beginPath();
    ctx.arc(0, -bodyH * 0.12, bodyW * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Force vectors at rocket center (Gravity down amber, Thrust green along thrust vector)
    const weight = (simState.params.dryMass + simState.fuelMass) * simState.params.gravity;
    const vecScale = 0.025;
    drawArrow(rx - 18, ry, rx - 18, ry + weight * vecScale, "#f59e0b", "mg");
    if (simState.currentThrust > 1) {
      const tx = -Math.sin(simState.theta) * simState.currentThrust * vecScale;
      const ty = -Math.cos(simState.theta) * simState.currentThrust * vecScale;
      drawArrow(rx, ry, rx + tx, ry + ty, "#4ade80", "T");
    }
  }

  function drawArrow(x1, y1, x2, y2, color, label) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 8 * Math.cos(ang - 0.45), y2 - 8 * Math.sin(ang - 0.45));
    ctx.lineTo(x2 - 8 * Math.cos(ang + 0.45), y2 - 8 * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fill();
    ctx.font = "bold 11px Segoe UI, sans-serif";
    ctx.fillText(label, x2 + 5, y2 + 3);
    ctx.restore();
  }

  function resetSimulation() {
    paused = false;
    ui.btnPause.textContent = "Jeda";
    simState = createFreshState();
    updateHUD();
    drawScene();
  }

  function switchMode(mode) {
    activeMode = mode === "simulation" ? "simulation" : "game";
    const isSim = activeMode === "simulation";
    ui.modeGameBtn.classList.toggle("active", !isSim);
    ui.modeSimBtn.classList.toggle("active", isSim);
    ui.modeGameBtn.setAttribute("aria-selected", String(!isSim));
    ui.modeSimBtn.setAttribute("aria-selected", String(isSim));
    ui.panelGame.classList.toggle("active", !isSim);
    ui.panelSim.classList.toggle("active", isSim);
    ui.missionDesc.textContent = isSim
      ? "Atur gravitasi, dorongan maksimum, dan bahan bakar. Tekan Reset lalu uji keseimbangan T = m·g!"
      : "Daratkan kedua kaki roket di landasan dengan |vy| ≤ 2,0 m/s, |vx| ≤ 1,0 m/s, dan kemiringan ≤ 5°.";
    resetSimulation();
  }

  function bindHoldButton(btn, key) {
    const start = (e) => {
      e.preventDefault();
      held[key] = true;
    };
    const end = () => {
      held[key] = false;
    };
    btn.addEventListener("pointerdown", start);
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointercancel", end);
    btn.addEventListener("pointerleave", end);
  }

  bindHoldButton(ui.btnThrustHold, "thrust");
  bindHoldButton(ui.btnRotLeft, "left");
  bindHoldButton(ui.btnRotRight, "right");

  ui.modeGameBtn.addEventListener("click", () => switchMode("game"));
  ui.modeSimBtn.addEventListener("click", () => switchMode("simulation"));

  ui.gameThrottle.addEventListener("input", syncLabels);
  ui.simThrottle.addEventListener("input", syncLabels);

  for (const el of [ui.simGravity, ui.simThrust, ui.simFuel]) {
    el.addEventListener("input", () => {
      syncLabels();
      pendingSimParams = readSimInputs();
      ui.simPendingNote.hidden = false;
    });
  }

  ui.btnReset.addEventListener("click", resetSimulation);
  ui.btnPause.addEventListener("click", () => {
    paused = !paused;
    ui.btnPause.textContent = paused ? "Lanjut" : "Jeda";
    updateHUD();
  });
  ui.btnHoverPreset.addEventListener("click", () => {
    const tel = K.getRocketTelemetry(simState);
    const pct = Math.round(tel.hoverThrottle * 100);
    if (activeMode === "simulation") {
      ui.simThrottle.value = String(pct);
    } else {
      ui.gameThrottle.value = String(pct);
    }
    syncLabels();
  });

  function onKeyDown(e) {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      return;
    }
    if (e.code === "KeyW" || e.code === "ArrowUp" || e.code === "Space") {
      e.preventDefault();
      held.thrust = true;
    } else if (e.code === "KeyA" || e.code === "ArrowLeft") {
      held.left = true;
    } else if (e.code === "KeyD" || e.code === "ArrowRight") {
      held.right = true;
    } else if (e.code === "KeyR" && !e.repeat) {
      resetSimulation();
    }
  }
  function onKeyUp(e) {
    if (e.code === "KeyW" || e.code === "ArrowUp" || e.code === "Space") {
      held.thrust = false;
    } else if (e.code === "KeyA" || e.code === "ArrowLeft") {
      held.left = false;
    } else if (e.code === "KeyD" || e.code === "ArrowRight") {
      held.right = false;
    }
  }
  function onBlur() {
    held.thrust = false;
    held.left = false;
    held.right = false;
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  window.addEventListener("resize", resizeCanvas);

  let accumulator = 0;
  let lastTs = performance.now();
  let rafId = 0;

  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    const frameDt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
    lastTs = ts;

    if (!paused && simState.status === "flying") {
      const sliderVal =
        activeMode === "simulation"
          ? parseFloat(ui.simThrottle.value) / 100
          : parseFloat(ui.gameThrottle.value) / 100;
      const throttle = held.thrust ? 1.0 : sliderVal;
      const torqueCommand = (held.left ? 1 : 0) + (held.right ? -1 : 0);

      accumulator += frameDt;
      while (accumulator >= K.ROCKET_DT && simState.status === "flying") {
        K.stepRocket(simState, { throttle, torqueCommand }, K.ROCKET_DT);
        accumulator -= K.ROCKET_DT;
      }

      const lastTrail = simState.trail[simState.trail.length - 1];
      if (!lastTrail || Math.hypot(simState.x - lastTrail.x, simState.y - lastTrail.y) >= 0.4) {
        simState.trail.push({ x: simState.x, y: simState.y });
      }
      updateHUD();
    } else {
      accumulator = 0;
    }

    drawScene();
  }

  function cleanup() {
    cancelAnimationFrame(rafId);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("resize", resizeCanvas);
  }
  window.addEventListener("beforeunload", cleanup);
  window.addEventListener("pagehide", cleanup);

  syncLabels();
  resizeCanvas();
  updateHUD();
  drawScene();
  document.body.dataset.ready = "true";
  rafId = requestAnimationFrame(loop);
})();
