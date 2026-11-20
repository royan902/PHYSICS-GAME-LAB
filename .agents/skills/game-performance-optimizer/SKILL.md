---
name: game-performance-optimizer
description: "Profil dan optimalkan FPS, WebGL/GPU, memori, pemuatan aset dan performa mobile Physics Game Lab ketika ada bottleneck terukur atau audit performa yang diminta."
metadata:
  short-description: "Profil FPS, GPU, memori dan aset mobile"
---

# Game Performance Optimizer

Baca AGENTS.md, docs/ARCHITECTURE.md dan docs/TESTING.md. Website katalog tidak memerlukan loop game atau WebGL. Jangan memasang engine atau framework profiler sebelum diperlukan.

## Workflow

1. Catat perangkat/browser, viewport, DPR, kualitas, cold/warm cache, durasi dan skenario yang dapat diulang. Ukur baseline sebelum mengedit.
2. Pisahkan network/decode/JS/main thread/GPU/physics. Ukur FPS median dan frame time p95, long tasks, resource GPU dan memori setelah warmup. FPS bukan ukuran website statis; gunakan loading/layout shift untuk katalog.
3. Perbaiki sumber biaya: aset lokal berukuran sesuai, lazy load di luar viewport, engine per route, batasi DPR/shadow di mobile; reuse geometry/material bila aman. Jangan mengubah physics dt/toleransi untuk menutupi bottleneck grafis.
4. Periksa ownership: satu RAF dan physics step; dispose world/GPU resource dan listener saat unmount. Bandingkan 10 siklus masuk/keluar setelah warmup; jangan menyamakan heap GC sementara dengan leak.
5. Ukur ulang skenario baseline, bandingkan hasil/biaya visual, jalankan regresi interaksi/fisika yang terdampak. Simpan bukti dan keterbatasan; emulasi mobile bukan perangkat fisik.

## Checklist

- [ ] Baseline dan sesudah perubahan memakai environment/skenario yang sama.
- [ ] Bottleneck CPU/GPU/network dibedakan dengan bukti.
- [ ] Asset loading tidak merusak layout atau konten utama.
- [ ] Tidak ada loop/listener/resource yang tertinggal.
- [ ] Kualitas rendah tetap menjaga model fisika yang sama.
- [ ] Tidak mengklaim FPS/device/perbaikan tanpa pengukuran.

## Kriteria keberhasilan

Bottleneck yang ditargetkan berkurang secara terukur, budget fase relevan tercapai atau batasnya dijelaskan, visual/interaksi/fisika tidak regresi. Laporkan angka aktual dan pekerjaan yang belum diuji. Untuk fase katalog, fokus biaya bundle, asset dan stabilitas layout; tidak mengarang benchmark gameplay.
