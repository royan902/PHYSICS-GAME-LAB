# Mendaftarkan game

Registry ada di `src/data/games.ts`. Isi slug unik, judul, thumbnail lokal, dimensi, topik, deskripsi, konsep, dan `gameMode`. Isi `simulationMode` hanya jika game menyediakan mode eksperimen. `Playable` wajib memiliki `runtime`; `Coming Soon`/`In Development` tidak memiliki runtime. Contoh ketiga runtime ada di `src/games/registry-examples.ts` dan tidak tampil di katalog.

```ts
// Tambahkan ke metadata game yang sudah lengkap dan benar-benar siap dimainkan.
status: "Playable",
runtime: {
  kind: "external",
  src: "https://hosting-anda.example/game/",
  embed: false, // true hanya sesudah izin embed dan header hosting diperiksa
  aspectRatio: "16/9", // juga 4/3 atau 9/16
},
```

Detail otomatis tersedia di `/games/<slug>`, player di `/games/<slug>/play`. External selalu menyediakan tautan keluar dengan `noopener noreferrer`. Browser tidak bisa memastikan keberhasilan iframe lintas origin melalui `load`; bantuan dan tombol muat ulang tetap tersedia jika hosting menolak embed.

- **Native:** tambahkan ID pada union `GameRuntime` (`src/games/runtime.ts`) dan importer literal `dynamic(() => import("..."), { ssr: false })` di `src/components/game-player/native-games.tsx`. Adapter mengekspor komponen React tanpa props wajib. Default memakai toolbar player; `ownsShell: true` hanya untuk game yang mengelola layar immersive dan navigasi sendiri, seperti Billiard. Cleanup canvas, listener, audio, RAF, dan engine saat unmount menjadi tanggung jawab game.
- **HTML5:** simpan build di `public/games-html/<slug>/index.html` dan gunakan `runtime: { kind: "html5", src: "/games-html/<slug>/index.html", aspectRatio: "16/9" }`. Gunakan path aset relatif (`./assets/...`) atau base path build tersebut. Jangan gunakan `/assets` global. Tidak perlu memasang dependency engine build ke aplikasi.
- **Sandbox:** iframe hanya mengizinkan scripts dan fullscreen; `pointerLock: true` opsional. Tidak ada same-origin, popup, top navigation, kamera, mikrofon, atau lokasi. Header CSP juga melindungi HTML5 ketika URL dibuka langsung. Aset build lokal publik mendapat CORS `*` untuk module/fetch dari origin opaque; tidak boleh berisi secret. Storage/cookie dan sebagian library yang memerlukan origin normal tidak tersedia: gunakan hosting terpisah dan `embed: false` jika tidak kompatibel. Uji aset, input, audio setelah interaksi, dan mobile sebelum memberi status Playable.
- **Dependency:** native merupakan kode tepercaya yang direview dan harus cocok dengan versi React/engine aplikasi. Lazy loading memisahkan chunk, bukan menjamin isolasi versi atau keamanan kode native. Gunakan standalone/hosting terpisah untuk build atau dependency yang tidak kompatibel.

Verifikasi: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. Jangan mendaftarkan contoh atau build yang belum diuji sebagai game tersedia. Model, kontrol, kamera, audio, dan dua mode Billiard tidak diubah oleh integrasi ini.

Rujukan: [sandbox iframe dan keterbatasan load/error](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe), [preview branch Vercel](https://vercel.com/docs/git).
