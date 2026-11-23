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
    const floor2 = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.4, 14),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }),
    );
    floor2.position.set(8, -0.2, 0);
    world.add(floor2);

    const grid2 = new THREE.GridHelper(50, 50, 0x38bdf8, 0x1e293b);
    grid2.position.set(8, 0.01, 0);
    world.add(grid2);

    // Garis Target Pressure Plate di x = 14m
    const plateZone = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.06, 11),
      new THREE.MeshBasicMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.32,
      }),
    );
    plateZone.position.set(14, 0.03, 0);
    world.add(plateZone);

    // Turret Gravity Gun di x = -4.2m
    const gunTurret = new THREE.Group();
    const gunBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.8, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 }),
    );
    gunBase.position.y = 0.6;
    const gunBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.38, 1.6, 16),
      new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        emissive: 0x0284c7,
        emissiveIntensity: 0.5,
      }),
    );
    gunBarrel.rotation.z = -Math.PI / 2;
    gunBarrel.position.set(0.5, 1.2, 0);
    gunTurret.add(gunBase, gunBarrel);
    gunTurret.position.set(-4.2, 0, 0);
    world.add(gunTurret);

    // Efek Sinar Pulse Gravity Gun
    const pulseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.65, 24),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      }),
    );
    pulseRing.rotation.y = Math.PI / 2;
    pulseRing.position.set(-3.0, 1.2, 0);
    world.add(pulseRing);

    // 3 Objek Beban Berbeda Massa (Kayu 5kg, Kargo 25kg, Brankas 100kg)
    const propsMode2 = {
      wood: {
        mass: 5,
        x: 0,
        v: 0,
        a: 0,
        z: -3.4,
        mesh: null,
        label: "📦 Kayu (5 kg)",
      },
      cargo: {
        mass: 25,
        x: 0,
        v: 0,
        a: 0,
        z: 0,
        mesh: null,
        label: "🛢️ Kargo (25 kg)",
      },
      vault: {
        mass: 100,
        x: 0,
        v: 0,
        a: 0,
        z: 3.4,
        mesh: null,
        label: "🏦 Brankas (100 kg)",
      },
    };

    // 1. Kotak Kayu Kecil (5 kg)
    const woodGroup = new THREE.Group();
    const woodMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }),
    );
    woodMesh.position.y = 0.55;
    woodGroup.add(woodMesh);
    woodGroup.position.set(0, 0, propsMode2.wood.z);
    propsMode2.wood.mesh = woodGroup;
    world.add(woodGroup);

    // 2. Peti Kargo Besi (25 kg)
    const cargoGroup = new THREE.Group();
    const cargoMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.4,
        roughness: 0.35,
      }),
    );
    cargoMesh.position.y = 0.75;
    cargoGroup.add(cargoMesh);
    cargoGroup.position.set(0, 0, propsMode2.cargo.z);
    propsMode2.cargo.mesh = cargoGroup;
    world.add(cargoGroup);

    // 3. Brankas Baja Berat (100 kg)
    const vaultGroup = new THREE.Group();
    const vaultBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 2.2, 2.1),
      new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.8,
        roughness: 0.25,
      }),
    );
    vaultBody.position.y = 1.1;
    const vaultDial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9 }),
    );
    vaultDial.rotation.x = Math.PI / 2;
    vaultDial.position.set(0, 1.1, 1.08);
    vaultGroup.add(vaultBody, vaultDial);
    vaultGroup.position.set(0, 0, propsMode2.vault.z);
    propsMode2.vault.mesh = vaultGroup;
    world.add(vaultGroup);

    let gunForce = 400; // Gaya tembak (N)
    let pulseAlpha = 0;

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
      if (e.key === " " && !e.repeat) fireGravityGun("all");
      if (k === "r") resetCurrentScene();
    });
    function updateGunForce() {
      gunForce = parseFloat(document.getElementById("rng-gun-force").value);
      document.getElementById("txt-gun-force").textContent = `${gunForce} N`;
    }

    function fireGravityGun(target) {
      resetMode2Objects();
      pulseAlpha = 1.0;
      pulseRing.position.x = -2.8;

      const keys = target === "all" ? ["wood", "cargo", "vault"] : [target];
      keys.forEach((k) => {
        const obj = propsMode2[k];
        // Percepatan awal a = F / m, impuls singkat 0.65 detik
        obj.a = gunForce / obj.mass;
        obj.v = obj.a * 0.65;
      });

      const banner = document.getElementById("ui-banner");
      const txt = document.getElementById("ui-reaction-text");
      banner.className = "reaction-banner good";
      txt.textContent = `⚡ Gravity Gun Ditembakkan (${gunForce} N)! Kayu (a=${(gunForce / 5).toFixed(1)} m/s²) melesat jauh lebih cepat dari Brankas (a=${(gunForce / 100).toFixed(1)} m/s²)!`;
    }

    function resetMode2Objects() {
      ["wood", "cargo", "vault"].forEach((k) => {
        propsMode2[k].x = 0;
        propsMode2[k].v = 0;
        propsMode2[k].a = 0;
        propsMode2[k].mesh.position.x = 0;
      });
    }

    function resetCurrentScene() {
      resetMode2Objects();
      pulseAlpha = 0;
      pulseRing.material.opacity = 0;
      pulseRing.position.x = -3;

      badgeEls.forEach((b) => (b.style.opacity = "0"));
      document.getElementById("ui-banner").className = "reaction-banner";
      document.getElementById("ui-reaction-text").textContent =
        "🔫 Siap uji — tembak semua beban untuk membandingkan percepatan.";
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
      if (pulseAlpha > 0) {
        pulseAlpha = Math.max(0, pulseAlpha - dt * 2.2);
        pulseRing.position.x += 22 * dt;
        pulseRing.material.opacity = pulseAlpha;
      }

      ["wood", "cargo", "vault"].forEach((k, idx) => {
        const obj = propsMode2[k];
        if (obj.v > 0.02) {
          // Gesekan lantai menahan laju objek
          const decel = 3.2;
          obj.v = Math.max(0, obj.v - decel * dt);
          obj.x = Math.min(26, obj.x + obj.v * dt);
          obj.mesh.position.x = obj.x;
        }

        const badgeClass =
          idx === 0 ? "badge-green" : idx === 1 ? "badge-blue" : "badge-amber";
        setFloatingBadge(
          idx,
          new THREE.Vector3(obj.x, 2.4, obj.z),
          `${obj.label} | a=${(gunForce / obj.mass).toFixed(1)} m/s² | x=${obj.x.toFixed(1)}m`,
          true,
          badgeClass,
        );
      });

      setFloatingBadge(
        3,
        new THREE.Vector3(14, 2.8, 0),
        "🎯 garis Uji (14m)",
        true,
        "badge-green",
      );

      document.getElementById("val-stat-1").textContent = `${gunForce} N`;
      document.getElementById("val-stat-2").textContent =
        `${(gunForce / 5).toFixed(1)} m/s²`;
      document.getElementById("val-stat-3").textContent =
        `${(gunForce / 25).toFixed(1)} m/s²`;
      document.getElementById("val-stat-4").textContent =
        `${(gunForce / 100).toFixed(1)} m/s²`;
      const focusX = 5.5;
      const focusY = 1.4;

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

    title.textContent =
      "Simulasi 2: Hukum II Newton (Gravity Gun & Massa Beban)";
    formula.textContent = "a = F / m";
    desc.innerHTML =
      "Tembakkan <strong>Gravity Gun</strong> dengan gaya yang sama ke 3 objek berbeda: <strong>Kotak Kayu (5 kg)</strong> melesat sangat cepat, sedangkan <strong>Brankas Baja (100 kg)</strong> bergerak jauh lebih lambat!";
    document.getElementById("lbl-stat-1").textContent = "Gaya Tembak (F)";
    document.getElementById("lbl-stat-2").textContent = "a Kayu (5 kg)";
    document.getElementById("lbl-stat-3").textContent = "a Kargo (25 kg)";
    document.getElementById("lbl-stat-4").textContent = "a Brankas (100 kg)";
    camYaw = -0.35;
    camPitch = 0.38;
    camDist = 17.5;
    document.getElementById("ui-mode-tag").textContent = "Hukum 2 Newton";

    camera.position.set(
      5.5 + camDist * Math.sin(camYaw) * Math.cos(camPitch),
      camDist * Math.sin(camPitch) + 1.4,
      camDist * Math.cos(camYaw) * Math.cos(camPitch),
    );
    resetCurrentScene();
    requestAnimationFrame(animate);

    window.updateGunForce = updateGunForce;
    window.fireGravityGun = fireGravityGun;
    window.resetMode2Objects = resetMode2Objects;
    window.resetCurrentScene = resetCurrentScene;
  } catch (error) {
    showError(
      "Game gagal dimuat. Pastikan browser mendukung WebGL, lalu coba muat ulang.",
    );
    console.error(error);
  }
})();
