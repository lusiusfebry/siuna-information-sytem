import client from './client';
import { PaginatedResponse } from './inventory-master-data.service';
import {
    FacWorkOrder,
    WorkOrderPayload,
    WorkOrderFilterParams,
} from '../../types/facility';

const getAll = async (params?: WorkOrderFilterParams): Promise<PaginatedResponse<FacWorkOrder>> => {
    const response = await client.get<PaginatedResponse<FacWorkOrder>>('/facility/work-orders', { params });
    return response.data;
};

const getOne = async (id: number): Promise<{ status: string; data: FacWorkOrder }> => {
    const response = await client.get<{ status: string; data: FacWorkOrder }>(`/facility/work-orders/${id}`);
    return response.data;
};

const create = async (data: WorkOrderPayload): Promise<{ status: string; data: FacWorkOrder }> => {
    const response = await client.post<{ status: string; data: FacWorkOrder }>('/facility/work-orders', data);
    return response.data;
};

const update = async (id: number, data: Partial<WorkOrderPayload>): Promise<{ status: string; data: FacWorkOrder }> => {
    const response = await client.put<{ status: string; data: FacWorkOrder }>(`/facility/work-orders/${id}`, data);
    return response.data;
};

const facilityWorkOrderService = {
    getAll,
    getOne,
    create,
    update,
};

export default facilityWorkOrderService;
