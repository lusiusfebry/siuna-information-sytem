import React, { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeStep2Schema, EmployeeStep2FormValues } from '../../schemas/employee.schema';
import Input from '../common/Input';
import { SearchableSelect } from '../common/SearchableSelect';
import Button from '../common/Button';
import {
    useJenisHubunganKerjaList,
    useKategoriPangkatList,
    useGolonganList,
    useSubGolonganList,
    useLokasiKerjaList,
    usePosisiByDept,
    useDivisiList,
    useDepartmentList,
    useManagerList,
    useActiveEmployees
} from '../../hooks/useMasterData';
import {
    BriefcaseIcon,
    DocumentTextIcon,
    AcademicCapIcon,
    StarIcon,
    PhoneIcon,
    MapPinIcon,
    TagIcon,
    ArrowsRightLeftIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';

import { DocumentUpload } from './DocumentUpload';

interface EmployeeStep2FormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headData?: any;
    employeeId?: number;
    onNext: (data: EmployeeStep2FormValues) => void;
    onSaveDraft?: (data: Partial<EmployeeStep2FormValues>) => void;
    onBack: () => void;
}

export const EmployeeStep2Form: React.FC<EmployeeStep2FormProps> = ({ initialData, headData, employeeId, onNext, onSaveDraft, onBack }) => {
    const {
        register,
        control,
        handleSubmit,
        setValue,
        getValues,
        reset, // Added reset
        formState: { errors }
    } = useForm<EmployeeStep2FormValues>({
        resolver: zodResolver(employeeStep2Schema),
        defaultValues: {
            ...initialData,
            // Pre-populate read-only fields from headData if available
            nomor_induk_karyawan: headData?.nomor_induk_karyawan,
            posisi_jabatan_id: headData?.posisi_jabatan_id,
            divisi_id: headData?.divisi_id,
            department_id: headData?.department_id,
            email_perusahaan: headData?.email_perusahaan,
            manager_id: headData?.manager_id,
            atasan_langsung_id: headData?.atasan_langsung_id,
        },
        mode: 'onChange'
    });

    // Watchers

    useEffect(() => {
        if (headData) {
            setValue('nomor_induk_karyawan', headData.nomor_induk_karyawan);
            setValue('posisi_jabatan_id', headData.posisi_jabatan_id);
            setValue('divisi_id', headData.divisi_id);
            setValue('department_id', headData.department_id);
            setValue('email_perusahaan', headData.email_perusahaan);
            setValue('manager_id', headData.manager_id);
            setValue('atasan_langsung_id', headData.atasan_langsung_id);
        }
    }, [headData, setValue]);

    // Update form values when initialData changes (e.g. after fetch)
    useEffect(() => {
        if (initialData) {
            // merge headData if needed, but initialData should have everything from EditPage flattening
            // We use reset to update all fields including Pangkat, Seragam, etc.
            // We must preserve headData fields if they are not in initialData (though they should be)
            const formValues = {
                ...initialData,
                // Ensure headData overrides if present (as it comes from Step 1 context)
                ...(headData?.nomor_induk_karyawan ? { nomor_induk_karyawan: headData.nomor_induk_karyawan } : {}),
                ...(headData?.posisi_jabatan_id ? { posisi_jabatan_id: headData.posisi_jabatan_id } : {}),
                ...(headData?.divisi_id ? { divisi_id: headData.divisi_id } : {}),
                ...(headData?.department_id ? { department_id: headData.department_id } : {}),
                ...(headData?.email_perusahaan ? { email_perusahaan: headData.email_perusahaan } : {}),
                ...(headData?.manager_id ? { manager_id: headData.manager_id } : {}),
                ...(headData?.atasan_langsung_id ? { atasan_langsung_id: headData.atasan_langsung_id } : {}),
            };

            // Validate that we actually have data to reset
            if (Object.keys(initialData).length > 0) {
                reset(formValues);
            }
        }
    }, [initialData, headData, reset]);

    // Master Data Hooks
    const { data: jenisKontrakList } = useJenisHubunganKerjaList();
    const { data: kategoriPangkatList } = useKategoriPangkatList();
    const { data: golonganList } = useGolonganList();
    const { data: subGolonganList } = useSubGolonganList();
    const { data: lokasiList } = useLokasiKerjaList();

    // Additional hooks for Kepegawaian display
    const { data: posisiJabatanList } = usePosisiByDept(headData?.department_id ? Number(headData.department_id) : undefined);
    const { data: divisiList } = useDivisiList();
    const { data: departmentList } = useDepartmentList();

    // Use correct hooks for Manager and Atasan lookup to match Step 1
    const { data: managerList } = useManagerList();
    const { data: activeEmployeeList } = useActiveEmployees();

    // Helper functions to lookup names by ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getPosisiJabatanName = (id: any) => {
        if (!id || !posisiJabatanList?.data) return '-';
        const numId = Number(id);
        const found = posisiJabatanList.data.find((item: { id: number; nama: string }) => item.id === numId);
        return found?.nama || '-';
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getDivisiName = (id: any) => {
        if (!id || !divisiList?.data) return '-';
        const numId = Number(id);
        const found = divisiList.data.find((item: { id: number; nama: string }) => item.id === numId);
        return found?.nama || '-';
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getDepartmentName = (id: any) => {
        if (!id || !departmentList?.data) return '-';
        const numId = Number(id);
        const found = departmentList.data.find((item: { id: number; nama: string }) => item.id === numId);
        return found?.nama || '-';
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getManagerName = (id: any) => {
        if (!id || !managerList?.data) return '-';
        const numId = Number(id);
        // Managers usually are employees, so we check nama_lengkap
        const found = managerList.data.find((item: { id: number; nama_lengkap: string }) => item.id === numId);
        return found?.nama_lengkap || '-';
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getAtasanName = (id: any) => {
        if (!id || !activeEmployeeList?.data) return '-';
        const numId = Number(id);
        const found = activeEmployeeList.data.find((item: { id: number; nama_lengkap: string }) => item.id === numId);
        return found?.nama_lengkap || '-';
    };

    // Determine if contract dates should be shown
    const selectedJenisKontrakId = useWatch({ control, name: 'jenis_hubungan_kerja_id' });
    const isContract = React.useMemo(() => {
        const list = jenisKontrakList?.data;
        if (!list || !selectedJenisKontrakId) return false;
        const selected = list.find(item => item.id === selectedJenisKontrakId);
        if (!selected) return false;
        const name = selected.nama.toLowerCase();
        return name.includes('kontrak') || name.includes('pkwt') || name.includes('magang') || name.includes('intern');
    }, [jenisKontrakList, selectedJenisKontrakId]);

    const onSubmit = (data: EmployeeStep2FormValues) => {
        onNext(data);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapOptions = (list: any[]) => list?.map(item => ({ value: item.id, label: item.nama })) || [];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Section 1: Kepegawaian (Read-Only from Head) */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <BriefcaseIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Kepegawaian
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="NIK" disabled {...register('nomor_induk_karyawan')} className="bg-gray-100 placeholder-gray-500" />
                    <Input label="Email Perusahaan" disabled {...register('email_perusahaan')} className="bg-gray-100 placeholder-gray-500" />
                    {/* Display names looked up from master data */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Posisi Jabatan</label>
                        <input
                            disabled
                            value={getPosisiJabatanName(headData?.posisi_jabatan_id)}
                            className="bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-500"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Divisi</label>
                        <input
                            disabled
                            value={getDivisiName(headData?.divisi_id)}
                            className="bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-500"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Departemen</label>
                        <input
                            disabled
                            value={getDepartmentName(headData?.department_id)}
                            className="bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-500"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                        <input
                            disabled
                            value={getManagerName(headData?.manager_id)}
                            className="bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-500"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Atasan Langsung</label>
                        <input
                            disabled
                            value={getAtasanName(headData?.atasan_langsung_id)}
                            className="bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Kontrak */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <DocumentTextIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Kontrak & Tanggal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                        control={control}
                        name="jenis_hubungan_kerja_id"
                        render={({ field }) => (
                            <SearchableSelect
                                label="Jenis Hubungan Kerja"
                                options={mapOptions(jenisKontrakList?.data || [])}
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.jenis_hubungan_kerja_id?.message}
                            />
                        )}
                    />
                    <Input label="Tanggal Masuk Group" type="date" {...register('tanggal_masuk_group')} error={errors.tanggal_masuk_group?.message} />
                    <Input label="Tanggal Masuk" type="date" {...register('tanggal_masuk')} error={errors.tanggal_masuk?.message} />
                    <Input label="Tanggal Permanent" type="date" {...register('tanggal_permanent')} error={errors.tanggal_permanent?.message} />

                    {isContract && (
                        <>
                            <Input label="Tanggal Kontrak" type="date" {...register('tanggal_kontrak')} error={errors.tanggal_kontrak?.message} />
                            <Input label="Tanggal Akhir Kontrak" type="date" {...register('tanggal_akhir_kontrak')} error={errors.tanggal_akhir_kontrak?.message} />
                        </>
                    )}

                    <Input label="Tanggal Berhenti" type="date" {...register('tanggal_berhenti')} error={errors.tanggal_berhenti?.message} />
                </div>
            </div>

            {/* Section 2.5: Dokumen Kontrak */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <DocumentTextIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Dokumen Kontrak
                </h4>
                {employeeId ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DocumentUpload
                            employeeId={employeeId}
                            documentType="surat_kontrak"
                            label="Surat Kontrak"
                            maxFiles={5}
                        />
                        <DocumentUpload
                            employeeId={employeeId}
                            documentType="dokumen_lainnya"
                            label="Dokumen Pendukung Lainnya"
                            maxFiles={5}
                        />
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">Dokumen dapat diupload setelah data karyawan disimpan terlebih dahulu.</p>
                    </div>
                )}
            </div>

            {/* Section 3: Education */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <AcademicCapIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Pendidikan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Tingkat Pendidikan" {...register('tingkat_pendidikan')} error={errors.tingkat_pendidikan?.message} autoTitleCase={true} />
                    <Input label="Bidang Studi" {...register('bidang_studi')} error={errors.bidang_studi?.message} autoTitleCase={true} />
                    <Input label="Nama Sekolah" {...register('nama_sekolah')} error={errors.nama_sekolah?.message} autoTitleCase={true} />
                    <Input label="Kota Sekolah" {...register('kota_sekolah')} error={errors.kota_sekolah?.message} autoTitleCase={true} />
                    <Input label="Status Kelulusan" {...register('status_kelulusan')} error={errors.status_kelulusan?.message} autoTitleCase={true} />
                    <div className="col-span-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Pendidikan</label>
                        <textarea
                            {...register('keterangan_pendidikan')}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            {/* Section 4: Pangkat */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <StarIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Pangkat & Golongan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                        control={control}
                        name="kategori_pangkat_id"
                        render={({ field }) => (
                            <SearchableSelect
                                label="Kategori Pangkat"
                                options={mapOptions(kategoriPangkatList?.data || [])}
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.kategori_pangkat_id?.message}
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="golongan_pangkat_id"
                        render={({ field }) => (
                            <SearchableSelect
                                label="Golongan"
                                options={mapOptions(golonganList?.data || [])}
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.golongan_pangkat_id?.message}
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="sub_golongan_pangkat_id"
                        render={({ field }) => (
                            <SearchableSelect
                                label="Sub Golongan"
                                options={mapOptions(subGolonganList?.data || [])}
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.sub_golongan_pangkat_id?.message}
                            />
                        )}
                    />
                    <Input label="No. Dana Pensiun" {...register('no_dana_pensiun')} error={errors.no_dana_pensiun?.message} />
                </div>
            </div>

            {/* Section 5: Kontak Darurat */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <PhoneIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Kontak Darurat
                </h4>

                {/* Kontak 1 */}
                <div className="mb-6">
                    <h5 className="font-medium text-gray-700 mb-3">Kontak Darurat 1</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nama" {...register('nama_kontak_darurat_1')} error={errors.nama_kontak_darurat_1?.message} autoTitleCase={true} />
                        <Input label="Nomor Telepon" {...register('nomor_telepon_kontak_darurat_1')} error={errors.nomor_telepon_kontak_darurat_1?.message} />
                        <Input label="Hubungan" {...register('hubungan_kontak_darurat_1')} error={errors.hubungan_kontak_darurat_1?.message} autoTitleCase={true} />
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                            <textarea
                                {...register('alamat_kontak_darurat_1')}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                <hr className="my-4" />

                {/* Kontak 2 */}
                <div>
                    <h5 className="font-medium text-gray-700 mb-3">Kontak Darurat 2</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nama" {...register('nama_kontak_darurat_2')} error={errors.nama_kontak_darurat_2?.message} autoTitleCase={true} />
                        <Input label="Nomor Telepon" {...register('nomor_telepon_kontak_darurat_2')} error={errors.nomor_telepon_kontak_darurat_2?.message} />
                        <Input label="Hubungan" {...register('hubungan_kontak_darurat_2')} error={errors.hubungan_kontak_darurat_2?.message} autoTitleCase={true} />
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                            <textarea
                                {...register('alamat_kontak_darurat_2')}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                rows={2}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 6: POO/POH */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <MapPinIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Point of Origin / Hire
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Point of Origin" {...register('point_of_original')} error={errors.point_of_original?.message} />
                    <Input label="Point of Hire" {...register('point_of_hire')} error={errors.point_of_hire?.message} />
                </div>
            </div>

            {/* Section 7: Seragam */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <TagIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Seragam & Sepatu
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Ukuran Seragam" {...register('ukuran_seragam_kerja')} error={errors.ukuran_seragam_kerja?.message} />
                    <Input label="Ukuran Sepatu" {...register('ukuran_sepatu_kerja')} error={errors.ukuran_sepatu_kerja?.message} />
                </div>
            </div>

            {/* Section 8: Pergerakan */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <ArrowsRightLeftIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Pergerakan Karyawan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                        control={control}
                        name="lokasi_sebelumnya_id"
                        render={({ field }) => (
                            <SearchableSelect
                                label="Lokasi Sebelumnya"
                                options={mapOptions(lokasiList?.data || [])}
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.lokasi_sebelumnya_id?.message}
                            />
                        )}
                    />
                    <Input label="Tanggal Mutasi" type="date" {...register('tanggal_mutasi')} error={errors.tanggal_mutasi?.message} />
                </div>
            </div>

            {/* Section 9: Costing */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <BanknotesIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Costing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Siklus Pembayaran Gaji" {...register('siklus_pembayaran_gaji')} error={errors.siklus_pembayaran_gaji?.message} />
                    <Input label="Costing" {...register('costing')} error={errors.costing?.message} />
                    <Input label="Assign" {...register('assign')} error={errors.assign?.message} />
                    <Input label="Actual" {...register('actual')} error={errors.actual?.message} />
                </div>
            </div>

            {/* Footer Action Bar */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 flex justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                <div>
                    {onSaveDraft && (
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => onSaveDraft(getValues())}
                            className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                            <span className="material-symbols-outlined text-[18px] mr-2">draft</span>
                            Simpan Draft
                        </Button>
                    )}
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" type="button" onClick={onBack}>
                        Kembali
                    </Button>
                    <Button variant="primary" type="submit" className="flex items-center">
                        Lanjut ke Informasi Keluarga
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-2">
                            <path fillRule="evenodd" d="M16.72 7.72a.75.75 0 011.06 0l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 11-1.06-1.06l2.47-2.47H3a.75.75 0 010-1.5h16.19l-2.47-2.47a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                    </Button>
                </div>
            </div>

        </form >
    );
};
