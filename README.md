# Physics Game Lab

Website game simulasi fisika. Buka [katalog production](https://physics-game-lab.vercel.app/games).

## Sudah tayang

- **Billiard Physics 3D** menyediakan Classic 8-ball lokal dua pemain dan Simulation Mode. Kernel TypeScript memakai satuan SI dan fixed timestep 1/120 s, dengan spin dan jump.
- **Bus Inertia, Gravity Gun, dan Action & Reaction** tersedia sebagai tiga game HTML5 mandiri. Masing-masing punya halaman detail dan player sendiri. Lihat [batas model Newton](docs/NEWTON_INTEGRATION.md).
- **Golf Physics, Rocket Landing, Cannon Physics, dan Ramp Race** tersedia sebagai detail konsep dengan status Coming Soon. Pengembangan gameplay mengikuti [roadmap](docs/ROADMAP.md).

## Di branch ini

Beranda dan katalog menampilkan koleksi **Hukum Newton**. Filter dimensi dan status bisa digabung dengan pencarian. URL katalog menyimpan `q`, `dimension`, dan `status`, misalnya `/games?q=inersia&dimension=3d&status=playable`. Lihat [panduan menambahkan game dan alur kerja tim](docs/GAME_INTEGRATION.md).

## Menjalankan lokal

Node 24 LTS dan npm diperlukan. Dari root proyek:

```powershell
npm ci
npm run dev
```

Buka [http://127.0.0.1:3000](http://127.0.0.1:3000). Untuk production: `npm run build`, lalu `npm run start`.

Pemeriksaan: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. E2E memakai Edge terpasang dengan sandbox aktif, production server port **3103** (agar tidak mengganggu dev server 3000), desktop/tablet/mobile/landscape. Tools MCP tetap terisolasi melalui `./tools/setup-environment.ps1`.

Halaman: `/`, `/games`, `/games/[slug]`, `/games/[slug]/play`, `/about`. Buka detail Billiard lalu **Play Now**, pilih Classic Mode atau Simulation Mode. Drag meja untuk bidikan, atur Power lalu Shoot. Sesudah break di Classic, pilih bola dan pocket atau Safety sebelum memukul. Aim Camera mengikuti bidikan. Free Camera mendukung orbit serta scroll/pinch untuk zoom. Fokus area meja untuk ← →, Spasi, P. Parameter eksperimen diterapkan melalui reset eksplisit.

GitHub Actions menjalankan instalasi dari lockfile, lint, typecheck, unit test, dan build pada push ke branch dan pada pull request yang menargetkan `main`. Jalankan E2E secara lokal dengan Edge.

## Deployment

Project Vercel `physics-game-lab` terhubung ke repository `royan902/PHYSICS-GAME-LAB`, dengan preset Next.js dan Node.js 24.x. Aplikasi tidak membutuhkan environment variable rahasia.

Push atau merge ke `main` memicu deployment production otomatis. Untuk review, buka preview branch dari pull request atau dashboard Vercel setelah statusnya Ready. Periksa katalog, detail, dan player dari URL tersebut.

`.vercelignore` mengecualikan cache tools, kredensial lokal, arsip referensi dan hasil QA dari upload CLI. Preferensi game disimpan di browser pemain.

## Catatan historis

[Laporan Fase 3](docs/PHASE_3_REPORT.md) mencatat pengembangan Billiard dan pengujian saat itu. [Integrasi Newton](docs/NEWTON_INTEGRATION.md) mencatat pemisahan build HTML5 dan hasil QA awal. Lihat [indeks dokumentasi](docs/README.md) untuk arsitektur, spesifikasi fisika, dan laporan fase lain.
