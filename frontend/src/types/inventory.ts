import { MasterData } from './hr';

export interface InvKategori extends MasterData {}

export interface InvSubKategori extends MasterData {
    kategori_id: number;
    prefix_tag?: string;
    kategori?: InvKategori;
}

export interface InvBrand extends MasterData {
    sub_kategori_id: number;
    sub_kategori?: InvSubKategori;
}

export interface InvUom extends MasterData {}

export interface InvProduk extends MasterData {
    brand_id: number;
    uom_id?: number | null;
    has_serial_number: boolean;
    has_tag_number: boolean;
    is_consumable: boolean;
    stok_minimum?: number | null;
    gambar?: string | null;
    brand?: InvBrand;
    uom?: InvUom;
}

export interface InvGudang extends MasterData {
    penanggung_jawab_id?: number | null;
    department_id?: number | null;
    lokasi_kerja_id?: number | null;
    lokasi?: string;
    penanggung_jawab?: { id: number; nama_lengkap: string };
    department?: { id: number; nama: string };
    lokasi_kerja?: { id: number; nama: string; kode_site?: string };
}

// === Stock Management Types ===

export interface InvStok {
    id: number;
    produk_id: number;
    gudang_id: number;
    uom_id: number;
    jumlah: number;
    created_at: string;
    updated_at: string;
    produk?: InvProduk;
    gudang?: InvGudang;
    uom?: InvUom;
}

export type TransaksiTipe = 'Masuk' | 'Keluar' | 'Adjustment';
export type TransaksiSubTipe = 'Supplier' | 'Transfer Masuk' | 'Retur Karyawan' | 'Ke Karyawan' | 'Transfer Gudang' | 'Disposal' | 'Opname' | 'Ke Gedung/Mess' | 'Rusak/Terbuang' | 'Ambil dari Gedung' | 'Konsumsi';
export type SerialNumberStatus = 'Tersedia' | 'Digunakan' | 'Rusak' | 'Disposed';

export interface TransaksiDokumen {
    nama: string;
    path: string;
    size: number;
    mimetype: string;
    uploaded_at: string;
}

export interface InvTransaksi {
    id: number;
    code: string;
    tipe: TransaksiTipe;
    sub_tipe: TransaksiSubTipe;
    tanggal: string;
    gudang_id: number;
    gudang_tujuan_id?: number | null;
    facility_building_id?: number | null;
    facility_room_id?: number | null;
    karyawan_id?: number | null;
    department_id?: number | null;
    supplier_nama?: string | null;
    no_referensi?: string | null;
    catatan?: string | null;
    dokumen?: TransaksiDokumen[] | null;
    created_by: number;
    approval_status: ApprovalStatus;
    approved_by?: number | null;
    approved_at?: string | null;
    rejection_reason?: string | null;
    voided_by?: number | null;
    voided_at?: string | null;
    void_reason?: string | null;
    amends_transaksi_id?: number | null;
    amended_by_transaksi_id?: number | null;
    voider?: { id: number; nama: string } | null;
    transaksi_asli?: { id: number; code: string } | null;
    transaksi_koreksi?: { id: number; code: string } | null;
    created_at: string;
    updated_at: string;
    gudang?: { id: number; code: string; nama: string };
    gudang_tujuan?: { id: number; code: string; nama: string } | null;
    facility_building?: { id: number; code: string; nama: string } | null;
    facility_room?: { id: number; code: string; nama: string } | null;
    karyawan?: { id: number; nama_lengkap: string; nomor_induk_karyawan?: string } | null;
    department?: { id: number; code?: string; nama: string } | null;
    creator?: { id: number; nama: string };
    approver?: { id: number; nama: string } | null;
    details?: InvTransaksiDetail[];
}

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Voided';

export interface InvTransaksiDetail {
    id: number;
    transaksi_id: number;
    produk_id: number;
    uom_id: number;
    jumlah: number;
    catatan?: string | null;
    created_at: string;
    updated_at: string;
    produk?: { id: number; code: string; nama: string; has_serial_number: boolean };
    uom?: { id: number; nama: string };
    transaksi?: InvTransaksi;
    // id/produk_id/tag_number are absent for Pending transactions, where the backend
    // surfaces the submitter's serial selection as {serial_number, status:'Pending'}
    // placeholders (no serial row exists yet). INV-N07.
    serial_numbers?: { id?: number; produk_id?: number; serial_number: string | null; tag_number?: string | null; status: string }[];
}

export interface InvSerialNumber {
    id: number;
    produk_id: number;
    serial_number: string | null;
    tag_number?: string | null;
    gudang_id?: number | null;
    karyawan_id?: number | null;
    status: SerialNumberStatus;
    transaksi_masuk_id: number;
    transaksi_terakhir_id: number;
    created_at: string;
    updated_at: string;
    produk?: { id: number; code: string; nama: string; uom_id?: number };
    gudang?: { id: number; code: string; nama: string } | null;
    karyawan?: { id: number; nama_lengkap: string; nomor_induk_karyawan?: string } | null;
}

export interface TransaksiDetailPayload {
    produk_id: number;
    uom_id: number;
    jumlah: number;
    catatan?: string;
    serial_numbers?: string[];
}

export interface VoidTransaksiPayload {
    reason: string;
}

export interface AmendTransaksiPayload {
    reason: string;
    koreksi?: { details: TransaksiDetailPayload[] };
}

export interface TransaksiPayload {
    tipe: TransaksiTipe;
    sub_tipe: TransaksiSubTipe;
    tanggal: string;
    gudang_id: number;
    gudang_tujuan_id?: number | null;
    facility_building_id?: number | null;
    facility_room_id?: number | null;
    karyawan_id?: number | null;
    department_id?: number | null;
    supplier_nama?: string | null;
    no_referensi?: string | null;
    catatan?: string | null;
    details: TransaksiDetailPayload[];
}

export interface StokFilter {
    gudang_id?: number;
    produk_id?: number;
    search?: string;
    page?: number;
    limit?: number;
    hide_zero?: boolean;
}

export interface TransaksiFilter {
    tipe?: TransaksiTipe;
    sub_tipe?: TransaksiSubTipe;
    gudang_id?: number;
    facility_building_id?: number;
    approval_status?: ApprovalStatus;
    tanggal_dari?: string;
    tanggal_sampai?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface SerialNumberFilter {
    produk_id?: number;
    gudang_id?: number;
    karyawan_id?: number;
    status?: SerialNumberStatus;
    search?: string;
    // Units currently installed in a building/mess (in use, not in a warehouse,
    // not held by an employee) — used by the "Ambil dari Gedung" picker.
    facility_placed?: boolean;
    page?: number;
    limit?: number;
}

export interface KartuStokFilter {
    produk_id: number;
    gudang_id?: number;
    dari?: string;
    sampai?: string;
    page?: number;
    limit?: number;
}

export interface LaporanKonsumsiFilter {
    department_id?: number;
    karyawan_id?: number;
    gudang_id?: number;
    produk_id?: number;
    dari?: string;
    sampai?: string;
    page?: number;
    limit?: number;
}

export interface LaporanKonsumsiSummary {
    per_produk: { id: number; code: string; nama: string; total_jumlah: number }[];
    per_department: { id: number; code: string; nama: string; total_jumlah: number }[];
    per_karyawan: { id: number; nama_lengkap: string; total_jumlah: number }[];
    total_baris: number;
    total_transaksi: number;
}

export interface LaporanKonsumsiResponse {
    status: string;
    data: InvTransaksi[];
    summary: LaporanKonsumsiSummary;
    pagination: {
        total: number;
        page: number;
        totalPages: number;
    };
}

// === Stock Opname Types ===

export type OpnameStatus = 'Draft' | 'Berjalan' | 'Selesai' | 'Approved' | 'Dibatalkan';

export type OpnameSerialKondisi = 'Ada' | 'Tidak Ada';

export interface InvOpnameSerial {
    id: number;
    opname_detail_id: number;
    serial_number_id: number;
    serial_number: string | null;
    tag_number: string | null;
    kondisi: OpnameSerialKondisi;
    catatan?: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvOpnameDetail {
    id: number;
    opname_session_id: number;
    produk_id: number;
    jumlah_sistem_snapshot: number;
    jumlah_fisik: number | null;
    selisih: number | null;
    catatan?: string | null;
    tipe_hitung: 'Fisik' | 'Serial';
    created_at: string;
    updated_at: string;
    produk?: {
        id: number;
        code: string;
        nama: string;
        has_serial_number?: boolean;
        has_tag_number?: boolean;
        uom?: { id: number; nama: string };
    };
    serials?: InvOpnameSerial[];
}

export interface OpnameKaryawanRingkas {
    id: number;
    nama_lengkap: string;
    nomor_induk_karyawan?: string | null;
    manager?: {
        id: number;
        nama_lengkap: string;
        nomor_induk_karyawan?: string | null;
    } | null;
}

export interface InvOpnamePetugas {
    id: number;
    opname_session_id: number;
    karyawan_id: number;
    karyawan?: OpnameKaryawanRingkas;
}

export interface InvOpnameSession {
    id: number;
    kode: string;
    gudang_id: number;
    status: OpnameStatus;
    tanggal_mulai?: string | null;
    tanggal_selesai?: string | null;
    catatan?: string | null;
    transaksi_id?: number | null;
    created_by?: number | null;
    approved_by?: number | null;
    approved_at?: string | null;
    created_at: string;
    updated_at: string;
    gudang?: {
        id: number;
        code: string;
        nama: string;
        department_id?: number | null;
        penanggung_jawab?: OpnameKaryawanRingkas | null;
        department?: { id: number; code: string; nama: string } | null;
    };
    creator?: { id: number; nama: string } | null;
    approver?: { id: number; nama: string } | null;
    transaksi?: { id: number; code: string } | null;
    petugas?: InvOpnamePetugas[];
    detail?: InvOpnameDetail[];
}

export interface OpnameFilter {
    gudang_id?: number;
    status?: OpnameStatus;
}

export interface CreateOpnamePayload {
    gudang_id: number;
    catatan?: string | null;
    petugas_ids: number[];
}

export interface UpsertOpnameDetailPayload {
    produk_id: number;
    jumlah_fisik: number | null;
    catatan?: string | null;
}

export interface UpsertOpnameSerialPayload {
    opname_serial_id: number;
    kondisi: OpnameSerialKondisi;
    catatan?: string | null;
}
