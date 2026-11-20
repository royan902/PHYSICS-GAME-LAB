---
name: physics-web-dev
description: "Bangun atau ubah shell Next.js, UI responsif, routing, dan integrasi client runtime Physics Game Lab. Gunakan untuk pekerjaan web proyek; validasi model fisika memakai physics-validation."
metadata:
  short-description: "Fondasi web responsif Physics Game Lab"
---

# Physics Web Dev

## Konteks

Baca `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, dan kebutuhan fase aktif dari root repository. Skill ini berlaku pada fondasi web dan integrasi runtime, bukan otorisasi untuk mulai fase implementasi ketika tugas hanya perencanaan. Jangan memakai skill Sites/hosting untuk mengganti repo Next.js yang diminta.

## Workflow

1. Periksa status Git, package/lockfile dan route yang sudah ada. Tentukan acceptance criteria layar dan input sebelum mengubah kode.
2. Jika menambah tool, cek dokumentasi resmi dan peer dependency stable. Pilih dependency minimum; pertahankan satu package manager. Fase 0 tidak boleh memasang dependency.
3. Pertahankan shell/server dan game/client boundary: DOM/WebGL/WASM tidak diakses saat server import. Load engine hanya pada game terkait, sertakan loading/error/fallback.
4. Bangun kontrol DOM berlabel dengan touch dan keyboard. UI mengirim command ke sesi; tidak mengubah pose solver atau menggerakkan physics lewat React state tiap frame.
5. Pastikan resize, blur/background, route unload dan React remount melepas resource/listener/RAF dengan benar.
6. Jalankan lint, typecheck, build dan smoke browser yang relevan jika toolchain tersedia. Laporkan command dan hasil sebenarnya; perbarui docs jika boundary/versi berubah.

## Checklist

- [ ] Tidak ada perubahan pengguna yang tertimpa; scope fase dipatuhi.
- [ ] Layout 360 px, portrait/landscape, focus dan label berfungsi.
- [ ] Interaksi penting tidak hanya hover/drag tanpa alternatif.
- [ ] Server import aman; loading, error dan WebGL unavailable dapat dibaca.
- [ ] Perpindahan route tidak menggandakan loop atau resource.
- [ ] Engine game lain tidak masuk bundle awal tanpa kebutuhan.

## Kriteria keberhasilan

Acceptance criteria web terpenuhi, physics tetap dimiliki kernel, cek relevan lulus atau keterbatasan eksplisit, dan tidak ada dependency/hosting action di luar tugas. Untuk hasil akhir, sebut perubahan, cek yang dijalankan dan risiko tersisa; jangan menyebut device nyata lolos berdasarkan emulasi.
