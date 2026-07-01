import { useState, useEffect, useCallback } from 'react';
import { auditService } from '../services/api/audit.service';
import { AuditLog, AuditLogFilters, AuditStats } from '../types/hr';
import toast from 'react-hot-toast';

export const useAuditLogs = (initialFilters: AuditLogFilters = {}, initialPage = 1, initialLimit = 10) => {
    const [data, setData] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<AuditLogFilters>(initialFilters);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await auditService.getAuditLogs(filters, currentPage, initialLimit);
            // Assuming response structure from axois interceptor returns data directly or wrapped
            // Adjust based on client.ts. Usually response.data is the payload.
            // If client.ts returns response.data directly:
            const payload = response.data;
            // Check if payload has data property (standard API response)
            if (payload && Array.isArray(payload.data)) {
                setData(payload.data);
                setTotal(payload.total);
                setTotalPages(payload.totalPages);
            } else {
                // Fallback
                setData([]);
            }
            setError(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch audit logs';
            setError(message);
            toast.error('Gagal memuat riwayat aktivitas');
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage, initialLimit]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Cleanup interval on unmount
    useEffect(() => {
        const intervalId = setInterval(() => {
            // Optional: Silent refresh or just notify?
            // User requested "auto-refresh setiap 30 detik"
            // We can call fetchLogs() but suppress loading state if desired, or just let it show loading.
            // For now, let's keep it simple and just re-fetch.
            fetchLogs();
        }, 30000);

        return () => clearInterval(intervalId);
    }, [fetchLogs]);

    return {
        data,
        total,
        totalPages,
        currentPage,
        setCurrentPage,
        loading,
        error,
        refetch: fetchLogs,
        setFilters
    };
};

export const useAuditStats = () => {
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const response = await auditService.getAuditStats();
            // Adjust payload extraction same as above
            const payload = response.data;
            if (payload && payload.data) {
                setStats(payload.data);
            }
        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, refetch: fetchStats };
};

export const useEntityHistory = (entityType: string, entityId: number) => {
    const [history, setHistory] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!entityId) return;
        setLoading(true);
        try {
            const response = await auditService.getEntityHistory(entityType, entityId);
            const payload = response.data;
            if (payload && Array.isArray(payload.data)) {
                setHistory(payload.data);
            }
        } catch (err) {
            console.error('Failed to fetch entity history', err);
        } finally {
            setLoading(false);
        }
    }, [entityType, entityId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return { history, loading, refetch: fetchHistory };
};
