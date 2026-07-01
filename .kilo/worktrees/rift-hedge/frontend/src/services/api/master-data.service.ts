import client from './client';
import { MasterData } from '../../types/hr';

export interface FilterParams {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedResponse<T> {
    status: string;
    data: T[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
    };
}

const getAll = async <T = MasterData>(model: string, params?: FilterParams): Promise<PaginatedResponse<T>> => {
    const response = await client.get<PaginatedResponse<T>>(`/hr/master/${model}`, { params });
    return response.data;
};

const getOne = async <T = MasterData>(model: string, id: number): Promise<{ status: string; data: T }> => {
    const response = await client.get<{ status: string; data: T }>(`/hr/master/${model}/${id}`);
    return response.data;
};

const create = async <T = MasterData>(model: string, data: Partial<T> | FormData): Promise<{ status: string; data: T }> => {
    const response = await client.post<{ status: string; data: T }>(`/hr/master/${model}`, data);
    return response.data;
};

const update = async <T = MasterData>(model: string, id: number, data: Partial<T> | FormData): Promise<{ status: string; data: T }> => {
    const response = await client.put<{ status: string; data: T }>(`/hr/master/${model}/${id}`, data);
    return response.data;
};

const deleteItem = async (model: string, id: number): Promise<{ status: string; message: string }> => {
    const response = await client.delete<{ status: string; message: string }>(`/hr/master/${model}/${id}`);
    return response.data;
};

const restore = async <T = MasterData>(model: string, id: number): Promise<{ status: string; data: T }> => {
    const response = await client.post<{ status: string; data: T }>(`/hr/master/${model}/${id}/restore`);
    return response.data;
};

const masterDataService = {
    getAll,
    getOne,
    create,
    update,
    delete: deleteItem,
    restore,
};

export default masterDataService;
