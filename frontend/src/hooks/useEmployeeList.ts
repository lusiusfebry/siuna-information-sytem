import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/api/employee.service';
import type { EmployeeFilterParams } from '../types/hr';

const PAGE_LIMIT = 20;

export interface EmployeeListParams extends EmployeeFilterParams {
    search?: string;
    is_draft?: boolean;
    only_deleted?: boolean;
}

/**
 * Paginated employee list backed by React Query's useInfiniteQuery. Replaces the
 * old hand-rolled useState + manual fetch/append model so the list shares one
 * cache and is invalidated automatically by the delete/restore mutations below.
 */
export const useEmployeesInfinite = (params: EmployeeListParams) => {
    return useInfiniteQuery({
        // The full params object is part of the key so changing filters/search
        // starts a fresh cache entry.
        queryKey: ['employees', 'infinite', params],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const data = await employeeService.getAllEmployees({
                ...params,
                is_draft: params.is_draft ? true : undefined,
                only_deleted: params.only_deleted ? true : undefined,
                page: pageParam,
                limit: PAGE_LIMIT,
            });
            return data as { data: any[]; total: number; page: number; totalPages: number };
        },
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    });
};

export const useDeleteEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => employeeService.deleteEmployee(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};

export const useRestoreEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => employeeService.restoreEmployee(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};
