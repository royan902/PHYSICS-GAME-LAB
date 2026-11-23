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
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x091926);
  scene.fog = new THREE.FogExp2(0x091926, 0.018);

  const camera = new THREE.PerspectiveCamera(
    46,
    (wrap.clientWidth || window.innerWidth) / (wrap.clientHeight || window.innerHeight),
    0.05,
    180,
  );

  // Orbit camera state
  const camState = {
    yaw: -0.35,
    pitch: 0.42,
    distance: 4.8,
    target: new THREE.Vector3(2.0, 0.1, 0),
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

  // Lighting
  scene.add(new THREE.AmbientLight(0xdbeafe, 0.72));
  const sun = new THREE.DirectionalLight(0xfffbeb, 1.05);
  sun.position.set(6, 12, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 45;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  scene.add(sun);

  // Green Turf + Distance Grid Markers (up to 45 m for low-mu simulation sweeps)
  const turfGeo = new THREE.PlaneGeometry(90, 14);
  const turfMat = new THREE.MeshStandardMaterial({
    color: 0x166534,
    roughness: 0.88,
    metalness: 0.05,
  });
  const turf = new THREE.Mesh(turfGeo, turfMat);
  turf.rotation.x = -Math.PI / 2;
  turf.position.set(36, 0, 0);
  turf.receiveShadow = true;
  scene.add(turf);

  const gridHelper = new THREE.GridHelper(90, 90, 0x4ade80, 0x14532d);
  gridHelper.position.set(36, 0.002, 0);
  scene.add(gridHelper);

  // Start tee marker
  const teeMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.035, 0.055, 24),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide }),
  );
  teeMesh.rotation.x = -Math.PI / 2;
  teeMesh.position.set(0, 0.004, 0);
  scene.add(teeMesh);

  // Hole group
  const holeGroup = new THREE.Group();
  const cupMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.054, 0.054, 0.012, 32),
    new THREE.MeshStandardMaterial({ color: 0x05080f, roughness: 1 }),
  );
  cupMesh.position.y = 0.003;
  holeGroup.add(cupMesh);

  const rimMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.052, 0.068, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
  );
  rimMesh.rotation.x = -Math.PI / 2;
  rimMesh.position.y = 0.006;
  holeGroup.add(rimMesh);

  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4 }),
  );
  flagPole.position.set(0, 0.45, 0);
  holeGroup.add(flagPole);

  const flagCloth = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, 0.24, 3),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }),
  );
  flagCloth.rotation.z = -Math.PI / 2;
  flagCloth.position.set(0.12, 0.8, 0);
  holeGroup.add(flagCloth);
  scene.add(holeGroup);

  // Striped Golf Ball so rolling spin is immediately visible
  const ballGroup = new THREE.Group();
  const ballGeo = new THREE.SphereGeometry(0.02135, 24, 24);
  const ballMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const ballMesh = new THREE.Mesh(ballGeo, ballMat);
  ballMesh.castShadow = true;
  ballGroup.add(ballMesh);

  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(0.0215, 0.0025, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }),
  );
  ballGroup.add(stripe);
  scene.add(ballGroup);

  // Aim Arrow
  const aimArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0.025, 0),
    0.9,
    0xfacc15,
    0.16,
    0.09,
  );
  scene.add(aimArrow);

  // Path Trail Line
  const maxTrailPts = 600;
  const trailPos = new Float32Array(maxTrailPts * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setDrawRange(0, 0);
  const trailLine = new THREE.Line(
    trailGeo,
    new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
  );
  scene.add(trailLine);

  // State & UI Refs
  let activeMode = "game";
  let holePos = { x: 4.0, z: 0.0 };
  let pendingSimParams = null;

  const ui = {
    modeGameBtn: document.getElementById("mode-game-btn"),
    modeSimBtn: document.getElementById("mode-sim-btn"),
    panelGame: document.getElementById("panel-game-controls"),
    panelSim: document.getElementById("panel-sim-controls"),
    missionDesc: document.getElementById("mission-desc"),
    statusBanner: document.getElementById("status-banner"),
    statusText: document.getElementById("status-text"),
    telemStrokes: document.getElementById("telem-strokes"),
    valSpeed: document.getElementById("val-speed"),
    valDist: document.getElementById("val-dist"),
    valHole: document.getElementById("val-hole"),
    valKe: document.getElementById("val-ke"),
    valDrag: document.getElementById("val-drag"),
    valPred: document.getElementById("val-pred"),
    inSpeed: document.getElementById("input-speed"),
    inAngle: document.getElementById("input-angle"),
    lblSpeed: document.getElementById("lbl-speed"),
    lblAngle: document.getElementById("lbl-angle"),
    simMass: document.getElementById("sim-mass"),
    simMu: document.getElementById("sim-mu"),
    simSpeed: document.getElementById("sim-speed"),
    simAngle: document.getElementById("sim-angle"),
    lblSimMass: document.getElementById("lbl-sim-mass"),
    lblSimMu: document.getElementById("lbl-sim-mu"),
    lblSimSpeed: document.getElementById("lbl-sim-speed"),
    lblSimAngle: document.getElementById("lbl-sim-angle"),
    simPendingNote: document.getElementById("sim-pending-note"),
    btnStrike: document.getElementById("btn-strike"),
    btnReset: document.getElementById("btn-reset"),
    btnNewHole: document.getElementById("btn-newhole"),
    btnCamReset: document.getElementById("btn-cam-reset"),
  };

  function readSimInputs() {
    return {
      mass: parseFloat(ui.simMass.value),
      muR: parseFloat(ui.simMu.value),
      speed: parseFloat(ui.simSpeed.value),
      angleDeg: parseFloat(ui.simAngle.value),
    };
  }

  let simState = createFreshState();

  function createFreshState() {
    if (activeMode === "simulation") {
      const cfg = pendingSimParams || readSimInputs();
      pendingSimParams = null;
      ui.simPendingNote.hidden = true;
      return K.createGolfState({
        mode: "simulation",
        mass: cfg.mass,
        muR: cfg.muR,
        holePosition: holePos,
      });
    }
    return K.createGolfState({
      mode: "game",
      holePosition: holePos,
      bounds: { minX: -1.5, maxX: 9.5, minZ: -3.5, maxZ: 3.5, restitution: 0.5 },
    });
  }

  function resetCameraForHole() {
    camState.yaw = -0.35;
    camState.pitch = 0.42;
    camState.distance = 4.8;
    camState.target.set(holePos.x * 0.45, 0.1, holePos.z * 0.45);
    updateCameraTransform();
  }

  function currentAimInputs() {
    if (activeMode === "simulation") {
      return {
        speed: parseFloat(ui.simSpeed.value),
        angleDeg: parseFloat(ui.simAngle.value),
      };
    }
    return {
      speed: parseFloat(ui.inSpeed.value),
      angleDeg: parseFloat(ui.inAngle.value),
    };
  }

  function syncLabels() {
    ui.lblSpeed.textContent = `${parseFloat(ui.inSpeed.value).toFixed(2)} m/s`;
    ui.lblAngle.textContent = `${parseFloat(ui.inAngle.value).toFixed(0)}°`;
    ui.lblSimMass.textContent = `${parseFloat(ui.simMass.value).toFixed(4)} kg`;
    ui.lblSimMu.textContent = `${parseFloat(ui.simMu.value).toFixed(3)}`;
    ui.lblSimSpeed.textContent = `${parseFloat(ui.simSpeed.value).toFixed(2)} m/s`;
    ui.lblSimAngle.textContent = `${parseFloat(ui.simAngle.value).toFixed(0)}°`;
  }

  function resetSimulation() {
    simState = createFreshState();
    trailGeo.setDrawRange(0, 0);
    updateVisuals();
  }

  function updateStatusBanner(tel) {
    ui.statusBanner.classList.remove("good", "danger");
    if (simState.status === "holed") {
      ui.statusBanner.classList.add("good");
      const scoreLabel =
        simState.strokes === 1
          ? "Hole-in-One!"
          : simState.strokes <= simState.par
            ? `Masuk! (${simState.strokes} pukulan · Par)`
            : `Masuk (${simState.strokes} pukulan)`;
      ui.statusText.textContent = scoreLabel;
    } else if (simState.missedHoleSpeed !== null && simState.status !== "rolling") {
      ui.statusBanner.classList.add("danger");
      ui.statusText.textContent = `Terlalu cepat melewati lubang (${simState.missedHoleSpeed.toFixed(2)} m/s > 0,50 m/s)`;
    } else if (simState.status === "rolling") {
      ui.statusText.textContent = "Bola menggelinding di bawah gaya gesek gulir…";
    } else if (simState.status === "stopped") {
      ui.statusText.textContent = `Berhenti pada ${simState.shotDistance.toFixed(2)} m · siap pukulan berikutnya`;
    } else {
      ui.statusText.textContent =
        activeMode === "game"
          ? `Siap memukul · Target ${tel.distanceToHole.toFixed(2)} m · Par 2`
          : "Mode Simulasi: ubah parameter lalu tekan Reset sebelum memukul";
    }
  }

  function updateVisuals() {
    holeGroup.position.set(simState.holePosition.x, 0, simState.holePosition.z);
    ballGroup.position.set(simState.x, simState.y, simState.z);
    ballGroup.rotation.set(simState.rollAngleX, 0, simState.rollAngleZ);

    const aim = currentAimInputs();
    const rad = (aim.angleDeg * Math.PI) / 180;
    const showAim = simState.status === "ready" || simState.status === "stopped";
    aimArrow.visible = showAim;
    if (showAim) {
      aimArrow.position.set(simState.x, 0.03, simState.z);
      aimArrow.setDirection(new THREE.Vector3(Math.cos(rad), 0, Math.sin(rad)));
      aimArrow.setLength(0.25 + aim.speed * 0.28, 0.14, 0.08);
    }

    // Update trail
    const pts = simState.trail;
    const count = Math.min(pts.length, maxTrailPts);
    for (let i = 0; i < count; i += 1) {
      trailPos[i * 3] = pts[i].x;
      trailPos[i * 3 + 1] = 0.008;
      trailPos[i * 3 + 2] = pts[i].z;
    }
    trailGeo.attributes.position.needsUpdate = true;
    trailGeo.setDrawRange(0, count);

    const tel = K.getGolfTelemetry(simState);
    const predDist =
      simState.status === "ready" || simState.status === "stopped"
        ? (aim.speed * aim.speed) /
          (2 * simState.params.muR * simState.params.gravity)
        : tel.theoreticalStopDistance;

    ui.telemStrokes.textContent = `Pukulan: ${tel.strokes}`;
    ui.valSpeed.textContent = `${tel.speed.toFixed(2)} m/s`;
    ui.valDist.textContent = `${tel.distanceTraveled.toFixed(2)} m`;
    ui.valHole.textContent = `${tel.distanceToHole.toFixed(2)} m`;
    ui.valKe.textContent = `${tel.kineticEnergy.toFixed(3)} J`;
    ui.valDrag.textContent = `${tel.rollingDragForce.toFixed(4)} N`;
    ui.valPred.textContent = `${predDist.toFixed(2)} m`;
    updateStatusBanner(tel);
  }

  function strikeNow() {
    if (simState.status === "rolling" || simState.status === "holed") return;
    if (activeMode === "simulation" && pendingSimParams) {
      resetSimulation();
    }
    const aim = currentAimInputs();
    K.strikeGolfBall(simState, aim.speed, aim.angleDeg);
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
    ui.btnNewHole.hidden = isSim;
    ui.missionDesc.textContent = isSim
      ? "Ubah massa, koefisien gesek μr, dan v₀. Perhatikan jarak berhenti tidak bergantung massa!"
      : "Arahkan pukulan dan atur kelajuan awal agar bola masuk lubang pada laju ≤ 0,50 m/s.";
    resetSimulation();
  }

  // Event bindings
  ui.modeGameBtn.addEventListener("click", () => switchMode("game"));
  ui.modeSimBtn.addEventListener("click", () => switchMode("simulation"));

  ui.inSpeed.addEventListener("input", () => {
    syncLabels();
    updateVisuals();
  });
  ui.inAngle.addEventListener("input", () => {
    syncLabels();
    updateVisuals();
  });

  for (const simInput of [ui.simMass, ui.simMu, ui.simSpeed, ui.simAngle]) {
    simInput.addEventListener("input", () => {
      syncLabels();
      if (simInput === ui.simMass || simInput === ui.simMu) {
        pendingSimParams = readSimInputs();
        ui.simPendingNote.hidden = false;
      }
      updateVisuals();
    });
  }

  ui.btnStrike.addEventListener("click", strikeNow);
  ui.btnReset.addEventListener("click", resetSimulation);
  ui.btnNewHole.addEventListener("click", () => {
    const x = 2.6 + Math.round(Math.random() * 44) / 10;
    const z = Math.round((Math.random() - 0.5) * 32) / 10;
    holePos = { x, z };
    resetSimulation();
    resetCameraForHole();
  });
  ui.btnCamReset.addEventListener("click", resetCameraForHole);

  const keysHeld = new Set();
  function onKeyDown(e) {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      if (e.code !== "Space" && e.code !== "Enter") return;
    }
    if (e.code === "Space" || e.code === "Enter") {
      if (e.repeat) return;
      e.preventDefault();
      strikeNow();
      return;
    }
    if (e.code === "KeyR" && !e.repeat) {
      resetSimulation();
      return;
    }
    keysHeld.add(e.code);
  }
  function onKeyUp(e) {
    keysHeld.delete(e.code);
  }
  function onBlur() {
    keysHeld.clear();
    camState.dragging = false;
  }

  // Orbit pointer handlers
  function onPointerDown(e) {
    camState.dragging = true;
    camState.lastX = e.clientX;
    camState.lastY = e.clientY;
  }
  function onPointerMove(e) {
    if (!camState.dragging) return;
    const dx = e.clientX - camState.lastX;
    const dy = e.clientY - camState.lastY;
    camState.lastX = e.clientX;
    camState.lastY = e.clientY;
    camState.yaw -= dx * 0.006;
    camState.pitch = Math.min(1.25, Math.max(0.12, camState.pitch + dy * 0.005));
    updateCameraTransform();
  }
  function onPointerUp() {
    camState.dragging = false;
  }
  function onWheel(e) {
    e.preventDefault();
    camState.distance = Math.min(18, Math.max(1.8, camState.distance + e.deltaY * 0.004));
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
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  window.addEventListener("resize", onResize);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

  // Fixed-timestep RAF loop
  let accumulator = 0;
  let lastTs = performance.now();
  let rafId = 0;

  function applyHeldAimKeys(frameDt) {
    if (simState.status === "rolling") return;
    let changed = false;
    const angleEl = activeMode === "simulation" ? ui.simAngle : ui.inAngle;
    const speedEl = activeMode === "simulation" ? ui.simSpeed : ui.inSpeed;
    if (keysHeld.has("KeyA") || keysHeld.has("ArrowLeft")) {
      angleEl.value = String(Math.max(-45, parseFloat(angleEl.value) - 35 * frameDt));
      changed = true;
    }
    if (keysHeld.has("KeyD") || keysHeld.has("ArrowRight")) {
      angleEl.value = String(Math.min(45, parseFloat(angleEl.value) + 35 * frameDt));
      changed = true;
    }
    if (keysHeld.has("KeyW") || keysHeld.has("ArrowUp")) {
      speedEl.value = String(Math.min(4, parseFloat(speedEl.value) + 1.5 * frameDt));
      changed = true;
    }
    if (keysHeld.has("KeyS") || keysHeld.has("ArrowDown")) {
      speedEl.value = String(Math.max(0.2, parseFloat(speedEl.value) - 1.5 * frameDt));
      changed = true;
    }
    if (changed) {
      syncLabels();
      updateVisuals();
    }
  }

  function animate(ts) {
    rafId = requestAnimationFrame(animate);
    const frameDt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
    lastTs = ts;

    applyHeldAimKeys(frameDt);

    if (simState.status === "rolling") {
      accumulator += frameDt;
      while (accumulator >= K.GOLF_DT && simState.status === "rolling") {
        K.stepGolf(simState, K.GOLF_DT);
        accumulator -= K.GOLF_DT;
      }
      if (!prefersReducedMotion) {
        camState.target.x += (simState.x - camState.target.x) * 0.08;
        camState.target.z += (simState.z - camState.target.z) * 0.08;
        updateCameraTransform();
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
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
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
  resetCameraForHole();
  updateVisuals();
  document.body.dataset.ready = "true";
  rafId = requestAnimationFrame(animate);
})();
