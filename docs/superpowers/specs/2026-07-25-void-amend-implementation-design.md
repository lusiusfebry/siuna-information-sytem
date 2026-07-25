# Desain Implementasi: Void / Amend Transaksi Inventory

- **Tanggal:** 2026-07-25
- **Modul:** Inventory
- **Status:** Menunggu persetujuan implementasi
- **Referensi spec awal:** [`2026-07-23-void-amend-transaksi-spec.md`](./2026-07-23-void-amend-transaksi-spec.md)
- **Task backlog:** #127

---

## 1. Ringkasan

Menyediakan dua mekanisme koreksi resmi untuk transaksi inventory dengan jejak audit lengkap:

- **Void** — untuk transaksi berstatus `Pending` (belum meng-apply efek). Cukup ubah status menjadi `Voided` + jejak audit.
- **Amend** — untuk transaksi berstatus `Approved`. Sistem membuat **transaksi reversal** yang efeknya adalah kebalikan dari transaksi asli (dijalankan lewat `applyTransaksiEffects` yang sudah ada). Opsional: satu request bisa sekaligus membuat **transaksi koreksi** baru sebagai pengganti. Data historis transaksi asli tidak diubah.

Desain ini menyempurnakan spec awal dengan tiga keputusan hasil brainstorming (2026-07-25):

1. **Cakupan penuh** — amend didukung untuk seluruh tipe transaksi (serial, transfer, fasilitas, konsumsi), bukan hanya non-serial/non-transfer.
2. **Approach A (reversal ledger)** — reversal diperlakukan sebagai transaksi baru yang dilewatkan ke `applyTransaksiEffects`, bukan `undo*` per-handler. Menjamin invers-nya konsisten dengan alur `createTransaksi` + `approveTransaksi` yang sudah ada.
3. **Guard fail-closed** — jika serial sudah berpindah setelah transaksi asli, atau penempatan fasilitas sudah ditarik, atau reversal menyebabkan stok negatif, sistem tolak dengan pesan Indonesia yang jelas.

## 2. Perubahan sejak spec awal

| Poin | Spec awal (2026-07-23) | Desain ini (2026-07-25) |
|---|---|---|
| Cakupan | Non-serial + non-transfer + non-fasilitas | Semua sub-tipe |
| Serial ber-reversal | Diblokir (`AppError`) | Rollback penuh; tolak 409 jika serial sudah berpindah lagi |
| Transfer ber-reversal | Diblokir | Reverse kedua leg dalam satu transaksi DB |
| Fasilitas ber-reversal | Diblokir | Mirror handler existing (`open/closeFacilityPlacement`) |
| Nomor migrasi | 68 (rebus dengan Consumable) | 69 (Consumable sudah pakai 68) |
| Enum `approval_status` | tambah `'Voided'` | (sama) |
| Nama kolom FK | `amends_transaksi_id` + `amended_by_transaksi_id` | (sama) |
| Filter daftar transaksi | tidak diatur | Default sembunyikan Voided/Rejected; ada checkbox opsional |
| Refactor internal | tidak ada | Extract `createTransaksiInternal` dari body `createTransaksi` untuk dipakai `amendTransaksi` |

## 3. Arsitektur

### 3.1 Peta invers reversal (per `sub_tipe`)

Reversal dibangun sebagai `TransaksiPayload` baru yang dilewatkan ke `applyTransaksiEffects`. Utilitas `buildReversalPayload` memilih tipe/sub-tipe reversal berdasarkan sub-tipe transaksi asli.

| `sub_tipe` asli (`tipe`) | Reversal `sub_tipe` (`tipe`) | Efek balikan |
|---|---|---|
| `Supplier` (Masuk) | `Adjustment` (Adjustment), jumlah negatif | Stok gudang −N; serial yang tadi di-mint dihapus (`InvSerialNumber.destroy`) — snapshot di `InvTransaksiDetail.serial_numbers` tetap ada sebagai audit |
| `Transfer Masuk` (Masuk) | `Adjustment` −N di gudang tujuan **+** paired Adjustment +N di gudang asal | Membalik kedua leg (destinasi & asal) |
| `Transfer Gudang` (Keluar, auto-generated) | dilarang di-amend langsung — user harus amend header `Transfer Masuk`-nya | 400 dengan pesan arahkan |
| `Ke Karyawan` (Keluar) | `Retur Karyawan` (Masuk) ke karyawan yang sama | Stok gudang +N; serial `karyawan → gudang`, status `Tersedia` |
| `Ke Gedung/Mess` (Keluar) | `Ambil dari Gedung` (Masuk) dari gedung/ruang yang sama | Stok gudang +N; serial dari ruangan → gudang; `closeFacilityPlacement` |
| `Disposal` (Keluar) | `Adjustment` +N; serial revive `status='Tersedia', gudang_id=gudang asli` | Stok +N; serial hidup kembali |
| `Rusak/Terbuang` (Keluar) | Sama seperti Disposal | (sama) |
| `Retur Karyawan` (Masuk) | `Ke Karyawan` (Keluar) ke karyawan yang sama | Stok gudang −N; serial `gudang → karyawan`, status `Digunakan` |
| `Ambil dari Gedung` (Masuk) | `Ke Gedung/Mess` (Keluar) ke gedung/ruang yang sama | Stok gudang −N; serial `gudang → ruangan`, `openFacilityPlacement` baru |
| `Adjustment` (Adjustment) | `Adjustment` dengan `jumlah = -asli` | Delta stok dibalik |
| `Konsumsi` (Keluar) | `Adjustment` +N di gudang yang sama | Kembalikan stok konsumsi (produk consumable) |

Catatan: untuk reversal `Supplier`, dipilih `Adjustment` (bukan `Keluar/Disposal`) supaya tidak ada implikasi "barang dibuang ke supplier". Serial yang di-mint oleh Supplier dihapus dari `InvSerialNumber` — bukan di-mark voided — karena enum `SerialNumberStatus` (Tersedia/Digunakan/Rusak/Disposed) tidak punya nilai voided dan menambahnya berarti migration enum kedua. Audit trail tetap terjaga: snapshot serial dituliskan di `InvTransaksiDetail.serial_numbers` (JSONB) pada transaksi asli, dan reversal punya catatan `"REVERSAL transaksi X: <reason>"`. Guard §3.2 memastikan hanya menghapus serial yang `transaksi_terakhir_id === original.id` (belum berpindah).

### 3.2 Guard pra-reversal (fail-closed)

`validateReversalGuards(original, details, tx)` menjalankan pemeriksaan berikut sebelum menyentuh state:

1. **Sudah pernah di-amend** — `original.amended_by_transaksi_id !== null` → 400 "Transaksi ini sudah pernah dikoreksi sebelumnya (lihat #YY)."
2. **Adalah reversal atau koreksi** — `original.amends_transaksi_id !== null` → 400 "Transaksi reversal/koreksi tidak bisa di-amend."
3. **Transfer leg auto-generated** — `sub_tipe === 'Transfer Gudang'` dengan `catatan` diawali `"Auto-generated dari transfer masuk"` → 400 "Untuk membatalkan transfer, amend transaksi Transfer Masuk-nya."
4. **Serial ber-serial: masih di posisi asli** — untuk setiap serial di `details.serial_numbers`, cek `InvSerialNumber.transaksi_terakhir_id === original.id` (`handleStokMasuk` men-set `transaksi_terakhir_id = transaksi Masuk` untuk Supplier & Transfer Masuk; `handleStokKeluar` men-set-nya untuk outbound. Paired leg auto-generated tidak menyentuh serial). Jika sudah berubah → 409 "Serial X sudah dipindah oleh transaksi Y setelah transaksi ini. Koreksi otomatis tidak aman."
5. **Fasilitas: penempatan masih Aktif** — untuk `Ke Gedung/Mess` dengan `facility_room_id`, cek `FacilityAsset` row `transaksi_id=original.id, status='Aktif'` masih ada. Jika sudah ditarik atau dipindah → 409 "Aset X sudah ditarik dari ruangan Y. Koreksi otomatis tidak aman."
6. **Stok reversal tidak boleh negatif** — dilakukan oleh `applyTransaksiEffects` (memakai `validateStokCukup` yang sudah ada) saat leg Keluar dijalankan. Error yang dilempar (`"Stok tidak cukup..."`) dibiarkan naik agar user tahu barang sudah dikeluarkan lagi setelah transaksi ini.

Semua guard error dilempar sebelum commit → seluruh transaksi DB di-rollback.

### 3.3 Alur `amendTransaksi`

```
tx = sequelize.transaction()
try:
    original = InvTransaksi.findByPk(id, lock: FOR UPDATE, tx)
    assert original.approval_status === 'Approved'    // else 400
    details = InvTransaksiDetail.findAll({transaksi_id: id}, tx)
    validateReversalGuards(original, details, tx)      // §3.2

    reversalSpec = buildReversalPayload(original, details, userId, reason)
    // reversalSpec = { primary: TransaksiPayload, paired?: TransaksiPayload }

    // 1. Reversal utama
    reversal = createTransaksiInternal(reversalSpec.primary, userId, tx,
                                       { autoApprove: true })
    applyTransaksiEffects(reversal, reversalSpec.primary, userId, tx)
    reversal.update({
        approval_status:'Approved', approved_by:userId, approved_at:now,
        amends_transaksi_id: original.id,
        catatan: `REVERSAL transaksi ${original.code}: ${reason}`,
    })

    // 2. Reversal paired (hanya untuk Transfer Masuk)
    if reversalSpec.paired:
        pairedRow = createTransaksiInternal(reversalSpec.paired, userId, tx,
                                            { autoApprove: true })
        applyTransaksiEffects(pairedRow, reversalSpec.paired, userId, tx)
        pairedRow.update({
            approval_status:'Approved', approved_by:userId, approved_at:now,
            amends_transaksi_id: original.id,
            catatan: `REVERSAL paired dari ${original.code}: ${reason}`,
        })

    // 3. Tandai transaksi asli
    original.update({ amended_by_transaksi_id: reversal.id })

    // 4. (Opsional) Koreksi baru
    koreksiRow = null
    if koreksi?.details:
        koreksiPayload = {
            ...basePayloadFrom(original),
            details: koreksi.details,
            catatan: `Koreksi dari ${original.code}: ${reason}`,
        }
        koreksiRow = createTransaksiInternal(koreksiPayload, userId, tx,
                                             { autoApprove: true })
        applyTransaksiEffects(koreksiRow, koreksiPayload, userId, tx)
        koreksiRow.update({
            approval_status:'Approved', approved_by:userId, approved_at:now,
        })

    tx.commit()
    return { reversal:getTransaksiDetail(reversal.id),
             koreksi: koreksiRow ? getTransaksiDetail(koreksiRow.id) : null }
except:
    tx.rollback(); throw
```

`createTransaksiInternal(payload, userId, tx, opts)` diekstrak dari body `createTransaksi` yang ada — melakukan `generateCode`, `InvTransaksi.create`, snapshot `InvTransaksiDetail`, TANPA membuka transaksi baru (memakai `tx` yang diberikan) dan TANPA gerbang approval-INV-N07 (karena `autoApprove:true`).

### 3.4 Alur `voidTransaksi`

```
tx = sequelize.transaction()
try:
    row = InvTransaksi.findByPk(id, lock: FOR UPDATE, tx)
    assert row.approval_status === 'Pending'          // else 400
    assert row.amends_transaksi_id === null            // else 400
    assert row.amended_by_transaksi_id === null        // else 400 (sanity)
    row.update({
        approval_status:'Voided',
        voided_by:userId, voided_at:now, void_reason:reason.trim(),
    })
    tx.commit()
    return getTransaksiDetail(id)
except:
    tx.rollback(); throw
```

Karena Pending belum meng-apply efek (INV-N07), tidak ada stok/serial/fasilitas yang perlu di-rollback.

## 4. Perubahan Backend

### 4.1 Migration 69 — `69_add_void_amend_support.ts`

```sql
-- up
ALTER TYPE "enum_inv_transaksi_approval_status" ADD VALUE IF NOT EXISTS 'Voided';

ALTER TABLE inv_transaksi
    ADD COLUMN voided_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN voided_at TIMESTAMPTZ NULL,
    ADD COLUMN void_reason TEXT NULL,
    ADD COLUMN amends_transaksi_id INTEGER NULL
        REFERENCES inv_transaksi(id) ON DELETE SET NULL,
    ADD COLUMN amended_by_transaksi_id INTEGER NULL
        REFERENCES inv_transaksi(id) ON DELETE SET NULL;

CREATE INDEX idx_transaksi_amends ON inv_transaksi(amends_transaksi_id);
CREATE INDEX idx_transaksi_amended_by ON inv_transaksi(amended_by_transaksi_id);
CREATE INDEX idx_transaksi_voided_at ON inv_transaksi(voided_at)
    WHERE voided_at IS NOT NULL;

-- down
DROP INDEX IF EXISTS idx_transaksi_voided_at;
DROP INDEX IF EXISTS idx_transaksi_amended_by;
DROP INDEX IF EXISTS idx_transaksi_amends;

ALTER TABLE inv_transaksi
    DROP COLUMN amended_by_transaksi_id,
    DROP COLUMN amends_transaksi_id,
    DROP COLUMN void_reason,
    DROP COLUMN voided_at,
    DROP COLUMN voided_by;

-- Known limitation: Postgres tidak mendukung DROP VALUE pada enum.
-- Nilai 'Voided' akan tetap ada di tipe enum, tapi tidak akan digunakan.
-- Ini konsisten dengan strategi migrasi enum sebelumnya di modul ini.
```

Nama enum sudah diverifikasi di migration 66: `enum_inv_transaksi_approval_status`.

### 4.2 Model `Transaksi.ts`

Extend union type:
```typescript
public approval_status!: 'Pending' | 'Approved' | 'Rejected' | 'Voided';
public voided_by!: number | null;
public voided_at!: Date | null;
public void_reason!: string | null;
public amends_transaksi_id!: number | null;
public amended_by_transaksi_id!: number | null;
```
Extend Sequelize `init` dengan enum + field baru, allowNull semua.

**Associations** di `associations.ts`:
```typescript
InvTransaksi.belongsTo(User, { foreignKey: 'voided_by', as: 'voider' });
InvTransaksi.belongsTo(InvTransaksi, {
    foreignKey: 'amends_transaksi_id', as: 'transaksi_asli'
});
InvTransaksi.hasOne(InvTransaksi, {
    foreignKey: 'amends_transaksi_id', as: 'transaksi_koreksi',
    constraints: false,   // hasOne inverse pada FK yang sama boleh multiple leg
});
InvTransaksi.belongsTo(InvTransaksi, {
    foreignKey: 'amended_by_transaksi_id', as: 'transaksi_amender'
});
```

### 4.3 Service `stok.service.ts`

Ekstrak `createTransaksiInternal(payload, userId, tx, { autoApprove?: boolean })` dari body `createTransaksi`. Tanda tangan lama `createTransaksi(payload, userId)` menjadi wrapper yang membuka transaksi lalu memanggil `createTransaksiInternal` dengan `autoApprove = !this.requiresApproval(payload)`.

Tambah:

```typescript
async voidTransaksi(id: number, userId: number, reason: string): Promise<InvTransaksi>
async amendTransaksi(
    id: number,
    userId: number,
    reason: string,
    koreksi?: { details: TransaksiDetailPayload[] }
): Promise<{ reversal: InvTransaksi; koreksi: InvTransaksi | null }>

private async validateReversalGuards(
    original: InvTransaksi,
    details: InvTransaksiDetail[],
    t: Transaction
): Promise<void>

private buildReversalPayload(
    original: InvTransaksi,
    details: InvTransaksiDetail[],
    userId: number,
    reason: string,
): { primary: TransaksiPayload; paired?: TransaksiPayload }
```

### 4.4 Controller `stok.controller.ts`

```typescript
async voidTransaksi(req, res, next) {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const result = await stokService.voidTransaksi(Number(id), req.user!.id, reason);
        res.json({ status:'success', data: result, message:'Transaksi berhasil dibatalkan' });
    } catch (e) { next(e); }
}

async amendTransaksi(req, res, next) {
    try {
        const { id } = req.params;
        const { reason, koreksi } = req.body;
        const result = await stokService.amendTransaksi(
            Number(id), req.user!.id, reason, koreksi
        );
        res.json({ status:'success', data: result,
                   message:'Transaksi berhasil dikoreksi' });
    } catch (e) { next(e); }
}
```

### 4.5 Routes `inventory.routes.ts`

```typescript
router.post('/transaksi/:id/void',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.APPROVE),
    auditLogger('inv_transaksi'),
    validateVoid,
    (req, res, next) => stokController.voidTransaksi(req, res, next),
);

router.post('/transaksi/:id/amend',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.APPROVE),
    auditLogger('inv_transaksi'),
    validateAmend,
    (req, res, next) => stokController.amendTransaksi(req, res, next),
);
```

### 4.6 Validator `validateInventoryStok.ts`

```typescript
const voidSchema = z.object({
    reason: z.string().trim().min(5, 'Alasan wajib diisi (minimal 5 karakter)'),
});

const amendSchema = z.object({
    reason: z.string().trim().min(5, 'Alasan wajib diisi (minimal 5 karakter)'),
    koreksi: z.object({
        details: z.array(transaksiDetailSchema).min(1),
    }).optional(),
});

export const validateVoid = makeValidator(voidSchema);
export const validateAmend = makeValidator(amendSchema);
```

### 4.7 Extend `getTransaksiList`

Tambah query param opsional `include_inactive: boolean` (default `false`). Ketika `false`, filter `approval_status NOT IN ('Voided', 'Rejected')`. Sudah ada `approval_status` filter — ini overlay tambahan.

## 5. Perubahan Frontend

### 5.1 Types `src/types/inventory.ts`

```typescript
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Voided';

export interface InvTransaksi {
    // ... field existing
    voided_by?: number | null;
    voided_at?: string | null;
    void_reason?: string | null;
    amends_transaksi_id?: number | null;
    amended_by_transaksi_id?: number | null;
    voider?: { id: number; nama: string } | null;
    transaksi_asli?: Pick<InvTransaksi, 'id' | 'code'> | null;
    transaksi_koreksi?: Pick<InvTransaksi, 'id' | 'code'> | null;
}

export interface VoidTransaksiPayload { reason: string }

export interface AmendTransaksiPayload {
    reason: string;
    koreksi?: { details: TransaksiDetailPayload[] };
}
```

### 5.2 Service & hooks

`src/services/api/inventory.service.ts`:
```typescript
voidTransaksi: (id: number, payload: VoidTransaksiPayload) =>
    client.post(`/inventory/transaksi/${id}/void`, payload).then(r => r.data),

amendTransaksi: (id: number, payload: AmendTransaksiPayload) =>
    client.post(`/inventory/transaksi/${id}/amend`, payload).then(r => r.data),
```

`src/hooks/useInventoryStok.ts` — `useVoidTransaksi()`, `useAmendTransaksi()`. Kedua-nya invalidasi `['inv-transaksi']`, `['inv-stok']`, dan `['inv-serial-numbers']`.

### 5.3 Aksi di daftar/detail transaksi

`TransaksiListPage.tsx` action panel per row (atau modal detail):

```tsx
{row.approval_status === 'Pending' && canApprove && (
    <button className="btn-danger" onClick={() => openVoid(row.id)}>Batalkan</button>
)}
{row.approval_status === 'Approved'
 && !row.amended_by_transaksi_id
 && !row.amends_transaksi_id
 && canApprove && (
    <button className="btn-warning" onClick={() => openAmend(row.id)}>Koreksi</button>
)}
```

Badge:
- `Voided` → merah muda dengan alasan + oleh + tanggal (tooltip)
- `amends_transaksi_id != null` → biru "Reversal dari #XX" (link)
- `amended_by_transaksi_id != null` → kuning "Dikoreksi oleh #YY" (link)

### 5.4 Modal `VoidTransaksiModal.tsx`

Textarea alasan (min 5 char, hitung karakter live), tombol destructive "Ya, Batalkan", state loading, toast sukses/gagal.

### 5.5 Modal `AmendTransaksiModal.tsx`

Textarea alasan + toggle "Buat transaksi koreksi baru" yang menampilkan `TransaksiDetailEditor` (reuse dari `TransaksiFormPage.tsx`; extract komponen jika belum). Sub-mit mengirim `{ reason, koreksi? }`.

### 5.6 Filter daftar

`TransaksiListPage`: tambah checkbox "Termasuk transaksi dibatalkan/ditolak" (default off) yang mengirim `include_inactive=true`. Update `useTransaksiList` hook untuk meneruskan parameter.

## 6. Kontrak error

| Kondisi | HTTP | Pesan |
|---|---|---|
| Void: row bukan Pending | 400 | "Hanya transaksi berstatus Pending yang bisa dibatalkan. Transaksi ini berstatus X. Gunakan Koreksi untuk transaksi yang sudah disetujui." |
| Amend: row bukan Approved | 400 | "Hanya transaksi berstatus Approved yang bisa dikoreksi. Transaksi ini berstatus X." |
| Amend: sudah pernah di-amend | 400 | "Transaksi ini sudah pernah dikoreksi sebelumnya (lihat #YY)." |
| Amend: baris reversal/koreksi | 400 | "Transaksi reversal/koreksi tidak bisa di-amend." |
| Amend Transfer Gudang auto-generated | 400 | "Untuk membatalkan transfer, amend transaksi Transfer Masuk-nya (#XX)." |
| Amend serial: sudah dipindah | 409 | "Serial X sudah dipindah oleh transaksi Y setelah transaksi ini. Koreksi otomatis tidak aman." |
| Amend fasilitas: penempatan sudah ditarik/pindah | 409 | "Aset X sudah ditarik dari ruangan Y. Koreksi otomatis tidak aman." |
| Amend: reversal menyebabkan stok negatif | 400 | "Stok tidak cukup di gudang X untuk melakukan koreksi. Barang mungkin sudah dikeluarkan setelah transaksi ini." |
| Void/Amend tanpa reason atau < 5 char | 400 | "Alasan wajib diisi (minimal 5 karakter)." |
| Row tidak ditemukan | 404 | "Transaksi tidak ditemukan." |
| Tanpa permission approve | 403 | (middleware existing) |

## 7. Testing

### 7.1 Backend unit (`stok.void.test.ts`, mocked DB)

6 kasus:
- Void Pending → status Voided, voided_by/at/reason terset
- Void Approved → 400
- Void row reversal (amends_transaksi_id != null) → 400
- Void tanpa reason → 400 (validator)
- Row tidak ada → 404
- Rollback jika DB error di update

### 7.2 Backend unit (`stok.amend.test.ts`, mocked DB)

Minimal 12 kasus:
- Amend Supplier → reversal Adjustment −N; serial baru di-mark Voided
- Amend Ke Karyawan → reversal Retur Karyawan; serial kembali ke gudang, status Tersedia
- Amend Ke Gedung/Mess → reversal Ambil dari Gedung; FacilityAsset ditutup
- Amend Retur Karyawan → reversal Ke Karyawan ke karyawan yang sama
- Amend Ambil dari Gedung → reversal Ke Gedung; FacilityAsset dibuka
- Amend Disposal/Rusak → serial revive `status='Tersedia', gudang_id=asli`
- Amend Adjustment → jumlah dibalik
- Amend Konsumsi → Adjustment +N di gudang
- Amend Transfer Masuk → reversal Adjustment −N di destinasi + paired +N di asal
- Amend + koreksi.details → reversal + koreksi Approved, net stok sesuai koreksi
- Guard: sudah di-amend → 400
- Guard: reversal-of-reversal → 400
- Guard: serial sudah dipindah → 409
- Guard: facility placement sudah ditarik → 409
- Guard: reversal menyebabkan stok negatif → 400

### 7.3 Backend integration (`voidAmend.api.test.ts`, real DB)

4 kasus end-to-end via HTTP:
- Void endpoint pada row Pending → 200; row Voided; stok tidak berubah
- Amend Supplier + koreksi → 200; reversal & koreksi terpersist; net stok = jumlah koreksi
- Amend Ke Karyawan (dengan serial number) → serial kembali ke gudang di DB nyata
- Amend Transfer Masuk → kedua leg dibalik; stok kedua gudang konsisten

### 7.4 Frontend (Vitest)

- `VoidTransaksiModal.test.tsx` — validasi min 5 char, submit call, error toast
- `AmendTransaksiModal.test.tsx` — validasi, toggle koreksi.details, submit
- (Opsional) `TransaksiListPage.test.tsx` — tombol Batalkan/Koreksi muncul sesuai status + permission

## 8. Keamanan & audit

- **Permission:** endpoint void & amend butuh `inventory_stock:approve` (otoritas lebih tinggi dari `create`). Tombol di frontend disembunyikan lewat `usePermission`.
- **Audit log:** middleware `auditLogger('inv_transaksi')` existing merekam siapa mem-void/amend, kapan, dan payload. Kolom jejak (`voided_by/at/reason`, `amends_transaksi_id`, `amended_by_transaksi_id`) melengkapi audit trail permanen di tabel.
- **Immutability:** transaksi asli tidak diubah kecuali `amended_by_transaksi_id`. Data historis (tipe, sub_tipe, tanggal, gudang, karyawan, details, dokumen) tetap.
- **Atomicity:** semua operasi (void + amend + paired + koreksi) dibungkus satu `sequelize.transaction()`. Guard yang gagal di tengah alur men-rollback SEMUA efek.

## 9. Kompatibilitas

- Transaksi existing tetap valid — kolom baru semua nullable.
- Enum baru `'Voided'` tidak akan muncul di data lama (default tetap `Pending`/`Approved`/`Rejected`).
- Endpoint list transaksi default menyembunyikan `Voided`/`Rejected` — perilaku backward-compatible.
- Sidebar & rute tidak berubah.

## 10. Estimasi effort

| Task | Estimasi |
|---|---|
| Migration 69 | 45 min |
| Model + associations | 45 min |
| `voidTransaksi` + validator | 1 jam |
| `amendTransaksi` + `buildReversalPayload` + `validateReversalGuards` | 4 jam |
| Extract `createTransaksiInternal` (refactor) | 1 jam |
| Controller + routes | 45 min |
| Unit tests backend (`stok.void`, `stok.amend`) | 4 jam |
| Integration test backend (`voidAmend.api`) | 1.5 jam |
| Types + service + hooks FE | 1 jam |
| Modal Void + Amend | 2 jam |
| Badge + tombol di list/detail | 1.5 jam |
| Filter list `include_inactive` | 30 min |
| Vitest FE | 1 jam |
| Dokumentasi & PR | 30 min |

**Total: ≈ 20 jam (2.5 hari dev).**

**Risiko:**
- **Reversal serial rumit** — mitigasi via guard "serial masih di posisi asli"; jika sudah berubah, tolak 409 dengan pesan jelas.
- **Reversal facility** — mitigasi via guard `FacilityAsset.status='Aktif'`.
- **Reversal transfer** — mitigasi via peta invers dua-leg + paired update.
- **Enum Postgres tidak bisa DROP VALUE** — dokumentasikan sebagai known limitation di migration.

## 11. Referensi kode terkait

- `backend/src/modules/inventory/services/stok.service.ts` — `createTransaksi`, `applyTransaksiEffects`, `approveTransaksi`, `handleStokMasuk`, `handleStokKeluar`, `createPairedTransferKeluar/Masuk`, `openFacilityPlacement`, `closeFacilityPlacement`, `validateStokCukup`, `upsertStok`, `generateCode`
- `backend/src/modules/inventory/models/Transaksi.ts` — enum `approval_status`
- `backend/src/shared/constants/permissions.ts` — `ACTIONS.APPROVE`
- `backend/src/shared/middleware/permission.middleware.ts` — `checkPermission`, `auditLogger`
- `backend/src/shared/middleware/validateInventoryStok.ts` — pola zod validator existing
- `frontend/src/pages/inventory/stok/TransaksiListPage.tsx` — target integrasi UI
- `frontend/src/types/inventory.ts` — types + `ApprovalStatus`
- `frontend/src/hooks/useInventoryStok.ts` — pola mutations existing

---

Setelah spec ini disetujui, langkah berikutnya adalah menyusun implementation plan lewat skill `superpowers:writing-plans`.
