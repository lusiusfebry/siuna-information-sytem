import { Request, Response, NextFunction } from 'express';
import employeeService from '../services/employee.service';
import { parseIdParam, parseOptionalInt } from '../../../shared/utils/validation.utils';

const parseDate = (value: any): string | null | undefined => {
    if (!value || value === 'undefined' || value === 'null' || value === '') return null;
    return value;
};

class EmployeeController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            // Apply department filter if set by middleware (for managers)
            const queryParams = { ...req.query };

            if (req.departmentFilter) {
                // Force department_id to be what specific manager is allowed to see
                queryParams.department_id = req.departmentFilter.toString();
            }

            const employees = await employeeService.getAllEmployees(queryParams);
            res.json(employees);
        } catch (error) {
            next(error);
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseIdParam(req.params.id, 'Employee ID');
            const employee = await employeeService.getEmployeeWithDetails(id);
            if (!employee) return res.status(404).json({ message: 'Employee not found' });
            res.json({ data: employee });
        } catch (error: any) {
            if (error.statusCode === 400) {
                return res.status(400).json({ status: 'error', message: error.message });
            }
            next(error);
        }
    }

    async getBase(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseIdParam(req.params.id, 'Employee ID');
            const employee = await employeeService.getEmployeeBase(id);
            if (!employee) return res.status(404).json({ message: 'Employee not found' });
            res.json({ data: employee });
        } catch (error: any) {
            if (error.statusCode === 400) {
                return res.status(400).json({ status: 'error', message: error.message });
            }
            next(error);
        }
    }

    async getPersonal(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id);
            const employee = await employeeService.getEmployeePersonalInfo(id);
            if (!employee) return res.status(404).json({ message: 'Employee not found' });
            res.json({ data: employee.personal_info });
        } catch (error) {
            next(error);
        }
    }

    async getEmployment(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id);
            const employee = await employeeService.getEmployeeEmploymentData(id);
            if (!employee) return res.status(404).json({ message: 'Employee not found' });
            res.json({ data: employee.hr_info });
        } catch (error) {
            next(error);
        }
    }

    async getFamily(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id);
            const employee = await employeeService.getEmployeeFamilyData(id);
            if (!employee) return res.status(404).json({ message: 'Employee not found' });
            res.json({ data: employee.family_info });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body;
            const photoPath = req.file ? `/uploads/employees/photos/${req.file.filename}` : undefined;

            // 1. Map to Employee Attributes (Main Table)
            const employeeData: any = {
                nama_lengkap: body.nama_lengkap,
                nomor_induk_karyawan: body.nomor_induk_karyawan,
                email_perusahaan: body.email_perusahaan,
                nomor_handphone: body.nomor_handphone,

                divisi_id: parseOptionalInt(body.divisi_id),
                department_id: parseOptionalInt(body.department_id),
                posisi_jabatan_id: parseOptionalInt(body.posisi_jabatan_id),
                status_karyawan_id: parseOptionalInt(body.status_karyawan_id) || 1, // Default to Aktif (ID 1)
                lokasi_kerja_id: parseOptionalInt(body.lokasi_kerja_id),
                tag_id: parseOptionalInt(body.tag_id),
                manager_id: parseOptionalInt(body.manager_id),
                atasan_langsung_id: parseOptionalInt(body.atasan_langsung_id),
                kategori_pangkat_id: parseOptionalInt(body.kategori_pangkat_id),
                is_draft: body.is_draft === 'true' || body.is_draft === true,
            };

            // 2. Map to Personal Info Attributes
            const personalInfoData: any = {
                jenis_kelamin: body.jenis_kelamin,
                tempat_lahir: body.tempat_lahir,
                tanggal_lahir: parseDate(body.tanggal_lahir),
                alamat_domisili: body.alamat_domisili,
                kota_domisili: body.kota_domisili,
                provinsi_domisili: body.provinsi_domisili,
                kode_pos: body.kode_pos,
                alamat_ktp: body.alamat_ktp,
                kota_ktp: body.kota_ktp,
                provinsi_ktp: body.provinsi_ktp,
                agama: body.agama,
                status_pernikahan: body.status_pernikahan,
                golongan_darah: body.golongan_darah,
                nama_pasangan: body.nama_pasangan,
                pekerjaan_pasangan: body.pekerjaan_pasangan,
                tanggal_menikah: parseDate(body.tanggal_menikah),
                jumlah_anak: parseOptionalInt(body.jumlah_anak) || 0,
                nomor_rekening: body.nomor_rekening,
                nama_bank: body.nama_bank,
                cabang_bank: body.cabang_bank,
                nama_pemegang_rekening: body.nama_pemegang_rekening,
                nomor_npwp: body.nomor_npwp,
                nomor_bpjs: body.nomor_bpjs,
                nomor_ktp: body.nomor_ktp,
                nomor_kartu_keluarga: body.nomor_kartu_keluarga,
                email_pribadi: body.email_pribadi,
                nomor_handphone_2: body.nomor_handphone_2,
                nomor_telepon_rumah_1: body.nomor_telepon_rumah_1,
                nomor_telepon_rumah_2: body.nomor_telepon_rumah_2,
                nomor_wa: body.nomor_wa,
                akun_sosmed: body.akun_sosmed,
                no_nik_kk: body.no_nik_kk,
                status_pajak: body.status_pajak,
                tanggal_cerai: parseDate(body.tanggal_cerai),
                tanggal_wafat_pasangan: parseDate(body.tanggal_wafat_pasangan),
            };

            // 3. Map to HR Info Attributes
            const hrInfoData: any = {
                jenis_hubungan_kerja_id: parseOptionalInt(body.jenis_hubungan_kerja_id),
                tanggal_masuk_group: parseDate(body.tanggal_masuk_group),
                tanggal_masuk: parseDate(body.tanggal_masuk || body.joinDate),
                tanggal_permanent: parseDate(body.tanggal_permanent),
                tanggal_kontrak: parseDate(body.tanggal_kontrak),
                tanggal_akhir_kontrak: parseDate(body.tanggal_akhir_kontrak),
                tanggal_berhenti: parseDate(body.tanggal_berhenti),

                tingkat_pendidikan: body.tingkat_pendidikan || body.pendidikan_terakhir,
                bidang_studi: body.bidang_studi || body.jurusan,
                nama_sekolah: body.nama_sekolah,
                kota_sekolah: body.kota_sekolah,
                status_kelulusan: body.status_kelulusan,
                keterangan_pendidikan: body.keterangan_pendidikan,

                kategori_pangkat_id: parseOptionalInt(body.kategori_pangkat_id),
                golongan_pangkat_id: parseOptionalInt(body.golongan_pangkat_id) || parseOptionalInt(body.golongan_id),
                sub_golongan_pangkat_id: parseOptionalInt(body.sub_golongan_pangkat_id) || parseOptionalInt(body.sub_golongan_id),
                no_dana_pensiun: body.no_dana_pensiun,

                nama_kontak_darurat_1: body.nama_kontak_darurat_1,
                nomor_telepon_kontak_darurat_1: body.nomor_telepon_kontak_darurat_1,
                hubungan_kontak_darurat_1: body.hubungan_kontak_darurat_1,
                alamat_kontak_darurat_1: body.alamat_kontak_darurat_1,

                nama_kontak_darurat_2: body.nama_kontak_darurat_2,
                nomor_telepon_kontak_darurat_2: body.nomor_telepon_kontak_darurat_2,
                hubungan_kontak_darurat_2: body.hubungan_kontak_darurat_2,
                alamat_kontak_darurat_2: body.alamat_kontak_darurat_2,

                point_of_original: body.point_of_original,
                point_of_hire: body.point_of_hire,
                ukuran_seragam_kerja: body.ukuran_seragam_kerja,
                ukuran_sepatu_kerja: body.ukuran_sepatu_kerja,

                lokasi_sebelumnya_id: parseOptionalInt(body.lokasi_sebelumnya_id),
                tanggal_mutasi: parseDate(body.tanggal_mutasi),
                siklus_pembayaran_gaji: body.siklus_pembayaran_gaji,
                costing: body.costing,
                assign: body.assign,
                actual: body.actual,
            };

            // 4. Map to Family Info Attributes
            const familyInfoData: any = {
                tanggal_lahir_pasangan: parseDate(body.tanggal_lahir_pasangan),
                pendidikan_terakhir_pasangan: body.pendidikan_terakhir_pasangan,
                keterangan_pasangan: body.keterangan_pasangan,

                anak_ke: parseOptionalInt(body.anak_ke),
                jumlah_saudara_kandung: parseOptionalInt(body.jumlah_saudara_kandung) || 0,

                nama_ayah_mertua: body.nama_ayah_mertua,
                tanggal_lahir_ayah_mertua: parseDate(body.tanggal_lahir_ayah_mertua),
                pendidikan_terakhir_ayah_mertua: body.pendidikan_terakhir_ayah_mertua,
                keterangan_ayah_mertua: body.keterangan_ayah_mertua,

                nama_ibu_mertua: body.nama_ibu_mertua,
                tanggal_lahir_ibu_mertua: parseDate(body.tanggal_lahir_ibu_mertua),
                pendidikan_terakhir_ibu_mertua: body.pendidikan_terakhir_ibu_mertua,
                keterangan_ibu_mertua: body.keterangan_ibu_mertua,

                nama_ayah_kandung: body.nama_ayah_kandung,
                nama_ibu_kandung: body.nama_ibu_kandung,
                alamat_orang_tua: body.alamat_orang_tua,

                data_anak: body.data_anak, // Service handles parsing if it's string
                data_saudara_kandung: body.data_saudara_kandung,
            };

            const isUnique = await employeeService.validateNIKUnique(employeeData.nomor_induk_karyawan);
            if (!isUnique) {
                return res.status(400).json({ message: 'NIK already exists' });
            }

            const employee = await employeeService.createEmployeeComplete(
                employeeData,
                personalInfoData,
                hrInfoData,
                familyInfoData,
                photoPath
            );

            // Generate QR Code for response
            let qrCodeData = null;
            if (employee && employee.nomor_induk_karyawan) {
                try {
                    const qrResult = await employeeService.getEmployeeQRCode(employee.id);
                    qrCodeData = qrResult.qrCode;
                } catch (e) {
                    console.warn('Failed to generate QR code on create:', e);
                }
            }

            res.status(201).json({
                status: 'success',
                data: employee ? {
                    ...employee.toJSON(),
                    qrCode: qrCodeData
                } : null
            });
        } catch (error) {
            console.error('[EmployeeController] Create Error:', error);
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id);
            const body = req.body;
            const photoPath = req.file ? `/uploads/employees/photos/${req.file.filename}` : undefined;

            const employeeData = {
                ...body,
                divisi_id: parseOptionalInt(body.divisi_id),
                department_id: parseOptionalInt(body.department_id),
                posisi_jabatan_id: parseOptionalInt(body.posisi_jabatan_id),
                status_karyawan_id: parseOptionalInt(body.status_karyawan_id),
                lokasi_kerja_id: parseOptionalInt(body.lokasi_kerja_id),
                tag_id: parseOptionalInt(body.tag_id),
                manager_id: parseOptionalInt(body.manager_id),
                atasan_langsung_id: parseOptionalInt(body.atasan_langsung_id),
                kategori_pangkat_id: parseOptionalInt(body.kategori_pangkat_id),
                is_draft: body.is_draft === 'true' || body.is_draft === true,
            };

            const personalInfoData = {
                ...body,
                tanggal_lahir: parseDate(body.tanggal_lahir),
                tanggal_menikah: parseDate(body.tanggal_menikah),
                tanggal_cerai: parseDate(body.tanggal_cerai),
                tanggal_wafat_pasangan: parseDate(body.tanggal_wafat_pasangan),
                jumlah_anak: parseOptionalInt(body.jumlah_anak),
            };

            const hrInfoData = {
                ...body,
                jenis_hubungan_kerja_id: parseOptionalInt(body.jenis_hubungan_kerja_id),
                tanggal_masuk_group: parseDate(body.tanggal_masuk_group),
                tanggal_masuk: parseDate(body.tanggal_masuk || body.joinDate),
                tanggal_permanent: parseDate(body.tanggal_permanent),
                tanggal_kontrak: parseDate(body.tanggal_kontrak),
                tanggal_akhir_kontrak: parseDate(body.tanggal_akhir_kontrak),
                tanggal_berhenti: parseDate(body.tanggal_berhenti),
                kategori_pangkat_id: parseOptionalInt(body.kategori_pangkat_id),
                golongan_pangkat_id: parseOptionalInt(body.golongan_pangkat_id) || parseOptionalInt(body.golongan_id),
                sub_golongan_pangkat_id: parseOptionalInt(body.sub_golongan_pangkat_id) || parseOptionalInt(body.sub_golongan_id),
                lokasi_sebelumnya_id: parseOptionalInt(body.lokasi_sebelumnya_id),
                tanggal_mutasi: parseDate(body.tanggal_mutasi),
            };

            const familyInfoData = {
                ...body,
                tanggal_lahir_pasangan: parseDate(body.tanggal_lahir_pasangan),
                anak_ke: parseOptionalInt(body.anak_ke),
                jumlah_saudara_kandung: parseOptionalInt(body.jumlah_saudara_kandung),
                tanggal_lahir_ayah_mertua: parseDate(body.tanggal_lahir_ayah_mertua),
                tanggal_lahir_ibu_mertua: parseDate(body.tanggal_lahir_ibu_mertua),
            };

            if (employeeData.nomor_induk_karyawan) {
                const isUnique = await employeeService.validateNIKUnique(employeeData.nomor_induk_karyawan, id);
                if (!isUnique) {
                    return res.status(400).json({ message: 'NIK already exists' });
                }
            }

            const employee = await employeeService.updateEmployeeComplete(id, employeeData, personalInfoData, hrInfoData, familyInfoData, photoPath);

            // Generate QR Code for response
            let qrCodeData = null;
            if (employee && employee.nomor_induk_karyawan) {
                try {
                    const qrResult = await employeeService.getEmployeeQRCode(employee.id);
                    qrCodeData = qrResult.qrCode;
                } catch (e) {
                    console.warn('Failed to generate QR code on update:', e);
                }
            }

            res.json({
                data: employee ? {
                    ...employee.toJSON(),
                    qrCode: qrCodeData
                } : null
            });
        } catch (error) {
            console.error('[EmployeeController] Update Error:', error);
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id);
            await employeeService.deleteEmployee(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getQRCode(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id);
            const result = await employeeService.getEmployeeQRCode(id);
            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            if (error.message === 'EMPLOYEE_NOT_FOUND') {
                res.status(404).json({ success: false, message: 'Employee not found' });
            } else if (error.message === 'NIK_MISSING') {
                res.status(400).json({ success: false, message: 'Employee NIK is missing' });
            } else {
                next(error);
            }
        }
    }

    async downloadQRCode(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id);
            const { buffer, filename } = await employeeService.getEmployeeQRCodeBuffer(id);

            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(buffer);
        } catch (error: any) {
            if (error.message === 'EMPLOYEE_NOT_FOUND') {
                res.status(404).json({ success: false, message: 'Employee not found' });
            } else if (error.message === 'NIK_MISSING') {
                res.status(400).json({ success: false, message: 'Employee NIK is missing' });
            } else {
                next(error);
            }
        }
    }
}

export default new EmployeeController();
