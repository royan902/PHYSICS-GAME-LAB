---
name: physics-validation
description: "Validasi persamaan, unit, integrator, collision dan hasil numerik simulasi Physics Game Lab terhadap oracle dan invariant. Gunakan saat mengubah model, solver, timestep, gaya atau parameter fisika."
metadata:
  short-description: "Validasi numerik dan model fisika game"
---

# Physics Validation

## Konteks

Baca `AGENTS.md`, `docs/PHYSICS_SPEC.md`, dan `docs/TESTING.md` dari root repo. Model MVP dapat sederhana selama asumsi dan batasnya jelas. Pisahkan kualitas visual, aturan game, dan validitas model fisika; screenshot bukan bukti conservation.

## Workflow

1. Identifikasi model dan observabel yang berubah, unit, sumbu, sumber gaya, integrator, dt, versi engine dan kondisi batas. Cari risiko double integration/double damping.
2. Turunkan expected independen: free fall, momentum/restitution, stopping distance, thrust hover, projectile atau rolling ramp sesuai game. Nonaktifkan gaya yang tidak relevan pada fixture ideal.
3. Tetapkan atol/rtol dan waktu evaluasi sebelum menjalankan tes, mengikuti PHYSICS_SPEC. Pada nilai mendekati nol gunakan atol; jangan membagi dengan expected nol.
4. Jalankan headless dengan engine asli untuk collision/integration; pakai seed, config, urutan body dan input tick tetap. Bandingkan hasil pada tick sama dan uji batas, NaN, reset serta repeatability.
5. Jika error melewati batas, periksa unit → initial overlap/collider → konfigurasi/force ownership → integrator/step → solver/CCD. Evaluasi dt lebih kecil untuk melihat convergence bila perlu. Jangan menaikkan toleransi hanya agar lulus.
6. Periksa mode parity, render cadence independence dan batas energi sesuai sumber/disipasi yang ada. Catat angka expected/actual/error, command serta keterbatasan dalam hasil kerja; revisi spesifikasi jika model berubah dengan alasan yang dapat direview.

## Checklist

- [ ] SI dan konversi derajat/ms/piksel hanya di boundary.
- [ ] Oracle tidak dihitung oleh fungsi produksi yang sedang diuji.
- [ ] Invariant cocok asumsi: energi tidak harus konstan pada drag/thrust.
- [ ] Collision diukur setelah pemisahan, crossing/landing memakai waktu event yang jelas.
- [ ] Toleransi dan jumlah tick tercatat; input/config dapat diulang.
- [ ] Determinism tidak diklaim lintas versi tanpa bukti.

## Kriteria keberhasilan

Semua fixture yang relevan memenuhi toleransi yang disepakati dan regression suite dapat mendeteksi kesalahan model terkait. Bila tool/model belum tersedia, hasilnya adalah review/tes yang direncanakan dengan status belum dijalankan, bukan validasi numerik lulus. Tidak memasang dependency pada Fase 0.
