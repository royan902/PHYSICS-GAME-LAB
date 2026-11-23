# Git dan checkpoint

## Kondisi awal

Pada pemeriksaan Fase 0: repository lokal sudah ada, branch `main`, belum ada commit, tidak ada remote, working tree awal kosong. Jangan menjalankan `git init` ulang atau mengarang URL GitHub. Tidak ada push/PR/deploy yang dibuat dalam fase ini.

## Workflow

1. Mulai setiap tugas dengan `git status --short --branch` dan review perubahan yang sudah ada.
2. Untuk pekerjaan implementasi berikutnya gunakan branch `codex/<scope-singkat>`, misalnya `codex/phase-1-foundation`. Jangan mengganti branch bila mengganggu pekerjaan pengguna; worktree baru hanya bila diperlukan.
3. Perubahan kecil dan dapat direview; jalankan gate relevan; cek `git diff --check`, diff isi, dan daftar file termasuk untracked.
4. Stage dengan path eksplisit. Jangan `git add .` jika terdapat perubahan lain. Jangan commit secret, cache, artifact QA besar, dependency install directory atau file tidak terkait.
5. Commit lokal ketika checkpoint memang diminta/diotorisasi; jika belum, serahkan diff dan usulan pesan sebagai checkpoint siap commit. Jangan mengubah identitas global Git untuk memaksa commit berhasil.
6. Push/PR/merge/deploy mengikuti instruksi pengguna yang berlaku dan akses yang tersedia. Keberadaan tool bukan otorisasi publikasi.

## Checkpoint rencana

| Gate | Pesan commit usulan | Bukti minimum |
| --- | --- | --- |
| Fase 0 | `docs: establish phase 0 blueprint and project skills` | Dokumen dan metadata/link validation, tidak ada app/dependency |
| Fase 1 environment | `chore: prepare development environment and MCP audit` | Tool versions, skill YAML, MCP/WebGL dan ignore rules; commit hanya jika identitas tersedia |
| Fase 2 fondasi | `chore: scaffold validated web game foundation` | Lockfile aplikasi, lint/types/unit/build/smoke CI |
| Physics Billiard | `feat: add validated billiard physics core` | Oracle collision/drag/CCD dan reset |
| Billiard dua mode | `feat: complete billiard game and simulation modes` | E2E aturan/parameter/parity |
| Rilis Billiard | `release: prepare billiard browser MVP` | QA matrix, performa, preview dan known issues |
| Game berikutnya | `feat: add <game> validated MVP` | Benchmark dan kedua mode game terkait |

Pada branch tanpa commit, checkpoint awal belum punya parent untuk diff biasa. Review untracked secara eksplisit; setelah stage terotorisasi gunakan `git diff --cached` sebelum commit. Tag milestone bersifat opsional, setelah gate lulus dan commit tersedia; jangan membuat tag yang memberi kesan rilis telah terjadi.

Jika regresi ditemukan, pilih perbaikan commit baru atau `git revert` atas commit yang relevan sesuai scope. Jangan reset/clean untuk membuang perubahan pengguna. Jangan amend/rebase history bersama tanpa otorisasi. Catat SHA hanya jika commit benar-benar berhasil.
