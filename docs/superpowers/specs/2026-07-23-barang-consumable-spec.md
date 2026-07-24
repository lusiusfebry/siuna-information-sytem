# Spesifikasi: Barang Consumable

- **Tanggal:** 2026-07-23
- **Modul:** Inventory
- **Status:** Menunggu review & persetujuan implementasi
- **Prioritas:** #1 (effort teringan dari tiga fitur roadmap)
- **Tujuan pengeluaran:** Karyawan & Divisi

---

## 1. Latar Belakang & Masalah

Sistem inventory saat ini hanya melacak **aset** (barang ber-serial/ber-tag) dan **produk non-serial** yang diperlakukan sebagai aset (stok gudang, ke karyawan via serial/tag). Belum ada mekanisme untuk mencatat **barang habis pakai (consumable)** seperti bolpoin, kertas, tinta printer, dll yang:

1. **Perlu dicatat** masuk/keluar dari gudang untuk kontrol inventaris
2. **Bukan aset** — tidak perlu tracking individual per unit
3. **Diberikan ke divisi/departemen** atau ke karyawan individual
4. **Habis dipakai** — tidak ada retur/disposal formal seperti aset

Contoh use case:
- 1 box bolpoin (50 pcs) diberikan ke Divisi IT untuk pemakaian umum
- 1 rim kertas A4 diberikan ke karyawan "Budi" untuk keperluan kantor
- 10 cartridge tinta diberikan ke Divisi Marketing

Saat ini admin terpaksa:
- Tidak mencatat consumable sama sekali (tidak ada visibility stok)
- Atau mencatat sebagai "Ke Karyawan" dengan mengetik serial palsu (melanggar integritas data)

## 2. Tujuan

Menambahkan penanganan **barang consumable** ke sistem inventory dengan karakteristik:

1. **Flag produk sebagai consumable** — admin dapat menandai produk tertentu sebagai barang habis pakai
2. **Transaksi pengeluaran consumable** — sub-tipe transaksi baru "Konsumsi" untuk pengeluaran consumable ke karyawan atau divisi
3. **Tidak tracking serial/tag** — consumable tidak menggunakan `inv_serial_number` (hanya quantity di stok gudang)
4. **Target ganda: Karyawan & Divisi** — bisa keluar ke karyawan individual atau ke departemen/divisi
5. **Laporan consumable** — visibility pemakaian consumable per divisi/periode

## 3. Di Luar Lingkup

- **Retur consumable** — barang habis pakai tidak diretur (sekali keluar = habis). Jika ada sisa yang dikembalikan, itu use case exception yang ditangani manual via Adjustment.
- **Disposal consumable** — tidak ada disposal formal; consumable dianggap habis saat keluar.
- **Tracking saldo consumable per karyawan/divisi** — sistem hanya mencatat **pengeluaran** (siapa menerima, berapa jumlah). Tidak melacak sisa/saldo consumable di tangan karyawan/divisi (berbeda dengan aset yang terlacak via `inv_serial_number`).
- **Approval khusus consumable** — mengikuti approval logic existing: `tipe: 'Keluar'` butuh approval (konsisten dengan transaksi keluar lain).

## 4. Arsitektur

### 4.1 Database — Migrasi 68

**Tabel `inv_produk`** — tambah kolom:
```sql
ALTER TABLE inv_produk 
ADD COLUMN is_consumable BOOLEAN DEFAULT FALSE NOT NULL;
```

**Tabel `inv_transaksi`** — tambah kolom + sub_tipe:
```sql
-- Tambah target departemen
ALTER TABLE inv_transaksi 
ADD COLUMN department_id INTEGER NULL,
ADD CONSTRAINT fk_transaksi_department 
  FOREIGN KEY (department_id) REFERENCES department(id);

-- Tambah sub_tipe baru
ALTER TYPE inv_transaksi_sub_tipe_enum 
ADD VALUE 'Konsumsi';
```

**Index baru:**
```sql
CREATE INDEX idx_transaksi_department_id ON inv_transaksi(department_id);
CREATE INDEX idx_produk_is_consumable ON inv_produk(is_consumable);
```

**Validasi data:**
- Migrasi memastikan tidak ada produk existing yang `has_serial_number=true` dan `is_consumable=true` bersamaan (mutually exclusive)
- `inv_transaksi` dengan `sub_tipe='Konsumsi'` harus punya `karyawan_id` ATAU `department_id` (salah satu wajib ada)

### 4.2 Backend — Models

**`Produk.ts`** — tambah field:
```typescript
public is_consumable!: boolean;

// Di definisi kolom:
is_consumable: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
},
```

**`Transaksi.ts`** — tambah field & sub_tipe:
```typescript
public department_id!: number | null;
public department?: any; // association

// Update sub_tipe ENUM:
public sub_tipe!: 'Supplier' | 'Transfer Masuk' | 'Retur Karyawan' | 
  'Ke Karyawan' | 'Transfer Gudang' | 'Disposal' | 'Opname' | 
  'Ke Gedung/Mess' | 'Rusak/Terbuang' | 'Ambil dari Gedung' | 'Konsumsi';

// Di definisi kolom tambah 'Konsumsi':
sub_tipe: {
  type: DataTypes.ENUM(...existing..., 'Konsumsi'),
  allowNull: false,
},
department_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
  references: { model: 'department', key: 'id' },
},

// Di associations:
Transaksi.belongsTo(Department, { 
  foreignKey: 'department_id', 
  as: 'department' 
});
```

### 4.3 Backend — Service Layer

**`stok.service.ts`** — tambah branch 'Konsumsi' di `handleStokKeluar`:

Insertion point: setelah line 614 (`async handleStokKeluar`), tambah kondisi:

```typescript
// Existing: handleStokKeluar routing per sub_tipe
async handleStokKeluar(transaksi: Transaksi, details: TransaksiDetail[], t: Transaction) {
  const gudangId = transaksi.gudang_id!;
  
  // TAMBAHAN BARU - handle Konsumsi
  if (transaksi.sub_tipe === 'Konsumsi') {
    return this.handleKonsumsi(transaksi, details, gudangId, t);
  }
  
  // ... existing branches (Ke Karyawan, Transfer Gudang, dll)
}

private async handleKonsumsi(
  transaksi: Transaksi,
  details: TransaksiDetail[],
  gudangId: number,
  t: Transaction
): Promise<void> {
  // Validasi: harus ada karyawan_id ATAU department_id
  if (!transaksi.karyawan_id && !transaksi.department_id) {
    throw new Error('Transaksi Konsumsi harus memiliki target karyawan atau departemen');
  }
  
  // Validasi: semua produk harus consumable & non-serial
  for (const detail of details) {
    const produk = await Produk.findByPk(detail.produk_id);
    if (!produk) {
      throw new Error(`Produk ${detail.produk_id} tidak ditemukan`);
    }
    if (!produk.is_consumable) {
      throw new Error(`Produk "${produk.nama}" bukan barang consumable`);
    }
    if (produk.has_serial_number || produk.has_tag_number) {
      throw new Error(`Produk "${produk.nama}" adalah aset (ber-serial/tag), tidak bisa dikonsumsi`);
    }
  }
  
  // Hanya kurangi stok gudang (TIDAK ada update inv_serial_number)
  for (const detail of details) {
    await this.upsertStok(
      detail.produk_id,
      gudangId,
      detail.uom_id,
      -detail.jumlah, // decrement
      t
    );
  }
  
  // Tidak ada operasi pada inv_serial_number karena consumable tidak terlacak per unit
  // Record penerima sudah ada di transaksi.karyawan_id atau transaksi.department_id
}
```

**Approval logic** — tidak perlu perubahan:
- `requiresApproval` sudah mengembalikan `true` untuk `tipe === 'Keluar'` (line 331-335)
- Transaksi Konsumsi otomatis `tipe: 'Keluar'` → masuk antrean approval
- Replay payload via `buildPayloadFromTransaksi` sudah mendukung `karyawan_id` dan bisa ditambahkan `department_id`

**Validasi produk consumable** — tambah di validator:

File baru `modules/inventory/validators/consumable.validator.ts`:
```typescript
import { body } from 'express-validator';

export const createKonsumsiValidation = [
  body('sub_tipe').equals('Konsumsi'),
  body('tipe').equals('Keluar'),
  body('gudang_id').isInt().withMessage('Gudang wajib diisi'),
  
  // Salah satu wajib ada
  body().custom((value, { req }) => {
    if (!req.body.karyawan_id && !req.body.department_id) {
      throw new Error('Target karyawan atau departemen wajib diisi');
    }
    if (req.body.karyawan_id && req.body.department_id) {
      throw new Error('Hanya boleh satu target (karyawan atau departemen)');
    }
    return true;
  }),
  
  body('details').isArray({ min: 1 }).withMessage('Detail transaksi wajib diisi'),
  body('details.*.produk_id').isInt(),
  body('details.*.uom_id').isInt(),
  body('details.*.jumlah').isInt({ min: 1 }),
];
```

### 4.4 Backend — Controller & Routes

**`transaksi.controller.ts`** — tidak perlu perubahan khusus, sudah generic

**`inventory.routes.ts`** — tambah validator:
```typescript
import { createKonsumsiValidation } from '../validators/consumable.validator';

// Route existing untuk create transaksi sudah support sub_tipe apapun,
// tapi bisa tambahkan validator khusus jika ingin strict:
router.post(
  '/transaksi',
  authenticate,
  checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.CREATE),
  validate(createTransaksiValidation), // existing generic validator
  transaksiController.createTransaksi
);
```

### 4.5 Backend — Laporan Consumable

**Service baru** `modules/inventory/services/consumable.service.ts`:
```typescript
export class ConsumableService {
  async getLaporanKonsumsi(params: {
    start_date?: string;
    end_date?: string;
    department_id?: number;
    karyawan_id?: number;
    produk_id?: number;
  }) {
    const where: any = { sub_tipe: 'Konsumsi' };
    
    if (params.start_date) where.tanggal_transaksi = { [Op.gte]: params.start_date };
    if (params.end_date) where.tanggal_transaksi = { [Op.lte]: params.end_date };
    if (params.department_id) where.department_id = params.department_id;
    if (params.karyawan_id) where.karyawan_id = params.karyawan_id;
    
    const transaksi = await Transaksi.findAll({
      where,
      include: [
        { model: TransaksiDetail, include: [Produk, UOM] },
        { model: Karyawan, as: 'karyawan' },
        { model: Department, as: 'department' },
        { model: Gudang },
      ],
      order: [['tanggal_transaksi', 'DESC']],
    });
    
    // Group by produk & target (department/karyawan)
    const summary = this.groupKonsumsi(transaksi);
    
    return { transaksi, summary };
  }
  
  private groupKonsumsi(transaksi: Transaksi[]) {
    // Implementasi grouping untuk summary
    // Return: { per_produk, per_department, per_karyawan, total_nilai }
  }
}
```

**Endpoint baru:**
```typescript
// GET /inventory/laporan/consumable
router.get(
  '/laporan/consumable',
  authenticate,
  checkPermission(RESOURCES.INVENTORY_REPORTS, ACTIONS.READ),
  consumableController.getLaporanKonsumsi
);
```

### 4.6 Frontend — Komponen

**Form produk** (`ProdukFormPage.tsx`) — tambah toggle:
```tsx
<div className="form-group">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={formData.is_consumable}
      onChange={(e) => setFormData({ ...formData, is_consumable: e.target.checked })}
      disabled={formData.has_serial_number || formData.has_tag_number}
    />
    <span>Barang Consumable (habis pakai)</span>
  </label>
  <p className="text-sm text-gray-500 mt-1">
    Barang consumable tidak dilacak per unit. Mutually exclusive dengan serial/tag.
  </p>
</div>

{/* Validasi: jika is_consumable = true, disable has_serial_number & has_tag_number */}
{formData.is_consumable && (
  <div className="alert alert-info">
    ℹ️ Barang consumable tidak bisa memiliki serial number atau tag number
  </div>
)}
```

**Form transaksi Konsumsi** — tambah sub_tipe di `TransaksiFormPage.tsx`:

```tsx
// Tambahkan 'Konsumsi' ke dropdown sub_tipe saat tipe='Keluar'
const subTipeOptions = {
  Keluar: [
    { value: 'Ke Karyawan', label: 'Ke Karyawan' },
    { value: 'Transfer Gudang', label: 'Transfer Gudang' },
    { value: 'Disposal', label: 'Disposal' },
    { value: 'Ke Gedung/Mess', label: 'Ke Gedung/Mess' },
    { value: 'Rusak/Terbuang', label: 'Rusak/Terbuang' },
    { value: 'Konsumsi', label: 'Konsumsi (Consumable)' }, // BARU
  ],
  // ... existing
};

// Saat sub_tipe === 'Konsumsi', tampilkan:
{subTipe === 'Konsumsi' && (
  <>
    {/* Pilihan target: Karyawan ATAU Divisi */}
    <div className="form-group">
      <label>Target Konsumsi</label>
      <select 
        value={targetType} 
        onChange={(e) => setTargetType(e.target.value)}
      >
        <option value="">-- Pilih Target --</option>
        <option value="karyawan">Karyawan</option>
        <option value="divisi">Divisi/Departemen</option>
      </select>
    </div>
    
    {targetType === 'karyawan' && (
      <EmployeeSearchInput
        value={karyawanId}
        onChange={setKaryawanId}
        label="Karyawan Penerima"
        required
      />
    )}
    
    {targetType === 'divisi' && (
      <DepartmentSelect
        value={departmentId}
        onChange={setDepartmentId}
        label="Divisi/Departemen Penerima"
        required
      />
    )}
    
    {/* Filter produk: hanya consumable, non-serial */}
    <ProductPicker
      filter={{ is_consumable: true, has_serial_number: false, has_tag_number: false }}
      onSelect={handleProductSelect}
    />
    
    {/* Input quantity (tidak ada serial/tag picker) */}
    <QuantityInput
      value={quantity}
      onChange={setQuantity}
      uom={selectedProduct?.uom}
    />
  </>
)}
```

**Komponen helper baru:**

1. **`DepartmentSelect.tsx`** — dropdown divisi/departemen:
```tsx
export const DepartmentSelect: React.FC<{
  value: number | null;
  onChange: (id: number) => void;
  label?: string;
  required?: boolean;
}> = ({ value, onChange, label, required }) => {
  const { data: departments } = useDepartments();
  
  return (
    <div className="form-group">
      <label>{label || 'Departemen'} {required && '*'}</label>
      <select 
        value={value || ''} 
        onChange={(e) => onChange(Number(e.target.value))}
        required={required}
      >
        <option value="">-- Pilih Departemen --</option>
        {departments?.map(dept => (
          <option key={dept.id} value={dept.id}>
            {dept.code} - {dept.nama}
          </option>
        ))}
      </select>
    </div>
  );
};
```

2. **`QuantityInput.tsx`** — input jumlah dengan UOM display

**Halaman laporan consumable** — baru `pages/inventory/laporan/LaporanConsumablePage.tsx`:
```tsx
export const LaporanConsumablePage: React.FC = () => {
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    department_id: null,
    karyawan_id: null,
  });
  
  const { data: laporan } = useLaporanKonsumsi(filters);
  
  return (
    <div>
      <h1>Laporan Consumable</h1>
      
      {/* Filter: date range, department, karyawan */}
      <FilterPanel filters={filters} onChange={setFilters} />
      
      {/* Tabel transaksi */}
      <DataTable
        columns={[
          { header: 'Tanggal', accessor: 'tanggal_transaksi' },
          { header: 'Nomor', accessor: 'nomor_transaksi' },
          { header: 'Produk', accessor: 'produk.nama' },
          { header: 'Jumlah', accessor: 'jumlah' },
          { header: 'UOM', accessor: 'uom.kode' },
          { header: 'Penerima', accessor: row => 
            row.karyawan?.nama_lengkap || row.department?.nama 
          },
          { header: 'Gudang', accessor: 'gudang.nama' },
        ]}
        data={laporan?.transaksi || []}
      />
      
      {/* Summary cards */}
      <SummaryCards data={laporan?.summary} />
      
      {/* Export button */}
      <Button onClick={handleExport}>Export Excel</Button>
    </div>
  );
};
```

### 4.7 Frontend — Routes & Permissions

**`App.tsx`** — tambah route:
```tsx
<Route
  path="/inventory/laporan/consumable"
  element={
    <PermissionGuard resource={RESOURCES.INVENTORY_REPORTS} action={ACTIONS.READ}>
      <LaporanConsumablePage />
    </PermissionGuard>
  }
/>
```

**`Sidebar.tsx`** — tambah menu item:
```tsx
{
  name: 'Laporan Consumable',
  path: '/inventory/laporan/consumable',
  icon: 'inventory_2',
  permission: { resource: RESOURCES.INVENTORY_REPORTS, action: ACTIONS.READ }
}
```

## 5. Alur Data (Contoh)

### Skenario 1: Konsumsi ke Divisi
1. Admin buka **Buat Transaksi** → pilih `Keluar` → `Konsumsi`
2. Pilih **Gudang Pusat** sebagai gudang asal
3. Pilih **Target: Divisi** → pilih "Divisi IT"
4. Cari produk consumable: "Bolpoin Standard" (1 box = 50 pcs)
5. Input jumlah: 2 box
6. Submit → transaksi masuk **Pending** (karena tipe Keluar)
7. Admin approval → transaksi **Approved** → stok gudang -2 box
8. Record tersimpan: `karyawan_id=null`, `department_id=42` (Divisi IT)

### Skenario 2: Konsumsi ke Karyawan
1. Admin buka **Buat Transaksi** → `Keluar` → `Konsumsi`
2. Gudang: **Gudang Pusat**
3. Target: **Karyawan** → cari "Budi Santoso"
4. Produk: "Kertas A4" (1 rim = 500 lembar)
5. Jumlah: 3 rim
6. Submit → Pending → Approved → stok -3 rim
7. Record: `karyawan_id=17`, `department_id=null`

### Skenario 3: Laporan Consumable
1. Admin buka **Laporan Consumable**
2. Filter: Divisi IT, periode Jan-Mar 2026
3. Sistem tampilkan:
   - Tabel transaksi: tanggal, produk, jumlah, penerima
   - Summary: Total per produk (Bolpoin: 10 box, Kertas: 25 rim, dll)
   - Total per divisi (Divisi IT: Rp 5.500.000)
4. Export Excel untuk arsip

## 6. Penanganan Error & Validasi

| Error Case | Response | HTTP Code |
|------------|----------|-----------|
| Submit Konsumsi tanpa target (karyawan & department null) | "Target karyawan atau departemen wajib diisi" | 400 |
| Submit dengan kedua target terisi | "Hanya boleh satu target (karyawan atau departemen)" | 400 |
| Produk bukan consumable | "Produk '{nama}' bukan barang consumable" | 400 |
| Produk consumable ber-serial/tag | "Produk '{nama}' adalah aset (ber-serial/tag), tidak bisa dikonsumsi" | 400 |
| Stok gudang tidak cukup | "Stok {produk} di {gudang} tidak mencukupi (tersedia: {x}, diminta: {y})" | 400 |
| Set `is_consumable=true` pada produk ber-serial existing | "Produk ber-serial/tag tidak bisa dijadikan consumable" | 400 |
| Department_id tidak valid | "Departemen tidak ditemukan" | 404 |

Semua pesan error dalam bahasa Indonesia (konvensi proyek).

## 7. Testing

### Backend (Jest)

**`consumable.service.test.ts`:**
- ✅ Create produk dengan `is_consumable=true`
- ✅ Validasi mutually exclusive: `is_consumable=true` + `has_serial_number=true` → error
- ✅ Transaksi Konsumsi ke karyawan: stok berkurang, `karyawan_id` tercatat, tidak ada record `inv_serial_number`
- ✅ Transaksi Konsumsi ke divisi: stok berkurang, `department_id` tercatat
- ✅ Error saat submit tanpa target (karyawan & department null)
- ✅ Error saat submit produk non-consumable via Konsumsi
- ✅ Error saat submit produk ber-serial via Konsumsi
- ✅ Approval flow: Konsumsi masuk Pending → approve → stok berkurang
- ✅ Laporan consumable: filter per divisi, per periode, group by produk

**`stok.service.test.ts`** (extend existing):
- ✅ `requiresApproval` return `true` untuk `sub_tipe='Konsumsi'`
- ✅ `buildPayloadFromTransaksi` include `department_id` saat replay

### Frontend (Vitest)

**`TransaksiFormPage.test.tsx`:**
- ✅ Sub-tipe 'Konsumsi' muncul saat tipe 'Keluar'
- ✅ Pilih target karyawan → field department hidden
- ✅ Pilih target divisi → field karyawan hidden
- ✅ Product picker hanya tampilkan consumable
- ✅ Tidak ada serial/tag picker saat sub_tipe Konsumsi

**`ProdukFormPage.test.tsx`:**
- ✅ Toggle `is_consumable` disable `has_serial_number` & `has_tag_number`
- ✅ Validasi mutually exclusive di frontend

**`LaporanConsumablePage.test.tsx`:**
- ✅ Filter per divisi, per karyawan, per periode
- ✅ Summary cards display correct totals

## 8. Migrasi Data & Kompatibilitas

- **Produk existing:** semua produk default `is_consumable=false` → tidak ada perubahan perilaku
- **Transaksi existing:** tidak ada transaksi `sub_tipe='Konsumsi'` sebelumnya → tidak ada konflik
- **Department model:** sudah ada di modul HR → tinggal pakai FK
- **Backward compatibility:** semua sub-tipe & alur existing tidak berubah
- **Cache:** `Produk` model sudah punya hook invalidasi cache → otomatis handle `is_consumable` baru

## 9. Dokumentasi

Update file berikut:
- `CLAUDE.md` — tambahkan penjelasan consumable di section Architecture (model `Produk.is_consumable`, transaksi `Konsumsi`)
- `docs/ROADMAP-INVENTORY.md` — update status feature Consumable → "Selesai"
- API docs (Swagger) — tambahkan dokumentasi endpoint `/laporan/consumable` dan field baru

## 10. Estimasi Effort

**Total: 8-12 jam** (1-1.5 hari dev)

| Task | Estimasi |
|------|----------|
| Migration 68 (DB schema) | 30 menit |
| Backend models update | 30 menit |
| Backend service (handleKonsumsi + validator) | 2 jam |
| Backend laporan consumable service | 1.5 jam |
| Backend controller & routes | 30 menit |
| Backend tests | 2 jam |
| Frontend form transaksi (target picker + product filter) | 2 jam |
| Frontend laporan consumable page | 1.5 jam |
| Frontend tests | 1 jam |
| Documentation update | 30 menit |

**Dependensi:** Tidak ada — bisa dikerjakan langsung.

**Risiko:** Low — hanya additive (tidak mengubah alur existing).

---

## Lampiran A: Struktur Data

### Transaksi Konsumsi ke Karyawan
```json
{
  "nomor_transaksi": "TRX/OUT/2026/07/001",
  "tipe": "Keluar",
  "sub_tipe": "Konsumsi",
  "tanggal_transaksi": "2026-07-23",
  "gudang_id": 1,
  "karyawan_id": 17,
  "department_id": null,
  "approval_status": "Approved",
  "details": [
    {
      "produk_id": 45,
      "uom_id": 3,
      "jumlah": 3,
      "catatan": "Kertas A4 untuk administrasi",
      "serial_numbers": null
    }
  ]
}
```

### Transaksi Konsumsi ke Divisi
```json
{
  "nomor_transaksi": "TRX/OUT/2026/07/002",
  "tipe": "Keluar",
  "sub_tipe": "Konsumsi",
  "tanggal_transaksi": "2026-07-23",
  "gudang_id": 1,
  "karyawan_id": null,
  "department_id": 5,
  "approval_status": "Pending",
  "details": [
    {
      "produk_id": 46,
      "uom_id": 2,
      "jumlah": 2,
      "catatan": "Bolpoin untuk divisi IT",
      "serial_numbers": null
    }
  ]
}
```

## Lampiran B: Query Laporan

```sql
-- Konsumsi per divisi per bulan
SELECT 
  d.code AS kode_divisi,
  d.nama AS nama_divisi,
  p.nama AS produk,
  u.kode AS uom,
  SUM(td.jumlah) AS total_jumlah,
  DATE_TRUNC('month', t.tanggal_transaksi) AS bulan
FROM inv_transaksi t
JOIN inv_transaksi_detail td ON t.id = td.transaksi_id
JOIN inv_produk p ON td.produk_id = p.id
JOIN inv_uom u ON td.uom_id = u.id
JOIN department d ON t.department_id = d.id
WHERE t.sub_tipe = 'Konsumsi'
  AND t.approval_status = 'Approved'
  AND t.tanggal_transaksi BETWEEN '2026-01-01' AND '2026-12-31'
GROUP BY d.code, d.nama, p.nama, u.kode, bulan
ORDER BY bulan DESC, d.code, p.nama;
```
