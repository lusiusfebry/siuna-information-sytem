import EmployeeService from '../employee.service';
import Employee from '../../models/Employee';
import { Op } from 'sequelize';

// The service imports each model from its own file (../models/Employee, etc.),
// not the barrel, so mock the concrete modules it loads. Empty models are given
// a default export object; Employee gets the query methods the tests assert on.
jest.mock('../../models/Employee', () => ({
    __esModule: true,
    default: {
        findByPk: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
        count: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    },
}));
jest.mock('../../models/EmployeePersonalInfo', () => ({ __esModule: true, default: { destroy: jest.fn(), restore: jest.fn() } }));
jest.mock('../../models/EmployeeHRInfo', () => ({ __esModule: true, default: { destroy: jest.fn(), restore: jest.fn() } }));
jest.mock('../../models/EmployeeFamilyInfo', () => ({ __esModule: true, default: { destroy: jest.fn(), restore: jest.fn() } }));
jest.mock('../../models/EmployeeDocument', () => ({ __esModule: true, default: { destroy: jest.fn(), restore: jest.fn() } }));
jest.mock('../../models/Divisi', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Department', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/PosisiJabatan', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/StatusKaryawan', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/LokasiKerja', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Tag', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/JenisHubunganKerja', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/KategoriPangkat', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Golongan', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/SubGolongan', () => ({ __esModule: true, default: {} }));
// deleteEmployee dynamically imports the facility Occupant model to guard against
// deleting an employee who still actively occupies a room. Mock it with a
// count() so the guard is exercised without a DB.
jest.mock('../../../facility/models/Occupant', () => ({ __esModule: true, default: { count: jest.fn().mockResolvedValue(0) } }));
// getAllEmployees dynamically imports the inventory SerialNumber model (INV-M02) to
// count held assets per employee. Mock it so the real model file — whose module body
// calls InvSerialNumber.init() against sequelize — is never loaded. Default: no held
// assets, so outstanding_assets_count resolves to 0.
jest.mock('../../../inventory/models/SerialNumber', () => ({ __esModule: true, default: { findAll: jest.fn().mockResolvedValue([]) } }));

jest.mock('../../validators/business-rules.validator', () => ({
    validateManagerPosition: jest.fn().mockResolvedValue({ valid: true }),
    validateAtasanLangsungActive: jest.fn().mockResolvedValue({ valid: true }),
    validateDepartmentBelongsToDivisi: jest.fn().mockResolvedValue({ valid: true }),
    validatePosisiJabatanBelongsToDepartment: jest.fn().mockResolvedValue({ valid: true }),
    validateContractDates: jest.fn().mockResolvedValue({ valid: true }),
}));

jest.mock('../../../../config/database', () => ({
    __esModule: true,
    default: {
        transaction: jest.fn().mockResolvedValue({
            commit: jest.fn(),
            rollback: jest.fn(),
        }),
        // getOutstandingAssetCounts builds a COUNT aggregate via sequelize.fn/col.
        fn: jest.fn((...args: any[]) => ({ fn: args })),
        col: jest.fn((c: string) => ({ col: c })),
    },
}));

describe('EmployeeService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createEmployee', () => {
        it('should create an employee', async () => {
            const mockData: any = { nama_lengkap: 'John Doe', nomor_induk_karyawan: '123' };
            (Employee.create as jest.Mock).mockResolvedValue(mockData);

            const result = await EmployeeService.createEmployee(mockData);
            expect(Employee.create).toHaveBeenCalledWith(mockData);
            expect(result).toEqual(mockData);
        });
    });

    describe('getAllEmployees', () => {
        it('should return paginated employees', async () => {
            // Rows are Sequelize instances: getAllEmployees calls r.toJSON() and
            // attaches outstanding_assets_count (INV-M02) to the plain object.
            const plain = { id: 1, nama_lengkap: 'John' };
            const mockRows = [{ id: 1, toJSON: () => ({ ...plain }) }];
            (Employee.count as jest.Mock).mockResolvedValue(1);
            (Employee.findAll as jest.Mock).mockResolvedValue(mockRows);

            const result = await EmployeeService.getAllEmployees({ page: 1, limit: 10 });

            expect(result.data).toEqual([{ ...plain, outstanding_assets_count: 0 }]);
            expect(result.total).toBe(1);
            expect(Employee.findAll).toHaveBeenCalled();
        });

        it('should apply search filter', async () => {
            (Employee.findAll as jest.Mock).mockResolvedValue([]);
            await EmployeeService.getAllEmployees({ search: 'John' });
            expect(Employee.count).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    [Op.or]: expect.any(Array)
                })
            }));
        });
    });

    describe('getEmployeeById', () => {
        it('should return employee details', async () => {
            const mockEmployee = { id: 1, nama_lengkap: 'John' };
            (Employee.findByPk as jest.Mock).mockResolvedValue(mockEmployee);

            const result = await EmployeeService.getEmployeeById(1);
            expect(Employee.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
            expect(result).toEqual(mockEmployee);
        });
    });

    describe('deleteEmployee', () => {
        it('should delete employee if found', async () => {
            const mockEmployee = { destroy: jest.fn() };
            (Employee.findByPk as jest.Mock).mockResolvedValue(mockEmployee);

            const result = await EmployeeService.deleteEmployee(1);
            expect(mockEmployee.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should throw error if employee not found', async () => {
            (Employee.findByPk as jest.Mock).mockResolvedValue(null);

            await expect(EmployeeService.deleteEmployee(1))
                .rejects.toThrow('Employee not found');
        });
    });

    describe('validateNIKUnique', () => {
        it('should return true if NIK does not exist', async () => {
            (Employee.findOne as jest.Mock).mockResolvedValue(null);
            const isUnique = await EmployeeService.validateNIKUnique('123');
            expect(isUnique).toBe(true);
        });

        it('should return false if NIK exists', async () => {
            (Employee.findOne as jest.Mock).mockResolvedValue({ id: 1 });
            const isUnique = await EmployeeService.validateNIKUnique('123');
            expect(isUnique).toBe(false);
        });
    });
});
