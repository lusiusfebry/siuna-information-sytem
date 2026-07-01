export const RESOURCES = {
    EMPLOYEES: 'employees',
    MASTER_DATA: 'master_data',
    DOCUMENTS: 'documents',
    AUDIT_LOGS: 'audit_logs',
    DASHBOARD: 'dashboard',
    IMPORT: 'import',
    EXPORT: 'export',
    ROLES: 'roles',
    USERS: 'users',
    INVENTORY_MASTER_DATA: 'inventory_master_data',
    INVENTORY_STOCK: 'inventory_stock',
} as const;

export const ACTIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    IMPORT: 'import',
    EXPORT: 'export',
    VIEW_ALL: 'view_all',
    VIEW_DEPARTMENT: 'view_department'
} as const;
