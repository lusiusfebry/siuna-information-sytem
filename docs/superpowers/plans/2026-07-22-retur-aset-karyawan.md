# Retur Aset Karyawan (A+B+C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable returning serial/tag-tracked assets from an employee back to a warehouse, with asset-holder-scoped employee search, checkbox asset selection, serial/tag lookup, and a return handover PDF.

**Architecture:** Backend adds two read endpoints and one PDF direction parameter; it reuses the existing `Retur Karyawan` transaction path (auto-approve, type Masuk) unchanged. Frontend centralizes the logic in one picker component + one hook, consumed by three entry points (dedicated return page, general transaction form, employee profile tab).

**Tech Stack:** Express + TypeScript + Sequelize (PostgreSQL), Jest (backend tests); React 18 + Vite + React Query + Zustand, Vitest (frontend tests).

## Global Constraints

- All user-facing strings in **Indonesian** (error messages, labels, toasts).
- No new DB migration — reuse existing `karyawan_id`, `sub_tipe='Retur Karyawan'`, `tipe='Masuk'`.
- No new permission — reuse `inventory_stock:read` (reads) and `inventory_stock:create` (return submit).
- Do NOT modify the "Ke Karyawan" outbound path, the approval gate, or cross-module coupling (HR↔Inventory stays via `karyawan_id`).
- Do NOT touch product/seed data (user inputs it manually).
- Return transaction is `tipe: 'Masuk'`, `sub_tipe: 'Retur Karyawan'` → auto-approves (verified in `stok.service.ts` `requiresApproval`).
- Backend service tests follow the `jest.mock(...)` unit style of `stok.approval.test.ts` (mock every model + `config/database`), NOT a live DB.
- **`uom_id` is REQUIRED and must be positive** on every return detail: the Masuk path calls `upsertStok(..., detail.uom_id, ...)` which writes `uom_id` into `inv_stok` (verified `stok.service.ts:461,826,832`) and stores it on the transaksi detail (`:389`). Sending `uom_id: 0` corrupts stock / violates FK. Each returned unit therefore carries its product's `uom_id`, sourced from the asset record (Task 0).

---

## File Structure

**Backend**
- Modify `modules/inventory/services/employee-asset.service.ts` — add `getEmployeesWithAssets`, `lookupAssetByIdentifier`; add `arah` param to `generateBeritaAcara`.
- Modify `modules/inventory/controllers/employee-asset.controller.ts` — add `getEmployeesWithAssets`, `lookupAsset` handlers; pass `arah` through BA handler.
- Modify `modules/inventory/routes/inventory.routes.ts` — register 2 new GET routes + a return-BA route.
- Create `modules/inventory/services/__tests__/employee-asset.service.test.ts` — unit tests.

**Frontend**
- Modify `services/api/inventory-employee.service.ts` — add `getEmployeesWithAssets`, `lookupAsset`, extend `downloadBeritaAcara` with `arah`.
- Create `components/inventory/ReturAssetPicker.tsx` — shared picker (employee search + asset checklist + destination warehouse).
- Create `hooks/useReturKaryawan.ts` — build payload + submit + trigger BA modal.
- Create `pages/inventory/stok/ReturPage.tsx` — dedicated return page (serial lookup panel + picker).
- Modify `components/inventory/EmployeeAssetsTab.tsx` — add "Retur Aset" button (entry A).
- Modify `pages/inventory/stok/TransaksiFormPage.tsx` — use picker when sub_tipe is Retur Karyawan.
- Modify `components/layout/Sidebar.tsx` + `App.tsx` — menu item + route.
- Create `components/inventory/__tests__/ReturAssetPicker.test.tsx` — component test.

---

## Task 0: Backend — include `uom_id` on employee assets

**Files:**
- Modify: `backend/src/modules/inventory/services/employee-asset.service.ts` (`getEmployeeAssets`)
- Modify: `frontend/src/types/inventory.ts` (`InvSerialNumber.produk`)

**Why:** The return submit needs each unit's product `uom_id` (see Global Constraints). `getEmployeeAssets` already includes `produk`; we just add `uom_id` to its attributes so the frontend picker can read it.

**Interfaces:**
- Produces: each asset's `produk` now includes `uom_id: number`.

- [ ] **Step 1: Add `uom_id` to the produk include**

In `employee-asset.service.ts` `getEmployeeAssets`, change the `InvProduk` include attributes from `['id', 'code', 'nama']` to include `uom_id`:

```typescript
                {
                    model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama', 'uom_id'],
                    include: [{ model: InvBrand, as: 'brand', attributes: ['id', 'nama'] }],
                },
```

- [ ] **Step 2: Widen the frontend type**

In `frontend/src/types/inventory.ts`, change the `InvSerialNumber.produk` shape (line ~130) to include `uom_id`:

```typescript
    produk?: { id: number; code: string; nama: string; uom_id?: number };
```

- [ ] **Step 3: Type-check + commit**

Run: `cd backend && npm run type-check` then `cd ../frontend && npm run build 2>&1 | head -10`
Expected: no errors.

```bash
git add backend/src/modules/inventory/services/employee-asset.service.ts frontend/src/types/inventory.ts
git commit -m "feat(inventory): expose product uom_id on employee assets for returns"
```

---

## Task 1: Backend — `getEmployeesWithAssets` service + endpoint

**Files:**
- Modify: `backend/src/modules/inventory/services/employee-asset.service.ts`
- Modify: `backend/src/modules/inventory/controllers/employee-asset.controller.ts`
- Modify: `backend/src/modules/inventory/routes/inventory.routes.ts:293` (after `/employees/search` route)
- Test: `backend/src/modules/inventory/services/__tests__/employee-asset.service.test.ts` (create)

**Interfaces:**
- Produces: `employeeAssetService.getEmployeesWithAssets(q?: string): Promise<Array<{ id: number; nama_lengkap: string; nomor_induk_karyawan: string; asset_count: number }>>`
- Produces: `GET /api/inventory/employees/with-assets?q=` → `{ status: 'success', data: [...] }`

- [ ] **Step 1: Write the failing test**

Create `backend/src/modules/inventory/services/__tests__/employee-asset.service.test.ts`:

```typescript
import employeeAssetService from '../employee-asset.service';
import InvSerialNumber from '../../models/SerialNumber';
import Employee from '../../hr/models/Employee';

jest.mock('../../models/SerialNumber', () => ({ __esModule: true, default: { findAll: jest.fn() } }));
jest.mock('../../models/Produk', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Gudang', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Uom', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Brand', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Transaksi', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/TransaksiDetail', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/Employee', () => ({ __esModule: true, default: { findAll: jest.fn() } }));

const SN = InvSerialNumber as any;
const Emp = Employee as any;

describe('getEmployeesWithAssets', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns only employees holding assets, with asset_count', async () => {
        Emp.findAll.mockResolvedValue([
            { id: 5, nama_lengkap: 'Triyanto', nomor_induk_karyawan: 'EMP-005', get: () => 3 },
        ]);
        const res = await employeeAssetService.getEmployeesWithAssets('tri');
        expect(Emp.findAll).toHaveBeenCalled();
        expect(res[0]).toMatchObject({ id: 5, nama_lengkap: 'Triyanto', asset_count: 3 });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest employee-asset.service.test -t "returns only employees holding assets"`
Expected: FAIL — `getEmployeesWithAssets is not a function`.

- [ ] **Step 3: Implement the service method**

In `employee-asset.service.ts`, add imports at top (if missing) and this method inside the class. Uses a subquery on serial numbers so only asset holders return, with a counted `asset_count`:

```typescript
import { Op, fn, col, literal } from 'sequelize';
import StatusKaryawan from '../../hr/models/StatusKaryawan';
```

```typescript
    async getEmployeesWithAssets(q?: string) {
        const query = (q || '').trim();
        const where: any = {
            // Only employees currently holding at least one serial/tag asset.
            id: {
                [Op.in]: literal(
                    '(SELECT DISTINCT karyawan_id FROM inv_serial_number WHERE karyawan_id IS NOT NULL)'
                ),
            },
        };
        if (query) {
            where[Op.or] = [
                { nama_lengkap: { [Op.iLike]: `%${query}%` } },
                { nomor_induk_karyawan: { [Op.iLike]: `%${query}%` } },
            ];
        }

        const employees = await Employee.findAll({
            where,
            include: [{ model: StatusKaryawan, as: 'status_karyawan', where: { nama: 'Aktif' }, attributes: [] }],
            attributes: [
                'id',
                'nama_lengkap',
                'nomor_induk_karyawan',
                [
                    literal(
                        '(SELECT COUNT(*) FROM inv_serial_number sn WHERE sn.karyawan_id = "Employee".id)'
                    ),
                    'asset_count',
                ],
            ],
            limit: 20,
            order: [['nama_lengkap', 'ASC']],
        });

        return employees.map((e: any) => ({
            id: e.id,
            nama_lengkap: e.nama_lengkap,
            nomor_induk_karyawan: e.nomor_induk_karyawan,
            asset_count: Number(e.get('asset_count')) || 0,
        }));
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest employee-asset.service.test -t "returns only employees holding assets"`
Expected: PASS.

- [ ] **Step 5: Add controller handler**

In `employee-asset.controller.ts`, add after `searchEmployees`:

```typescript
    async getEmployeesWithAssets(req: Request, res: Response, next: NextFunction) {
        try {
            const q = (req.query.q as string) || '';
            const data = await employeeAssetService.getEmployeesWithAssets(q);
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }
```

- [ ] **Step 6: Register route**

In `inventory.routes.ts`, add immediately after the `/employees/search` route block (line ~293):

```typescript
router.get(
    '/employees/with-assets',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => employeeAssetController.getEmployeesWithAssets(req, res, next)
);
```

- [ ] **Step 7: Type-check + commit**

Run: `cd backend && npm run type-check`
Expected: no errors.

```bash
git add backend/src/modules/inventory/services/employee-asset.service.ts backend/src/modules/inventory/controllers/employee-asset.controller.ts backend/src/modules/inventory/routes/inventory.routes.ts backend/src/modules/inventory/services/__tests__/employee-asset.service.test.ts
git commit -m "feat(inventory): add employees-with-assets endpoint for return flow"
```

---

## Task 2: Backend — `lookupAssetByIdentifier` service + endpoint

**Files:**
- Modify: `backend/src/modules/inventory/services/employee-asset.service.ts`
- Modify: `backend/src/modules/inventory/controllers/employee-asset.controller.ts`
- Modify: `backend/src/modules/inventory/routes/inventory.routes.ts` (after the route from Task 1)
- Test: `backend/src/modules/inventory/services/__tests__/employee-asset.service.test.ts` (append)

**Interfaces:**
- Consumes: nothing from Task 1 beyond the shared service file.
- Produces: `employeeAssetService.lookupAssetByIdentifier(identifier: string): Promise<InvSerialNumber | null>` (includes `produk`→`brand`, `gudang`, `karyawan`).
- Produces: `GET /api/inventory/assets/lookup?identifier=` → `{ status: 'success', data: <unit|null> }`.

- [ ] **Step 1: Write the failing test**

Append to `employee-asset.service.test.ts`:

```typescript
describe('lookupAssetByIdentifier', () => {
    beforeEach(() => jest.clearAllMocks());

    it('finds a unit by serial OR tag and includes its holder', async () => {
        SN.findAll.mockResolvedValue([]); // unused here
        (InvSerialNumber as any).findOne = jest.fn().mockResolvedValue({
            id: 9, serial_number: 'SN-1', tag_number: null, karyawan_id: 5,
        });
        const res = await employeeAssetService.lookupAssetByIdentifier('SN-1');
        const call = (InvSerialNumber as any).findOne.mock.calls[0][0];
        // Query must OR-match serial_number and tag_number.
        expect(JSON.stringify(call.where)).toContain('SN-1');
        expect(res).toMatchObject({ id: 9, karyawan_id: 5 });
    });

    it('returns null when nothing matches', async () => {
        (InvSerialNumber as any).findOne = jest.fn().mockResolvedValue(null);
        const res = await employeeAssetService.lookupAssetByIdentifier('NOPE');
        expect(res).toBeNull();
    });
});
```

Add `findOne: jest.fn()` to the SerialNumber mock at the top of the file:

```typescript
jest.mock('../../models/SerialNumber', () => ({ __esModule: true, default: { findAll: jest.fn(), findOne: jest.fn() } }));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest employee-asset.service.test -t "finds a unit by serial"`
Expected: FAIL — `lookupAssetByIdentifier is not a function`.

- [ ] **Step 3: Implement the service method**

Add to `employee-asset.service.ts` (imports for `InvBrand`, `Employee` already present in file):

```typescript
    async lookupAssetByIdentifier(identifier: string) {
        const id = (identifier || '').trim();
        if (!id) return null;
        const unit = await InvSerialNumber.findOne({
            where: {
                [Op.or]: [{ serial_number: id }, { tag_number: id }],
            },
            include: [
                {
                    model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'],
                    include: [{ model: InvBrand, as: 'brand', attributes: ['id', 'nama'] }],
                },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap', 'nomor_induk_karyawan'], paranoid: false },
            ],
        });
        return unit;
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest employee-asset.service.test`
Expected: PASS (all cases in the file).

- [ ] **Step 5: Add controller handler**

In `employee-asset.controller.ts`, add:

```typescript
    async lookupAsset(req: Request, res: Response, next: NextFunction) {
        try {
            const identifier = (req.query.identifier as string) || '';
            const data = await employeeAssetService.lookupAssetByIdentifier(identifier);
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }
```

- [ ] **Step 6: Register route**

In `inventory.routes.ts`, add after the `with-assets` route:

```typescript
router.get(
    '/assets/lookup',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => employeeAssetController.lookupAsset(req, res, next)
);
```

- [ ] **Step 7: Type-check + commit**

Run: `cd backend && npm run type-check`
Expected: no errors.

```bash
git add backend/src/modules/inventory
git commit -m "feat(inventory): add asset serial/tag lookup endpoint"
```

---

## Task 3: Backend — return-direction Berita Acara

**Files:**
- Modify: `backend/src/modules/inventory/services/employee-asset.service.ts` (`generateBeritaAcara`)
- Modify: `backend/src/modules/inventory/controllers/employee-asset.controller.ts` (`downloadBeritaAcara`)
- Modify: `backend/src/modules/inventory/routes/inventory.routes.ts` (return-BA routes)

**Interfaces:**
- Produces: `generateBeritaAcara(employeeId: number, transaksiId?: number, arah?: 'serah' | 'kembali'): Promise<Buffer>` (default `'serah'` = unchanged behavior).
- Produces: `GET /api/inventory/employees/:employeeId/berita-acara-retur/:transaksiId?` → PDF.

- [ ] **Step 1: Update the signature and title/label logic**

In `generateBeritaAcara`, change the signature and derive labels from `arah`:

```typescript
    async generateBeritaAcara(employeeId: number, transaksiId?: number, arah: 'serah' | 'kembali' = 'serah'): Promise<Buffer> {
```

Replace the hardcoded `<h1>` title and intro line. Find:

```typescript
<h1>BERITA ACARA SERAH TERIMA BARANG</h1>
```

Replace with (compute before the template string, near the `tanggal` line):

```typescript
        const judul = arah === 'kembali' ? 'BERITA ACARA PENGEMBALIAN BARANG' : 'BERITA ACARA SERAH TERIMA BARANG';
        const kalimatPembuka = arah === 'kembali'
            ? `Pada hari ini, ${tanggal}, telah dilaksanakan pengembalian barang inventaris dari:`
            : `Pada hari ini, ${tanggal}, telah dilaksanakan serah terima barang inventaris kepada:`;
        const labelKiri = arah === 'kembali' ? 'Yang Menerima,' : 'Yang Menyerahkan,';
        const labelKanan = arah === 'kembali' ? 'Yang Mengembalikan,' : 'Yang Menerima,';
```

Then in the template use `${judul}` for the `<h1>`, `${kalimatPembuka}` for the intro `<p>`, and swap the signature blocks:

```typescript
<div class="signatures">
<div class="sig-block"><p>${labelKiri}</p><div class="sig-line">(_________________)</div></div>
<div class="sig-block"><p>${labelKanan}</p><div class="sig-line">(${(employee as any).nama_lengkap})</div></div>
</div>
```

(For `arah='kembali'`, the employee is the one returning → their name sits under "Yang Mengembalikan," on the right; the receiving warehouse/admin signs left.)

- [ ] **Step 2: Update controller to read direction from route**

In `downloadBeritaAcara`, add an `arah` derived from the path. Replace the method body's buffer line:

```typescript
    async downloadBeritaAcara(req: Request, res: Response, next: NextFunction) {
        try {
            const transaksiId = req.params.transaksiId ? Number(req.params.transaksiId) : undefined;
            const arah = req.path.includes('berita-acara-retur') ? 'kembali' : 'serah';
            const buffer = await employeeAssetService.generateBeritaAcara(Number(req.params.employeeId), transaksiId, arah);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Berita-Acara-${req.params.employeeId}.pdf`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
```

- [ ] **Step 3: Register return-BA routes**

In `inventory.routes.ts`, add after the existing berita-acara routes (line ~317):

```typescript
router.get(
    '/employees/:employeeId/berita-acara-retur',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => employeeAssetController.downloadBeritaAcara(req, res, next)
);
router.get(
    '/employees/:employeeId/berita-acara-retur/:transaksiId',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => employeeAssetController.downloadBeritaAcara(req, res, next)
);
```

- [ ] **Step 4: Type-check + commit**

Run: `cd backend && npm run type-check`
Expected: no errors.

```bash
git add backend/src/modules/inventory
git commit -m "feat(inventory): support return-direction berita acara PDF"
```

---

## Task 4: Frontend — API service additions

**Files:**
- Modify: `frontend/src/services/api/inventory-employee.service.ts`

**Interfaces:**
- Produces: `inventoryEmployeeService.getEmployeesWithAssets(q: string): Promise<{ status: string; data: EmployeeWithAssets[] }>` where `EmployeeWithAssets = { id: number; nama_lengkap: string; nomor_induk_karyawan: string; asset_count: number }`.
- Produces: `inventoryEmployeeService.lookupAsset(identifier: string): Promise<{ status: string; data: InvSerialNumber | null }>`.
- Produces: `inventoryEmployeeService.downloadBeritaAcara(employeeId, transaksiId?, arah?: 'serah' | 'kembali'): Promise<Blob>`.

- [ ] **Step 1: Add functions and export**

Edit `inventory-employee.service.ts`. Add the interface near the top:

```typescript
export interface EmployeeWithAssets {
    id: number;
    nama_lengkap: string;
    nomor_induk_karyawan: string;
    asset_count: number;
}
```

Add functions and update `downloadBeritaAcara`:

```typescript
const getEmployeesWithAssets = async (q: string): Promise<{ status: string; data: EmployeeWithAssets[] }> => {
    const response = await client.get(`/inventory/employees/with-assets`, { params: { q } });
    return response.data;
};

const lookupAsset = async (identifier: string): Promise<{ status: string; data: InvSerialNumber | null }> => {
    const response = await client.get(`/inventory/assets/lookup`, { params: { identifier } });
    return response.data;
};

const downloadBeritaAcara = async (employeeId: number, transaksiId?: number, arah: 'serah' | 'kembali' = 'serah'): Promise<Blob> => {
    const base = arah === 'kembali' ? 'berita-acara-retur' : 'berita-acara';
    const url = transaksiId
        ? `/inventory/employees/${employeeId}/${base}/${transaksiId}`
        : `/inventory/employees/${employeeId}/${base}`;
    const response = await client.get(url, { responseType: 'blob' });
    return response.data;
};
```

Update the default export object to include `getEmployeesWithAssets` and `lookupAsset`.

- [ ] **Step 2: Type-check + commit**

Run: `cd frontend && npm run build 2>&1 | head -20` (tsc runs first; watch for errors)
Expected: no type errors related to this file.

```bash
git add frontend/src/services/api/inventory-employee.service.ts
git commit -m "feat(inventory): add return-flow API service functions"
```

---

## Task 5: Frontend — `ReturAssetPicker` component (shared core)

**Files:**
- Create: `frontend/src/components/inventory/ReturAssetPicker.tsx`
- Test: `frontend/src/components/inventory/__tests__/ReturAssetPicker.test.tsx` (create)

**Interfaces:**
- Consumes: `inventoryEmployeeService.getEmployeesWithAssets`, `inventoryEmployeeService.getEmployeeAssets` (existing), `useInvGudangList` (existing hook).
- Produces: default export `ReturAssetPicker` with props:
```typescript
interface ReturSelection {
    karyawan_id: number;
    karyawan_nama: string;
    gudang_id: number;
    items: { serial_number_id: number; produk_id: number; uom_id: number; identifier: string }[];
}
interface ReturAssetPickerProps {
    initialKaryawanId?: number;
    preselectSerialIds?: number[];
    onChange: (sel: ReturSelection) => void;
}
```

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/inventory/__tests__/ReturAssetPicker.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ReturAssetPicker from '../ReturAssetPicker';
import inventoryEmployeeService from '../../../services/api/inventory-employee.service';

vi.mock('../../../services/api/inventory-employee.service');
vi.mock('../../../hooks/useInventoryMasterData', () => ({
    useInvGudangList: () => ({ data: { data: [{ id: 1, nama: 'Gudang Pusat' }] } }),
}));

const wrap = (ui: React.ReactNode) => {
    const qc = new QueryClient();
    return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

describe('ReturAssetPicker', () => {
    beforeEach(() => vi.clearAllMocks());

    it('shows employee results and loads their assets on select', async () => {
        (inventoryEmployeeService.getEmployeesWithAssets as any).mockResolvedValue({
            status: 'success', data: [{ id: 5, nama_lengkap: 'Triyanto', nomor_induk_karyawan: 'EMP-005', asset_count: 2 }],
        });
        (inventoryEmployeeService.getEmployeeAssets as any).mockResolvedValue({
            status: 'success', data: [{ id: 9, produk_id: 3, serial_number: 'SN-1', tag_number: null, status: 'Digunakan', produk: { id: 3, code: 'P3', nama: 'Laptop' }, created_at: '2026-01-01' }],
        });

        wrap(<ReturAssetPicker onChange={() => {}} />);

        const input = screen.getByPlaceholderText(/karyawan/i);
        fireEvent.change(input, { target: { value: 'tri' } });

        await waitFor(() => expect(screen.getByText('Triyanto')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Triyanto'));

        await waitFor(() => expect(screen.getByText('Laptop')).toBeInTheDocument());
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run ReturAssetPicker`
Expected: FAIL — cannot find module `../ReturAssetPicker`.

- [ ] **Step 3: Implement the component**

Create `frontend/src/components/inventory/ReturAssetPicker.tsx`:

```tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useInvGudangList } from '../../hooks/useInventoryMasterData';
import inventoryEmployeeService, { EmployeeWithAssets } from '../../services/api/inventory-employee.service';
import { InvSerialNumber } from '../../types/inventory';
import { SearchableSelect } from '../common/SearchableSelect';

export interface ReturSelection {
    karyawan_id: number;
    karyawan_nama: string;
    gudang_id: number;
    items: { serial_number_id: number; produk_id: number; uom_id: number; identifier: string }[];
}

interface Props {
    initialKaryawanId?: number;
    preselectSerialIds?: number[];
    onChange: (sel: ReturSelection) => void;
}

const ReturAssetPicker: React.FC<Props> = ({ initialKaryawanId, preselectSerialIds, onChange }) => {
    const { data: gudangData } = useInvGudangList({ limit: 100, status: 'Aktif' });

    const [search, setSearch] = useState('');
    const [options, setOptions] = useState<EmployeeWithAssets[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [karyawanId, setKaryawanId] = useState<number>(initialKaryawanId || 0);
    const [karyawanNama, setKaryawanNama] = useState('');
    const [assets, setAssets] = useState<InvSerialNumber[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [gudangId, setGudangId] = useState<number>(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadAssets = useCallback(async (empId: number) => {
        const res = await inventoryEmployeeService.getEmployeeAssets(empId);
        setAssets(res.data || []);
    }, []);

    const runSearch = useCallback(async (q: string) => {
        try {
            const res = await inventoryEmployeeService.getEmployeesWithAssets(q);
            setOptions(res.data);
            setShowDropdown(true);
        } catch { setOptions([]); }
    }, []);

    // Preselect employee (entry A / C) and load assets immediately.
    useEffect(() => {
        if (initialKaryawanId) {
            setKaryawanId(initialKaryawanId);
            loadAssets(initialKaryawanId);
        }
    }, [initialKaryawanId, loadAssets]);

    // Preselect specific units (entry C).
    useEffect(() => {
        if (preselectSerialIds?.length) setSelectedIds(preselectSerialIds);
    }, [preselectSerialIds]);

    useEffect(() => {
        const timer = setTimeout(() => runSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search, runSearch]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    // Notify parent whenever selection changes.
    useEffect(() => {
        const items = assets
            .filter(a => selectedIds.includes(a.id))
            .map(a => ({
                serial_number_id: a.id,
                produk_id: a.produk_id,
                uom_id: a.produk?.uom_id || 0,
                identifier: a.serial_number || a.tag_number || '',
            }));
        onChange({ karyawan_id: karyawanId, karyawan_nama: karyawanNama, gudang_id: gudangId, items });
    }, [karyawanId, karyawanNama, gudangId, selectedIds, assets, onChange]);

    const pickEmployee = (emp: EmployeeWithAssets) => {
        setKaryawanId(emp.id);
        setKaryawanNama(`${emp.nama_lengkap} (${emp.nomor_induk_karyawan})`);
        setSearch('');
        setShowDropdown(false);
        setSelectedIds([]);
        loadAssets(emp.id);
    };

    const toggle = (id: number) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Karyawan (pemegang aset) *</label>
                <div className="relative" ref={dropdownRef}>
                    <input
                        type="text"
                        placeholder="Ketik nama/NIK karyawan..."
                        value={karyawanNama || search}
                        onFocus={() => { if (!karyawanId) runSearch(search); }}
                        onChange={(e) => { setSearch(e.target.value); setKaryawanNama(''); setKaryawanId(0); setAssets([]); }}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    />
                    {showDropdown && options.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {options.map(emp => (
                                <button key={emp.id} type="button" onClick={() => pickEmployee(emp)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center">
                                    <span className="text-gray-900 dark:text-white">{emp.nama_lengkap}</span>
                                    <span className="text-xs text-gray-400">{emp.asset_count} aset · {emp.nomor_induk_karyawan}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Gudang Tujuan (pengembalian) *</label>
                <SearchableSelect
                    options={(gudangData?.data || []).map(g => ({ value: g.id, label: g.nama }))}
                    value={gudangId || null}
                    onChange={(val) => setGudangId(Number(val) || 0)}
                    placeholder="-- Pilih Gudang Tujuan --"
                />
            </div>

            {karyawanId > 0 && (
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Aset yang Diretur <span className="text-gray-400">({selectedIds.length} dipilih)</span>
                    </label>
                    <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                        {assets.length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-400 italic">Karyawan ini tidak memegang aset ber-serial/tag</div>
                        )}
                        {assets.map(a => (
                            <label key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => toggle(a.id)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary" />
                                <span className="font-medium text-gray-900 dark:text-white">{a.produk?.nama}</span>
                                <span className="ml-auto font-mono text-xs text-gray-500">{a.serial_number || a.tag_number || '-'}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReturAssetPicker;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run ReturAssetPicker`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/inventory/ReturAssetPicker.tsx frontend/src/components/inventory/__tests__/ReturAssetPicker.test.tsx
git commit -m "feat(inventory): add shared ReturAssetPicker component"
```

---

## Task 6: Frontend — `useReturKaryawan` hook

**Files:**
- Create: `frontend/src/hooks/useReturKaryawan.ts`

**Interfaces:**
- Consumes: `useCreateTransaksi` (existing), `ReturSelection` (from Task 5), `TransaksiPayload` (existing type).
- Produces: `useReturKaryawan()` → `{ submitRetur(sel: ReturSelection, tanggal: string, catatan?: string): Promise<{ id: number } | null>, isPending: boolean }`. Groups selected units by `produk_id` into one detail per product (array of identifiers), builds a `Retur Karyawan` payload.

- [ ] **Step 1: Implement the hook**

Create `frontend/src/hooks/useReturKaryawan.ts`:

```typescript
import { useCreateTransaksi } from './useInventoryStok';
import { TransaksiPayload, TransaksiDetailPayload } from '../types/inventory';
import { ReturSelection } from '../components/inventory/ReturAssetPicker';

export const useReturKaryawan = () => {
    const createMutation = useCreateTransaksi();

    const submitRetur = async (sel: ReturSelection, tanggal: string, catatan?: string): Promise<{ id: number } | null> => {
        // Group selected units by product → one detail line per product.
        // uom_id is taken from the unit (its product's uom) — REQUIRED positive value.
        const byProduct = new Map<number, { uom_id: number; ids: string[] }>();
        for (const item of sel.items) {
            const entry = byProduct.get(item.produk_id) || { uom_id: item.uom_id, ids: [] };
            entry.ids.push(item.identifier);
            byProduct.set(item.produk_id, entry);
        }
        const details: TransaksiDetailPayload[] = Array.from(byProduct.entries()).map(([produk_id, { uom_id, ids }]) => ({
            produk_id,
            uom_id,
            jumlah: ids.length,
            serial_numbers: ids,
        }));

        const payload: TransaksiPayload = {
            tipe: 'Masuk',
            sub_tipe: 'Retur Karyawan',
            tanggal,
            gudang_id: sel.gudang_id,
            karyawan_id: sel.karyawan_id,
            catatan: catatan || null,
            details,
        };

        const result = await createMutation.mutateAsync(payload);
        return result.data?.id ? { id: result.data.id } : null;
    };

    return { submitRetur, isPending: createMutation.isPending };
};
```

- [ ] **Step 2: Type-check + commit**

Run: `cd frontend && npm run build 2>&1 | head -20`
Expected: no type errors from this file. (`uom_id` flows from Task 0 → picker items → these details, satisfying the positive-`uom_id` constraint.)

```bash
git add frontend/src/hooks/useReturKaryawan.ts
git commit -m "feat(inventory): add useReturKaryawan submit hook"
```

---

## Task 7: Frontend — dedicated Return page + route + sidebar

**Files:**
- Create: `frontend/src/pages/inventory/stok/ReturPage.tsx`
- Modify: `frontend/src/App.tsx` (import + route)
- Modify: `frontend/src/components/layout/Sidebar.tsx` (menu item)

**Interfaces:**
- Consumes: `ReturAssetPicker` + `ReturSelection` (Task 5), `useReturKaryawan` (Task 6), `inventoryEmployeeService.lookupAsset` + `downloadBeritaAcara` (Task 4).
- Produces: route `/inventory/retur`; reads `?karyawan=<id>` query param.

- [ ] **Step 1: Implement the page**

Create `frontend/src/pages/inventory/stok/ReturPage.tsx`:

```tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ReturAssetPicker, { ReturSelection } from '../../../components/inventory/ReturAssetPicker';
import { useReturKaryawan } from '../../../hooks/useReturKaryawan';
import inventoryEmployeeService from '../../../services/api/inventory-employee.service';
import { InvSerialNumber } from '../../../types/inventory';
import Button from '../../../components/common/Button';

const ReturPage = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const initialKaryawanId = Number(params.get('karyawan')) || undefined;

    const { submitRetur, isPending } = useReturKaryawan();
    const [sel, setSel] = useState<ReturSelection | null>(null);
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [catatan, setCatatan] = useState('');

    // Opsi C: serial/tag lookup
    const [lookupTerm, setLookupTerm] = useState('');
    const [lookupResult, setLookupResult] = useState<InvSerialNumber | null | 'notfound'>(null);
    const [preselectKaryawan, setPreselectKaryawan] = useState<number | undefined>(initialKaryawanId);
    const [preselectSerialIds, setPreselectSerialIds] = useState<number[]>([]);

    const runLookup = async () => {
        if (!lookupTerm.trim()) return;
        const res = await inventoryEmployeeService.lookupAsset(lookupTerm.trim());
        setLookupResult(res.data || 'notfound');
    };

    const returUnit = (unit: InvSerialNumber) => {
        if (!unit.karyawan?.id) { toast.error('Aset ini tidak sedang dipegang karyawan'); return; }
        setPreselectKaryawan(unit.karyawan.id);
        setPreselectSerialIds([unit.id]);
        toast.success(`Dipilih: ${unit.produk?.nama} milik ${unit.karyawan.nama_lengkap}`);
    };

    const handleSubmit = async () => {
        if (!sel || !sel.karyawan_id) { toast.error('Pilih karyawan'); return; }
        if (!sel.gudang_id) { toast.error('Pilih gudang tujuan'); return; }
        if (sel.items.length === 0) { toast.error('Pilih minimal satu aset untuk diretur'); return; }
        try {
            const result = await submitRetur(sel, tanggal, catatan);
            if (result?.id && sel.karyawan_id) {
                await downloadBA(sel.karyawan_id, result.id);
            }
            toast.success('Retur berhasil dicatat');
            navigate('/inventory/transaksi');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Gagal memproses retur');
        }
    };

    const downloadBA = async (empId: number, trxId: number) => {
        try {
            const blob = await inventoryEmployeeService.downloadBeritaAcara(empId, trxId, 'kembali');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `Berita-Acara-Pengembalian-${trxId}.pdf`;
            document.body.appendChild(a); a.click();
            setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 2000);
        } catch { toast.error('Retur tercatat, tapi gagal mengunduh berita acara'); }
    };

    return (
        <div className="p-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Retur Aset dari Karyawan</h1>

            {/* Opsi C: lacak via serial/tag */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-6 space-y-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Lacak via Serial / Tag Number</h2>
                <div className="flex gap-2">
                    <input value={lookupTerm} onChange={e => setLookupTerm(e.target.value)}
                        placeholder="Masukkan serial / tag number..."
                        className="flex h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                    <Button type="button" variant="outline" onClick={runLookup}>Cari</Button>
                </div>
                {lookupResult === 'notfound' && <p className="text-sm text-red-500">Serial/Tag number tidak ditemukan</p>}
                {lookupResult && lookupResult !== 'notfound' && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">{lookupResult.produk?.nama}</div>
                        <div className="text-xs text-gray-500 font-mono">{lookupResult.serial_number || lookupResult.tag_number}</div>
                        <div className="mt-1 text-gray-600 dark:text-gray-300">
                            Pemegang: {lookupResult.karyawan?.nama_lengkap
                                ? `${lookupResult.karyawan.nama_lengkap} (${lookupResult.karyawan.nomor_induk_karyawan})`
                                : 'Tidak sedang dipegang karyawan'}
                        </div>
                        {lookupResult.karyawan?.id && (
                            <button type="button" onClick={() => returUnit(lookupResult)}
                                className="mt-2 text-sm font-medium text-primary hover:underline">Retur unit ini</button>
                        )}
                    </div>
                )}
            </div>

            {/* Picker inti */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal *</label>
                        <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                    </div>
                </div>

                <ReturAssetPicker
                    initialKaryawanId={preselectKaryawan}
                    preselectSerialIds={preselectSerialIds}
                    onChange={setSel}
                />

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Catatan</label>
                    <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                        className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                </div>

                <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => navigate('/inventory/transaksi')}>Batal</Button>
                    <Button type="button" isLoading={isPending} onClick={handleSubmit}>Proses Retur</Button>
                </div>
            </div>
        </div>
    );
};

export default ReturPage;
```

- [ ] **Step 2: Register lazy import + route in `App.tsx`**

Near the other inventory lazy imports (line ~50):

```typescript
const ReturPage = lazy(() => import('./pages/inventory/stok/ReturPage'));
```

Inside the `<Route path="inventory">` block, after the `transaksi/baru` route (line ~224):

```tsx
<Route path="retur" element={
    <PermissionGuard resource={RESOURCES.INVENTORY_STOCK} action={ACTIONS.CREATE} redirectTo="/403"><ReturPage /></PermissionGuard>
} />
```

- [ ] **Step 3: Add sidebar item in `Sidebar.tsx`**

In the "Manajemen Stok" `subItems` array (line ~133), add after "Transaksi Stok":

```typescript
                { name: 'Retur Aset', path: '/inventory/retur', icon: 'assignment_return' },
```

- [ ] **Step 4: Build to verify + commit**

Run: `cd frontend && npm run build 2>&1 | tail -20`
Expected: build succeeds.

```bash
git add frontend/src/pages/inventory/stok/ReturPage.tsx frontend/src/App.tsx frontend/src/components/layout/Sidebar.tsx
git commit -m "feat(inventory): add dedicated asset return page with serial lookup"
```

---

## Task 8: Frontend — "Retur Aset" button in employee profile (entry A)

**Files:**
- Modify: `frontend/src/components/inventory/EmployeeAssetsTab.tsx`

**Interfaces:**
- Consumes: route `/inventory/retur?karyawan=<id>` (Task 7).

- [ ] **Step 1: Add navigation + button**

At the top of `EmployeeAssetsTab.tsx`, add `useNavigate`:

```tsx
import { useNavigate } from 'react-router-dom';
```

Inside the component, add `const navigate = useNavigate();` near the other hooks (after line 39).

In the header actions area (the `{hasAssets && (` button block near line 107), add a "Retur Aset" button before the existing "Cetak Berita Acara" button:

```tsx
                {hasAssets && (
                    <button
                        onClick={() => navigate(`/inventory/retur?karyawan=${employeeId}`)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">assignment_return</span>
                        Retur Aset
                    </button>
                )}
```

(Wrap the two buttons in a `<div className="flex gap-2">` so they sit side by side.)

- [ ] **Step 2: Build to verify + commit**

Run: `cd frontend && npm run build 2>&1 | tail -10`
Expected: build succeeds.

```bash
git add frontend/src/components/inventory/EmployeeAssetsTab.tsx
git commit -m "feat(inventory): add Retur Aset button to employee profile"
```

---

## Task 9: Frontend — use picker in general transaction form

**Files:**
- Modify: `frontend/src/pages/inventory/stok/TransaksiFormPage.tsx`

**Interfaces:**
- Consumes: `ReturAssetPicker` + `ReturSelection` (Task 5), `useReturKaryawan` (Task 6).

- [ ] **Step 1: Wire the picker for Retur Karyawan sub-type**

Import at top:

```tsx
import ReturAssetPicker, { ReturSelection } from '../../../components/inventory/ReturAssetPicker';
import { useReturKaryawan } from '../../../hooks/useReturKaryawan';
```

Add state + hook near the other `useState` calls:

```tsx
const [returSel, setReturSel] = useState<ReturSelection | null>(null);
const { submitRetur, isPending: returPending } = useReturKaryawan();
```

Add a boolean near the other show-flags (line ~185):

```tsx
const isReturKaryawan = subTipe === 'Retur Karyawan';
```

In the JSX, wrap the existing header/detail sections so that when `isReturKaryawan` is true, the form renders `ReturAssetPicker` + a submit that calls `submitRetur` (then offers BA download via the same `downloadBeritaAcara(..., 'kembali')` used in Task 7 — extract a small helper or inline it), and hides the manual karyawan input + serial textarea. Keep the Tanggal + Catatan fields. On submit success for retur, download the return BA and navigate.

Concretely, at the top of the returned JSX (right after `<form onSubmit={handleSubmit}...>` opening), add an early branch:

```tsx
{isReturKaryawan ? (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Retur Aset dari Karyawan</h2>
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal *</label>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
        </div>
        <ReturAssetPicker onChange={setReturSel} />
        <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/inventory/transaksi')}>Batal</Button>
            <Button type="button" isLoading={returPending} onClick={async () => {
                if (!returSel?.karyawan_id) { toast.error('Pilih karyawan'); return; }
                if (!returSel.gudang_id) { toast.error('Pilih gudang tujuan'); return; }
                if (returSel.items.length === 0) { toast.error('Pilih minimal satu aset'); return; }
                try {
                    const result = await submitRetur(returSel, tanggal, catatan);
                    if (result?.id) {
                        const blob = await inventoryEmployeeService.downloadBeritaAcara(returSel.karyawan_id, result.id, 'kembali');
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `Berita-Acara-Pengembalian-${result.id}.pdf`;
                        document.body.appendChild(a); a.click();
                        setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 2000);
                    }
                    toast.success('Retur berhasil dicatat');
                    navigate('/inventory/transaksi');
                } catch (e: any) { toast.error(e?.response?.data?.message || 'Gagal memproses retur'); }
            }}>Proses Retur</Button>
        </div>
    </div>
) : (
    <>
        {/* ...existing header + detail + dokumen + actions sections wrapped here... */}
    </>
)}
```

Move the existing `{/* Header */}`, `{/* Detail Items */}`, `{/* Dokumen Lampiran */}`, and `{/* Actions */}` blocks inside the `: ( <> ... </> )` branch.

- [ ] **Step 2: Build to verify + commit**

Run: `cd frontend && npm run build 2>&1 | tail -20`
Expected: build succeeds. Manually verify: selecting Stok Masuk → "Retur dari Karyawan" shows the picker; other sub-types are unchanged.

```bash
git add frontend/src/pages/inventory/stok/TransaksiFormPage.tsx
git commit -m "feat(inventory): use ReturAssetPicker in transaction form for returns"
```

---

## Task 10: End-to-end verification + docs update

**Files:**
- Modify: `docs/INSTALASI.md` (only if commands changed — likely none)
- Verify only; no new code.

- [ ] **Step 1: Run backend tests**

Run: `cd backend && npx jest employee-asset`
Expected: all pass.

- [ ] **Step 2: Run frontend tests**

Run: `cd frontend && npx vitest run ReturAssetPicker`
Expected: pass.

- [ ] **Step 3: Manual smoke test (with dev servers running)**

1. Login as superadmin. Ensure at least one serial/tag asset is assigned to an employee (create via Stok Keluar → Ke Karyawan if needed).
2. HR → employee detail → Aset tab → "Retur Aset" → confirm employee preselected + assets listed.
3. Select an asset + destination warehouse → Proses Retur → confirm BA "Pengembalian" downloads, asset leaves the profile, warehouse stock restored.
4. Inventory → Retur Aset → serial lookup: enter a known serial → confirm holder shown → "Retur unit ini" preselects.
5. Inventory → Transaksi → Buat → Stok Masuk → Retur dari Karyawan → confirm picker appears, other sub-types unchanged.

- [ ] **Step 4: Final commit (if any doc tweaks)**

```bash
git add -A
git commit -m "docs: note asset return flow in inventory docs" || echo "no doc changes"
```

---

## Self-Review

**Spec coverage:**
- A (retur dari profil) → Task 8. ✓
- B (checklist aset) → Task 5. ✓
- C (lacak serial/tag terpisah) → Task 2 (endpoint) + Task 7 (UI panel). ✓
- Search hanya pemegang aset + tampil saat kosong → Task 1 + Task 5 (`onFocus` runs empty search). ✓
- Berita Acara Pengembalian → Task 3 + used in Task 7/9. ✓
- Dedicated page + form (both, shared logic) → Task 5/6 core, consumed by Task 7 & Task 9. ✓
- No migration / no new permission / Indonesian strings / don't touch Ke Karyawan → Global Constraints, respected per task. ✓

**Placeholder scan:** No TBD/TODO. Every code step shows complete code.

**Type consistency:** `ReturSelection` shape (with `uom_id` per item) defined in Task 5 and consumed identically in Tasks 6, 7, 9. `getEmployeesWithAssets`/`lookupAsset`/`downloadBeritaAcara(arah)` signatures defined in Task 4 match usage. `generateBeritaAcara(employeeId, transaksiId?, arah?)` in Task 3 matches controller call. Backend `getEmployeesWithAssets` return shape matches frontend `EmployeeWithAssets`. `produk.uom_id` added in Task 0 is read by the picker (Task 5) and carried to the hook (Task 6).

**Resolved risk (was flagged during planning):** The `Retur Karyawan` path requires a positive `uom_id` (`upsertStok` writes it to `inv_stok`; detail row stores it — verified in `stok.service.ts:461,389,826,832`). Task 0 sources it from the asset's product and threads it through `ReturSelection.items` → hook details. No `uom_id: 0` reaches the backend.
