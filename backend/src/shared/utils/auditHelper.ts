import { Request } from 'express';

// Function to sanitize sensitive data
export const sanitizeValues = (data: any): any => {
    if (!data) return data;

    // Deep clone to avoid mutating original data
    const sanitized = JSON.parse(JSON.stringify(data));

    const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'credit_card', 'cvv'];

    const sanitizeRecursive = (obj: any) => {
        if (typeof obj !== 'object' || obj === null) return;

        for (const key in obj) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
                sanitizeRecursive(obj[key]);
            }
        }
    };

    sanitizeRecursive(sanitized);
    return sanitized;
};

// Function to extract display name from entity
export const getEntityName = (entityType: string, data: any): string => {
    if (!data) return '';

    if (entityType === 'employees') {
        return data.nama_lengkap || data.nama || `Employee #${data.id}`;
    }

    // For master data
    if (entityType === 'divisi') return data.nama_divisi || data.nama;
    if (entityType === 'department') return data.nama_department || data.nama;
    if (entityType === 'posisi_jabatan') return data.nama_posisi || data.nama;
    if (entityType === 'lokasi_kerja') return data.nama_lokasi || data.nama;

    // Inventory
    if (entityType.startsWith('inv_')) {
        return data.code ? `${data.nama || ''} (${data.code})`.trim() : (data.nama || `#${data.id}`);
    }

    // Default fallback
    return data.nama || data.name || data.title || `#${data.id}`;
};

// Function to diff values
export const diffValues = (oldValues: any, newValues: any): any => {
    if (!oldValues || !newValues) return newValues;

    const changes: any = {};
    const keys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    keys.forEach(key => {
        // Skip ignored fields
        if (['updatedAt', 'updated_at', 'createdAt', 'created_at'].includes(key)) return;

        // Simple comparison (can be improved for deep objects)
        if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
            changes[key] = newValues[key];
        }
    });

    return changes;
};

// Filter which requests should be audited
export const shouldAudit = (req: Request): boolean => {
    // Audit all non-GET methods
    if (req.method !== 'GET') return true;

    // Audit specific GET methods if needed (e.g. download sensitive files)
    // For now, only modifying actions
    return false;
};
