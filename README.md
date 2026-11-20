# Physics Game Lab

Website katalog game simulasi fisika dengan desain Dark Gaming Modern. **Fase 2: Website Platform MVP**, tanpa gameplay. Billiard 3D dimulai pada Fase 3.

## Menjalankan lokal

Node 26 LTS dan npm diperlukan. Dari root proyek:

```powershell
npm ci
npm run dev
```

Buka [http://127.0.0.1:3000](http://127.0.0.1:3000). Untuk production: `npm run build`, lalu `npm run start`.

Pemeriksaan: `npm run lint`, `npm run typecheck`, `npm run test:e2e` (build production lebih dahulu; memakai Edge terpasang). Docs, skills dan tooling existing tetap dipertahankan. Tools MCP dipulihkan terpisah melalui `./tools/setup-environment.ps1`.

Halaman: `/`, `/games`, `/games/[slug]`, `/about`. Lima game: Billiard Physics, Golf Physics, Rocket Landing, Cannon Physics, Ramp Race. Semua card membuka detail, bukan permainan.

Baca [dokumentasi](docs/README.md), [laporan Fase 2](docs/PHASE_2_REPORT.md), [roadmap](docs/ROADMAP.md), dan [AGENTS.md](AGENTS.md). Tidak ada backend, database, tracking, atau engine game di runtime website.
