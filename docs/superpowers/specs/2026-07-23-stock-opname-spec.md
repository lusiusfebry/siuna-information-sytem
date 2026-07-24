# Spec: Stock Opname (Sesi Perhitungan Fisik Gudang)

> Sumber: `docs/ROADMAP-INVENTORY.md` §3.4 dan §5 (prioritas #1 audit rutin).
> Status: **Draft spec untuk review** — belum diimplementasi.
> Tanggal: 2026-07-23
> Bagian dari paket 3 fitur: [Consumable](2026-07-23-barang-consumable-spec.md), [Void/Amend](2026-07-23-void-amend-transaksi-spec.md), **Stock Opname (dokumen ini)**.

---

## 1. Latar Belakang

Perusahaan tambang & industri wajib melakukan **audit fisik gudang** secara berkala (bulanan/kuartalan). Saat ini BIS hanya mencatat stok sistem (`inv_stok.jumlah`) tanpa mekanisme membandingkannya dengan hasil hitung fisik. Selisih (barang hilang, rusak tak tercatat, salah input) tidak pernah terkoreksi secara terkontrol.

Stock Opname menyediakan alur resmi: buka sesi per gudang → input hitung fisik per produk → sistem hitung selisih vs stok sistem → approval → **transaksi Adjustment otomatis** untuk menyelaraskan stok.

Fakta teknis terverifikasi (kode existing):
- `sub_tipe: 'Opname'` **sudah ada** di ENUM `inv_transaksi_sub_tipe_enum` (`Transaksi.ts`) — tidak perlu migrasi ENUM baru untuk ini.
- `tipe: 'Adjustment'` sudah didukung `stok.service.ts` dan otomatis `requiresApproval` (baris 331-335).
- `applyTransaksiEffects` sudah menangani `Adjustment` (set stok ke nilai absolut atau delta sesuai payload).
- Migrasi terakhir = `67_seed_inventory_approve_permission.ts`. Consumable memakai 68, Void/Amend memakai 69, sehingga **Stock Opname memakai migrasi 70**.

---

## 2. Tujuan

- Membuat entitas **sesi opname** per gudang dengan siklus hidup jelas (Draft → Berjalan → Selesai/Dibatalkan → Approved).
- Input jumlah fisik per produk dalam sesi, hitung selisih otomatis vs stok sistem saat itu.
- Setelah di-approve, **generate transaksi Adjustment** otomatis untuk setiap produk yang selisihnya ≠ 0, menyelaraskan `inv_stok`.
- **Lock/warning** transaksi keluar dari gudang yang sedang punya sesi opname aktif, mencegah stok bergerak saat dihitung.
- Audit trail penuh (siapa buka/input/approve, kapan, snapshot stok sistem saat opname).

---

## 3. Di luar lingkup

- Perhitungan siklik (cycle counting) parsial per kategori — versi ini opname **penuh per gudang** (boleh subset produk yang dihitung, sisanya dianggap tidak dihitung).
- Rekonsiliasi nilai/harga (valuasi rupiah selisih) — hanya kuantitas.
- Opname lintas gudang dalam satu sesi — satu sesi = satu gudang.
- Barcode/QR scan saat opname (masuk roadmap terpisah §1.1) — versi ini input manual jumlah.
- Opname untuk serial number per-unit (verifikasi keberadaan tiap serial) — versi ini fokus **kuantitas produk non-serial & agregat**. Verifikasi serial per-unit menyusul (lihat §10).

---

## 4. Keputusan desain

1. **Snapshot stok sistem saat input, bukan saat buka sesi.** Selisih dihitung `jumlah_fisik − jumlah_sistem_snapshot`, dengan `jumlah_sistem_snapshot` diambil saat detail baris disimpan (bukan saat sesi dibuka), supaya mencerminkan stok terkini. Namun begitu sesi masuk status **Berjalan**, gudang di-lock (§4.4) sehingga stok tidak berubah selama penghitungan → snapshot stabil.
2. **Adjustment otomatis pakai delta, bukan set absolut.** Untuk tiap produk berselisih, buat 1 baris `inv_transaksi_detail` dalam **satu transaksi Adjustment** ber-`sub_tipe: 'Opname'`. Delta = selisih. Stok positif → tambah, negatif → kurang.
3. **Satu transaksi Adjustment per sesi** (bukan per produk), dengan banyak detail — agar audit trail rapi dan berita acara opname 1 dokumen.
4. **Lock gudang saat sesi Berjalan** (bukan sekadar warning) untuk transaksi `Keluar`/`Transfer`/`Adjustment` dari gudang tsb. Transaksi `Masuk` juga di-lock supaya hitungan tidak bergeser. Default **hard lock**; opsi konfigurasi warning-only ditinggalkan untuk fase ini demi kesederhanaan & integritas audit.
5. **Approval memakai `inventory_stock:approve`** (sama seperti approval transaksi lain) — otoritas menyetujui koreksi stok lebih tinggi dari input biasa.
6. **Produk yang tidak diinput = tidak dihitung**, tidak dianggap selisih 0 otomatis. Baris tanpa `jumlah_fisik` (null) dilewati saat generate Adjustment. Laporan menandai produk "belum dihitung".

### 4.1 Database — Migrasi 70

Dua tabel baru + tidak ada perubahan ENUM (`'Opname'` sudah ada).

```sql
-- Tabel sesi opname
CREATE TABLE inv_opname_session (
  id              SERIAL PRIMARY KEY,
  kode            VARCHAR(50) NOT NULL UNIQUE,          -- mis. OPN-2026-07-001
  gudang_id       INTEGER NOT NULL REFERENCES inv_gudang(id),
  status          VARCHAR(20) NOT NULL DEFAULT 'Draft', -- Draft|Berjalan|Selesai|Approved|Dibatalkan
  tanggal_mulai   TIMESTAMP NULL,
  tanggal_selesai TIMESTAMP NULL,
  catatan         TEXT NULL,
  transaksi_id    INTEGER NULL REFERENCES inv_transaksi(id), -- Adjustment hasil approve
  created_by      INTEGER NULL REFERENCES users(id),
  approved_by     INTEGER NULL REFERENCES users(id),
  approved_at     TIMESTAMP NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMP NULL
);

-- Detail per produk dalam sesi
CREATE TABLE inv_opname_detail (
  id                     SERIAL PRIMARY KEY,
  opname_session_id      INTEGER NOT NULL REFERENCES inv_opname_session(id) ON DELETE CASCADE,
  produk_id              INTEGER NOT NULL REFERENCES inv_produk(id),
  jumlah_sistem_snapshot INTEGER NOT NULL,     -- stok sistem saat baris disimpan
  jumlah_fisik           INTEGER NULL,          -- hasil hitung fisik (null = belum dihitung)
  selisih                INTEGER NULL,          -- jumlah_fisik - jumlah_sistem_snapshot (null jika belum)
  catatan                TEXT NULL,             -- alasan selisih per baris (opsional)
  created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_opname_detail_session_produk
  ON inv_opname_detail(opname_session_id, produk_id);
CREATE INDEX idx_opname_session_gudang_status
  ON inv_opname_session(gudang_id, status);
CREATE INDEX idx_opname_session_deleted_at
  ON inv_opname_session(deleted_at);
```

Catatan migrasi:
- Constraint aplikasi: **hanya boleh 1 sesi dengan status `Berjalan` per gudang** pada satu waktu (divalidasi di service; DB tidak punya partial-unique lintas nilai enum yang mudah — cukup guard service).
- `kode` di-generate service: `OPN-{YYYY}-{MM}-{urut 3 digit per bulan}`.

### 4.2 Model Sequelize baru

`modules/inventory/models/OpnameSession.ts` dan `OpnameDetail.ts`, plus asosiasi di `associations.ts`:

```
InvOpnameSession.hasMany(InvOpnameDetail, { as: 'detail', foreignKey: 'opname_session_id' })
InvOpnameDetail.belongsTo(InvOpnameSession, { as: 'session', foreignKey: 'opname_session_id' })
InvOpnameSession.belongsTo(InvGudang, { as: 'gudang', foreignKey: 'gudang_id' })
InvOpnameSession.belongsTo(InvTransaksi, { as: 'transaksi', foreignKey: 'transaksi_id' })
InvOpnameDetail.belongsTo(InvProduk, { as: 'produk', foreignKey: 'produk_id' })
```

### 4.3 Service baru — `opname.service.ts`

```typescript
class OpnameService {
  // Buka sesi: validasi tidak ada sesi Berjalan lain di gudang ini
  async createSession(payload: { gudang_id, catatan? }, userId): Promise<InvOpnameSession>

  // Mulai sesi (Draft -> Berjalan): snapshot semua produk yg ada stok di gudang,
  // isi jumlah_sistem_snapshot, kunci gudang.
  async startSession(sessionId, userId): Promise<InvOpnameSession>

  // Input/ubah jumlah fisik satu produk (hanya saat Berjalan)
  async upsertDetail(sessionId, { produk_id, jumlah_fisik, catatan? }, userId): Promise<InvOpnameDetail>
  //  -> hitung ulang jumlah_sistem_snapshot dari inv_stok saat ini, set selisih

  // Selesai input (Berjalan -> Selesai): finalisasi, hitung ringkasan selisih
  async finishSession(sessionId, userId): Promise<InvOpnameSession>

  // Approve (Selesai -> Approved): generate 1 transaksi Adjustment sub_tipe 'Opname'
  //  dengan detail = semua produk selisih != 0, apply effect, buka lock gudang.
  async approveSession(sessionId, userId): Promise<InvOpnameSession>

  // Batalkan (Draft|Berjalan|Selesai -> Dibatalkan): buka lock, tanpa Adjustment
  async cancelSession(sessionId, reason, userId): Promise<InvOpnameSession>

  // Cek apakah gudang sedang punya sesi Berjalan (dipakai guard transaksi)
  async isGudangLocked(gudangId): Promise<boolean>
}
```

Inti `approveSession` (transaksional):

```typescript
async approveSession(sessionId, userId) {
  return sequelize.transaction(async (t) => {
    const session = await InvOpnameSession.findByPk(sessionId, {
      include: [{ association: 'detail' }], transaction: t, lock: t.LOCK.UPDATE,
    });
    if (!session) throw new AppError('Sesi opname tidak ditemukan', 404);
    if (session.status !== 'Selesai')
      throw new AppError('Hanya sesi berstatus Selesai yang bisa di-approve', 400);

    // Ambil baris yang benar-benar dihitung & berselisih
    const berselisih = session.detail.filter(d => d.jumlah_fisik !== null && d.selisih !== 0);

    let transaksi = null;
    if (berselisih.length > 0) {
      // Bangun 1 transaksi Adjustment ber-sub_tipe 'Opname'
      const payload = {
        tipe: 'Adjustment',
        sub_tipe: 'Opname',
        gudang_id: session.gudang_id,          // gudang yang di-opname
        catatan: `Penyesuaian hasil opname ${session.kode}`,
        detail: berselisih.map(d => ({
          produk_id: d.produk_id,
          jumlah: d.selisih,                    // delta bertanda (+/-)
        })),
      };
      // Adjustment auto-requires approval; namun di sini approver opname = approver Adjustment,
      // jadi buat langsung Approved + apply effect dalam transaksi ini.
      transaksi = await stokService.createAndApplyAdjustment(payload, userId, t);
    }

    session.status = 'Approved';
    session.transaksi_id = transaksi?.id ?? null;
    session.approved_by = userId;
    session.approved_at = /* now dari DB via literal, lihat catatan */;
    await session.save({ transaction: t });
    // Lock gudang otomatis terbuka karena tidak ada lagi sesi 'Berjalan'
    return session;
  });
}
```

Catatan:
- `createAndApplyAdjustment` adalah pembungkus baru tipis di `stok.service.ts` yang membuat transaksi `Adjustment` **langsung berstatus Approved** dan memanggil `applyTransaksiEffects` di transaksi DB yang sama (opname sudah punya jalur approval sendiri, tidak perlu dobel approval). Alternatif: buat transaksi Pending lalu panggil `approveTransaksi` — tetapi itu memisah audit approver. Rekomendasi: jalur langsung dengan `approved_by = userId`.
- Delta bertanda dipakai `applyTransaksiEffects` untuk `Adjustment`: stok += Σ delta per produk. Perlu dipastikan branch Adjustment menambah (bukan set absolut) — jika implementasi existing men-`set` absolut, sesuaikan payload jadi `jumlah_fisik` sebagai target absolut. **Aksi verifikasi saat implementasi:** baca branch `Adjustment` di `applyTransaksiEffects` untuk memutuskan delta vs absolut, lalu samakan.

### 4.4 Lock gudang — guard di `stok.service.ts`

Di awal `createTransaksi` (atau `applyTransaksiEffects`), sebelum memproses gudang sumber:

```typescript
const gudangSumber = payload.gudang_id ?? payload.gudang_asal_id;
if (gudangSumber && await opnameService.isGudangLocked(gudangSumber)) {
  throw new AppError(
    'Gudang sedang dalam sesi stock opname aktif. Transaksi ke gudang ini dikunci sampai opname selesai.',
    409,
  );
}
```

Berlaku untuk semua `tipe` yang menyentuh gudang terkunci (Masuk/Keluar/Adjustment/Transfer). Transaksi Adjustment **hasil opname sendiri** dikecualikan (di-generate dari dalam service saat approve, bukan lewat endpoint publik).

---

## 5. Arsitektur — Backend

### 5.1 Controller — `opname.controller.ts` (baru)

Handler: `listSessions`, `getSession`, `createSession`, `startSession`, `upsertDetail`, `finishSession`, `approveSession`, `cancelSession`, `exportBeritaAcara` (PDF ringkasan selisih).

### 5.2 Routes — tambah di `inventory.routes.ts`

```typescript
// Semua di bawah /api/inventory/opname, JWT + RBAC
router.get('/opname', checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ), opnameController.listSessions);
router.get('/opname/:id', checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ), opnameController.getSession);
router.post('/opname', checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.CREATE), auditLogger('inv_opname_session'), opnameController.createSession);
router.post('/opname/:id/start', checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.UPDATE), auditLogger('inv_opname_session'), opnameController.startSession);
router.put('/opname/:id/detail', checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.UPDATE), opnameController.upsertDetail);
router.post('/opname/:id/finish', checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.UPDATE), auditLogger('inv_opname_session'), opnameController.finishSession);
router.post('/opname/:id/approve', checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.APPROVE), auditLogger('inv_opname_session'), opnameController.approveSession);
router.post('/opname/:id/cancel', checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.APPROVE), auditLogger('inv_opname_session'), opnameController.cancelSession);
router.get('/opname/:id/berita-acara', checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ), opnameController.exportBeritaAcara);
```

### 5.3 Validator — `opname.validator.ts` (baru)

- `createSessionValidation`: `gudang_id` wajib & ada di `inv_gudang`.
- `upsertDetailValidation`: `produk_id` wajib, `jumlah_fisik` integer ≥ 0 (boleh null untuk reset), `catatan` opsional.
- `cancelValidation`: `reason` wajib min 5 karakter.

---

## 6. Arsitektur — Frontend

### 6.1 Halaman baru

1. **`pages/inventory/opname/OpnameListPage.tsx`** — daftar sesi opname (filter gudang & status), tombol "Buka Sesi Opname".
2. **`pages/inventory/opname/OpnameSessionPage.tsx`** — halaman kerja sesi:
   - Header: kode, gudang, status badge, tombol aksi kontekstual (Mulai / Selesai / Approve / Batalkan) sesuai status & permission.
   - Tabel produk: kolom Produk | UOM | Stok Sistem (snapshot) | Jumlah Fisik (input) | Selisih (badge merah/hijau) | Catatan.
   - Input jumlah fisik auto-save per baris (debounce) memanggil `PUT /opname/:id/detail`.
   - Ringkasan bawah: total produk dihitung, total selisih lebih, total selisih kurang.
   - Setelah Approved: tampilkan link ke transaksi Adjustment + tombol unduh Berita Acara.

### 6.2 Komponen

- **`OpnameStatusBadge.tsx`** — warna per status (Draft abu, Berjalan biru, Selesai kuning, Approved hijau, Dibatalkan merah).
- **`OpnameVarianceRow.tsx`** — baris input + kalkulasi selisih realtime di klien (echo dari server).
- Reuse `GudangSelect` existing untuk pilih gudang saat buka sesi.

### 6.3 Service & hooks

- `services/api/inventory-opname.service.ts`: `list`, `get`, `create`, `start`, `upsertDetail`, `finish`, `approve`, `cancel`, `downloadBeritaAcara`.
- `hooks/useOpname.ts`: `useOpnameList`, `useOpnameSession`, mutations `useCreateOpname`, `useStartOpname`, `useUpsertOpnameDetail`, `useFinishOpname`, `useApproveOpname`, `useCancelOpname` (invalidate query sesi + list + stok terkait).

### 6.4 Routing & menu

- `App.tsx`: route `/inventory/opname` dan `/inventory/opname/:id`, dibungkus `PermissionGuard` (`INVENTORY_STOCK`, `READ`).
- `Sidebar.tsx`: menu "Stock Opname" di grup Inventory.

---

## 7. Alur data (siklus sesi)

```
[Buka Sesi]  Draft
    │  createSession(gudang) → kode OPN-2026-07-001
    ▼
[Mulai]      Berjalan   ← gudang di-LOCK
    │  startSession → snapshot stok semua produk gudang ke inv_opname_detail
    │  upsertDetail (berulang) → input jumlah_fisik, hitung selisih
    ▼
[Selesai]    Selesai
    │  finishSession → finalisasi input (tidak bisa ubah fisik lagi)
    ▼
[Approve]    Approved   ← gudang UNLOCK
    │  approveSession → buat 1 Transaksi Adjustment (sub_tipe 'Opname')
    │                    detail = produk selisih≠0, delta = selisih
    │                    applyTransaksiEffects → inv_stok tersinkron
    ▼
  Selesai — stok sistem = stok fisik terverifikasi
```

Cabang: **Dibatalkan** dari Draft/Berjalan/Selesai → gudang unlock, tanpa Adjustment.

---

## 8. Penanganan error

| Kondisi | Respons |
|---|---|
| Buka sesi saat gudang sudah punya sesi `Berjalan` | 409 "Gudang ini sudah memiliki sesi opname yang sedang berjalan." |
| Input `jumlah_fisik` saat status ≠ `Berjalan` | 400 "Jumlah fisik hanya bisa diinput saat sesi berjalan." |
| Approve sesi berstatus ≠ `Selesai` | 400 "Hanya sesi berstatus Selesai yang bisa di-approve." |
| Transaksi keluar/masuk ke gudang saat sesi `Berjalan` | 409 "Gudang sedang dalam sesi stock opname aktif..." |
| Approve sesi tanpa satu pun selisih | 200 — sesi jadi `Approved`, `transaksi_id` null (tidak ada Adjustment) |
| `jumlah_fisik` negatif | 400 "Jumlah fisik tidak boleh negatif." |
| Gudang tidak ditemukan saat buka sesi | 404 "Gudang tidak ditemukan." |
| Race: stok berubah antara snapshot & approve | Tidak terjadi — gudang di-lock selama `Berjalan`; snapshot final saat `finishSession`. |

---

## 9. Testing

### Backend (Jest) — `opname.service.test.ts`
- ✅ createSession menolak jika ada sesi Berjalan lain di gudang sama.
- ✅ startSession men-snapshot stok sistem semua produk gudang.
- ✅ upsertDetail menghitung `selisih = jumlah_fisik − snapshot`.
- ✅ upsertDetail ditolak saat status ≠ Berjalan.
- ✅ approveSession membuat 1 Adjustment `sub_tipe 'Opname'` dengan detail hanya produk selisih≠0.
- ✅ approveSession menyinkronkan `inv_stok` sesuai delta (naik & turun).
- ✅ approveSession tanpa selisih → Approved, tanpa transaksi.
- ✅ approveSession ditolak jika status ≠ Selesai.
- ✅ Guard lock: createTransaksi Keluar ke gudang ber-sesi Berjalan → 409.
- ✅ cancelSession membuka lock tanpa Adjustment.

### Frontend (Vitest)
- ✅ `OpnameSessionPage` menampilkan selisih merah (kurang) & hijau (lebih).
- ✅ Input jumlah fisik memanggil upsertDetail (debounced).
- ✅ Tombol aksi muncul sesuai status (Mulai hanya di Draft, Approve hanya di Selesai).
- ✅ Setelah Approved input fisik disabled + link Adjustment tampil.

---

## 10. Berkas terdampak

**Backend (baru):**
- `database/migrations/70_create_inv_opname_tables.ts`
- `modules/inventory/models/OpnameSession.ts`, `OpnameDetail.ts`
- `modules/inventory/services/opname.service.ts`
- `modules/inventory/controllers/opname.controller.ts`
- `modules/inventory/validators/opname.validator.ts`
- `modules/inventory/services/__tests__/opname.service.test.ts`

**Backend (ubah):**
- `modules/inventory/models/associations.ts` — asosiasi opname.
- `modules/inventory/routes/inventory.routes.ts` — route opname.
- `modules/inventory/services/stok.service.ts` — guard lock + helper `createAndApplyAdjustment`.

**Frontend (baru):**
- `pages/inventory/opname/OpnameListPage.tsx`, `OpnameSessionPage.tsx`
- `components/inventory/OpnameStatusBadge.tsx`, `OpnameVarianceRow.tsx`
- `services/api/inventory-opname.service.ts`
- `hooks/useOpname.ts`

**Frontend (ubah):**
- `App.tsx` — route.
- `components/layout/Sidebar.tsx` — menu.

---

## 11. Kompatibilitas & catatan

- **Tidak ada breaking change.** ENUM `'Opname'` sudah ada; tabel baru terpisah. Transaksi Adjustment existing tidak terpengaruh.
- **Lock gudang** menambah 1 query cek per pembuatan transaksi. Ringan (indexed by `gudang_id, status`), tapi catat sebagai overhead kecil.
- **Verifikasi serial per-unit** ditunda: fase ini opname kuantitas. Untuk produk serial, `jumlah_sistem_snapshot` = jumlah serial `Tersedia` di gudang; koreksi selisih serial (unit hilang) sebaiknya lewat alur disposal/kerusakan, bukan Adjustment kuantitas — dicatat sebagai batasan yang diketahui.
- **`approved_at` timestamp:** gunakan `sequelize.literal('NOW()')` atau default DB, karena environment melarang `Date.now()`/`new Date()` di beberapa jalur — samakan dengan pola timestamp existing di service lain saat implementasi.
- **Urutan migrasi:** 68 (Consumable) → 69 (Void/Amend) → **70 (Stock Opname)**. Jika hanya sebagian fitur disetujui, sesuaikan penomoran agar tetap berurutan tanpa lompatan.

---

## 12. Estimasi effort

| Bagian | Estimasi |
|---|---|
| Migrasi 70 + model + asosiasi | 1 jam |
| `opname.service.ts` (siklus + approve + lock) | 3-4 jam |
| Controller + validator + routes | 1.5 jam |
| Frontend list + session page + komponen | 4-5 jam |
| Service + hooks frontend | 1.5 jam |
| Berita Acara PDF | 1.5 jam |
| Test backend + frontend | 2-3 jam |
| **Total** | **~15-18 jam** |

Fitur paling berat dari ketiganya (entitas & siklus baru penuh), sesuai posisinya sebagai prioritas audit #1 di roadmap.
