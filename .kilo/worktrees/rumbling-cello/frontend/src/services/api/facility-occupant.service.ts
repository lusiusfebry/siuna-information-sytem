import client from './client';
import { PaginatedResponse } from './inventory-master-data.service';
import {
    FacOccupant,
    OccupantPayload,
    OccupantFilterParams,
} from '../../types/facility';

const getAll = async (params?: OccupantFilterParams): Promise<PaginatedResponse<FacOccupant>> => {
    const response = await client.get<PaginatedResponse<FacOccupant>>('/facility/occupants', { params });
    return response.data;
};

const getOne = async (id: number): Promise<{ status: string; data: FacOccupant }> => {
    const response = await client.get<{ status: string; data: FacOccupant }>(`/facility/occupants/${id}`);
    return response.data;
};

const create = async (data: OccupantPayload): Promise<{ status: string; data: FacOccupant }> => {
    const response = await client.post<{ status: string; data: FacOccupant }>('/facility/occupants', data);
    return response.data;
};

const update = async (id: number, data: Partial<OccupantPayload>): Promise<{ status: string; data: FacOccupant }> => {
    const response = await client.put<{ status: string; data: FacOccupant }>(`/facility/occupants/${id}`, data);
    return response.data;
};

const checkout = async (id: number, data?: { tanggal_keluar?: string; keterangan?: string }): Promise<{ status: string; data: FacOccupant }> => {
    const response = await client.put<{ status: string; data: FacOccupant }>(`/facility/occupants/${id}/checkout`, data);
    return response.data;
};

const facilityOccupantService = {
    getAll,
    getOne,
    create,
    update,
    checkout,
};

export default facilityOccupantService;
