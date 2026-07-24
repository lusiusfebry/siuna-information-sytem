# Spesifikasi: Void / Amend Transaksi (Koreksi Input Salah)

- **Tanggal:** 2026-07-23
- **Modul:** Inventory
- **Status:** Menunggu review & persetujuan implementasi
- **Prioritas:** #2

---

## 1. Latar Belakang & Masalah

Admin sering salah input transaksi inventory: salah produk, salah quantity, salah gudang, atau salah penerima. Saat ini **tidak ada mekanisme koreksi resmi**:

1. Transaksi yang sudah dibuat tidak bisa dibatalkan
2. Transaksi yang sudah di-approve tidak bisa dikoreksi
3. Admin terpaksa membuat transaksi lawan (counter-transaction) secara manual tanpa jejak audit yang jelas
4. Data historis menjadi kotor dan sulit di-audit

Fakta teknis terverifikasi (`stok.service.ts`):
- Transaksi punya `approval_status: 'Pending' | 'Approved' | 'Rejected'`
- Transaksi **Pending** belum mempengaruhi stok (efek di-*defer* sampai approve — lihat `approveTransaksi` line 401)
- Transaksi **Approved** sudah mengubah stok/serial via `applyTransaksiEffects` (line 343)
- `rejectTransaksi` (line 435) hanya menandai row Pending → Rejected, tidak ada efek yang perlu di-reverse
- Untuk transaksi Approved, efek sudah diterapkan sehingga **tidak bisa** sekadar dihapus — perlu transaksi koreksi (Adjustment)

## 2. Tujuan

Menyediakan dua mekanisme koreksi resmi dengan jejak audit lengkap:

### 2.1 Void (Batalkan)
- Untuk transaksi berstatus **Pending** (belum apply efek) → cukup ubah status ke "Voided"
- Untuk transaksi berstatus **Approved** (sudah apply efek) → **NOT** direct void. Harus lewat Amend/reversal (lihat 2.2). Void hanya untuk yang belum apply efek.

### 2.2 Amend (Koreksi)
- Untuk transaksi berstatus **Approved** → buat **transaksi Adjustment koreksi** (reversal) dengan alasan wajib
- Data historis **tidak diubah** (immutable) — koreksi berupa transaksi baru yang saling terkait
- Jejak audit: siapa amend, kapan, alasan, transaksi mana yang dikoreksi

## 3. Di Luar Lingkup

- **Edit langsung transaksi historis** — data historis immutable, koreksi selalu via transaksi baru
- **Void transaksi Approved** — tidak diizinkan; harus lewat Amend (reversal + koreksi)
- **Cascading void** — jika transaksi punya paired transfer (Transfer Masuk/Gudang), void harus handle keduanya (lihat §4.3)

## 4. Arsitektur

### 4.1 Database — Migrasi 68 (atau 69 jika consumable duluan)

**Tabel `inv_transaksi`** — tambah kolom:
```sql
-- Status Voided (extend enum existing)
ALTER TYPE inv_transaksi_approval_status_enum ADD VALUE 'Voided';

-- Jejak void/amend
ALTER TABLE inv_transaksi
ADD COLUMN voided_by INTEGER NULL REFERENCES users(id),
ADD COLUMN voided_at TIMESTAMP NULL,
ADD COLUMN void_reason TEXT NULL,
ADD COLUMN amends_transaksi_id INTEGER NULL REFERENCES inv_transaksi(id),
ADD COLUMN amended_by_transaksi_id INTEGER NULL REFERENCES inv_transaksi(id);
```

Penjelasan kolom:
- `voided_by`, `voided_at`, `void_reason` — jejak pembatalan
- `amends_transaksi_id` — pada transaksi koreksi: menunjuk transaksi asli yang dikoreksi
- `amended_by_transaksi_id` — pada transaksi asli: menunjuk transaksi koreksi (relasi balik)

**Index:**
```sql
CREATE INDEX idx_transaksi_amends ON inv_transaksi(amends_transaksi_id);
CREATE INDEX idx_transaksi_voided_by ON inv_transaksi(voided_by);
```

### 4.2 Backend — Models

**`Transaksi.ts`** — tambah field:
```typescript
public approval_status!: 'Pending' | 'Approved' | 'Rejected' | 'Voided';
public voided_by!: number | null;
public voided_at!: Date | null;
public void_reason!: string | null;
public amends_transaksi_id!: number | null;
public amended_by_transaksi_id!: number | null;

// Associations:
Transaksi.belongsTo(Transaksi, { 
  foreignKey: 'amends_transaksi_id', 
  as: 'transaksi_asli' 
});
Transaksi.hasOne(Transaksi, { 
  foreignKey: 'amends_transaksi_id', 
  as: 'transaksi_koreksi' 
});
```

### 4.3 Backend — Service Layer

**`stok.service.ts`** — tambah 2 method:

```typescript
// VOID: hanya untuk transaksi Pending (belum apply efek)
async voidTransaksi(id: number, userId: number, reason: string): Promise<InvTransaksi> {
  if (!reason || reason.trim().length < 5) {
    throw new AppError('Alasan pembatalan wajib diisi (minimal 5 karakter)', 400);
  }
  
  const t = await sequelize.transaction();
  try {
    const transaksi = await InvTransaksi.findByPk(id, { 
      transaction: t, 
      lock: t.LOCK.UPDATE 
    });
    if (!transaksi) throw new AppError('Transaksi tidak ditemukan', 404);
    
    // HANYA transaksi Pending yang bisa di-void langsung
    if (transaksi.approval_status !== 'Pending') {
      throw new AppError(
        `Hanya transaksi Pending yang bisa dibatalkan. Transaksi ini berstatus ${transaksi.approval_status}. ` +
        `Gunakan Koreksi (Amend) untuk transaksi yang sudah disetujui.`,
        400
      );
    }
    
    // Pending belum apply efek → cukup ubah status (tidak ada reversal stok)
    await transaksi.update({
      approval_status: 'Voided',
      voided_by: userId,
      voided_at: new Date(),
      void_reason: reason.trim(),
    }, { transaction: t });
    
    await t.commit();
    return this.getTransaksiDetail(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

// AMEND: untuk transaksi Approved — buat transaksi koreksi (reversal)
async amendTransaksi(
  id: number, 
  userId: number, 
  reason: string,
  koreksi: { details: TransaksiDetailInput[] } // koreksi baru (opsional, jika null = full reversal)
): Promise<{ reversal: InvTransaksi; koreksi: InvTransaksi | null }> {
  if (!reason || reason.trim().length < 5) {
    throw new AppError('Alasan koreksi wajib diisi (minimal 5 karakter)', 400);
  }
  
  const t = await sequelize.transaction();
  try {
    const original = await InvTransaksi.findByPk(id, { 
      transaction: t, 
      lock: t.LOCK.UPDATE 
    });
    if (!original) throw new AppError('Transaksi tidak ditemukan', 404);
    
    if (original.approval_status !== 'Approved') {
      throw new AppError(
        `Hanya transaksi Approved yang bisa dikoreksi. Transaksi ini berstatus ${original.approval_status}.`,
        400
      );
    }
    
    if (original.amended_by_transaksi_id) {
      throw new AppError('Transaksi ini sudah pernah dikoreksi sebelumnya', 400);
    }
    
    // Cegah amend transaksi yang punya paired transfer (kompleksitas cascading)
    if (['Transfer Masuk', 'Transfer Gudang'].includes(original.sub_tipe)) {
      throw new AppError(
        'Transaksi transfer tidak bisa dikoreksi otomatis. Hubungi admin untuk koreksi manual.',
        400
      );
    }
    
    const originalDetails = await InvTransaksiDetail.findAll({ 
      where: { transaksi_id: id }, 
      transaction: t 
    });
    
    // 1. Buat transaksi REVERSAL (efek kebalikan dari transaksi asli)
    const reversalPayload = this.buildReversalPayload(original, originalDetails, userId, reason);
    const reversal = await this.createTransaksiInternal(reversalPayload, userId, t);
    
    // Reversal auto-approved (koreksi internal, sudah otorisasi via amend)
    await this.applyTransaksiEffects(reversal, reversalPayload, userId, t);
    await reversal.update({ 
      approval_status: 'Approved',
      approved_by: userId,
      approved_at: new Date(),
      amends_transaksi_id: original.id,
    }, { transaction: t });
    
    // 2. Tandai transaksi asli
    await original.update({
      amended_by_transaksi_id: reversal.id,
    }, { transaction: t });
    
    // 3. (Opsional) Buat transaksi koreksi baru jika koreksi.details disediakan
    let koreksiTransaksi: InvTransaksi | null = null;
    if (koreksi?.details?.length) {
      const koreksiPayload = {
        ...this.buildPayloadFromTransaksi(original, originalDetails),
        details: koreksi.details,
        catatan: `Koreksi dari transaksi ${original.nomor_transaksi}: ${reason}`,
      };
      koreksiTransaksi = await this.createTransaksiInternal(koreksiPayload, userId, t);
      await this.applyTransaksiEffects(koreksiTransaksi, koreksiPayload, userId, t);
      await koreksiTransaksi.update({
        approval_status: 'Approved',
        approved_by: userId,
        approved_at: new Date(),
      }, { transaction: t });
    }
    
    await t.commit();
    return { 
      reversal: await this.getTransaksiDetail(reversal.id), 
      koreksi: koreksiTransaksi ? await this.getTransaksiDetail(koreksiTransaksi.id) : null 
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

// Bangun payload reversal (efek kebalikan)
private buildReversalPayload(
  original: InvTransaksi, 
  details: InvTransaksiDetail[], 
  userId: number,
  reason: string
): TransaksiPayload {
  // Reversal = kebalikan tipe
  // Masuk → Keluar (kembalikan stok yang tadi masuk)
  // Keluar → Masuk (kembalikan stok yang tadi keluar)
  // Adjustment → Adjustment lawan
  const reversalTipe = original.tipe === 'Masuk' ? 'Keluar' 
    : original.tipe === 'Keluar' ? 'Masuk' 
    : 'Adjustment';
  
  return {
    tipe: reversalTipe,
    sub_tipe: original.sub_tipe, // pertahankan konteks
    tanggal: new Date(),
    gudang_id: original.gudang_id,
    gudang_tujuan_id: original.gudang_tujuan_id ?? undefined,
    karyawan_id: original.karyawan_id ?? undefined,
    facility_building_id: original.facility_building_id ?? undefined,
    facility_room_id: original.facility_room_id ?? undefined,
    catatan: `REVERSAL transaksi ${original.nomor_transaksi}: ${reason}`,
    created_by: userId,
    details: details.map(d => ({
      produk_id: d.produk_id,
      uom_id: d.uom_id,
      jumlah: d.jumlah,
      serial_numbers: d.serial_numbers ?? undefined,
      catatan: d.catatan ?? undefined,
    })),
  };
}
```

**⚠️ Catatan penting tentang reversal serial:**
- Reversal transaksi ber-serial rumit: melepas serial yang tadi diberikan ke karyawan, atau mengembalikan status serial. Perlu hati-hati agar status serial konsisten.
- **Rekomendasi:** untuk fase awal, batasi Amend ke transaksi **non-serial** saja. Transaksi ber-serial dikoreksi via alur retur/re-issue existing yang sudah teruji. Tambahkan guard:
```typescript
const hasSerial = originalDetails.some(d => d.serial_numbers?.length);
if (hasSerial) {
  throw new AppError(
    'Transaksi dengan serial number dikoreksi via alur Retur/Serah Terima, bukan Amend otomatis.',
    400
  );
}
```

### 4.4 Backend — Controller & Routes

**`stok.controller.ts`** — tambah handler:
```typescript
async voidTransaksi(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;
    const result = await stokService.voidTransaksi(Number(id), userId, reason);
    res.json({ status: 'success', data: result, message: 'Transaksi berhasil dibatalkan' });
  } catch (error) {
    next(error);
  }
}

async amendTransaksi(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason, koreksi } = req.body;
    const userId = req.user!.id;
    const result = await stokService.amendTransaksi(Number(id), userId, reason, koreksi);
    res.json({ status: 'success', data: result, message: 'Transaksi berhasil dikoreksi' });
  } catch (error) {
    next(error);
  }
}
```

**`inventory.routes.ts`** — tambah route:
```typescript
// Void: butuh permission approve (otoritas lebih tinggi dari create)
router.post(
  '/transaksi/:id/void',
  checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.APPROVE),
  auditLogger('inv_transaksi'),
  (req, res, next) => stokController.voidTransaksi(req, res, next)
);

router.post(
  '/transaksi/:id/amend',
  checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.APPROVE),
  auditLogger('inv_transaksi'),
  (req, res, next) => stokController.amendTransaksi(req, res, next)
);
```

### 4.5 Frontend — Komponen

**Detail transaksi** (`TransaksiDetailPage.tsx`) — tambah tombol aksi berdasarkan status:

```tsx
{transaksi.approval_status === 'Pending' && (
  <button onClick={() => setShowVoidModal(true)} className="btn-danger">
    <span className="material-symbols-outlined">cancel</span>
    Batalkan Transaksi
  </button>
)}

{transaksi.approval_status === 'Approved' && !transaksi.amended_by_transaksi_id && (
  <button onClick={() => setShowAmendModal(true)} className="btn-warning">
    <span className="material-symbols-outlined">edit_note</span>
    Koreksi Transaksi
  </button>
)}

{transaksi.approval_status === 'Voided' && (
  <div className="alert alert-secondary">
    <span className="material-symbols-outlined">block</span>
    Transaksi dibatalkan oleh {transaksi.voided_by_user?.nama} pada{' '}
    {formatDate(transaksi.voided_at)}. Alasan: {transaksi.void_reason}
  </div>
)}

{transaksi.amended_by_transaksi_id && (
  <div className="alert alert-info">
    <span className="material-symbols-outlined">history</span>
    Transaksi ini telah dikoreksi. 
    <Link to={`/inventory/transaksi/${transaksi.amended_by_transaksi_id}`}>
      Lihat transaksi koreksi
    </Link>
  </div>
)}
```

**Modal Void** (`VoidTransaksiModal.tsx`):
```tsx
export const VoidTransaksiModal: React.FC<{
  transaksiId: number;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ transaksiId, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const voidMutation = useVoidTransaksi();
  
  const handleSubmit = async () => {
    if (reason.trim().length < 5) {
      toast.error('Alasan pembatalan minimal 5 karakter');
      return;
    }
    try {
      await voidMutation.mutateAsync({ id: transaksiId, reason });
      toast.success('Transaksi berhasil dibatalkan');
      onSuccess();
    } catch (e) {
      toast.error('Gagal membatalkan transaksi');
    }
  };
  
  return (
    <Modal title="Batalkan Transaksi" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">
        Transaksi yang dibatalkan tidak dapat dikembalikan. 
        Pastikan tindakan ini sudah benar.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Alasan pembatalan (wajib, minimal 5 karakter)"
        required
        rows={3}
        className="w-full border rounded p-2"
      />
      <div className="flex gap-2 justify-end mt-4">
        <button onClick={onClose} className="btn-secondary">Batal</button>
        <button 
          onClick={handleSubmit} 
          disabled={voidMutation.isPending}
          className="btn-danger"
        >
          {voidMutation.isPending ? 'Memproses...' : 'Ya, Batalkan'}
        </button>
      </div>
    </Modal>
  );
};
```

**Modal Amend** (`AmendTransaksiModal.tsx`) — serupa dengan Void tapi ada opsi input koreksi + alasan wajib.

### 4.6 Frontend — Hooks

**`useTransaksi.ts`** — tambah mutations:
```typescript
export const useVoidTransaksi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      inventoryService.voidTransaksi(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaksi'] });
      queryClient.invalidateQueries({ queryKey: ['stok'] });
    },
  });
};

export const useAmendTransaksi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, koreksi }: AmendParams) =>
      inventoryService.amendTransaksi(id, reason, koreksi),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaksi'] });
      queryClient.invalidateQueries({ queryKey: ['stok'] });
    },
  });
};
```

## 5. Alur Data (Contoh)

### Skenario 1: Void transaksi Pending
1. Admin buat transaksi "Ke Karyawan" → status Pending
2. Admin sadar salah pilih karyawan → buka detail transaksi
3. Klik "Batalkan Transaksi" → modal void
4. Isi alasan: "Salah pilih karyawan, seharusnya Budi bukan Andi"
5. Submit → status berubah ke **Voided** (stok tidak terpengaruh karena Pending belum apply)
6. Transaksi tetap tersimpan dengan jejak: `voided_by`, `voided_at`, `void_reason`

### Skenario 2: Amend transaksi Approved (non-serial)
1. Admin buat transaksi "Supplier" (stok masuk) 100 pcs → Approved → stok +100
2. Admin sadar seharusnya 50 pcs → buka detail transaksi
3. Klik "Koreksi Transaksi" → modal amend
4. Isi alasan: "Salah input quantity, seharusnya 50 bukan 100"
5. (Opsional) Input koreksi: 50 pcs
6. Submit:
   - Sistem buat **Reversal** (Keluar 100 pcs) → stok -100 (kembali ke awal)
   - Sistem buat **Koreksi** (Masuk 50 pcs) → stok +50
   - Net effect: stok +50 (benar)
   - Transaksi asli ditandai `amended_by_transaksi_id`
7. Audit trail: 3 transaksi saling terkait (asli, reversal, koreksi)

## 6. Penanganan Error & Validasi

| Error Case | Response | HTTP |
|------------|----------|------|
| Void transaksi non-Pending | "Hanya transaksi Pending yang bisa dibatalkan..." | 400 |
| Void/Amend tanpa alasan | "Alasan wajib diisi (minimal 5 karakter)" | 400 |
| Amend transaksi non-Approved | "Hanya transaksi Approved yang bisa dikoreksi..." | 400 |
| Amend transaksi yang sudah di-amend | "Transaksi ini sudah pernah dikoreksi sebelumnya" | 400 |
| Amend transaksi transfer | "Transaksi transfer tidak bisa dikoreksi otomatis..." | 400 |
| Amend transaksi ber-serial | "Transaksi dengan serial number dikoreksi via alur Retur..." | 400 |
| Reversal menyebabkan stok negatif | "Koreksi menyebabkan stok negatif, tidak dapat diproses" | 400 |

## 7. Testing

### Backend (Jest) — `void-amend.test.ts`
- ✅ Void transaksi Pending → status Voided, stok tidak berubah
- ✅ Void transaksi Approved → error 400
- ✅ Void tanpa alasan → error 400
- ✅ Amend transaksi Approved non-serial → reversal + koreksi dibuat, net stok benar
- ✅ Amend transaksi Pending → error (harus Approved)
- ✅ Amend transaksi yang sudah di-amend → error
- ✅ Amend transaksi transfer → error (blocked)
- ✅ Amend transaksi ber-serial → error (blocked, pakai retur)
- ✅ Reversal payload: Masuk→Keluar, Keluar→Masuk
- ✅ Audit fields terisi (voided_by, amends_transaksi_id, dll)
- ✅ Reversal rollback jika stok jadi negatif

### Frontend (Vitest)
- ✅ Tombol Batalkan muncul hanya saat Pending
- ✅ Tombol Koreksi muncul hanya saat Approved & belum di-amend
- ✅ Badge "Voided" + info voider saat status Voided
- ✅ Link ke transaksi koreksi saat sudah di-amend
- ✅ Modal validasi alasan minimal 5 karakter

## 8. Kompatibilitas & Keamanan

- **Permission:** Void & Amend butuh `inventory_stock:approve` (otoritas lebih tinggi dari create) — mencegah user biasa membatalkan transaksi orang lain
- **Audit:** semua aksi tercatat via `auditLogger` middleware existing + kolom jejak di tabel
- **Immutability:** data historis tidak diubah, koreksi selalu transaksi baru
- **Transaksi DB:** semua operasi void/amend dibungkus DB transaction (rollback jika gagal)
- **Backward compat:** transaksi existing default `approval_status` tidak berubah; kolom baru nullable

## 9. Estimasi Effort

**Total: 10-14 jam** (1.5-2 hari dev)

| Task | Estimasi |
|------|----------|
| Migration (schema void/amend) | 45 menit |
| Backend models update | 30 menit |
| Backend voidTransaksi | 1.5 jam |
| Backend amendTransaksi + buildReversalPayload | 3 jam |
| Backend controller & routes | 45 menit |
| Backend tests | 3 jam |
| Frontend modals (Void + Amend) | 2 jam |
| Frontend detail page integration | 1.5 jam |
| Frontend tests | 1 jam |
| Documentation | 30 menit |

**Dependensi:** Tidak ada hard dependency, tapi sebaiknya setelah Consumable (agar migrasi berurutan rapi).

**Risiko:** Medium — reversal logic butuh ketelitian, terutama untuk edge case. Mitigasi: batasi scope awal ke non-serial, non-transfer.

---

## Lampiran: Diagram Relasi Amend

```
Transaksi Asli (Approved)          Transaksi Reversal              Transaksi Koreksi
┌──────────────────────┐          ┌──────────────────────┐        ┌──────────────────────┐
│ id: 100              │          │ id: 101              │        │ id: 102              │
│ tipe: Masuk          │◄─────────│ amends_transaksi_id: │        │ tipe: Masuk          │
│ jumlah: 100          │  100     │   100                │        │ jumlah: 50           │
│ amended_by: 101      │─────────►│ tipe: Keluar         │        │ (koreksi baru)       │
│ status: Approved     │          │ jumlah: 100          │        │ status: Approved     │
└──────────────────────┘          │ status: Approved     │        └──────────────────────┘
                                   └──────────────────────┘
   Efek stok:  +100          →         -100 (reversal)      →         +50 (koreksi)
   Net akhir:  +50 (benar)
```
