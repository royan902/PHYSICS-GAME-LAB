# Fase 2 — Website Platform MVP

Instruksi pengguna Fase 2 menggantikan rencana fondasi/gameplay sebelumnya. Gameplay Billiard dipindah ke Fase 3. Pertahankan laporan Fase 0/1 sebagai riwayat.

## Scope dan penerimaan

- Next.js App Router, React, TypeScript strict, Tailwind dan ESLint; versi stable kompatibel, lockfile root. Tidak ada Three/R3F/Rapier/Phaser, backend atau database.
- Home dengan navbar, hero Discover Physics Through Play., tombol Explore Games, katalog lima game dan footer.
- /games memakai GameCard reusable dan typed registry; urutan Billiard, Golf, Rocket Landing, Cannon, Ramp Race. Billiard In Development, lainnya Coming Soon. Filter dimensi berfungsi.
- Detail dinamis setiap slug: preview, deskripsi, materi fisika, status, rencana kedua mode dan link kembali. Unknown slug memberikan 404. Tidak ada tombol play palsu.
- About menjelaskan tujuan dan status pengembangan.
- Thumbnail SVG orisinal lokal, asal asset jelas, dimensi stabil. Desktop maksimal 3 kolom, tablet 2, mobile 1; navigasi/focus/touch/reduced motion dan tanpa overflow.
- Validasi empat skill existing dan tambah game-performance-optimizer dengan metadata/workflow/checklist/success criteria.
- Verifikasi plugin aktif, Playwright MCP serta Chrome DevTools MCP resmi yang compatible. Tidak menambahkan GitHub MCP.
- Jalankan lint/typecheck/build, server lokal dan Playwright 1440/768/375 px. Periksa navigasi, semua detail, link, console dan overflow; simpan screenshot.
- Buat PHASE_2_REPORT.md dengan hasil aktual/limit dan kesiapan Fase 3. Checkpoint lokal jika identitas valid; jangan push atau deploy.

## Fase 3 berikutnya

Sebelum gameplay, pilih versi engine stable dan peer-compatible. Spike R3F/Rapier client/headless, fixed step SI, reset/dispose/fallback, kemudian meja cue + tiga target, shot/pocket/scratch dan dua mode bersama. Aktifkan Vitest/oracle fisika dan QA game sesuai PHYSICS_SPEC.md/TESTING.md. Angka fisika dokumen belum dibuktikan oleh tes website.
