import {
    validateManagerPosition,
    validateAtasanLangsungActive,
    validateDepartmentBelongsToDivisi,
    validatePosisiJabatanBelongsToDepartment,
    validateContractDates
} from '../business-rules.validator';
import { Employee, PosisiJabatan, Department } from '../../models';
import { ERROR_MESSAGES } from '../../../../shared/constants/error-messages';

// Mock dependencies
jest.mock('../../models', () => ({
    Employee: {
        findByPk: jest.fn()
    },
    Department: {
        findByPk: jest.fn()
    },
    PosisiJabatan: {
        findByPk: jest.fn()
    },
    Divisi: {}
}));

describe('Business Rules Validator', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('validateManagerPosition', () => {
        it('should return valid if manager has a valid position keyword', async () => {
            (Employee.findByPk as jest.Mock).mockResolvedValue({
                id: 1,
                posisi_jabatan: { nama: 'Head of IT' }
            });

            const result = await validateManagerPosition(1);
            expect(result.valid).toBe(true);
            expect(result.message).toBeUndefined();
        });

        it('should return valid for "Kepala Bagian"', async () => {
            (Employee.findByPk as jest.Mock).mockResolvedValue({
                id: 1,
                posisi_jabatan: { nama: 'Kepala Bagian Produksi' }
            });

            const result = await validateManagerPosition(1);
            expect(result.valid).toBe(true);
        });

        it('should return invalid if manager does not have a valid position keyword', async () => {
            (Employee.findByPk as jest.Mock).mockResolvedValue({
                id: 1,
                posisi_jabatan: { nama: 'Staff IT' }
            });

            const result = await validateManagerPosition(1);
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.MANAGER_INVALID_POSITION);
        });

        it('should return invalid if manager not found', async () => {
            (Employee.findByPk as jest.Mock).mockResolvedValue(null);

            const result = await validateManagerPosition(999);
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
        });
    });

    describe('validateAtasanLangsungActive', () => {
        it('should return valid if atasan is active', async () => {
            (Employee.findByPk as jest.Mock).mockResolvedValue({
                id: 2,
                status_karyawan: { nama: 'Aktif' }
            });

            const result = await validateAtasanLangsungActive(2);
            expect(result.valid).toBe(true);
        });

        it('should return invalid if atasan is not active', async () => {
            (Employee.findByPk as jest.Mock).mockResolvedValue({
                id: 2,
                status_karyawan: { nama: 'Resign' }
            });

            const result = await validateAtasanLangsungActive(2);
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.ATASAN_NOT_ACTIVE);
        });

        it('should return invalid if atasan not found', async () => {
            (Employee.findByPk as jest.Mock).mockResolvedValue(null);

            const result = await validateAtasanLangsungActive(999);
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
        });
    });

    describe('validateDepartmentBelongsToDivisi', () => {
        it('should return valid if department belongs to divisi', async () => {
            (Department.findByPk as jest.Mock).mockResolvedValue({
                id: 1,
                divisi_id: 10
            });

            const result = await validateDepartmentBelongsToDivisi(1, 10);
            expect(result.valid).toBe(true);
        });

        it('should return invalid if department does not belong to divisi', async () => {
            (Department.findByPk as jest.Mock).mockResolvedValue({
                id: 1,
                divisi_id: 20
            });

            const result = await validateDepartmentBelongsToDivisi(1, 10);
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.DEPARTMENT_NOT_IN_DIVISI);
        });

        it('should return invalid if department not found', async () => {
            (Department.findByPk as jest.Mock).mockResolvedValue(null);

            const result = await validateDepartmentBelongsToDivisi(1, 10);
            expect(result.valid).toBe(false);
            expect(result.message).toBe('Department not found');
        });
    });

    describe('validatePosisiJabatanBelongsToDepartment', () => {
        it('should return valid if posisi belongs to department', async () => {
            (PosisiJabatan.findByPk as jest.Mock).mockResolvedValue({
                id: 5,
                department_id: 1
            });

            const result = await validatePosisiJabatanBelongsToDepartment(5, 1);
            expect(result.valid).toBe(true);
        });

        it('should return invalid if posisi does not belong to department', async () => {
            (PosisiJabatan.findByPk as jest.Mock).mockResolvedValue({
                id: 5,
                department_id: 2
            });

            const result = await validatePosisiJabatanBelongsToDepartment(5, 1);
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.POSISI_NOT_IN_DEPARTMENT);
        });

        it('should return invalid if posisi not found', async () => {
            (PosisiJabatan.findByPk as jest.Mock).mockResolvedValue(null);

            const result = await validatePosisiJabatanBelongsToDepartment(5, 1);
            expect(result.valid).toBe(false);
            expect(result.message).toBe('Position not found');
        });
    });

    describe('validateContractDates', () => {
        it('should return valid if start date is before end date', async () => {
            const result = await validateContractDates('2024-01-01', '2024-12-31');
            expect(result.valid).toBe(true);
        });

        it('should return invalid if start date is after end date', async () => {
            const result = await validateContractDates('2024-12-31', '2024-01-01');
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.CONTRACT_DATE_INVALID);
        });

        it('should return valid if dates are missing (optional check)', async () => {
            // As per implementation, if dates are missing, it returns { valid: true }
            const result = await validateContractDates(undefined, undefined);
            expect(result.valid).toBe(true);
        });
    });
});
