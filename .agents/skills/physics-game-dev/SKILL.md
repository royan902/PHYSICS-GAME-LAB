---
name: physics-game-dev
description: "Implementasikan gameplay, lifecycle sesi, render 3D R3F atau 2D Phaser, serta integrasi physics Physics Game Lab. Gunakan untuk fitur game, kedua mode, kontrol dan aturan skor."
metadata:
  short-description: "Gameplay dan runtime Physics Game Lab"
---

# Physics Game Dev

## Konteks

Baca `AGENTS.md`, `docs/BLUEPRINT.md`, `docs/ARCHITECTURE.md`, dan bagian game terkait di `docs/PHYSICS_SPEC.md` dari root repo. Billiard menjadi prioritas pertama. Scope perencanaan tidak memberi izin membuat gameplay. Jangan menambahkan engine kedua untuk sebuah world karena renderer memilikinya secara bawaan.

## Workflow

1. Tentukan loop pengguna, aturan menang/gagal, state sesi dan fixture yang membuktikan perilaku. Batasi pada game/fase yang diminta.
2. Pisahkan command input, session/rules, kernel/adapter, snapshot/event, dan renderer. Untuk fitur kecil, perluas modul yang ada; jangan membangun framework lima game sekaligus.
3. Gunakan SI dan fixed tick dari spesifikasi. Satu pemilik step; impulse sekali per command; force sesuai durasi tick; interpolasi hanya di renderer. Jangan menyamakan Phaser ms dengan detik physics.
4. Game Mode dan Simulation Mode berbagi kernel, config dan rules yang relevan. Perubahan parameter di Simulation Mode diberlakukan melalui pause/reset policy, bukan mutasi tersembunyi saat solver berjalan.
5. Implementasikan lifecycle lengkap: loading, ready, run, pause, hasil/error, reset dan dispose. Kosongkan input pada blur; jangan menambahkan tick besar setelah tab kembali aktif.
6. Verifikasi aturan kritis, integrasi engine asli dan alur input. Bila model berubah, gunakan workflow `physics-validation`; untuk browser/device gunakan `web-game-qa` sesuai kebutuhan, tanpa mewajibkan tool yang tidak tersedia.

## Checklist

- [ ] Shot/command tidak ganda; input ilegal ditolak sesuai state.
- [ ] Event pocket/impact/finish dideduplikasi sebelum skor dan hasil.
- [ ] Reset menghapus counter, world lama, listeners dan input aktif.
- [ ] Snapshot menentukan visual dan HUD, bukan sebaliknya.
- [ ] Model sederhana serta asumsi dijelaskan, termasuk Billiard tanpa spin.
- [ ] Tidak ada backend, AI lawan atau enhancement terselip ke MVP.

## Kriteria keberhasilan

Satu loop gameplay yang diminta dapat diselesaikan dan direset, kedua mode tetap konsisten pada config yang sama, invariant fisika/aturan teruji sesuai fase, serta renderer dan resource bersih setelah unload. Laporkan bukti aktual dan bagian yang belum diverifikasi.
