import client from './client';
import { MasterData } from '../../types/hr';
import { PaginatedResponse } from './inventory-master-data.service';
import { FacilityFilterParams } from '../../types/facility';

const getAll = async <T = MasterData>(model: string, params?: FacilityFilterParams): Promise<PaginatedResponse<T>> => {
    const response = await client.get<PaginatedResponse<T>>(`/facility/master/${model}`, { params });
    return response.data;
};

const getOne = async <T = MasterData>(model: string, id: number): Promise<{ status: string; data: T }> => {
    const response = await client.get<{ status: string; data: T }>(`/facility/master/${model}/${id}`);
    return response.data;
};

const create = async <T = MasterData>(model: string, data: Partial<T>): Promise<{ status: string; data: T }> => {
    const response = await client.post<{ status: string; data: T }>(`/facility/master/${model}`, data);
    return response.data;
};

const update = async <T = MasterData>(model: string, id: number, data: Partial<T>): Promise<{ status: string; data: T }> => {
    const response = await client.put<{ status: string; data: T }>(`/facility/master/${model}/${id}`, data);
    return response.data;
};

const deleteItem = async (model: string, id: number): Promise<{ status: string; message: string }> => {
    const response = await client.delete<{ status: string; message: string }>(`/facility/master/${model}/${id}`);
    return response.data;
};

const restore = async <T = MasterData>(model: string, id: number): Promise<{ status: string; data: T }> => {
    const response = await client.post<{ status: string; data: T }>(`/facility/master/${model}/${id}/restore`);
    return response.data;
};

const facilityMasterDataService = {
    getAll,
    getOne,
    create,
    update,
    delete: deleteItem,
    restore,
};

export default facilityMasterDataService;
