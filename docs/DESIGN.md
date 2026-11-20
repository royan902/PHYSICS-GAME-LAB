# Desain dan interaksi awal

Dark Gaming Modern yang tetap terbaca di layar kecil. Gunakan permukaan gelap, aksen cyan untuk tindakan utama, ungu untuk konteks eksperimen, serta label teks untuk status. Token usulan: background `#0B1020`, surface `#151D30`, text `#F1F5F9`, muted `#B8C4D9`, accent `#22D3EE`. Ini rancangan, bukan kontras yang sudah diuji. Uji kombinasi aktual sebelum dipakai; tombol cyan dapat memakai teks gelap.

Desktop: canvas pusat, HUD ringkas, panel parameter di samping. HP portrait: canvas di atas, kontrol utama selalu terjangkau, panel parameter dapat dilipat. Landscape didukung tanpa mewajibkan fullscreen atau orientation lock. Shell tidak horizontal-scroll pada viewport 360 px. Kontrol tetap terbaca pada zoom 200%.

Ukuran target sentuh awal ≥44×44 CSS px, focus terlihat, label input dan pesan kesalahan terkait, kontras teks normal ≥4,5:1 (teks besar ≥3:1), dan indikator kontrol ≥3:1 terhadap sekitarnya. Jangan mengandalkan warna saja. Hormati reduced motion untuk animasi UI; jangan mematikan simulasi fisika secara diam-diam.

Bidik dengan drag/pointer; daya lewat slider terpisah; tembak lewat tombol. Keyboard menyediakan ubah sudut, ubah daya, tembak, pause, dan reset melalui kontrol berlabel. Jangan memblokir scroll halaman kecuali interaksi aktif di area game; lepaskan pointer capture pada cancel, blur, atau unmount. Tidak ada kontrol penting yang hanya muncul saat hover.

Game Mode menunjukkan tujuan, jumlah target tersisa, pukulan dan penalti. Simulation Mode menunjukkan unit, kondisi awal, status pause, simulated time, dan telemetry angka; overlay vektor boleh ditambahkan setelah angka dasar benar. Penjelasan model menyebut bahwa parameter adalah perkiraan edukatif. Loading dan kegagalan engine memiliki retry/reset yang jelas. Tidak perlu chart library di MVP; grafik ditambahkan ketika membantu eksperimen tertentu.
