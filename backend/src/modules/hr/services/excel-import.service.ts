import ExcelJS from 'exceljs';
import sequelize from '../../../config/database';
import Divisi from '../models/Divisi';
import Department from '../models/Department';
import PosisiJabatan from '../models/PosisiJabatan';
import StatusKaryawan from '../models/StatusKaryawan';
import LokasiKerja from '../models/LokasiKerja';
import Tag from '../models/Tag';
import JenisHubunganKerja from '../models/JenisHubunganKerja';
import KategoriPangkat from '../models/KategoriPangkat';
import Golongan from '../models/Golongan';
import SubGolongan from '../models/SubGolongan';
import employeeService from './employee.service';
import { ImportResult, ImportError, ExcelMapping } from '../types/import.types';
import { validateDepartmentBelongsToDivisi, validatePosisiJabatanBelongsToDepartment } from '../validators/business-rules.validator';

class ExcelImportService {
    async parseExcelFile(filePath: string): Promise<{ workbook: ExcelJS.Workbook; rows: any[] }> {
        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.readFile(filePath);
        } catch (error: any) {
            throw new Error(`Gagal membaca file Excel: ${error.message}. Pastikan file tidak rusak dan formatnya benar (.xlsx).`);
        }

        if (workbook.worksheets.length === 0) {
            throw new Error('File Excel tidak memiliki worksheet (sheet kosong).');
        }

        const worksheet = workbook.worksheets[0];
        const rows: any[] = [];

        // Get headers from row 1
        const headers: string[] = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber] = cell.text ? cell.text.trim() : '';
        });

        if (headers.length === 0) {
            throw new Error('Header tidak ditemukan di baris 1. Pastikan template sesuai.');
        }

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const rowData: any = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber];
                if (header) {
                    // @ts-ignore: cell.type comparison issue with different ValueType enums
                    if (cell.type === ExcelJS.ValueType.Date) {
                        rowData[header] = cell.value;
                    } else {
                        // Use cell.text which handles RichText, Hyperlinks, and Formulas correctly
                        rowData[header] = cell.text ? cell.text.trim() : '';
                    }
                }
            });
            // Only add if not empty
            if (Object.keys(rowData).length > 0) {
                rows.push({ ...rowData, _rowNumber: rowNumber });
            }
        });

        if (rows.length === 0) {
            throw new Error('Tidak ada data yang ditemukan di sheet pertama.');
        }

        return { workbook, rows };
    }

    async getMappingConfiguration(workbook: ExcelJS.Workbook): Promise<ExcelMapping> {
        const mapping: ExcelMapping = {
            masterData: {},
            employeeProfile: {}
        };

        const masterDataSheet = workbook.getWorksheet('header excel vs master data');
        if (masterDataSheet) {
            masterDataSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const excelHeader = row.getCell(2).text?.trim();
                const dbField = row.getCell(3).text?.trim();
                if (excelHeader && dbField) {
                    mapping.masterData[excelHeader] = dbField;
                }
            });
        }

        const profileSheet = workbook.getWorksheet('header excel vs profil karyawan');
        if (profileSheet) {
            profileSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const excelHeader = row.getCell(2).text?.trim();
                const dbField = row.getCell(4).text?.trim();
                if (excelHeader && dbField) {
                    mapping.employeeProfile[excelHeader] = dbField;
                }
            });
        }

        if (Object.keys(mapping.employeeProfile).length === 0) {
            // Updated fallback mapping with UPPERCASE keys to match template
            mapping.employeeProfile = {
                'NOMOR INDUK KARYAWAN': 'nomor_induk_karyawan',
                'NAMA LENGKAP': 'nama_lengkap',
                'EMAIL PERUSAHAAN': 'email_perusahaan',
                'EMAIL PRIBADI': 'email_pribadi', // Personal
                'NOMOR HP 1': 'nomor_handphone',
                'DIVISI': 'divisi_id',
                'DEPARTMENT': 'department_id',
                'POSISI JABATAN': 'posisi_jabatan_id',
                'STATUS KARYAWAN': 'status_karyawan_id',
                'LOKASI KERJA': 'lokasi_kerja_id',
                'TAG': 'tag_id', // New
                'MANAGER': 'manager_id', // New
                'ATASAN LANGSUNG': 'atasan_langsung_id', // New
                // Personal Info
                'TEMPAT LAHIR': 'tempat_lahir',
                'TANGGAL LAHIR': 'tanggal_lahir',
                'JENIS KELAMIN': 'jenis_kelamin',
                'AGAMA': 'agama',
                'STATUS PERNIKAHAN': 'status_pernikahan',
                'NOMOR KTP': 'nomor_ktp',
                'NOMOR NPWP': 'nomor_npwp',
                'NOMOR BPJS-TK': 'nomor_bpjs', // Mapped
                'NOMOR KARTU KELUARGA': 'nomor_kartu_keluarga', // New
                'NOMOR NIK KK': 'no_nik_kk', // New
                'ALAMAT DOMISILI': 'alamat_domisili',
                'KOTA DOMISILI': 'kota_domisili',
                'PROPINSI DOMISILI': 'provinsi_domisili',
                'ALAMAT KTP': 'alamat_ktp',
                'NOMOR TELEPON RUMAH 1': 'nomor_telepon_rumah_1',
                'NOMOR TELEPON RUMAH 2': 'nomor_telepon_rumah_2',
                'NOMOR HP 2': 'nomor_handphone_2',
                'NOMOR REKENING': 'nomor_rekening',
                'NAMA PEMILIK REKENING': 'nama_pemegang_rekening',
                'NAMA BANK': 'nama_bank',
                'CABANG BANK': 'cabang_bank',
                'STATUS PAJAK': 'status_pajak',
                // Family
                'NAMA PASANGAN NIKAH': 'nama_pasangan',
                'TANGGAL MENIKAH': 'tanggal_menikah',
                'JUMLAH ANAK': 'jumlah_anak',
                'PEKERJAAN PASANGAN': 'pekerjaan_pasangan',
                'NAMA BAPAK KANDUNG': 'nama_ayah_kandung', // New
                'NAMA IBU KANDUNG': 'nama_ibu_kandung', // New
                // HR Info
                'TANGGAL MASUK': 'tanggal_masuk',
                'TANGGAL JOIN GROUP': 'tanggal_masuk_group',
                'TANGGAL TETAP': 'tanggal_permanent',
                'TANGGAL AWAL KONTRAK': 'tanggal_kontrak',
                'TANGGAL AKHIR KONTRAK': 'tanggal_akhir_kontrak',
                'TANGGAL KELUAR': 'tanggal_berhenti',
                'LOKASI COSTING': 'lokasi_costing',
                'ACTUAL': 'actual',
                'ASSIGN': 'assign',
                'SIKLUS PEMBAYARAN': 'siklus_pembayaran_gaji', // New
                'PENDIDIKAN TERAKHIR': 'tingkat_pendidikan',
                'JURUSAN PENDIDIKAN': 'bidang_studi',
                'NAMA SEKOLAH': 'nama_sekolah',
                'KOTA SEKOLAH': 'kota_sekolah',
                'STATUS PENDIDIKAN': 'status_kelulusan',
                'KETERANGAN PENDIDIKAN': 'keterangan_pendidikan',
                'PANGKAT KATEGORI': 'kategori_pangkat_id',
                'GOLONGAN': 'golongan_pangkat_id',
                'SUB GOLONGAN': 'sub_golongan_pangkat_id',
                'JENIS HUBUNGAN KERJA': 'jenis_hubungan_kerja_id',
                'NOMOR DANA PENSIUN': 'no_dana_pensiun',
                'NAMA KONTAK DARURAT 1': 'nama_kontak_darurat_1', // New
                'HUBUNGAN KONTAK DARURAT 1': 'hubungan_kontak_darurat_1', // New
                'ALAMAT KONTAK DARURAT 1': 'alamat_kontak_darurat_1', // New
                'NOMOR HP1 KONTAK DARURAT 1': 'nomor_telepon_kontak_darurat_1', // New
                'UKURAN SEPATU': 'ukuran_sepatu_kerja', // New
                'UKURAN BAJU': 'ukuran_seragam_kerja', // New
                'LOKASI SEBELUMNYA': 'lokasi_sebelumnya_id', // New
                'TANGGAL MUTASI': 'tanggal_mutasi', // New
                'POINT OF ORIGINAL': 'point_of_original', // New
                'POINT OF HIRE': 'point_of_hire' // New
            };
        }

        return mapping;
    }

    async loadMasterDataCache() {
        const cache: any = {
            Divisi: new Map(),
            Department: new Map(),
            PosisiJabatan: new Map(),
            StatusKaryawan: new Map(),
            LokasiKerja: new Map(),
            Tag: new Map(),
            JenisHubunganKerja: new Map(),
            KategoriPangkat: new Map(),
            Golongan: new Map(),
            SubGolongan: new Map()
        };

        const loadToCache = async (model: any, key: string) => {
            const items = await model.findAll();
            items.forEach((item: any) => {
                if (item.nama) cache[key].set(item.nama.toLowerCase().trim(), item.id);
            });
        };

        await Promise.all([
            loadToCache(Divisi, 'Divisi'),
            loadToCache(Department, 'Department'),
            loadToCache(PosisiJabatan, 'PosisiJabatan'),
            loadToCache(StatusKaryawan, 'StatusKaryawan'),
            loadToCache(LokasiKerja, 'LokasiKerja'),
            loadToCache(Tag, 'Tag'),
            loadToCache(JenisHubunganKerja, 'JenisHubunganKerja'),
            loadToCache(KategoriPangkat, 'KategoriPangkat'),
            loadToCache(Golongan, 'Golongan'),
            loadToCache(SubGolongan, 'SubGolongan'),
        ]);

        return cache;
    }

    async lookupMasterData(type: string, nama: string, cache: any): Promise<number | null> {
        if (!nama) return null;
        const normalized = nama.toLowerCase().trim();
        if (cache[type] && cache[type].has(normalized)) {
            return cache[type].get(normalized);
        }
        return null;
    }

    async mapExcelRowToEmployee(row: any, mapping: ExcelMapping, masterCache: any): Promise<any> {
        const employeeData: any = {};
        const personalInfoData: any = {};
        const hrInfoData: any = {};
        const familyInfoData: any = {};
        const rawValues: any = {};

        const getValue = (dbField: string, excelHeaderFallback?: string) => {
            const excelHeader = Object.keys(mapping.employeeProfile).find(key => mapping.employeeProfile[key] === dbField);
            const val = excelHeader ? row[excelHeader] : (excelHeaderFallback ? row[excelHeaderFallback] : undefined);
            if (dbField) rawValues[`${dbField}_raw`] = val;
            return val;
        };

        const parseDate = (val: any) => {
            if (!val) return null;
            if (val instanceof Date) return val.toISOString().split('T')[0];
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
        };

        const checkLookup = async (type: string, dbField: string, excelKey: string) => {
            const val = getValue(dbField, excelKey);
            if (val) {
                const id = await this.lookupMasterData(type, val, masterCache);
                return id;
            }
            return null;
        };

        // --- EMPLOYEE DATA (Core) ---
        employeeData.nama_lengkap = getValue('nama_lengkap', 'NAMA LENGKAP');
        employeeData.nomor_induk_karyawan = getValue('nomor_induk_karyawan', 'NOMOR INDUK KARYAWAN');
        employeeData.email_perusahaan = getValue('email_perusahaan', 'EMAIL PERUSAHAAN');
        employeeData.nomor_handphone = getValue('nomor_handphone', 'NOMOR HP 1');
        employeeData.is_draft = false;

        // Foreign Keys Master Data
        employeeData.divisi_id = await checkLookup('Divisi', 'divisi_id', 'DIVISI');
        employeeData.department_id = await checkLookup('Department', 'department_id', 'DEPARTMENT');
        employeeData.posisi_jabatan_id = await checkLookup('PosisiJabatan', 'posisi_jabatan_id', 'POSISI JABATAN');
        employeeData.status_karyawan_id = (await checkLookup('StatusKaryawan', 'status_karyawan_id', 'STATUS KARYAWAN')) || 1; // Default to Aktif (ID 1)
        employeeData.lokasi_kerja_id = await checkLookup('LokasiKerja', 'lokasi_kerja_id', 'LOKASI KERJA');
        employeeData.tag_id = await checkLookup('Tag', 'tag_id', 'TAG'); // New Tag Mapping

        // Reporting Line Lookup (Manager & Atasan)
        // We need to look up employee IDs based on Names or NIKs provided in Excel.
        // Optimization: We could cache employees map (Name/NIK -> ID) in loadMasterDataCache if dataset is small,
        // or query one by one. For bulk import, getting all employees might be better.
        // For now, let's simple query.
        const findEmployeeId = async (nameOrNik: string) => {
            if (!nameOrNik) return null;
            // Try cache first if we implemented it, otherwise query
            const emp = await import('../models/Employee').then(m => m.default.findOne({
                where: sequelize.or(
                    { nomor_induk_karyawan: nameOrNik },
                    { nama_lengkap: nameOrNik }
                )
            }));
            return emp ? emp.id : null;
        };

        const managerVal = getValue('manager_id', 'MANAGER');
        if (managerVal) employeeData.manager_id = await findEmployeeId(managerVal);

        const atasanVal = getValue('atasan_langsung_id', 'ATASAN LANGSUNG');
        if (atasanVal) employeeData.atasan_langsung_id = await findEmployeeId(atasanVal);


        // --- PERSONAL INFO ---
        personalInfoData.tempat_lahir = getValue('tempat_lahir', 'TEMPAT LAHIR');
        personalInfoData.tanggal_lahir = parseDate(getValue('tanggal_lahir', 'TANGGAL LAHIR'));
        personalInfoData.jenis_kelamin = getValue('jenis_kelamin', 'JENIS KELAMIN') === 'L' ? 'Laki-laki' : (getValue('jenis_kelamin', 'JENIS KELAMIN') === 'P' ? 'Perempuan' : getValue('jenis_kelamin', 'JENIS KELAMIN'));
        personalInfoData.agama = getValue('agama', 'AGAMA');
        personalInfoData.email_pribadi = getValue('email_pribadi', 'EMAIL PRIBADI');

        personalInfoData.alamat_domisili = getValue('alamat_domisili', 'ALAMAT DOMISILI');
        personalInfoData.kota_domisili = getValue('kota_domisili', 'KOTA DOMISILI');
        personalInfoData.provinsi_domisili = getValue('propinsi_domisili', 'PROPINSI DOMISILI');
        personalInfoData.nomor_telepon_rumah_1 = getValue('nomor_telepon_rumah_1', 'NOMOR TELEPON RUMAH 1');
        personalInfoData.nomor_telepon_rumah_2 = getValue('nomor_telepon_rumah_2', 'NOMOR TELEPON RUMAH 2');
        personalInfoData.nomor_handphone_2 = getValue('nomor_handphone_2', 'NOMOR HP 2');

        personalInfoData.golongan_darah = getValue('golongan_darah', 'GOLONGAN DARAH');
        personalInfoData.nomor_ktp = getValue('nomor_ktp', 'NOMOR KTP');
        personalInfoData.alamat_ktp = getValue('alamat_ktp', 'ALAMAT KTP');
        personalInfoData.nomor_npwp = getValue('nomor_npwp', 'NOMOR NPWP');
        personalInfoData.nomor_bpjs = getValue('nomor_bpjs', 'NOMOR BPJS-TK');

        // New Personal Info Fields
        personalInfoData.nomor_kartu_keluarga = getValue('nomor_kartu_keluarga', 'NOMOR KARTU KELUARGA');
        personalInfoData.no_nik_kk = getValue('no_nik_kk', 'NOMOR NIK KK');

        personalInfoData.nomor_rekening = getValue('nomor_rekening', 'NOMOR REKENING');
        personalInfoData.nama_pemegang_rekening = getValue('nama_pemegang_rekening', 'NAMA PEMILIK REKENING');
        personalInfoData.nama_bank = getValue('nama_bank', 'NAMA BANK');
        personalInfoData.cabang_bank = getValue('cabang_bank', 'CABANG BANK');

        personalInfoData.status_pernikahan = getValue('status_pernikahan', 'STATUS PERNIKAHAN');
        personalInfoData.tanggal_menikah = parseDate(getValue('tanggal_menikah', 'TANGGAL MENIKAH'));
        personalInfoData.tanggal_cerai = parseDate(getValue('tanggal_cerai', 'TANGGAL CERAI'));
        personalInfoData.tanggal_wafat_pasangan = parseDate(getValue('tanggal_wafat_pasangan', 'TANGGAL WAFAT PASANGAN'));
        personalInfoData.nama_pasangan = getValue('nama_pasangan', 'NAMA PASANGAN NIKAH');
        const tglLahirPasangan = parseDate(getValue('tanggal_lahir_pasangan', 'TANGGAL LAHIR PASANGAN'));
        personalInfoData.pekerjaan_pasangan = getValue('pekerjaan_pasangan', 'PEKERJAAN PASANGAN');
        const jmlAnakVal = getValue('jumlah_anak', 'JUMLAH ANAK');
        personalInfoData.jumlah_anak = jmlAnakVal ? parseInt(jmlAnakVal) : 0;
        personalInfoData.status_pajak = getValue('status_pajak', 'STATUS PAJAK');

        // --- HR INFO ---
        hrInfoData.tanggal_masuk = parseDate(getValue('tanggal_masuk', 'TANGGAL MASUK'));
        hrInfoData.tanggal_masuk_group = parseDate(getValue('tanggal_join_group', 'TANGGAL JOIN GROUP'));
        hrInfoData.tanggal_permanent = parseDate(getValue('tanggal_tetap', 'TANGGAL TETAP'));
        hrInfoData.tanggal_kontrak = parseDate(getValue('tanggal_awal_kontrak', 'TANGGAL AWAL KONTRAK'));
        hrInfoData.tanggal_akhir_kontrak = parseDate(getValue('tanggal_akhir_kontrak', 'TANGGAL AKHIR KONTRAK'));
        hrInfoData.tanggal_berhenti = parseDate(getValue('tanggal_keluar', 'TANGGAL KELUAR'));

        hrInfoData.lokasi_costing = getValue('lokasi_costing', 'LOKASI COSTING');
        hrInfoData.actual = getValue('actual', 'ACTUAL');
        hrInfoData.assign = getValue('assign', 'ASSIGN');
        hrInfoData.siklus_pembayaran_gaji = getValue('siklus_pembayaran_gaji', 'SIKLUS PEMBAYARAN'); // New

        hrInfoData.kategori_pangkat_id = await checkLookup('KategoriPangkat', 'kategori_pangkat_id', 'PANGKAT KATEGORI');
        hrInfoData.golongan_pangkat_id = await checkLookup('Golongan', 'golongan_pangkat_id', 'GOLONGAN');
        hrInfoData.sub_golongan_pangkat_id = await checkLookup('SubGolongan', 'sub_golongan_pangkat_id', 'SUB GOLONGAN');
        hrInfoData.jenis_hubungan_kerja_id = await checkLookup('JenisHubunganKerja', 'jenis_hubungan_kerja_id', 'JENIS HUBUNGAN KERJA');

        hrInfoData.no_dana_pensiun = getValue('no_dana_pensiun', 'NOMOR DANA PENSIUN');

        // Education
        hrInfoData.tingkat_pendidikan = getValue('pendidikan', 'PENDIDIKAN TERAKHIR');
        hrInfoData.bidang_studi = getValue('jurusan', 'JURUSAN PENDIDIKAN');
        hrInfoData.nama_sekolah = getValue('sekolah', 'NAMA SEKOLAH');
        hrInfoData.kota_sekolah = getValue('kota_sekolah', 'KOTA SEKOLAH');
        hrInfoData.status_kelulusan = getValue('status_pendidikan', 'STATUS PENDIDIKAN');
        hrInfoData.keterangan_pendidikan = getValue('ket_pendidikan', 'KETERANGAN PENDIDIKAN');

        // New HR Info Fields (Emergency Contacts, Historical, Uniforms)
        hrInfoData.nama_kontak_darurat_1 = getValue('nama_kontak_darurat_1', 'NAMA KONTAK DARURAT 1');
        hrInfoData.hubungan_kontak_darurat_1 = getValue('hubungan_kontak_darurat_1', 'HUBUNGAN KONTAK DARURAT 1');
        hrInfoData.alamat_kontak_darurat_1 = getValue('alamat_kontak_darurat_1', 'ALAMAT KONTAK DARURAT 1');
        hrInfoData.nomor_telepon_kontak_darurat_1 = getValue('nomor_telepon_kontak_darurat_1', 'NOMOR HP1 KONTAK DARURAT 1');
        // Note: Template has HP1 and HP2 for Contact 1? Or Contact 2? 
        // Template: "NOMOR HP1 KONTAK DARURAT 1", "NOMOR HP2 KONTAK DARURAT 1". 
        // DB only has `nomor_telepon_kontak_darurat_1`. We'll map HP1 to it.

        // We don't see Contact 2 in the template log provided? 
        // Log showed: [127] NAMA KONTAK DARURAT 1 ... [131] NOMOR HP2 KONTAK DARURAT 1.
        // It seems only Contact 1 is in template? Or I missed scrolling.
        // I will map Contact 1 for now.

        hrInfoData.ukuran_sepatu_kerja = getValue('ukuran_sepatu_kerja', 'UKURAN SEPATU');
        hrInfoData.ukuran_seragam_kerja = getValue('ukuran_seragam_kerja', 'UKURAN BAJU');

        hrInfoData.lokasi_sebelumnya_id = await checkLookup('LokasiKerja', 'lokasi_sebelumnya_id', 'LOKASI SEBELUMNYA'); // Needs lookup
        hrInfoData.tanggal_mutasi = parseDate(getValue('tanggal_mutasi', 'TANGGAL MUTASI'));

        hrInfoData.point_of_original = getValue('point_of_original', 'POINT OF ORIGINAL');
        hrInfoData.point_of_hire = getValue('point_of_hire', 'POINT OF HIRE');


        // --- FAMILY INFO ---
        familyInfoData.tanggal_lahir_pasangan = tglLahirPasangan;
        familyInfoData.pendidikan_terakhir_pasangan = getValue('pendidikan_pasangan', 'PENDIDIKAN TERAKHIR PASANGAN');
        familyInfoData.keterangan_pasangan = getValue('ket_pasangan', 'KETERANGAN PASANGAN');

        // Parent Data
        familyInfoData.nama_ayah_kandung = getValue('nama_ayah_kandung', 'NAMA BAPAK KANDUNG');
        familyInfoData.nama_ibu_kandung = getValue('nama_ibu_kandung', 'NAMA IBU KANDUNG');

        return { employeeData, personalInfoData, hrInfoData, familyInfoData, rawValues };
    }

    async validateEmployeeData(data: any): Promise<string[]> {
        const { employeeData, rawValues } = data;
        const errors: string[] = [];

        if (!employeeData.nama_lengkap) errors.push("Nama Lengkap wajib diisi");
        if (!employeeData.nomor_induk_karyawan) errors.push("No Induk Karyawan wajib diisi");

        // FK Validation & Relationship Validation
        // 1. Divisi
        if (rawValues.divisi_id_raw && !employeeData.divisi_id) {
            errors.push(`Divisi '${rawValues.divisi_id_raw}' tidak ditemukan dalam master data`);
        }

        // 2. Department
        if (rawValues.department_id_raw && !employeeData.department_id) {
            errors.push(`Department '${rawValues.department_id_raw}' tidak ditemukan`);
        } else if (employeeData.divisi_id && employeeData.department_id) {
            // Check Relation Divisi-Dept
            const relCheck = await validateDepartmentBelongsToDivisi(employeeData.department_id, employeeData.divisi_id);
            if (!relCheck.valid) errors.push(`Department '${rawValues.department_id_raw}' tidak sesuai dengan Divisi '${rawValues.divisi_id_raw}'`);
        }

        // 3. Posisi
        if (rawValues.posisi_jabatan_id_raw && !employeeData.posisi_jabatan_id) {
            errors.push(`Posisi '${rawValues.posisi_jabatan_id_raw}' tidak ditemukan`);
        } else if (employeeData.department_id && employeeData.posisi_jabatan_id) {
            // Check Relation Dept-Posisi
            const relCheck = await validatePosisiJabatanBelongsToDepartment(employeeData.posisi_jabatan_id, employeeData.department_id);
            if (!relCheck.valid) errors.push(`Posisi '${rawValues.posisi_jabatan_id_raw}' tidak sesuai dengan Department '${rawValues.department_id_raw}'`);
        }

        // 4. Status Karyawan
        if (rawValues.status_karyawan_id_raw && !employeeData.status_karyawan_id) {
            errors.push(`Status Karyawan '${rawValues.status_karyawan_id_raw}' tidak ditemukan`);
        }

        // 5. Lokasi Kerja
        if (rawValues.lokasi_kerja_id_raw && !employeeData.lokasi_kerja_id) {
            errors.push(`Lokasi Kerja '${rawValues.lokasi_kerja_id_raw}' tidak ditemukan`);
        }

        return errors;
    }

    async importEmployees(filePath: string): Promise<ImportResult> {
        const { workbook, rows } = await this.parseExcelFile(filePath);
        const mapping = await this.getMappingConfiguration(workbook);
        const masterCache = await this.loadMasterDataCache();

        const result: ImportResult = { success: 0, failed: 0, total: rows.length, errors: [] };
        const validEmployees: any[] = [];

        // Phase 1: Validation
        for (const row of rows) {
            try {
                const mappedData = await this.mapExcelRowToEmployee(row, mapping, masterCache);
                const validationErrors = await this.validateEmployeeData(mappedData);

                // Additional Duplicate Checks
                if (validationErrors.length === 0) {
                    // Check for duplicates WITHIN the file being imported
                    const isDuplicateInFile = validEmployees.some(e => e.employeeData.nomor_induk_karyawan === mappedData.employeeData.nomor_induk_karyawan);
                    if (isDuplicateInFile) {
                        validationErrors.push(`Duplicate NIK in file: ${mappedData.employeeData.nomor_induk_karyawan}`);
                    }

                    // Note: We removed the check for "already registered in system" because we now support Upsert (Update if exists).
                }

                if (validationErrors.length > 0) {
                    result.failed++;
                    // Join multiple errors with semicolon or newline
                    result.errors.push({
                        row: row._rowNumber,
                        message: validationErrors.join('; '),
                        data: row
                    });
                } else {
                    validEmployees.push(mappedData);
                }
            } catch (e: any) {
                result.failed++;
                result.errors.push({ row: row._rowNumber, message: e.message || 'Mapping Error', data: row });
            }
        }

        // Phase 2: Bulk Insert/Update in Transaction
        if (validEmployees.length > 0) {
            const t = await sequelize.transaction();
            try {
                for (const item of validEmployees) {
                    try {
                        // Check if NIK exists to determine Create vs Update
                        const existingEmployee = await employeeService.validateNIKUnique(item.employeeData.nomor_induk_karyawan)
                            ? null
                            : await import('../models/Employee').then(m => m.default.findOne({ where: { nomor_induk_karyawan: item.employeeData.nomor_induk_karyawan }, transaction: t }));

                        if (existingEmployee) {
                            // UDPATE
                            await employeeService.updateEmployeeComplete(
                                existingEmployee.id,
                                item.employeeData,
                                item.personalInfoData,
                                item.hrInfoData,
                                item.familyInfoData,
                                undefined,
                                { transaction: t }
                            );
                        } else {
                            // CREATE
                            await employeeService.createEmployeeComplete(
                                item.employeeData,
                                item.personalInfoData,
                                item.hrInfoData,
                                item.familyInfoData,
                                undefined,
                                { transaction: t }
                            );
                        }
                        result.success++;
                    } catch (e: any) {
                        // If ANY operation fails, we must rollback ALL 
                        throw new Error(`DB Error for NIK ${item.employeeData.nomor_induk_karyawan}: ${e.message}`);
                    }
                }
                await t.commit();
            } catch (e: any) {
                await t.rollback();
                // If rollback, all "success" must be reverted to failed
                result.failed += result.success;
                result.success = 0;
                result.errors.push({ row: 0, message: `Import Transaction Failed: ${e.message}` });
            }
        }

        return result;
    }

    async importMasterData(filePath: string, type: string): Promise<ImportResult> {
        const { rows } = await this.parseExcelFile(filePath);

        const result: ImportResult = { success: 0, failed: 0, total: rows.length, errors: [] };

        // Define models map
        const models: any = {
            'divisi': Divisi,
            'department': Department,
            'posisi': PosisiJabatan,
            'status': StatusKaryawan,
            'lokasi': LokasiKerja
        };

        const Model = models[type.toLowerCase()];
        if (!Model) {
            throw new Error(`Master data type '${type}' not supported`);
        }

        const t = await sequelize.transaction();
        try {
            for (const row of rows) {
                try {
                    // Generic mapping: Name/Nama is required
                    const name = row['Nama'] || row['Name'] || row['nama'];
                    if (!name) throw new Error('Nama is required');

                    // Check existence
                    // @ts-ignore
                    const existing = await Model.findOne({ where: { nama: name }, transaction: t });
                    if (!existing) {
                        // @ts-ignore
                        await Model.create({ nama: name }, { transaction: t });
                        result.success++;
                    }
                } catch (e: any) {
                    result.failed++;
                    result.errors.push({ row: row._rowNumber, message: e.message, data: row });
                }
            }
            await t.commit();
        } catch (e: any) {
            await t.rollback();
            result.failed += result.success;
            result.success = 0;
            result.errors.push({ row: 0, message: `Transaction Validation Failed: ${e.message}` });
        }

        return result;
    }

    async generateErrorReport(errors: ImportError[]): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Error Report');
        sheet.columns = [
            { header: 'No. Baris', key: 'row', width: 10 },
            { header: 'Pesan Error', key: 'message', width: 50 },
            { header: 'Data', key: 'data', width: 100 }
        ];

        errors.forEach(err => {
            sheet.addRow({
                row: err.row,
                message: err.message,
                data: JSON.stringify(err.data)
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer as any);
    }
}

export default new ExcelImportService();
