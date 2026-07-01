/**
 * Shared validation utilities for request handling
 */

/**
 * Safely parses an ID parameter from string to number
 * @param value - The string value to parse
 * @param fieldName - Name of the field for error messages
 * @returns Parsed number
 * @throws Error if value is not a valid positive integer
 */
export function parseIdParam(value: string, fieldName: string = 'ID'): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
        const error = new Error(`${fieldName} tidak valid`) as any;
        error.statusCode = 400;
        throw error;
    }
    return parsed;
}

/**
 * Safely parses an optional integer parameter
 * @param value - The value to parse (can be undefined)
 * @returns Parsed number or undefined
 */
export function parseOptionalInt(value: string | undefined): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
}

/**
 * Sanitizes a string for use in LIKE queries
 * Escapes special characters: %, _, and \
 */
export function sanitizeLikePattern(value: string): string {
    return String(value).replace(/[%_\\]/g, '\\$&');
}
