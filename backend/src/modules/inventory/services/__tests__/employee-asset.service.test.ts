import employeeAssetService from '../employee-asset.service';
import Employee from '../../../hr/models/Employee';

jest.mock('puppeteer', () => ({ __esModule: true, default: { launch: jest.fn() } }));
jest.mock('../../models/SerialNumber', () => ({ __esModule: true, default: { findAll: jest.fn(), findOne: jest.fn() } }));
jest.mock('../../models/Transaksi', () => ({ __esModule: true, default: { findAll: jest.fn(), findByPk: jest.fn() } }));
jest.mock('../../models/TransaksiDetail', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Produk', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Gudang', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Uom', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Brand', () => ({ __esModule: true, default: {} }));
jest.mock('../../../hr/models/Employee', () => ({ __esModule: true, default: { findAll: jest.fn() } }));
jest.mock('../../../hr/models/StatusKaryawan', () => ({ __esModule: true, default: {} }));

const Emp = Employee as any;

// The service builds a Sequelize `where`/`attributes` with raw `literal` SQL.
// Serialize the passed options so we can assert both the query shape (scoping,
// active-only include, q filter) and that the raw SQL names the REAL table
// (inv_serial_number, singular) — a plural typo would 500 at runtime but pass
// a naive mock test, so we guard it explicitly here.
const serializeCall = () => JSON.stringify(Emp.findAll.mock.calls[0][0], (_k, v) => {
    // sequelize literal instances expose their SQL on `.val`
    if (v && typeof v === 'object' && typeof v.val === 'string') return `LITERAL:${v.val}`;
    return v;
});

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

    it('scopes to asset holders, filters active employees, and queries the real table', async () => {
        Emp.findAll.mockResolvedValue([]);
        await employeeAssetService.getEmployeesWithAssets('tri');
        const call = serializeCall();
        // Scoped to asset holders + counts via the correct singular table name.
        expect(call).toContain('inv_serial_number');
        expect(call).not.toContain('inv_serial_numbers'); // guard against plural typo → runtime 500
        // Active-only filter via status_karyawan include, and q filter on both fields.
        expect(call).toContain('status_karyawan');
        expect(call).toContain('Aktif');
        expect(call).toContain('nama_lengkap');
        expect(call).toContain('nomor_induk_karyawan');
    });

    it('omits the q filter when no query is given', async () => {
        Emp.findAll.mockResolvedValue([]);
        await employeeAssetService.getEmployeesWithAssets();
        const where = Emp.findAll.mock.calls[0][0].where;
        // Still scoped to holders (id IN subquery), but no Op.or name/NIK filter.
        expect(where.id).toBeDefined();
        const orKeys = Object.getOwnPropertySymbols(where).map(s => s.toString());
        expect(orKeys).not.toContain('Symbol(or)');
    });
});

