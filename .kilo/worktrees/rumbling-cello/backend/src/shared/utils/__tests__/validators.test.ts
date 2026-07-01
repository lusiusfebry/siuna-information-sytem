import {
    validateNIK,
    validateNPWP,
    validateBPJS,
    validatePhoneNumber,
    validateAge,
    formatNPWP,
    sanitizePhoneNumber
} from '../validators';
import { ERROR_MESSAGES } from '../../constants/error-messages';

describe('Shared Utils Validators', () => {
    describe('validateNIK', () => {
        it('should return valid for 16 digit number', () => {
            const result = validateNIK('1234567890123456');
            expect(result.valid).toBe(true);
        });

        it('should return invalid for non-numeric string', () => {
            const result = validateNIK('1234567890abcdef');
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.NIK_INVALID_FORMAT);
        });

        it('should return invalid for incorrect length', () => {
            const result = validateNIK('12345');
            expect(result.valid).toBe(false);
        });
    });

    describe('validateNPWP', () => {
        it('should return valid for 15 digit number (sanitized)', () => {
            const result = validateNPWP('123456789012345');
            expect(result.valid).toBe(true);
        });

        it('should return valid for formatted NPWP', () => {
            const result = validateNPWP('12.345.678.9-012.345');
            expect(result.valid).toBe(true);
        });

        it('should return invalid for incorrect length', () => {
            const result = validateNPWP('123'); // Too short
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.NPWP_INVALID_FORMAT);
        });
    });

    describe('validateBPJS', () => {
        it('should return valid for 13 digit number', () => {
            const result = validateBPJS('1234567890123');
            expect(result.valid).toBe(true);
        });

        it('should return invalid for non-numeric', () => {
            const result = validateBPJS('12345abcde123');
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.BPJS_INVALID_FORMAT);
        });

        it('should return invalid for incorrect length', () => {
            const result = validateBPJS('123');
            expect(result.valid).toBe(false);
        });
    });

    describe('validatePhoneNumber', () => {
        it('should return valid for "08" prefix', () => {
            const result = validatePhoneNumber('08123456789');
            expect(result.valid).toBe(true);
        });

        it('should return valid for "628" prefix', () => {
            const result = validatePhoneNumber('628123456789');
            expect(result.valid).toBe(true);
        });

        it('should return valid for "+628" prefix', () => {
            const result = validatePhoneNumber('+628123456789');
            expect(result.valid).toBe(true);
        });

        it('should return invalid for letters', () => {
            const result = validatePhoneNumber('08123abcde');
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.PHONE_INVALID_FORMAT);
        });

        it('should return invalid for too short', () => {
            const result = validatePhoneNumber('081');
            expect(result.valid).toBe(false);
        });
    });

    describe('validateAge', () => {
        it('should return valid if age is above minimum', () => {
            // Assume today is 2024 (test environment might vary but logic holds)
            // Someone born in 2000 is > 17
            const result = validateAge('2000-01-01', 17);
            expect(result.valid).toBe(true);
        });

        it('should return invalid if age is below minimum', () => {
            const today = new Date();
            const year = today.getFullYear();
            const birthDate = `${year - 10}-01-01`; // 10 years old
            const result = validateAge(birthDate, 17);
            expect(result.valid).toBe(false);
            expect(result.message).toBe(ERROR_MESSAGES.AGE_BELOW_MINIMUM);
        });
    });

    describe('formatNPWP', () => {
        it('should format clean 15 digits', () => {
            const formatted = formatNPWP('123456789012345');
            expect(formatted).toBe('12.345.678.9-012.345');
        });
    });

    describe('sanitizePhoneNumber', () => {
        it('should remove non-digits', () => {
            expect(sanitizePhoneNumber('0812-3456')).toBe('08123456');
        });

        it('should convert 62 prefix to 0', () => {
            expect(sanitizePhoneNumber('628123456')).toBe('08123456');
        });
    });
});
