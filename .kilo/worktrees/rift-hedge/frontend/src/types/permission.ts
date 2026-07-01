export interface Permission {
    id: number;
    resource: string;
    action: string;
    description?: string;
}

export interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    is_system_role: boolean;
    permissions?: Permission[];
}

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

export type ResourceType = typeof RESOURCES[keyof typeof RESOURCES];
export type ActionType = typeof ACTIONS[keyof typeof ACTIONS];
