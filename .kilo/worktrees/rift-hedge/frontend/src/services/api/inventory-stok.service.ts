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

const getTransaksiList = async (params?: TransaksiFilter): Promise<PaginatedResponse<InvTransaksi>> => {
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

const uploadDokumen = async (transaksiId: number, files: File[]): Promise<{ status: string; data: { dokumen: TransaksiDokumen[] } }> => {
    const formData = new FormData();
    files.forEach(f => formData.append('dokumen', f));
    const response = await client.post(`/inventory/transaksi/${transaksiId}/dokumen`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

const inventoryStokService = {
    getStok,
    getSerialNumbers,
    createTransaksi,
    getTransaksiList,
    getTransaksiDetail,
    getKartuStok,
    uploadDokumen,
};

export default inventoryStokService;
