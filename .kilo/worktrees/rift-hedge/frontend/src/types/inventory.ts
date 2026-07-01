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
    has_serial_number: boolean;
    has_tag_number: boolean;
    stok_minimum?: number | null;
    gambar?: string | null;
    brand?: InvBrand;
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
export type TransaksiSubTipe = 'Supplier' | 'Transfer Masuk' | 'Retur Karyawan' | 'Ke Karyawan' | 'Transfer Gudang' | 'Disposal' | 'Opname' | 'Ke Gedung/Mess' | 'Rusak/Terbuang';
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
    karyawan_id?: number | null;
    supplier_nama?: string | null;
    no_referensi?: string | null;
    catatan?: string | null;
    dokumen?: TransaksiDokumen[] | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    gudang?: { id: number; code: string; nama: string };
    gudang_tujuan?: { id: number; code: string; nama: string } | null;
    karyawan?: { id: number; nama_lengkap: string; nomor_induk_karyawan?: string } | null;
    creator?: { id: number; nama: string };
    details?: InvTransaksiDetail[];
}

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
    produk?: { id: number; code: string; nama: string };
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

export interface TransaksiPayload {
    tipe: TransaksiTipe;
    sub_tipe: TransaksiSubTipe;
    tanggal: string;
    gudang_id: number;
    gudang_tujuan_id?: number | null;
    karyawan_id?: number | null;
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
}

export interface TransaksiFilter {
    tipe?: TransaksiTipe;
    sub_tipe?: TransaksiSubTipe;
    gudang_id?: number;
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
