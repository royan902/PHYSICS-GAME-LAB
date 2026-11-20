# Roadmap berbasis gate

Urutan adalah prioritas, bukan janji tanggal atau estimasi yang telah disetujui. Sebuah fase selesai berdasarkan bukti, bukan jumlah berkas.

Revisi berdasarkan instruksi Fase 1: Development Environment Setup dipisahkan dari implementasi. Scaffold, library web/game, spike dan CI dipindah ke awal Fase 2. Fase 0 tetap catatan historis.

| Fase | Hasil | Gate kelulusan |
| --- | --- | --- |
| 0 — fondasi perencanaan | Dokumen, AGENTS.md, empat skill, strategi QA/Git | Output lengkap, tautan lokal valid, metadata skill diperiksa, tidak ada aplikasi/dependency |
| 1 — Development Environment Setup | Audit OS/terminal/Node LTS/Git/browser, skills, plugin, MCP dan ignore rules | Tools inti, npm registry, YAML skills, MCP/WebGL diperiksa; batas dilaporkan; checkpoint jika identitas ada; tanpa aplikasi |
| 2 — fondasi implementasi dan Billiard MVP | Scaffold Next.js/TS/Tailwind, katalog, spike R3F/Rapier, Vitest/Playwright Test/CI, lalu meja dan kedua mode | Gate fondasi: build/runtime/tes lebih dahulu; kemudian aturan sesi, reset, benchmark fisika dan E2E Billiard |
| 3 — Billiard release | Responsivitas, fallback, performa, QA lintas browser, preview Vercel | Budget terukur, browser matrix, issue kritis selesai, checklist rilis terbukti |
| 4 — Golf MVP | Putt satu hole, kedua mode | Jarak berhenti tervalidasi, hole capture konsisten, smoke touch/keyboard |
| 5 — Rocket Landing MVP | Runtime Phaser 2D, thrust/fuel/landing, kedua mode | Free fall/hover/fuel/landing fixtures lolos; cleanup lintas runtime |
| 6 — Cannon MVP | Peluru 3D, target, parameter, kedua mode | Oracle lintasan ideal, collision cepat, hasil konsisten; 2D view opsional sesudahnya |
| 7 — Ramp Race MVP | Dua bola padat, ramp, kedua mode | Waktu/akselerasi/energi cocok model rolling, finish stabil |
| 8 — enhancement | Spin, bukit, drag, level lanjutan, fitur yang diprioritaskan | Setiap tambahan memiliki kebutuhan pengguna dan benchmark sendiri |

Sebelum fase implementasi: baca [laporan environment](PHASE_1_REPORT.md) dan [kebutuhan Fase 2](PHASE_2_REQUIREMENTS.md), cek versi stable dan peer dependency, lalu catat versi yang dipilih. Setelah setiap gate: review risiko, update report, buat checkpoint sesuai [workflow Git](GIT_WORKFLOW.md). Tidak ada deployment otomatis hanya karena fase selesai.

MVP tidak memerlukan plugin khusus, layanan AI runtime, desain asset kompleks, akun pengguna, atau backend. Penambahan fitur baru masuk backlog; jangan menggeser penerimaan fase aktif tanpa mendokumentasikan dampaknya.
