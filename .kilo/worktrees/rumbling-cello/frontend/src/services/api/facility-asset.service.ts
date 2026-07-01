import client from './client';
import { PaginatedResponse } from './inventory-master-data.service';
import {
    FacAsset,
    AssetPayload,
    AssetFilterParams,
} from '../../types/facility';

const getAll = async (params?: AssetFilterParams): Promise<PaginatedResponse<FacAsset>> => {
    const response = await client.get<PaginatedResponse<FacAsset>>('/facility/assets', { params });
    return response.data;
};

const getOne = async (id: number): Promise<{ status: string; data: FacAsset }> => {
    const response = await client.get<{ status: string; data: FacAsset }>(`/facility/assets/${id}`);
    return response.data;
};

const create = async (data: AssetPayload): Promise<{ status: string; data: FacAsset }> => {
    const response = await client.post<{ status: string; data: FacAsset }>('/facility/assets', data);
    return response.data;
};

const update = async (id: number, data: Partial<AssetPayload>): Promise<{ status: string; data: FacAsset }> => {
    const response = await client.put<{ status: string; data: FacAsset }>(`/facility/assets/${id}`, data);
    return response.data;
};

const withdraw = async (id: number, data?: { tanggal_penarikan?: string; keterangan?: string }): Promise<{ status: string; data: FacAsset }> => {
    const response = await client.put<{ status: string; data: FacAsset }>(`/facility/assets/${id}/withdraw`, data);
    return response.data;
};

const facilityAssetService = {
    getAll,
    getOne,
    create,
    update,
    withdraw,
};

export default facilityAssetService;
