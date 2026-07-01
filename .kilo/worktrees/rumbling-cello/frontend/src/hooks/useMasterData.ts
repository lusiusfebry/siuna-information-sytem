import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import masterDataService, { FilterParams } from '../services/api/master-data.service';
import { MasterData, Divisi, Department, PosisiJabatan, Tag, LokasiKerja } from '../types/hr';

export const useMasterDataList = <T = MasterData>(modelName: string, filters?: FilterParams) => {
    return useQuery({
        queryKey: ['masterData', modelName, filters],
        queryFn: () => masterDataService.getAll<T>(modelName, filters),
        placeholderData: keepPreviousData,
    });
};

export const useMasterDataById = <T = MasterData>(modelName: string, id: number) => {
    return useQuery({
        queryKey: ['masterData', modelName, id],
        queryFn: () => masterDataService.getOne<T>(modelName, id),
        enabled: !!id,
    });
};

export const useCreateMasterData = <T = MasterData>(modelName: string) => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: T }, AxiosError<{ message: string }>, Partial<T> | FormData>({
        mutationFn: (data: Partial<T> | FormData) => masterDataService.create<T>(modelName, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['masterData', modelName] });
        },
    });
};

export const useUpdateMasterData = <T = MasterData>(modelName: string) => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: T }, AxiosError<{ message: string }>, { id: number; data: Partial<T> | FormData }>({
        mutationFn: ({ id, data }: { id: number; data: Partial<T> | FormData }) => masterDataService.update<T>(modelName, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['masterData', modelName] });
        },
    });
};

export const useDeleteMasterData = (modelName: string) => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; message: string }, AxiosError<{ message: string }>, number>({
        mutationFn: (id: number) => masterDataService.delete(modelName, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['masterData', modelName] });
        },
    });
};

export const useRestoreMasterData = (modelName: string) => {
    const queryClient = useQueryClient();
    return useMutation<{ status: string; data: MasterData }, AxiosError<{ message: string }>, number>({
        mutationFn: (id: number) => masterDataService.restore(modelName, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['masterData', modelName] });
        },
    });
};

// Specific Hooks
export const useDivisiList = (filters?: FilterParams) => useMasterDataList<Divisi>('divisi', filters);
export const useDepartmentList = (filters?: FilterParams) => useMasterDataList<Department>('department', filters);
export const usePosisiJabatanList = (filters?: FilterParams) => useMasterDataList<PosisiJabatan>('posisi-jabatan', filters);
export const useKategoriPangkatList = (filters?: FilterParams) => useMasterDataList('kategori-pangkat', filters);
export const useGolonganList = (filters?: FilterParams) => useMasterDataList('golongan', filters);
export const useSubGolonganList = (filters?: FilterParams) => useMasterDataList('sub-golongan', filters);
export const useJenisHubunganKerjaList = (filters?: FilterParams) => useMasterDataList('jenis-hubungan-kerja', filters);
export const useTagList = (filters?: FilterParams) => useMasterDataList<Tag>('tag', filters);
export const useLokasiKerjaList = (filters?: FilterParams) => useMasterDataList<LokasiKerja>('lokasi-kerja', filters);
export const useStatusKaryawanList = (filters?: FilterParams) => useMasterDataList('status-karyawan', filters);

// Helper for employees (managers)
// Since there isn't a dedicated endpoint for list-only employees in masterDataService, we typically use the main employee service.
// But to keep consistency in hooks usage, we can wrap it here or use a simplified call.
// Let's assume we can fetch employees for dropdowns via a simplified endpoint or just the normal one.
import { employeeService } from '../services/api/employee.service';
import api from '../services/api/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useEmployeeList = (params?: any) => {
    return useQuery({
        queryKey: ['employees-list', params],
        queryFn: async () => {
            const result = await employeeService.getAllEmployees(params);
            return result;
        }
    });
};

export const useDeptByDivisi = (divisiId?: number | null) => {
    return useQuery({
        queryKey: ['departments', 'by-divisi', divisiId],
        queryFn: async () => {
            const response = await api.get(`/hr/departments/by-divisi/${divisiId}`);
            return response.data;
        },
        enabled: !!divisiId
    });
};

export const usePosisiByDept = (departmentId?: number | null) => {
    return useQuery({
        queryKey: ['posisi', 'by-department', departmentId],
        queryFn: async () => {
            const response = await api.get(`/hr/posisi-jabatan/by-department/${departmentId}`);
            return response.data;
        },
        enabled: !!departmentId
    });
};

export const useManagerList = () => {
    return useQuery({
        queryKey: ['employees', 'managers'],
        queryFn: async () => {
            const response = await api.get('/hr/validation/employees/managers');
            return response.data;
        }
    });
};

export const useActiveEmployees = () => {
    return useQuery({
        queryKey: ['employees', 'active'],
        queryFn: async () => {
            const response = await api.get('/hr/validation/employees/active');
            return response.data;
        }
    });
};
