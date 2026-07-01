import EmployeeService from '../employee.service';
import { Employee } from '../../models';
import { Op } from 'sequelize';

// Mock models and dependencies
jest.mock('../../models', () => ({
    Employee: {
        findByPk: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
        count: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    },
    // Mock other models as objects
    Divisi: {},
    Department: {},
    PosisiJabatan: {},
    StatusKaryawan: {},
    LokasiKerja: {},
    Tag: {},
    EmployeePersonalInfo: {},
    EmployeeHRInfo: {},
    EmployeeFamilyInfo: {},
    JenisHubunganKerja: {},
    KategoriPangkat: {},
    Golongan: {},
    SubGolongan: {}
}));

jest.mock('../validators/business-rules.validator', () => ({
    validateManagerPosition: jest.fn().mockResolvedValue({ valid: true }),
    validateAtasanLangsungActive: jest.fn().mockResolvedValue({ valid: true }),
    validateDepartmentBelongsToDivisi: jest.fn().mockResolvedValue({ valid: true }),
    validatePosisiJabatanBelongsToDepartment: jest.fn().mockResolvedValue({ valid: true }),
    validateContractDates: jest.fn().mockResolvedValue({ valid: true }),
}));

jest.mock('../../../config/database', () => ({
    transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
    }),
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
            const mockRows = [{ id: 1, nama_lengkap: 'John' }];
            (Employee.count as jest.Mock).mockResolvedValue(1);
            (Employee.findAll as jest.Mock).mockResolvedValue(mockRows);

            const result = await EmployeeService.getAllEmployees({ page: 1, limit: 10 });

            expect(result.data).toEqual(mockRows);
            expect(result.total).toBe(1);
            expect(Employee.findAll).toHaveBeenCalled();
        });

        it('should apply search filter', async () => {
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
