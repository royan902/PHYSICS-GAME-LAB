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
  scene.background = new THREE.Color(0x0b1528);
  scene.fog = new THREE.FogExp2(0x0b1528, 0.005);

  const camera = new THREE.PerspectiveCamera(
    48,
    (wrap.clientWidth || window.innerWidth) / (wrap.clientHeight || window.innerHeight),
    0.1,
    400,
  );

  const camState = {
    yaw: -1.25,
    pitch: 0.34,
    distance: 44,
    target: new THREE.Vector3(16, 3, 0),
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

  scene.add(new THREE.AmbientLight(0xe2e8f0, 0.68));
  const sun = new THREE.DirectionalLight(0xfff7ed, 1.05);
  sun.position.set(20, 40, 25);
  sun.castShadow = true;
  scene.add(sun);

  // Ground plane
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(360, 140),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.92 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(140, 0, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(320, 64, 0x38bdf8, 0x334155);
  grid.position.set(140, 0.02, 0);
  scene.add(grid);

  // Cannon carriage & orientable barrel matching kernel direction vector
  const cannonMount = new THREE.Group();
  const baseWheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.55, 0.6, 20),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 }),
  );
  baseWheel.position.y = 0.3;
  cannonMount.add(baseWheel);

  const barrelPivot = new THREE.Group();
  barrelPivot.position.set(0, 0.6, 0);
  const barrelMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.16, 1.2, 18),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.25 }),
  );
  // Shift cylinder along +Y in pivot frame, then align pivot Y-axis onto dir
  barrelMesh.position.y = 0.6;
  barrelPivot.add(barrelMesh);
  cannonMount.add(barrelPivot);
  scene.add(cannonMount);

  // Projectile sphere (scaled slightly visually at 0.22 m for clear visibility at 40 m view)
  const ballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0x7c2d12, roughness: 0.3 }),
  );
  ballMesh.castShadow = true;
  scene.add(ballMesh);

  // Target sphere + stand
  const targetGroup = new THREE.Group();
  const targetSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }),
  );
  const targetRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.07, 10, 32),
    new THREE.MeshBasicMaterial({ color: 0xfef08a }),
  );
  targetGroup.add(targetSphere);
  targetGroup.add(targetRing);
  scene.add(targetGroup);

  // Active trail & ghost comparison trail
  const maxPts = 1200;
  function createTrailLine(colorHex) {
    const buf = new Float32Array(maxPts * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(buf, 3));
    geo.setDrawRange(0, 0);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: colorHex }));
    scene.add(line);
    return { buf, geo, line };
  }
  const activeTrail = createTrailLine(0xfacc15);
  const ghostTrail = createTrailLine(0x38bdf8);

  const ui = {
    modeGameBtn: document.getElementById("mode-game-btn"),
    modeSimBtn: document.getElementById("mode-sim-btn"),
    panelGame: document.getElementById("panel-game-controls"),
    panelSim: document.getElementById("panel-sim-controls"),
    missionDesc: document.getElementById("mission-desc"),
    statusBanner: document.getElementById("status-banner"),
    statusText: document.getElementById("status-text"),
    telemScore: document.getElementById("telem-score"),
    valRange: document.getElementById("val-range"),
    valAlt: document.getElementById("val-alt"),
    valMaxh: document.getElementById("val-maxh"),
    valTime: document.getElementById("val-time"),
    valSpeed: document.getElementById("val-speed"),
    valPred: document.getElementById("val-pred"),
    gameV0: document.getElementById("game-v0"),
    gameElev: document.getElementById("game-elev"),
    gameAzim: document.getElementById("game-azim"),
    lblGameV0: document.getElementById("lbl-game-v0"),
    lblGameElev: document.getElementById("lbl-game-elev"),
    lblGameAzim: document.getElementById("lbl-game-azim"),
    simV0: document.getElementById("sim-v0"),
    simElev: document.getElementById("sim-elev"),
    simG: document.getElementById("sim-g"),
    simMass: document.getElementById("sim-mass"),
    simDrag: document.getElementById("sim-drag"),
    lblSimV0: document.getElementById("lbl-sim-v0"),
    lblSimElev: document.getElementById("lbl-sim-elev"),
    lblSimG: document.getElementById("lbl-sim-g"),
    lblSimMass: document.getElementById("lbl-sim-mass"),
    simPendingNote: document.getElementById("sim-pending-note"),
    btnFire: document.getElementById("btn-fire"),
    btnReset: document.getElementById("btn-reset"),
    btnNewTarget: document.getElementById("btn-newtarget"),
    btnCamReset: document.getElementById("btn-cam-reset"),
  };

  let activeMode = "game";
  let targetPos = { x: 32, y: 0.9, z: 0, radius: 0.9 };
  let pendingSimParams = null;

  function readSimInputs() {
    return {
      v0: parseFloat(ui.simV0.value),
      elevationDeg: parseFloat(ui.simElev.value),
      gravity: parseFloat(ui.simG.value),
      mass: parseFloat(ui.simMass.value),
      dragEnabled: ui.simDrag.checked,
      azimuthDeg: 0,
    };
  }

  function readGameInputs() {
    return {
      v0: parseFloat(ui.gameV0.value),
      elevationDeg: parseFloat(ui.gameElev.value),
      azimuthDeg: parseFloat(ui.gameAzim.value),
    };
  }

  let simState = createFreshState();

  function createFreshState() {
    if (activeMode === "simulation") {
      const cfg = pendingSimParams || readSimInputs();
      pendingSimParams = null;
      ui.simPendingNote.hidden = true;
      return K.createCannonState({
        mode: "simulation",
        ...cfg,
        target: targetPos,
      });
    }
    const gCfg = readGameInputs();
    return K.createCannonState({
      mode: "game",
      ...gCfg,
      target: targetPos,
    });
  }

  function syncLabels() {
    ui.lblGameV0.textContent = `${parseFloat(ui.gameV0.value).toFixed(1)} m/s`;
    ui.lblGameElev.textContent = `${ui.gameElev.value}°`;
    ui.lblGameAzim.textContent = `${ui.gameAzim.value}°`;
    ui.lblSimV0.textContent = `${parseFloat(ui.simV0.value).toFixed(1)} m/s`;
    ui.lblSimElev.textContent = `${ui.simElev.value}°`;
    ui.lblSimG.textContent = `${parseFloat(ui.simG.value).toFixed(2)} m/s²`;
    ui.lblSimMass.textContent = `${parseFloat(ui.simMass.value).toFixed(1)} kg`;
  }

  function updateBarrelOrientation() {
    const dir = K.computeDirectionVector(
      simState.params.elevationDeg,
      simState.params.azimuthDeg,
    );
    const up = new THREE.Vector3(0, 1, 0);
    barrelPivot.quaternion.setFromUnitVectors(up, new THREE.Vector3(dir.x, dir.y, dir.z));
  }

  function syncTrailBuffer(trailObj, points) {
    const count = Math.min(points.length, maxPts);
    for (let i = 0; i < count; i += 1) {
      trailObj.buf[i * 3] = points[i].x;
      trailObj.buf[i * 3 + 1] = points[i].y;
      trailObj.buf[i * 3 + 2] = points[i].z;
    }
    trailObj.geo.attributes.position.needsUpdate = true;
    trailObj.geo.setDrawRange(0, count);
  }

  function updateVisuals() {
    updateBarrelOrientation();
    ballMesh.position.set(simState.x, simState.y, simState.z);
    targetGroup.position.set(simState.target.x, simState.target.y, simState.target.z);
    targetGroup.visible = activeMode === "game";

    syncTrailBuffer(activeTrail, simState.trail);
    syncTrailBuffer(ghostTrail, simState.lastTrail);

    const tel = K.getCannonTelemetry(simState);
    ui.telemScore.textContent = `Kena: ${tel.hits} / ${tel.shotsFired}`;
    ui.valRange.textContent = `${tel.horizontalRange.toFixed(2)} m`;
    ui.valAlt.textContent = `${tel.altitude.toFixed(2)} m`;
    ui.valMaxh.textContent = `${tel.maxHeight.toFixed(2)} m`;
    ui.valTime.textContent = `${tel.flightTime.toFixed(2)} s`;
    ui.valSpeed.textContent = `${tel.speed.toFixed(2)} m/s`;
    ui.valPred.textContent = `${tel.levelTheoreticalRange.toFixed(2)} m`;

    ui.statusBanner.classList.remove("good", "danger");
    if (simState.status === "hit") {
      ui.statusBanner.classList.add("good");
      ui.statusText.textContent = `Tepat Sasaran! Jarak ${simState.impactEvent.range.toFixed(2)} m dalam ${simState.impactEvent.time.toFixed(2)} s`;
    } else if (simState.status === "landed") {
      ui.statusText.textContent = `Mendarat di x = ${simState.x.toFixed(2)} m (jangkauan ${simState.impactEvent.range.toFixed(2)} m)`;
    } else if (simState.status === "flying") {
      ui.statusText.textContent = "Proyektil melaju sepanjang lintasan parabola…";
    } else {
      ui.statusText.textContent =
        activeMode === "game"
          ? `Siap menembak · Target pada x = ${simState.target.x.toFixed(1)} m, z = ${simState.target.z.toFixed(1)} m`
          : "Mode Simulasi: bandingkan jejak biru (sebelumnya) & kuning (saat ini)";
    }
  }

  function resetSimulation() {
    const prevLast = simState ? simState.lastTrail : [];
    const prevHits = simState ? simState.hits : 0;
    const prevShots = simState ? simState.shotsFired : 0;
    simState = createFreshState();
    simState.lastTrail = prevLast;
    simState.hits = prevHits;
    simState.shotsFired = prevShots;
    updateVisuals();
  }

  function fireNow() {
    if (simState.status === "flying") return;
    if (activeMode === "simulation" && pendingSimParams) {
      resetSimulation();
    } else if (activeMode === "game") {
      Object.assign(simState.params, K.clampCannonParams(readGameInputs()));
    } else {
      Object.assign(simState.params, K.clampCannonParams(readSimInputs()));
    }
    K.fireCannon(simState);
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
    ui.btnNewTarget.hidden = isSim;
    ui.missionDesc.textContent = isSim
      ? "Uji pengaruh elevasi, v₀, gravitasi, massa, dan hambatan udara terhadap lintasan."
      : "Atur elevasi θ, azimuth φ, dan kecepatan awal v₀ untuk mengenai target merah di lapangan!";
    resetSimulation();
  }

  function resetCamera() {
    camState.yaw = -1.25;
    camState.pitch = 0.34;
    camState.distance = 44;
    camState.target.set(16, 3, 0);
    updateCameraTransform();
  }

  ui.modeGameBtn.addEventListener("click", () => switchMode("game"));
  ui.modeSimBtn.addEventListener("click", () => switchMode("simulation"));

  for (const el of [ui.gameV0, ui.gameElev, ui.gameAzim]) {
    el.addEventListener("input", () => {
      syncLabels();
      if (simState.status !== "flying") {
        Object.assign(simState.params, K.clampCannonParams(readGameInputs()));
        const muzzle = K.computeMuzzleOrigin(simState.params);
        if (simState.status === "ready") {
          simState.x = muzzle.x;
          simState.y = muzzle.y;
          simState.z = muzzle.z;
        }
        updateVisuals();
      }
    });
  }

  for (const el of [ui.simV0, ui.simElev, ui.simG, ui.simMass, ui.simDrag]) {
    el.addEventListener("input", () => {
      syncLabels();
      pendingSimParams = readSimInputs();
      ui.simPendingNote.hidden = false;
    });
  }

  ui.btnFire.addEventListener("click", fireNow);
  ui.btnReset.addEventListener("click", resetSimulation);
  ui.btnNewTarget.addEventListener("click", () => {
    targetPos = {
      x: 18 + Math.round(Math.random() * 260) / 10,
      y: 0.9,
      z: Math.round((Math.random() - 0.5) * 140) / 10,
      radius: 0.9,
    };
    resetSimulation();
  });
  ui.btnCamReset.addEventListener("click", resetCamera);

  function onKeyDown(e) {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      if (e.code !== "Space" && e.code !== "Enter") return;
    }
    if ((e.code === "Space" || e.code === "Enter") && !e.repeat) {
      e.preventDefault();
      fireNow();
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
    camState.pitch = Math.min(1.25, Math.max(0.08, camState.pitch + (e.clientY - camState.lastY) * 0.005));
    camState.lastX = e.clientX;
    camState.lastY = e.clientY;
    updateCameraTransform();
  }
  function onPointerUp() {
    camState.dragging = false;
  }
  function onWheel(e) {
    e.preventDefault();
    camState.distance = Math.min(120, Math.max(8, camState.distance + e.deltaY * 0.02));
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

    if (simState.status === "flying") {
      accumulator += frameDt;
      while (accumulator >= K.CANNON_DT && simState.status === "flying") {
        K.stepCannon(simState, K.CANNON_DT);
        accumulator -= K.CANNON_DT;
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
