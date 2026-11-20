# Fase 3 — acceptance dan keputusan

Audit 20 November 2026: baseline `8ba2b75`, website Next.js 16.4.6 / React 19.3.1. ZIP laporan Fase 2 untracked adalah data pengguna dan tidak disentuh. Identitas Git lokal valid. Lima skill proyek dan Game Studio (R3F, playtest) dibaca. Tidak membuat ulang aplikasi.

Urutan gate: (1) kernel + oracle headless; (2) rendering dan input; (3) aturan lima level; (4) eksperimen dengan kernel sama; (5) produksi, E2E, screenshot, pengukuran. Status Playable hanya setelah gate gameplay lolos.

Keputusan: solver disc khusus TypeScript menggantikan rencana Rapier untuk Billiard. Satu world XZ, translasi tanpa spin, fixed 1/120 s, continuous collision detection (time of impact) antardisc, segmen bantalan, jaw dan disk pocket. Tidak perlu rigid-body WASM/gravitasi 3D untuk bola yang dikunci pada bidang. Render R3F terpisah; tidak menentukan hasil. Risiko: bukan solver rigid-body umum; kontak simultan diselesaikan berurutan deterministik, tanpa model deformasi/spin/throw/jump.

Toleransi sebelum pengujian: momentum 1%, energi ideal 2%, restitusi 2% + 0.01 m/s, jarak berhenti 2% + 0.005 m. Cadence berbeda dibandingkan pada tick sama. Input dibatasi 0–5 m/s, massa 0.10–0.30 kg, μ 0–0.08 untuk eksperimen (nol untuk fixture ideal), e 0–1. Kontrol eksperimen mereset world secara eksplisit.

Acceptance: katalog → Billiard → pilih mode → bidik/power → shoot hanya saat diam → tumbukan/pocket → hasil/reset/next; HUD berasal dari impuls aktual. Desktop dan emulasi touch portrait/landscape, pause/background, route leave, WebGL fallback; screenshot Canvas dan interaksi gameplay wajib. Tidak ada push/deploy.
