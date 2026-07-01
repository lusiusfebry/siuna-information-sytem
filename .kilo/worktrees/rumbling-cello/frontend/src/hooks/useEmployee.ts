import { useQuery } from '@tanstack/react-query';
// import service from '../services/api/master-data.service';
// Usually employee list is distinct. But verified API structure might be needed.
// Simplification: creating a dedicated fetcher if specific endpoint exists, or assume common pattern.
// Based on EmployeeCreatePage, it uses masterDataService.getAll('status-karyawan') etc.
// But employees are separate. Let's assume a generic getAll pattern works or use axios directly if needed.
// Actually, I'll use a new service method or just axios in hook for now if useApi is too generic.
// Let's stick to useApi pattern if possible, but for now standard useQuery.

import { useAuthStore } from '../stores/authStore';
import client from '../services/api/client';

export interface EmployeeOption {
    id: number;
    nama_lengkap: string;
}

export const useEmployeeList = () => {
    const { token } = useAuthStore();

    return useQuery({
        queryKey: ['employees', 'list'],
        queryFn: async () => {
            const response = await client.get('/hr/employees', {
                params: { limit: 1000, status: 'Aktif' }
            });
            return response.data;
        },
        enabled: !!token
    });
};

export const useEmployeesByDepartment = (departmentId?: number) => {
    const { token } = useAuthStore();

    return useQuery({
        queryKey: ['employees', 'by-department', departmentId],
        queryFn: async () => {
            const response = await client.get('/hr/employees', {
                params: { department_id: departmentId, limit: 1000, status: 'Aktif' }
            });
            return response.data;
        },
        enabled: !!token && !!departmentId,
    });
};
