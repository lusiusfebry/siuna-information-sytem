
import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import Employee from '../models/Employee';
import EmployeePersonalInfo from '../models/EmployeePersonalInfo';
import EmployeeHRInfo from '../models/EmployeeHRInfo';
import EmployeeFamilyInfo from '../models/EmployeeFamilyInfo';
import Divisi from '../models/Divisi';
import Department from '../models/Department';
import PosisiJabatan from '../models/PosisiJabatan';
import StatusKaryawan from '../models/StatusKaryawan';
import LokasiKerja from '../models/LokasiKerja';
import Tag from '../models/Tag';
import { Op, WhereOptions } from 'sequelize';
import employeeService from './employee.service';
import moment from 'moment';

class ExportService {
    async exportEmployeesToExcel(params: any): Promise<Buffer> {
        const { search, divisi_id, department_id, status_id, posisi_jabatan_id, lokasi_kerja_id, tag_id } = params;

        const where: WhereOptions<Employee> = {};

        // Search functionality
        if (search) {
            (where as any)[Op.or] = [
                { nama_lengkap: { [Op.iLike]: `%${search}%` } },
                { nomor_induk_karyawan: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Filters
        if (divisi_id) where.divisi_id = divisi_id;
        if (department_id) where.department_id = department_id;
        if (status_id) where.status_karyawan_id = status_id;
        if (posisi_jabatan_id) where.posisi_jabatan_id = posisi_jabatan_id;
        if (lokasi_kerja_id) where.lokasi_kerja_id = lokasi_kerja_id;
        if (tag_id) where.tag_id = tag_id;

        const employees = await Employee.findAll({
            where,
            include: [
                { model: Divisi, as: 'divisi' },
                { model: Department, as: 'department' },
                { model: PosisiJabatan, as: 'posisi_jabatan' },
                { model: StatusKaryawan, as: 'status_karyawan' },
                { model: LokasiKerja, as: 'lokasi_kerja' },
                { model: Tag, as: 'tag' },
                { model: Employee, as: 'manager' },
                { model: Employee, as: 'atasan_langsung' },
                { model: EmployeePersonalInfo, as: 'personal_info' },
                {
                    model: EmployeeHRInfo,
                    as: 'hr_info',
                    include: ['jenis_hubungan_kerja', 'kategori_pangkat', 'golongan_pangkat', 'sub_golongan_pangkat', 'lokasi_sebelumnya']
                },
                { model: EmployeeFamilyInfo, as: 'family_info' }
            ],
            order: [['createdAt', 'DESC']]
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'HR System';
        workbook.created = new Date();

        const headerStyle = {
            font: { bold: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } } as ExcelJS.Fill
        };

        // --- Sheet 1: Data Karyawan ---
        const sheet1 = workbook.addWorksheet('Data Karyawan');
        sheet1.columns = [
            { header: 'NIK', key: 'nik', width: 15 },
            { header: 'Nama Lengkap', key: 'nama', width: 30 },
            { header: 'Email Kantor', key: 'email', width: 25 },
            { header: 'Nomor HP', key: 'phone', width: 15 },
            { header: 'Divisi', key: 'divisi', width: 20 },
            { header: 'Departemen', key: 'department', width: 20 },
            { header: 'Posisi', key: 'posisi', width: 20 },
            { header: 'Manager', key: 'manager', width: 25 },
            { header: 'Atasan Langsung', key: 'atasan', width: 25 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Lokasi', key: 'lokasi', width: 15 },
            { header: 'Tag', key: 'tag', width: 15 },
            { header: 'Tanggal Bergabung', key: 'join_date', width: 15 } // Fallback to HR info if needed
        ];
        sheet1.getRow(1).font = headerStyle.font;
        sheet1.getRow(1).fill = headerStyle.fill;

        // --- Sheet 2: Informasi Personal ---
        const sheet2 = workbook.addWorksheet('Informasi Personal');
        sheet2.columns = [
            { header: 'NIK', key: 'nik', width: 15 },
            { header: 'Nama Lengkap', key: 'nama', width: 30 },
            { header: 'Jenis Kelamin', key: 'gender', width: 15 },
            { header: 'Tempat Lahir', key: 'birth_place', width: 20 },
            { header: 'Tanggal Lahir', key: 'birth_date', width: 15 },
            { header: 'Status Pernikahan', key: 'marital_status', width: 15 },
            { header: 'Agama', key: 'religion', width: 15 },
            { header: 'Golongan Darah', key: 'blood_type', width: 10 },
            { header: 'NIK KTP', key: 'nik_ktp', width: 20 },
            { header: 'NIK KK', key: 'no_nik_kk', width: 20 },
            { header: 'No KK', key: 'no_kk', width: 20 },
            { header: 'NPWP', key: 'npwp', width: 20 },
            { header: 'Status Pajak', key: 'tax_status', width: 10 },
            { header: 'BPJS Kesehatan', key: 'bpjs', width: 20 },
            { header: 'Email Pribadi', key: 'personal_email', width: 25 },
            { header: 'No HP 2', key: 'phone2', width: 15 },
            { header: 'Telp Rumah 1', key: 'home_phone1', width: 15 },
            { header: 'Telp Rumah 2', key: 'home_phone2', width: 15 },
            { header: 'WhatsApp', key: 'wa', width: 15 },
            { header: 'Sosmed', key: 'sosmed', width: 20 },
            { header: 'Alamat KTP', key: 'address_ktp', width: 40 },
            { header: 'Kota KTP', key: 'city_ktp', width: 20 },
            { header: 'Provinsi KTP', key: 'prov_ktp', width: 20 },
            { header: 'Alamat Domisili', key: 'address_domicile', width: 40 },
            { header: 'Kota Domisili', key: 'city_domicile', width: 20 },
            { header: 'Provinsi Domisili', key: 'prov_domicile', width: 20 },
            { header: 'Kode Pos', key: 'zip_code', width: 10 },
            { header: 'Nama Bank', key: 'bank_name', width: 20 },
            { header: 'Cabang Bank', key: 'bank_branch', width: 20 },
            { header: 'No Rekening', key: 'account_number', width: 20 },
            { header: 'Nama Pemegang Rek', key: 'account_holder', width: 30 },
            { header: 'Jumlah Anak', key: 'child_count', width: 10 }
        ];
        sheet2.getRow(1).font = headerStyle.font;
        sheet2.getRow(1).fill = headerStyle.fill;

        // --- Sheet 3: Informasi HR ---
        const sheet3 = workbook.addWorksheet('Informasi HR');
        sheet3.columns = [
            { header: 'NIK', key: 'nik', width: 15 },
            { header: 'Nama Lengkap', key: 'nama', width: 30 },
            { header: 'Hubungan Kerja', key: 'hubungan_kerja', width: 20 },
            { header: 'Tgl Masuk (Group)', key: 'tgl_masuk_group', width: 15 },
            { header: 'Tgl Masuk', key: 'tgl_masuk', width: 15 },
            { header: 'Tgl Permanent', key: 'tgl_permanent', width: 15 },
            { header: 'Tgl Kontrak', key: 'tgl_kontrak', width: 15 },
            { header: 'Akhir Kontrak', key: 'akhir_kontrak', width: 15 },
            { header: 'Tgl Berhenti', key: 'tgl_berhenti', width: 15 },
            { header: 'Pendidikan', key: 'pendidikan', width: 20 },
            { header: 'Jurusan', key: 'jurusan', width: 25 },
            { header: 'Sekolah', key: 'sekolah', width: 25 },
            { header: 'Kota Sekolah', key: 'school_city', width: 20 },
            { header: 'Status Lulus', key: 'grad_status', width: 15 },
            { header: 'Ket. Pendidikan', key: 'edu_note', width: 30 },
            { header: 'Kategori Pangkat', key: 'kategori_pangkat', width: 20 },
            { header: 'Golongan', key: 'golongan', width: 10 },
            { header: 'Sub Golongan', key: 'sub_golongan', width: 10 },
            { header: 'Dana Pensiun', key: 'pensiun', width: 20 },
            { header: 'Kontak Darurat 1', key: 'kd1_nama', width: 25 },
            { header: 'Hubungan KD 1', key: 'kd1_relasi', width: 15 },
            { header: 'Telp KD 1', key: 'kd1_telp', width: 15 },
            { header: 'Alamat KD 1', key: 'kd1_alamat', width: 30 },
            { header: 'Kontak Darurat 2', key: 'kd2_nama', width: 25 },
            { header: 'Hubungan KD 2', key: 'kd2_relasi', width: 15 },
            { header: 'Telp KD 2', key: 'kd2_telp', width: 15 },
            { header: 'Alamat KD 2', key: 'kd2_alamat', width: 30 },
            { header: 'Point of Original', key: 'poo', width: 20 },
            { header: 'Point of Hire', key: 'poh', width: 20 },
            { header: 'Ukuran Baju', key: 'baju', width: 10 },
            { header: 'Ukuran Sepatu', key: 'sepatu', width: 10 },
            { header: 'Lokasi Sebelum', key: 'prev_loc', width: 20 },
            { header: 'Tgl Mutasi', key: 'mut_date', width: 15 },
            { header: 'Siklus Gaji', key: 'payroll_cycle', width: 20 },
            { header: 'Costing', key: 'costing', width: 20 },
            { header: 'Assign', key: 'assign', width: 20 },
            { header: 'Actual', key: 'actual', width: 20 }
        ];
        sheet3.getRow(1).font = headerStyle.font;
        sheet3.getRow(1).fill = headerStyle.fill;

        // --- Sheet 4: Informasi Keluarga ---
        const sheet4 = workbook.addWorksheet('Informasi Keluarga');
        sheet4.columns = [
            { header: 'NIK', key: 'nik', width: 15 },
            { header: 'Nama Lengkap', key: 'nama', width: 30 },
            { header: 'Nama Pasangan', key: 'nama_pasangan', width: 25 },
            { header: 'Tgl Lahir Pasangan', key: 'tgl_lahir_pasangan', width: 15 },
            { header: 'Pend. Pasangan', key: 'edu_pasangan', width: 15 },
            { header: 'Pek. Pasangan', key: 'job_pasangan', width: 15 },
            { header: 'Ket. Pasangan', key: 'note_pasangan', width: 20 },
            { header: 'Tgl Menikah', key: 'tgl_nikah', width: 15 },
            { header: 'Tgl Cerai', key: 'tgl_cerai', width: 15 },
            { header: 'Tgl Wafat Pasangan', key: 'tgl_wafat', width: 15 },
            { header: 'Ayah Kandung', key: 'ayah_kandung', width: 25 },
            { header: 'Ibu Kandung', key: 'ibu_kandung', width: 25 },
            { header: 'Alamat Orang Tua', key: 'alamat_ortu', width: 40 },
            { header: 'Ayah Mertua', key: 'ayah_mertua', width: 25 },
            { header: 'Tgl Lhr Ayah Mertua', key: 'tgl_ayah_mertua', width: 15 },
            { header: 'Pend. Ayah Mertua', key: 'edu_ayah_mertua', width: 15 },
            { header: 'Ket. Ayah Mertua', key: 'note_ayah_mertua', width: 20 },
            { header: 'Ibu Mertua', key: 'ibu_mertua', width: 25 },
            { header: 'Tgl Lhr Ibu Mertua', key: 'tgl_ibu_mertua', width: 15 },
            { header: 'Pend. Ibu Mertua', key: 'edu_ibu_mertua', width: 15 },
            { header: 'Ket. Ibu Mertua', key: 'note_ibu_mertua', width: 20 },
            { header: 'Anak', key: 'data_anak', width: 50 },
            { header: 'Saudara Kandung', key: 'data_saudara', width: 50 }
        ];
        sheet4.getRow(1).font = headerStyle.font;
        sheet4.getRow(1).fill = headerStyle.fill;

        // Populate Data
        employees.forEach((emp: any) => {
            const common = {
                nik: emp.nomor_induk_karyawan,
                nama: emp.nama_lengkap
            };

            // Sheet 1
            sheet1.addRow({
                ...common,
                email: emp.email_perusahaan,
                phone: emp.nomor_handphone,
                divisi: emp.divisi?.nama || '-',
                department: emp.department?.nama || '-',
                posisi: emp.posisi_jabatan?.nama || '-',
                manager: emp.manager?.nama_lengkap || '-',
                atasan: emp.atasan_langsung?.nama_lengkap || '-',
                status: emp.status_karyawan?.nama || '-',
                lokasi: emp.lokasi_kerja?.nama || '-',
                tag: emp.tag?.nama || '-',
                join_date: emp.hr_info?.tanggal_masuk ? moment(emp.hr_info.tanggal_masuk).format('YYYY-MM-DD') : '-'
            });

            // Sheet 2
            const personal = emp.personal_info;
            sheet2.addRow({
                ...common,
                gender: personal?.jenis_kelamin || '-',
                birth_place: personal?.tempat_lahir || '-',
                birth_date: personal?.tanggal_lahir ? moment(personal.tanggal_lahir).format('YYYY-MM-DD') : '-',
                marital_status: personal?.status_pernikahan || '-',
                religion: personal?.agama || '-',
                blood_type: personal?.golongan_darah || '-',
                nik_ktp: personal?.nomor_ktp || '-',
                no_nik_kk: personal?.no_nik_kk || '-',
                no_kk: personal?.nomor_kartu_keluarga || '-',
                npwp: personal?.nomor_npwp || '-',
                tax_status: personal?.status_pajak || '-',
                bpjs: personal?.nomor_bpjs || '-',
                personal_email: personal?.email_pribadi || '-',
                phone2: personal?.nomor_handphone_2 || '-',
                home_phone1: personal?.nomor_telepon_rumah_1 || '-',
                home_phone2: personal?.nomor_telepon_rumah_2 || '-',
                wa: personal?.nomor_wa || '-',
                sosmed: personal?.akun_sosmed || '-',
                address_ktp: personal?.alamat_ktp || '-',
                city_ktp: personal?.kota_ktp || '-',
                prov_ktp: personal?.provinsi_ktp || '-',
                address_domicile: personal?.alamat_domisili || '-',
                city_domicile: personal?.kota_domisili || '-',
                prov_domicile: personal?.provinsi_domisili || '-',
                zip_code: personal?.kode_pos || '-',
                bank_name: personal?.nama_bank || '-',
                bank_branch: personal?.cabang_bank || '-',
                account_number: personal?.nomor_rekening || '-',
                account_holder: personal?.nama_pemegang_rekening || '-',
                child_count: personal?.jumlah_anak || 0
            });

            // Sheet 3
            const hr = emp.hr_info;
            sheet3.addRow({
                ...common,
                hubungan_kerja: hr?.jenis_hubungan_kerja?.nama || '-',
                tgl_masuk_group: hr?.tanggal_masuk_group ? moment(hr.tanggal_masuk_group).format('YYYY-MM-DD') : '-',
                tgl_masuk: hr?.tanggal_masuk ? moment(hr.tanggal_masuk).format('YYYY-MM-DD') : '-',
                tgl_permanent: hr?.tanggal_permanent ? moment(hr.tanggal_permanent).format('YYYY-MM-DD') : '-',
                tgl_kontrak: hr?.tanggal_kontrak ? moment(hr.tanggal_kontrak).format('YYYY-MM-DD') : '-',
                akhir_kontrak: hr?.tanggal_akhir_kontrak ? moment(hr.tanggal_akhir_kontrak).format('YYYY-MM-DD') : '-',
                tgl_berhenti: hr?.tanggal_berhenti ? moment(hr.tanggal_berhenti).format('YYYY-MM-DD') : '-',
                pendidikan: hr?.tingkat_pendidikan || '-',
                jurusan: hr?.bidang_studi || '-',
                sekolah: hr?.nama_sekolah || '-',
                school_city: hr?.kota_sekolah || '-',
                grad_status: hr?.status_kelulusan || '-',
                edu_note: hr?.keterangan_pendidikan || '-',
                kategori_pangkat: hr?.kategori_pangkat?.nama || '-',
                golongan: hr?.golongan_pangkat?.nama || '-',
                sub_golongan: hr?.sub_golongan_pangkat?.nama || '-',
                pensiun: hr?.no_dana_pensiun || '-',
                kd1_nama: hr?.nama_kontak_darurat_1 || '-',
                kd1_relasi: hr?.hubungan_kontak_darurat_1 || '-',
                kd1_telp: hr?.nomor_telepon_kontak_darurat_1 || '-',
                kd1_alamat: hr?.alamat_kontak_darurat_1 || '-',
                kd2_nama: hr?.nama_kontak_darurat_2 || '-',
                kd2_relasi: hr?.hubungan_kontak_darurat_2 || '-',
                kd2_telp: hr?.nomor_telepon_kontak_darurat_2 || '-',
                kd2_alamat: hr?.alamat_kontak_darurat_2 || '-',
                poo: hr?.point_of_original || '-',
                poh: hr?.point_of_hire || '-',
                baju: hr?.ukuran_seragam_kerja || '-',
                sepatu: hr?.ukuran_sepatu_kerja || '-',
                prev_loc: hr?.lokasi_sebelumnya?.nama || '-',
                mut_date: hr?.tanggal_mutasi ? moment(hr.tanggal_mutasi).format('YYYY-MM-DD') : '-',
                payroll_cycle: hr?.siklus_pembayaran_gaji || '-',
                costing: hr?.costing || '-',
                assign: hr?.assign || '-',
                actual: hr?.actual || '-'
            });

            // Sheet 4
            const fam = emp.family_info;
            const anakList = fam?.data_anak && Array.isArray(fam.data_anak)
                ? fam.data_anak.map((a: any) => `${a.nama} (${moment(a.tanggal_lahir).format('YYYY')})`).join(', ')
                : '-';

            const saudaraList = fam?.data_saudara_kandung && Array.isArray(fam.data_saudara_kandung)
                ? fam.data_saudara_kandung.map((s: any) => `${s.nama} (${s.jenis_kelamin})`).join(', ')
                : '-';

            sheet4.addRow({
                ...common,
                nama_pasangan: personal?.nama_pasangan || '-',
                tgl_lahir_pasangan: fam?.tanggal_lahir_pasangan ? moment(fam.tanggal_lahir_pasangan).format('YYYY-MM-DD') : '-',
                edu_pasangan: fam?.pendidikan_terakhir_pasangan || '-',
                job_pasangan: personal?.pekerjaan_pasangan || '-',
                note_pasangan: fam?.keterangan_pasangan || '-',
                tgl_nikah: personal?.tanggal_menikah ? moment(personal.tanggal_menikah).format('YYYY-MM-DD') : '-',
                tgl_cerai: personal?.tanggal_cerai ? moment(personal.tanggal_cerai).format('YYYY-MM-DD') : '-',
                tgl_wafat: personal?.tanggal_wafat_pasangan ? moment(personal.tanggal_wafat_pasangan).format('YYYY-MM-DD') : '-',
                ayah_kandung: fam?.nama_ayah_kandung || '-',
                ibu_kandung: fam?.nama_ibu_kandung || '-',
                alamat_ortu: fam?.alamat_orang_tua || '-',
                ayah_mertua: fam?.nama_ayah_mertua || '-',
                tgl_ayah_mertua: fam?.tanggal_lahir_ayah_mertua ? moment(fam.tanggal_lahir_ayah_mertua).format('YYYY-MM-DD') : '-',
                edu_ayah_mertua: fam?.pendidikan_terakhir_ayah_mertua || '-',
                note_ayah_mertua: fam?.keterangan_ayah_mertua || '-',
                ibu_mertua: fam?.nama_ibu_mertua || '-',
                tgl_ibu_mertua: fam?.tanggal_lahir_ibu_mertua ? moment(fam.tanggal_lahir_ibu_mertua).format('YYYY-MM-DD') : '-',
                edu_ibu_mertua: fam?.pendidikan_terakhir_ibu_mertua || '-',
                note_ibu_mertua: fam?.keterangan_ibu_mertua || '-',
                data_anak: anakList,
                data_saudara: saudaraList
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as unknown as Buffer;
    }

    async exportEmployeeProfileToPDF(employeeId: number): Promise<Buffer> {
        const employee: any = await employeeService.getEmployeeById(employeeId);

        if (!employee) {
            throw new Error('Employee not found');
        }

        const htmlContent = this.generateEmployeeProfileHTML(employee);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        await browser.close();
        return Buffer.from(pdfBuffer);
    }

    private generateEmployeeProfileHTML(employee: any): string {
        const formatDate = (date: any) => date ? moment(date).format('DD MMMM YYYY') : '-';
        const hr = employee.hr_info;
        const fam = employee.family_info;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.6; font-size: 14px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
                .header h1 { margin: 0; color: #1e40af; font-size: 24px; }
                .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
                
                .section { margin-bottom: 20px; page-break-inside: avoid; }
                .section-title { background-color: #f3f4f6; padding: 6px 12px; font-weight: bold; border-left: 4px solid #3b82f6; margin-bottom: 10px; font-size: 15px; }
                
                .grid { display: table; width: 100%; border-collapse: collapse; }
                .row { display: table-row; }
                .col { display: table-cell; padding: 4px; width: 50%; vertical-align: top; }
                .label { font-weight: bold; color: #4b5563; width: 140px; display: inline-block; font-size: 13px; }
                .value { color: #111827; font-size: 13px; }
                
                .profile-img { width: 100px; height: 100px; object-fit: cover; border-radius: 50%; border: 3px solid #e5e7eb; margin: 0 auto 10px; display: block; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
                table, th, td { border: 1px solid #e5e7eb; }
                th { background-color: #f9fafb; padding: 6px; text-align: left; font-weight: bold; color: #374151; }
                td { padding: 6px; color: #4b5563; }
            </style>
        </head>
        <body>
            <div class="header">
                ${employee.foto_karyawan ? `<img src="file://${employee.foto_karyawan}" class="profile-img" />` : ''} 
                <h1>${employee.nama_lengkap}</h1>
                <p>NIK: ${employee.nomor_induk_karyawan} | ${employee.posisi_jabatan?.nama || '-'}</p>
                <p>${employee.divisi?.nama || '-'} - ${employee.department?.nama || '-'}</p>
            </div>

            <!-- Profile Overview (Basic Info) -->
            <div class="section">
                <div class="section-title">Informasi Dasar</div>
                <div class="grid">
                    <div class="row">
                        <div class="col"><span class="label">Lokasi Kerja:</span> <span class="value">${employee.lokasi_kerja?.nama || '-'}</span></div>
                        <div class="col"><span class="label">Status Karyawan:</span> <span class="value">${employee.status_karyawan?.nama || '-'}</span></div>
                    </div>
                    <div class="row">
                        <div class="col"><span class="label">Tanggal Masuk:</span> <span class="value">${formatDate(hr?.tanggal_masuk)}</span></div>
                        <div class="col"><span class="label">Email Kantor:</span> <span class="value">${employee.email_perusahaan || '-'}</span></div>
                    </div>
                    <div class="row">
                        <div class="col"><span class="label">No HP:</span> <span class="value">${employee.nomor_handphone || '-'}</span></div>
                        <div class="col"><span class="label">Tag:</span> <span class="value">${employee.tag?.nama || '-'}</span></div>
                    </div>
                </div>
            </div>

            <!-- Personal Info -->
            <div class="section">
                <div class="section-title">Informasi Personal</div>
                <div class="grid">
                    <div class="row">
                        <div class="col"><span class="label">TTL:</span> <span class="value">${employee.personal_info?.tempat_lahir || '-'}, ${formatDate(employee.personal_info?.tanggal_lahir)}</span></div>
                        <div class="col"><span class="label">Jenis Kelamin:</span> <span class="value">${employee.personal_info?.jenis_kelamin || '-'}</span></div>
                    </div>
                    <div class="row">
                        <div class="col"><span class="label">Agama:</span> <span class="value">${employee.personal_info?.agama || '-'}</span></div>
                        <div class="col"><span class="label">Status Nikah:</span> <span class="value">${employee.personal_info?.status_pernikahan || '-'}</span></div>
                    </div>
                    <div class="row">
                        <div class="col"><span class="label">Gol. Darah:</span> <span class="value">${employee.personal_info?.golongan_darah || '-'}</span></div>
                        <div class="col"><span class="label">NIK KTP:</span> <span class="value">${employee.personal_info?.nik_ktp || '-'}</span></div>
                    </div>
                    <div class="row">
                         <div class="col"><span class="label">Alamat Domisili:</span> <span class="value">${employee.personal_info?.alamat_domisili || '-'}</span></div>
                    </div>
                </div>
            </div>
            
            <!-- HR Info (New Section) -->
             <div class="section">
                <div class="section-title">Informasi Kepegawaian (HR)</div>
                <div class="grid">
                    <div class="row">
                        <div class="col"><span class="label">Hubungan Kerja:</span> <span class="value">${hr?.jenis_hubungan_kerja?.nama || '-'}</span></div>
                        <div class="col"><span class="label">Tgl Kontrak:</span> <span class="value">${formatDate(hr?.tanggal_kontrak)} s/d ${formatDate(hr?.tanggal_akhir_kontrak)}</span></div>
                    </div>
                    <div class="row">
                        <div class="col"><span class="label">Tgl Permanent:</span> <span class="value">${formatDate(hr?.tanggal_permanent)}</span></div>
                         <div class="col"><span class="label">Pangkat/Gol:</span> <span class="value">${hr?.kategori_pangkat?.nama || '-'} (${hr?.golongan_pangkat?.nama || '-'})</span></div>
                    </div>
                    <div class="row">
                        <div class="col"><span class="label">Pendidikan:</span> <span class="value">${hr?.tingkat_pendidikan || '-'} - ${hr?.bidang_studi || '-'} (${hr?.nama_sekolah || '-'})</span></div>
                    </div>
                     <div class="row">
                        <div class="col"><span class="label">Kontak Darurat:</span> <span class="value">${hr?.nama_kontak_darurat_1 || '-'} (${hr?.hubungan_kontak_darurat_1 || '-'} - ${hr?.nomor_telepon_kontak_darurat_1 || '-'})</span></div>
                    </div>
                </div>
            </div>

            <!-- Family Info (Enhanced) -->
            <div class="section">
                <div class="section-title">Data Keluarga</div>
                ${this.renderFamilySection(fam)}
            </div>
        </body>
        </html>
       `;
    }

    private renderFamilySection(fam: any): string {
        if (!fam) return '<p class="value">-</p>';

        let html = '<div class="grid">';

        // Pasangan
        if (fam.nama_pasangan) {
            html += `
            <div class="row">
                <div class="col"><span class="label">Pasangan:</span> <span class="value">${fam.nama_pasangan}</span></div>
                <div class="col"><span class="label">Tgl Lahir:</span> <span class="value">${fam.tanggal_lahir_pasangan ? moment(fam.tanggal_lahir_pasangan).format('DD MMM YYYY') : '-'}</span></div>
            </div>`;
        }

        // Orang Tua
        html += `
            <div class="row">
                <div class="col"><span class="label">Ayah Kandung:</span> <span class="value">${fam.nama_ayah_kandung || '-'}</span></div>
                <div class="col"><span class="label">Ibu Kandung:</span> <span class="value">${fam.nama_ibu_kandung || '-'}</span></div>
            </div>
             <div class="row">
                <div class="col"><span class="label">Ayah Mertua:</span> <span class="value">${fam.nama_ayah_mertua || '-'}</span></div>
                <div class="col"><span class="label">Ibu Mertua:</span> <span class="value">${fam.nama_ibu_mertua || '-'}</span></div>
            </div>`;

        html += '</div>';

        // Anak Table
        if (fam.data_anak && Array.isArray(fam.data_anak) && fam.data_anak.length > 0) {
            html += '<p style="margin-top:10px; font-weight:bold; font-size:13px;">Data Anak:</p><table><thead><tr><th>Nama</th><th>Tgl Lahir</th><th>Ket</th></tr></thead><tbody>';
            fam.data_anak.forEach((anak: any) => {
                const tgl = anak.tanggal_lahir || anak.tgl_lahir; // fallback
                const ket = anak.keterangan || anak.pendidikan || '-';
                html += `<tr><td>${anak.nama}</td><td>${tgl ? moment(tgl).format('DD MMM YYYY') : '-'}</td><td>${ket}</td></tr>`;
            });
            html += '</tbody></table>';
        } else {
            html += '<p style="margin-top:5px; font-style:italic; font-size:12px;">Tidak ada data anak</p>';
        }

        return html;
    }
}

export default new ExportService();
