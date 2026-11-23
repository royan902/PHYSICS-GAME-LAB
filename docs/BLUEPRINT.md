# Blueprint produk

## Tujuan

Physics Game Lab menghubungkan bermain dengan eksperimen fisika yang dapat dijelaskan. Pengguna bisa mencoba tantangan, lalu mengubah parameter, melihat besaran SI, dan mengulang kondisi awal. Targetnya browser modern pada HP, laptop, dan PC. Bahasa antarmuka MVP: Indonesia.

## Portofolio dan batas MVP

| Game | Game Mode MVP per game | Simulation Mode MVP per game | Enhancement |
| --- | --- | --- | --- |
| Billiard Physics — 3D, pertama | Classic 8-ball lokal 2 pemain, 16 bola, solid/stripe, foul dan ball-in-hand | Sandbox 16 bola, setup bebas, parameter SI, spin/elevasi/jump dan telemetry | Kalibrasi cloth, throw dan swerve lebih lengkap |
| Golf Physics — 3D | Satu hole pendek dengan putt di green datar | Ubah massa, hambatan dan kekuatan; lihat jarak berhenti | Chip, angin, bukit, banyak hole |
| Rocket Landing — 2D | Satu lander, satu pad, bahan bakar terbatas | Ubah gravitasi, thrust dan fuel; lihat gaya, kecepatan, sudut | Level angin, terrain, optimasi kontrol |
| Cannon Physics — 3D | Tembak target diam pada bidang datar | Sudut, azimut, kecepatan, gravitasi; bandingkan lintasan ideal | Drag, angin, target bergerak, tampilan 2D tersinkron |
| Ramp Race — 3D | Dua bola padat turun pada jalur lurus sejajar | Ubah massa, radius, kemiringan dan gesekan; lihat energi/waktu | Bentuk benda berbeda dan track kompleks |

Kelima baris adalah MVP bertahap, bukan scope rilis pertama. Rilis pertama yang dapat dimainkan hanya Billiard beserta kedua mode. Katalog dapat menunjukkan empat game lain sebagai “Segera hadir” tanpa tombol bermain yang menyesatkan.

## Mode dan alur

Revisi Fase 3 (21 November 2026): Classic menggantikan lima level Pocket Challenge. Simulation memakai rack dan kernel yang sama, tanpa giliran atau kondisi menang. Empat game lain tetap roadmap.

Game Mode memakai preset terkunci, tujuan jelas, skor lokal satu sesi, restart, pause/resume, dan keadaan menang/gagal. Simulation Mode memakai kernel yang sama, kontrol parameter berlabel satuan, reset, pause, single-step, dan pembacaan telemetry. Perubahan parameter saat pause memerlukan reset eksplisit sebelum run baru agar perbandingan tidak mencampur kondisi.

Alur utama: katalog → pilih Billiard → pilih mode → baca kontrol singkat → mulai → bidik/atur daya → tembak → tunggu semua bola diam → ulangi atau reset. Pergantian mode mereset sesi dengan keterangan bahwa skor/eksperimen sesi dimulai ulang. Restart, perubahan parameter, Choose Mode, dan Close Game memakai konfirmasi kehilangan progres.

Classic memakai aturan 8-ball WPA. Break dimulai di belakang head string dan memerlukan bola masuk atau empat bola objek berbeda mencapai bantalan. Break ilegal dan bola 8 saat break memberi pilihan kepada pemain yang berhak. Setelah break, pemain memilih bola dan pocket A–F atau menyatakan safety. Call legal saat meja terbuka menetapkan solid/stripe. Foul biasa memberi lawan ball-in-hand. Bola 8 harus masuk ke pocket yang dipilih setelah kelompok pemain habis. [Aturan WPA, bagian 4](https://www.wpapool.com/wp-content/uploads/2026/01/2026.01.02-WPA-Rules.pdf).

## Non-goals rilis awal

Tidak ada akun, backend, database, pembayaran, multiplayer online, leaderboard online, editor level, analitik pihak ketiga, asset berbayar, atau simulasi setara laboratorium presisi. AI adalah alat pengembangan, bukan layanan API di dalam game. Penyimpanan lokal opsional untuk preferensi saja; hasil sesi tidak wajib bertahan setelah reload.

## Kriteria penerimaan rilis Billiard

- Katalog, instruksi, kedua mode, reset dan pause dapat dipakai dengan pointer/touch dan kontrol keyboard yang setara.
- Bola bertumbukan, memantul di bantalan, melambat, masuk pocket, dan memicu hasil secara konsisten dengan spesifikasi.
- Simulation Mode menyatakan asumsi model dan unit; perubahan parameter dibatasi nilai valid dan reset dapat mengulang kondisi.
- Keadaan loading, gagal memuat physics, serta WebGL tidak tersedia mempunyai pesan yang dapat ditindaklanjuti.
- Gate pengujian dan target performa di [TESTING.md](TESTING.md) dievaluasi dengan bukti. Rilis dibatasi perangkat yang benar-benar diverifikasi.
