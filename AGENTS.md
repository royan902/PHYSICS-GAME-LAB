# Aturan Codex — Physics Game Lab

## Konteks dan sumber keputusan

- Baca `docs/README.md`, dokumen yang relevan dengan tugas, dan status Git sebelum mengubah berkas. Pertahankan perubahan pengguna.
- Bahasa komunikasi dan dokumentasi utama: Indonesia. Identifier kode: bahasa Inggris, istilah SI konsisten.
- MVP lebih dahulu. Billiard Physics 3D adalah game pertama; lima game tetap ada di roadmap, bukan dikerjakan sekaligus.
- Fase 0 hanya dokumentasi dan skill. Jangan membuat website/gameplay atau memasang dependency dalam tugas Fase 0. Implementasi dimulai saat pengguna memberi tugas fase berikutnya.
- Fase 1 terbaru hanya Development Environment Setup: scaffold Next.js, library aplikasi/game, dan gameplay ditunda ke Fase 2. Tools audit/MCP terisolasi boleh dipasang.
- Fase 2 final hanya Website Platform MVP: Home, Games, detail dan About. Billiard playable, physics spike, Three/R3F/Rapier dan model simulasi dimulai pada Fase 3. Jangan push/deploy pada tugas Fase 2; checkpoint lokal diizinkan.
- Rencana dalam dokumentasi bukan bukti implementasi. Tandai dengan jelas keputusan, asumsi, target, hasil pengukuran, dan pekerjaan tertunda.

## Batas perubahan

- Batasi perubahan pada workspace. Instalasi tools di luar workspace hanya jika memang diperlukan untuk tugas fase berikutnya dan berada dalam otorisasi pengguna.
- Jangan menghapus/menimpa data pengguna, melakukan reset/clean destruktif, force push, mengubah kredensial, atau memublikasikan tanpa otorisasi yang sesuai.
- Keputusan teknis rutin yang reversibel dikerjakan mandiri. Tidak perlu meminta izin ulang untuk tindakan yang sudah tercakup instruksi pengguna.
- Jangan memasukkan secret, `.env` berisi nilai rahasia, token, atau data pribadi ke Git. Jangan membaca/mencetak secret yang tidak relevan.
- Tidak perlu memasang plugin/MCP jika shell, dokumentasi resmi, dan tool lokal cukup. Jangan mengasumsikan suatu koneksi tersedia.

## Arsitektur

- Ikuti `docs/ARCHITECTURE.md`. Next.js App Router + TypeScript strict + Tailwind untuk shell; Three.js melalui R3F untuk 3D. Phaser baru masuk saat game 2D dibutuhkan.
- Pilih versi stable yang kompatibel saat implementasi dan simpan lockfile. Jangan memakai alpha/canary atau menambahkan library tanpa kebutuhan konkret.
- Pengecualian tooling Fase 1: paket resmi @playwright/mcp@0.0.86 membawa Playwright alpha upstream; hanya pada tools/environment dengan lockfile dan audit MCP. Bukan dependency aplikasi atau dasar versi game; evaluasi ulang saat upgrade.
- Physics state adalah sumber kebenaran. Renderer tidak menentukan hasil fisika atau skor. Game Mode dan Simulation Mode menggunakan kernel serta preset yang sama.
- Satu pemilik physics stepping dan satu solver per world. Jangan menjalankan auto-step wrapper bersamaan dengan manual step atau menerapkan gaya yang sama dua kali.
- Unit internal SI, sumbu Y ke atas, fixed timestep, input berbasis tick. React state tidak diperbarui untuk setiap objek setiap frame.
- Akses DOM/WebGL/Phaser/WASM hanya di batas client yang sesuai. Pastikan cleanup world, event, RAF, canvas, serta resource GPU saat route berubah.
- Jangan membuat monorepo, backend, multiplayer, ECS, worker, atau abstraction framework umum sebelum kebutuhannya terukur.

## Workflow dan kualitas

1. Tentukan ruang lingkup, acceptance criteria, dan dokumen yang menjadi rujukan.
2. Gunakan skill yang cocok di `.agents/skills/`; baca `SKILL.md` terkait. Jangan memuat semua skill tanpa alasan.
3. Implementasikan perubahan terkecil yang memenuhi tugas; perbarui spesifikasi bila keputusan berubah.
4. Jalankan pemeriksaan yang relevan dan benar-benar tersedia, mengikuti `docs/TESTING.md`. Jangan mengklaim tes/build/device QA yang belum dijalankan.
5. Review diff dan status Git; catat hasil, keterbatasan, dan tindak lanjut. Ikuti checkpoint `docs/GIT_WORKFLOW.md`; jangan stage berkas yang tidak terkait.

Untuk fisika, tulis asumsi dan satuan, tetapkan toleransi sebelum menilai hasil, dan bandingkan dengan solusi analitik bila tersedia. Jangan sekadar menguji bahwa fungsi mengembalikan hasilnya sendiri. Untuk UI, dukung touch, keyboard, loading/error, ukuran kecil, focus, serta fallback tanpa WebGL. Jangan menyebut emulasi browser sebagai pengujian HP fisik.

## Definition of done

Perilaku sesuai acceptance criteria; cek relevan lulus atau hambatan dilaporkan; tidak ada perubahan di luar scope; dokumentasi konsisten; status Git dan risiko tersisa jelas. Jangan mengklaim commit, push, deployment, atau aktivasi skill hanya karena berkasnya sudah dibuat.
