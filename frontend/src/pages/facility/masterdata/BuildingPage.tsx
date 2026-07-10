import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import {
    useFacBuildingList,
    useCreateFacilityMasterData,
    useUpdateFacilityMasterData,
    useDeleteFacilityMasterData,
} from '../../../hooks/useFacilityMasterData';
import { useLokasiKerjaList } from '../../../hooks/useMasterData';
import { useEmployeeList } from '../../../hooks/useEmployee';
import MasterDataTable, { Column } from '../../../components/hr/MasterDataTable';
import LayoutSwitcher from '../../../components/layout/LayoutSwitcher';
import MasterDataLayout from '../../../components/layout/MasterDataLayout';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SearchFilter from '../../../components/common/SearchFilter';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import Button from '../../../components/common/Button';
import { FacBuilding, BuildingTipe } from '../../../types/facility';
import { LayoutView } from '../../../types/layout';

interface BuildingFormData {
    nama: string;
    tipe: BuildingTipe | '';
    lokasi_kerja_id: string;
    penanggung_jawab_id: string;
    alamat: string;
    kapasitas_total: string;
    keterangan: string;
    status: boolean;
}

const TIPE_OPTIONS: { label: string; value: BuildingTipe }[] = [
    { label: 'Mess', value: 'Mess' },
    { label: 'Kantor', value: 'Kantor' },
    { label: 'Workshop', value: 'Workshop' },
    { label: 'Lainnya', value: 'Lainnya' },
];

const BuildingForm = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
}: {
    initialValues?: FacBuilding | null;
    onSubmit: (data: Record<string, unknown>) => void;
    onCancel: () => void;
    isLoading?: boolean;
}) => {
    const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<BuildingFormData>({
        defaultValues: { nama: '', tipe: '', lokasi_kerja_id: '', penanggung_jawab_id: '', alamat: '', kapasitas_total: '', keterangan: '', status: true },
    });

    const { data: lokasiData } = useLokasiKerjaList({ limit: 100, status: 'Aktif' });
    const { data: empData } = useEmployeeList();
    const lokasiList = lokasiData?.data || [];
    const employees: any[] = empData?.data || [];

    useEffect(() => {
        if (initialValues && Object.keys(initialValues).length > 0) {
            reset({
                nama: initialValues.nama || '',
                tipe: initialValues.tipe || '',
                lokasi_kerja_id: initialValues.lokasi_kerja_id ? String(initialValues.lokasi_kerja_id) : '',
                penanggung_jawab_id: initialValues.penanggung_jawab_id ? String(initialValues.penanggung_jawab_id) : '',
                alamat: initialValues.alamat || '',
                kapasitas_total: initialValues.kapasitas_total != null ? String(initialValues.kapasitas_total) : '',
                keterangan: initialValues.keterangan || '',
                status: initialValues.status === 'Aktif' || initialValues.status === undefined,
            });
        } else {
            reset({ nama: '', tipe: '', lokasi_kerja_id: '', penanggung_jawab_id: '', alamat: '', kapasitas_total: '', keterangan: '', status: true });
        }
    }, [initialValues, reset]);

    const onFormSubmit = (data: BuildingFormData) => {
        onSubmit({
            nama: data.nama,
            tipe: data.tipe || null,
            lokasi_kerja_id: data.lokasi_kerja_id ? Number(data.lokasi_kerja_id) : null,
            penanggung_jawab_id: data.penanggung_jawab_id ? Number(data.penanggung_jawab_id) : null,
            alamat: data.alamat || null,
            kapasitas_total: data.kapasitas_total ? Number(data.kapasitas_total) : null,
            keterangan: data.keterangan || null,
            status: data.status ? 'Aktif' : 'Tidak Aktif',
        });
    };

    const cls = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm border-gray-300';
    const lbl = 'text-sm font-medium text-gray-700 dark:text-gray-300';

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Nama Gedung <span className="text-red-500">*</span></label>
                <input {...register('nama', { required: 'Nama Gedung harus diisi' })} className={`${cls} ${errors.nama ? 'border-red-500' : ''}`} placeholder="Contoh: Mess Karyawan A" />
                {errors.nama && <span className="text-xs text-red-500">{errors.nama.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Tipe <span className="text-red-500">*</span></label>
                <select {...register('tipe', { required: 'Tipe harus dipilih' })} className={`${cls} ${errors.tipe ? 'border-red-500' : ''}`}>
                    <option value="">Pilih Tipe</option>
                    {TIPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {errors.tipe && <span className="text-xs text-red-500">{errors.tipe.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Lokasi Kerja</label>
                <Controller
                    control={control}
                    name="lokasi_kerja_id"
                    render={({ field: { value } }) => (
                        <SearchableSelect
                            options={lokasiList.map((l: any) => ({ label: l.nama, value: l.id }))}
                            value={value || null}
                            onChange={(val) => setValue('lokasi_kerja_id', val ? String(val) : '')}
                            placeholder="Pilih Lokasi Kerja"
                        />
                    )}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Alamat</label>
                <textarea {...register('alamat')} className={cls} placeholder="Alamat lengkap gedung" rows={2} />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Penanggung Jawab</label>
                <Controller
                    control={control}
                    name="penanggung_jawab_id"
                    render={({ field: { value } }) => (
                        <SearchableSelect
                            options={employees.map((e: any) => ({ label: e.nama_lengkap, value: e.id }))}
                            value={value || null}
                            onChange={(val) => setValue('penanggung_jawab_id', val ? String(val) : '')}
                            placeholder="Pilih Penanggung Jawab"
                        />
                    )}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Kapasitas Total</label>
                <input type="number" {...register('kapasitas_total')} className={cls} placeholder="Jumlah kapasitas" min={0} />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Keterangan</label>
                <textarea {...register('keterangan')} className={cls} rows={2} />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Status</label>
                <Controller
                    control={control}
                    name="status"
                    render={({ field: { onChange, value } }) => (
                        <div className="flex items-center">
                            <button
                                type="button"
                                className={`${value ? 'bg-primary' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                                onClick={() => onChange(!value)}
                            >
                                <span className={`${value ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                            </button>
                            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{value ? 'Aktif' : 'Tidak Aktif'}</span>
                        </div>
                    )}
                />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>Batal</Button>
                <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>Simpan</Button>
            </div>
        </form>
    );
};

const BuildingPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FacBuilding | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const [layout, setLayout] = useState<LayoutView>(() => {
        const saved = localStorage.getItem('masterDataLayout');
        return (saved as LayoutView) || LayoutView.VIEW_1;
    });

    const { data, isLoading } = useFacBuildingList({ page, limit: 10, search, status });
    const createMutation = useCreateFacilityMasterData<FacBuilding>('building');
    const updateMutation = useUpdateFacilityMasterData<FacBuilding>('building');
    const deleteMutation = useDeleteFacilityMasterData('building');

    const columns: Column<FacBuilding>[] = [
        { header: 'No', accessor: (_, index) => (page - 1) * 10 + index + 1, className: 'w-16' },
        { header: 'Code', accessor: 'code' },
        { header: 'Nama Gedung', accessor: 'nama' },
        { header: 'Tipe', accessor: 'tipe' },
        { header: 'Lokasi Kerja', accessor: (item: FacBuilding) => item.lokasi_kerja?.nama || '-' },
        { header: 'Penanggung Jawab', accessor: (item: FacBuilding) => item.penanggung_jawab?.nama_lengkap || '-' },
        { header: 'Kapasitas', accessor: (item: FacBuilding) => item.kapasitas_total != null ? String(item.kapasitas_total) : '-' },
        { header: 'Status', accessor: 'status' },
    ];

    const handleAdd = () => { setModalMode('create'); setSelectedItem(null); setIsModalOpen(true); };
    const handleEdit = (item: FacBuilding) => { setModalMode('edit'); setSelectedItem(item); setIsModalOpen(true); };
    const handleDelete = (item: FacBuilding) => { setSelectedItem(item); setIsConfirmOpen(true); };

    const onFormSubmit = (formData: Record<string, unknown>) => {
        if (modalMode === 'create') {
            createMutation.mutate(formData, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Data berhasil disimpan'); },
                onError: (err: AxiosError<{ message: string }>) => { toast.error(err.response?.data?.message || 'Gagal menyimpan data'); }
            });
        } else {
            if (!selectedItem) return;
            updateMutation.mutate({ id: selectedItem.id, data: formData }, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Data berhasil diperbarui'); },
                onError: (err: AxiosError<{ message: string }>) => { toast.error(err.response?.data?.message || 'Gagal memperbarui data'); }
            });
        }
    };

    const onConfirmDelete = () => {
        if (!selectedItem) return;
        deleteMutation.mutate(selectedItem.id, {
            onSuccess: () => { setIsConfirmOpen(false); toast.success('Data berhasil dihapus'); },
            onError: (err: AxiosError<{ message: string }>) => { toast.error(err.response?.data?.message || 'Gagal menghapus data'); }
        });
    };

    return (
        <MasterDataLayout view={layout}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gedung</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola data gedung dan bangunan</p>
                    </div>
                </div>

                <SearchFilter onSearchChange={setSearch} onFilterChange={setStatus} onAdd={handleAdd} addButtonText="Tambah Gedung" transparent={true} />

                <div className="mb-4 flex justify-end">
                    <LayoutSwitcher currentLayout={layout} onLayoutChange={setLayout} />
                </div>

                <MasterDataTable permissionResource="facility_master_data" view={layout} columns={columns} data={data?.data || []} isLoading={isLoading}
                    pagination={{ page: data?.pagination?.page || 1, totalPages: data?.pagination?.totalPages || 1, totalItems: data?.pagination?.total || 0, onPageChange: setPage }}
                    onEdit={handleEdit} onDelete={handleDelete} transparent={true} />

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Tambah Gedung' : 'Edit Gedung'} size="lg">
                    <BuildingForm
                        initialValues={selectedItem}
                        onSubmit={onFormSubmit}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>

                <ConfirmDialog isOpen={isConfirmOpen} title="Hapus Gedung"
                    message={`Apakah Anda yakin ingin menghapus gedung ${selectedItem?.nama}?`}
                    onConfirm={onConfirmDelete} onCancel={() => setIsConfirmOpen(false)} isLoading={deleteMutation.isPending} />
            </div>
        </MasterDataLayout>
    );
};

export default BuildingPage;
