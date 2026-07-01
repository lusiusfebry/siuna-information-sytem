import { Employee, PosisiJabatan, Department, StatusKaryawan } from '../models';
import { ValidationResult } from '../../../shared/utils/validators';
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';

export const validateManagerPosition = async (managerId: number): Promise<ValidationResult> => {
    const manager = await Employee.findByPk(managerId, {
        include: [{ model: PosisiJabatan, as: 'posisi_jabatan' }]
    });

    if (!manager) {
        return { valid: false, message: ERROR_MESSAGES.EMPLOYEE_NOT_FOUND };
    }

    const positionName = manager.posisi_jabatan?.nama.toLowerCase() || '';
    const validKeywords = ['head', 'kepala', 'manager', 'direktur', 'chief'];
    const isValid = validKeywords.some(keyword => positionName.includes(keyword));

    return {
        valid: isValid,
        message: isValid ? undefined : ERROR_MESSAGES.MANAGER_INVALID_POSITION
    };
};

export const validateAtasanLangsungActive = async (atasanId: number): Promise<ValidationResult> => {
    const atasan = await Employee.findByPk(atasanId, {
        include: [{ model: StatusKaryawan, as: 'status_karyawan' }]
    });

    if (!atasan) {
        return { valid: false, message: ERROR_MESSAGES.EMPLOYEE_NOT_FOUND };
    }

    // Assuming 'Aktif' id or name. Better to check status name if IDs vary.
    // Or just check if status_karyawan name is 'Aktif'
    const statusName = atasan.status_karyawan?.nama || '';
    const isValid = statusName.toLowerCase() === 'aktif';

    return {
        valid: isValid,
        message: isValid ? undefined : ERROR_MESSAGES.ATASAN_NOT_ACTIVE
    };
};

export const validateDepartmentBelongsToDivisi = async (departmentId: number | string, divisiId: number | string): Promise<ValidationResult> => {
    const department = await Department.findByPk(departmentId);
    if (!department) {
        return { valid: false, message: 'Department not found' };
    }

    // Use Number() to handle string inputs from FormData
    const isValid = Number(department.divisi_id) === Number(divisiId);
    return {
        valid: isValid,
        message: isValid ? undefined : ERROR_MESSAGES.DEPARTMENT_NOT_IN_DIVISI
    };
};

export const validatePosisiJabatanBelongsToDepartment = async (posisiId: number | string, departmentId: number | string): Promise<ValidationResult> => {
    const posisi = await PosisiJabatan.findByPk(posisiId);
    if (!posisi) {
        return { valid: false, message: 'Position not found' };
    }

    // Use Number() to handle string inputs from FormData
    const isValid = Number(posisi.department_id) === Number(departmentId);
    return {
        valid: isValid,
        message: isValid ? undefined : ERROR_MESSAGES.POSISI_NOT_IN_DEPARTMENT
    };
};

export const validateContractDates = async (tanggalMulai?: string, tanggalAkhir?: string): Promise<ValidationResult> => {
    if (!tanggalMulai || !tanggalAkhir) return { valid: true };

    const start = new Date(tanggalMulai);
    const end = new Date(tanggalAkhir);

    const isValid = end > start;
    return {
        valid: isValid,
        message: isValid ? undefined : ERROR_MESSAGES.CONTRACT_DATE_INVALID
    };
};
