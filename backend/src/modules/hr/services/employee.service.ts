import Employee, { EmployeeCreationAttributes } from '../models/Employee';
import EmployeePersonalInfo from '../models/EmployeePersonalInfo';
import Divisi from '../models/Divisi';
import Department from '../models/Department';
import PosisiJabatan from '../models/PosisiJabatan';
import StatusKaryawan from '../models/StatusKaryawan';
import LokasiKerja from '../models/LokasiKerja';
import Tag from '../models/Tag';
import { Op } from 'sequelize';
import sequelize from '../../../config/database'; // Import sequelize instance
import EmployeeFamilyInfo from '../models/EmployeeFamilyInfo'; // Assuming we need this for full details
import EmployeeHRInfo from '../models/EmployeeHRInfo';
import EmployeeDocument from '../models/EmployeeDocument';
import JenisHubunganKerja from '../models/JenisHubunganKerja';
import KategoriPangkat from '../models/KategoriPangkat';
import Golongan from '../models/Golongan';
import SubGolongan from '../models/SubGolongan';
import { qrcodeService } from './qrcode.service';
import { validateManagerPosition, validateAtasanLangsungActive, validateDepartmentBelongsToDivisi, validatePosisiJabatanBelongsToDepartment, validateContractDates } from '../validators/business-rules.validator';
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';
import { AppError } from '../../../shared/utils/errorHandler';

class EmployeeService {
    async getEmployeeQRCode(id: number) {
        const employee = await Employee.findByPk(id);
        if (!employee) throw new Error('EMPLOYEE_NOT_FOUND');

        const nik = employee.nomor_induk_karyawan;
        if (!nik) throw new Error('NIK_MISSING');

        const qrData = await qrcodeService.generateQRCode(nik);

        return {
            employee: {
                id: employee.id,
                nama: employee.nama_lengkap,
                nik: employee.nomor_induk_karyawan
            },
            ...qrData
        };
    }

    async getEmployeeQRCodeBuffer(id: number): Promise<{ buffer: Buffer, filename: string }> {
        const employee = await Employee.findByPk(id);
        if (!employee) throw new Error('EMPLOYEE_NOT_FOUND');

        const nik = employee.nomor_induk_karyawan;
        if (!nik) throw new Error('NIK_MISSING');

        const buffer = await qrcodeService.generateQRCodeBuffer(nik);
        return {
            buffer,
            filename: `qr-${nik}.png`
        };
    }

    async getAllEmployees(params: any = {}, userId?: number) {
        const { search, divisi_id, department_id, status_id, posisi_jabatan_id, lokasi_kerja_id, tag_id, is_draft, only_deleted, page = 1, limit = 10 } = params;
        const offset = (page - 1) * limit;

        const where: any = {};

        // Recycle-bin view: show only soft-deleted employees.
        const showDeleted = only_deleted === 'true' || only_deleted === true;
        if (showDeleted) {
            where.deleted_at = { [Op.ne]: null };
        }

        // By default, exclude drafts unless specifically requested
        if (is_draft !== undefined) {
            where.is_draft = is_draft === 'true' || is_draft === true;
        } else {
            where.is_draft = false;
        }
        // Search functionality
        if (search) {
            // Sanitize search input to prevent LIKE pattern injection
            const sanitizedSearch = String(search).replace(/[%_\\]/g, '\\$&');
            where[Op.or] = [
                { nama_lengkap: { [Op.iLike]: `%${sanitizedSearch}%` } }, // Postgres use iLike for case insensitive
                { nomor_induk_karyawan: { [Op.iLike]: `%${sanitizedSearch}%` } }
            ];
        }

        // Filters
        if (divisi_id) where.divisi_id = divisi_id;
        // Logic for Manager Filtering via userId (if provided via Service call or Controller passing it down)
        // Note: Controller calls this. We need to update Controller to pass userId if we want service to handle it
        // OR Controller handles it and passes department_id filter.
        // Plan said: "Update getAll(filters, userId)"

        if (department_id) {
            where.department_id = department_id;
        } else if (userId) {
            // Check if user is manager, done in controller/middleware?
            // Middleware checkDepartmentAccess adds departmentFilter to req.
            // So if params has departmentFilter (injected by middleware/controller mapping), use it.
            // If we strictly follow plan: Service logic check user role. But Service normally doesn't check User model again unless needed.
            // Efficient way: Middleware sets filter. Controller passes filter to service.
            // We assume controller passes `department_id` from req.departmentFilter if set.
            // But let's check validation logic in plan.
            // "If user role is 'manager': Get employee record, Extract department_id"
            // We added `checkDepartmentAccess` middleware which sets `req.departmentFilter`.
            // So `params.department_id` should effectively be that filter.
        }

        if (status_id) where.status_karyawan_id = status_id;
        if (posisi_jabatan_id) where.posisi_jabatan_id = posisi_jabatan_id;
        if (lokasi_kerja_id) where.lokasi_kerja_id = lokasi_kerja_id;
        if (tag_id) where.tag_id = tag_id;

        // Optimization: Use separate count and findAll (faster for large datasets)
        const count = await Employee.count({ where, paranoid: !showDeleted });

        const rows = await Employee.findAll({
            where,
            paranoid: !showDeleted,
            attributes: [
                'id', 'nama_lengkap', 'nomor_induk_karyawan',
                'foto_karyawan', 'email_perusahaan', 'nomor_handphone'
            ],
            include: [
                {
                    model: Divisi,
                    as: 'divisi',
                    attributes: ['id', 'nama']
                },
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'nama']
                },
                {
                    model: PosisiJabatan,
                    as: 'posisi_jabatan',
                    attributes: ['id', 'nama']
                },
                {
                    model: StatusKaryawan,
                    as: 'status_karyawan',
                    attributes: ['id', 'nama']
                },
                {
                    model: LokasiKerja,
                    as: 'lokasi_kerja',
                    attributes: ['id', 'nama']
                },
                {
                    model: Tag,
                    as: 'tag',
                    attributes: ['id', 'nama', 'warna_tag']
                },
            ],
            offset,
            limit: parseInt(limit),
            order: [['created_at', 'DESC']],
            subQuery: false // Optimize for large datasets with includes
        });

        // INV-M02: attach outstanding held-asset count as a derived value so the UI
        // can flag employees who still hold inventory. Single batched COUNT GROUP BY
        // over just the ids on this page — no N+1, no stored flag to go stale.
        const employeeIds = rows.map((r: any) => r.id);
        const heldByEmployee = await this.getOutstandingAssetCounts(employeeIds);
        const data = rows.map((r: any) => {
            const plain = r.toJSON();
            plain.outstanding_assets_count = heldByEmployee[r.id] || 0;
            return plain;
        });

        return {
            data,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        };
    }

    // INV-M02: derive how many inventory assets each employee still holds
    // (InvSerialNumber rows with status 'Digunakan'). Returns a map keyed by
    // employee id. Empty input -> empty map (avoids an IN () query).
    async getOutstandingAssetCounts(employeeIds: number[]): Promise<Record<number, number>> {
        if (!employeeIds.length) return {};
        const { default: InvSerialNumber } = await import('../../inventory/models/SerialNumber');
        const rows = await InvSerialNumber.findAll({
            attributes: [
                'karyawan_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'cnt'],
            ],
            where: { karyawan_id: { [Op.in]: employeeIds }, status: 'Digunakan' },
            group: ['karyawan_id'],
            raw: true,
        });
        const map: Record<number, number> = {};
        for (const row of rows as any[]) {
            map[row.karyawan_id] = parseInt(row.cnt, 10);
        }
        return map;
    }

    async getEmployeeById(id: number) {
        // Legacy method, kept for compatibility if needed, but ideally we use granular methods
        return await Employee.findByPk(id, {
            include: [
                { model: Divisi, as: 'divisi' },
                { model: Department, as: 'department' },
                { model: PosisiJabatan, as: 'posisi_jabatan' },
                { model: StatusKaryawan, as: 'status_karyawan' },
                { model: LokasiKerja, as: 'lokasi_kerja' },
                { model: Tag, as: 'tag' },
                { model: Employee, as: 'manager' }, // Self join
                { model: Employee, as: 'atasan_langsung' }, // Self join
                { model: EmployeePersonalInfo, as: 'personal_info' },
                {
                    model: EmployeeHRInfo,
                    as: 'hr_info',
                    include: [
                        { model: JenisHubunganKerja, as: 'jenis_hubungan_kerja' },
                        { model: KategoriPangkat, as: 'kategori_pangkat' },
                        { model: Golongan, as: 'golongan_pangkat' },
                        { model: SubGolongan, as: 'sub_golongan_pangkat' },
                        { model: LokasiKerja, as: 'lokasi_sebelumnya' }
                    ]
                },
                { model: EmployeeFamilyInfo, as: 'family_info' }
            ]
        });
    }

    // Lazy Loading Methods
    async getEmployeeBase(id: number) {
        const employee = await Employee.findByPk(id, {
            include: [
                { model: Divisi, as: 'divisi' },
                { model: Department, as: 'department' },
                { model: PosisiJabatan, as: 'posisi_jabatan' },
                { model: StatusKaryawan, as: 'status_karyawan' },
                { model: LokasiKerja, as: 'lokasi_kerja' },
                { model: Tag, as: 'tag' },
                { model: Employee, as: 'manager' },
                { model: Employee, as: 'atasan_langsung' }
            ]
        });
        if (!employee) return employee;
        // INV-M02: attach derived held-asset count for the profile header badge.
        const counts = await this.getOutstandingAssetCounts([id]);
        const plain: any = employee.toJSON();
        plain.outstanding_assets_count = counts[id] || 0;
        return plain;
    }

    async getEmployeePersonalInfo(id: number) {
        return await Employee.findByPk(id, {
            attributes: ['id'], // minimize main table data
            include: [
                { model: EmployeePersonalInfo, as: 'personal_info' }
            ]
        });
    }

    async getEmployeeEmploymentData(id: number) {
        return await Employee.findByPk(id, {
            attributes: ['id'],
            include: [
                {
                    model: EmployeeHRInfo,
                    as: 'hr_info',
                    include: [
                        { model: JenisHubunganKerja, as: 'jenis_hubungan_kerja' },
                        { model: KategoriPangkat, as: 'kategori_pangkat' },
                        { model: Golongan, as: 'golongan_pangkat' },
                        { model: SubGolongan, as: 'sub_golongan_pangkat' },
                        { model: LokasiKerja, as: 'lokasi_sebelumnya' }
                    ]
                }
            ]
        });
    }

    async getEmployeeFamilyData(id: number) {
        return await Employee.findByPk(id, {
            attributes: ['id'],
            include: [
                { model: EmployeeFamilyInfo, as: 'family_info' }
            ]
        });
    }

    async getEmployeeWithDetails(id: number) {
        return this.getEmployeeById(id);
    }

    async createEmployee(data: EmployeeCreationAttributes) {
        return await Employee.create(data);
    }

    async validateEmployeeBusinessRules(data: any, isUpdate: boolean = false, employeeId?: number) {
        const errors: string[] = [];

        // 1. NIK Unique
        if (data.nomor_induk_karyawan) {
            const isUnique = await this.validateNIKUnique(data.nomor_induk_karyawan, isUpdate ? employeeId : undefined);
            if (!isUnique) {
                errors.push(ERROR_MESSAGES.NIK_ALREADY_EXISTS);
            }
        }

        // 2. Manager Position check
        if (data.manager_id) {
            const result = await validateManagerPosition(data.manager_id);
            if (!result.valid) errors.push(result.message!);
        }

        // 3. Atasan Langsung Active
        if (data.atasan_langsung_id) {
            const result = await validateAtasanLangsungActive(data.atasan_langsung_id);
            if (!result.valid) errors.push(result.message!);
        }

        // 4. Department in Divisi
        if (data.divisi_id && data.department_id) {
            const result = await validateDepartmentBelongsToDivisi(data.department_id, data.divisi_id);
            if (!result.valid) errors.push(result.message!);
        }

        // 5. Posisi in Department
        if (data.department_id && data.posisi_jabatan_id) {
            const result = await validatePosisiJabatanBelongsToDepartment(data.posisi_jabatan_id, data.department_id);
            if (!result.valid) errors.push(result.message!);
        }

        // 6. Contract Dates
        if (data.tanggal_kontrak && data.tanggal_akhir_kontrak) {
            const result = await validateContractDates(data.tanggal_kontrak, data.tanggal_akhir_kontrak);
            if (!result.valid) errors.push(result.message!);
        }

        if (errors.length > 0) {
            throw new Error(JSON.stringify({ message: ERROR_MESSAGES.VALIDATION_ERROR, errors }));
        }
    }

    async createEmployeeComplete(employeeData: EmployeeCreationAttributes, personalInfoData: any, hrInfoData: any, familyInfoData: any, photoPath?: string, options?: { transaction?: any }) {
        // Run Business Rule Validation for ALL (Draft, Create, etc.)
        // As requested: "validasi untuk semua sub menu master data... ketika add, simpan draft maupun edit"

        const validationData = { ...employeeData, ...hrInfoData };
        await this.validateEmployeeBusinessRules(validationData, false);

        const t = options?.transaction || await sequelize.transaction();
        const isExternalTransaction = !!options?.transaction;

        let employee: Employee;
        try {
            if (photoPath) {
                employeeData.foto_karyawan = photoPath;
            }

            employee = await Employee.create(employeeData, { transaction: t });

            if (personalInfoData) {
                await EmployeePersonalInfo.create({
                    ...personalInfoData,
                    employee_id: employee.id
                }, { transaction: t });
            }

            if (hrInfoData) {
                await EmployeeHRInfo.create({
                    ...hrInfoData,
                    employee_id: employee.id
                }, { transaction: t });
            }

            if (familyInfoData) {
                // Parse if string (from FormData)
                if (typeof familyInfoData.data_anak === 'string') {
                    if (familyInfoData.data_anak === 'undefined' || familyInfoData.data_anak === 'null' || !familyInfoData.data_anak.trim()) {
                        familyInfoData.data_anak = [];
                    } else {
                        try {
                            familyInfoData.data_anak = JSON.parse(familyInfoData.data_anak);
                        } catch (e) {
                            console.error('Error parsing data_anak:', e);
                            familyInfoData.data_anak = [];
                        }
                    }
                }

                if (typeof familyInfoData.data_saudara_kandung === 'string') {
                    if (familyInfoData.data_saudara_kandung === 'undefined' || familyInfoData.data_saudara_kandung === 'null' || !familyInfoData.data_saudara_kandung.trim()) {
                        familyInfoData.data_saudara_kandung = [];
                    } else {
                        try {
                            familyInfoData.data_saudara_kandung = JSON.parse(familyInfoData.data_saudara_kandung);
                        } catch (e) {
                            console.error('Error parsing data_saudara_kandung:', e);
                            familyInfoData.data_saudara_kandung = [];
                        }
                    }
                }

                await EmployeeFamilyInfo.create({
                    ...familyInfoData,
                    employee_id: employee.id
                }, { transaction: t });
            }

            if (!isExternalTransaction) await t.commit();
        } catch (error) {
            if (!isExternalTransaction) {
                try {
                    await t.rollback();
                } catch {
                    // Ignore rollback errors if transaction already finished
                }
            }
            throw error;
        }

        return await this.getEmployeeById(employee.id);
    }

    async updateEmployeeComplete(id: number, employeeData: Partial<Employee>, personalInfoData: any, hrInfoData: any, familyInfoData: any, photoPath?: string, options?: { transaction?: any }) {
        // Run Business Rule Validation for ALL (Draft or not)
        // User requested: "validasi untuk semua sub menu master data... ketika add, simpan draft maupun edit"

        const validationData = { ...employeeData, ...hrInfoData };
        await this.validateEmployeeBusinessRules(validationData, true, id);

        const t = options?.transaction || await sequelize.transaction();
        const isExternalTransaction = !!options?.transaction;

        try {
            const employee = await Employee.findByPk(id, { transaction: t });
            if (!employee) throw new Error('Employee not found');

            // INV-M02 guard: an employee transitioning INTO an inactive state
            // (status_karyawan.status = 'Tidak Aktif', e.g. Resign) must not still
            // be holding inventory assets. Custody = InvSerialNumber rows with this
            // karyawan_id and status 'Digunakan'. Force asset return first.
            // Only fires on the transition (was active -> now inactive), so editing
            // an already-inactive employee isn't blocked.
            const newStatusId = (employeeData as any).status_karyawan_id;
            if (newStatusId != null && newStatusId !== (employee as any).status_karyawan_id) {
                const newStatus = await StatusKaryawan.findByPk(newStatusId, { transaction: t });
                const prevStatus = (employee as any).status_karyawan_id != null
                    ? await StatusKaryawan.findByPk((employee as any).status_karyawan_id, { transaction: t })
                    : null;
                const becomingInactive = newStatus?.status === 'Tidak Aktif'
                    && prevStatus?.status !== 'Tidak Aktif';
                if (becomingInactive) {
                    // Dynamic import keeps the hr->inventory dependency out of module load.
                    const { default: InvSerialNumber } = await import('../../inventory/models/SerialNumber');
                    const heldAssets = await InvSerialNumber.count({
                        where: { karyawan_id: id, status: 'Digunakan' },
                        transaction: t,
                    });
                    if (heldAssets > 0) {
                        throw new AppError(`Karyawan masih memegang ${heldAssets} aset yang belum dikembalikan. Lakukan Retur Karyawan terlebih dahulu sebelum menonaktifkan karyawan.`, 409);
                    }
                }
            }

            if (photoPath) {
                employeeData.foto_karyawan = photoPath;
            }

            await employee.update(employeeData, { transaction: t });

            if (personalInfoData) {
                // Upsert personal info
                const existingPersonalInfo = await EmployeePersonalInfo.findOne({ where: { employee_id: id }, transaction: t });
                if (existingPersonalInfo) {
                    await existingPersonalInfo.update(personalInfoData, { transaction: t });
                } else {
                    await EmployeePersonalInfo.create({
                        ...personalInfoData,
                        employee_id: id
                    }, { transaction: t });
                }
            }

            if (familyInfoData) {
                // Parse if string (from FormData). Guard against empty / 'undefined' /
                // 'null' strings so a stray value can't throw and roll back the edit.
                const safeParseArray = (val: any) => {
                    if (typeof val !== 'string') return val;
                    if (val === '' || val === 'undefined' || val === 'null') return [];
                    try { return JSON.parse(val); } catch { return []; }
                };
                familyInfoData.data_anak = safeParseArray(familyInfoData.data_anak);
                familyInfoData.data_saudara_kandung = safeParseArray(familyInfoData.data_saudara_kandung);

                // Upsert family info
                const existingFamilyInfo = await EmployeeFamilyInfo.findOne({ where: { employee_id: id }, transaction: t });
                if (existingFamilyInfo) {
                    await existingFamilyInfo.update(familyInfoData, { transaction: t });
                } else {
                    await EmployeeFamilyInfo.create({
                        ...familyInfoData,
                        employee_id: id
                    }, { transaction: t });
                }
            }

            if (hrInfoData) {
                // Upsert hr info
                const existingHRInfo = await EmployeeHRInfo.findOne({ where: { employee_id: id }, transaction: t });
                if (existingHRInfo) {
                    await existingHRInfo.update(hrInfoData, { transaction: t });
                } else {
                    await EmployeeHRInfo.create({
                        ...hrInfoData,
                        employee_id: id
                    }, { transaction: t });
                }
            }

            if (!isExternalTransaction) await t.commit();
            return await this.getEmployeeById(id);
        } catch (error) {
            if (!isExternalTransaction) {
                try {
                    await t.rollback();
                } catch {
                    // Ignore rollback errors
                }
            }
            throw error;
        }
    }


    async deleteEmployee(id: number) {
        const t = await sequelize.transaction();
        try {
            const employee = await Employee.findByPk(id, { transaction: t });
            if (!employee) throw new Error('Employee not found');

            // Guard: employees are now paranoid, so the DB-level RESTRICT on
            // facility_occupants.employee_id never fires (destroy = UPDATE, not
            // DELETE). Enforce the business rule at the app layer: an employee
            // who still actively occupies a room must not be deletable.
            // Dynamic import keeps the hr->facility dependency out of module load.
            const { default: FacilityOccupant } = await import('../../facility/models/Occupant');
            const activeOccupant = await FacilityOccupant.count({
                where: { employee_id: id, status: 'Aktif' },
                transaction: t,
            });
            if (activeOccupant > 0) {
                const err: any = new Error('Karyawan masih menjadi penghuni aktif suatu ruangan dan tidak dapat dihapus. Lakukan checkout terlebih dahulu.');
                err.statusCode = 409;
                throw err;
            }

            // Soft-delete is now paranoid, so destroy() only UPDATEs deleted_at on
            // the parent — the DB FK CASCADE does NOT fire. Soft-delete children
            // explicitly so they follow the parent and can be restored together.
            await EmployeePersonalInfo.destroy({ where: { employee_id: id }, transaction: t });
            await EmployeeHRInfo.destroy({ where: { employee_id: id }, transaction: t });
            await EmployeeFamilyInfo.destroy({ where: { employee_id: id }, transaction: t });
            await EmployeeDocument.destroy({ where: { employee_id: id }, transaction: t });

            await employee.destroy({ transaction: t });

            await t.commit();
            return true;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async restoreEmployee(id: number) {
        const t = await sequelize.transaction();
        try {
            // Find the soft-deleted parent (paranoid:false to see it).
            const employee = await Employee.findByPk(id, { paranoid: false, transaction: t });
            if (!employee) throw new Error('Employee not found');
            if (!(employee as any).deleted_at) {
                await t.rollback();
                return employee; // already active
            }

            await employee.restore({ transaction: t });
            await EmployeePersonalInfo.restore({ where: { employee_id: id }, transaction: t });
            await EmployeeHRInfo.restore({ where: { employee_id: id }, transaction: t });
            await EmployeeFamilyInfo.restore({ where: { employee_id: id }, transaction: t });
            await EmployeeDocument.restore({ where: { employee_id: id }, transaction: t });

            await t.commit();
            return employee;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async validateNIKUnique(nik: string, excludeId?: number) {
        const where: any = { nomor_induk_karyawan: nik };
        if (excludeId) {
            where.id = { [Op.ne]: excludeId };
        }
        // paranoid:false so a soft-deleted employee's NIK is still treated as taken
        // (the DB unique index includes soft-deleted rows — NIK stays locked).
        const existing = await Employee.findOne({ where, paranoid: false });
        return existing === null;
    }
}

export default new EmployeeService();
