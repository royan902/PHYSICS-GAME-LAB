# Mendaftarkan game

Game Newton memakai root `/embedded-games/<slug>/index.html` yang juga didukung validator dan header sandbox. Gunakan `layout: "immersive"` untuk HUD yang membutuhkan tinggi viewport; contoh aktual ada pada tiga entri Newton. Detail pemisahan: [NEWTON_INTEGRATION.md](NEWTON_INTEGRATION.md).

1. Pilih slug unik dan stabil, misalnya `pendulum`. Gunakan slug yang sama untuk folder game dan aset. Simpan kode native di `src/games/<slug>/`, build HTML5 beserta asetnya di `public/games-html/<slug>/`, dan thumbnail katalog di `public/images/`.
2. Tambahkan satu entri di `src/data/games.ts` dengan slug, judul, thumbnail lokal, dimensi, topik, deskripsi, konsep, dan `gameMode`. Isi `simulationMode` bila ada mode eksperimen. Gunakan `Coming Soon` atau `In Development` selama game belum siap dimainkan.
3. Pilih runtime dari opsi di bawah. Sebelum mengganti status menjadi `Playable` dan menambahkan `runtime`, periksa detail, player, input keyboard dan touch, aset, audio bila ada, fallback, serta cleanup saat keluar dari player. Jalankan pemeriksaan lokal di bawah. Entri `Coming Soon` dan `In Development` memakai metadata saja.

Contoh ketiga runtime ada di `src/games/registry-examples.ts`.

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

Jalankan `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, dan `npm run test:e2e`. Perbarui ekspektasi katalog jika game baru memengaruhi hasil pencarian atau filter. Uji juga URL `/games/<slug>` dan, untuk game Playable, `/games/<slug>/play`.

## Bekerja dalam tim

Mulai dari `origin/main` terbaru dan buat satu branch per game atau anggota. Kerjakan kode dan aset di folder game sendiri. Minta anggota lain meninjau perubahan registry, importer native, atau komponen bersama agar entri dan perilaku game mereka tetap terjaga.

```sh
git fetch origin
git switch -c game/pendulum origin/main
# Setelah membuat perubahan dan menjalankan pemeriksaan
git add src/data/games.ts public/games-html/pendulum/ public/images/pendulum.png
git diff --cached
git commit -m "feat: add pendulum game"
git push -u origin game/pendulum
```

Sesuaikan daftar file dengan game. Buka pull request ke `main` dan sertakan slug, status, runtime, hasil tes, serta langkah mencoba preview. Ikuti [workflow Git proyek](GIT_WORKFLOW.md) untuk review dan pemulihan.

Untuk mengambil pembaruan, commit pekerjaan yang sedang berjalan lalu jalankan `git fetch origin` dan `git merge origin/main` dari branch game. Jika ada konflik, periksa kedua versi dengan `git status` dan `git diff`. Gabungkan entri registry dari kedua sisi dan tanyakan perubahan komponen bersama ke pemiliknya jika maksud edit belum jelas. Stage file yang sudah diselesaikan, jalankan pemeriksaan, lalu `git merge --continue` dan push biasa. Bila perlu menunda resolusi, `git merge --abort` mengembalikan branch ke kondisi sebelum merge. Pertahankan riwayat branch bersama dan seluruh entri game milik anggota.

Rujukan: [sandbox iframe dan keterbatasan load/error](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe), [preview branch Vercel](https://vercel.com/docs/git).
