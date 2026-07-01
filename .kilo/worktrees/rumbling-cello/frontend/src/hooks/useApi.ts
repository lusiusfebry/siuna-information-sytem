import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api/client';
import { Employee } from '../types/hr';

// Basic wrapper for consistent data handling or typing could go here
// For now, let's implement the Employee hooks directly as requested by context

export const useEmployees = () => {
    return useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const { data } = await api.get<{ data: Employee[] }>('/hr/employees');
            return data.data;
        },
    });
};

export const useEmployee = (id: number) => {
    return useQuery({
        queryKey: ['employees', id],
        queryFn: async () => {
            const { data } = await api.get<{ data: Employee }>(`/hr/employees/${id}`);
            return data.data;
        },
        enabled: !!id,
    });
};

export const useCreateEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newEmployee: Partial<Employee>) => api.post('/hr/employees', newEmployee),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};
