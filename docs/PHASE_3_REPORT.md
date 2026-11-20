# Laporan Fase 3 — Billiard Physics 3D Playable MVP

Tanggal: **20 November 2026, Asia/Jakarta**. Baseline Fase 2 `8ba2b75`. Branch kerja `codex/phase-3-billiard`. Hasil adalah MVP lokal, tanpa push atau deployment.

## 1. Fitur selesai

- Billiard dapat dibuka dari katalog di `/games/billiard`, status **Playable**; Home, Games, About, filter, 404 dan empat game Coming Soon tetap berfungsi.
- Meja 3D 2.54 × 1.27 m, kain hijau, rangka, bantalan dengan gap/jaw, enam pocket, bola putih dan target bernomor, cue 3D, garis bidikan, feedback pocket, pencahayaan ringan. Primitive lokal, tanpa aset dekoratif/post-processing/shadow berat.
- Perspektif/top-down, orbit kamera yang terpisah dari bidikan, wheel/pinch zoom dan slider zoom. Drag mouse/touch, slider sudut/power, Shoot, Pause/Resume, Restart, keyboard ← →/Spasi/P pada area meja. Space pada tombol kamera tidak mengirim shot.
- Pocket Challenge: First Shot (3), Double Hit (6), Angle Master (5), Bank Shot (6), Pocket Challenge (8); angka adalah batas pukulan + penalti. Counter sekali per command valid, menunggu semua bola diam, scratch +1 dan safe respawn, menang/gagal, next level dan pemilihan level.
- Simulation Mode: momentum, tumbukan dua bola, gesekan, energi kinetik dan restitusi. Massa bersama, kecepatan awal, μ, e bola/bantalan benar-benar masuk ke world solver setelah reset eksplisit. Reset experiment, pause, single-step, telemetry tiap bola/total dan grafik energi ringkas 10 Hz.
- Physics HUD langsung dari model: Power %, predicted v₀, impulse J, energi kinetik dan nilai pukulan aktual sebelum drag. Tidak ada angka gaya Newton tanpa asumsi durasi kontak.
- Client-only dynamic import, loading state, WebGL unavailable/context loss dengan tindakan muat ulang, pause pada blur/tab tersembunyi, cleanup listener/timer/controls/texture/resource.

## 2. Teknologi dan arsitektur

Next.js 16.4.6, React/React DOM 19.3.1, TypeScript strict 5.9.3 dan Tailwind 4.3.5 existing dipertahankan. Tambahan stable terpin: Three 0.187.0, R3F 9.8.2, @types/three 0.187.0, Vitest 5.1.1, Prettier 3.10.1. Playwright Test 1.65.1 dan Edge existing digunakan. Peer dependency diperiksa melalui npm registry; R3F 9.8.2 menerima React >=19 <19.4 dan Three >=0.156. Audit npm ketika instalasi: 0 vulnerability, bukan jaminan audit keamanan menyeluruh.

Solver **disc kontinu khusus TypeScript** menggantikan rencana awal Rapier untuk Billiard. Alasannya: translasi XZ saja tanpa spin/jump tidak membutuhkan rigid body 3D/WASM; kernel kecil bisa diuji headless dan berbagi model persis antar-mode. Three/R3F hanya merender. Tidak memasang Drei, Rapier, Phaser, backend, worker atau framework umum.

Modul dipisah menjadi `physics.ts` (SI/TOI/impuls), `session.ts` (tick/command/rules/telemetry), `levels.ts`, `experiments.ts`, `input.ts`, `scene.tsx`, `game.tsx` (HUD/kontrol), `game-loader.tsx`. Satu `useFrame` meja memanggil accumulator; ball meshes membaca pose dengan refs. UI hanya disampling 10 Hz. Render memakai pose tick terakhir, belum interpolasi. Detail: [arsitektur](ARCHITECTURE.md), [spesifikasi fisika](PHYSICS_SPEC.md), [keputusan awal](PHASE_3_PLAN.md).

Lima skill proyek dibaca dan digunakan sesuai bagian kerja. Game Studio routing, React Three Fiber dan Game Playtest serta React best practices dipakai. Tidak memakai subagent atau memasang plugin baru. Playwright MCP membantu inspeksi/interaksi awal, suite repo tetap bukti regresi.

## 3. Hasil pengujian nyata

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run lint` | Lulus, tanpa error/warning aplikasi |
| `npm run typecheck` | Lulus |
| `npm test` | **23 test, 4 file, lulus** |
| `npm run build` | Lulus; route tetap static/SSG, game client-only |
| `npm run test:e2e` | **29 test lulus**, sekitar 1 menit; tanpa skipped |
| `git diff --check` | Lulus |
| npm dependency tree | Tidak ada invalid peer dependency yang dilaporkan |

Browser: Edge stable installed, sandbox aktif. Matrix 1440×1000 desktop, 768×1024 tablet, 375×812 mobile touch, 844×390 landscape touch. Interaksi touch disuntik melalui CDP Input pada Canvas, bukan hanya DOM assertions. Slider diuji melalui event input DOM; keyboard/focus dan tombol memakai Playwright. Tidak ada test API yang mengubah world secara langsung.

Coverage perilaku: navigasi katalog, Canvas raycast drag, shot tunggal/penguncian, HUD predicted/actual, pause freeze tick/pose, pocket dan perubahan screenshot Canvas, restart/next, mode switch, parameter aktif, single-step, blur pause, wheel/pinch tanpa mengubah bidikan, fallback WebGL, context loss, reload, route leave/re-entry dan regresi platform. Satu skenario desktop menyelesaikan kelima level berurutan melalui UI, termasuk Bank Shot preset; bukti akhir pada screenshot. Screenshot diperiksa secara visual untuk meja, pocket, bola, cue, garis bidikan, HUD dan layout. Error console/page aplikasi yang dipantau pada alur gameplay utama: 0.

Pengujian headless mencakup mode parity, cadence 30/60/120 FPS pada tick sama, backlog cap, shot counter/zero input, scratch simultan dengan target terakhir, safe respawn terhalang, loss setelah settle dan solvabilitas lima layout dengan sudut 0.1°. Tidak mengklaim determinisme bit-identik lintas browser/versi.

## 4. Validasi model fisika

Unit internal: m, kg, s, radian, N·s, J; Y atas, translasi XZ. Fixed dt=1/120 s, delta render cap 0.1 s, maksimum 8 tick/frame lalu membuang backlog (diagnostik dicatat). Input shot diproses sekali pada tick berikutnya.

Power bukan gaya: `v₀=0.05P`, `J=m v₀`, `p=m v`, `Ek=½mv²`. P=40%, m=0.17 kg menghasilkan v₀=2 m/s, J=0.340 N·s, Ek=0.340 J pada prediksi dan shot aktual. Simulation m=0.30 kg, v₀=1 m/s menghasilkan J=0.300 N·s, Ek=0.150 J, diverifikasi di browser.

Toleransi ditentukan sebelum hasil: momentum ≤1%, energi ideal ≤2%, restitution 2%+0.01 m/s, stopping distance 2%+0.005 m. Oracle independen, bukan output solver yang dibandingkan dengan dirinya sendiri. Contoh hasil dari solver produksi:

| Fixture | Expected analitik | Actual |
| --- | --- | --- |
| Dua massa 0.17 kg, e=1, v=(1,0), setelah 24 tick | v′=(0,1) m/s | (0,1) m/s |
| Momentum/energi fixture tersebut | 0.17 kg·m/s; 0.085 J | 0.17; 0.085 |
| μ=0.04, v₀=0.5 m/s, jarak berhenti | 0.318552497 m | 0.318552375 m |
| Waktu berhenti fixture gesek | 1.274209990 s | 1.275 s, error <1 tick |
| Rail e=0.8, v masuk=2 m/s | v keluar=−1.6 m/s | −1.6 m/s |

Tambahan: unequal masses untuk e=0/0.5/0.95/1, vector momentum dan tangent pada collision miring, swept discs berlawanan 5 m/s, sweep 360 arah selama 360 tick dengan batas meja atau capture sah, keenam pocket masing-masing event sekali. Tidak ada hit safety limit pada fixture sweep. [Data mentah](previews/phase-3-validation.json).

TOI menyelesaikan benturan terawal dan sisa waktu tick, sehingga tidak bergantung pada overlap akhir frame. Friction efektif μg diterapkan half-step sebelum/sesudah gerak dan tidak membalik velocity. Bola sleep setelah speed <0.01 m/s selama 30 tick. Tidak ada gravitasi/floor friction tambahan atau double integration.

## 5. Screenshot

| Bukti | Tautan |
| --- | --- |
| Game desktop | [Desktop](previews/billiard-desktop.png) |
| Perspektif meja, empat bola | [Perspective desktop](previews/billiard-perspective-desktop.png) |
| Game mobile portrait | [Mobile](previews/billiard-mobile.png) |
| Game mobile landscape | [Landscape](previews/billiard-landscape.png) |
| Simulation Mode | [Desktop simulation](previews/billiard-simulation-desktop.png), [mobile simulation](previews/billiard-simulation-mobile.png) |
| Pocket / hasil menang | [Desktop win](previews/billiard-win-desktop.png), [mobile win](previews/billiard-win-mobile.png) |
| Lima level selesai berurutan | [All levels complete](previews/billiard-all-levels-complete.png) |

Screenshot tablet dan mode landscape lainnya tersedia di folder yang sama. Bukti Fase 2 existing dipertahankan; screenshot regresi platform baru diarahkan ke test-results (ignored).

## 6. Error yang ditemukan dan perbaikan

1. Type OrbitControls tidak menerima sentinel −1 pada versi @types terbaru: gunakan null untuk gesture nonaktif; typecheck lulus.
2. ESLint React immutability menolak mutasi field sesi langsung dari handler komponen: input mengirim metode sesi, transform mesh tetap di refs/useFrame. DOM diagnostics menggunakan setAttribute. Tidak mematikan aturan lint.
3. Switch mode awal meremount Canvas dan intentional context disposal ditangkap sebagai error: pertahankan Canvas, lepas listener context loss pada cleanup. Regression test mode/reset/context loss lulus.
4. Screenshot full page memperlihatkan skip link offscreen pada scroll tertentu: pakai clip-path saat tidak fokus, tetap dapat difokuskan Tab; regresi keyboard lulus.
5. Muka bantalan visual awal bergeser dari garis solver: center mesh digeser keluar setengah ketebalannya, sehingga sisi dalam cocok dengan collision plane.
6. Fixture solusi awal memakai sudut presisi penuh lalu dibulatkan tanpa menghitung ulang shot berikutnya. Satu browser test level 3 gagal (target tersisa). Solvabilitas kini dicari pada resolusi UI 0.1°, lalu rute baru dijalankan di browser sampai seluruh level selesai. Tidak mengubah toleransi fisika untuk meluluskan tes.
7. Port 3000 sudah dipakai proses existing: server QA memakai 3103; tidak menghentikan proses pengguna.

Warning tersisa: R3F 9 memakai `THREE.Clock`, deprecated pada Three 0.187 (disarankan Timer oleh upstream). Warning dicatat, tidak disembunyikan; tidak ada error aplikasi yang terkait. Tool test juga mengeluarkan warning lingkungan NO_COLOR/FORCE_COLOR yang tidak mengubah hasil. Vitest config diubah menjadi `.mts` agar tidak ada warning config CJS/ESM.

## 7. Performa terukur

Environment: Windows 10.0.26200, AMD Ryzen 7 5700U, AMD Radeon Graphics melalui ANGLE Direct3D11, Edge 158.0.4370.33 headless dengan sandbox aktif. Masing-masing profil diukur **60.009 detik**, terpisah dari E2E, adegan Pocket Challenge 4 bola dengan pukulan/restart otomatis (19 eksekusi aksi Shoot per profil). First shot power 100%; restart mengembalikan preset level. Desktop 1440×1000/DPR 1; mobile 375×812/DPR browser 2 tetapi render dibatasi 1.5. GPU desktop sama pada kedua profil, bukan HP fisik.

| Metrik | Desktop | Mobile emulasi |
| --- | --- | --- |
| Frame tercatat | 3600 | 3600 |
| Median interval rAF | 16.7 ms | 16.7 ms |
| Median FPS dari interval | 59.88 | 59.88 |
| p95 interval rAF | 17.0 ms | 17.0 ms |
| Long tasks selama window | 0 | 0 |
| Error aplikasi selama window | 0 | 0 |
| Ready konservatif, cold 10 Mbps / RTT 100 ms | 2.211 s | 2.015 s |
| Transfer resource `/_next/`, cold | 419,030 byte | 419,030 byte |
| Canvas pixel aktual | 934×490 | 481×510 |
| Snapshot akhir render | 39 draw calls / 5,972 triangles | 39 / 5,972 |
| Snapshot akhir resource | 43 geometries / 4 textures | 43 / 4 |
| Diagnostik sesi terakhir | 0 dropped frame / 0 event-limit hit | 0 / 0 |

Angka FPS sekitar nominal 60 Hz; angka median 59.88 berasal dari kuantisasi interval 16.7 ms, sehingga tidak dinyatakan sebagai pembuktian literal median ≥60. p95 desktop <25 ms, target mobile emulasi ≥30 FPS/p95 <40 ms, dan ready <5 s terpenuhi pada lingkungan ini. Bukan jaminan performa HP menengah. Ready mencakup sampling resource pertama (~1 s) setelah Canvas sehingga konservatif; bukan LCP. Transfer adalah resource Next (JS/CSS) yang tercatat, bukan total aset/jaringan seluruh browser. rAF bukan GPU timestamp profiling. Counter diagnostik final hanya untuk sesi terakhir karena restart mereset counter.

**10 siklus SPA masuk/keluar**: setiap masuk First Shot menunjukkan 35 geometries/2 textures dan 35 draw calls/5,034 triangles; setelah navigasi katalog selesai, jumlah Canvas **0 pada seluruh 10 siklus**. Tidak ada pertumbuhan monoton resource per adegan baru. Probe awal menghitung Canvas sebelum transisi selesai (sempat 1); script diperbaiki untuk menunggu URL tujuan dan Canvas dilepas, lalu lifecycle diulang tanpa mengulang dua benchmark 60 s. Ini bukti cleanup DOM/resource plateau, bukan bukti absolut tidak ada heap/RAF leak; heap snapshot dan GPU allocation tracing mendalam belum dijalankan.

Pada Home, daftar chunk yang diminta tidak mencakup chunk Three/R3F utama `1ops53kyoqw6o.js` (970,069 byte raw build). Lazy game menghindari muatan engine ini pada Home; ukuran raw berbeda dari transfer terkompresi. Tidak memasang profiler/optimisasi spekulatif: adegan sudah memakai primitive ringan, DPR cap 1.5 dan tanpa shadow/post-process. Tidak mengklaim peningkatan before/after tanpa baseline pembanding.

[JSON pengukuran dan lifecycle](previews/phase-3-performance.json). Reproduksi: jalankan production port 3103, lalu `node tools/benchmark-billiard.mjs`. Untuk mengulang lifecycle saja sambil mempertahankan sampel 60 s: tambahkan `--lifecycle-only`.

## 8. Batas model dan pekerjaan tertunda

- Tanpa spin, jump, throw, cloth rolling/sliding lengkap, deformasi, airborne balls, aturan 8-ball, AI atau multiplayer; ini batas MVP yang disengaja.
- Kontak simultan diselesaikan berurutan deterministik; bukan solver cluster rigid body eksak. Safety cap 64 event/tick tersedia dengan counter diagnostik. Tidak menjanjikan validitas untuk arbitrary dense stacking atau kecepatan input >5 m/s.
- Pocket menggunakan disk sensor, bukan jatuh gravitasi ke dalam lubang; feedback berupa hilangnya bola, ring dan pesan. Bank Shot menerima solusi langsung juga, tidak mewajibkan bank.
- Massa UI bersama, bukan massa berbeda per bola; test kernel tetap memvalidasi massa berbeda. Grafik sederhana memakai energi translasi, belum ekspor CSV/replay/persistensi progres.
- Firefox/WebKit/Safari, HP Android/iPhone fisik, zoom browser 200%, battery/thermal dan GPU profiling mendalam belum diverifikasi. Emulasi touch tidak membuktikan dukungan/performa HP fisik.
- Tidak ada CI baru, deployment, push, backend atau publikasi. Empat game berikutnya tetap roadmap.

## 9. Kesiapan deployment dan Git

Production build serta alur utama kedua mode lolos pada Edge di lingkungan ini. Source siap untuk evaluasi preview deployment setelah instruksi terpisah; klaim dukungan rilis luas masih membutuhkan device/browser QA di atas. Tidak ada deployment atau push yang dilakukan.

Checkpoint lokal aktual: `348c779` audit/keputusan, `8c17816` kernel/session tervalidasi, `f29f6b2` kedua mode dan suite browser lengkap. Checkpoint bukti/laporan dibuat setelah benchmark selesai. Identitas Git existing dipakai tanpa mengubah konfigurasi global. `docs/PHASE_2_REPORT.zip` milik pengguna tetap untracked dan tidak dimasukkan ke commit.
