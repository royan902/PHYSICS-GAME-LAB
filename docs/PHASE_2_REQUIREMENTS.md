# Kebutuhan awal Fase 2 — fondasi implementasi

Backlog ini berasal dari fondasi teknis yang direncanakan pada Fase 0 untuk Fase 1, lalu ditunda sesuai instruksi pengguna terbaru. Tidak dikerjakan dalam setup environment.

## Prasyarat

Baca AGENTS.md, PHASE_1_REPORT.md, ARCHITECTURE.md, PHYSICS_SPEC.md dan TESTING.md. Node LTS sudah terverifikasi; pilih kombinasi stable Next/React/Tailwind/Three/R3F/Rapier/Vitest/Playwright Test berdasarkan peer dependency saat implementasi. Tools MCP yang terisolasi bukan versi runtime/test aplikasi yang wajib ditiru. Pertahankan hasil fase sebelumnya saat scaffold folder nonkosong.

## Gate fondasi sebelum gameplay

| ID | Pekerjaan | Acceptance criteria |
| --- | --- | --- |
| P2-F01 | Scaffold Next App Router, TS strict, Tailwind, ESLint | Satu manifest/lockfile aplikasi di root; docs/skills/tools tetap utuh |
| P2-F02 | Shell Dark Gaming Modern dan katalog | Lima game, empat “Segera hadir”, route Billiard, viewport 360 px dan keyboard |
| P2-F03 | Client-only R3F/Three spike | Resize/loading/error/WebGL fallback, production reload, cleanup/remount |
| P2-F04 | Rapier 3D/WASM headless dan client spike | Satu world/step owner, initialize/step/reset/dispose; spike kecil sebelum meja |
| P2-F05 | Fixed tick/config/input | SI, finite validation, accumulator cap, pause/reset dan simulated time teruji |
| P2-F06 | Vitest dan Playwright Test aplikasi | Script TESTING.md, unit/config/tick, integrasi WASM asli, production build dan Chromium smoke lulus |
| P2-F07 | CI GitHub Actions | Workflow clean install/static/unit/build/E2E; klaim remote run hanya jika benar-benar dijalankan |

Sesudah gate fondasi, implementasikan Billiard cue + 3 target, kontrol shot, pocket/scratch, Game Mode dan Simulation Mode sesuai blueprint. Benchmark dan alur E2E harus lolos sebelum Fase 2 selesai. Jangan menarik Phaser/game lain/enhancement. Preview/remote memerlukan tujuan dan akses yang nyata; coding lokal tidak memerlukannya.
