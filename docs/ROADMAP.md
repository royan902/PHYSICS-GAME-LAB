# Roadmap berbasis gate

Urutan adalah prioritas, bukan janji tanggal atau estimasi yang telah disetujui. Sebuah fase selesai berdasarkan bukti, bukan jumlah berkas.

Revisi final berdasarkan instruksi Fase 2: Fase 2 hanya Website Platform MVP. Gameplay, physics spike, engine 2D/3D, benchmark fisika dan CI terkait game dipindah ke Fase 3. Laporan fase sebelumnya tetap catatan historis.

| Fase | Hasil | Gate kelulusan |
| --- | --- | --- |
| 0 — fondasi perencanaan | Dokumen, AGENTS.md, empat skill, strategi QA/Git | Output lengkap, tautan lokal valid, metadata skill diperiksa, tidak ada aplikasi/dependency |
| 1 — Development Environment Setup | Audit OS/terminal/Node LTS/Git/browser, skills, plugin, MCP dan ignore rules | Tools inti, npm registry, YAML skills, MCP/WebGL diperiksa; batas dilaporkan; checkpoint jika identitas ada; tanpa aplikasi |
| 2 — Website Platform MVP | Next.js/React/TS/Tailwind, Home, Games, lima detail, About, SVG lokal dan QA | Lint/typecheck/build; navigasi, filter, detail, 404; screenshot 1440/768/375 px; lima skill dan audit MCP |
| 3 — Billiard Physics 3D | R3F/Three/Rapier, fixed tick, meja latihan, Game Mode dan Simulation Mode | Benchmark fisika, aturan sesi, reset, lifecycle/fallback dan QA game sesuai scope; hosting hanya bila diminta |
| 4 — Golf MVP | Putt satu hole, kedua mode | Jarak berhenti tervalidasi, hole capture konsisten, smoke touch/keyboard |
| 5 — Rocket Landing MVP | Runtime Phaser 2D, thrust/fuel/landing, kedua mode | Free fall/hover/fuel/landing fixtures lolos; cleanup lintas runtime |
| 6 — Cannon MVP | Peluru 3D, target, parameter, kedua mode | Oracle lintasan ideal, collision cepat, hasil konsisten; 2D view opsional sesudahnya |
| 7 — Ramp Race MVP | Dua bola padat, ramp, kedua mode | Waktu/akselerasi/energi cocok model rolling, finish stabil |
| 8 — enhancement | Spin, bukit, drag, level lanjutan, fitur yang diprioritaskan | Setiap tambahan memiliki kebutuhan pengguna dan benchmark sendiri |

Sebelum fase implementasi: baca [laporan environment](PHASE_1_REPORT.md) dan [kebutuhan Fase 2](PHASE_2_REQUIREMENTS.md), cek versi stable dan peer dependency, lalu catat versi yang dipilih. Setelah setiap gate: review risiko, update report, buat checkpoint sesuai [workflow Git](GIT_WORKFLOW.md). Tidak ada deployment otomatis hanya karena fase selesai.

MVP tidak memerlukan plugin khusus, layanan AI runtime, desain asset kompleks, akun pengguna, atau backend. Penambahan fitur baru masuk backlog; jangan menggeser penerimaan fase aktif tanpa mendokumentasikan dampaknya.
