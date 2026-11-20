# Referensi resmi

Diperiksa melalui dokumentasi web pada **20 November 2026** untuk rencana Fase 0, kecuali baris yang ditandai untuk konsultasi berikutnya. Halaman dapat berubah; verifikasi ulang API dan versi saat Fase 1. Ringkasan adalah penjelasan keputusan proyek, bukan salinan manual.

| Sumber | Penggunaan |
| --- | --- |
| [Codex skills](https://developers.openai.com/codex/skills) (redirect resmi ke [Build skills](https://learn.chatgpt.com/docs/build-skills)) | `.agents/skills` untuk scope repository dan frontmatter SKILL.md |
| [Next.js installation](https://nextjs.org/docs/app/getting-started/installation) | Fondasi App Router, persyaratan environment |
| [Tailwind + Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs) | Integrasi styling saat scaffold |
| [R3F introduction](https://r3f.docs.pmnd.rs/getting-started/introduction) | Peran renderer, compatibility dan hindari alpha |
| [Three.js cleanup](https://threejs.org/manual/pages/cleanup.html) | Dispose GPU resource pada pergantian route |
| [Rapier integration parameters](https://rapier.rs/docs/user_guides/javascript/integration_parameters/) | Timestep, unit dunia, tuning solver |
| [Rapier CCD](https://rapier.rs/docs/user_guides/javascript/rigid_body_ccd/) | Kontak objek cepat, keterbatasan discrete stepping |
| [Rapier determinism](https://rapier.rs/docs/user_guides/javascript/determinism/) | Prasyarat reproducibility dan batas janji replay |
| [Rapier colliders](https://rapier.rs/docs/user_guides/javascript/colliders/) | Restitusi/friction dan combine rule; verifikasi API pada implementasi |
| [Phaser time](https://docs.phaser.io/phaser/concepts/time) | Renderer 2D punya clock sendiri; physics tick tetap dimiliki kernel |
| [Vitest guide](https://vitest.dev/guide/) | Unit/integration runner |
| [Playwright projects](https://playwright.dev/docs/test-projects) | Pembagian browser dan emulasi device |
| [GitHub Actions Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs) | Rencana clean install, build dan test CI |
| [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) | Target hosting fase rilis |
| [NASA flight equations with drag](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/flight-equations-with-drag/) | Pembanding konsep projectile dan drag enhancement |
| [NASA ideal rocket equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/) | Konteks massa berubah dan momentum exhaust; MVP bukan simulasi orbital |

Rumus mekanika, angka preset, batas input dan toleransi dalam PHYSICS_SPEC adalah kontrak awal proyek yang dijabarkan dari asumsi model; sumber engine tidak menyatakan bahwa preset tersebut realistis atau sudah tervalidasi.

Referensi lokal yang dibaca untuk authoring skill: skill sistem `skill-creator/SKILL.md`, `references/openai_yaml.md`, dan `scripts/quick_validate.py` pada instalasi Codex host. Tidak disalin atau dimodifikasi. Metadata memakai field yang didokumentasikan di panduan tersebut.

Referensi untuk konsultasi fase berikutnya, belum dipakai memvalidasi integrasi: [GitHub MCP](https://github.com/github/github-mcp-server), [Vercel MCP](https://vercel.com/docs/mcp), [Playwright MCP](https://github.com/microsoft/playwright-mcp). Tidak ada koneksi MCP baru dibuat.
