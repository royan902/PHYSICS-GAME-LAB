---
name: web-game-qa
description: "Uji alur web game Physics Game Lab dengan Playwright, browser, pemeriksaan touch/keyboard, lifecycle dan performa. Gunakan untuk regresi UI, pengujian rilis dan reproduksi bug browser."
metadata:
  short-description: "QA browser, kontrol dan performa game"
---

# Web Game QA

## Konteks

Baca `AGENTS.md`, `docs/TESTING.md`, `docs/DESIGN.md`, dan acceptance criteria fase/game dari root repo. Playwright Test di repo adalah sumber regression suite; MCP/browser interaktif boleh membantu investigasi tetapi tidak menggantikan suite. Jangan menganggap tool/browser tersedia sebelum diperiksa.

## Workflow

1. Tentukan risiko dari diff atau bug: browser, viewport, input, mode, lifecycle, console, atau performa. Catat environment dan langkah reproduksi minimum.
2. Pakai script proyek yang ada. Jalankan static/unit/build gate terkait dahulu; E2E memverifikasi production server agar SSR/WASM asset path ikut diuji. Jangan menjalankan script yang belum dibuat seolah tersedia.
3. Uji katalog → game → aksi utama → hasil → reset serta pindah mode, pause/resume, reload, route leave/re-entry. Tambahkan error loading/WebGL, pointer cancel, tab background dan resize bila terkait perubahan.
4. Gunakan locator role/label untuk kontrol DOM dan koordinat canvas relatif bounding box. Tunggu kondisi/state, bukan sleep arbitrer. Ambil trace/screenshot/log untuk kegagalan; jangan membocorkan secret dalam artifact.
5. Jalankan browser matrix proporsional menurut TESTING.md. Periksa touch, keyboard/focus, viewport kecil, portrait/landscape dan zoom. Ukur performa hanya pada environment yang dicatat; emulasi bukan HP fisik.
6. Klasifikasikan blocker/major/minor, berikan langkah reproduksi dan bukti; perbaiki hanya dalam scope lalu ulang tes yang gagal/terdampak. Laporkan hasil aktual, skipped dan belum diuji secara terpisah.

## Checklist

- [ ] Tidak ada error console/page aplikasi yang tidak dijelaskan.
- [ ] Loading/error/fallback dapat dibaca dan kontrol tidak tertutup panel.
- [ ] Touch/pointer/keyboard serta scroll/pointer capture sesuai harapan.
- [ ] Reset/mode change tidak meninggalkan loop atau entity lama.
- [ ] QA numerik dilakukan lewat physics fixture, bukan pixel match.
- [ ] Hasil tidak menyebut CI/device/deployment lulus yang belum dijalankan.

## Kriteria keberhasilan

Acceptance criteria fase aktif lulus pada matrix yang diwajibkan, tidak ada blocker yang tidak dilaporkan, bukti dapat direproduksi, dan keterbatasan platform nyata jelas. Untuk Fase 0, hanya audit dokumen/metadata; jangan membuat aplikasi atau memasang Playwright demi menjalankan skill ini.
