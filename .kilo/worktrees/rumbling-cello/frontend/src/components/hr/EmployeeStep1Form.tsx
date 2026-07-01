import React, { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeStep1Schema, EmployeeStep1FormValues } from '../../schemas/employee.schema';
import Input from '../common/Input';
import { SearchableSelect } from '../common/SearchableSelect';
import { PhotoUpload } from './PhotoUpload';
import Button from '../common/Button';
import {
    useDivisiList,
    useStatusKaryawanList,
    useLokasiKerjaList,
    useTagList,
    useDeptByDivisi,
    usePosisiByDept,
    useManagerList,
    useActiveEmployees
} from '../../hooks/useMasterData';
import { validationService } from '../../services/validation.service';
import { formatNPWP, formatPhoneNumber, formatEmployeeNIK } from '../../utils/validators';

import { DocumentUpload } from './DocumentUpload';

interface EmployeeStep1FormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any;
    employeeId?: number;
    onNext: (data: EmployeeStep1FormValues) => void;
    onSaveDraft?: (data: Partial<EmployeeStep1FormValues>) => void;
    onCancel: () => void;
}

export const EmployeeStep1Form: React.FC<EmployeeStep1FormProps> = ({ initialData, employeeId, onNext, onSaveDraft, onCancel }) => {
    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        setError,
        clearErrors,
        getValues,
        formState: { errors }
    } = useForm<EmployeeStep1FormValues>({
        resolver: zodResolver(employeeStep1Schema),
        defaultValues: initialData || {},
        mode: 'onChange'
    });

    // Handle save draft - gets current form values without validation
    const handleSaveDraft = () => {
        const currentValues = getValues();
        if (onSaveDraft) {
            onSaveDraft(currentValues);
        }
    };

    // Watch values for cascade & conditions
    const selectedDivisi = useWatch({ control, name: 'divisi_id' });
    const selectedDepartment = useWatch({ control, name: 'department_id' });
    const statusPernikahan = watch('status_pernikahan');
    const nik = watch('nomor_induk_karyawan');

    // NIK Validation State
    const [isNikChecking, setIsNikChecking] = React.useState(false);

    // Debounce Check NIK
    useEffect(() => {
        const checkNik = async () => {
            if (!nik || nik.length < 5) return;
            setIsNikChecking(true);
            const isUnique = await validationService.checkNIKUnique(nik, employeeId);
            setIsNikChecking(false);
            if (!isUnique) {
                setError('nomor_induk_karyawan', { type: 'manual', message: 'NIK sudah terdaftar' });
            } else {
                // Only clear manual error, let schema validation run
                // Re-trigger validation for format if needed, but schema handles format.
                // We simply explicitly clear the manual error.
                if (errors.nomor_induk_karyawan?.type === 'manual') {
                    clearErrors('nomor_induk_karyawan');
                }
            }
        };
        const timer = setTimeout(checkNik, 500);
        return () => clearTimeout(timer);
    }, [nik, employeeId, setError, clearErrors, errors.nomor_induk_karyawan?.type]);

    // Master Data Hooks (Independent)
    const { data: divisiList, isLoading: isDivisiLoading } = useDivisiList();
    const { data: statusList, isLoading: isStatusLoading } = useStatusKaryawanList();
    const { data: lokasiList, isLoading: isLokasiLoading } = useLokasiKerjaList();
    const { data: tagList, isLoading: isTagLoading } = useTagList();

    const { data: departmentList, isLoading: isDeptLoading } = useDeptByDivisi(selectedDivisi);
    const { data: posisiList, isLoading: isPosisiLoading } = usePosisiByDept(selectedDepartment);
    const { data: managerList, isLoading: isManagerLoading } = useManagerList();
    const { data: activeEmployeeList, isLoading: isActiveEmpLoading } = useActiveEmployees();

    // Default Status to Aktif
    const statusKaryawanId = watch('status_karyawan_id');
    useEffect(() => {
        if (statusList?.data && !statusKaryawanId && !employeeId) {
            const activeStatus = (statusList.data as import('../../types/hr').StatusKaryawan[]).find(s => s.nama === 'Aktif');
            if (activeStatus) {
                setValue('status_karyawan_id', activeStatus.id);
            }
        }
    }, [statusList, statusKaryawanId, employeeId, setValue]);



    // Better approach: Handle clear in the onChange of the parent component.
    // Let's remove this Effect and put logic in Controller's onChange.

    const onSubmit = (data: EmployeeStep1FormValues) => {
        onNext(data);
    };

    // Map options for selects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapOptions = (list: any[]) => list?.map(item => ({
        value: item.id,
        label: item.nama || item.nama_lengkap || item.nama_posisi || item.nama_status || item.nama_divisi || item.nama_department || item.nama_lokasi || item.nama_tag || `ID: ${item.id}`
    })) || [];

    // Helper for Manager/Atasan options (uses nama_lengkap)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapEmployeeOptions = (list: any[]) => list?.map(item => ({ value: item.id, label: `${item.nama_lengkap} - ${item.nomor_induk_karyawan}` })) || [];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1: Head (Photo & Basic Info) */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Photo Upload - Left */}
                    <div className="md:col-span-1 flex flex-col items-center justify-start pt-2">
                        <Controller
                            control={control}
                            name="foto_karyawan"
                            render={({ field: { value, onChange } }) => (
                                <PhotoUpload
                                    value={value}
                                    onChange={onChange}
                                    error={errors.foto_karyawan?.message as string}
                                />
                            )}
                        />
                    </div>

                    {/* Basic Fields - Right */}
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Controller
                                control={control}
                                name="nomor_induk_karyawan"
                                render={({ field }) => (
                                    <Input
                                        label="NIK"
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(formatEmployeeNIK(e.target.value))}
                                        error={errors.nomor_induk_karyawan?.message}
                                        required
                                        placeholder="Contoh: 24-00123"
                                    />
                                )}
                            />
                            {isNikChecking && <span className="absolute right-3 top-9 text-xs text-gray-400">Checking...</span>}
                        </div>
                        <Input
                            label="Nama Lengkap"
                            {...register('nama_lengkap')}
                            error={errors.nama_lengkap?.message}
                            required
                            autoTitleCase={true}
                            placeholder="Nama Lengkap Karyawan"
                        />
                        <Controller
                            control={control}
                            name="divisi_id"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Divisi"
                                    options={mapOptions(divisiList?.data || [])}
                                    value={field.value}
                                    onChange={(val) => {
                                        field.onChange(val);
                                        // Clear dependent fields
                                        setValue('department_id', undefined);
                                        setValue('posisi_jabatan_id', undefined);
                                    }}
                                    error={errors.divisi_id?.message}
                                    loading={isDivisiLoading}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="department_id"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Departemen"
                                    options={mapOptions(departmentList?.data || [])}
                                    value={field.value}
                                    onChange={(val) => {
                                        field.onChange(val);
                                        // Clear dependent field
                                        setValue('posisi_jabatan_id', undefined);
                                    }}
                                    error={errors.department_id?.message}
                                    placeholder={!selectedDivisi ? "Pilih Divisi terlebih dahulu" : "Pilih Departemen..."}
                                    loading={isDeptLoading}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="posisi_jabatan_id"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Posisi Jabatan"
                                    options={mapOptions(posisiList?.data || [])}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.posisi_jabatan_id?.message}
                                    placeholder={!selectedDepartment ? "Pilih Departemen terlebih dahulu" : "Pilih Posisi..."}
                                    loading={isPosisiLoading}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="status_karyawan_id"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Status Karyawan"
                                    options={mapOptions(statusList?.data || [])}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.status_karyawan_id?.message}
                                    loading={isStatusLoading}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="lokasi_kerja_id"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Lokasi Kerja"
                                    options={mapOptions(lokasiList?.data || [])}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.lokasi_kerja_id?.message}
                                    loading={isLokasiLoading}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="tag_id"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Tag Karyawan"
                                    options={mapOptions(tagList?.data || [])}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.tag_id?.message}
                                    loading={isTagLoading}
                                />
                            )}
                        />
                    </div>

                    {/* Head Extra Fields */}
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t pt-4">
                        <Input
                            label="Email Perusahaan"
                            type="email"
                            {...register('email_perusahaan')}
                            error={errors.email_perusahaan?.message}
                            placeholder="email@perusahaan.com"
                        />
                        <Controller
                            control={control}
                            name="nomor_handphone"
                            render={({ field }) => (
                                <Input
                                    label="Nomor Handphone (Utama)"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                                    error={errors.nomor_handphone?.message}
                                    placeholder="Nomor Handphone"
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="manager_id"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Manager"
                                    options={mapEmployeeOptions(managerList?.data || [])}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.manager_id?.message}
                                    loading={isManagerLoading}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="atasan_langsung_id"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Atasan Langsung"
                                    options={mapEmployeeOptions(activeEmployeeList?.data || [])}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.atasan_langsung_id?.message}
                                    loading={isActiveEmpLoading}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Section 1.5: Dokumen Identitas */}
            {employeeId && (
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <span className="mr-2">📂</span> Dokumen Identitas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DocumentUpload
                            employeeId={employeeId}
                            documentType="foto_ktp"
                            label="Foto KTP"
                            maxFiles={1}
                        />
                        <DocumentUpload
                            employeeId={employeeId}
                            documentType="foto_npwp"
                            label="Foto NPWP"
                            maxFiles={1}
                        />
                        <DocumentUpload
                            employeeId={employeeId}
                            documentType="foto_kartu_keluarga"
                            label="Foto Kartu Keluarga"
                            maxFiles={1}
                        />
                        <DocumentUpload
                            employeeId={employeeId}
                            documentType="foto_bpjs_kesehatan"
                            label="Foto BPJS Kesehatan"
                            maxFiles={1}
                        />
                        <DocumentUpload
                            employeeId={employeeId}
                            documentType="foto_bpjs_ketenagakerjaan"
                            label="Foto BPJS Ketenagakerjaan"
                            maxFiles={1}
                        />
                    </div>
                </div>
            )}

            {/* Section 2: Personal Information Details */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Informasi Detail</h3>

                {/* Group 1: Biodata */}
                <div className="mb-6">
                    <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <span className="mr-2">👤</span> Biodata
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Tempat Lahir"
                            {...register('tempat_lahir')}
                            error={errors.tempat_lahir?.message}
                            autoTitleCase={true}
                        />
                        <Input
                            label="Tanggal Lahir"
                            type="date"
                            {...register('tanggal_lahir')}
                            error={errors.tanggal_lahir?.message}
                        />
                        <Controller
                            control={control}
                            name="jenis_kelamin"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Jenis Kelamin"
                                    options={[
                                        { value: 'Laki-laki', label: 'Laki-laki' },
                                        { value: 'Perempuan', label: 'Perempuan' }
                                    ]}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.jenis_kelamin?.message}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="status_pernikahan"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Status Pernikahan"
                                    options={[
                                        { value: 'Belum Menikah', label: 'Belum Menikah' },
                                        { value: 'Menikah', label: 'Menikah' },
                                        { value: 'Cerai Hidup', label: 'Cerai Hidup' },
                                        { value: 'Cerai Mati', label: 'Cerai Mati' }
                                    ]}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.status_pernikahan?.message}
                                />
                            )}
                        />
                    </div>
                </div>

                {/* Group 2: Identifikasi */}
                <div className="mb-6 border-t pt-4">
                    <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <span className="mr-2">🆔</span> Identifikasi
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Controller
                            control={control}
                            name="agama"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Agama"
                                    options={[
                                        { value: 'Islam', label: 'Islam' },
                                        { value: 'Kristen', label: 'Kristen' },
                                        { value: 'Katolik', label: 'Katolik' },
                                        { value: 'Hindu', label: 'Hindu' },
                                        { value: 'Buddha', label: 'Buddha' },
                                        { value: 'Konghucu', label: 'Konghucu' }
                                    ]}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.agama?.message}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="golongan_darah"
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Golongan Darah"
                                    options={[
                                        { value: 'A', label: 'A' },
                                        { value: 'B', label: 'B' },
                                        { value: 'AB', label: 'AB' },
                                        { value: 'O', label: 'O' }
                                    ]}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.golongan_darah?.message}
                                />
                            )}
                        />
                        <Input
                            label="Nomor Kartu Keluarga (KK)"
                            {...register('nomor_kartu_keluarga')}
                            error={errors.nomor_kartu_keluarga?.message}
                            placeholder="Nomor KK (16 digit)"
                        />
                        <Input
                            label="Nomor KTP"
                            {...register('nomor_ktp')}
                            error={errors.nomor_ktp?.message}
                        />
                        <Controller
                            control={control}
                            name="nomor_npwp"
                            render={({ field }) => (
                                <Input
                                    label="Nomor NPWP"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(formatNPWP(e.target.value))}
                                    error={errors.nomor_npwp?.message}
                                />
                            )}
                        />
                        <Input
                            label="Nomor BPJS"
                            {...register('nomor_bpjs')}
                            error={errors.nomor_bpjs?.message}
                            placeholder="13 digit angka"
                        />
                        <Input
                            label="NIK KK"
                            {...register('no_nik_kk')}
                            error={errors.no_nik_kk?.message}
                            placeholder="NIK sesuai Kartu Keluarga"
                        />
                        <Input
                            label="Status Pajak"
                            {...register('status_pajak')}
                            error={errors.status_pajak?.message}
                            placeholder="Contoh: TK/0, K/1"
                        />
                    </div>
                </div>
                {/* Family Info - Conditional */}
                {statusPernikahan === 'Menikah' && (
                    <div className="mb-6 border-t pt-4">
                        <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                            <span className="mr-2">👨‍👩‍👧‍👦</span> Keluarga
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Nama Pasangan"
                                {...register('nama_pasangan')}
                                error={errors.nama_pasangan?.message}
                                autoTitleCase={true}
                            />
                            <Input
                                label="Pekerjaan Pasangan"
                                {...register('pekerjaan_pasangan')}
                                error={errors.pekerjaan_pasangan?.message}
                                autoTitleCase={true}
                            />
                            <Input
                                label="Tanggal Menikah"
                                type="date"
                                {...register('tanggal_menikah')}
                                error={errors.tanggal_menikah?.message}
                            />
                        </div>
                    </div>
                )}
                {statusPernikahan === 'Cerai Hidup' && (
                    <div className="mb-6 border-t pt-4">
                        <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                            <span className="mr-2">👨‍👩‍👧‍👦</span> Informasi Pasangan (Cerai)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Nama Pasangan (Mantan)"
                                {...register('nama_pasangan')}
                                error={errors.nama_pasangan?.message}
                                autoTitleCase={true}
                            />
                            <Input
                                label="Tanggal Cerai"
                                type="date"
                                {...register('tanggal_cerai')}
                                error={errors.tanggal_cerai?.message}
                            />
                        </div>
                    </div>
                )}
                {statusPernikahan === 'Cerai Mati' && (
                    <div className="mb-6 border-t pt-4">
                        <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                            <span className="mr-2">👨‍👩‍👧‍👦</span> Informasi Pasangan (Wafat)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Nama Pasangan"
                                {...register('nama_pasangan')}
                                error={errors.nama_pasangan?.message}
                                autoTitleCase={true}
                            />
                            <Input
                                label="Tanggal Wafat Pasangan"
                                type="date"
                                {...register('tanggal_wafat_pasangan')}
                                error={errors.tanggal_wafat_pasangan?.message}
                            />
                        </div>
                    </div>
                )}
                <div className="mb-6 border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Informasi Tambahan</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Jumlah Anak"
                            type="number"
                            {...register('jumlah_anak')}
                            error={errors.jumlah_anak?.message}
                        />
                    </div>
                </div>

                <hr className="my-6 border-gray-200" />

                {/* Bank Info */}
                <div className="mb-6">
                    <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <span className="mr-2">🏦</span> Informasi Bank
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Nama Bank"
                                {...register('nama_bank')}
                                error={errors.nama_bank?.message}
                                autoTitleCase={true}
                            />
                            <Input
                                label="Cabang Bank"
                                {...register('cabang_bank')}
                                error={errors.cabang_bank?.message}
                                autoTitleCase={true}
                            />
                        </div>
                        <Input
                            label="Nomor Rekening"
                            {...register('nomor_rekening')}
                            error={errors.nomor_rekening?.message}
                        />
                        <Input
                            label="Nama Pemegang Rekening"
                            {...register('nama_pemegang_rekening')}
                            error={errors.nama_pemegang_rekening?.message}
                            autoTitleCase={true}
                        />
                    </div>
                </div>

                <hr className="my-6 border-gray-200" />

                {/* Group 2: Identitas & Kontak */}
                <div className="mb-6 border-t pt-4">
                    <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <span className="mr-2">📞</span> Informasi Kontak
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Email Pribadi"
                            type="email"
                            {...register('email_pribadi')}
                            error={errors.email_pribadi?.message}
                        />
                        <Controller
                            control={control}
                            name="nomor_handphone_2"
                            render={({ field }) => (
                                <Input
                                    label="Nomor Handphone 2 (Alternatif)"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                                    error={errors.nomor_handphone_2?.message}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="nomor_telepon_rumah_1"
                            render={({ field }) => (
                                <Input
                                    label="Telp Rumah"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                                    error={errors.nomor_telepon_rumah_1?.message}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="nomor_telepon_rumah_2"
                            render={({ field }) => (
                                <Input
                                    label="Telp Rumah 2"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                                    error={errors.nomor_telepon_rumah_2?.message}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="nomor_wa"
                            render={({ field }) => (
                                <Input
                                    label="Nomor WhatsApp"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                                    error={errors.nomor_wa?.message}
                                />
                            )}
                        />
                        <Input
                            label="Akun Media Sosial"
                            {...register('akun_sosmed')}
                            error={errors.akun_sosmed?.message}
                            placeholder="Contoh: @username"
                        />
                    </div>
                </div>

                <hr className="my-6 border-gray-200" />

                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Address KTP */}
                        <div>
                            <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                <span className="mr-2">💳</span> Alamat KTP
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alamat Lengkap
                                    </label>
                                    <textarea
                                        {...register('alamat_ktp')}
                                        onChange={(e) => {
                                            const start = e.target.selectionStart;
                                            const end = e.target.selectionEnd;
                                            const words = e.target.value.split(' ');
                                            const transformed = words.map(word => {
                                                // If word is all uppercase (like PT, IT, HR), preserve it
                                                if (word === word.toUpperCase() && word.length > 0) {
                                                    return word;
                                                }
                                                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                                            }).join(' ');
                                            e.target.value = transformed;
                                            if (start !== null && end !== null) {
                                                setTimeout(() => e.target.setSelectionRange(start, end), 0);
                                            }
                                            register('alamat_ktp').onChange(e);
                                        }}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        rows={3}
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Kota/Kab"
                                        {...register('kota_ktp')}
                                        error={errors.kota_ktp?.message}
                                        autoTitleCase={true}
                                    />
                                    <Input
                                        label="Provinsi"
                                        {...register('provinsi_ktp')}
                                        error={errors.provinsi_ktp?.message}
                                        autoTitleCase={true}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Domisili */}
                        <div>
                            <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                <span className="mr-2">🏠</span> Alamat Domisili
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alamat Lengkap
                                    </label>
                                    <textarea
                                        {...register('alamat_domisili')}
                                        onChange={(e) => {
                                            const start = e.target.selectionStart;
                                            const end = e.target.selectionEnd;
                                            const words = e.target.value.split(' ');
                                            const transformed = words.map(word => {
                                                // If word is all uppercase, preserve it
                                                if (word === word.toUpperCase() && word.length > 0) {
                                                    return word;
                                                }
                                                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                                            }).join(' ');
                                            e.target.value = transformed;
                                            if (start !== null && end !== null) {
                                                setTimeout(() => e.target.setSelectionRange(start, end), 0);
                                            }
                                            register('alamat_domisili').onChange(e);
                                        }}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        rows={3}
                                    ></textarea>
                                    {errors.alamat_domisili && <p className="mt-1 text-sm text-red-600">{errors.alamat_domisili.message}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Kota/Kab"
                                        {...register('kota_domisili')}
                                        error={errors.kota_domisili?.message}
                                        autoTitleCase={true}
                                    />
                                    <Input
                                        label="Provinsi"
                                        {...register('provinsi_domisili')}
                                        error={errors.provinsi_domisili?.message}
                                        autoTitleCase={true}
                                    />
                                </div>
                                <Input
                                    label="Kode Pos"
                                    {...register('kode_pos')}
                                    error={errors.kode_pos?.message}
                                    className="w-1/2"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Footer Action Bar */}
            {/* Footer Action Bar */}
            <div className="sticky bottom-6 bg-white border border-gray-200 p-4 rounded-lg shadow-lg flex justify-end space-x-3 z-10">
                <Button variant="outline" type="button" onClick={onCancel}>
                    Batal
                </Button>
                {onSaveDraft && (
                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleSaveDraft}
                        className="border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                    >
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Simpan Draft
                    </Button>
                )}
                <Button variant="primary" type="submit" className="flex items-center">
                    Lanjut ke Informasi HR
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-2">
                        <path fillRule="evenodd" d="M16.72 7.72a.75.75 0 011.06 0l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 11-1.06-1.06l2.47-2.47H3a.75.75 0 010-1.5h16.19l-2.47-2.47a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                </Button>
            </div>
        </form >
    );
};
