import { ERROR_MESSAGES } from "../constants/error-messages";

export interface ValidationResult {
    valid: boolean;
    message?: string;
}

export const validateNIK = (nik: string): ValidationResult => {
    const isValid = /^\d{16}$/.test(nik);
    return {
        valid: isValid,
        message: isValid ? undefined : ERROR_MESSAGES.NIK_INVALID_FORMAT
    };
};

export const validateEmployeeNIK = (nik: string): ValidationResult => {
    const isValid = /^\d{2}-\d{5}$/.test(nik);
    return {
        valid: isValid,
        message: isValid ? undefined : ERROR_MESSAGES.EMPLOYEE_NIK_INVALID_FORMAT
    };
};

export const validateNPWP = (npwp: string): ValidationResult => {
    // Format: 12.345.678.9-012.345 or 15 digits numeric strict
    // We'll support both sanitized inputs or formatted inputs, but usually we sanitize before saving.
    // Let's assume input might be formatted or not.
    const cleanNpwp = npwp.replace(/[^0-9]/g, '');
    const isValid = cleanNpwp.length === 15;

    // Optional: regex check for specific format if strictly enforced: /^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/

    return {
        valid: isValid,
        message: isValid ? undefined : ERROR_MESSAGES.NPWP_INVALID_FORMAT
    };
};

export const validateBPJS = (bpjs: string): ValidationResult => {
    const isValid = /^\d{13}$/.test(bpjs);
    return {
        valid: isValid,
        message: isValid ? undefined : ERROR_MESSAGES.BPJS_INVALID_FORMAT
    };
};

export const validatePhoneNumber = (phone: string): ValidationResult => {
    // Indonesia format: starts with 08, 628, +628, or 02/03 for landlines
    // Simple regex: ^(\+62|62|0)[2-9][0-9]{7,12}$
    const isValid = /^(\+62|62|0)[2-9][0-9]{7,12}$/.test(phone);
    return {
        valid: isValid,
        message: isValid ? undefined : ERROR_MESSAGES.PHONE_INVALID_FORMAT
    };
};

export const validateAge = (birthDate: string, minAge: number): ValidationResult => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    const isValid = age >= minAge;
    return {
        valid: isValid,
        message: isValid ? undefined : ERROR_MESSAGES.AGE_BELOW_MINIMUM
    };
};

export const formatNPWP = (npwp: string): string => {
    const clean = npwp.replace(/\D/g, '');
    if (clean.length < 15) return clean;
    // 12.345.678.9-012.345
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8, 9)}-${clean.slice(9, 12)}.${clean.slice(12, 15)}`;
};

export const sanitizePhoneNumber = (phone: string): string => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('62')) {
        clean = '0' + clean.slice(2);
    }
    return clean;
};

export const formatEmployeeNIK = (value: string): string => {
    const clean = value.replace(/\D/g, '');
    let formatted = '';

    if (clean.length > 0) formatted += clean.substring(0, 2);
    if (clean.length > 2) formatted += '-' + clean.substring(2, 7);

    return formatted;
};
