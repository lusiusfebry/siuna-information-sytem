import api from './client';
import { AuditLog, AuditLogFilters, AuditStats, AuditUser } from '../../types/hr';

// Define response types
interface AuditLogListResponse {
    data: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
}

interface AuditLogDetailResponse {
    data: AuditLog;
}

interface AuditStatsResponse {
    data: AuditStats;
}

interface AuditUsersResponse {
    data: AuditUser[];
}

interface EntityHistoryResponse {
    data: AuditLog[];
}

export const auditService = {
    getAuditLogs: (filters: AuditLogFilters, page = 1, limit = 10) => {
        const params = {
            ...filters,
            page,
            limit
        };
        return api.get<AuditLogListResponse>('/hr/audit-logs', { params });
    },

    getAuditUsers: () => {
        return api.get<AuditUsersResponse>('/hr/audit-logs/users');
    },

    getAuditLogDetail: (id: number) => {
        return api.get<AuditLogDetailResponse>(`/hr/audit-logs/${id}`);
    },

    getEntityHistory: (entityType: string, entityId: number) => {
        return api.get<EntityHistoryResponse>(`/hr/audit-logs/entity/${entityType}/${entityId}`);
    },

    getAuditStats: () => {
        return api.get<AuditStatsResponse>('/hr/audit-logs/stats');
    }
};
