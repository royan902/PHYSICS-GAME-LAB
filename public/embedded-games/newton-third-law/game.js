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
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfdba74,
      roughness: 0.4,
    });
    const floor3 = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.4, 14),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 }),
    );
    floor3.position.set(0, -0.2, 0);
    world.add(floor3);

    const grid3 = new THREE.GridHelper(50, 50, 0xf87171, 0x334155);
    grid3.position.set(0, 0.01, 0);
    world.add(grid3);

    // A. Meriam Tank Taktis dengan Roda & Recoil Laras
    const tankGroup = new THREE.Group();
    tankGroup.position.set(-1.5, 0, 1.5);
    world.add(tankGroup);

    const tankHull = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.9, 1.8),
      new THREE.MeshStandardMaterial({
        color: 0x15803d,
        roughness: 0.4,
        metalness: 0.3,
      }),
    );
    tankHull.position.y = 0.75;
    tankGroup.add(tankHull);

    const turretDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.35 }),
    );
    turretDome.position.set(-0.2, 1.3, 0);
    tankGroup.add(turretDome);

    const cannonBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 2.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75 }),
    );
    cannonBarrel.rotation.z = -Math.PI / 2;
    cannonBarrel.position.set(1.2, 1.45, 0);
    tankGroup.add(cannonBarrel);

    // Roda Tank
    for (let wx = -1.0; wx <= 1.0; wx += 1.0) {
      const tw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 2.0, 16),
        tireMat,
      );
      tw.rotation.x = Math.PI / 2;
      tw.position.set(wx, 0.42, 0);
      tankGroup.add(tw);
    }

    // Peluru Meriam & Efek Api Moncong (Muzzle Flash)
    const shellMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 }),
    );
    shellMesh.visible = false;
    world.add(shellMesh);

    const muzzleFlash = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 1.6, 14),
      new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0,
      }),
    );
    muzzleFlash.rotation.z = -Math.PI / 2;
    muzzleFlash.position.set(2.9, 1.45, 0);
    tankGroup.add(muzzleFlash);

    // Panah Vektor Aksi (Peluru Maju) & Reaksi (Recoil Tank Mundur)
    const arrowActionShell = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 2.4, 1.5),
      0.001,
      0xfbbf24,
      0.6,
      0.35,
    );
    const arrowReactionTank = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(-1.5, 2.4, 1.5),
      0.001,
      0xf87171,
      0.6,
      0.35,
    );
    world.add(arrowActionShell, arrowReactionTank);

    // B. Karakter Robot Pelompat (Jumping Action-Reaction di z = -2.6)
    const jumperGroup = new THREE.Group();
    jumperGroup.position.set(3.2, 0, -2.6);
    world.add(jumperGroup);

    const jumperLegs = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.9, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 }),
    );
    jumperLegs.position.y = 0.45;
    const jumperBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.1, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.3 }),
    );
    jumperBody.position.y = 1.45;
    const jumperHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 18, 18),
      skinMat,
    );
    jumperHead.position.y = 2.35;
    jumperGroup.add(jumperLegs, jumperBody, jumperHead);

    // Panah Vektor Injak Tanah (Aksi ke Bawah) & Gaya Dorong Tanah (Reaksi ke Atas)
    const arrowJumpDown = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(3.2, 1.0, -2.6),
      0.001,
      0xf87171,
      0.55,
      0.35,
    );
    const arrowJumpUp = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(3.2, 1.8, -2.6),
      0.001,
      0x4ade80,
      0.55,
      0.35,
    );
    world.add(arrowJumpDown, arrowJumpUp);

    let caliberLevel = 2; // 1 = Ringan (300N), 2 = Tank (750N), 3 = Plasma (1500N)
    let tankX = -1.5;
    let tankV = 0;
    let barrelRecoil = 0;
    let shellX = 0;
    let shellV = 0;
    let shellActive = false;
    let camShake = 0;

    let jumperY = 0;
    let jumperV = 0;
    let jumpTimer = 0;
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
    }
    window.addEventListener("pointercancel", releaseInput);
    window.addEventListener("blur", releaseInput);
    window.addEventListener("pointerup", () => {});
    window.addEventListener("keydown", (e) => {
      if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
      if (e.key === " " && /BUTTON|A/.test(document.activeElement.tagName))
        return;
      const k = e.key.toLowerCase();
      if (
        [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      )
        e.preventDefault();
      if (e.key === " " && !e.repeat) fireCannonRecoil();
      if (k === "r") resetCurrentScene();
    });
    function setCaliber(lvl) {
      caliberLevel = lvl;
      [1, 2, 3].forEach((i) => {
        document
          .getElementById(`cal-${i}`)
          .classList.toggle("active-toggle", i === lvl);
      });
    }

    function fireCannonRecoil() {
      const forces = { 1: 300, 2: 750, 3: 1500 };
      const F = forces[caliberLevel];

      // Aksi: Peluru ditembakkan ke kanan
      shellActive = true;
      shellX = tankX + 2.6;
      shellV = F * 0.045;
      shellMesh.visible = true;
      shellMesh.scale.setScalar(0.6 + caliberLevel * 0.35);

      // Reaksi (Recoil): Tank & Laras terhentak mundur ke kiri
      tankV = -(F / 120);
      barrelRecoil = 0.45 * caliberLevel;
      muzzleFlash.material.opacity = 1.0;
      camShake = 0.18 * caliberLevel;

      const banner = document.getElementById("ui-banner");
      const txt = document.getElementById("ui-reaction-text");
      banner.className = "reaction-banner danger";
      txt.textContent = `💥 RECOIL! Peluru melesat maju (F Aksi = +${F} N) ⇒ Meriam & Kamera terhentak mundur (F Reaksi = -${F} N)!`;
    }

    function triggerCharacterJump() {
      if (jumperY > 0.05) return;
      const forces = { 1: 300, 2: 750, 3: 1500 };
      const F = forces[caliberLevel];
      jumperV = 5.5 + caliberLevel * 2.8;
      jumpTimer = 0.85;

      const banner = document.getElementById("ui-banner");
      const txt = document.getElementById("ui-reaction-text");
      banner.className = "reaction-banner good";
      txt.textContent = `🦘 LOMPAT! Kaki menekan lantai ke bawah (F Aksi = -${F} N) ⇒ Lantai melontarkan karakter ke atas (F Reaksi = +${F} N)!`;
    }

    function resetCurrentScene() {
      // Reset Mode 3
      tankX = -1.5;
      tankV = 0;
      barrelRecoil = 0;
      shellActive = false;
      shellMesh.visible = false;
      jumperY = 0;
      jumperV = 0;
      jumpTimer = 0;

      camShake = 0;
      shellX = 0;
      shellV = 0;
      muzzleFlash.material.opacity = 0;
      tankGroup.position.x = tankX;
      cannonBarrel.position.x = 1.2;
      jumperGroup.position.y = 0;

      badgeEls.forEach((b) => (b.style.opacity = "0"));
      document.getElementById("ui-banner").className = "reaction-banner";
      document.getElementById("ui-reaction-text").textContent =
        "💥 Siap uji — tembak meriam atau lompat karakter.";
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
      const forces = { 1: 300, 2: 750, 3: 1500 };
      const F = forces[caliberLevel];

      // 1. Update Peluru & Recoil Tank
      if (shellActive) {
        shellX += shellV * dt;
        shellMesh.position.set(shellX, 1.45, 1.5);
        if (shellX > 32) {
          shellActive = false;
          shellMesh.visible = false;
        }
      }

      if (Math.abs(tankV) > 0.02) {
        tankX = Math.max(-14, tankX + tankV * dt);
        tankV *= 0.92; // Rem pegas suspensi tank
      } else {
        tankV = 0;
      }
      tankGroup.position.x = tankX;

      if (barrelRecoil > 0.01) {
        barrelRecoil *= 0.86;
      } else {
        barrelRecoil = 0;
      }
      cannonBarrel.position.x = 1.2 - barrelRecoil;

      if (muzzleFlash.material.opacity > 0) {
        muzzleFlash.material.opacity = Math.max(
          0,
          muzzleFlash.material.opacity - dt * 5,
        );
      }

      // Panah Vektor Recoil
      if (Math.abs(tankV) > 0.15) {
        arrowActionShell.position.set(Math.min(shellX, tankX + 5), 2.35, 1.5);
        arrowActionShell.setLength(1.6 + caliberLevel * 0.5, 0.55, 0.35);

        arrowReactionTank.position.set(tankX, 2.35, 1.5);
        arrowReactionTank.setLength(1.6 + caliberLevel * 0.5, 0.55, 0.35);

        setFloatingBadge(
          0,
          new THREE.Vector3(tankX - 1.2, 2.9, 1.5),
          `⬅️ F Reaksi (Recoil): -${F} N`,
          true,
          "badge-red",
        );
        setFloatingBadge(
          1,
          new THREE.Vector3(Math.min(shellX, tankX + 4.5), 2.9, 1.5),
          `➡️ F Aksi (Peluru): +${F} N`,
          true,
          "badge-amber",
        );
      } else {
        arrowActionShell.setLength(0.0001, 0.0001, 0.0001);
        arrowReactionTank.setLength(0.0001, 0.0001, 0.0001);
        setFloatingBadge(
          0,
          new THREE.Vector3(tankX, 2.7, 1.5),
          "💥 Meriam Tank (Siap Tembak)",
          true,
          "badge-blue",
        );
      }

      // 2. Update Karakter Pelompat (Jumping Mechanic)
      if (jumperY > 0 || jumperV > 0) {
        jumperY += jumperV * dt;
        jumperV -= 18.0 * dt; // Gravitasi
        if (jumperY <= 0) {
          jumperY = 0;
          jumperV = 0;
        }
      }
      jumperGroup.position.y = jumperY;

      if (jumpTimer > 0) {
        jumpTimer = Math.max(0, jumpTimer - dt);
        arrowJumpDown.position.set(3.2, 1.1, -2.6);
        arrowJumpDown.setLength(1.5, 0.5, 0.32);
        arrowJumpUp.position.set(3.2, jumperY + 2.6, -2.6);
        arrowJumpUp.setLength(1.5, 0.5, 0.32);

        setFloatingBadge(
          2,
          new THREE.Vector3(3.2, 0.4, -2.6),
          `⬇️ F Aksi (Injak Tanah): -${F} N`,
          true,
          "badge-red",
        );
        setFloatingBadge(
          3,
          new THREE.Vector3(3.2, jumperY + 3.4, -2.6),
          `⬆️ F Reaksi (Dorong Atas): +${F} N`,
          true,
          "badge-green",
        );
      } else {
        arrowJumpDown.setLength(0.0001, 0.0001, 0.0001);
        arrowJumpUp.setLength(0.0001, 0.0001, 0.0001);
        setFloatingBadge(
          2,
          new THREE.Vector3(3.2, 3.0, -2.6),
          "🦘 Karakter Pelompat",
          true,
          "badge-green",
        );
      }

      document.getElementById("val-stat-1").textContent = `+${F} N`;
      document.getElementById("val-stat-2").textContent = `-${F} N`;
      document.getElementById("val-stat-3").textContent =
        `${Math.abs(tankV).toFixed(1)} m/s`;
      document.getElementById("val-stat-4").textContent =
        `${jumperY.toFixed(2)} m`;
      const focusX = 0.0;
      const focusY = 1.4;

      let shakeX = 0;
      let shakeY = 0;
      if (
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        camShake > 0.01
      ) {
        shakeX = (Math.random() - 0.5) * camShake;
        shakeY = (Math.random() - 0.5) * camShake;
        camShake *= 0.85;
      } else {
        camShake = 0;
      }

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

    title.textContent =
      "Simulasi 3: Hukum III Newton (Recoil Senjata & Lompatan)";
    formula.textContent = "F aksi = -F reaksi";
    desc.innerHTML =
      "Saat meriam menembakkan peluru ke depan (<strong>F Aksi</strong>), badan tank & kamera terhentak mundur ke belakang (<strong>F Reaksi / Recoil</strong>). Saat karakter melompat, kaki menekan tanah ke bawah & tanah melontarkan ke atas!";
    document.getElementById("lbl-stat-1").textContent = "Gaya Aksi (F)";
    document.getElementById("lbl-stat-2").textContent = "Gaya Reaksi (-F)";
    document.getElementById("lbl-stat-3").textContent = "Kecepatan Recoil";
    document.getElementById("lbl-stat-4").textContent = "Tinggi Lompat";
    camYaw = 0.12;
    camPitch = 0.3;
    camDist = 15.5;
    document.getElementById("ui-mode-tag").textContent = "Hukum 3 Newton";

    camera.position.set(
      0 + camDist * Math.sin(camYaw) * Math.cos(camPitch),
      camDist * Math.sin(camPitch) + 1.4,
      camDist * Math.cos(camYaw) * Math.cos(camPitch),
    );
    resetCurrentScene();
    requestAnimationFrame(animate);

    window.setCaliber = setCaliber;
    window.fireCannonRecoil = fireCannonRecoil;
    window.triggerCharacterJump = triggerCharacterJump;
    window.resetCurrentScene = resetCurrentScene;
  } catch (error) {
    showError(
      "Game gagal dimuat. Pastikan browser mendukung WebGL, lalu coba muat ulang.",
    );
    console.error(error);
  }
})();
