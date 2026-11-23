# Spesifikasi fisika awal

## Status dan konvensi

Dokumen ini kontrak model edukatif dan rencana validasi; angka tuning bukan konstanta material terukur. Semua nilai perlu kalibrasi pada implementasi. Tidak ada simulasi yang sudah dijalankan pada Fase 0.

Internal memakai meter, kilogram, sekon, radian, newton, joule. UI dapat menampilkan derajat, dikonversi sekali di boundary. 3D: X horizontal, Y atas, Z kedalaman; meja pada bidang XZ. 2D fisika: X kanan, Y atas; proyeksi Phaser membalik Y dan mengonversi meter ke piksel hanya saat render/input. Gravitasi default `(0, -9.81, 0)` m/s²; 2D `(0, -9.81)`. Waktu = tick × dt.

Model dasar: `F = m a`, `J = Δp = m Δv`, `p = m v`, `Ek = ½m|v|² + ½ωᵀIω`, `Ep = m g h`. Terapkan impulse sekali per command, force setiap tick sesuai lifetime. Integrasi pure translasi menggunakan semi-implicit Euler (`v += a*dt`, `x += v*dt`); adapter rigid body memakai integrator Rapier, jangan mengintegrasikan pose yang sama dua kali.

Baseline dt Billiard dan kontak cepat = 1/120 s; game lain mulai 1/120 s, boleh 1/60 s setelah benchmark baru lolos dan keputusan tercatat. [Rapier](https://rapier.rs/docs/user_guides/javascript/integration_parameters/) menyediakan pengaturan timestep; nilai proyek ini dipilih untuk evaluasi, bukan jaminan akurasi. Solver iterations mulai default engine; tuning hanya dengan fixture gagal dan profil biaya. Terapkan [CCD](https://rapier.rs/docs/user_guides/javascript/rigid_body_ccd/) pada bola/proyektil cepat sesuai kebutuhan, bukan ke semua objek tanpa pengukuran.

## Validasi numerik umum

Bandingkan dengan `|actual-expected| ≤ atol + rtol*|expected|`, norm Euclidean untuk vektor. Benchmark headless memakai kondisi ideal tanpa drag/damping/friction kecuali memang diuji; seed dan jumlah tick tetap. Toleransi awal di bawah adalah gate usulan sebelum kalibrasi, bukan hasil lulus. Perubahan toleransi harus punya alasan model/numerik, tidak sekadar membuat tes hijau.

Input harus finite; massa/radius >0, `g ≥0`, restitution `0..1`, friction `0..1` untuk preset MVP, waktu/force nonnegatif sesuai kontrol. Nilai di luar rentang ditolak dengan pesan atau dinormalisasi oleh policy eksplisit. Reset harus mengembalikan config, pose, seed, tick, event, skor, dan sumber input.

## 1. Billiard Physics — prioritas

### Implementasi revisi Fase 3 — Classic & Simulation

Kernel sphere kontinu double precision; SI, Y atas; radius 0.028575 m, meja 2.54 × 1.27 m, capture radius 0.065 m, rail gap 0.095 m. Default m=0.17 kg, rolling μ=0.01, sliding μ=5μ, e bola=0.95, e bantalan=0.8. Tuning edukatif, bukan pengukuran material. Kecepatan input sekarang **0–8 m/s**; preset power 100% untuk break. Batas lama 5 m/s menghasilkan break terlalu lemah pada rack 16 bola; fixture break default harus legal, tanpa melonggarkan aturan empat rail/pot.

Tick 1/120 s memiliki empat substep: setengah impuls kain/gravitasi → continuous time of impact XYZ bola-bola, rail/jaw XZ, bed dan capture → setengah impuls kain/gravitasi. Ball-ball memakai normal sphere 3D dan impuls `j=−(1+e)vrel·n/(1/m1+1/m2)`. Floor di y=r, bounce landing 0.25 jika kecepatan menurun >0.35 m/s, sisanya diserap. Rail dianggap rendah (pusat bola di atas r+0.055 m lolos); capture hanya bila pusat ≤r+0.018 m. Bola melewati batas luar meja +r, atau mendarat di luar bed tanpa masuk capture, menghasilkan event off-table. CCD sphere menjaga airborne collision; geometri rail/jaw vertikal disederhanakan. Kontak simultan berurutan, cap 64 event/substep dengan counter; bukan cluster solver eksak.

Impuls cue `J=m·8P/100`, bukan gaya Newton. Elevasi θ memberi `vh=8P/100 cosθ`, impuls menurun `vd=8P/100 sinθ`. Model bed rebound instan memberi `vy=0.35vd` hanya jika vd>0.35 m/s; elevasi tidak selalu jump. Prediksi tinggi `vy²/2g` adalah lintasan bebas sebelum benturan. Offset radial kontak dibatasi 0.65r, angular impulse `Δω=(r_contact×J)/I`, `I=⅖mr²`. J pada HUD adalah impuls stik, bukan net impuls stik+bed. Energi actual setelah pukulan memasukkan translasi serta rotasi.

Slip di kain `(vx+rωz, vz−rωx)`. Impuls tangensial dibatasi μ_slide·mg·dt dan effective mass `m/3.5`; mengubah translasi dan rotasi berpasangan. Saat rolling, deceleration μg dan ω mengikuti v/r. Spin vertikal mengalami hambatan μg/r. Rail mentransfer sidespin lewat impuls tangensial dibatasi 0.12|vn| dan massa efektif m/3.5. Tidak ada throw bola-bola, masse/swerve, deformasi, atau kalibrasi material. Mesh membaca quaternion kernel yang diintegrasi pada waktu event; tidak berputar sendiri ketika pause.

Semua bola aktif harus speed dan r|ω|<0.01 m/s, menyentuh bed, selama 30 tick sebelum snap nol. Pocket/off-table event dideduplikasi oleh active flag; rules menerima urutan event dan menyimpan first contact serta jumlah kelompok **sebelum** shot. Scratch/8 dievaluasi sesudah seluruh event, sehingga scratch bersama 8 tidak dapat menang. Placement menolak nonfinite, batas meja, capture radius+r, serta jarak antarbola <2r+0.0002 m.

Simulation memakai kernel, rack, input dan kamera yang sama; semua bola boleh diposisikan saat ready, termasuk bola yang sudah pocket. Parameter diterapkan lewat reset terkonfirmasi. m=0.1–0.3 kg, μ=0–0.08, e=0–1, cushion≤e bola. μ=0 sengaja memungkinkan gerak terus; reset/pause tetap tersedia. Telemetry momentum XYZ, energi translasi+rotasi, speed, angular velocity, dan posisi SI. Tanpa grafik tambahan.

Oracle baru: angular impulse cocok r×J/I (atol 1e−10); apex jump bebas dalam 0.002 m; airborne momentum Y memasukkan gravitasi; dissipation energi tidak naik >1e−9 J/tick; post-contact backspin dan respons sidespin rail teruji. Oracle konservasi, drag rolling, restitusi, enam pocket dan sweep 360 arah tetap berlaku. Fixture drag sekarang dimulai rolling (ωz=−vx/r), sesuai domain rumus `d=v²/(2μg)`. Cadence 30/60/120 dibandingkan pada shot yang tetap bergerak sampai tick 120.

### Rencana historis sebelum implementasi Fase 3 (bukan runtime aktual)

Rapier 3D, sphere collider, bantalan statis sederhana dan pocket sensor. Model MVP 2.5D: pusat bola tetap di Y = radius, translasi Y dikunci, rotasi dinamis dikunci; mesh boleh berputar untuk efek rolling visual tetapi tidak dianggap spin fisik. Gravitasi world boleh tetap default, namun benda meja yang Y-nya dikunci tidak menerima model gaya kontak lantai tambahan. Hambatan meja dibuat eksplisit; jangan menambahkan floor friction/damping sebagai gaya kedua. Tidak ada jump, masse, spin, atau klaim dinamika rolling lengkap.

| Parameter | Default usulan | Rentang Simulation Mode |
| --- | --- | --- |
| Area bermain | 2.54 × 1.27 m | Tetap di MVP |
| Radius semua bola | 0.028575 m | Tetap di MVP |
| Massa semua bola | 0.17 kg | 0.10–0.30 kg bersama |
| Restitusi bola | 0.95 | 0–1 |
| Restitusi bantalan | 0.80 | 0–restitusi bola |
| Koefisien hambatan efektif `μr` | 0.02 | 0.005–0.08 |
| Kecepatan awal hasil shot | 0–5 m/s | Daya 0–100%, linear terhadap kecepatan |
| Radius capture pocket | 0.045 m | Tetap, perlu tuning geometri |

Ukuran di atas adalah preset proyek, bukan spesifikasi turnamen yang diklaim tersertifikasi. Pada setiap tick bebas kontak, `v_new = v * max(0, 1 - μr*g*dt/|v|)` untuk speed >0. Ini hambatan efektif kecepatan konstan, bukan hukum rolling bola nyata. Gaya tidak membalik arah. Damping solver =0; gesekan tangensial bola/bantalan =0 pada baseline. Tetapkan restitution combine rule `Min` pada bola dan bantalan: bola–bola menghasilkan koefisien bola, bola–bantalan menghasilkan koefisien bantalan karena nilainya dibatasi tidak melebihi bola. Jika nilai bola diturunkan di bawah bantalan, UI menyesuaikan bantalan dengan penjelasan sebelum reset. Uji effective restitution per pasangan, jangan mengandalkan default engine.

Shot menerapkan `J = m*v_target*d` pada cue ball, `d` vektor unit pada XZ, satu kali di tick berikutnya. Daya nol tidak menambah pukulan. Tidak ada input shot selama moving. Diam: semua bola aktif speed <0.01 m/s selama 0.25 s simulated time; snap ke nol hanya dalam ambang ini, catat sebagai disipasi model. Clamp speed hanya sebagai batas input; jangan memotong hasil collision normal secara diam-diam.

Pocket menangkap saat pusat bola memasuki disk sensor pada bidang meja, bukan hanya karena menyentuh tepinya. Cocokkan gap bantalan dan sensor agar bola tidak diblokir collider sebelum masuk. Sensor event dideduplikasi per entity/tick; bola segera keluar dari active solver dan dihitung sekali. Kumpulan event tick diselesaikan sebelum evaluasi menang; scratch tetap diberi penalti bila cue dan target terakhir masuk pada tick sama. Respawn dan aturan skor mengikuti [blueprint](BLUEPRINT.md).

### Oracle dan acceptance

- Tumbukan 1D dua massa identik, `e=1`, tanpa hambatan: velocity bertukar, momentum relatif error ≤1%, energi ≤2%, diperiksa sesudah kontak terpisah. Fixture analitik awal `v1=1`, `v2=0` m/s menghasilkan `v1'=0`, `v2'=1`.
- Untuk massa umum: `v1' = ((m1-e*m2)*v1 + (1+e)*m2*v2)/(m1+m2)` dan `v2' = ((m2-e*m1)*v2 + (1+e)*m1*v1)/(m1+m2)` sepanjang normal; komponen tangensial tetap pada fixture tanpa gesekan.
- Pantulan bantalan normal tanpa hambatan: `vout_n = -e*vin_n`, rtol 2%, atol 0.01 m/s; energi tidak bertambah tanpa sumber.
- Hambatan bebas kontak: `t_stop = v0/(μr*g)`, `d_stop = v0²/(2μr*g)`, distance error ≤2% + 0.005 m. Oracle memakai kecepatan nol aktual; gate gameplay diam 0.25 s diuji terpisah.
- Shot speed maksimum pada sudut beragam tidak menembus bantalan; capture tidak ganda; reset dan respawn bebas overlap. Hasil tick harus konsisten pada render 30/60/120 FPS untuk jumlah tick dan command sama.

## 2. Golf Physics — 3D

MVP satu green datar, model putt memakai proyeksi bola dengan hambatan efektif seperti Billiard; bukan aerodinamika bola golf. Default usulan massa 0.0459 kg, radius 0.02135 m, `μr=0.04`, shot 0–4 m/s; massa UI 0.03–0.08 kg, `μr` 0.01–0.10. Capture hole bila pusat di radius 0.04 m dan speed ≤0.5 m/s; lebih cepat lewat tanpa capture (batas model harus dijelaskan). Fixture jarak berhenti mengikuti toleransi Billiard; mass independent distance untuk initial speed sama. Enhancement slope memakai model rolling dinamis baru, bukan menambahkan gravitasi horizontal ad hoc.

## 3. Rocket Landing — 2D

Phaser sebagai renderer/input, kernel pure TS untuk flight 2D dan deteksi kontak pad sederhana. Tidak perlu Rapier 2D untuk satu lander/pad datar. State: posisi, velocity, sudut `θ` dari +Y, angular velocity, massa fuel, dry mass. Thrust axis `(-sin θ, cos θ)` dengan rotasi positif berlawanan arah jarum jam pada koordinat X kanan/Y atas. `a = (T*u/m) + g`; `I*α = τ` untuk kontrol rotasi sederhana. Tidak ada atmosfer atau orbital dynamics pada MVP.

Preset: dry mass 100 kg, fuel 20 kg, thrust max 2000 N, fuel flow max 1 kg/s, throttle `0..1`, massa sesaat `m=dry+fuel`, `I=100 kg·m²` konstan sebagai penyederhanaan, torque kontrol maksimal ±100 N·m. Burn satu tick dibatasi sisa fuel; thrust dirata-ratakan berdasarkan fraksi burn tick. Jika fuel nol, thrust nol; tidak boleh massa negatif. Thrust sudah mewakili momentum exhaust; jangan menambahkan gaya `dm/dt*v` lagi.

Landing dievaluasi pada perpotongan pertama kaki dengan pad (interpolasi crossing), memakai velocity sebelum respons kontak. Berhasil jika kedua kaki berada dalam lebar pad, `|vy|≤2 m/s`, `|vx|≤1 m/s`, `|θ|≤5°`, `|ω|≤0.2 rad/s`; selain itu crash. Render frame tidak menentukan hasil. Range UI: g 1–20 m/s², thrust 1000–4000 N, fuel awal 0–50 kg; konfigurasi yang tidak bisa hover tetap sah dan diberi penjelasan.

Fixture: free fall 2 s tanpa thrust, y dari `y0+v0*t-½gt²`, atol 0.1 m; velocity atol 0.01 m/s. Hover ideal T=mg, fuel flow dinonaktifkan untuk fixture, residual speed ≤0.01 m/s setelah 5 s. Fuel consumption error ≤satu tick burn; uji crossing di tepi pad dan ambang kecepatan. Nilai gate landing adalah aturan game, bukan standar keselamatan pendaratan nyata.

## 4. Cannon Physics — 3D, proyeksi 2D opsional

Rapier 3D untuk proyektil dan target; integrasi free flight juga diuji headless. Default massa 1 kg, radius 0.05 m, `v0=20 m/s`, elevation 45°, azimuth 0°, tanpa drag/angin; UI massa 0.1–10 kg, speed 1–50 m/s, elevation 0–85°, azimuth ±180°, g 1–20 m/s². Launch `v = v0*(cosθ*cosφ, sinθ, cosθ*sinφ)`; visual laras mengikuti konvensi yang sama.

Oracle: `x=x0+vx*t`, `y=y0+vy*t-½gt²`, `z=z0+vz*t`. Untuk ketinggian awal dan akhir sama: `range=v0²*sin(2θ)/g`, `t_flight=2*v0*sinθ/g`. Posisi error ≤0.1 m setelah 2 s, range error ≤1% +0.05 m; gunakan interpolasi crossing ground, bukan tick sesudah benturan. Mass independent trajectory tanpa drag. Spawn di luar collider laras, CCD pada projectile, satu event impact per shot. Jika proyeksi 2D ditambah, pakai state world sama; tidak ada solver kedua.

Drag enhancement mengikuti model `Fd=-½ρCdA|v_rel|v_rel`, bukan default tersembunyi. Referensi fisika: [NASA flight equations](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/flight-equations-with-drag/).

## 5. Ramp Race — 3D

Rapier 3D dengan sphere dinamis dan rotasi aktif, ramp statis. Default dua bola padat, massa 1 kg, radius 0.1 m, slope 20°, panjang lintasan pusat massa 3 m, friction 0.5, restitution 0, tanpa rolling resistance. UI massa 0.1–5 kg, radius 0.05–0.15 m, slope 5–35°, friction 0–1. Inersia bola padat `I=(2/5)mr²`, center of mass konsisten collider, tidak ada drag visual yang mengubah hasil.

Ideal rolling tanpa slip: `a = g*sinθ / (1+I/(mr²)) = (5/7)g*sinθ`; `t_finish=sqrt(2L/a)`. Diperlukan gesekan statis ideal `μs ≥ (2/7)tanθ`. Rapier memakai pendekatan friction kontak, bukan pemisahan koefisien statis/kinetik; tetapkan model ini sebagai aproksimasi dan uji slip. `|v-rω|` sepanjang ramp ≤0.03 m/s pada fixture rolling, acceleration/time error ≤3%, total mechanical energy drift ≤3%. Kedua bola solid dengan radius/massa berbeda harus mendekati waktu sama pada ramp ideal dengan jarak pusat yang sama.

Friction nol memberi sliding: `a=g*sinθ`, spin tetap nol dari kondisi awal. Friction kecil boleh menghasilkan slip, jangan dibandingkan dengan oracle rolling. Finish saat pusat melewati garis akhir pada jarak L sepanjang ramp, interpolasi crossing. Peluncuran serentak pada tick yang sama; tie bila selisih ≤1 tick. Bentuk lain dan hambatan gulir menunggu enhancement beserta oracle baru.

## Reproduksibilitas dan batas model

Catat versi engine, dt, config, seed, urutan entity, input per tick, dan jumlah tick. [Rapier determinism](https://rapier.rs/docs/user_guides/javascript/determinism/) memiliki syarat kondisi awal/operasi; proyek menguji repeatability pada versi terkunci dan fixture lintas browser, tanpa menjanjikan replay bit-identik lintas versi/library atau hasil transcendental JS berbeda. Game Mode dan Simulation Mode pada config/input sama harus menghasilkan snapshot physics yang setara dalam toleransi.
