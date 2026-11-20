# Tools, plugin, dan MCP

## Status Fase 1 terbaru

Scope Fase 1 diubah pengguna menjadi Development Environment Setup saja. Node v26.13.1 LTS Lithium, npm/npx 11.20.0, Git dan PowerShell sudah memenuhi prasyarat, sehingga tidak diinstal ulang. Detail audit dan batasnya ada di [PHASE_1_REPORT.md](PHASE_1_REPORT.md). Tabel pemeriksaan Fase 0 di bawah adalah riwayat, bukan status terkini.

- Empat custom skill kini tersedia pada katalog host sesi ini dan lulus full YAML parsing/metadata validation melalui `node tools/check-skills.mjs`.
- Game Studio dan Build Web Apps 0.1.2 dipasang lewat marketplace resmi Codex; installed/enabled dikonfirmasi CLI. Workflow plugin belum dijalankan.
- Playwright MCP 0.0.86 dan yaml 2.9.1 berada di `tools/environment`, manifest/lockfile terpisah dari aplikasi. Upstream MCP membawa Playwright alpha yang dipin sebagai pengecualian tooling terbatas; jangan memakainya sebagai versi runtime game.
- Jalankan `./tools/setup-environment.ps1` untuk npm ci dan pembuatan config project lokal tanpa menimpa config yang ada. Registry/cache eksplisit, install scripts tidak dijalankan. Tidak ada browser binary baru diunduh; Edge terpasang dipakai.
- `.codex/config.toml` lokal (ignored) memuat hanya Playwright MCP stdio. Contoh portabel ada di `.codex/config.toml.example`; reload Codex bila server belum muncul di katalog sesi.
- `node tools/audit-browser.mjs` telah menguji handshake/list tools/navigasi/evaluasi/close MCP, WebGL 1/2 pixel readback, WASM dan input/timing API. Hasil mentah lokal ada di `.tools/browser-audit.json`.
- PyYAML Python masih tidak tersedia; validator resmi quick_validate.py belum lulus dijalankan. Parser YAML penuh dan schema checks Node menjadi alternatif yang dijalankan, bukan klaim menggunakan validator resmi.
- Identitas Git kosong; checkpoint dilewati sesuai syarat pengguna. Tidak ada perubahan identitas, PATH global, security policy, push atau deployment.

Semua dependency aplikasi, scaffold, spike game, Vitest/Playwright Test aplikasi dan CI yang semula dijadwalkan pada Fase 1 ditunda ke Fase 2. Hanya tooling audit/MCP yang dipasang saat setup ini.

## Pemeriksaan lokal Fase 0

| Item | Hasil observasi |
| --- | --- |
| Git | `2.56.0.windows.4`; repo main tanpa commit/remote |
| Node.js | `v26.13.1`, tersedia; belum dipilih sebagai baseline CI |
| npm | `11.20.0`, tersedia |
| Python | `3.14.5`, tersedia; modul PyYAML tidak tersedia |
| Dependency proyek | Tidak ada package.json/lockfile/node_modules; tidak dipasang |
| Vitest / Playwright / browser binary | Belum dikonfigurasi atau diuji untuk proyek |
| GitHub / Vercel account integration | Tidak diperiksa/dihubungkan |

Versi di atas hanya hasil perintah lokal, bukan rekomendasi memakai versi terkini tanpa evaluasi. Fase 1 sudah memverifikasi Node 26 LTS; Fase 2 masih perlu memastikan seluruh peer dependency aplikasi saling cocok. [Next.js](https://nextjs.org/docs/app/getting-started/installation) saat diperiksa menyebut minimum Node 20.9; itu bukan alasan memilih versi minimum yang sudah tidak cocok dengan tool lain. Baseline environment sudah dipin; clean build aplikasi menunggu implementasi.

## Kebutuhan per fase

| Tool/dependency | Kapan | Tujuan dan kebijakan |
| --- | --- | --- |
| Shell PowerShell, rg, Git | 0+ | Inspeksi, editing, verifikasi lokal; tersedia |
| Browser/search dokumentasi resmi | 0+ | Verifikasi API, kompatibilitas dan referensi; tersedia pada sesi ini |
| Next.js, React, React DOM, TypeScript | 2 | Shell App Router, strict typing; versi stable saling kompatibel |
| Tailwind CSS dan integrasi resminya | 2 | UI dark responsif; ikuti panduan versi terpilih, jangan menyalin config versi lama |
| Three.js, @react-three/fiber, @types/three | 2 | Spike dan runtime 3D; cocokkan versi React/R3F |
| Rapier JS/WASM 3D (binding dipilih saat spike) | 2 | Physics headless dan browser, satu adapter/satu loop |
| ESLint dan config Next, TypeScript CLI | 2 | Static checks |
| Vitest | 2 | Unit dan physics integration; coverage provider hanya jika diperlukan |
| @playwright/test dan browser binary | 2 | Smoke/E2E; browser download terpisah dari package install |
| GitHub Actions | 2 setelah repo tersedia | CI; simpan workflow di repo, status baru diklaim setelah run |
| Vercel | 3 atau preview lebih awal bila diminta | Hosting Next.js; tidak wajib memasang CLI global |
| Phaser | 5 | Renderer/input Rocket Landing 2D; tidak dibundel ke Billiard |
| Rapier 2D | Opsional, bukan baseline | Hanya jika terrain/collision lander kelak memerlukan solver rigid body |

Tidak perlu Zustand, chart library, Drei, postprocessing, backend, database, AI SDK, analytics, worker framework atau asset pipeline kompleks pada fondasi. Masing-masing bisa dievaluasi bila ada use case nyata. npm dipilih untuk mengurangi tools tambahan; jangan mencampur lockfile.

## Plugin dan MCP

**Tidak ada plugin atau MCP eksternal wajib untuk runtime produk.** Fase 0 tidak memasangnya; pada Fase 1 pengguna meminta setup dua plugin dan Playwright MCP secara eksplisit, dan instalasinya sudah diverifikasi sesuai ringkasan terbaru di atas.

| Integrasi opsional | Kapan berguna | Alternatif dan batas |
| --- | --- | --- |
| GitHub plugin/MCP resmi | Issue, PR, review dan CI pada remote yang sudah diketahui | Git lokal + GitHub web atau gh jika sudah tersedia; perlu akun/izin sesuai tugas |
| Vercel MCP resmi | Preview, status deployment dan log saat fase hosting | Dashboard atau CLI lokal; jangan deploy karena koneksi ada saja |
| Playwright MCP resmi | Eksplorasi UI interaktif, reproduksi bug | Playwright Test CLI tetap sumber regression suite; MCP bukan pengganti tes di repo |
| OpenAI developer docs MCP | Tanya API OpenAI/Codex bila integrasi itu dibutuhkan | Dokumentasi web resmi cukup saat ini; tidak ada AI runtime dalam scope |
| Figma plugin | Jika pengguna kelak memberi desain Figma | Token docs dan komponen lokal cukup; tidak wajib |

MCP bukan dependency runtime browser. Instal hanya dari publisher/sumber resmi, gunakan izin minimum, hindari mencatat token di workspace, dan dokumentasikan koneksi yang benar-benar sudah dibuat. Tidak ada konfigurasi MCP placeholder atau URL server spekulatif yang ditulis pada Fase 0. Fase 1 menambahkan satu server Playwright stdio lokal, bukan server jaringan pihak ketiga.

Sumber resmi opsional: [GitHub MCP](https://github.com/github/github-mcp-server), [Vercel MCP](https://vercel.com/docs/mcp), [Playwright MCP](https://github.com/microsoft/playwright-mcp). GitHub/Vercel tetap referensi fase berikutnya. Playwright MCP sudah dipasang dan diuji pada Fase 1 sebagaimana laporan, bukan sekadar rencana.

## Skill project-scoped

Mengikuti [dokumentasi skill Codex](https://developers.openai.com/codex/skills), simpan satu folder per skill di `.agents/skills/<nama>/`, bukan di instalasi global pengguna. Setiap folder berisi `SKILL.md` dengan YAML `name` dan `description`, serta metadata UI `agents/openai.yaml`. Automatic selection dibiarkan default aktif; pemanggilan eksplisit dapat memakai `$physics-web-dev`, `$physics-game-dev`, `$physics-validation`, `$web-game-qa`.

Fase 1 sudah memvalidasi berkas dan host sesi telah memuat keempat skill. Setelah perubahan berikutnya, periksa daftar skill kembali. Jika belum muncul, muat ulang/restart sesuai dokumentasi. Kehadiran berkas bukan bukti skill telah masuk katalog aktif sesi yang sudah berjalan.

Validator bawaan skill-creator memerlukan PyYAML, yang tidak tersedia pada Python lokal yang diperiksa. Jangan memasang dependency di Fase 0 untuk memaksanya; gunakan pemeriksaan subset YAML yang dipakai dan laporkan keterbatasan. Pemeriksaan validator resmi dapat diulang pada fase berikutnya jika runtime yang sesuai tersedia.
