(() => {
  try {
    if (window.self !== window.top)
      document.querySelector(".game-tools a").hidden = true;
    const wrap = document.getElementById("canvas-wrap");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.012);

    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      300,
    );
    // Keep the original orbit while widening portrait framing to include the whole experiment.
    camera.zoom = Math.min(1, camera.aspect / 1.6);
    camera.updateProjectionMatrix();
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(15, 28, 22);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const world = new THREE.Group();
    scene.add(world);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
    });
    const roadMesh = new THREE.Mesh(
      new THREE.BoxGeometry(120, 0.4, 10),
      roadMat,
    );
    roadMesh.position.set(0, -0.2, 0);
    roadMesh.receiveShadow = true;
    world.add(roadMesh);

    // Grup Dekorasi Jalan (Marka Jalan, Tiang Lampu, Pohon) yang berulang saat bus melaju
    const roadScenery = new THREE.Group();
    world.add(roadScenery);

    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.6,
    });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const treeLeafMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.6,
    });

    for (let i = -50; i <= 50; i += 6) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.04, 0.25),
        stripeMat,
      );
      stripe.position.set(i, 0.02, 2.2);
      roadScenery.add(stripe);

      if (i % 12 === 0) {
        // Tiang Lampu Jalan
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.1, 4.8, 10),
          poleMat,
        );
        pole.position.set(i, 2.4, -4.2);
        const lamp = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.18, 0.35),
          lampMat,
        );
        lamp.position.set(i, 4.8, -3.9);
        roadScenery.add(pole, lamp);

        // Pohon Kota
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.24, 1.8, 10),
          treeTrunkMat,
        );
        trunk.position.set(i + 4, 0.9, -4.4);
        const crown = new THREE.Mesh(
          new THREE.ConeGeometry(1.1, 2.6, 12),
          treeLeafMat,
        );
        crown.position.set(i + 4, 2.6, -4.4);
        roadScenery.add(trunk, crown);
      }
    }

    // Konstruksi Bus Kota 3D (Tampilan Cutaway / Sisi Depan Terbuka agar Penumpang Terlihat)
    const busGroup = new THREE.Group();
    const busChassisGroup = new THREE.Group(); // Bagian bodi bus yang bisa tukik (pitch) saat gas/rem
    busGroup.add(busChassisGroup);
    world.add(busGroup);

    // Lantai & Sasis Bus
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
    });
    const busFloor = new THREE.Mesh(
      new THREE.BoxGeometry(10.5, 0.35, 3.4),
      floorMat,
    );
    busFloor.position.set(0, 0.85, 0);
    busFloor.castShadow = true;
    busChassisGroup.add(busFloor);

    // Dinding Belakang, Atap, dan Moncong Depan Bus (Kuning-Biru Kota)
    const busBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.2,
    });
    const busRoofMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.4,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.32,
      roughness: 0.1,
      metalness: 0.8,
    });

    // Dinding Sisi Jauh (Belakang Kamera)
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(10.5, 2.7, 0.16),
      busBodyMat,
    );
    backWall.position.set(0, 2.35, -1.62);
    busChassisGroup.add(backWall);

    // Atap Bus + Tiang Pegangan Tangan
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(10.5, 0.22, 3.4),
      busRoofMat,
    );
    roof.position.set(0, 3.75, 0);
    busChassisGroup.add(roof);

    const handrail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 9.6, 10),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 }),
    );
    handrail.rotation.z = Math.PI / 2;
    handrail.position.set(-0.2, 3.35, 0);
    busChassisGroup.add(handrail);

    // Dinding Belakang & Depan Bus + Kaca Depan
    const rearCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 2.7, 3.4),
      busBodyMat,
    );
    rearCap.position.set(-5.15, 2.35, 0);
    const frontLower = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 1.25, 3.4),
      busBodyMat,
    );
    frontLower.position.set(5.1, 1.65, 0);
    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 1.45, 3.3),
      glassMat,
    );
    windshield.position.set(5.15, 2.95, 0);
    busChassisGroup.add(rearCap, frontLower, windshield);

    // Dashboard, Setir & Gelas Kopi di Dashboard (Indikator Visual Inersia!)
    const dashBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.3, 3.2),
      floorMat,
    );
    dashBoard.position.set(4.6, 1.9, 0);
    busChassisGroup.add(dashBoard);

    const coffeePivot = new THREE.Group();
    coffeePivot.position.set(4.55, 2.06, 0.8);
    const coffeeCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.1, 0.28, 14),
      new THREE.MeshStandardMaterial({ color: 0xef4444 }),
    );
    coffeeCup.position.y = 0.14;
    coffeePivot.add(coffeeCup);
    busChassisGroup.add(coffeePivot);

    // Roda-Roda Bus 3D
    const busWheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.45, 20);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
    });
    const hubGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.48, 12);
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.7,
    });

    [
      [-3.3, 1.65],
      [3.3, 1.65],
      [-3.3, -1.65],
      [3.3, -1.65],
    ].forEach(([wx, wz]) => {
      const wGroup = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.rotation.x = Math.PI / 2;
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.rotation.x = Math.PI / 2;
      // Palang velg agar putaran roda terlihat jelas
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.1, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      );
      wGroup.add(tire, hub, spoke);
      wGroup.position.set(wx, 0.62, wz);
      busGroup.add(wGroup);
      busWheels.push(wGroup);
    });

    // Pembuat Kursi & Karakter Penumpang Artikulasi (Punya Engsel Pinggang untuk Reaksi Inersia)
    const passengers = [];
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.5,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfdba74,
      roughness: 0.4,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
    });
    const beltMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    function createSeatedPassenger(seatX, shirtColor, isDriver = false) {
      const seatGroup = new THREE.Group();
      seatGroup.position.set(seatX, 1.02, 0.25);

      // Kursi Bus (Alas + Sandaran)
      const cushion = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.16, 0.85),
        seatMat,
      );
      cushion.position.set(0, 0.42, 0);
      const backrest = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.95, 0.85),
        seatMat,
      );
      backrest.position.set(-0.32, 0.9, 0);
      const legPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.42, 0.5),
        floorMat,
      );
      legPost.position.set(0, 0.21, 0);
      seatGroup.add(cushion, backrest, legPost);
      busChassisGroup.add(seatGroup);

      // Grup Karakter Penumpang (Bisa Terpental Maju jika Rem Mendadak Tanpa Sabuk!)
      const charRoot = new THREE.Group();
      charRoot.position.set(seatX, 1.48, 0.25);
      busChassisGroup.add(charRoot);

      // Paha & Betis (Duduk)
      const thigh = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.2, 0.44),
        pantsMat,
      );
      thigh.position.set(0.16, 0.08, 0);
      const calf = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.42),
        pantsMat,
      );
      calf.position.set(0.38, -0.2, 0);
      charRoot.add(thigh, calf);

      // Engsel Pinggang (Torso Pivot) -> Bereaksi terhadap Percepatan Bus (Hukum I Newton)
      const torsoPivot = new THREE.Group();
      torsoPivot.position.set(-0.05, 0.14, 0);
      charRoot.add(torsoPivot);

      const shirtMat = new THREE.MeshStandardMaterial({
        color: shirtColor,
        roughness: 0.4,
      });
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.72, 0.48),
        shirtMat,
      );
      torso.position.set(0, 0.36, 0);
      torsoPivot.add(torso);

      // Sabuk Pengaman (Seatbelt) di Dada
      const seatbeltMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.65, 0.52),
        beltMat,
      );
      seatbeltMesh.position.set(0.01, 0.35, 0);
      seatbeltMesh.scale.set(1, 0.22, 1.02);
      seatbeltMesh.rotation.z = 0.45;
      seatbeltMesh.visible = false;
      torsoPivot.add(seatbeltMesh);

      // Engsel Leher & Kepala (Membungkuk Lebih Kuat Saat Terhentak)
      const headPivot = new THREE.Group();
      headPivot.position.set(0, 0.76, 0);
      torsoPivot.add(headPivot);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 18, 18),
        skinMat,
      );
      head.position.set(0, 0.18, 0);
      headPivot.add(head);

      // Lengan (Terayun ke Depan Saat Panik/Rem Mendadak)
      const armPivot = new THREE.Group();
      armPivot.position.set(0.05, 0.62, 0.28);
      const armMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.14, 0.14),
        shirtMat,
      );
      armMesh.position.set(0.2, 0, 0);
      armPivot.add(armMesh);
      torsoPivot.add(armPivot);

      passengers.push({
        baseX: seatX,
        charRoot,
        torsoPivot,
        headPivot,
        armPivot,
        seatbeltMesh,
        isDriver,
        angle: 0,
        angVel: 0,
        slideX: 0,
        slideV: 0,
        thrown: false,
      });
    }

    // Tambahkan 3 Penumpang Duduk & 1 Pengemudi
    createSeatedPassenger(-3.4, 0x22c55e, false); // Penumpang Belakang (Hijau)
    createSeatedPassenger(-0.9, 0xec4899, false); // Penumpang Tengah (Pink)
    createSeatedPassenger(1.6, 0x38bdf8, false); // Penumpang Depan (Biru)
    createSeatedPassenger(3.9, 0xa855f7, true); // Pengemudi (Ungu)

    // Panah Vektor 3D di Atas Bus & Penumpang
    const arrowBusForce = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 4.3, 0),
      0.001,
      0x4ade80,
      0.6,
      0.35,
    );
    const arrowPassengerInertia = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(-0.9, 2.9, 0.25),
      0.001,
      0xfbbf24,
      0.55,
      0.32,
    );
    world.add(arrowBusForce, arrowPassengerInertia);

    let busV = 0; // Kecepatan bus (m/s)
    let busA = 0; // Percepatan bus (m/s^2)
    let busDist = 0; // Jarak jalan berputar
    let busPowerMult = 1.0;
    let seatbeltOn = false;
    let holdGas = false;
    let holdBrake = false;
    let holdPanicBrake = false;

    let camYaw = 0.08;
    let camPitch = 0.25;
    let camDist = 14.5;
    let isDragging = false;
    let prevPointer = { x: 0, y: 0 };
    wrap.addEventListener("pointerdown", (e) => {
      isDragging = true;
      prevPointer = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevPointer.x;
      const dy = e.clientY - prevPointer.y;
      prevPointer = { x: e.clientX, y: e.clientY };
      camYaw -= dx * 0.0065;
      camPitch = Math.max(0.08, Math.min(1.25, camPitch + dy * 0.0065));
    });
    window.addEventListener("pointerup", () => {
      isDragging = false;
    });
    wrap.addEventListener(
      "wheel",
      (e) => {
        camDist = Math.max(7, Math.min(26, camDist + e.deltaY * 0.01));
      },
      { passive: true },
    );
    const btnGas = document.getElementById("btn-bus-gas");
    const btnBrake = document.getElementById("btn-bus-brake");
    const btnPanic = document.getElementById("btn-bus-panic");

    btnGas.addEventListener("pointerdown", () => {
      holdGas = true;
    });
    btnGas.addEventListener("pointerup", () => {
      holdGas = false;
    });
    btnGas.addEventListener("pointerleave", () => {
      holdGas = false;
    });

    btnBrake.addEventListener("pointerdown", () => {
      holdBrake = true;
    });
    btnBrake.addEventListener("pointerup", () => {
      holdBrake = false;
    });
    btnBrake.addEventListener("pointerleave", () => {
      holdBrake = false;
    });

    btnPanic.addEventListener("pointerdown", () => {
      // Jika bus sedang diam lalu user klik Rem Mendadak, beri laju awal otomatis agar efek rem mendadak langsung terlihat!
      if (busV < 4) busV = 18;
      holdPanicBrake = true;
    });
    btnPanic.addEventListener("pointerup", () => {
      holdPanicBrake = false;
    });
    btnPanic.addEventListener("pointerleave", () => {
      holdPanicBrake = false;
    });

    wrap.tabIndex = 0;
    wrap.setAttribute(
      "aria-label",
      "Area game 3D. Geser untuk orbit, gunakan tombol zoom untuk memperbesar.",
    );
    wrap.addEventListener("pointerdown", (e) => {
      wrap.focus();
      wrap.setPointerCapture(e.pointerId);
    });
    function releaseInput() {
      isDragging = false;
      holdGas = false;
      holdBrake = false;
      holdPanicBrake = false;
    }
    window.addEventListener("pointercancel", releaseInput);
    window.addEventListener("blur", releaseInput);
    window.addEventListener("pointerup", () => {
      holdGas = false;
      holdBrake = false;
      holdPanicBrake = false;
    });
    window.addEventListener("keydown", (e) => {
      if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
      if (e.key === " " && /BUTTON|A/.test(document.activeElement.tagName))
        return;
      const k = e.key.toLowerCase();
      if (
        [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      )
        e.preventDefault();

      if (
        k === "d" ||
        k === "w" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp"
      )
        holdGas = true;
      if (
        k === "s" ||
        k === "a" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowDown"
      )
        holdBrake = true;
      if (e.key === " ") {
        if (busV < 4) busV = 18;
        holdPanicBrake = true;
      }

      if (k === "r") resetCurrentScene();
    });
    window.addEventListener("keyup", (e) => {
      const k = e.key.toLowerCase();
      if (
        k === "d" ||
        k === "w" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp"
      )
        holdGas = false;
      if (
        k === "s" ||
        k === "a" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowDown"
      )
        holdBrake = false;
      if (e.key === " ") holdPanicBrake = false;
    });
    function toggleSeatbelt() {
      seatbeltOn = !seatbeltOn;
      const btn = document.getElementById("btn-seatbelt");
      btn.textContent = seatbeltOn
        ? "🦺 Sabuk Pengaman: ON"
        : "🦺 Sabuk Pengaman: OFF";
      btn.classList.toggle("active-toggle", seatbeltOn);

      const stat4 = document.getElementById("val-stat-4");
      {
        stat4.textContent = seatbeltOn ? "TERPASANG (ON)" : "LEPAS (OFF)";
        stat4.style.color = seatbeltOn ? "#4ade80" : "#f87171";
      }

      passengers.forEach((p) => {
        p.seatbeltMesh.visible = seatbeltOn;
        if (seatbeltOn && p.thrown) {
          p.thrown = false;
          p.slideX = 0;
          p.slideV = 0;
        }
      });
    }

    function updateBusPower() {
      busPowerMult = parseFloat(document.getElementById("rng-bus-power").value);
      document.getElementById("txt-bus-power").textContent =
        `Daya (${Math.round(busPowerMult * 100)}%)`;
    }

    function resetCurrentScene() {
      busV = 0;
      busA = 0;
      holdGas = false;
      holdBrake = false;
      holdPanicBrake = false;
      passengers.forEach((p) => {
        p.angle = 0;
        p.angVel = 0;
        p.slideX = 0;
        p.slideV = 0;
        p.thrown = false;
        p.charRoot.position.x = p.baseX;
        p.torsoPivot.rotation.z = 0;
        p.headPivot.rotation.z = 0;
        p.armPivot.rotation.z = 0;
      });

      busDist = 0;
      roadScenery.position.x = 0;
      busChassisGroup.rotation.z = 0;
      coffeePivot.rotation.z = 0;
      busWheels.forEach((w) => (w.rotation.z = 0));
      document.getElementById("val-stat-4").textContent = seatbeltOn
        ? "TERPASANG (ON)"
        : "LEPAS (OFF)";

      badgeEls.forEach((b) => (b.style.opacity = "0"));
      document.getElementById("ui-banner").className = "reaction-banner";
      document.getElementById("ui-reaction-text").textContent =
        "🧍 Bus diam — tekan GAS atau REM MENDADAK untuk mengamati inersia.";
    }
    const badgeEls = [
      document.getElementById("badge-1"),
      document.getElementById("badge-2"),
      document.getElementById("badge-3"),
      document.getElementById("badge-4"),
    ];

    function setFloatingBadge(index, pos3D, text, show, className) {
      const el = badgeEls[index];
      el.textContent = text;
      if (!show) {
        el.style.opacity = "0";
        return;
      }
      const p = pos3D.clone().project(camera);
      if (p.z > 1 || p.z < -1 || Math.abs(p.x) > 0.9 || Math.abs(p.y) > 0.9) {
        el.style.opacity = "0";
        return;
      }
      const sx = (p.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-p.y * 0.5 + 0.5) * window.innerHeight;
      el.className = `floating-badge ${className}`;
      el.style.left = `${Math.max(el.offsetWidth / 2 + 8, Math.min(innerWidth - el.offsetWidth / 2 - 8, sx))}px`;
      el.style.top = `${sy}px`;
      el.style.opacity = "1";
    }

    let lastTime = performance.now(),
      frame = 0,
      stopped = false;
    function animate(now) {
      if (stopped) return;
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (document.hidden) return;
      badgeEls.forEach((b) => (b.style.opacity = "0"));
      // 1. Hitung Percepatan Bus dari Input Gas / Rem
      if (holdGas) {
        busA = 8.5 * busPowerMult;
      } else if (holdPanicBrake) {
        busA = busV > 0.2 ? -22.0 * busPowerMult : 0;
      } else if (holdBrake) {
        busA = busV > 0.2 ? -7.5 * busPowerMult : 0;
      } else {
        // Gesekan gelinding sangat kecil (bus meluncur konstan karena inersia)
        busA = busV > 0.1 ? -0.35 : 0;
      }

      busV = Math.max(0, Math.min(28, busV + busA * dt));
      if (busV < 0.08 && !holdGas) {
        busV = 0;
        if (!holdPanicBrake && !holdBrake) busA = 0;
      }

      // 2. Gerakkan Lingkungan Jalan Raya & Putar Roda Bus
      busDist = (busDist + busV * dt) % 12;
      roadScenery.position.x = -busDist;
      busWheels.forEach((w) => {
        w.rotation.z -= busV * dt * 1.4;
      });

      // 3. Efek Suspensi Sasis Bus (Mendongak saat Gas, Menukik saat Rem)
      const targetPitch = THREE.MathUtils.clamp(busA * 0.0045, -0.08, 0.05);
      busChassisGroup.rotation.z +=
        (targetPitch - busChassisGroup.rotation.z) * 0.15;

      // 4. Fisika Inersia Tubuh Penumpang (Pegas-Peredam pada Engsel Pinggang)
      // Saat busA > 0 (Ngegas ke kanan), inersia mendorong tubuh ke kiri/belakang (+rotasi Z)
      // Saat busA < 0 (Mengerem), inersia melempar tubuh ke kanan/depan (-rotasi Z)
      const maxBackLean = 0.42; // Tersandar ke kursi belakang
      const maxFrontLean = seatbeltOn ? -0.45 : -1.15; // Membungkuk tajam ke depan

      let avgDeg = 0;
      let anyThrown = false;

      passengers.forEach((p) => {
        const targetLean = THREE.MathUtils.clamp(
          busA * 0.055,
          maxFrontLean,
          maxBackLean,
        );
        const springK = 38;
        const damping = 6.5;
        const accAng = (targetLean - p.angle) * springK - p.angVel * damping;
        p.angVel += accAng * dt;
        p.angle = THREE.MathUtils.clamp(
          p.angle + p.angVel * dt,
          maxFrontLean,
          maxBackLean,
        );

        p.torsoPivot.rotation.z = p.angle;
        p.headPivot.rotation.z = p.angle * 0.55;

        // Tangan terangkat ke depan saat terhentak maju
        const armRaise = p.angle < -0.25 ? Math.min(1.4, -p.angle * 1.3) : 0;
        p.armPivot.rotation.z = armRaise;

        // Jika Rem Mendadak ekstrem & Sabuk Pengaman OFF, penumpang terpental maju dari kursi!
        if (!seatbeltOn && !p.isDriver && busA < -13.0) {
          p.thrown = true;
          p.slideV = Math.max(p.slideV, Math.abs(busA) * 0.22);
        }

        if (p.thrown) {
          anyThrown = true;
          p.slideX = Math.min(1.85, p.slideX + p.slideV * dt);
          p.slideV *= 0.92;
        } else {
          p.slideX *= 0.85;
        }

        p.charRoot.position.x = p.baseX + p.slideX;
        avgDeg += THREE.MathUtils.radToDeg(p.angle);
      });
      avgDeg /= passengers.length;

      // Gelas Kopi di Dashboard ikut miring karena Inersia!
      coffeePivot.rotation.z = THREE.MathUtils.clamp(busA * 0.045, -0.7, 0.5);

      // 5. Update Panah Vektor 3D & Badge Penjelasan di Atas Penumpang
      if (Math.abs(busA) > 0.6) {
        arrowBusForce.position.set(0, 4.15, 0);
        arrowBusForce.setDirection(new THREE.Vector3(Math.sign(busA), 0, 0));
        arrowBusForce.setLength(
          Math.min(3.2, Math.abs(busA) * 0.14 + 0.6),
          0.55,
          0.35,
        );

        // Inersia penumpang berlawanan arah dengan percepatan bus
        arrowPassengerInertia.position.set(
          -0.9 + passengers[1].slideX,
          3.05,
          0.25,
        );
        arrowPassengerInertia.setDirection(
          new THREE.Vector3(-Math.sign(busA), 0, 0),
        );
        arrowPassengerInertia.setLength(
          Math.min(2.8, Math.abs(busA) * 0.13 + 0.5),
          0.5,
          0.32,
        );

        setFloatingBadge(
          0,
          new THREE.Vector3(0, 4.65, 0),
          busA > 0
            ? `🟢 Bus Ngegas (+${busA.toFixed(1)} m/s²)`
            : `🛑 Bus Mengerem (${busA.toFixed(1)} m/s²)`,
          true,
          busA > 0 ? "badge-green" : "badge-red",
        );

        setFloatingBadge(
          1,
          new THREE.Vector3(-0.9 + passengers[1].slideX, 3.45, 0.25),
          busA > 0
            ? "⬅️ Reaksi Tubuh: Terdorong ke Belakang (Inersia Diam)"
            : seatbeltOn
              ? "➡️ Condong ke Depan (Tertahan Sabuk!)"
              : "⚠️ Terlempar ke Depan (Inersia Maju)!",
          true,
          busA > 0 ? "badge-amber" : "badge-red",
        );
      } else {
        arrowBusForce.setLength(0.0001, 0.0001, 0.0001);
        arrowPassengerInertia.setLength(0.0001, 0.0001, 0.0001);
        setFloatingBadge(
          0,
          new THREE.Vector3(-0.9, 3.3, 0.25),
          busV > 0.5
            ? `⚖️ Kecepatan Konstan (${(busV * 3.6).toFixed(0)} km/j) ⇒ Tubuh Tegak`
            : "🧍 Bus Diam ⇒ Tubuh Tegak Stabil",
          true,
          "badge-blue",
        );
      }

      // Update Banner & Telemetri Mode 1
      const banner = document.getElementById("ui-banner");
      const reactTxt = document.getElementById("ui-reaction-text");
      if (anyThrown && busA < -2) {
        banner.className = "reaction-banner danger";
        reactTxt.textContent =
          "🚨 REM MENDADAK TANPA SABUK! Penumpang terlempar ke depan karena tubuh mempertahankan kecepatan awal bus!";
      } else if (busA > 2) {
        banner.className = "reaction-banner";
        reactTxt.textContent =
          "⬅️ AKSI: Bus Ngegas Maju ⇒ REAKSI INERSIA: Tubuh penumpang terdorong ke sandaran belakang!";
      } else if (busA < -2) {
        banner.className = seatbeltOn
          ? "reaction-banner good"
          : "reaction-banner danger";
        reactTxt.textContent = seatbeltOn
          ? "🦺 AKSI: Bus Mengerem ⇒ Tubuh condong ke depan tapi TERTAHAN aman oleh Sabuk Pengaman (Gaya Luar)!"
          : "➡️ AKSI: Bus Mengerem ⇒ REAKSI INERSIA: Tubuh penumpang terhempas ke depan!";
      } else if (busV > 0.5) {
        banner.className = "reaction-banner good";
        reactTxt.textContent =
          "⚖️ Bus Melaju Konstan (ΣF ≈ 0) ⇒ Tubuh penumpang kembali duduk tegak nyaman!";
      }

      document.getElementById("val-stat-1").textContent =
        `${(busV * 3.6).toFixed(1)} km/j`;
      document.getElementById("val-stat-2").textContent =
        `${busA.toFixed(1)} m/s²`;
      document.getElementById("val-stat-3").textContent =
        `${Math.round(-avgDeg)}° ${avgDeg > 3 ? "(Ke Belakang)" : avgDeg < -3 ? "(Ke Depan)" : "(Tegak)"}`;
      const focusX = 0.0;
      const focusY = 2.1;

      let shakeX = 0;
      let shakeY = 0;

      const targetCamX =
        focusX + camDist * Math.sin(camYaw) * Math.cos(camPitch) + shakeX;
      const targetCamY = focusY + camDist * Math.sin(camPitch) + shakeY;
      const targetCamZ = camDist * Math.cos(camYaw) * Math.cos(camPitch);

      camera.position.x += (targetCamX - camera.position.x) * 0.14;
      camera.position.y += (targetCamY - camera.position.y) * 0.14;
      camera.position.z += (targetCamZ - camera.position.z) * 0.14;
      camera.lookAt(focusX, focusY, 0);

      renderer.render(scene, camera);
      document.body.dataset.ready = "true";
    }
    window.addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.zoom = Math.min(1, camera.aspect / 1.6);
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });
    document.addEventListener("visibilitychange", () => {
      releaseInput();
      lastTime = performance.now();
    });
    window.addEventListener("pagehide", () => {
      stopped = true;
      cancelAnimationFrame(frame);
      const geometries = new Set(),
        materials = new Set();
      scene.traverse((obj) => {
        if (obj.geometry) geometries.add(obj.geometry);
        if (obj.material)
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(
            (m) => materials.add(m),
          );
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
    });
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) location.reload();
    });
    renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      stopped = true;
      cancelAnimationFrame(frame);
      showError("Koneksi grafis terputus. Muat ulang game untuk melanjutkan.");
    });
    document.getElementById("zoom-in").onclick = () =>
      (camDist = Math.max(7, camDist - 2));
    document.getElementById("zoom-out").onclick = () =>
      (camDist = Math.min(26, camDist + 2));
    document.getElementById("fullscreen").onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        document.getElementById("ui-reaction-text").textContent =
          "Fullscreen tidak tersedia. Gunakan player atau mode landscape.";
      }
    };
    const title = document.getElementById("ui-title"),
      formula = document.getElementById("ui-formula"),
      desc = document.getElementById("ui-desc");

    title.textContent = "Simulasi 1: Hukum I Newton (Inersia Penumpang di Bus)";
    formula.textContent = "ΣF = 0 ⇒ Mempertahankan Keadaan";
    desc.innerHTML =
      "Saat bus <strong>Injak Gas</strong>, tubuh penumpang terhempas ke <strong>belakang</strong> kursi. Saat bus <strong>Rem Mendadak</strong>, tubuh penumpang terlempar ke <strong>depan</strong> karena mempertahankan kecepatan awalnya!";
    document.getElementById("lbl-stat-1").textContent = "Kecepatan Bus (v)";
    document.getElementById("lbl-stat-2").textContent = "Percepatan Bus (a)";
    document.getElementById("lbl-stat-3").textContent = "Reaksi Tubuh";
    document.getElementById("lbl-stat-4").textContent = "Sabuk Pengaman";
    camYaw = 0.05;
    camPitch = 0.22;
    camDist = 13.5;
    document.getElementById("ui-mode-tag").textContent = "Hukum 1 Newton";

    camera.position.set(
      0 + camDist * Math.sin(camYaw) * Math.cos(camPitch),
      camDist * Math.sin(camPitch) + 1.4,
      camDist * Math.cos(camYaw) * Math.cos(camPitch),
    );
    resetCurrentScene();
    requestAnimationFrame(animate);

    window.toggleSeatbelt = toggleSeatbelt;
    window.updateBusPower = updateBusPower;
    window.resetCurrentScene = resetCurrentScene;
  } catch (error) {
    showError(
      "Game gagal dimuat. Pastikan browser mendukung WebGL, lalu coba muat ulang.",
    );
    console.error(error);
  }
})();
