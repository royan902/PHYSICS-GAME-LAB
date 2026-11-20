# Laporan Fase 2 — Website Platform MVP

Tanggal: **20 November 2026, Asia/Jakarta**. Status: **PASS untuk scope website**. Website dapat dibuka di [http://127.0.0.1:3000](http://127.0.0.1:3000). Server production lokal dijalankan saat handoff; tidak ada push, publikasi atau deployment.

## Implementasi

Home memiliki navbar Physics Game Lab (Home/Games/About), hero “Discover Physics Through Play.”, CTA Explore Games menuju /games, katalog dan footer. Games memakai typed registry dan GameCard reusable dengan urutan Billiard, Golf, Rocket Landing, Cannon, Ramp Race. Filter All/3D/2D benar-benar mengubah kartu. Status Billiard In Development; empat lainnya Coming Soon.

Lima route detail `/games/billiard`, `/games/golf`, `/games/rocket-landing`, `/games/cannon`, `/games/ramp-race` menunjukkan ilustrasi, deskripsi, konsep fisika, status serta rencana Game Mode/Simulation Mode. Reload route berfungsi. Slug tidak dikenal menghasilkan 404 dengan link kembali. About menjelaskan tujuan dan status platform. Tidak ada tombol play palsu, engine game, backend, database atau asset eksternal saat render.

Struktur: `src/app` untuk route/layout/style; `src/components` untuk shell, ikon, library dan kartu; `src/data/games.ts` sebagai sumber data; `public/images` lima SVG orisinal beserta provenance; `tests/e2e` untuk Playwright; `tools/environment` tetap dependency tooling terpisah. Semua dokumentasi dan skill existing dipertahankan; roadmap/requirements/arsitektur/test strategy diperbarui agar **Fase 2 website, Fase 3 Billiard 3D**.

## Dependency

| Scope | Versi terpasang |
| --- | --- |
| Runtime aplikasi | Next.js 16.4.6, React/React DOM 19.3.1 |
| Styling | Tailwind CSS dan @tailwindcss/postcss 4.3.5 |
| Static checks | TypeScript 5.9.3, ESLint 9.39.5, eslint-config-next 16.4.6 |
| Types | @types/node 26.6.6, @types/react dan @types/react-dom 19.3.0 |
| Browser test aplikasi | @playwright/test 1.65.1 stable, browser Edge terpasang |
| Tooling terpisah | @playwright/mcp 0.0.86 dengan Playwright alpha upstream (pengecualian lama); yaml 2.9.1; Chrome DevTools MCP 1.13.0 |
| Environment existing | Node 26.13.1 LTS, npm 11.20.0, PowerShell 7.6.9, Git 2.56.0.windows.4 |

Versi/peer dependency diperiksa melalui registry npm resmi dan dokumentasi [Next.js](https://nextjs.org/docs/app/getting-started/installation), [Tailwind](https://tailwindcss.com/docs/installation/framework-guides/nextjs). Root dan tooling masing-masing memiliki lockfile; keduanya bukan monorepo/workspace. Root tidak memasang Three.js, R3F, Rapier, Phaser atau Vitest yang belum diperlukan. Audit npm melaporkan 0 vulnerabilities diketahui ketika dijalankan, bukan jaminan risiko nol.

## Hasil QA aktual

| Cek | Hasil |
| --- | --- |
| npm install dan lockfile | PASS; versi terpin, npm ls --depth=0 valid |
| npm run lint | PASS, tanpa error lint |
| npm run typecheck | PASS, strict mode aktif |
| npm run build | PASS; Home/Games/About/detail statis/SSG berhasil |
| Server production | PASS; npm run start di 127.0.0.1:3000 |
| Playwright Test | PASS, 6 tes: dua skenario pada desktop 1440×1000, tablet 768×1024, mobile 375×812 |
| Page identity dan not blank | PASS; title, H1 dan lima card diperiksa |
| Interaksi | PASS Home → Explore Games → filter 2D/3D/All → lima detail → reload → kembali katalog → About; keyboard/Enter dan skip link |
| Error dan layout | PASS tanpa pageerror/console error aplikasi; 404 disengaja dikecualikan; tidak ada horizontal overflow pada Home/detail/About di tiga viewport |
| Asset | PASS kelima thumbnail visible, complete dan naturalWidth positif |
| Visual | Screenshot lokal diperiksa memakai view_image, termasuk referensi pengguna, konsep, desktop/tablet/mobile dan detail mobile; tidak ada overlay framework atau konten utama terpotong yang terlihat |
| Physics/gameplay | Tidak dijalankan/dibuat pada fase ini |

Browser path: **Browser skill/runtime tidak tersedia dalam daftar skill/tool aktif sesi** meskipun plugin browser bawaan terdeteksi pada audit sebelumnya. Fallback ke regular Playwright diizinkan eksplisit oleh brief Fase 2. Playwright Test memakai Edge terpasang dengan sandbox aktif, bukan browser pribadi. Tidak perlu mengunduh browser atau mematikan keamanan. Emulasi mobile/tablet bukan pengujian perangkat fisik. Firefox/Safari, screen reader, zoom 200%, performance benchmark/Lighthouse belum diuji.

## Bukti screenshot dan fidelity ledger

- [Konsep desain](previews/design-concept.png), [desktop](previews/home-desktop.png), [tablet](previews/home-tablet.png), [mobile](previews/home-mobile.png).
- [Detail desktop](previews/detail-desktop.png), [detail tablet](previews/detail-tablet.png), [detail mobile](previews/detail-mobile.png).
- [Render pada ukuran konsep 1487×1058](previews/home-concept-size.png), untuk perbandingan komposisi; screenshot QA utama mengikuti viewport yang diminta pengguna.

Konsep ImageGen hanya eksplorasi arah. Brief dan gambar pengguna tetap sumber desain utama. Review memakai view_image atas konsep/referensi dan hasil render; implementasi mengikuti arah referensi dengan deviasi disengaja berikut, bukan klaim salinan pixel-identik.

| Titik perbandingan | Bukti dan keputusan |
| --- | --- |
| Struktur | Referensi kedua: sidebar kiri dan grid kanan. Render mempertahankan struktur itu, maksimum tiga kolom, tanpa toko/harga/rating palsu |
| Hero dan copy | Referensi pertama/brief: hero navy, judul dan Explore Games. Copy utama sesuai brief, line break dua baris disengaja; CTA membuka katalog. Tidak ada branding Orbit |
| Palet dan typography | Background #0F1014, surface #1B1D24, hero #142744, blue #2978CD sesuai brief; font sistem lokal sebagai pilihan ringan, bukan font konsep yang harus diunduh |
| Card dan media | Frame thumbnail, dimensi, topik dan status konsisten; foto/screenshot referensi diganti SVG orisinal sesuai preferensi pengguna. Preview bukan klaim gameplay |
| Spacing/responsive | Sidebar 188 px dan gap 30 px pada desktop; tablet dua kolom; mobile satu kolom. Filter mobile awal membungkus baris, diperbaiki agar tiga kontrol muat pada 375 px |
| State dan motion | Hover ringan, focus visible dan reduced motion. Mode detail berlabel Direncanakan. Tidak meniru tombol Explore Games berulang pada konsep karena card sendiri menuju detail |

Above-the-fold copy diperiksa: brand dan navigasi Home/Games/About, judul brief, deskripsi platform, CTA Explore Games, Game Library dan kontrol filter. Deskripsi Inggris serta catatan sidebar Indonesia adalah copy produk yang disengaja; tidak ada hero eyebrow atau klaim game sudah playable. Palet/struktur/card/responsiveness telah diverifikasi terhadap arah referensi; asset vektor dan komposisi hero dua baris adalah deviasi terdokumentasi.

## Skills, plugin dan MCP

- Empat skill existing divalidasi sebelum perubahan. Skill kelima `.agents/skills/game-performance-optimizer` dibuat dengan YAML, metadata UI, workflow, checklist dan kriteria keberhasilan. `node tools/check-skills.mjs` lulus untuk kelima skill. Discovery otomatis skill baru belum diasumsikan sebelum host memuat katalog ulang.
- Game Studio dan Build Web Apps 0.1.2 verified installed/enabled melalui CLI; skill keduanya juga tersedia pada katalog sesi aktif. Tidak dipasang ulang.
- Playwright MCP: `node tools/audit-browser.mjs` lulus initialize, 25 tools, navigation/evaluate/close, WebGL 1/2 readback serta WASM. Diulang sesudah penambahan DevTools untuk memeriksa coexistence.
- Chrome DevTools MCP resmi dari [Google/ChromeDevTools](https://github.com/ChromeDevTools/chrome-devtools-mcp) dipasang isolated tooling. `node tools/audit-devtools.mjs` lulus initialize, 33 tools, new_page dan evaluate_script pada Chrome 157 headless terisolasi. Config dibaca enabled oleh `codex mcp get chrome-devtools --json`. Usage statistics dan CrUX dinonaktifkan lewat opsi resmi; browser security tetap aktif. Tidak ada GitHub MCP atau MCP tambahan lain.
- Konfigurasi project `.codex/config.toml` tetap ignored karena absolute path lokal; template serta setup script diperbarui. Koneksi diuji melalui client stdio ke server sebenarnya; kemunculan native MCP tools pada sesi baru belum diklaim.

## Error dan perbaikan

1. ESLint 10/TypeScript 7 adalah stable tetapi beberapa peer dependency transitif belum kompatibel. Didiagnosis melalui npm ls, lalu dipin ESLint 9.39.5/TypeScript 5.9.3; lint/typecheck/build lulus. **ESLint 9 memberi peringatan dukungan upstream berakhir**; tinjau upgrade saat seluruh config/plugin lint mendukung ESLint 10. Tidak memaksa override peer.
2. Lint awal belum menemukan folder tests karena suite belum ditulis. Suite dibuat dan cek lint diulang sukses.
3. Path entrypoint Chrome DevTools versi lama tidak cocok dengan paket 1.13.0. Launcher sekarang membaca bin dari manifest paket resmi. Panggilan evaluate_script awal kurang pageId; schema tool diperiksa dan ID halaman selected dari new_page dipakai. Audit ulang lulus.
4. Next build menambahkan allowJs yang disarankan ke tsconfig. strict tetap aktif. Tidak mengubah kode pengguna yang sudah ada.
5. Python validator skill lama membutuhkan PyYAML. Tetap memakai parser YAML penuh serta schema checks Node yang sudah tersedia; tidak mengklaim quick_validate.py resmi sudah lulus.
6. Audit akhir menemukan karakter Windows-1252 tercampur UTF-8 pada tiga dokumen yang diedit lewat Python Windows. Dinormalisasi ke UTF-8; pemeriksaan ulang encoding, whitespace, fence, 36 tautan lokal, JSON dan TOML lulus.

## Git, tindakan manual dan kesiapan

Identitas lokal royan902 dengan email noreply yang telah diotorisasi sudah tersedia; tidak diubah. Branch pekerjaan `codex/phase-2-platform`, checkpoint lokal berpesan `feat: build phase 2 physics game catalog platform`. Lihat git log untuk SHA aktual setelah checkpoint. Tidak ada push/deploy; main remote tetap checkpoint Fase 0–1.

Tidak ada tindakan manual yang menghalangi penggunaan website lokal. Muat ulang Codex jika skill/MCP baru belum muncul. Jika server sudah berhenti: jalankan npm ci, npm run build, lalu npm run start; development memakai npm run dev. Edge harus tersedia untuk konfigurasi E2E saat ini.

**SIAP Fase 3**: website dan routing sudah menjadi fondasi integrasi Billiard 3D. Model/benchmark fisika masih rencana; pilih engine stable dan jalankan spike, numerik, lifecycle dan QA game sebelum menyebut gameplay siap.
