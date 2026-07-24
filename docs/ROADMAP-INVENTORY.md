# Roadmap Modul Inventory — Rangkuman Diskusi

> Dokumen ini merangkum hasil diskusi arah pengembangan modul Inventory BIS menuju
> aplikasi enterprise modern (konteks: perusahaan pertambangan & industri umum).
> Bersifat rekomendasi/roadmap — belum semua terimplementasi.

**Tanggal:** 2026-07-23
**Status:** Draft diskusi (belum di-breakdown jadi plan per fitur, kecuali yang ditandai)

---

## 1. Fitur Inti Modul Inventory

### 1.1 Operasional Inti
- **Pemindaian barcode/QR** — scan serial/tag langsung dari kamera HP saat serah terima atau retur, tanpa ketik manual.
- **Notifikasi stok minimum** — alert otomatis saat stok gudang di bawah threshold yang dikonfigurasi per produk.
- **Peminjaman aset (bukan serah terima permanen)** — status "Dipinjam" dengan tanggal kembali + reminder otomatis.
- **Mutasi antar gudang** — transfer stok dari gudang A ke gudang B dengan approval.

### 1.2 Visibilitas & Pelaporan
- **Dashboard stok real-time** — grafik pergerakan stok, aset per karyawan, utilisasi gudang.
- **Laporan umur aset** — berapa lama aset dipegang karyawan, kapan terakhir bergerak.
- **Audit trail lengkap** — riwayat setiap perubahan status serial number (siapa, kapan, dari mana ke mana).

### 1.3 Efisiensi Proses
- **Bulk retur/serah terima** — proses banyak karyawan sekaligus (mis. saat proyek selesai).
- **Template transaksi** — simpan kombinasi produk yang sering diserahkan sebagai template.
- **Approval workflow bertingkat** — untuk pengadaan/disposal aset bernilai tinggi.

**Prioritas tertinggi (konteks tambang):** pemindaian QR/barcode + notifikasi stok minimum + integrasi offboarding HR — ketiganya langsung mengurangi kehilangan aset di lapangan.

---

## 2. Hubungan Modul Inventory dengan Modul Lain

### 2.1 Integrasi dengan Facility Management
- **Aset terpasang di gedung/ruangan** — serial number bisa di-assign ke lokasi fisik (ruangan, lantai, gedung), bukan hanya ke karyawan. Cocok untuk AC, proyektor, CCTV, dll.
- **Pemeliharaan & jadwal servis** — tracking jadwal maintenance per aset (tanggal servis terakhir, berikutnya, vendor servis).
- **Disposal/penghapusan aset** — alur resmi untuk aset rusak/habis umur: pengajuan → approval → berita acara penghapusan.
- **Peta lokasi aset** — visualisasi denah gedung dengan posisi aset (berguna untuk audit fisik).

### 2.2 Integrasi dengan Access Rights / HR
- **Auto-revoke aset saat offboarding** — saat status karyawan berubah ke non-aktif, sistem otomatis flagging aset yang belum diretur dan notifikasi admin.
- **Batas kepemilikan aset per jabatan** — konfigurasi berapa unit/jenis aset yang boleh dipegang per posisi jabatan (mis. Manager → 1 laptop + 1 HP).
- **Approval berbasis hierarki** — pengajuan aset ke karyawan memerlukan approval atasan langsung (ambil dari struktur HR).
- **Laporan aset per departemen** — rekapitulasi nilai & jumlah aset yang dipegang per divisi/departemen.

**Prioritas tertinggi (konteks tambang):** auto-revoke saat offboarding + aset terpasang di lokasi fisik — keduanya langsung mengurangi aset hilang saat pergantian karyawan atau rotasi lokasi proyek.

**Kopling teknis:** HR↔Inventory saat ini via `karyawan_id`. Untuk facility, perlu `lokasi_id` pada `InvSerialNumber` sebagai alternatif `karyawan_id` (aset bisa terikat ke karyawan ATAU lokasi fisik).

---

## 3. Penanganan Kasus Khusus

### 3.1 Barang Rusak / Pergantian Aset
- **Alur pelaporan kerusakan** — karyawan/admin laporkan unit rusak → status serial berubah ke "Rusak" → masuk antrean review.
- **Permintaan pergantian** — dari laporan rusak, admin bisa langsung buat transaksi "Ke Karyawan" untuk unit pengganti + retur unit lama dalam satu alur.
- **Berita Acara Kerusakan** — PDF dokumentasi kondisi barang rusak sebelum disposal.

### 3.2 Retur Aset dari Facility Management
- Sama dengan retur karyawan, tetapi sumbernya adalah **lokasi fisik** (ruangan/gedung), bukan `karyawan_id`.
- Prasyarat: field `lokasi_id` pada `InvSerialNumber`.
- Alur: pilih gedung/ruangan → checklist aset terpasang → retur ke gudang.
- Dapat menggunakan kembali komponen `ReturAssetPicker` yang sudah dibangun untuk retur karyawan.

### 3.3 Koreksi Input Salah (Void / Amend)
- **Void transaksi** — batalkan transaksi yang **belum di-approve**, rollback stok otomatis.
- **Amend quantity** — untuk transaksi yang **sudah approve**, buat transaksi koreksi (Adjustment) dengan selisih + catatan alasan (tidak mengubah data historis).
- **Audit trail wajib** — siapa yang void/amend, kapan, dan alasannya.

### 3.4 Stock Opname
- Buat **sesi opname** per gudang (tanggal mulai–selesai).
- Admin input jumlah fisik per produk → sistem hitung selisih vs stok sistem.
- Hasil: laporan selisih (lebih/kurang) → approval → transaksi Adjustment otomatis untuk menyesuaikan.
- Selama sesi opname aktif, transaksi keluar gudang tersebut di-lock atau diberi warning.

---

## 4. Barang Consumable (Habis Pakai)

**Prinsip kunci:** consumable **tidak pernah "dipegang" karyawan seperti aset**, jadi **tidak ada disposal dari karyawan**. Begitu dikeluarkan dari gudang, langsung dianggap **habis/terpakai** — transaksinya adalah *konsumsi*, bukan *kepemilikan*.

### 4.1 Model Mental: Aset vs Consumable

| Aspek | Aset (ber-serial) | Consumable (mis. bolpoin) |
|---|---|---|
| Dikeluarkan ke | karyawan/lokasi (tetap "milik" mereka) | karyawan/divisi (langsung terpakai) |
| Tercatat per unit? | Ya, per serial | Tidak, hanya jumlah |
| Bisa diretur? | Ya | Tidak |
| Disposal? | Perlu alur disposal | Tidak perlu — sudah keluar = habis |

### 4.2 Alur Pengeluaran Consumable
1. Transaksi baru: `tipe: 'Keluar'`, `sub_tipe: 'Konsumsi'` (sub_tipe baru).
2. Pilih tujuan: **karyawan** ATAU **divisi/departemen** (penerima).
3. Pilih produk consumable + jumlah (mis. Bolpoin, 1 dos).
4. Saat approve → **stok gudang berkurang**, selesai. Tidak ada record kepemilikan yang perlu ditarik nanti.

### 4.3 Yang Dicatat (untuk pelaporan, bukan aset)
- Jejak distribusi: penerima (`karyawan_id` / `department_id`), produk, jumlah, tanggal — via tabel `inv_konsumsi` atau reuse transaksi detail.
- Kegunaan:
  - Laporan konsumsi per divisi/karyawan per periode.
  - Alokasi biaya per departemen.
  - Deteksi pemakaian tidak wajar (mis. 1 orang minta 50 dos bolpoin/bulan).

### 4.4 Jawaban: "Bagaimana disposal consumable dari karyawan?"
→ **Tidak ada disposal.** Consumable yang sudah diberikan otomatis dianggap terpakai saat pengeluaran. Yang dicatat hanya "divisi X menerima 1 dos bolpoin tanggal Y" untuk laporan. Karyawan tidak perlu mengembalikan apa pun, dan sistem tidak menunggu retur.

**Perbandingan:** laptop (aset) hilang dari daftar karyawan hanya lewat retur/disposal; bolpoin (consumable) langsung hilang dari gudang saat dikeluarkan — tidak pernah "nyangkut" di karyawan.

### 4.5 Implementasi (ringan)
- Flag `is_consumable` di produk.
- `sub_tipe: 'Konsumsi'` yang hanya mengurangi stok gudang + catat penerima.
- Laporan konsumsi per divisi/karyawan.

---

## 5. Prioritas Implementasi (Rekomendasi)

1. **Stock opname** — kebutuhan audit rutin paling mendesak.
2. **Void/amend transaksi** — mengurangi data kotor akibat salah input.
3. **Barang consumable** — banyak dibutuhkan perusahaan tambang (APD, alat tulis, dll).
4. **Retur dari facility** — setelah `lokasi_id` di-model.
5. **Alur kerusakan + pergantian** — pelengkap retur aset karyawan yang sudah ada.

---

## Catatan Status
- **Sudah diimplementasi:** Retur aset karyawan (A+B+C) — lihat `docs/superpowers/plans/2026-07-22-retur-aset-karyawan.md` (sudah merge ke `main`, PR #1).
- **Belum:** seluruh item pada dokumen ini masih tahap rekomendasi; perlu breakdown plan/spec per fitur sebelum eksekusi.
