# Blueprint produk

## Tujuan

Physics Game Lab menghubungkan bermain dengan eksperimen fisika yang dapat dijelaskan. Pengguna bisa mencoba tantangan, lalu mengubah parameter, melihat besaran SI, dan mengulang kondisi awal. Targetnya browser modern pada HP, laptop, dan PC. Bahasa antarmuka MVP: Indonesia.

## Portofolio dan batas MVP

| Game | Game Mode MVP per game | Simulation Mode MVP per game | Enhancement |
| --- | --- | --- | --- |
| Billiard Physics — 3D, pertama | Meja latihan, cue ball + 3 target, masukkan target dengan jumlah pukulan minimum | Atur massa bersama, restitusi bola/bantalan, hambatan gulir; lihat kecepatan, momentum dan energi | Aturan 8-ball, lawan AI, spin, cloth lebih realistis |
| Golf Physics — 3D | Satu hole pendek dengan putt di green datar | Ubah massa, hambatan dan kekuatan; lihat jarak berhenti | Chip, angin, bukit, banyak hole |
| Rocket Landing — 2D | Satu lander, satu pad, bahan bakar terbatas | Ubah gravitasi, thrust dan fuel; lihat gaya, kecepatan, sudut | Level angin, terrain, optimasi kontrol |
| Cannon Physics — 3D | Tembak target diam pada bidang datar | Sudut, azimut, kecepatan, gravitasi; bandingkan lintasan ideal | Drag, angin, target bergerak, tampilan 2D tersinkron |
| Ramp Race — 3D | Dua bola padat turun pada jalur lurus sejajar | Ubah massa, radius, kemiringan dan gesekan; lihat energi/waktu | Bentuk benda berbeda dan track kompleks |

Kelima baris adalah MVP bertahap, bukan scope rilis pertama. Rilis pertama yang dapat dimainkan hanya Billiard beserta kedua mode. Katalog dapat menunjukkan empat game lain sebagai “Segera hadir” tanpa tombol bermain yang menyesatkan.

## Mode dan alur

Status Fase 3: Billiard memiliki lima level Pocket Challenge (1–3 target, batas pukulan per level) dan lima eksperimen. Empat game lain masih roadmap. Penjelasan MVP umum di bawah tetap menjadi arah produk; implementasi Billiard aktual dirinci pada PHASE_3_REPORT dan PHYSICS_SPEC. Bank Shot mengajarkan rute bantalan tetapi tidak memaksakan jenis pukulan; urutan level dapat dipilih untuk latihan.

Game Mode memakai preset terkunci, tujuan jelas, skor lokal satu sesi, restart, pause/resume, dan keadaan menang/gagal. Simulation Mode memakai kernel yang sama, kontrol parameter berlabel satuan, reset, pause, single-step, dan pembacaan telemetry. Perubahan parameter saat pause memerlukan reset eksplisit sebelum run baru agar perbandingan tidak mencampur kondisi.

Alur utama: katalog → pilih Billiard → pilih mode → baca kontrol singkat → mulai → bidik/atur daya → tembak → tunggu semua bola diam → ulangi atau reset. Pergantian mode mereset sesi dengan keterangan bahwa skor/eksperimen sesi dimulai ulang. Tidak perlu modal konfirmasi untuk setiap reset biasa.

Aturan latihan Billiard: satu pukulan hanya saat semua bola aktif diam; target di pocket menambah hitungan; cue ball masuk pocket = scratch, satu penalti dan respawn pada posisi awal bebas setelah bola lain diam. Jika terhalang, cari posisi legal pada area awal; jangan spawn tumpang tindih. Skor ditampilkan sebagai pukulan + penalti, lebih kecil lebih baik; selesai saat semua target masuk pocket.

## Non-goals rilis awal

Tidak ada akun, backend, database, pembayaran, multiplayer, leaderboard online, editor level, analitik pihak ketiga, asset berbayar, atau simulasi setara laboratorium presisi. AI adalah alat pengembangan, bukan layanan API di dalam game. Penyimpanan lokal opsional untuk preferensi saja; hasil sesi tidak wajib bertahan setelah reload.

## Kriteria penerimaan rilis Billiard

- Katalog, instruksi, kedua mode, reset dan pause dapat dipakai dengan pointer/touch dan kontrol keyboard yang setara.
- Bola bertumbukan, memantul di bantalan, melambat, masuk pocket, dan memicu hasil secara konsisten dengan spesifikasi.
- Simulation Mode menyatakan asumsi model dan unit; perubahan parameter dibatasi nilai valid dan reset dapat mengulang kondisi.
- Keadaan loading, gagal memuat physics, serta WebGL tidak tersedia mempunyai pesan yang dapat ditindaklanjuti.
- Gate pengujian dan target performa di [TESTING.md](TESTING.md) dievaluasi dengan bukti. Rilis dibatasi perangkat yang benar-benar diverifikasi.
