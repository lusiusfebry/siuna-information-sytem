

export interface ValidationResult {
    valid: boolean;
    message?: string;
}

export const validateNIK = (nik: string): boolean => {
    return /^\d{16}$/.test(nik);
};

export const validateEmployeeNIK = (nik: string): boolean => {
    return /^\d{2}-\d{5}$/.test(nik);
};

export const validateNPWP = (npwp: string): boolean => {
    // Check length 15 digits (clean) or standard format
    const clean = npwp.replace(/\D/g, '');
    return clean.length === 15;
};

export const validateBPJS = (bpjs: string): boolean => {
    return /^\d{13}$/.test(bpjs);
};

export const validatePhoneNumber = (phone: string): boolean => {
    return /^(\+62|62|0)[2-9][0-9]{7,12}$/.test(phone);
};

export const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

export const formatNPWP = (value: string): string => {
    const clean = value.replace(/\D/g, '');
    let formatted = '';

    if (clean.length > 0) formatted += clean.substring(0, 2);
    if (clean.length > 2) formatted += '.' + clean.substring(2, 5);
    if (clean.length > 5) formatted += '.' + clean.substring(5, 8);
    if (clean.length > 8) formatted += '.' + clean.substring(8, 9);
    if (clean.length > 9) formatted += '-' + clean.substring(9, 12);
    if (clean.length > 12) formatted += '.' + clean.substring(12, 15);

    return formatted;
};

export const formatPhoneNumber = (value: string): string => {
    // Remove non-numeric chars except +
    return value.replace(/[^0-9+]/g, '');
};

export const formatEmployeeNIK = (value: string): string => {
    const clean = value.replace(/\D/g, '');
    let formatted = '';

    if (clean.length > 0) formatted += clean.substring(0, 2);
    if (clean.length > 2) formatted += '-' + clean.substring(2, 7);

    return formatted;
};

/**
 * Convert string to Title Case while preserving all-caps words
 * Examples:
 * - "driver lube truck" -> "Driver Lube Truck"
 * - "PT INDONESIA" -> "PT Indonesia" (preserves PT as all-caps)
 * - "IT department" -> "IT Department" (preserves IT as all-caps)
 */
export const toTitleCase = (str: string): string => {
    return str
        .split(' ')
        .map((word) => {
            // If word is all uppercase (like PT, IT, HR), preserve it
            if (word === word.toUpperCase() && word.length > 0) {
                return word;
            }
            // Otherwise, capitalize first letter and lowercase the rest
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
};
