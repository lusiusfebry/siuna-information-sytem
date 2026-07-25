import client from './client';
import { PaginatedResponse } from './inventory-master-data.service';
import {
    InvStok,
    InvTransaksi,
    InvTransaksiDetail,
    InvSerialNumber,
    TransaksiPayload,
    TransaksiDokumen,
    StokFilter,
    TransaksiFilter,
    SerialNumberFilter,
    KartuStokFilter,
    LaporanKonsumsiFilter,
    LaporanKonsumsiResponse,
    VoidTransaksiPayload,
    AmendTransaksiPayload,
} from '../../types/inventory';

const getStok = async (params?: StokFilter): Promise<PaginatedResponse<InvStok>> => {
    const response = await client.get<PaginatedResponse<InvStok>>('/inventory/stok', { params });
    return response.data;
};

const getSerialNumbers = async (params?: SerialNumberFilter): Promise<PaginatedResponse<InvSerialNumber>> => {
    const response = await client.get<PaginatedResponse<InvSerialNumber>>('/inventory/serial-numbers', { params });
    return response.data;
};

const createTransaksi = async (data: TransaksiPayload): Promise<{ status: string; data: InvTransaksi }> => {
    const response = await client.post<{ status: string; data: InvTransaksi }>('/inventory/transaksi', data);
    return response.data;
};

const getTransaksiList = async (params?: TransaksiFilter & { include_inactive?: boolean }): Promise<PaginatedResponse<InvTransaksi>> => {
    const response = await client.get<PaginatedResponse<InvTransaksi>>('/inventory/transaksi', { params });
    return response.data;
};

const getTransaksiDetail = async (id: number): Promise<{ status: string; data: InvTransaksi }> => {
    const response = await client.get<{ status: string; data: InvTransaksi }>(`/inventory/transaksi/${id}`);
    return response.data;
};

const getKartuStok = async (params: KartuStokFilter): Promise<PaginatedResponse<InvTransaksiDetail>> => {
    const response = await client.get<PaginatedResponse<InvTransaksiDetail>>('/inventory/kartu-stok', { params });
    return response.data;
};

const getLaporanKonsumsi = async (params?: LaporanKonsumsiFilter): Promise<LaporanKonsumsiResponse> => {
    const response = await client.get<LaporanKonsumsiResponse>('/inventory/laporan/konsumsi', { params });
    return response.data;
};

const uploadDokumen = async (transaksiId: number, files: File[]): Promise<{ status: string; data: { dokumen: TransaksiDokumen[] } }> => {
    const formData = new FormData();
    files.forEach(f => formData.append('dokumen', f));
    const response = await client.post(`/inventory/transaksi/${transaksiId}/dokumen`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

const getFacilityInventory = async (buildingId: number): Promise<{ status: string; data: InvTransaksi[] }> => {
    const response = await client.get<{ status: string; data: InvTransaksi[] }>(`/inventory/facility/${buildingId}/inventory`);
    return response.data;
};

const approveTransaksi = async (id: number): Promise<{ status: string; data: InvTransaksi }> => {
    const response = await client.post<{ status: string; data: InvTransaksi }>(`/inventory/transaksi/${id}/approve`);
    return response.data;
};

const rejectTransaksi = async (id: number, reason?: string): Promise<{ status: string; data: InvTransaksi }> => {
    const response = await client.post<{ status: string; data: InvTransaksi }>(`/inventory/transaksi/${id}/reject`, { reason });
    return response.data;
};

const voidTransaksi = async (id: number, payload: VoidTransaksiPayload): Promise<{ status: string; data: InvTransaksi; message: string }> => {
    const response = await client.post<{ status: string; data: InvTransaksi; message: string }>(`/inventory/transaksi/${id}/void`, payload);
    return response.data;
};

const amendTransaksi = async (id: number, payload: AmendTransaksiPayload): Promise<{ status: string; data: { reversal: InvTransaksi; koreksi: InvTransaksi | null }; message: string }> => {
    const response = await client.post<{ status: string; data: { reversal: InvTransaksi; koreksi: InvTransaksi | null }; message: string }>(`/inventory/transaksi/${id}/amend`, payload);
    return response.data;
};

const inventoryStokService = {
    getStok,
    getSerialNumbers,
    createTransaksi,
    getTransaksiList,
    getTransaksiDetail,
    getKartuStok,
    getLaporanKonsumsi,
    uploadDokumen,
    getFacilityInventory,
    approveTransaksi,
    rejectTransaksi,
    voidTransaksi,
    amendTransaksi,
};

export default inventoryStokService;
