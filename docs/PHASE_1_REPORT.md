# Laporan Fase 1 — Development Environment Setup

Tanggal: **20 November 2026, Asia/Jakarta**. Status akhir: **PASS untuk scope environment yang diminta**. Environment inti siap memulai Fase 2. Tidak ada website, Next.js scaffold atau gameplay dibuat. Checkpoint Git bersyarat tidak dibuat karena identitas pengguna belum terkonfigurasi.

## Tools dan versi terverifikasi

| Item | Hasil aktual |
| --- | --- |
| OS | Windows 11 Home Single Language, build 10.0.26200, x64 |
| Terminal | PowerShell Core 7.6.9; native commands dapat dijalankan tanpa perubahan execution policy |
| Node.js | v26.13.1, process.release.lts = Lithium, win32 x64; memenuhi Node LTS |
| npm / npx | Keduanya 11.20.0; resolve dari instalasi Node yang sama |
| Git | 2.56.0.windows.4, berfungsi melalui PATH |
| Codex CLI | 0.169.1 |
| Chrome terpasang | 157.0.8103.79; keberadaan/version diperiksa, tidak diuji sebagai browser MCP |
| Edge terpasang | 158.0.4370.33; dipakai untuk audit MCP/WebGL headless |
| Firefox/WebKit/mobile | Belum disiapkan atau diuji; matrix aplikasi menjadi pekerjaan Fase 2/3 |
| @playwright/mcp | 0.0.86, dipasang dari registry.npmjs.org dengan URL repository Microsoft terverifikasi |
| Playwright / playwright-core bawaan MCP | 1.66.0-alpha-2026-11-18, dependency upstream yang dipin lockfile |
| YAML parser | yaml 2.9.1, untuk parsing YAML penuh dan pemeriksaan schema metadata skill |

Node/npm/npx berada pada instalasi Node di Program Files dan Git pada instalasi Git yang sudah ada. Tidak perlu menginstal ulang Node LTS/Git, mengganti PATH, memperbarui npm global, atau memakai administrator. Node dipin sebagai baseline environment melalui `.nvmrc` dan `.node-version`; pilihan library/peer dependency tetap diverifikasi saat implementasi.

## Perubahan dan lokasi

- `.gitignore` melindungi node_modules, build/test output, cache, konfigurasi MCP lokal dan file secret; contoh env tetap dapat dilacak.
- `tools/environment/package.json` dan lockfile hanya memuat tools development terisolasi. Tidak ada manifest/dependency aplikasi di root.
- `tools/setup-environment.ps1` memulihkan tool menggunakan npm ci dengan ignore-scripts, registry resmi dan cache workspace; tidak mengubah profile/sistem dan tidak menimpa config lokal yang sudah ada.
- `tools/run-playwright-mcp.mjs` menjalankan server lokal stdio dengan Edge headless, isolated profile, browser sandbox aktif, serta output di `.tools/`. Tidak memakai profile browser pribadi atau menonaktifkan keamanan.
- `.codex/config.toml` lokal dibuat untuk server Playwright saja; file ini diabaikan Git karena memuat absolute workspace path. `.codex/config.toml.example` adalah contoh portable. Jalankan setup kembali setelah memindahkan repo dan sesuaikan config lokal yang lama.
- `tools/check-skills.mjs` dan `tools/audit-browser.mjs` menyediakan audit yang dapat diulang. Hasil mentah browser saat ini di `.tools/browser-audit.json` (diabaikan Git); ringkasan penting dicatat dalam laporan ini.
- Roadmap, tooling, test strategy dan kebutuhan fase diselaraskan: fondasi aplikasi yang semula direncanakan pada Fase 1 dipindah ke Fase 2 sesuai instruksi terbaru. Laporan Fase 0 dipertahankan sebagai catatan historis.

## Skills, plugin dan MCP

| Item | Status dan bukti |
| --- | --- |
| physics-web-dev | PASS: struktur/frontmatter/UI metadata valid; tercantum pada katalog skill aktif yang diberikan host sesi ini |
| physics-game-dev | PASS: struktur/frontmatter/UI metadata valid; tercantum pada katalog skill aktif |
| physics-validation | PASS: struktur/frontmatter/UI metadata valid; tercantum pada katalog skill aktif |
| web-game-qa | PASS: struktur/frontmatter/UI metadata valid; tercantum pada katalog skill aktif |
| OpenAI Game Studio | PASS instalasi: game-studio@openai-curated-remote 0.1.2; CLI sesudah instalasi menunjukkan installed=true, enabled=true |
| OpenAI Build Web Apps | PASS instalasi: build-web-apps@openai-curated-remote 0.1.2; CLI sesudah instalasi menunjukkan installed=true, enabled=true |
| Playwright MCP | PASS konfigurasi dan koneksi protokol: codex mcp get playwright --json membaca config enabled=true; initialize/tools/list/tool calls berhasil melalui client audit lokal |

Pencarian Plugin Management awal tidak menampilkan kedua nama plugin. Alternatif resmi `codex plugin list --available --json` menemukan kedua slug pada marketplace openai-curated-remote. Instalasi memakai `codex plugin add <slug>@openai-curated-remote --json`, kemudian `codex plugin list --json` memverifikasi installed/enabled. Tidak ada login atau klik persetujuan manual yang diminta CLI. Kedua plugin adalah instalasi user-scoped pada cache Codex di luar workspace, sesuai otorisasi pemasangan AI tools. Tidak ada plugin lain yang dipasang sebagai pengganti.

Status installed/enabled tidak berarti workflow plugin sudah diuji atau skill barunya sudah dimuat pada percakapan berjalan ini. Muat ulang Codex/sesi proyek agar katalog skill dan konfigurasi MCP baru dimuat bila belum muncul. Audit MCP terhubung langsung ke server yang sama melalui stdio, bukan klaim bahwa native tool MCP sudah muncul dalam sesi ini. Tidak ada MCP tambahan dikonfigurasi. Tool browser/computer-use/Sites dan skill bawaan yang sudah ada tetap dipertahankan.

## Pengujian yang benar-benar dijalankan

| Pemeriksaan | Hasil |
| --- | --- |
| OS, terminal, PATH dan versi tools | PASS; Get-CimInstance, PSVersionTable, Get-Command, node/npm/npx/git/codex version |
| Node LTS dan syarat Next.js | PASS environment: release.lts Lithium, major 26 berstatus LTS di sumber resmi; Next 16.4.6 metadata registry meminta Node >=20.9.0 |
| Internet instalasi | PASS; npm ping HTTPS registry mendapat PONG sekitar 452 ms; metadata paket dan download/install berhasil |
| Restore tool lockfile | PASS; setup menjalankan npm ci --ignore-scripts; 4 packages dipasang tanpa lifecycle install script |
| Dependency audit tools | PASS saat dijalankan; npm audit melaporkan 0 vulnerabilities diketahui; bukan jaminan bebas risiko masa depan |
| Repository lokal | PASS; rev-parse is-inside-work-tree=true, root sesuai workspace, main tanpa commit, remote kosong; tidak perlu git init ulang |
| Identitas Git | user.name dan user.email tidak terkonfigurasi; tidak diubah, staging/commit/push dilewati |
| Ignore rules | PASS untuk .tools/browser-audit.json, .codex/config.toml, nested node_modules, .env dan .env.local |
| Skill validation | PASS empat skill: YAML parser penuh, duplicate key checks, field/type/nama, deskripsi, panjang UI, konsistensi metadata dan bagian workflow/checklist/sukses |
| Konfigurasi Codex MCP | PASS; server playwright terbaca enabled, stdio node launcher lokal, cwd workspace, timeout startup 30 s/tool 60 s |
| Koneksi MCP | PASS initialize protocol 2024-11-05; 25 tools ditemukan; navigate about:blank, browser_evaluate dan browser_close berhasil |
| WebGL 1 dan 2 | PASS keduanya: buat context, clear hijau, readPixels = [0,255,0,255], getError = 0 |
| Renderer GPU | ANGLE AMD Radeon Graphics (0x164C), Direct3D11; bukan hasil simulasi/game benchmark |
| Browser runtime dasar | PASS WebAssembly instantiate minimal, PointerEvent dan requestAnimationFrame |
| Integritas dokumen | Tautan lokal, fence, trailing whitespace dan syntax script diperiksa; file aplikasi/root dependency tetap tidak ada |

Kompatibilitas Next.js di atas hanya pemeriksaan prasyarat Windows/Node/browser modern. **Build Next.js, hydration, route/WASM game, Vitest, E2E aplikasi, benchmark fisika/performa serta HP nyata belum diuji**, sesuai batas fase tanpa aplikasi. Keberhasilan clear/readback WebGL tidak membuktikan semua shader/R3F/game akan berjalan.

## Error, diagnosis dan perbaikan

1. **Validator Python Fase 0 belum tersedia karena PyYAML tidak terpasang.** Tidak mengubah Python sistem atau memaksakan instalasi pip. Perbaikan alternatif: parser npm yaml terisolasi dan validator schema yang dapat diulang; keempat skill lulus. Validator quick_validate.py resmi tetap belum dijalankan sukses dan tidak diklaim demikian.
2. **Plugin yang diminta tidak ditemukan dalam pencarian katalog awal.** Jangan menyimpulkan tidak ada: periksa marketplace melalui CLI resmi, temukan slug yang benar, instal dan verifikasi ulang. Selesai tanpa bantuan manual.
3. **Dependency upstream MCP menggunakan alpha.** Metadata terbaru 0.0.86 dan beberapa rilis sebelumnya memang membawa Playwright alpha; paket stable tanpa alpha yang ditemukan jauh lebih lama. Dipilih paket resmi terkini yang dipin, tanpa memaksa override dependency internal atau downgrade lama. Pengecualian tooling didokumentasikan di AGENTS.md; tidak berlaku untuk library aplikasi. Koneksi/smoke browser dan audit tools lulus.
4. **Git checkpoint tidak memenuhi prasyarat identitas.** user.name dan user.email belum ada. Tidak menebak identitas, tidak memaksa commit, dan tidak mengubah konfigurasi pengguna. Output tetap lokal dan dapat direview. Ini kondisi skip yang diizinkan instruksi, bukan kegagalan repository.

## Masalah terbuka dan langkah manual singkat

- Untuk commit kelak, pengguna perlu menyediakan identitas yang benar atau mengonfigurasi user.name dan user.email sendiri; checkpoint usulan: `chore: prepare development environment and MCP audit`. Belum ada SHA karena tidak ada commit.
- Muat ulang sesi Codex bila plugin/MCP baru belum muncul. Instalasi/enabled dan protokol MCP sudah diverifikasi; pemuatan native tools ke sesi baru belum diamati.
- Firefox/WebKit, HP fisik, build aplikasi dan model fisika menunggu fase implementasi. Tidak menghalangi mulai coding lokal.
- Dependency alpha MCP adalah batas tooling yang perlu dievaluasi saat update. Versi aplikasi tetap stable, lockfile aplikasi kelak terpisah.

## Kesiapan Fase 2

**SIAP** untuk scaffold dan implementasi lokal. Mulai dari [PHASE_2_REQUIREMENTS.md](PHASE_2_REQUIREMENTS.md): fondasi Next/TS/Tailwind → spike R3F/Rapier → tes/build → gameplay Billiard. Plugin tidak digunakan untuk membuat produk pada fase ini. Remote GitHub/login Vercel baru diperlukan ketika tugas mencakup publikasi/CI remote.

## Referensi resmi yang diperiksa

- [Node.js releases](https://nodejs.org/en/about/previous-releases): status LTS major 26; di-cross-check dengan process.release.lts lokal.
- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation): Windows dan persyaratan Node/browser; metadata registry next diperiksa terpisah.
- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp): opsi Edge/headless/isolated/sandbox, protokol/tool dan konfigurasinya.
- [Codex MCP](https://developers.openai.com/codex/mcp): project-scoped config.toml pada trusted project dan konfigurasi stdio/cwd.
- Metadata resmi npm registry untuk @playwright/mcp dan next; CLI `codex plugin --help`, `plugin list`, `plugin add` untuk marketplace/instalasi.
