# Strategi pengujian

## Status

Fase 0 hanya memeriksa artefak perencanaan. Fase 1 terbaru dibatasi pada environment: Playwright MCP dan YAML parser dipasang terisolasi di tools/environment, dengan audit kemampuan browser/MCP. Vitest, Playwright Test aplikasi, aplikasi dan CI belum dibuat/dijalankan. Perintah di bawah adalah kontrak script Fase 2, bukan perintah yang sudah tersedia. Lihat PHASE_1_REPORT.md.

## Lapisan dan gate

| Lapisan | Alat rencana | Bukti dan kegagalan yang dicari |
| --- | --- | --- |
| Static | TypeScript `tsc --noEmit`, ESLint CLI | Type safety, boundary import, code errors |
| Unit | Vitest pada Node | Unit conversion, validasi config, accumulator, command sekali, state/score/reset |
| Integrasi physics | Vitest + engine WASM asli, headless | Oracle pada PHYSICS_SPEC, collision/pocket/CCD, tidak mengganti engine dengan mock |
| Integrasi runtime | Tes lifecycle terarah dan browser | Init sekali, dispose, remount, pause/background, error loading, mode parity |
| E2E | Playwright | Route reload, katalog → game, kontrol pointer/touch/keyboard, hasil sesi, reset, mode, console/page errors |
| Visual dan device | Playwright screenshot + pemeriksaan manual | Layout, focus, kontras, overlay, real touch/GPU; bukan oracle physics |
| Performance | DevTools dan instrumentasi frame/build | CPU/GPU frame time, network, memory dan kualitas pada perangkat tercatat |

Prioritaskan fungsi dan invariant yang berisiko: fixed-step, conservation, input idempotent, reset, pocket dedupe, resource cleanup. Jangan mengejar persentase coverage dengan tes implementasi yang tidak menguji perilaku. Coverage adalah diagnostik; setiap perubahan model harus punya fixture yang dapat mendeteksi regresi.

## Kontrak script Fase 2

```text
npm run dev          # development
npm run lint         # ESLint CLI, jangan mengasumsikan next lint tersedia
npm run typecheck    # tsc --noEmit
npm run test         # Vitest run, non-watch
npm run test:physics # subset integrasi/analitik physics
npm run build        # Next production build
npm run start        # serve production build
npm run test:e2e     # Playwright against production server
```

Gunakan Node stable LTS yang kompatibel dengan seluruh tool, commit lockfile dan pakai `npm ci` di CI setelah lockfile ada. Instal browser Playwright hanya pada fase implementasi. GitHub Actions kemudian menjalankan clean checkout → setup Node terpin → npm ci → lint/typecheck/unit/physics → build → browser install yang diperlukan → E2E. Simpan trace/screenshot/log kegagalan sebagai artifact dengan retensi terbatas; jangan memuat secret.

Awal Fase 2 memverifikasi fixture kernel minimum dan runtime spike sebelum gameplay. Fixture Billiard penuh menjadi gate Fase 2; fixture game lain aktif ketika fasenya dimulai. CI tidak boleh memberi status hijau untuk suite wajib yang kosong. Pre-merge gate: seluruh cek terkait perubahan; rilis juga memerlukan browser matrix penuh dan device QA. Cek yang belum dapat dijalankan harus dilaporkan sebagai belum terverifikasi, bukan lulus.

## Fixture physics

Gunakan kondisi, rumus dan toleransi [PHYSICS_SPEC.md](PHYSICS_SPEC.md). Tulis expected dari solusi independen, bukan dari snapshot keluaran implementasi yang sama. Record config/engine/dt/seed/ticks. Jalankan dunia ideal tanpa disipasi untuk conservation, dan dunia disipatif untuk batas energi tidak naik. Energy fixture dengan kontak harus diukur sebelum/sesudah kontak berakhir, bukan saat solver masih menyelesaikan overlap.

Regresi penting: kecepatan nol/tiny, power 0/100%, invalid/NaN input, collision miring, pocket simultaneous, cue scratch + target terakhir, respawn blocked, pause dalam shot, perubahan parameter/reset, tab tersembunyi, render cadence berbeda. Uji fixed-step cap dan backlog drop sesuai kontrak: bandingkan tick sama, bukan wall time saat overrun. Buat tes yang memang gagal bila variable-dt atau double-force diperkenalkan.

## Browser dan perangkat

Rencana Playwright projects: desktop Chromium 1440×900, Firefox 1440×900, WebKit 1440×900, mobile Chromium touch 390×844 dan mobile WebKit touch 390×844. Tambahkan resize 360×800 dan landscape 844×390. Jalankan Chromium smoke pada perubahan biasa; matrix penuh pada PR siap merge/rilis ketika fiturnya tersedia.

Emulasi tidak membuktikan GPU/touch/performa perangkat nyata. Sebelum rilis Fase 3, uji setidaknya Android Chrome kelas menengah, iPhone Safari, dan laptop/PC browser target. Catat model, OS, browser, viewport, kualitas, waktu pengujian dan hasil. Jika perangkat tidak tersedia, tulis keterbatasan dan jangan menyebut dukungan perangkat tersebut telah tervalidasi. WebKit Playwright tidak identik dengan Safari pada iPhone.

E2E memakai locator role/label untuk UI DOM; interaksi canvas memakai posisi relatif bounding box dan skenario terkontrol. Bila perlu test harness hanya development/test, expose command/snapshot minimal tanpa mengubah physics produksi; tes utama tetap membuktikan input pengguna. Hindari fixed sleep; tunggu state/condition dengan timeout. Floating render tidak diuji lewat pixel screenshot ketat lintas GPU.

## Target performa awal, belum diukur

- Adegan Billiard 4 bola, kualitas rendah di HP menengah: median ≥30 FPS dan p95 frame time ≤40 ms selama 60 s gameplay; desktop kualitas default: median ≥60 FPS dan p95 ≤25 ms. Catat overrun physics dan tab aktif.
- Batasi DPR awal HP ke maksimum 1.5, shadow sederhana/off pada low, tanpa postprocessing awal. Penurunan kualitas tidak mengubah model fisika.
- Target initial game-ready ≤5 s pada cold cache, jaringan uji 10 Mbps, RTT 100 ms; warmup engine termasuk pengukuran. Catat ukuran transfer JS/WASM aktual, hindari menetapkan estimasi bundle sebagai fakta.
- Ulang masuk/keluar route 10 kali: tidak ada canvas/RAF/listener/world aktif yang tertinggal dan tidak ada pertumbuhan resource GPU monoton setelah warmup. Memory browser bervariasi; gunakan jumlah resource dan profil, bukan threshold heap arbitrer.

Jika target gagal, profil penyebab → kecilkan kualitas/asset → ukur ulang. Jangan menaikkan toleransi fisika atau mengklaim performa hanya dari skor Lighthouse. Jika kelak budget perlu direvisi, catat perangkat, bukti, dan dampak UX.

Referensi alat: [Vitest](https://vitest.dev/guide/), [Playwright projects](https://playwright.dev/docs/test-projects), [GitHub Actions Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs).
