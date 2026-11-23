# Physics Game Lab

Website game simulasi fisika dengan desain Dark Gaming Modern. **Fase 4: First Public Deployment** — Classic 8-ball lokal dua pemain, Simulation Mode, HUD SI, mouse/touch/keyboard dan rendering R3F. Empat game lainnya Coming Soon.

## Menjalankan lokal

Node 24 LTS dan npm diperlukan. Dari root proyek:

```powershell
npm ci
npm run dev
```

Buka [http://127.0.0.1:3000](http://127.0.0.1:3000). Untuk production: `npm run build`, lalu `npm run start`.

Pemeriksaan: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. E2E memakai Edge terpasang dengan sandbox aktif, production server port **3103** (agar tidak mengganggu dev server 3000), desktop/tablet/mobile/landscape. Tools MCP tetap terisolasi melalui `./tools/setup-environment.ps1`.

Halaman: `/`, `/games`, `/games/[slug]`, `/about`. Buka `/games/billiard`, pilih Classic Mode atau Simulation Mode. Drag meja untuk bidikan, atur Power lalu Shoot. Sesudah break di Classic, pilih bola dan pocket atau Safety sebelum memukul. Aim Camera mengikuti bidikan. Free Camera mendukung orbit serta scroll/pinch untuk zoom. Fokus area meja untuk ← →, Spasi, P. Parameter eksperimen diterapkan melalui reset eksplisit.

Baca [laporan Fase 3](docs/PHASE_3_REPORT.md), [model fisika](docs/PHYSICS_SPEC.md), [dokumentasi](docs/README.md), [roadmap](docs/ROADMAP.md), dan [AGENTS.md](AGENTS.md). Kernel bola khusus TypeScript menggunakan SI dan fixed timestep 1/120 s, dengan spin dan jump. QA emulasi mobile belum setara pengujian HP fisik.

## Deployment

Website production tersedia di https://physics-game-lab.vercel.app. Project Vercel `physics-game-lab` pada akun Ryu teams terhubung ke repository `royan902/PHYSICS-GAME-LAB`, dengan preset Next.js dan Node.js 24.x. Aplikasi tidak membutuhkan environment variable rahasia.

Push atau merge ke `main` memicu deployment production otomatis. Branch lain digunakan untuk preview. Jalankan lint, typecheck, unit test, dan build sebelum push. Periksa status Ready di dashboard Vercel lalu uji URL deployment. Deployment pertama dilakukan langsung ke Production dengan persetujuan pengguna karena Vercel mewajibkannya untuk project baru.

`.vercelignore` mengecualikan cache tools, kredensial lokal, arsip referensi dan hasil QA dari upload CLI. Preferensi game disimpan di browser pemain.
