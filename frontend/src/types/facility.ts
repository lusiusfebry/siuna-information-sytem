import { MasterData } from './hr';

// === Master Data Types ===

export type BuildingTipe = 'Mess' | 'Kantor' | 'Workshop' | 'Lainnya';
export type RoomStatus = 'Tersedia' | 'Penuh' | 'Maintenance' | 'Tidak Aktif';

export interface FacBuilding extends MasterData {
    tipe: BuildingTipe;
    lokasi_kerja_id?: number | null;
    alamat?: string | null;
    penanggung_jawab_id?: number | null;
    kapasitas_total?: number | null;
    lokasi_kerja?: { id: number; nama: string; kode_site?: string };
    penanggung_jawab?: { id: number; nama_lengkap: string };
}

export interface FacRoomType extends MasterData {}

export interface FacRoom extends Omit<MasterData, 'status'> {
    building_id: number;
    room_type_id?: number | null;
    lantai?: string | null;
    kapasitas: number;
    status: RoomStatus;
    building?: { id: number; code: string; nama: string };
    room_type?: { id: number; code: string; nama: string };
}

export interface FacMaintenanceCategory extends MasterData {}

// === Work Order Types ===

export type WorkOrderPrioritas = 'Low' | 'Medium' | 'High' | 'Critical';
export type WorkOrderStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface FacWorkOrder {
    id: number;
    code: string;
    judul: string;
    deskripsi?: string | null;
    room_id: number;
    kategori_id?: number | null;
    prioritas: WorkOrderPrioritas;
    status: WorkOrderStatus;
    reported_by?: number | null;
    assigned_to?: number | null;
    tanggal_lapor: string;
    tanggal_selesai?: string | null;
    estimasi_biaya?: number | null;
    realisasi_biaya?: number | null;
    catatan_penyelesaian?: string | null;
    created_by?: number | null;
    created_at: string;
    updated_at: string;
    room?: { id: number; code: string; nama: string; building?: { id: number; nama: string } };
    kategori?: { id: number; code: string; nama: string };
    reporter?: { id: number; nama_lengkap: string };
    assignee?: { id: number; nama_lengkap: string };
    creator?: { id: number; nama: string };
}

export interface WorkOrderPayload {
    judul: string;
    deskripsi?: string | null;
    room_id: number;
    kategori_id?: number | null;
    prioritas?: WorkOrderPrioritas;
    status?: WorkOrderStatus;
    reported_by?: number | null;
    assigned_to?: number | null;
    tanggal_lapor?: string;
    tanggal_selesai?: string | null;
    estimasi_biaya?: number | null;
    realisasi_biaya?: number | null;
    catatan_penyelesaian?: string | null;
}

// === Occupant Types ===

export type OccupantStatus = 'Aktif' | 'Selesai';

export interface FacOccupant {
    id: number;
    room_id: number;
    employee_id: number;
    tanggal_masuk: string;
    tanggal_keluar?: string | null;
    keterangan?: string | null;
    status: OccupantStatus;
    created_by?: number | null;
    created_at: string;
    updated_at: string;
    room?: { id: number; code: string; nama: string; building?: { id: number; nama: string } };
    employee?: { id: number; nama_lengkap: string; nomor_induk_karyawan?: string };
    creator?: { id: number; nama: string };
}

export interface OccupantPayload {
    room_id: number;
    employee_id: number;
    tanggal_masuk: string;
    tanggal_keluar?: string | null;
    keterangan?: string | null;
    status?: OccupantStatus;
}

// === Asset Types ===

export type AssetStatus = 'Aktif' | 'Ditarik';

export interface FacAsset {
    id: number;
    room_id: number;
    serial_number_id: number;
    tanggal_penempatan: string;
    tanggal_penarikan?: string | null;
    keterangan?: string | null;
    status: AssetStatus;
    created_by?: number | null;
    created_at: string;
    updated_at: string;
    room?: { id: number; code: string; nama: string; building?: { id: number; nama: string } };
    serial_number?: {
        id: number;
        serial_number: string;
        tag_number?: string;
        produk?: { id: number; code: string; nama: string };
    };
    creator?: { id: number; nama: string };
}

export interface AssetPayload {
    room_id: number;
    serial_number_id: number;
    tanggal_penempatan: string;
    tanggal_penarikan?: string | null;
    keterangan?: string | null;
}

// === Dashboard Types ===

export interface FacilityDashboardSummary {
    totalBuildings: number;
    totalRooms: number;
    totalOccupants: number;
    openWorkOrders: number;
    workOrdersByStatus: { status: string; count: number }[];
    workOrdersByPriority: { prioritas: string; count: number }[];
    recentWorkOrders: FacWorkOrder[];
    assetsByCondition: { status: string; count: number }[];
    recentFacilityTransaksi: import('./inventory').InvTransaksi[];
}

// === Filter Types ===

export interface FacilityFilterParams {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface WorkOrderFilterParams {
    status?: WorkOrderStatus;
    prioritas?: WorkOrderPrioritas;
    room_id?: number;
    building_id?: number;
    kategori_id?: number;
    assigned_to?: number;
    search?: string;
    page?: number;
    limit?: number;
}

export interface OccupantFilterParams {
    room_id?: number;
    building_id?: number;
    employee_id?: number;
    status?: OccupantStatus;
    search?: string;
    page?: number;
    limit?: number;
}

export interface AssetFilterParams {
    room_id?: number;
    building_id?: number;
    status?: AssetStatus;
    search?: string;
    page?: number;
    limit?: number;
}
