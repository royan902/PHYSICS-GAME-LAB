# Physics Game Lab

Platform edukasi dan permainan fisika untuk browser HP, laptop, dan PC. Status saat ini: **Fase 1 — environment inti terverifikasi; aplikasi belum dibuat**. Lihat [laporan Fase 1](docs/PHASE_1_REPORT.md) untuk integrasi opsional dan checkpoint Git.

Game pertama adalah Billiard Physics 3D. Empat game berikutnya: Golf Physics 3D, Rocket Landing 2D, Cannon Physics 3D, dan Ramp Race 3D. Setiap game memiliki Game Mode dan Simulation Mode dengan model fisika yang sama.

Mulai dari [indeks dokumentasi](docs/README.md), [kebutuhan Fase 1](docs/PHASE_1_REQUIREMENTS.md), dan [laporan Fase 0](docs/PHASE_0_REPORT.md). Aturan agen ada di [AGENTS.md](AGENTS.md). Empat skill proyek ada di [.agents/skills](.agents/skills).

Belum ada package manifest atau dependency aplikasi di root, website, atau deployment. Tools audit dan Playwright MCP berada terpisah di tools/environment. Jalankan `./tools/setup-environment.ps1` untuk memulihkan tools dari lockfile dan menyiapkan konfigurasi MCP lokal, `node tools/check-skills.mjs` untuk validasi skill, serta `node tools/audit-browser.mjs` untuk audit MCP/WebGL. Next.js dan library game baru dipasang pada Fase 2 sesuai [kebutuhan implementasi](docs/PHASE_2_REQUIREMENTS.md).
