/**
 * Reusable Swagger Schemas
 * Used by JSDoc annotations in routes
 */

export const swaggerSchemas = {
    ApiError: {
        type: 'object',
        properties: {
            message: { type: 'string' },
            error: { type: 'string' },
            statusCode: { type: 'number' }
        }
    },
    PaginationResponse: {
        type: 'object',
        properties: {
            items: { type: 'array', items: { type: 'object' } },
            meta: {
                type: 'object',
                properties: {
                    total: { type: 'number' },
                    page: { type: 'number' },
                    lastPage: { type: 'number' }
                }
            }
        }
    },
    EmployeeHead: {
        type: 'object',
        required: ['nama_lengkap', 'nomor_induk_karyawan'],
        properties: {
            id: { type: 'number' },
            nama_lengkap: { type: 'string', example: 'Budi Santoso' },
            nomor_induk_karyawan: { type: 'string', example: '1234567890123456' },
            foto_karyawan: { type: 'string', format: 'binary' },
            divisi_id: { type: 'number' },
            department_id: { type: 'number' },
            posisi_jabatan_id: { type: 'number' },
            atasan_id: { type: 'number', nullable: true },
            status_karyawan_id: { type: 'number' },
            lokasi_kerja_id: { type: 'number' }
        }
    },
    EmployeePersonalInfo: {
        type: 'object',
        properties: {
            tempat_lahir: { type: 'string' },
            tanggal_lahir: { type: 'string', format: 'date' },
            jenis_kelamin: { type: 'string', enum: ['L', 'P'] },
            agama: { type: 'string' },
            golongan_darah: { type: 'string', enum: ['A', 'B', 'AB', 'O'] },
            nomor_kk: { type: 'string' },
            nomor_ktp: { type: 'string' },
            nomor_npwp: { type: 'string' },
            nomor_bpjs_kesehatan: { type: 'string' },
            nomor_bpjs_ketenagakerjaan: { type: 'string' },
            alamat_ktp: { type: 'string' },
            alamat_domisili: { type: 'string' },
            nomor_handphone: { type: 'string' },
            email_pribadi: { type: 'string', format: 'email' },
            status_pernikahan: { type: 'string' },
            nomor_rekening: { type: 'string' },
            nama_bank: { type: 'string' }
        }
    },
    EmployeeHRInfo: {
        type: 'object',
        properties: {
            jenis_hubungan_kerja_id: { type: 'number' },
            tanggal_masuk: { type: 'string', format: 'date' },
            tanggal_kontrak_mulai: { type: 'string', format: 'date' },
            tanggal_kontrak_selesai: { type: 'string', format: 'date' },
            kategori_pangkat_id: { type: 'number' },
            golongan_id: { type: 'number' },
            sub_golongan_id: { type: 'number' },
            lokasi_kerja_id: { type: 'number' },
            point_of_hire: { type: 'string' },
            point_of_original: { type: 'string' }
        }
    },
    EmployeeFamilyInfo: {
        type: 'object',
        properties: {
            nama_pasangan: { type: 'string' },
            data_anak: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        nama: { type: 'string' },
                        tanggal_lahir: { type: 'string', format: 'date' }
                    }
                }
            },
            data_saudara_kandung: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        nama: { type: 'string' },
                        hubungan: { type: 'string' }
                    }
                }
            }
        }
    },
    MasterData: {
        type: 'object',
        properties: {
            id: { type: 'number' },
            nama: { type: 'string' },
            kode: { type: 'string' },
            keterangan: { type: 'string' },
            status: { type: 'string', enum: ['Aktif', 'Tidak Aktif'] }
        }
    },
    AuditLog: {
        type: 'object',
        properties: {
            id: { type: 'number' },
            user_id: { type: 'number' },
            action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE'] },
            entity_type: { type: 'string' },
            entity_id: { type: 'number' },
            changes: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' }
        }
    },
    ImportPreviewRow: {
        type: 'object',
        properties: {
            row_number: { type: 'number' },
            data: { type: 'object' },
            errors: { type: 'array', items: { type: 'string' } },
            isValid: { type: 'boolean' }
        }
    },
    Document: {
        type: 'object',
        properties: {
            id: { type: 'number' },
            employee_id: { type: 'number' },
            document_type: { type: 'string' },
            file_name: { type: 'string' },
            file_path: { type: 'string' },
            upload_date: { type: 'string', format: 'date-time' }
        }
    },
    DashboardStats: {
        type: 'object',
        properties: {
            totalEmployees: { type: 'number' },
            activeEmployees: { type: 'number' },
            newHiresThisMonth: { type: 'number' },
            upcomingContractExpirations: { type: 'number' }
        }
    }
};
