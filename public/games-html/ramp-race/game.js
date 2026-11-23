(function () {
  "use strict";

  const errorScreen = document.getElementById("runtime-error");
  if (typeof THREE === "undefined" || !window.MotionKernel) {
    if (errorScreen) errorScreen.hidden = false;
    return;
  }

  if (window.self !== window.top) {
    const backLink = document.querySelector(".game-tools .back-link");
    if (backLink) backLink.hidden = true;
  }

  const K = window.MotionKernel;
  const wrap = document.getElementById("canvas-wrap");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  } catch (err) {
    if (errorScreen) errorScreen.hidden = false;
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(wrap.clientWidth || window.innerWidth, wrap.clientHeight || window.innerHeight);
  renderer.shadowMap.enabled = true;
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x091324);
  scene.fog = new THREE.FogExp2(0x091324, 0.045);

  const camera = new THREE.PerspectiveCamera(
    46,
    (wrap.clientWidth || window.innerWidth) / (wrap.clientHeight || window.innerHeight),
    0.05,
    100,
  );

  const camState = {
    yaw: 0.95,
    pitch: 0.36,
    distance: 4.5,
    target: new THREE.Vector3(1.4, 0.55, 0),
    dragging: false,
    lastX: 0,
    lastY: 0,
  };

  function updateCameraTransform() {
    const cosP = Math.cos(camState.pitch);
    camera.position.set(
      camState.target.x + camState.distance * cosP * Math.cos(camState.yaw),
      camState.target.y + camState.distance * Math.sin(camState.pitch),
      camState.target.z + camState.distance * cosP * Math.sin(camState.yaw),
    );
    camera.lookAt(camState.target);
  }

  scene.add(new THREE.AmbientLight(0xe2e8f0, 0.72));
  const sun = new THREE.DirectionalLight(0xfffbeb, 1.05);
  sun.position.set(4, 8, 5);
  sun.castShadow = true;
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.92 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  scene.add(new THREE.GridHelper(16, 16, 0x334155, 0x1e293b));

  // Ramp board pivoted around its bottom edge
  const rampGroup = new THREE.Group();
  const boardGeo = new THREE.BoxGeometry(3.0, 0.08, 1.8);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.72 });
  const boardMesh = new THREE.Mesh(boardGeo, boardMat);
  boardMesh.position.set(-1.5, -0.04, 0);
  boardMesh.receiveShadow = true;
  rampGroup.add(boardMesh);

  // Center lane divider strip
  const divider = new THREE.Mesh(
    new THREE.BoxGeometry(3.02, 0.02, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x94a3b8 }),
  );
  divider.position.set(-1.5, 0.005, 0);
  rampGroup.add(divider);

  // Finish strip at bottom of incline (x = 0 in rampGroup coords)
  const finishStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.025, 1.82),
    new THREE.MeshBasicMaterial({ color: 0xfef08a }),
  );
  finishStrip.position.set(-0.03, 0.005, 0);
  rampGroup.add(finishStrip);
  scene.add(rampGroup);

  function createStripedBall(primaryColor, stripeColor) {
    const group = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 28, 28),
      new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.35, metalness: 0.15 }),
    );
    sphere.castShadow = true;
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(1.01, 0.07, 10, 28),
      new THREE.MeshBasicMaterial({ color: stripeColor }),
    );
    group.add(sphere);
    group.add(band);
    scene.add(group);
    return group;
  }

  const meshA = createStripedBall(0x38bdf8, 0xffffff);
  const meshB = createStripedBall(0xf59e0b, 0x1e293b);

  const presets = {
    "mass-radius": {
      desc: "Dua bola pejal berbeda massa & radius dengan μ cukup untuk menggelinding murni — hasil harus SERI!",
      ballA: { mass: 0.6, radius: 0.12, mu: 0.5 },
      ballB: { mass: 3.6, radius: 0.06, mu: 0.5 },
    },
    "roll-vs-slide": {
      desc: "Bola A menggelinding murni (μ=0,50) vs Bola B meluncur tanpa gesekan (μ=0) — energi tidak masuk ke rotasi!",
      ballA: { mass: 1.0, radius: 0.1, mu: 0.5 },
      ballB: { mass: 1.0, radius: 0.1, mu: 0.0 },
    },
    "slip-threshold": {
      desc: "Bandingkan bola menggelinding penuh (μ=0,50) vs bola tergelincir sebagian (μ=0,04).",
      ballA: { mass: 1.0, radius: 0.1, mu: 0.5 },
      ballB: { mass: 1.0, radius: 0.1, mu: 0.04 },
    },
  };

  let activePresetKey = "mass-radius";
  let activeMode = "game";
  let pendingSimParams = null;

  const ui = {
    modeGameBtn: document.getElementById("mode-game-btn"),
    modeSimBtn: document.getElementById("mode-sim-btn"),
    panelGame: document.getElementById("panel-game-controls"),
    panelSim: document.getElementById("panel-sim-controls"),
    missionDesc: document.getElementById("mission-desc"),
    statusBanner: document.getElementById("status-banner"),
    statusText: document.getElementById("status-text"),
    telemTime: document.getElementById("telem-time"),
    valAVel: document.getElementById("val-a-vel"),
    valBVel: document.getElementById("val-b-vel"),
    valAEk: document.getElementById("val-a-ek"),
    valBEk: document.getElementById("val-b-ek"),
    valAFin: document.getElementById("val-a-fin"),
    valBFin: document.getElementById("val-b-fin"),
    gameSlope: document.getElementById("game-slope"),
    lblGameSlope: document.getElementById("lbl-game-slope"),
    simSlope: document.getElementById("sim-slope"),
    simMa: document.getElementById("sim-ma"),
    simMb: document.getElementById("sim-mb"),
    simRa: document.getElementById("sim-ra"),
    simRb: document.getElementById("sim-rb"),
    simMua: document.getElementById("sim-mua"),
    simMub: document.getElementById("sim-mub"),
    lblSimSlope: document.getElementById("lbl-sim-slope"),
    lblSimMa: document.getElementById("lbl-sim-ma"),
    lblSimMb: document.getElementById("lbl-sim-mb"),
    lblSimRa: document.getElementById("lbl-sim-ra"),
    lblSimRb: document.getElementById("lbl-sim-rb"),
    lblSimMua: document.getElementById("lbl-sim-mua"),
    lblSimMub: document.getElementById("lbl-sim-mub"),
    simPendingNote: document.getElementById("sim-pending-note"),
    btnLaunch: document.getElementById("btn-launch"),
    btnReset: document.getElementById("btn-reset"),
    btnCamReset: document.getElementById("btn-cam-reset"),
    presetBtns: Array.from(document.querySelectorAll("[data-preset]")),
  };

  function readSimInputs() {
    return {
      ramp: { slopeDeg: parseFloat(ui.simSlope.value), length: 3.0 },
      ballA: {
        mass: parseFloat(ui.simMa.value),
        radius: parseFloat(ui.simRa.value),
        mu: parseFloat(ui.simMua.value),
      },
      ballB: {
        mass: parseFloat(ui.simMb.value),
        radius: parseFloat(ui.simRb.value),
        mu: parseFloat(ui.simMub.value),
      },
    };
  }

  let simState = createFreshState();

  function createFreshState() {
    if (activeMode === "simulation") {
      const cfg = pendingSimParams || readSimInputs();
      pendingSimParams = null;
      ui.simPendingNote.hidden = true;
      return K.createRampRaceState({ mode: "simulation", ...cfg });
    }
    const preset = presets[activePresetKey];
    return K.createRampRaceState({
      mode: "game",
      ramp: { slopeDeg: parseFloat(ui.gameSlope.value), length: 3.0 },
      ballA: preset.ballA,
      ballB: preset.ballB,
    });
  }

  function syncLabels() {
    ui.lblGameSlope.textContent = `${ui.gameSlope.value}°`;
    ui.lblSimSlope.textContent = `${ui.simSlope.value}°`;
    ui.lblSimMa.textContent = `${parseFloat(ui.simMa.value).toFixed(1)} kg`;
    ui.lblSimMb.textContent = `${parseFloat(ui.simMb.value).toFixed(1)} kg`;
    ui.lblSimRa.textContent = `${parseFloat(ui.simRa.value).toFixed(2)} m`;
    ui.lblSimRb.textContent = `${parseFloat(ui.simRb.value).toFixed(2)} m`;
    ui.lblSimMua.textContent = `${parseFloat(ui.simMua.value).toFixed(2)}`;
    ui.lblSimMub.textContent = `${parseFloat(ui.simMub.value).toFixed(2)}`;
  }

  const regimeText = {
    ready: "siap",
    rolling: "gulir",
    sliding: "licin",
    slipping: "selip",
  };

  function updateVisuals() {
    const slopeRad = simState.slopeRad;
    rampGroup.position.set(simState.ramp.length * Math.cos(slopeRad), 0, 0);
    rampGroup.rotation.z = -slopeRad;

    const posA = K.getBallWorldPosition(simState.ballA, simState.ramp, slopeRad);
    const posB = K.getBallWorldPosition(simState.ballB, simState.ramp, slopeRad);
    meshA.position.set(posA.x, posA.y, posA.z);
    meshA.scale.setScalar(simState.ballA.params.radius);
    meshA.rotation.z = -simState.ballA.spinAngle;

    meshB.position.set(posB.x, posB.y, posB.z);
    meshB.scale.setScalar(simState.ballB.params.radius);
    meshB.rotation.z = -simState.ballB.spinAngle;

    const tel = K.getRampRaceTelemetry(simState);
    ui.telemTime.textContent = `t = ${tel.time.toFixed(2)} s`;
    ui.valAVel.textContent = `${tel.ballA.v.toFixed(2)} / ${tel.ballA.rOmega.toFixed(2)}`;
    ui.valBVel.textContent = `${tel.ballB.v.toFixed(2)} / ${tel.ballB.rOmega.toFixed(2)}`;
    ui.valAEk.textContent = `${tel.ballA.translationalKE.toFixed(2)} / ${tel.ballA.rotationalKE.toFixed(2)} J`;
    ui.valBEk.textContent = `${tel.ballB.translationalKE.toFixed(2)} / ${tel.ballB.rotationalKE.toFixed(2)} J`;
    ui.valAFin.textContent = tel.ballA.finished
      ? `${tel.ballA.finishTime.toFixed(3)} s`
      : regimeText[tel.ballA.regime] || tel.ballA.regime;
    ui.valBFin.textContent = tel.ballB.finished
      ? `${tel.ballB.finishTime.toFixed(3)} s`
      : regimeText[tel.ballB.regime] || tel.ballB.regime;

    ui.statusBanner.classList.remove("good", "danger");
    if (simState.status === "finished") {
      ui.statusBanner.classList.add("good");
      if (simState.winner === "tie") {
        ui.statusText.textContent = `Hasil SERI! Kedua bola finis bersamaan (${tel.ballA.finishTime.toFixed(3)} s)`;
      } else {
        const winTime =
          simState.winner === "A" ? tel.ballA.finishTime : tel.ballB.finishTime;
        ui.statusText.textContent = `Pemenang: Bola ${simState.winner} (${winTime.toFixed(3)} s) · μ_kritis = ${tel.criticalMu.toFixed(3)}`;
      }
    } else if (simState.status === "racing") {
      ui.statusText.textContent = "Bola menuruni bidang miring…";
    } else {
      ui.statusText.textContent = `Siap dilepas serentak · θ = ${simState.ramp.slopeDeg}° (μ_kritis = ${tel.criticalMu.toFixed(3)})`;
    }
  }

  function resetSimulation() {
    simState = createFreshState();
    updateVisuals();
  }

  function launchNow() {
    if (simState.status === "racing") return;
    if (simState.status === "finished") {
      resetSimulation();
    } else if (activeMode === "simulation" && pendingSimParams) {
      resetSimulation();
    }
    K.startRampRace(simState);
    updateVisuals();
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
      ? "Ubah massa, radius, kemiringan, dan koefisien gesek tiap bola. Tekan Reset sebelum melepas!"
      : presets[activePresetKey].desc;
    resetSimulation();
  }

  function resetCamera() {
    camState.yaw = 0.95;
    camState.pitch = 0.36;
    camState.distance = 4.5;
    camState.target.set(1.4, 0.55, 0);
    updateCameraTransform();
  }

  ui.modeGameBtn.addEventListener("click", () => switchMode("game"));
  ui.modeSimBtn.addEventListener("click", () => switchMode("simulation"));

  for (const btn of ui.presetBtns) {
    btn.addEventListener("click", () => {
      activePresetKey = btn.dataset.preset;
      for (const b of ui.presetBtns) {
        b.classList.toggle("active-toggle", b === btn);
      }
      ui.missionDesc.textContent = presets[activePresetKey].desc;
      resetSimulation();
    });
  }

  ui.gameSlope.addEventListener("input", () => {
    syncLabels();
    resetSimulation();
  });

  for (const el of [
    ui.simSlope,
    ui.simMa,
    ui.simMb,
    ui.simRa,
    ui.simRb,
    ui.simMua,
    ui.simMub,
  ]) {
    el.addEventListener("input", () => {
      syncLabels();
      pendingSimParams = readSimInputs();
      ui.simPendingNote.hidden = false;
    });
  }

  ui.btnLaunch.addEventListener("click", launchNow);
  ui.btnReset.addEventListener("click", resetSimulation);
  ui.btnCamReset.addEventListener("click", resetCamera);

  function onKeyDown(e) {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      if (e.code !== "Space" && e.code !== "Enter") return;
    }
    if ((e.code === "Space" || e.code === "Enter") && !e.repeat) {
      e.preventDefault();
      launchNow();
    } else if (e.code === "KeyR" && !e.repeat) {
      resetSimulation();
    }
  }
  function onPointerDown(e) {
    camState.dragging = true;
    camState.lastX = e.clientX;
    camState.lastY = e.clientY;
  }
  function onPointerMove(e) {
    if (!camState.dragging) return;
    camState.yaw -= (e.clientX - camState.lastX) * 0.006;
    camState.pitch = Math.min(1.25, Math.max(0.1, camState.pitch + (e.clientY - camState.lastY) * 0.005));
    camState.lastX = e.clientX;
    camState.lastY = e.clientY;
    updateCameraTransform();
  }
  function onPointerUp() {
    camState.dragging = false;
  }
  function onWheel(e) {
    e.preventDefault();
    camState.distance = Math.min(14, Math.max(1.8, camState.distance + e.deltaY * 0.004));
    updateCameraTransform();
  }
  function onResize() {
    const w = wrap.clientWidth || window.innerWidth;
    const h = wrap.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

  let accumulator = 0;
  let lastTs = performance.now();
  let rafId = 0;

  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    const frameDt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
    lastTs = ts;

    if (simState.status === "racing") {
      accumulator += frameDt;
      while (accumulator >= K.RAMP_DT && simState.status === "racing") {
        K.stepRampRace(simState, K.RAMP_DT);
        accumulator -= K.RAMP_DT;
      }
      updateVisuals();
    } else {
      accumulator = 0;
    }

    renderer.render(scene, camera);
  }

  function cleanup() {
    cancelAnimationFrame(rafId);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    renderer.domElement.removeEventListener("pointerdown", onPointerDown);
    renderer.domElement.removeEventListener("wheel", onWheel);
    renderer.dispose();
  }
  window.addEventListener("beforeunload", cleanup);
  window.addEventListener("pagehide", cleanup);

  syncLabels();
  resetCamera();
  updateVisuals();
  document.body.dataset.ready = "true";
  rafId = requestAnimationFrame(loop);
})();
