# Physics Game Lab

Website game simulasi fisika dengan desain Dark Gaming Modern. **Fase 3: Billiard Physics 3D Playable MVP** — lima level Pocket Challenge, Simulation Mode, HUD SI, mouse/touch/keyboard dan rendering R3F. Empat game lainnya Coming Soon.

## Menjalankan lokal

Node 26 LTS dan npm diperlukan. Dari root proyek:

```powershell
npm ci
npm run dev
```

Buka [http://127.0.0.1:3000](http://127.0.0.1:3000). Untuk production: `npm run build`, lalu `npm run start`.

Pemeriksaan: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. E2E memakai Edge terpasang dengan sandbox aktif, production server port **3103** (agar tidak mengganggu dev server 3000), desktop/tablet/mobile/landscape. Tools MCP tetap terisolasi melalui `./tools/setup-environment.ps1`.

Halaman: `/`, `/games`, `/games/[slug]`, `/about`. Buka `/games/billiard`, pilih Game Mode atau Simulation Mode. Drag meja untuk bidikan, atur Power lalu Shoot. Tombol Bidikan aktif beralih ke kontrol kamera; scroll/pinch untuk zoom. Fokus area meja untuk ← →, Spasi, P. Parameter eksperimen diterapkan melalui reset eksplisit.

Baca [laporan Fase 3](docs/PHASE_3_REPORT.md), [model fisika](docs/PHYSICS_SPEC.md), [dokumentasi](docs/README.md), [roadmap](docs/ROADMAP.md), dan [AGENTS.md](AGENTS.md). Solver disc kontinu khusus TypeScript, SI, fixed 1/120 s; tanpa spin/jump, backend, database atau tracking. QA emulasi mobile belum setara pengujian HP fisik.
