# Void / Amend Transaksi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan endpoint & UI Void (batalkan transaksi Pending) dan Amend (koreksi transaksi Approved dengan reversal + optional koreksi baru) untuk modul inventory, dengan jejak audit lengkap dan tanpa mengubah data historis.

**Architecture:** Reversal ledger approach — transaksi amend membangun payload invers dari `sub_tipe` asli lalu dilewatkan ke `applyTransaksiEffects` yang sudah ada (approach A dari spec). Guard fail-closed menolak amend jika serial sudah berpindah lagi, penempatan fasilitas sudah ditarik, atau reversal menyebabkan stok negatif. Semua operasi (void, amend, paired reverse, koreksi) dibungkus satu DB transaction.

**Tech Stack:** Backend: Express + TypeScript + Sequelize + PostgreSQL, umzug migrations, Jest (unit + integration). Frontend: React 18 + Vite + TypeScript, React Query, react-hook-form + zod, TailwindCSS, Vitest.

## Global Constraints

- **Bahasa:** semua pesan error, label UI, tombol, badge, dan modal WAJIB Bahasa Indonesia.
- **Migration:** urutan berkelanjutan, nomor berikutnya = **69**. Nama enum `approval_status` = `enum_inv_transaksi_approval_status` (diverifikasi di migration 66).
- **Endpoint:** semua route Void/Amend di bawah `/api/inventory/transaksi/:id/`.
- **Permission:** endpoint void & amend WAJIB `checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.APPROVE)` + `auditLogger('inv_transaksi')`.
- **Field baru** (kolom & TS): `voided_by`, `voided_at`, `void_reason`, `amends_transaksi_id`, `amended_by_transaksi_id`. Semua nullable.
- **Reason:** minimal 5 karakter (setelah trim), divalidasi via zod di validator middleware.
- **Immutability:** transaksi asli hanya boleh di-update satu field: `amended_by_transaksi_id`. Field lain (tipe, sub_tipe, tanggal, gudang, karyawan, details) TIDAK boleh diubah.
- **Atomicity:** setiap operasi (void, amend, amend+koreksi) dibungkus satu `sequelize.transaction()`. Guard yang gagal di tengah alur men-rollback SEMUA efek.
- **Frontend contract:** `ApprovalStatus` union DIPERLUAS ke `'Pending' | 'Approved' | 'Rejected' | 'Voided'` — semua konsumen (badge, filter, laporan) harus tetap kompile.
- **Filter list default:** `Voided` + `Rejected` disembunyikan dari daftar transaksi default. Toggle `include_inactive` menampilkannya.
- **Reference:** spec detail di `docs/superpowers/specs/2026-07-25-void-amend-implementation-design.md` (peta invers per sub-tipe di §3.1, guard di §3.2, kontrak error di §6).

---

## File Structure

**Backend — dibuat:**
- `backend/src/database/migrations/69_add_void_amend_support.ts` — enum extend + 5 kolom + 3 index
- `backend/src/modules/inventory/services/__tests__/stok.void.test.ts` — unit test `voidTransaksi` (mocked DB)
- `backend/src/modules/inventory/services/__tests__/stok.amend.test.ts` — unit test `amendTransaksi` (mocked DB)
- `backend/src/modules/inventory/services/__tests__/integration/voidAmend.api.test.ts` — integration test end-to-end (real DB)

**Backend — dimodifikasi:**
- `backend/src/modules/inventory/models/Transaksi.ts` — perluas enum `approval_status`, tambah 5 field + Sequelize init
- `backend/src/modules/inventory/models/associations.ts` — tambah relasi `voider`, `transaksi_asli`, `transaksi_koreksi`, `transaksi_amender`
- `backend/src/modules/inventory/services/stok.service.ts` — extract `createTransaksiInternal`, tambah `voidTransaksi`, `amendTransaksi`, `validateReversalGuards`, `buildReversalPayload`; extend `getTransaksiList` dengan filter `include_inactive`
- `backend/src/modules/inventory/controllers/stok.controller.ts` — tambah handler `voidTransaksi`, `amendTransaksi`
- `backend/src/modules/inventory/routes/inventory.routes.ts` — tambah 2 route POST
- `backend/src/shared/middleware/validateInventoryStok.ts` — tambah `voidSchema`, `amendSchema`, export `validateVoid`, `validateAmend`

**Frontend — dibuat:**
- `frontend/src/components/inventory/VoidTransaksiModal.tsx`
- `frontend/src/components/inventory/AmendTransaksiModal.tsx`
- `frontend/src/components/inventory/__tests__/VoidTransaksiModal.test.tsx`
- `frontend/src/components/inventory/__tests__/AmendTransaksiModal.test.tsx`

**Frontend — dimodifikasi:**
- `frontend/src/types/inventory.ts` — perluas `ApprovalStatus`, tambah field & payload types
- `frontend/src/services/api/inventory.service.ts` (atau file service transaksi yang ada) — tambah `voidTransaksi`, `amendTransaksi`
- `frontend/src/hooks/useInventoryStok.ts` — tambah `useVoidTransaksi`, `useAmendTransaksi`; perluas `useTransaksiList` untuk `include_inactive`
- `frontend/src/pages/inventory/stok/TransaksiListPage.tsx` — tombol kondisional Batalkan/Koreksi + badge Voided / Reversal-dari / Dikoreksi-oleh + filter checkbox `include_inactive`

---

## Task Right-Sizing

Plan dibagi menjadi **12 task**. Backend dulu (task 1-9), frontend menyusul (task 10-12). Setiap task berakhir dengan test yang lulus + satu commit. Task boundaries dipilih agar reviewer bisa menolak satu task tanpa membatalkan tetangganya (mis. reviewer bisa reject cara handle serial di Task 6 tanpa menyentuh migration Task 1).

---

## Task 1: Migration 69 — enum + 5 kolom + 3 index

**Files:**
- Create: `backend/src/database/migrations/69_add_void_amend_support.ts`

**Interfaces:**
- Consumes: umzug `Migration` type dari `../umzug`
- Produces: kolom `voided_by`, `voided_at`, `void_reason`, `amends_transaksi_id`, `amended_by_transaksi_id` di `inv_transaksi`; nilai enum `'Voided'` di `enum_inv_transaksi_approval_status`; 3 index

- [ ] **Step 1: Buat file migration**

```typescript
// backend/src/database/migrations/69_add_void_amend_support.ts
import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

// Void/Amend transaksi support (INV-N08).
//
// Void: mengubah status transaksi Pending ke 'Voided' — jejak (voided_by,
// voided_at, void_reason) dicatat di transaksi asli. Tidak ada efek stok.
//
// Amend: transaksi Approved dikoreksi lewat pasangan reversal + koreksi baru.
// - amends_transaksi_id ada di baris reversal/koreksi, menunjuk transaksi asli.
// - amended_by_transaksi_id ada di transaksi asli, menunjuk baris reversal.
//
// PostgreSQL ADD VALUE tidak bisa dijalankan dalam transaction block; umzug
// tidak membungkus migration dalam satu, jadi ini aman. IF NOT EXISTS menjaga
// idempotency (pola migration 39, 64, 68).
export const up: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(
        `ALTER TYPE "enum_inv_transaksi_approval_status" ADD VALUE IF NOT EXISTS 'Voided'`
    );

    await queryInterface.addColumn('inv_transaksi', 'voided_by', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('inv_transaksi', 'voided_at', {
        type: 'TIMESTAMPTZ' as any,
        allowNull: true,
    });

    await queryInterface.addColumn('inv_transaksi', 'void_reason', {
        type: DataTypes.TEXT,
        allowNull: true,
    });

    await queryInterface.addColumn('inv_transaksi', 'amends_transaksi_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'inv_transaksi', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('inv_transaksi', 'amended_by_transaksi_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'inv_transaksi', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('inv_transaksi', ['amends_transaksi_id'], {
        name: 'idx_transaksi_amends',
    });
    await queryInterface.addIndex('inv_transaksi', ['amended_by_transaksi_id'], {
        name: 'idx_transaksi_amended_by',
    });
    await queryInterface.addIndex('inv_transaksi', ['voided_at'], {
        name: 'idx_transaksi_voided_at',
        where: { voided_at: { [Symbol.for('ne') as any]: null } } as any,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeIndex('inv_transaksi', 'idx_transaksi_voided_at');
    await queryInterface.removeIndex('inv_transaksi', 'idx_transaksi_amended_by');
    await queryInterface.removeIndex('inv_transaksi', 'idx_transaksi_amends');
    await queryInterface.removeColumn('inv_transaksi', 'amended_by_transaksi_id');
    await queryInterface.removeColumn('inv_transaksi', 'amends_transaksi_id');
    await queryInterface.removeColumn('inv_transaksi', 'void_reason');
    await queryInterface.removeColumn('inv_transaksi', 'voided_at');
    await queryInterface.removeColumn('inv_transaksi', 'voided_by');
    // PostgreSQL tidak mendukung DROP VALUE pada enum ('Voided' tetap ada).
};
```

Catatan: `where` pada partial index disederhanakan — jika `queryInterface.addIndex` tidak mendukung partial index dari Sequelize, ganti dengan raw query: `await sequelize.query('CREATE INDEX idx_transaksi_voided_at ON inv_transaksi(voided_at) WHERE voided_at IS NOT NULL')`. Cek migration existing (68) untuk pola yang berhasil.

- [ ] **Step 2: Jalankan migration**

Run: `cd backend && npm run migrate`
Expected: log `event: 'migrating', name: '69_add_void_amend_support.ts'` diikuti `event: 'migrated'`. Tidak ada error.

- [ ] **Step 3: Verifikasi struktur DB**

Run:
```bash
docker exec -it $(docker ps -qf "name=postgres") psql -U postgres -d bis -c "\d inv_transaksi" | grep -E "voided|amends|amended"
```
Expected: 5 baris kolom baru terlihat.

Run:
```bash
docker exec -it $(docker ps -qf "name=postgres") psql -U postgres -d bis -c "SELECT enum_range(NULL::enum_inv_transaksi_approval_status)"
```
Expected: nilai enum termasuk `'Voided'`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/database/migrations/69_add_void_amend_support.ts
git commit -m "feat(inventory): migration 69 void/amend columns & Voided enum"
```

---

## Task 2: Model & associations

**Files:**
- Modify: `backend/src/modules/inventory/models/Transaksi.ts`
- Modify: `backend/src/modules/inventory/models/associations.ts`

**Interfaces:**
- Consumes: kolom migration 69 (Task 1)
- Produces:
    - `InvTransaksi.approval_status: 'Pending' | 'Approved' | 'Rejected' | 'Voided'`
    - Field baru: `voided_by, voided_at, void_reason, amends_transaksi_id, amended_by_transaksi_id`
    - Associations: `voider` (belongsTo User), `transaksi_asli` (belongsTo self via `amends_transaksi_id`), `transaksi_koreksi` (hasOne self via `amends_transaksi_id`), `transaksi_amender` (belongsTo self via `amended_by_transaksi_id`)

- [ ] **Step 1: Extend `Transaksi.ts` — union type & public fields**

Modify class body (di atas `public gudang?: any;`):
```typescript
public approval_status!: 'Pending' | 'Approved' | 'Rejected' | 'Voided';
public voided_by!: number | null;
public voided_at!: Date | null;
public void_reason!: string | null;
public amends_transaksi_id!: number | null;
public amended_by_transaksi_id!: number | null;

public voider?: any;
public transaksi_asli?: any;
public transaksi_koreksi?: any;
public transaksi_amender?: any;
```

- [ ] **Step 2: Extend `approval_status` enum di `InvTransaksi.init`**

Ganti definisi kolom `approval_status`:
```typescript
approval_status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Voided'),
    allowNull: false,
    defaultValue: 'Approved',
},
```

- [ ] **Step 3: Tambah 5 field baru di `InvTransaksi.init`**

Sisipkan sebelum `}, { sequelize, tableName: 'inv_transaksi', … }`:
```typescript
voided_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
},
voided_at: {
    type: DataTypes.DATE,
    allowNull: true,
},
void_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
},
amends_transaksi_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'inv_transaksi', key: 'id' },
},
amended_by_transaksi_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'inv_transaksi', key: 'id' },
},
```

- [ ] **Step 4: Tambah associations**

Buka `backend/src/modules/inventory/models/associations.ts`, cari blok relasi `InvTransaksi`. Tambah:
```typescript
InvTransaksi.belongsTo(User, { foreignKey: 'voided_by', as: 'voider' });
InvTransaksi.belongsTo(InvTransaksi, {
    foreignKey: 'amends_transaksi_id',
    as: 'transaksi_asli',
});
InvTransaksi.hasOne(InvTransaksi, {
    foreignKey: 'amends_transaksi_id',
    as: 'transaksi_koreksi',
    constraints: false,
});
InvTransaksi.belongsTo(InvTransaksi, {
    foreignKey: 'amended_by_transaksi_id',
    as: 'transaksi_amender',
});
```

Import `User` sudah ada di file — verifikasi. Jika belum, tambahkan `import User from '../../auth/models/User';`.

- [ ] **Step 5: Type-check**

Run: `cd backend && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/inventory/models/Transaksi.ts backend/src/modules/inventory/models/associations.ts
git commit -m "feat(inventory): extend Transaksi model with void/amend fields"
```

---

## Task 3: Extract `createTransaksiInternal` (refactor)

**Files:**
- Modify: `backend/src/modules/inventory/services/stok.service.ts:230-345` (body `createTransaksi`)

**Interfaces:**
- Consumes: `sequelize`, `AppError`, `InvTransaksi`, `InvTransaksiDetail`, `applyTransaksiEffects`, `generateCode`, `requiresApproval`, `validateKonsumsi`, `notificationService`
- Produces: `private createTransaksiInternal(payload: TransaksiPayload, userId: number, t: Transaction, opts?: { autoApprove?: boolean }): Promise<InvTransaksi>` — mengembalikan row `InvTransaksi` (bukan detail full). Membuat baris + snapshot detail. TIDAK menjalankan `applyTransaksiEffects` (caller yang panggil). TIDAK memicu notifikasi. TIDAK membuka/menutup transaksi (memakai `t` yang diberikan).

- [ ] **Step 1: Ambil salinan test yang harus tetap hijau**

Run: `cd backend && npx jest --testPathPattern="stok.approval" 2>&1 | tail -15`
Expected: 6 test passing (pola: create Supplier auto-approve, Keluar Pending, Adjustment Pending, Transfer Masuk Pending, approve replay, reject).

- [ ] **Step 2: Extract method — buat `createTransaksiInternal`**

Di dalam class `StokService`, tambah method privat baru DI ATAS `createTransaksi`:
```typescript
private async createTransaksiInternal(
    payload: TransaksiPayload,
    userId: number,
    t: Transaction,
    opts: { autoApprove?: boolean } = {},
): Promise<InvTransaksi> {
    // Referensial validation fasilitas (INV-M09).
    if (payload.facility_room_id) {
        const room = await FacilityRoom.findByPk(payload.facility_room_id, { transaction: t });
        if (!room) throw new AppError(`Kamar/ruang dengan ID ${payload.facility_room_id} tidak ditemukan`, 400);
        if (!payload.facility_building_id) throw new AppError('Gedung wajib dipilih jika kamar/ruang diisi', 400);
        if (room.building_id !== payload.facility_building_id) {
            throw new AppError('Kamar/ruang yang dipilih bukan milik gedung yang dipilih', 400);
        }
    }

    payload.created_by = userId;

    // Konsumsi validation (jika sub_tipe Konsumsi).
    if (payload.sub_tipe === 'Konsumsi') {
        await this.validateKonsumsi(payload, t);
    }

    // Gerbang approval INV-N07. Kalau autoApprove true (dipanggil amend),
    // skip gerbang — reversal & koreksi selalu Approved.
    const requiresApproval = opts.autoApprove ? false : this.requiresApproval(payload);

    const code = await this.generateCode(payload.tipe, t);

    const transaksi = await InvTransaksi.create({
        code,
        tipe: payload.tipe,
        sub_tipe: payload.sub_tipe,
        tanggal: payload.tanggal,
        gudang_id: payload.gudang_id,
        gudang_tujuan_id: payload.gudang_tujuan_id || null,
        facility_building_id: payload.facility_building_id || null,
        facility_room_id: payload.facility_room_id || null,
        karyawan_id: payload.karyawan_id || null,
        department_id: payload.department_id || null,
        supplier_nama: payload.supplier_nama || null,
        no_referensi: payload.no_referensi || null,
        catatan: payload.catatan || null,
        created_by: userId,
        approval_status: requiresApproval ? 'Pending' : 'Approved',
    }, { transaction: t });

    // Snapshot detail — sama seperti alur create existing.
    for (const detail of payload.details) {
        await InvTransaksiDetail.create({
            transaksi_id: transaksi.id,
            produk_id: detail.produk_id,
            uom_id: detail.uom_id,
            jumlah: detail.jumlah,
            catatan: detail.catatan || null,
            serial_numbers: requiresApproval ? detail.serial_numbers || null : null,
        }, { transaction: t });
    }

    return transaksi;
}
```

- [ ] **Step 3: Ganti body `createTransaksi` menjadi wrapper tipis**

Ganti seluruh body `createTransaksi` (dari `const t = await sequelize.transaction();` sampai `return this.getTransaksiDetail(transaksi.id);`) dengan:
```typescript
async createTransaksi(payload: TransaksiPayload, userId: number) {
    const t = await sequelize.transaction();
    try {
        const transaksi = await this.createTransaksiInternal(payload, userId, t);
        const isApproved = transaksi.approval_status === 'Approved';

        if (isApproved) {
            await this.applyTransaksiEffects(transaksi, payload, userId, t);
        }

        await t.commit();

        if (isApproved) {
            const affectedProdukIds = payload.details.map(d => d.produk_id);
            notificationService.checkLowStockAndNotify(affectedProdukIds).catch(() => {});
        } else {
            notificationService.notifyPendingApproval(transaksi.id, transaksi.code).catch(() => {});
        }

        return this.getTransaksiDetail(transaksi.id);
    } catch (error) {
        await t.rollback();
        throw error;
    }
}
```

- [ ] **Step 4: Jalankan test approval + konsumsi**

Run: `cd backend && npx jest --testPathPattern="stok.(approval|konsumsi)" 2>&1 | tail -20`
Expected: **15 test passing** (6 approval + 9 konsumsi). Tidak ada regresi.

- [ ] **Step 5: Type-check**

Run: `cd backend && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/inventory/services/stok.service.ts
git commit -m "refactor(inventory): extract createTransaksiInternal for reuse"
```

---

## Task 4: `voidTransaksi` — unit test dulu (TDD)

**Files:**
- Create: `backend/src/modules/inventory/services/__tests__/stok.void.test.ts`

**Interfaces:**
- Consumes: `stokService`, `sequelize`, `InvTransaksi` (semua di-mock, mengikuti pola `stok.approval.test.ts`)
- Produces: verifikasi kontrak `stokService.voidTransaksi(id: number, userId: number, reason: string)`

- [ ] **Step 1: Tulis file test (6 kasus)**

```typescript
// backend/src/modules/inventory/services/__tests__/stok.void.test.ts
import stokService from '../stok.service';
import sequelize from '../../../../config/database';
import InvTransaksi from '../../models/Transaksi';

// voidTransaksi: hanya boleh untuk transaksi Pending. Karena Pending belum
// meng-apply efek (INV-N07), void cukup ubah status ke 'Voided' + jejak audit.
// Tidak menyentuh stok, serial, atau facility_assets.

jest.mock('../../../../config/database', () => ({
    __esModule: true,
    default: { transaction: jest.fn(), query: jest.fn() },
}));
jest.mock('../../models/Transaksi', () => ({
    __esModule: true,
    default: { findByPk: jest.fn(), findOne: jest.fn() },
}));
jest.mock('../../models/TransaksiDetail', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Produk', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Stok', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/SerialNumber', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Gudang', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Uom', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Brand', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/SubKategori', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/Employee', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/Department', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/LokasiKerja', () => ({ __esModule: true, default: {} }));
jest.mock('../../../auth/models/User', () => ({ __esModule: true, default: {} }));
jest.mock('../../../facility/models/Building', () => ({ __esModule: true, default: {} }));
jest.mock('../../../facility/models/Room', () => ({ __esModule: true, default: {} }));
jest.mock('../../../facility/models/Asset', () => ({ __esModule: true, default: {} }));
jest.mock('../../../../shared/services/notification.service', () => ({
    __esModule: true,
    default: { checkLowStockAndNotify: jest.fn(), notifyPendingApproval: jest.fn() },
}));

const db = sequelize as any;
const Trx = InvTransaksi as any;

const makeTx = () => ({
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    LOCK: { UPDATE: 'UPDATE' },
});

const makePendingRow = (over: any = {}) => ({
    id: 100, approval_status: 'Pending',
    amends_transaksi_id: null, amended_by_transaksi_id: null,
    update: jest.fn().mockResolvedValue(undefined),
    ...over,
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('voidTransaksi', () => {
    it('mengubah status Pending menjadi Voided dan mencatat jejak', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const row = makePendingRow();
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(row) : Promise.resolve({ toJSON: () => ({ id: 100, details: [] }) }));

        await stokService.voidTransaksi(100, 9, 'Salah input karyawan');

        expect(row.update).toHaveBeenCalledWith(
            expect.objectContaining({
                approval_status: 'Voided',
                voided_by: 9,
                void_reason: 'Salah input karyawan',
                voided_at: expect.any(Date),
            }),
            expect.anything(),
        );
        expect(tx.commit).toHaveBeenCalled();
    });

    it('menolak void transaksi Approved', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue({ id: 100, approval_status: 'Approved' });
        await expect(stokService.voidTransaksi(100, 9, 'alasan cukup'))
            .rejects.toThrow(/Pending yang bisa dibatalkan/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('menolak void baris reversal/koreksi (amends_transaksi_id != null)', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue({ id: 100, approval_status: 'Pending', amends_transaksi_id: 42, amended_by_transaksi_id: null });
        await expect(stokService.voidTransaksi(100, 9, 'alasan cukup'))
            .rejects.toThrow(/reversal\/koreksi/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('menolak reason yang terlalu pendek (setelah trim)', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        await expect(stokService.voidTransaksi(100, 9, '  ok  '))
            .rejects.toThrow(/minimal 5 karakter/);
    });

    it('melempar 404 jika transaksi tidak ditemukan', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue(null);
        await expect(stokService.voidTransaksi(999, 9, 'alasan cukup'))
            .rejects.toThrow(/tidak ditemukan/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('rollback transaksi jika update gagal', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const row = makePendingRow({ update: jest.fn().mockRejectedValue(new Error('boom')) });
        Trx.findByPk.mockResolvedValue(row);
        await expect(stokService.voidTransaksi(100, 9, 'alasan cukup')).rejects.toThrow('boom');
        expect(tx.rollback).toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Jalankan test untuk melihat gagal (`voidTransaksi is not a function`)**

Run: `cd backend && npx jest --testPathPattern="stok.void" 2>&1 | tail -10`
Expected: FAIL semua — `TypeError: stokService.voidTransaksi is not a function`.

- [ ] **Step 3: Implementasi `voidTransaksi` di `stok.service.ts`**

Di dalam class `StokService`, tambah:
```typescript
async voidTransaksi(id: number, userId: number, reason: string): Promise<InvTransaksi> {
    const trimmed = reason?.trim() ?? '';
    if (trimmed.length < 5) {
        throw new AppError('Alasan wajib diisi (minimal 5 karakter)', 400);
    }

    const t = await sequelize.transaction();
    try {
        const row = await InvTransaksi.findByPk(id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (!row) throw new AppError('Transaksi tidak ditemukan', 404);

        if (row.approval_status !== 'Pending') {
            throw new AppError(
                `Hanya transaksi berstatus Pending yang bisa dibatalkan. Transaksi ini berstatus ${row.approval_status}. Gunakan Koreksi untuk transaksi yang sudah disetujui.`,
                400,
            );
        }

        if (row.amends_transaksi_id) {
            throw new AppError('Transaksi reversal/koreksi tidak bisa di-amend.', 400);
        }

        await row.update({
            approval_status: 'Voided',
            voided_by: userId,
            voided_at: new Date(),
            void_reason: trimmed,
        }, { transaction: t });

        await t.commit();
        return this.getTransaksiDetail(id);
    } catch (error) {
        await t.rollback();
        throw error;
    }
}
```

- [ ] **Step 4: Jalankan test — semua harus hijau**

Run: `cd backend && npx jest --testPathPattern="stok.void" 2>&1 | tail -15`
Expected: 6/6 pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/inventory/services/stok.service.ts backend/src/modules/inventory/services/__tests__/stok.void.test.ts
git commit -m "feat(inventory): voidTransaksi with tests (INV-N08)"
```

---

## Task 5: `validateReversalGuards` + `buildReversalPayload` — unit test (TDD)

**Files:**
- Create: `backend/src/modules/inventory/services/__tests__/stok.amend.test.ts` (skeleton — nanti diperluas di task berikutnya)

**Interfaces:**
- Consumes: `stokService`, `sequelize`, semua model (mocked)
- Produces:
    - `private validateReversalGuards(original: InvTransaksi, details: InvTransaksiDetail[], t: Transaction): Promise<void>` — throws `AppError` pada guard ke-1..5 (§3.2 spec)
    - `private buildReversalPayload(original: InvTransaksi, details: InvTransaksiDetail[], userId: number, reason: string): { primary: TransaksiPayload; paired?: TransaksiPayload }` — peta invers §3.1

Test di task ini fokus pada guard saja. Behavior reversal per sub-tipe di task 6-7.

- [ ] **Step 1: Tulis skeleton test + 5 test guard**

```typescript
// backend/src/modules/inventory/services/__tests__/stok.amend.test.ts
import stokService from '../stok.service';
import sequelize from '../../../../config/database';
import InvTransaksi from '../../models/Transaksi';
import InvTransaksiDetail from '../../models/TransaksiDetail';
import InvSerialNumber from '../../models/SerialNumber';
import FacilityAsset from '../../../facility/models/Asset';

// amendTransaksi: hanya untuk Approved. Membuat reversal (efek kebalikan)
// dan optional koreksi baru, semuanya auto-Approved dalam satu DB transaction.

jest.mock('../../../../config/database', () => ({
    __esModule: true,
    default: { transaction: jest.fn(), query: jest.fn() },
}));
jest.mock('../../models/Transaksi', () => ({
    __esModule: true,
    default: { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../../models/TransaksiDetail', () => ({
    __esModule: true,
    default: { create: jest.fn(), findAll: jest.fn() },
}));
jest.mock('../../models/Produk', () => ({ __esModule: true, default: { findByPk: jest.fn() } }));
jest.mock('../../models/Stok', () => ({ __esModule: true, default: { findOne: jest.fn(), create: jest.fn() } }));
jest.mock('../../models/SerialNumber', () => ({
    __esModule: true,
    default: { findOne: jest.fn(), findAll: jest.fn(), destroy: jest.fn(), update: jest.fn(), create: jest.fn() },
}));
jest.mock('../../models/Gudang', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Uom', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Brand', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/SubKategori', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/Employee', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/Department', () => ({ __esModule: true, default: { findByPk: jest.fn() } }));
jest.mock('../../../hr/models/LokasiKerja', () => ({ __esModule: true, default: {} }));
jest.mock('../../../auth/models/User', () => ({ __esModule: true, default: {} }));
jest.mock('../../../facility/models/Building', () => ({ __esModule: true, default: {} }));
jest.mock('../../../facility/models/Room', () => ({ __esModule: true, default: { findByPk: jest.fn() } }));
jest.mock('../../../facility/models/Asset', () => ({
    __esModule: true,
    default: { count: jest.fn(), update: jest.fn(), create: jest.fn(), findOne: jest.fn() },
}));
jest.mock('../../../../shared/services/notification.service', () => ({
    __esModule: true,
    default: { checkLowStockAndNotify: jest.fn(), notifyPendingApproval: jest.fn() },
}));

const db = sequelize as any;
const Trx = InvTransaksi as any;
const TrxDetail = InvTransaksiDetail as any;
const Serial = InvSerialNumber as any;
const FA = FacilityAsset as any;

const makeTx = () => ({
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    LOCK: { UPDATE: 'UPDATE' },
});

const approvedSupplier = (over: any = {}) => ({
    id: 100, code: 'STM-0001', tipe: 'Masuk', sub_tipe: 'Supplier',
    tanggal: '2025-01-10', gudang_id: 1, gudang_tujuan_id: null,
    facility_building_id: null, facility_room_id: null,
    karyawan_id: null, department_id: null,
    approval_status: 'Approved', amends_transaksi_id: null, amended_by_transaksi_id: null,
    created_by: 7,
    update: jest.fn().mockResolvedValue(undefined),
    ...over,
});

beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockResolvedValue([[], []]);
    Trx.findOne.mockResolvedValue(null);
});

describe('amendTransaksi — guards (§3.2 spec)', () => {
    it('menolak jika transaksi bukan Approved', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue(approvedSupplier({ approval_status: 'Pending' }));
        await expect(stokService.amendTransaksi(100, 9, 'salah input quantity'))
            .rejects.toThrow(/Approved yang bisa dikoreksi/);
        expect(tx.rollback).toHaveBeenCalled();
    });

    it('menolak jika sudah pernah di-amend', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue(approvedSupplier({ amended_by_transaksi_id: 101 }));
        await expect(stokService.amendTransaksi(100, 9, 'salah input quantity'))
            .rejects.toThrow(/sudah pernah dikoreksi/);
    });

    it('menolak amend baris reversal/koreksi', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue(approvedSupplier({ amends_transaksi_id: 42 }));
        await expect(stokService.amendTransaksi(100, 9, 'salah input quantity'))
            .rejects.toThrow(/reversal\/koreksi tidak bisa/);
    });

    it('menolak amend leg Transfer Gudang auto-generated', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        Trx.findByPk.mockResolvedValue(approvedSupplier({
            sub_tipe: 'Transfer Gudang',
            catatan: 'Auto-generated dari transfer masuk STM-0099',
        }));
        await expect(stokService.amendTransaksi(100, 9, 'salah input quantity'))
            .rejects.toThrow(/amend transaksi Transfer Masuk-nya/);
    });

    it('menolak reason yang terlalu pendek', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        await expect(stokService.amendTransaksi(100, 9, '  ok  '))
            .rejects.toThrow(/minimal 5 karakter/);
    });
});
```

- [ ] **Step 2: Jalankan — semua FAIL karena `amendTransaksi` belum ada**

Run: `cd backend && npx jest --testPathPattern="stok.amend" 2>&1 | tail -10`
Expected: FAIL — `stokService.amendTransaksi is not a function`.

- [ ] **Step 3: Implementasi skeleton `amendTransaksi` + `validateReversalGuards`**

Di dalam class `StokService`, tambah:
```typescript
async amendTransaksi(
    id: number,
    userId: number,
    reason: string,
    koreksi?: { details: TransaksiDetailPayload[] },
): Promise<{ reversal: InvTransaksi; koreksi: InvTransaksi | null }> {
    const trimmed = reason?.trim() ?? '';
    if (trimmed.length < 5) {
        throw new AppError('Alasan wajib diisi (minimal 5 karakter)', 400);
    }

    const t = await sequelize.transaction();
    try {
        const original = await InvTransaksi.findByPk(id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (!original) throw new AppError('Transaksi tidak ditemukan', 404);

        if (original.approval_status !== 'Approved') {
            throw new AppError(
                `Hanya transaksi berstatus Approved yang bisa dikoreksi. Transaksi ini berstatus ${original.approval_status}.`,
                400,
            );
        }
        if (original.amended_by_transaksi_id) {
            throw new AppError(
                `Transaksi ini sudah pernah dikoreksi sebelumnya (lihat #${original.amended_by_transaksi_id}).`,
                400,
            );
        }
        if (original.amends_transaksi_id) {
            throw new AppError('Transaksi reversal/koreksi tidak bisa di-amend.', 400);
        }
        if (original.sub_tipe === 'Transfer Gudang'
            && original.catatan?.startsWith('Auto-generated dari transfer masuk')) {
            throw new AppError(
                'Untuk membatalkan transfer, amend transaksi Transfer Masuk-nya.',
                400,
            );
        }

        const details = await InvTransaksiDetail.findAll({
            where: { transaksi_id: id },
            transaction: t,
        });

        await this.validateReversalGuards(original, details, t);

        // Reversal + koreksi — implementasi penuh di Task 6-7.
        throw new AppError('Amend belum diimplementasikan lengkap', 501);
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

private async validateReversalGuards(
    _original: InvTransaksi,
    _details: InvTransaksiDetail[],
    _t: Transaction,
): Promise<void> {
    // Guard serial & facility — implementasi penuh di Task 6-7.
    return;
}
```

- [ ] **Step 4: Jalankan — 5 test guard basic PASS**

Run: `cd backend && npx jest --testPathPattern="stok.amend" 2>&1 | tail -15`
Expected: 5/5 guard test PASS. (Test yang belum ada / reversal behavior belum ditulis.)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/inventory/services/stok.service.ts backend/src/modules/inventory/services/__tests__/stok.amend.test.ts
git commit -m "feat(inventory): amendTransaksi guards + skeleton"
```

---

## Task 6: `buildReversalPayload` — sub-tipe non-serial (Supplier, Konsumsi, Adjustment)

**Files:**
- Modify: `backend/src/modules/inventory/services/stok.service.ts`
- Modify: `backend/src/modules/inventory/services/__tests__/stok.amend.test.ts`

**Interfaces:**
- Consumes: `InvTransaksi`, `InvTransaksiDetail`, `TransaksiPayload`, `applyTransaksiEffects`, `createTransaksiInternal` (Task 3)
- Produces:
    - `buildReversalPayload` menghasilkan `{ primary: TransaksiPayload; paired?: TransaksiPayload }` sesuai peta invers §3.1
    - Untuk sub-tipe di task ini: **Supplier → Adjustment −N**, **Konsumsi → Adjustment +N**, **Adjustment → Adjustment (jumlah negasi)**
    - `amendTransaksi` lengkap: create reversal via `createTransaksiInternal({ autoApprove: true })`, apply effect, stamp fields, update transaksi asli

- [ ] **Step 1: Tulis test untuk 3 sub-tipe non-serial**

Tambah ke `stok.amend.test.ts` (setelah blok guard):

```typescript
describe('amendTransaksi — reversal non-serial', () => {
    it('Supplier: reversal Adjustment -N, transaksi asli ditandai amended_by', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);

        const original = approvedSupplier();
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 5, catatan: null, serial_numbers: null },
        ]);
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 200, ...v,
            update: jest.fn().mockResolvedValue(undefined),
        }));
        // Produk non-serial supaya applyTransaksiEffects tidak butuh serial branch
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: false, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 100, update: jest.fn().mockResolvedValue(undefined),
        });

        await stokService.amendTransaksi(100, 9, 'Salah input quantity');

        const reversalArgs = Trx.create.mock.calls[0][0];
        expect(reversalArgs.tipe).toBe('Adjustment');
        expect(reversalArgs.sub_tipe).toBe('Adjustment');
        expect(reversalArgs.amends_transaksi_id).toBeUndefined(); // di-set via update() setelah create
        expect(reversalArgs.approval_status).toBe('Approved');
        // Detail negasi
        const detailArgs = TrxDetail.create.mock.calls[0][0];
        expect(detailArgs.jumlah).toBe(-5);
        // Transaksi asli ditandai
        expect(original.update).toHaveBeenCalledWith(
            expect.objectContaining({ amended_by_transaksi_id: 200 }),
            expect.anything(),
        );
        expect(tx.commit).toHaveBeenCalled();
    });

    it('Konsumsi: reversal Adjustment +N di gudang yang sama', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({ tipe: 'Keluar', sub_tipe: 'Konsumsi', karyawan_id: 3 });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 5, catatan: null, serial_numbers: null },
        ]);
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 201, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: false, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 50, update: jest.fn().mockResolvedValue(undefined),
        });

        await stokService.amendTransaksi(100, 9, 'Salah input jumlah konsumsi');

        const reversalArgs = Trx.create.mock.calls[0][0];
        expect(reversalArgs.tipe).toBe('Adjustment');
        expect(TrxDetail.create.mock.calls[0][0].jumlah).toBe(5); // positif (revert stok konsumsi)
        expect(reversalArgs.gudang_id).toBe(1);
    });

    it('Adjustment: reversal Adjustment dengan jumlah dinegasi', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({ tipe: 'Adjustment', sub_tipe: 'Adjustment' });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: -3, catatan: null, serial_numbers: null },
        ]);
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 202, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: false, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 100, update: jest.fn().mockResolvedValue(undefined),
        });

        await stokService.amendTransaksi(100, 9, 'Adjustment salah arah');
        const detailArgs = TrxDetail.create.mock.calls[0][0];
        expect(detailArgs.jumlah).toBe(3); // dari -3 dinegasi
    });

    it('Amend + koreksi.details: reversal + koreksi baru dibuat sebagai transaksi terpisah', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier();
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 5, catatan: null, serial_numbers: null },
        ]);
        let createIdCounter = 200;
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: ++createIdCounter, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: false, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 100, update: jest.fn().mockResolvedValue(undefined),
        });

        const result = await stokService.amendTransaksi(100, 9, 'Salah input quantity, seharusnya 3', {
            details: [{ produk_id: 10, uom_id: 1, jumlah: 3 }],
        });

        // Trx.create dipanggil 2x: reversal (id 201) + koreksi (id 202)
        expect(Trx.create).toHaveBeenCalledTimes(2);
        expect(result).toHaveProperty('reversal');
        expect(result).toHaveProperty('koreksi');
    });
});
```

- [ ] **Step 2: Jalankan — 4 test baru FAIL karena `amendTransaksi` masih throw 501**

Run: `cd backend && npx jest --testPathPattern="stok.amend" 2>&1 | tail -20`
Expected: 5 guard test PASS + 4 test baru FAIL dengan pesan "belum diimplementasikan lengkap".

- [ ] **Step 3: Implementasi `buildReversalPayload` (non-serial) + lengkapi `amendTransaksi`**

Ganti body `amendTransaksi` yang throw 501, dan tambah `buildReversalPayload`:

```typescript
// Ganti "throw new AppError('Amend belum diimplementasikan lengkap', 501);"
// dengan:
const reversalSpec = this.buildReversalPayload(original, details, userId, trimmed);

const reversal = await this.createTransaksiInternal(reversalSpec.primary, userId, t, { autoApprove: true });
await this.applyTransaksiEffects(reversal, reversalSpec.primary, userId, t);
await reversal.update({
    approved_by: userId,
    approved_at: new Date(),
    amends_transaksi_id: original.id,
}, { transaction: t });

if (reversalSpec.paired) {
    const pairedRow = await this.createTransaksiInternal(reversalSpec.paired, userId, t, { autoApprove: true });
    await this.applyTransaksiEffects(pairedRow, reversalSpec.paired, userId, t);
    await pairedRow.update({
        approved_by: userId,
        approved_at: new Date(),
        amends_transaksi_id: original.id,
    }, { transaction: t });
}

await original.update({ amended_by_transaksi_id: reversal.id }, { transaction: t });

let koreksiRow: InvTransaksi | null = null;
if (koreksi?.details?.length) {
    const koreksiPayload: TransaksiPayload = {
        tipe: original.tipe,
        sub_tipe: original.sub_tipe as any,
        tanggal: original.tanggal,
        gudang_id: original.gudang_id,
        gudang_tujuan_id: original.gudang_tujuan_id ?? undefined,
        facility_building_id: original.facility_building_id ?? undefined,
        facility_room_id: original.facility_room_id ?? undefined,
        karyawan_id: original.karyawan_id ?? undefined,
        department_id: original.department_id ?? undefined,
        supplier_nama: original.supplier_nama ?? undefined,
        no_referensi: original.no_referensi ?? undefined,
        catatan: `Koreksi dari ${original.code}: ${trimmed}`,
        created_by: userId,
        details: koreksi.details,
    };
    koreksiRow = await this.createTransaksiInternal(koreksiPayload, userId, t, { autoApprove: true });
    await this.applyTransaksiEffects(koreksiRow, koreksiPayload, userId, t);
    await koreksiRow.update({
        approved_by: userId,
        approved_at: new Date(),
    }, { transaction: t });
}

await t.commit();
return {
    reversal: await this.getTransaksiDetail(reversal.id),
    koreksi: koreksiRow ? await this.getTransaksiDetail(koreksiRow.id) : null,
};
```

Tambah method `buildReversalPayload` (Task ini hanya cabang non-serial):
```typescript
private buildReversalPayload(
    original: InvTransaksi,
    details: InvTransaksiDetail[],
    userId: number,
    reason: string,
): { primary: TransaksiPayload; paired?: TransaksiPayload } {
    const baseHeader = {
        tanggal: new Date().toISOString().slice(0, 10),
        gudang_id: original.gudang_id,
        karyawan_id: original.karyawan_id ?? undefined,
        department_id: original.department_id ?? undefined,
        facility_building_id: original.facility_building_id ?? undefined,
        facility_room_id: original.facility_room_id ?? undefined,
        supplier_nama: original.supplier_nama ?? undefined,
        no_referensi: original.no_referensi ?? undefined,
        catatan: `REVERSAL transaksi ${original.code}: ${reason}`,
        created_by: userId,
    };

    // Peta invers per sub-tipe (§3.1 spec).
    switch (original.sub_tipe) {
        case 'Supplier':
            return {
                primary: {
                    ...baseHeader,
                    tipe: 'Adjustment',
                    sub_tipe: 'Adjustment' as any,
                    details: details.map(d => ({
                        produk_id: d.produk_id,
                        uom_id: d.uom_id,
                        jumlah: -Math.abs(d.jumlah),
                        catatan: d.catatan ?? undefined,
                    })),
                },
            };
        case 'Konsumsi':
            return {
                primary: {
                    ...baseHeader,
                    tipe: 'Adjustment',
                    sub_tipe: 'Adjustment' as any,
                    details: details.map(d => ({
                        produk_id: d.produk_id,
                        uom_id: d.uom_id,
                        jumlah: Math.abs(d.jumlah),
                        catatan: d.catatan ?? undefined,
                    })),
                },
            };
        case 'Adjustment':
            return {
                primary: {
                    ...baseHeader,
                    tipe: 'Adjustment',
                    sub_tipe: 'Adjustment' as any,
                    details: details.map(d => ({
                        produk_id: d.produk_id,
                        uom_id: d.uom_id,
                        jumlah: -d.jumlah,
                        catatan: d.catatan ?? undefined,
                    })),
                },
            };
        // Cabang serial/transfer/fasilitas ditambahkan di Task 7-8.
        default:
            throw new AppError(
                `Amend untuk sub_tipe ${original.sub_tipe} belum didukung. Hubungi admin.`,
                501,
            );
    }
}
```

Catatan: enum `sub_tipe` di `TransaksiPayload` tidak punya `'Adjustment'` (sub-tipe adjustment biasanya 'Opname' atau bebas). Pilih salah satu yang valid: bisa pakai `original.sub_tipe` untuk mempertahankan konteks (mis. Supplier tetap Supplier), tapi tipe-nya dibalik. Cek `validateInventoryStok.ts` untuk daftar sub-tipe valid. **Keputusan implementasi:** pertahankan `sub_tipe` asli dan hanya balikkan `tipe` → mis. `Adjustment` (reversal Supplier) tetap `sub_tipe: 'Supplier'` untuk audit — inspect enum daftar di Sequelize model.

Alternatif yang lebih aman: pertahankan `sub_tipe: original.sub_tipe` di semua cabang (bukan 'Adjustment') dan gunakan `tipe: 'Adjustment'` untuk membedakan effect. `handleAdjustment` bekerja pada `tipe === 'Adjustment'` tanpa memedulikan sub_tipe.

Perbarui kode di atas: ganti `sub_tipe: 'Adjustment' as any` → `sub_tipe: original.sub_tipe as any` di ketiga cabang non-serial. Ini juga memudahkan pembaca audit — "reversal Supplier" tetap terbaca sebagai Supplier di header.

- [ ] **Step 4: Jalankan test — 9 test PASS (5 guard + 4 reversal non-serial)**

Run: `cd backend && npx jest --testPathPattern="stok.amend" 2>&1 | tail -20`
Expected: 9/9 PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/inventory/services/stok.service.ts backend/src/modules/inventory/services/__tests__/stok.amend.test.ts
git commit -m "feat(inventory): amendTransaksi non-serial reversal (Supplier/Konsumsi/Adjustment)"
```

---

## Task 7: Reversal serial (Ke Karyawan, Retur Karyawan, Disposal/Rusak)

**Files:**
- Modify: `backend/src/modules/inventory/services/stok.service.ts`
- Modify: `backend/src/modules/inventory/services/__tests__/stok.amend.test.ts`

**Interfaces:**
- Consumes: fungsi di Task 6, `handleStokMasuk`/`handleStokKeluar` existing (yang menangani serial berdasar sub_tipe)
- Produces:
    - `buildReversalPayload` mendukung sub-tipe ber-serial:
        - **Ke Karyawan → Retur Karyawan** (Masuk) ke karyawan yang sama, serial dikembalikan
        - **Retur Karyawan → Ke Karyawan** (Keluar) ke karyawan yang sama, serial dipinjamkan lagi
        - **Disposal / Rusak/Terbuang → Adjustment +N** (non-serial revive: khusus, karena serial sudah `Disposed`/`Rusak` — set manual di reversal)
    - `validateReversalGuards` memeriksa `transaksi_terakhir_id` untuk serial

- [ ] **Step 1: Tambah test 3 sub-tipe ber-serial + guard serial**

Sisipkan setelah blok reversal non-serial di `stok.amend.test.ts`:

```typescript
describe('amendTransaksi — reversal serial', () => {
    it('Ke Karyawan: reversal Retur Karyawan dengan serial yang sama', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Keluar', sub_tipe: 'Ke Karyawan', karyawan_id: 3,
        });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 1, catatan: null, serial_numbers: ['SN-001'] },
        ]);
        // Guard: serial masih di posisi asli (transaksi_terakhir_id = 100)
        Serial.findAll.mockResolvedValue([
            { serial_number: 'SN-001', transaksi_terakhir_id: 100, karyawan_id: 3, status: 'Digunakan' },
        ]);
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 300, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: true, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 5, update: jest.fn().mockResolvedValue(undefined),
        });
        Serial.update.mockResolvedValue([1]);

        await stokService.amendTransaksi(100, 9, 'Salah karyawan penerima');

        const reversalArgs = Trx.create.mock.calls[0][0];
        expect(reversalArgs.tipe).toBe('Masuk');
        expect(reversalArgs.sub_tipe).toBe('Retur Karyawan');
        expect(reversalArgs.karyawan_id).toBe(3);
        expect(TrxDetail.create.mock.calls[0][0].serial_numbers).toEqual(['SN-001']);
    });

    it('Retur Karyawan: reversal Ke Karyawan ke karyawan yang sama', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Masuk', sub_tipe: 'Retur Karyawan', karyawan_id: 3,
        });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 1, catatan: null, serial_numbers: ['SN-002'] },
        ]);
        Serial.findAll.mockResolvedValue([
            { serial_number: 'SN-002', transaksi_terakhir_id: 100, gudang_id: 1, status: 'Tersedia' },
        ]);
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 301, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: true, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 5, update: jest.fn().mockResolvedValue(undefined),
        });
        (require('../../models/SerialNumber').default.findOne as jest.Mock).mockResolvedValue({
            update: jest.fn().mockResolvedValue(undefined),
        });

        await stokService.amendTransaksi(100, 9, 'Retur diproses karena salah');

        const reversalArgs = Trx.create.mock.calls[0][0];
        expect(reversalArgs.tipe).toBe('Keluar');
        expect(reversalArgs.sub_tipe).toBe('Ke Karyawan');
        expect(reversalArgs.karyawan_id).toBe(3);
    });

    it('Guard: menolak 409 jika serial sudah dipindah oleh transaksi lain', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Keluar', sub_tipe: 'Ke Karyawan', karyawan_id: 3,
        });
        Trx.findByPk.mockResolvedValue(original);
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 1, catatan: null, serial_numbers: ['SN-001'] },
        ]);
        // Serial sudah dipindah oleh transaksi 555
        Serial.findAll.mockResolvedValue([
            { serial_number: 'SN-001', transaksi_terakhir_id: 555, karyawan_id: 8, status: 'Digunakan' },
        ]);

        try {
            await stokService.amendTransaksi(100, 9, 'Salah karyawan penerima');
            throw new Error('Should have thrown');
        } catch (e: any) {
            expect(e.message).toMatch(/sudah dipindah/);
            expect(e.statusCode).toBe(409);
        }
        expect(tx.rollback).toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Jalankan — 3 test baru FAIL**

Run: `cd backend && npx jest --testPathPattern="stok.amend" 2>&1 | tail -20`
Expected: test serial gagal karena `buildReversalPayload` masih throw 501 untuk 'Ke Karyawan' / 'Retur Karyawan'.

- [ ] **Step 3: Tambah cabang serial di `buildReversalPayload` + implementasi guard serial**

Sisipkan di dalam `switch (original.sub_tipe)`:
```typescript
case 'Ke Karyawan':
    return {
        primary: {
            ...baseHeader,
            tipe: 'Masuk',
            sub_tipe: 'Retur Karyawan' as any,
            karyawan_id: original.karyawan_id ?? undefined,
            details: details.map(d => ({
                produk_id: d.produk_id,
                uom_id: d.uom_id,
                jumlah: Math.abs(d.jumlah),
                serial_numbers: d.serial_numbers ?? undefined,
                catatan: d.catatan ?? undefined,
            })),
        },
    };
case 'Retur Karyawan':
    return {
        primary: {
            ...baseHeader,
            tipe: 'Keluar',
            sub_tipe: 'Ke Karyawan' as any,
            karyawan_id: original.karyawan_id ?? undefined,
            details: details.map(d => ({
                produk_id: d.produk_id,
                uom_id: d.uom_id,
                jumlah: Math.abs(d.jumlah),
                serial_numbers: d.serial_numbers ?? undefined,
                catatan: d.catatan ?? undefined,
            })),
        },
    };
case 'Disposal':
case 'Rusak/Terbuang':
    // Revive serial: transaksi baru Adjustment +N; serial di-restore manual
    // di guard/handler khusus (di-handle setelah reversal apply).
    return {
        primary: {
            ...baseHeader,
            tipe: 'Adjustment',
            sub_tipe: original.sub_tipe as any,
            details: details.map(d => ({
                produk_id: d.produk_id,
                uom_id: d.uom_id,
                jumlah: Math.abs(d.jumlah),
                serial_numbers: d.serial_numbers ?? undefined,
                catatan: d.catatan ?? undefined,
            })),
        },
    };
```

Implementasi `validateReversalGuards` — cabang serial:
```typescript
private async validateReversalGuards(
    original: InvTransaksi,
    details: InvTransaksiDetail[],
    t: Transaction,
): Promise<void> {
    const allSerials = details.flatMap(d => d.serial_numbers ?? []);
    if (allSerials.length > 0) {
        const rows = await InvSerialNumber.findAll({
            where: { serial_number: allSerials },
            transaction: t,
        }) as any[];
        for (const row of rows) {
            if (row.transaksi_terakhir_id !== original.id) {
                throw new AppError(
                    `Serial ${row.serial_number} sudah dipindah oleh transaksi lain setelah transaksi ini. Koreksi otomatis tidak aman.`,
                    409,
                );
            }
        }
    }
    // Guard fasilitas di Task 8.
}
```

Untuk revive serial pada `Disposal`/`Rusak/Terbuang` — `handleAdjustment` tidak mengurus serial. Butuh post-hook setelah `applyTransaksiEffects(reversal, ...)`. Tambah di dalam `amendTransaksi`, tepat setelah `applyTransaksiEffects(reversal, ...)`:
```typescript
if (['Disposal', 'Rusak/Terbuang'].includes(original.sub_tipe)) {
    for (const d of details) {
        if (d.serial_numbers?.length) {
            await InvSerialNumber.update(
                { status: 'Tersedia', gudang_id: original.gudang_id, transaksi_terakhir_id: reversal.id },
                { where: { serial_number: d.serial_numbers }, transaction: t },
            );
        }
    }
}
```

- [ ] **Step 4: Jalankan test — 12 test PASS (5 guard + 4 non-serial + 3 serial)**

Run: `cd backend && npx jest --testPathPattern="stok.amend" 2>&1 | tail -20`
Expected: 12/12 PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/inventory/services/stok.service.ts backend/src/modules/inventory/services/__tests__/stok.amend.test.ts
git commit -m "feat(inventory): amendTransaksi serial reversal (Ke Karyawan/Retur/Disposal)"
```

---

## Task 8: Reversal fasilitas (Ke Gedung/Mess, Ambil dari Gedung) + guard fasilitas

**Files:**
- Modify: `backend/src/modules/inventory/services/stok.service.ts`
- Modify: `backend/src/modules/inventory/services/__tests__/stok.amend.test.ts`

**Interfaces:**
- Consumes: `FacilityAsset`, `openFacilityPlacement`, `closeFacilityPlacement` (dipanggil otomatis oleh `handleStokMasuk`/`handleStokKeluar` untuk sub-tipe fasilitas)
- Produces:
    - `buildReversalPayload` mendukung **Ke Gedung/Mess → Ambil dari Gedung** dan **Ambil dari Gedung → Ke Gedung/Mess**
    - `validateReversalGuards` cek `FacilityAsset.status='Aktif'` untuk penempatan asli

- [ ] **Step 1: Test 2 sub-tipe fasilitas + guard**

```typescript
describe('amendTransaksi — reversal fasilitas', () => {
    it('Ke Gedung/Mess: reversal Ambil dari Gedung dari ruangan yang sama', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Keluar', sub_tipe: 'Ke Gedung/Mess',
            facility_building_id: 5, facility_room_id: 7,
        });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 1, catatan: null, serial_numbers: ['SN-100'] },
        ]);
        Serial.findAll.mockResolvedValue([
            { serial_number: 'SN-100', transaksi_terakhir_id: 100, gudang_id: null, status: 'Digunakan' },
        ]);
        // Guard facility: penempatan masih Aktif
        FA.count.mockResolvedValue(1);
        FA.findOne.mockResolvedValue({
            serial_number_id: 999, status: 'Aktif', room_id: 7,
        });
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: 400, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: true, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 5, update: jest.fn().mockResolvedValue(undefined),
        });
        (require('../../models/SerialNumber').default.findOne as jest.Mock).mockResolvedValue({
            id: 999, update: jest.fn().mockResolvedValue(undefined),
        });

        await stokService.amendTransaksi(100, 9, 'Salah ruangan penempatan');

        const reversalArgs = Trx.create.mock.calls[0][0];
        expect(reversalArgs.tipe).toBe('Masuk');
        expect(reversalArgs.sub_tipe).toBe('Ambil dari Gedung');
    });

    it('Guard: menolak 409 jika penempatan fasilitas sudah ditarik', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Keluar', sub_tipe: 'Ke Gedung/Mess',
            facility_building_id: 5, facility_room_id: 7,
        });
        Trx.findByPk.mockResolvedValue(original);
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 1, catatan: null, serial_numbers: ['SN-100'] },
        ]);
        Serial.findAll.mockResolvedValue([
            { serial_number: 'SN-100', transaksi_terakhir_id: 100, gudang_id: null, status: 'Digunakan' },
        ]);
        // Penempatan sudah ditarik
        FA.count.mockResolvedValue(0);

        try {
            await stokService.amendTransaksi(100, 9, 'Salah ruangan penempatan');
            throw new Error('Should have thrown');
        } catch (e: any) {
            expect(e.message).toMatch(/sudah ditarik/);
            expect(e.statusCode).toBe(409);
        }
        expect(tx.rollback).toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Jalankan — 2 test baru FAIL**

Run: `cd backend && npx jest --testPathPattern="stok.amend" 2>&1 | tail -20`
Expected: cabang Ke Gedung/Mess masih throw 501.

- [ ] **Step 3: Tambah cabang fasilitas di `buildReversalPayload` + guard**

```typescript
case 'Ke Gedung/Mess':
    return {
        primary: {
            ...baseHeader,
            tipe: 'Masuk',
            sub_tipe: 'Ambil dari Gedung' as any,
            facility_building_id: original.facility_building_id ?? undefined,
            facility_room_id: original.facility_room_id ?? undefined,
            details: details.map(d => ({
                produk_id: d.produk_id,
                uom_id: d.uom_id,
                jumlah: Math.abs(d.jumlah),
                serial_numbers: d.serial_numbers ?? undefined,
                catatan: d.catatan ?? undefined,
            })),
        },
    };
case 'Ambil dari Gedung':
    return {
        primary: {
            ...baseHeader,
            tipe: 'Keluar',
            sub_tipe: 'Ke Gedung/Mess' as any,
            facility_building_id: original.facility_building_id ?? undefined,
            facility_room_id: original.facility_room_id ?? undefined,
            details: details.map(d => ({
                produk_id: d.produk_id,
                uom_id: d.uom_id,
                jumlah: Math.abs(d.jumlah),
                serial_numbers: d.serial_numbers ?? undefined,
                catatan: d.catatan ?? undefined,
            })),
        },
    };
```

Tambah guard fasilitas di `validateReversalGuards` (setelah guard serial):
```typescript
if (original.sub_tipe === 'Ke Gedung/Mess' && original.facility_room_id) {
    const activePlacements = await FacilityAsset.count({
        where: { transaksi_id: original.id, status: 'Aktif' },
        transaction: t,
    });
    if (activePlacements === 0) {
        throw new AppError(
            'Aset sudah ditarik dari ruangan atau dipindah. Koreksi otomatis tidak aman.',
            409,
        );
    }
}
```

Import `FacilityAsset` di file jika belum: `import FacilityAsset from '../../facility/models/Asset';` (kemungkinan sudah ada).

- [ ] **Step 4: Jalankan test — 14 test PASS**

Run: `cd backend && npx jest --testPathPattern="stok.amend" 2>&1 | tail -20`
Expected: 14/14 PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/inventory/services/stok.service.ts backend/src/modules/inventory/services/__tests__/stok.amend.test.ts
git commit -m "feat(inventory): amendTransaksi facility reversal (Ke Gedung/Ambil dari Gedung)"
```

---

## Task 9: Reversal Transfer Masuk (paired leg) + controller + routes + validator + filter list

**Files:**
- Modify: `backend/src/modules/inventory/services/stok.service.ts`
- Modify: `backend/src/modules/inventory/services/__tests__/stok.amend.test.ts`
- Modify: `backend/src/modules/inventory/controllers/stok.controller.ts`
- Modify: `backend/src/modules/inventory/routes/inventory.routes.ts`
- Modify: `backend/src/shared/middleware/validateInventoryStok.ts`
- Create: `backend/src/modules/inventory/services/__tests__/integration/voidAmend.api.test.ts`

**Interfaces:**
- Consumes: `voidTransaksi`, `amendTransaksi` dari service layer
- Produces:
    - `buildReversalPayload` mendukung **Transfer Masuk → dua leg terbalik** (primary + paired)
    - HTTP endpoints `POST /api/inventory/transaksi/:id/void` dan `.../amend`
    - Middleware `validateVoid`, `validateAmend`
    - Filter opsional `include_inactive` di `getTransaksiList`

- [ ] **Step 1: Test Transfer Masuk paired**

Tambah ke `stok.amend.test.ts`:
```typescript
describe('amendTransaksi — Transfer Masuk (paired)', () => {
    it('membangun 2 reversal: destinasi (Adjustment -N) + asal (Adjustment +N)', async () => {
        const tx = makeTx();
        db.transaction.mockResolvedValue(tx);
        const original = approvedSupplier({
            id: 100, tipe: 'Masuk', sub_tipe: 'Transfer Masuk',
            gudang_id: 2, gudang_tujuan_id: 1, // 1 = asal, 2 = destinasi
        });
        Trx.findByPk.mockImplementation((_id: number, opts: any) =>
            opts?.lock ? Promise.resolve(original) : Promise.resolve({ toJSON: () => ({ id: _id, details: [] }) }));
        TrxDetail.findAll.mockResolvedValue([
            { produk_id: 10, uom_id: 1, jumlah: 5, catatan: null, serial_numbers: null },
        ]);
        let counter = 500;
        Trx.create.mockImplementation((v: any) => Promise.resolve({
            id: ++counter, ...v, update: jest.fn().mockResolvedValue(undefined),
        }));
        (require('../../models/Produk').default.findByPk as jest.Mock).mockResolvedValue({
            id: 10, has_serial_number: false, has_tag_number: false,
        });
        (require('../../models/Stok').default.findOne as jest.Mock).mockResolvedValue({
            jumlah: 20, update: jest.fn().mockResolvedValue(undefined),
        });

        await stokService.amendTransaksi(100, 9, 'Transfer salah gudang');

        // 2 create dipanggil: primary reversal + paired reversal
        expect(Trx.create).toHaveBeenCalledTimes(2);
        const firstArgs = Trx.create.mock.calls[0][0];
        const secondArgs = Trx.create.mock.calls[1][0];
        expect(firstArgs.gudang_id).toBe(2); // destinasi asli
        expect(secondArgs.gudang_id).toBe(1); // asal
    });
});
```

- [ ] **Step 2: Jalankan — FAIL**

Run: `cd backend && npx jest --testPathPattern="stok.amend" 2>&1 | tail -10`

- [ ] **Step 3: Tambah cabang `Transfer Masuk` di `buildReversalPayload`**

```typescript
case 'Transfer Masuk': {
    if (!original.gudang_tujuan_id) {
        throw new AppError('Transfer Masuk tanpa gudang tujuan tidak bisa dikoreksi', 400);
    }
    const mapDetails = (sign: 1 | -1) => details.map(d => ({
        produk_id: d.produk_id,
        uom_id: d.uom_id,
        jumlah: sign * Math.abs(d.jumlah),
        catatan: d.catatan ?? undefined,
    }));
    return {
        primary: {
            ...baseHeader,
            tipe: 'Adjustment',
            sub_tipe: 'Transfer Masuk' as any,
            gudang_id: original.gudang_id, // destinasi
            details: mapDetails(-1),
        },
        paired: {
            ...baseHeader,
            tipe: 'Adjustment',
            sub_tipe: 'Transfer Gudang' as any,
            gudang_id: original.gudang_tujuan_id, // asal
            catatan: `REVERSAL paired transaksi ${original.code}: ${reason}`,
            details: mapDetails(1),
        },
    };
}
```

- [ ] **Step 4: Test PASS**

Run: `cd backend && npx jest --testPathPattern="stok.amend" 2>&1 | tail -15`
Expected: 15/15 PASS.

- [ ] **Step 5: Tambah validator**

Modifikasi `backend/src/shared/middleware/validateInventoryStok.ts`. Tambah di akhir file:
```typescript
const voidSchema = z.object({
    reason: z.string().trim().min(5, 'Alasan wajib diisi (minimal 5 karakter)'),
});

const amendSchema = z.object({
    reason: z.string().trim().min(5, 'Alasan wajib diisi (minimal 5 karakter)'),
    koreksi: z.object({
        details: z.array(transaksiDetailAdjustmentSchema).min(1, 'Minimal satu item detail koreksi'),
    }).optional(),
});

export const validateVoid = (req: Request, _res: Response, next: NextFunction) => {
    try {
        req.body = voidSchema.parse(req.body);
        next();
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const zodError = error as any;
            const formattedErrors = (zodError.issues ?? zodError.errors).map((err: any) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            return next(new AppError(formattedErrors[0]?.message ?? 'Validasi gagal', 400));
        }
        next(error);
    }
};

export const validateAmend = (req: Request, _res: Response, next: NextFunction) => {
    try {
        req.body = amendSchema.parse(req.body);
        next();
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const zodError = error as any;
            const formattedErrors = (zodError.issues ?? zodError.errors).map((err: any) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            return next(new AppError(formattedErrors[0]?.message ?? 'Validasi gagal', 400));
        }
        next(error);
    }
};
```

- [ ] **Step 6: Tambah handler controller**

Di `backend/src/modules/inventory/controllers/stok.controller.ts`, tambah 2 method (mengikuti pola yang ada):
```typescript
async voidTransaksi(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const result = await stokService.voidTransaksi(Number(id), req.user!.id, reason);
        res.json({ status: 'success', data: result, message: 'Transaksi berhasil dibatalkan' });
    } catch (error) {
        next(error);
    }
}

async amendTransaksi(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const { reason, koreksi } = req.body;
        const result = await stokService.amendTransaksi(Number(id), req.user!.id, reason, koreksi);
        res.json({ status: 'success', data: result, message: 'Transaksi berhasil dikoreksi' });
    } catch (error) {
        next(error);
    }
}
```

- [ ] **Step 7: Tambah routes**

Di `backend/src/modules/inventory/routes/inventory.routes.ts` — sebelum `// === Dashboard Routes ===`. Import `validateVoid, validateAmend`:
```typescript
import { validateInventoryStok, validateVoid, validateAmend } from '../../../shared/middleware/validateInventoryStok';
```
Tambah:
```typescript
router.post(
    '/transaksi/:id/void',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.APPROVE),
    validateVoid,
    auditLogger('inv_transaksi'),
    (req, res, next) => stokController.voidTransaksi(req, res, next),
);

router.post(
    '/transaksi/:id/amend',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.APPROVE),
    validateAmend,
    auditLogger('inv_transaksi'),
    (req, res, next) => stokController.amendTransaksi(req, res, next),
);
```

- [ ] **Step 8: Filter `include_inactive` di `getTransaksiList`**

Di `stok.service.ts`, cari `getTransaksiList` (~line 920). Tambah parameter opsional `include_inactive` dan filter berdasar `approval_status`:
```typescript
async getTransaksiList(filters: any) {
    const { /* … existing */, include_inactive = false, /* … */ } = filters;
    const where: any = { /* … existing */ };
    if (!include_inactive) {
        where.approval_status = { [Op.notIn]: ['Voided', 'Rejected'] };
    }
    // … existing findAndCountAll dst.
}
```

- [ ] **Step 9: Tulis integration test end-to-end**

```typescript
// backend/src/modules/inventory/services/__tests__/integration/voidAmend.api.test.ts
import request from 'supertest';
import { app } from '../../../../../index';
import User from '../../../../auth/models/User';
import { Role } from '../../../../auth/models/Role';
import authService from '../../../../auth/services/auth.service';
import InvKategori from '../../../models/Kategori';
import InvSubKategori from '../../../models/SubKategori';
import InvBrand from '../../../models/Brand';
import InvUom from '../../../models/Uom';
import InvProduk from '../../../models/Produk';
import InvGudang from '../../../models/Gudang';
import InvTransaksi from '../../../models/Transaksi';
import InvTransaksiDetail from '../../../models/TransaksiDetail';
import InvStok from '../../../models/Stok';

describe('Void/Amend API Integration (Real DB)', () => {
    let adminToken: string;
    let testUser: User;
    let kategori: InvKategori, subKategori: InvSubKategori, brand: InvBrand;
    let uom: InvUom, produk: InvProduk, gudang: InvGudang;

    beforeAll(async () => {
        const [role] = await Role.findOrCreate({
            where: { name: 'superadmin' },
            defaults: { name: 'superadmin', display_name: 'Superadmin', is_system_role: true },
        });
        testUser = await User.create({
            nama: 'Void/Amend Test User', nik: '999913',
            password: 'password123', role_id: role.id, is_active: true,
        });
        const userWithRole = await User.findByPk(testUser.id, {
            include: [{ model: Role, as: 'roleDetails' }],
        });
        adminToken = authService.generateToken(userWithRole!);

        kategori = await InvKategori.create({ code: 'VA-KAT', nama: 'Void/Amend Kategori' });
        subKategori = await InvSubKategori.create({ code: 'VA-SUB', nama: 'Sub', kategori_id: kategori.id });
        brand = await InvBrand.create({ code: 'VA-BR', nama: 'Brand', sub_kategori_id: subKategori.id });
        uom = await InvUom.create({ code: 'VA-UOM', nama: 'Pcs' });
        produk = await InvProduk.create({
            code: 'VA-P', nama: 'Test Item', brand_id: brand.id, uom_id: uom.id,
        });
        gudang = await InvGudang.create({ code: 'VA-GDG', nama: 'Test Gudang' });
    });

    afterAll(async () => {
        await InvTransaksiDetail.destroy({ where: {}, force: true });
        await InvTransaksi.destroy({ where: {}, force: true });
        await InvStok.destroy({ where: {}, force: true });
        if (produk) await InvProduk.destroy({ where: { id: produk.id }, force: true });
        if (gudang) await InvGudang.destroy({ where: { id: gudang.id }, force: true });
        if (uom) await InvUom.destroy({ where: { id: uom.id }, force: true });
        if (brand) await InvBrand.destroy({ where: { id: brand.id }, force: true });
        if (subKategori) await InvSubKategori.destroy({ where: { id: subKategori.id }, force: true });
        if (kategori) await InvKategori.destroy({ where: { id: kategori.id }, force: true });
        if (testUser) await User.destroy({ where: { nik: '999913' } });
    });

    describe('POST /transaksi/:id/void', () => {
        it('membatalkan transaksi Pending dan mencatat jejak', async () => {
            // Seed transaksi Pending manual (bypass createTransaksi supaya deterministic)
            const trx = await InvTransaksi.create({
                code: 'STK-VA-0001', tipe: 'Keluar', sub_tipe: 'Ke Karyawan',
                tanggal: '2026-07-01', gudang_id: gudang.id,
                karyawan_id: null, department_id: null,
                created_by: testUser.id, approval_status: 'Pending',
            });
            await InvTransaksiDetail.create({
                transaksi_id: trx.id, produk_id: produk.id, uom_id: uom.id, jumlah: 5,
            });

            const res = await request(app)
                .post(`/api/inventory/transaksi/${trx.id}/void`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ reason: 'Salah input karyawan tujuan' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            const refreshed = await InvTransaksi.findByPk(trx.id);
            expect(refreshed?.approval_status).toBe('Voided');
            expect(refreshed?.void_reason).toBe('Salah input karyawan tujuan');
        });

        it('menolak reason yang terlalu pendek', async () => {
            const res = await request(app)
                .post(`/api/inventory/transaksi/1/void`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ reason: 'ok' });
            expect(res.status).toBe(400);
        });

        it('menolak tanpa auth', async () => {
            const res = await request(app).post(`/api/inventory/transaksi/1/void`);
            expect(res.status).toBe(401);
        });
    });

    describe('POST /transaksi/:id/amend', () => {
        it('koreksi transaksi Supplier + koreksi.details: reversal + koreksi terpersist, net stok benar', async () => {
            // Seed: Supplier +100 (Approved), stok = 100
            const trx = await InvTransaksi.create({
                code: 'STK-VA-0100', tipe: 'Masuk', sub_tipe: 'Supplier',
                tanggal: '2026-07-01', gudang_id: gudang.id,
                created_by: testUser.id, approval_status: 'Approved',
            });
            await InvTransaksiDetail.create({
                transaksi_id: trx.id, produk_id: produk.id, uom_id: uom.id, jumlah: 100,
            });
            await InvStok.create({ produk_id: produk.id, gudang_id: gudang.id, uom_id: uom.id, jumlah: 100 });

            const res = await request(app)
                .post(`/api/inventory/transaksi/${trx.id}/amend`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reason: 'Salah input, seharusnya 50 bukan 100',
                    koreksi: { details: [{ produk_id: produk.id, uom_id: uom.id, jumlah: 50 }] },
                });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('reversal');
            expect(res.body.data).toHaveProperty('koreksi');

            // Stok: 100 (asli) - 100 (reversal) + 50 (koreksi) = 50
            const stok = await InvStok.findOne({ where: { produk_id: produk.id, gudang_id: gudang.id } });
            expect(stok?.jumlah).toBe(50);
        });
    });
});
```

- [ ] **Step 10: Jalankan seluruh test inventory**

Run: `cd backend && npx jest --testPathPattern="modules/inventory" --runInBand 2>&1 | tail -20`
Expected: **43+ tests PASS** (30 existing + 6 void + 15 amend + 3 integration).

- [ ] **Step 11: Type-check**

Run: `cd backend && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 12: Commit**

```bash
git add backend/src/shared/middleware/validateInventoryStok.ts backend/src/modules/inventory/controllers/stok.controller.ts backend/src/modules/inventory/routes/inventory.routes.ts backend/src/modules/inventory/services/stok.service.ts backend/src/modules/inventory/services/__tests__/stok.amend.test.ts backend/src/modules/inventory/services/__tests__/integration/voidAmend.api.test.ts
git commit -m "feat(inventory): void/amend HTTP endpoints + Transfer Masuk paired + integration test"
```

---

## Task 10: Frontend types + service + hooks

**Files:**
- Modify: `frontend/src/types/inventory.ts`
- Modify: `frontend/src/services/api/inventory.service.ts` (atau file service transaksi yang ada — cek dulu)
- Modify: `frontend/src/hooks/useInventoryStok.ts`

**Interfaces:**
- Consumes: endpoint `POST /api/inventory/transaksi/:id/void`, `.../amend`
- Produces:
    - `ApprovalStatus` union termasuk `'Voided'`
    - Field baru di `InvTransaksi`: `voided_by, voided_at, void_reason, amends_transaksi_id, amended_by_transaksi_id, voider, transaksi_asli, transaksi_koreksi`
    - Types: `VoidTransaksiPayload`, `AmendTransaksiPayload`
    - Service methods: `voidTransaksi(id, payload)`, `amendTransaksi(id, payload)`
    - Hooks: `useVoidTransaksi()`, `useAmendTransaksi()`

- [ ] **Step 1: Extend types di `inventory.ts`**

```typescript
// frontend/src/types/inventory.ts — pada type ApprovalStatus
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Voided';

// pada interface InvTransaksi, tambah setelah rejection_reason:
voided_by?: number | null;
voided_at?: string | null;
void_reason?: string | null;
amends_transaksi_id?: number | null;
amended_by_transaksi_id?: number | null;
voider?: { id: number; nama: string } | null;
transaksi_asli?: { id: number; code: string } | null;
transaksi_koreksi?: { id: number; code: string } | null;

// setelah interface TransaksiPayload, tambah:
export interface VoidTransaksiPayload {
    reason: string;
}

export interface AmendTransaksiPayload {
    reason: string;
    koreksi?: { details: TransaksiDetailPayload[] };
}
```

- [ ] **Step 2: Tambah method service**

Buka file service yang menangani transaksi (kemungkinan `frontend/src/services/api/inventory.service.ts` atau `frontend/src/services/api/inventory-stok.service.ts` — konfirmasi via grep). Tambah:
```typescript
export const inventoryTransaksiService = {
    // … method existing
    voidTransaksi: (id: number, payload: VoidTransaksiPayload) =>
        apiClient.post<{ status: string; data: InvTransaksi; message: string }>(
            `/inventory/transaksi/${id}/void`, payload,
        ).then(r => r.data),

    amendTransaksi: (id: number, payload: AmendTransaksiPayload) =>
        apiClient.post<{ status: string; data: { reversal: InvTransaksi; koreksi: InvTransaksi | null }; message: string }>(
            `/inventory/transaksi/${id}/amend`, payload,
        ).then(r => r.data),
};
```

- [ ] **Step 3: Tambah hooks**

Buka `frontend/src/hooks/useInventoryStok.ts`. Tambah:
```typescript
export const useVoidTransaksi = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) =>
            inventoryTransaksiService.voidTransaksi(id, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inv-transaksi'] });
            queryClient.invalidateQueries({ queryKey: ['inv-stok'] });
        },
    });
};

export const useAmendTransaksi = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason, koreksi }: { id: number; reason: string; koreksi?: { details: TransaksiDetailPayload[] } }) =>
            inventoryTransaksiService.amendTransaksi(id, { reason, koreksi }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inv-transaksi'] });
            queryClient.invalidateQueries({ queryKey: ['inv-stok'] });
            queryClient.invalidateQueries({ queryKey: ['inv-serial-numbers'] });
        },
    });
};
```

Sesuaikan nama query key dengan yang benar-benar dipakai di codebase (cek `useTransaksiList` yang ada). Ganti nama import service jika perlu.

- [ ] **Step 4: Extend `useTransaksiList` dengan `include_inactive`**

Cari `useTransaksiList` di file yang sama. Tambah parameter opsional `include_inactive` dan forward ke service:
```typescript
export const useTransaksiList = (filters: TransaksiFilter & { include_inactive?: boolean } = {}) => {
    return useQuery({
        queryKey: ['inv-transaksi', filters],
        queryFn: () => inventoryTransaksiService.list(filters),
    });
};
```
Update signature `inventoryTransaksiService.list` mengirim query param `include_inactive`.

- [ ] **Step 5: Type-check frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/inventory.ts frontend/src/services/api/*.ts frontend/src/hooks/useInventoryStok.ts
git commit -m "feat(inventory-fe): types, service, hooks for void/amend"
```

---

## Task 11: Modal Void + Amend

**Files:**
- Create: `frontend/src/components/inventory/VoidTransaksiModal.tsx`
- Create: `frontend/src/components/inventory/AmendTransaksiModal.tsx`
- Create: `frontend/src/components/inventory/__tests__/VoidTransaksiModal.test.tsx`
- Create: `frontend/src/components/inventory/__tests__/AmendTransaksiModal.test.tsx`

**Interfaces:**
- Consumes: `useVoidTransaksi`, `useAmendTransaksi`, dan komponen modal existing (cek `frontend/src/components/common/Modal.tsx` atau serupa)
- Produces:
    - `VoidTransaksiModal({ transaksiId, transaksiCode, onClose, onSuccess })`
    - `AmendTransaksiModal({ transaksi, onClose, onSuccess })`

- [ ] **Step 1: Konfirmasi komponen Modal existing**

Run: `find frontend/src/components/common -name "*.tsx" | head -5`
Cek pola Modal wrapper. Sesuaikan import.

- [ ] **Step 2: Tulis `VoidTransaksiModal.tsx`**

```tsx
// frontend/src/components/inventory/VoidTransaksiModal.tsx
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useVoidTransaksi } from '../../hooks/useInventoryStok';

interface Props {
    transaksiId: number;
    transaksiCode: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export const VoidTransaksiModal: React.FC<Props> = ({ transaksiId, transaksiCode, onClose, onSuccess }) => {
    const [reason, setReason] = useState('');
    const voidMutation = useVoidTransaksi();

    const trimmed = reason.trim();
    const isValid = trimmed.length >= 5;

    const handleSubmit = async () => {
        if (!isValid) {
            toast.error('Alasan wajib diisi minimal 5 karakter');
            return;
        }
        try {
            await voidMutation.mutateAsync({ id: transaksiId, reason: trimmed });
            toast.success('Transaksi berhasil dibatalkan');
            onSuccess?.();
            onClose();
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? 'Gagal membatalkan transaksi';
            toast.error(msg);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Batalkan Transaksi {transaksiCode}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Transaksi yang dibatalkan tidak dapat dikembalikan. Pastikan tindakan ini sudah benar.
                </p>
                <label className="block text-sm font-medium mb-1">Alasan pembatalan</label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Minimal 5 karakter"
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm"
                    autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">{trimmed.length} karakter</p>
                <div className="flex gap-2 justify-end mt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || voidMutation.isPending}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                        {voidMutation.isPending ? 'Memproses...' : 'Ya, Batalkan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoidTransaksiModal;
```

- [ ] **Step 3: Tulis `AmendTransaksiModal.tsx`**

```tsx
// frontend/src/components/inventory/AmendTransaksiModal.tsx
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAmendTransaksi } from '../../hooks/useInventoryStok';
import { InvTransaksi, TransaksiDetailPayload } from '../../types/inventory';

interface Props {
    transaksi: InvTransaksi;
    onClose: () => void;
    onSuccess?: (result: { reversal: InvTransaksi; koreksi: InvTransaksi | null }) => void;
}

export const AmendTransaksiModal: React.FC<Props> = ({ transaksi, onClose, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [withKoreksi, setWithKoreksi] = useState(false);
    const [details, setDetails] = useState<TransaksiDetailPayload[]>(
        (transaksi.details ?? []).map(d => ({
            produk_id: d.produk_id,
            uom_id: d.uom_id,
            jumlah: d.jumlah,
            catatan: d.catatan ?? undefined,
        }))
    );
    const amendMutation = useAmendTransaksi();

    const trimmed = reason.trim();
    const isValid = trimmed.length >= 5;

    const handleSubmit = async () => {
        if (!isValid) {
            toast.error('Alasan wajib diisi minimal 5 karakter');
            return;
        }
        try {
            const result = await amendMutation.mutateAsync({
                id: transaksi.id,
                reason: trimmed,
                koreksi: withKoreksi ? { details } : undefined,
            });
            toast.success('Transaksi berhasil dikoreksi');
            onSuccess?.(result.data);
            onClose();
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? 'Gagal mengoreksi transaksi';
            toast.error(msg);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Koreksi Transaksi {transaksi.code}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Sistem akan membuat transaksi reversal (efek kebalikan). Data historis tidak berubah.
                </p>

                <label className="block text-sm font-medium mb-1">Alasan koreksi</label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Minimal 5 karakter"
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm"
                    autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">{trimmed.length} karakter</p>

                <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={withKoreksi}
                            onChange={(e) => setWithKoreksi(e.target.checked)}
                        />
                        Buat transaksi koreksi baru sekaligus
                    </label>
                </div>

                {withKoreksi && (
                    <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                        <p className="text-xs text-gray-500 mb-2">Item koreksi (jumlah baru):</p>
                        {details.map((d, i) => (
                            <div key={i} className="flex gap-2 items-center mb-2">
                                <span className="text-sm w-24">Produk #{d.produk_id}</span>
                                <input
                                    type="number"
                                    value={d.jumlah}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setDetails(prev => prev.map((x, j) => j === i ? { ...x, jumlah: val } : x));
                                    }}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 justify-end mt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || amendMutation.isPending}
                        className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                    >
                        {amendMutation.isPending ? 'Memproses...' : 'Ya, Koreksi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AmendTransaksiModal;
```

- [ ] **Step 4: Tulis test Vitest**

```typescript
// frontend/src/components/inventory/__tests__/VoidTransaksiModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VoidTransaksiModal } from '../VoidTransaksiModal';

vi.mock('../../../hooks/useInventoryStok', () => ({
    useVoidTransaksi: () => ({
        mutateAsync: vi.fn().mockResolvedValue({ status: 'success' }),
        isPending: false,
    }),
}));
vi.mock('react-hot-toast', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

const wrap = (ui: React.ReactElement) => {
    const qc = new QueryClient();
    return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

describe('VoidTransaksiModal', () => {
    it('menonaktifkan tombol submit jika reason < 5 char', () => {
        wrap(<VoidTransaksiModal transaksiId={100} transaksiCode="STK-0001" onClose={() => {}} />);
        const btn = screen.getByRole('button', { name: /Ya, Batalkan/i });
        expect(btn).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText(/Minimal 5 karakter/), { target: { value: 'oke' } });
        expect(btn).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText(/Minimal 5 karakter/), { target: { value: 'alasan yg valid' } });
        expect(btn).not.toBeDisabled();
    });
});

// frontend/src/components/inventory/__tests__/AmendTransaksiModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AmendTransaksiModal } from '../AmendTransaksiModal';

vi.mock('../../../hooks/useInventoryStok', () => ({
    useAmendTransaksi: () => ({
        mutateAsync: vi.fn().mockResolvedValue({ status: 'success', data: { reversal: {}, koreksi: null } }),
        isPending: false,
    }),
}));
vi.mock('react-hot-toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const wrap = (ui: React.ReactElement) => {
    const qc = new QueryClient();
    return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

const dummy = {
    id: 100, code: 'STK-0001', tipe: 'Masuk', sub_tipe: 'Supplier',
    tanggal: '2026-07-01', gudang_id: 1, created_by: 1, approval_status: 'Approved',
    created_at: '', updated_at: '',
    details: [{ id: 1, transaksi_id: 100, produk_id: 10, uom_id: 1, jumlah: 100, created_at: '', updated_at: '' }],
} as any;

describe('AmendTransaksiModal', () => {
    it('toggle koreksi menampilkan editor details', () => {
        wrap(<AmendTransaksiModal transaksi={dummy} onClose={() => {}} />);
        expect(screen.queryByText(/Item koreksi/)).toBeNull();
        fireEvent.click(screen.getByLabelText(/Buat transaksi koreksi baru sekaligus/));
        expect(screen.getByText(/Item koreksi/)).toBeInTheDocument();
    });
});
```

- [ ] **Step 5: Jalankan Vitest**

Run: `cd frontend && npm run test:run -- src/components/inventory/__tests__ 2>&1 | tail -15`
Expected: 2 test PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/inventory/
git commit -m "feat(inventory-fe): Void & Amend transaksi modals + Vitest"
```

---

## Task 12: Integrasi UI di TransaksiListPage — tombol, badge, filter

**Files:**
- Modify: `frontend/src/pages/inventory/stok/TransaksiListPage.tsx`

**Interfaces:**
- Consumes: `VoidTransaksiModal`, `AmendTransaksiModal`, `useTransaksiList` (dengan `include_inactive`)
- Produces: perilaku UI final — tombol kondisional per status, badge status, filter opsional

- [ ] **Step 1: Impor modal + state**

Di atas komponen:
```typescript
import { useState } from 'react';
import { VoidTransaksiModal } from '../../../components/inventory/VoidTransaksiModal';
import { AmendTransaksiModal } from '../../../components/inventory/AmendTransaksiModal';
import { InvTransaksi } from '../../../types/inventory';
import { usePermission } from '../../../hooks/usePermission';
import { RESOURCES, ACTIONS } from '../../../types/permission';
```

Di dalam komponen:
```typescript
const { can } = usePermission();
const canApprove = can(RESOURCES.INVENTORY_STOCK, ACTIONS.APPROVE);
const [voidTarget, setVoidTarget] = useState<InvTransaksi | null>(null);
const [amendTarget, setAmendTarget] = useState<InvTransaksi | null>(null);
const [includeInactive, setIncludeInactive] = useState(false);
```

Update hook call:
```typescript
const { data, isLoading } = useTransaksiList({ /* ... existing filters */, include_inactive: includeInactive });
```

- [ ] **Step 2: Tambah checkbox filter `include_inactive`**

Di panel filter (bagian atas list), tambah:
```tsx
<label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
    <input
        type="checkbox"
        checked={includeInactive}
        onChange={(e) => setIncludeInactive(e.target.checked)}
    />
    Termasuk dibatalkan/ditolak
</label>
```

- [ ] **Step 3: Tambah badge di kolom Status**

Di kolom yang menampilkan `approval_status`:
```tsx
{trx.approval_status === 'Voided' && (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full dark:bg-gray-800 dark:text-gray-300" title={`Dibatalkan oleh ${trx.voider?.nama ?? '-'} pada ${trx.voided_at}. Alasan: ${trx.void_reason ?? '-'}`}>
        Voided
    </span>
)}
{trx.approval_status === 'Approved' && trx.amends_transaksi_id && (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full dark:bg-blue-950 dark:text-blue-300">
        Reversal
    </span>
)}
{trx.approval_status === 'Approved' && trx.amended_by_transaksi_id && (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full dark:bg-yellow-950 dark:text-yellow-300">
        Dikoreksi
    </span>
)}
```

- [ ] **Step 4: Tambah tombol aksi Batalkan/Koreksi**

Di kolom aksi (biasanya kolom terakhir):
```tsx
{trx.approval_status === 'Pending' && canApprove && (
    <button
        onClick={() => setVoidTarget(trx)}
        className="text-xs text-red-600 hover:underline"
    >
        Batalkan
    </button>
)}
{trx.approval_status === 'Approved'
 && !trx.amended_by_transaksi_id
 && !trx.amends_transaksi_id
 && canApprove && (
    <button
        onClick={() => setAmendTarget(trx)}
        className="text-xs text-yellow-600 hover:underline"
    >
        Koreksi
    </button>
)}
```

- [ ] **Step 5: Render modal di akhir komponen (sebelum `</div>` root)**

```tsx
{voidTarget && (
    <VoidTransaksiModal
        transaksiId={voidTarget.id}
        transaksiCode={voidTarget.code}
        onClose={() => setVoidTarget(null)}
        onSuccess={() => setVoidTarget(null)}
    />
)}
{amendTarget && (
    <AmendTransaksiModal
        transaksi={amendTarget}
        onClose={() => setAmendTarget(null)}
        onSuccess={() => setAmendTarget(null)}
    />
)}
```

- [ ] **Step 6: Type-check + smoke check FE**

Run: `cd frontend && npx tsc --noEmit`
Expected: exit 0.

Run manual smoke test:
```bash
cd frontend && npm run dev
```
Buka browser, login sebagai superadmin, ke `/inventory/transaksi`. Verifikasi:
- Checkbox "Termasuk dibatalkan/ditolak" muncul, default OFF
- Tombol "Batalkan" muncul di row Pending
- Tombol "Koreksi" muncul di row Approved yang belum di-amend
- Modal terbuka & bisa submit; toast sukses
- Setelah koreksi, badge "Reversal" dan "Dikoreksi" muncul di baris terkait

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/inventory/stok/TransaksiListPage.tsx
git commit -m "feat(inventory-fe): Void/Amend buttons, status badges, filter checkbox"
```

---

## Self-Review

**1. Spec coverage:**
- Migration 69 (enum + 5 kolom + 3 index) → Task 1 ✓
- Model & associations → Task 2 ✓
- `voidTransaksi` service + validator + endpoint → Task 4 (service) + Task 9 (validator+endpoint) ✓
- `amendTransaksi` non-serial → Task 6 ✓
- `amendTransaksi` serial → Task 7 ✓
- `amendTransaksi` fasilitas → Task 8 ✓
- `amendTransaksi` transfer paired → Task 9 ✓
- Guard fail-closed (§3.2 spec): sudah di-amend, reversal-of-reversal, transfer leg auto, serial dipindah, facility ditarik, stok negatif → Task 5 (basic), 7 (serial), 8 (fasilitas), effect handler (stok negatif via `validateStokCukup` existing) ✓
- Controller + routes + permission `APPROVE` + auditLogger → Task 9 ✓
- Validator zod → Task 9 ✓
- Filter list `include_inactive` → Task 9 (backend) + Task 12 (frontend) ✓
- Types + service + hooks FE → Task 10 ✓
- Modal Void + Amend → Task 11 ✓
- Badge + tombol + integrasi list → Task 12 ✓
- Test coverage: 6 void unit + 15 amend unit + 3 integration + 2 Vitest → Tasks 4, 5-9, 11 ✓
- Refactor `createTransaksiInternal` → Task 3 ✓

**2. Placeholder scan:** dibaca ulang — tidak ada "TBD/TODO/implement later". Semua kode block berisi konten literal siap-paste.

**3. Type consistency:**
- `voidTransaksi(id, userId, reason)` — konsisten di Task 4 (test), 4 (impl), 9 (controller/route)
- `amendTransaksi(id, userId, reason, koreksi?)` — konsisten di Task 5-9
- `buildReversalPayload` mengembalikan `{ primary; paired? }` — konsisten di Task 6-9
- `validateReversalGuards(original, details, t)` — konsisten Task 5-8
- Field baru `amends_transaksi_id`, `amended_by_transaksi_id`, `voided_by/at`, `void_reason` — konsisten di migration, model, test, service, types FE, badge FE
- `include_inactive` — konsisten backend service (Task 9) + FE hook (Task 10) + FE UI (Task 12)

**4. Ambiguitas:** Task 6 mencatat trade-off `sub_tipe` reversal (pakai `original.sub_tipe` daripada `'Adjustment'`) — pilihan sudah dikunci: pertahankan sub-tipe asli, hanya balikkan `tipe`.

Semua clear. Total 12 task, terpaket per unit uji sendiri.
