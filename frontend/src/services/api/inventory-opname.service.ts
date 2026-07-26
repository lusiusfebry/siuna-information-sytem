import client from './client';
import {
    InvOpnameSession,
    InvOpnameDetail,
    InvOpnameSerial,
    OpnameFilter,
    CreateOpnamePayload,
    UpsertOpnameDetailPayload,
    UpsertOpnameSerialPayload,
} from '../../types/inventory';

const listSessions = async (params?: OpnameFilter): Promise<{ status: string; data: InvOpnameSession[] }> => {
    const response = await client.get<{ status: string; data: InvOpnameSession[] }>('/inventory/opname', { params });
    return response.data;
};

const getSession = async (id: number): Promise<{ status: string; data: InvOpnameSession }> => {
    const response = await client.get<{ status: string; data: InvOpnameSession }>(`/inventory/opname/${id}`);
    return response.data;
};

const createSession = async (data: CreateOpnamePayload): Promise<{ status: string; data: InvOpnameSession }> => {
    const response = await client.post<{ status: string; data: InvOpnameSession }>('/inventory/opname', data);
    return response.data;
};

const startSession = async (id: number): Promise<{ status: string; data: InvOpnameSession }> => {
    const response = await client.post<{ status: string; data: InvOpnameSession }>(`/inventory/opname/${id}/start`);
    return response.data;
};

const upsertDetail = async (id: number, data: UpsertOpnameDetailPayload): Promise<{ status: string; data: InvOpnameDetail }> => {
    const response = await client.put<{ status: string; data: InvOpnameDetail }>(`/inventory/opname/${id}/detail`, data);
    return response.data;
};

const upsertSerial = async (id: number, data: UpsertOpnameSerialPayload): Promise<{ status: string; data: { serial: InvOpnameSerial; detail: InvOpnameDetail } }> => {
    const response = await client.put<{ status: string; data: { serial: InvOpnameSerial; detail: InvOpnameDetail } }>(`/inventory/opname/${id}/serial`, data);
    return response.data;
};

const finishSession = async (id: number): Promise<{ status: string; data: InvOpnameSession }> => {
    const response = await client.post<{ status: string; data: InvOpnameSession }>(`/inventory/opname/${id}/finish`);
    return response.data;
};

const approveSession = async (id: number): Promise<{ status: string; data: InvOpnameSession }> => {
    const response = await client.post<{ status: string; data: InvOpnameSession }>(`/inventory/opname/${id}/approve`);
    return response.data;
};

const cancelSession = async (id: number, reason: string): Promise<{ status: string; data: InvOpnameSession }> => {
    const response = await client.post<{ status: string; data: InvOpnameSession }>(`/inventory/opname/${id}/cancel`, { reason });
    return response.data;
};

const downloadBeritaAcara = async (id: number): Promise<Blob> => {
    const response = await client.get(`/inventory/opname/${id}/berita-acara`, { responseType: 'blob' });
    return response.data;
};

const inventoryOpnameService = {
    listSessions,
    getSession,
    createSession,
    startSession,
    upsertDetail,
    upsertSerial,
    finishSession,
    approveSession,
    cancelSession,
    downloadBeritaAcara,
};

export default inventoryOpnameService;
