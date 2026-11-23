# Integrasi Hukum Newton

Tiga game dipisahkan dari file pengguna `game_simulasi_3d_hukum_newton_1_3 (1).html` (SHA-256 `B34A9DB73A605A977F6BF05E1DD7C38D915CD26F1A3C18FA356E87DE448C42F2`). File sumber di Downloads tidak diubah.

| Game | Dokumen standalone | Player |
| --- | --- | --- |
| Bus Inertia | `/embedded-games/newton-first-law/index.html` | `/games/newton-first-law/play` |
| Gravity Gun | `/embedded-games/newton-second-law/index.html` | `/games/newton-second-law/play` |
| Action & Reaction | `/embedded-games/newton-third-law/index.html` | `/games/newton-third-law/play` |

Setiap folder memiliki `index.template.html` dan `game.js` dengan scene, state, input dan loop sendiri. Tidak ada `switchMode`, world atau DOM mode lain. Library grafis dan CSS bersama ada di `public/embedded-games/shared/`; tidak ada dependency pada game lain. `npm run build` menjalankan `tools/build-newton-html.mjs` untuk menghasilkan `index.html` mandiri dengan CSS/Three.js/game tertanam. Edit sumber/template lalu jalankan script tersebut untuk dev. Ini menghindari aset terblokir oleh Vercel Authentication ketika iframe memakai origin opaque; tidak mengubah sandbox/proteksi akses proyek. File distribusi HTML juga disimpan di Git agar bisa langsung disajikan secara statis. Three.js r128 mengikuti versi sumber, disalin lokal dari distribusi cdnjs dengan lisensi MIT upstream, terpisah dari Three.js aplikasi/Billiard. Tidak ada request CDN saat bermain. Thumbnail adalah screenshot scene asli yang dipisahkan.

Adapter HTML5 mendukung dua root build yang tervalidasi: `/games-html/` dan `/embedded-games/`. Header sandbox/CORS yang sama berlaku pada kedua root. Layout `immersive` memakai tinggi viewport agar HUD tidak terjepit pada mobile. Iframe dipasang setelah hydration untuk menghindari kehilangan event load. Halaman standalone memiliki fullscreen dan zoom; tombol kembali di dalam iframe disembunyikan karena player memiliki navigasi kembali sendiri. Tidak ada akses DOM parent, storage bersama atau pesan lintas frame.

Model edukatif sumber dipertahankan: bus memakai pegas-peredam tubuh, Gravity Gun menerapkan kecepatan impuls `(F/m) × 0.65` lalu perlambatan 3.2 m/s², meriam memakai faktor recoil visual dan lompatan gravitasi 18 m/s². Angka aksi–reaksi adalah ilustrasi, bukan solver konservasi momentum lengkap. Timestep variabel sumber (cap 0.05 s), damping per frame, dan kamera tetap dipertahankan untuk menjaga perilaku; jangan menganggapnya kernel numerik Billiard atau validasi ilmiah penuh. Parameter gaya, massa dan gerak tidak dituning dalam pemisahan ini.

Perbaikan integrasi: listener hanya untuk kontrol game terpilih, input dibersihkan saat blur/cancel/background, key repeat tidak menembak berkali-kali, reset membersihkan efek/pose tertinggal, resize mengubah aspect canvas, resource dibersihkan saat unload, fallback WebGL tersedia. HUD kecil dapat digulir; tombol tetap berukuran sentuh. Label 3D di luar layar disembunyikan dan area dokumen dikunci agar proyeksi label tidak memperbesar viewport mobile. Reduced motion mematikan transisi dan camera shake.

Uji: production build, unit registry/URL/sandbox, E2E standalone dan iframe pada desktop/tablet/mobile/landscape (kontrol, reset, F/m, aksi–reaksi, zoom, fullscreen, katalog dan tanpa request offsite), serta regresi Billiard dan katalog. Screenshot di `test-results/` tidak masuk Git. Emulasi mobile bukan QA HP fisik.

Hasil lokal 23 November 2026: lint/typecheck/build dan 40 unit test lulus; 36 E2E Newton, Billiard, dan platform lulus pada empat viewport. Tiga alur Newton mobile diuji ulang setelah penyesuaian framing portrait dan lulus. Framing portrait memperlebar pandangan tanpa mengubah orbit/input/fisika. Peringatan Chromium tentang prioritas `allow` terhadap `allowfullscreen` bersifat informatif; fullscreen berhasil diuji. QA HP fisik dan browser selain Edge/Chromium belum dilakukan.
