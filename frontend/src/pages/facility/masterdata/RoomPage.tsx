import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import {
    useFacRoomList,
    useFacBuildingList,
    useFacRoomTypeList,
    useCreateFacilityMasterData,
    useUpdateFacilityMasterData,
    useDeleteFacilityMasterData,
} from '../../../hooks/useFacilityMasterData';
import MasterDataTable, { Column } from '../../../components/hr/MasterDataTable';
import LayoutSwitcher from '../../../components/layout/LayoutSwitcher';
import MasterDataLayout from '../../../components/layout/MasterDataLayout';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SearchFilter from '../../../components/common/SearchFilter';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import Button from '../../../components/common/Button';
import { FacRoom, RoomStatus } from '../../../types/facility';
import { LayoutView } from '../../../types/layout';

interface RoomFormData {
    nama: string;
    building_id: string;
    room_type_id: string;
    lantai: string;
    kapasitas: string;
    keterangan: string;
    status: RoomStatus;
}

const ROOM_STATUS_OPTIONS: { label: string; value: RoomStatus }[] = [
    { label: 'Tersedia', value: 'Tersedia' },
    { label: 'Penuh', value: 'Penuh' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Tidak Aktif', value: 'Tidak Aktif' },
];

const RoomForm = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
}: {
    initialValues?: FacRoom | null;
    onSubmit: (data: Record<string, unknown>) => void;
    onCancel: () => void;
    isLoading?: boolean;
}) => {
    const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<RoomFormData>({
        defaultValues: { nama: '', building_id: '', room_type_id: '', lantai: '', kapasitas: '', keterangan: '', status: 'Tersedia' },
    });

    const { data: buildingData } = useFacBuildingList({ limit: 100, status: 'Aktif' });
    const { data: roomTypeData } = useFacRoomTypeList({ limit: 100, status: 'Aktif' });
    const buildingList = buildingData?.data || [];
    const roomTypeList = roomTypeData?.data || [];

    useEffect(() => {
        if (initialValues && Object.keys(initialValues).length > 0) {
            reset({
                nama: initialValues.nama || '',
                building_id: initialValues.building_id ? String(initialValues.building_id) : '',
                room_type_id: initialValues.room_type_id ? String(initialValues.room_type_id) : '',
                lantai: initialValues.lantai || '',
                kapasitas: initialValues.kapasitas != null ? String(initialValues.kapasitas) : '',
                keterangan: initialValues.keterangan || '',
                status: initialValues.status || 'Tersedia',
            });
        } else {
            reset({ nama: '', building_id: '', room_type_id: '', lantai: '', kapasitas: '', keterangan: '', status: 'Tersedia' });
        }
    }, [initialValues, reset]);

    const onFormSubmit = (data: RoomFormData) => {
        onSubmit({
            nama: data.nama,
            building_id: data.building_id ? Number(data.building_id) : null,
            room_type_id: data.room_type_id ? Number(data.room_type_id) : null,
            lantai: data.lantai || null,
            kapasitas: data.kapasitas ? Number(data.kapasitas) : 1,
            keterangan: data.keterangan || null,
            status: data.status ? 'Aktif' : 'Tidak Aktif',
        });
    };

    const cls = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm border-gray-300';
    const lbl = 'text-sm font-medium text-gray-700 dark:text-gray-300';

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Nama Ruangan <span className="text-red-500">*</span></label>
                <input {...register('nama', { required: 'Nama Ruangan harus diisi' })} className={`${cls} ${errors.nama ? 'border-red-500' : ''}`} placeholder="Contoh: Kamar 101" />
                {errors.nama && <span className="text-xs text-red-500">{errors.nama.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Gedung <span className="text-red-500">*</span></label>
                <Controller
                    control={control}
                    name="building_id"
                    rules={{ required: 'Gedung harus dipilih' }}
                    render={({ field: { value } }) => (
                        <SearchableSelect
                            options={buildingList.map((b: any) => ({ label: b.nama, value: b.id }))}
                            value={value || null}
                            onChange={(val) => setValue('building_id', val ? String(val) : '')}
                            placeholder="Pilih Gedung"
                            error={errors.building_id?.message}
                        />
                    )}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Tipe Ruangan</label>
                <Controller
                    control={control}
                    name="room_type_id"
                    render={({ field: { value } }) => (
                        <SearchableSelect
                            options={roomTypeList.map((rt: any) => ({ label: rt.nama, value: rt.id }))}
                            value={value || null}
                            onChange={(val) => setValue('room_type_id', val ? String(val) : '')}
                            placeholder="Pilih Tipe Ruangan"
                        />
                    )}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Lantai</label>
                <input {...register('lantai')} className={cls} placeholder="Contoh: 1, 2, Basement" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Kapasitas <span className="text-red-500">*</span></label>
                <input type="number" {...register('kapasitas', { required: 'Kapasitas harus diisi', min: { value: 1, message: 'Kapasitas minimal 1' } })} className={`${cls} ${errors.kapasitas ? 'border-red-500' : ''}`} placeholder="Jumlah kapasitas" min={1} />
                {errors.kapasitas && <span className="text-xs text-red-500">{errors.kapasitas.message}</span>}
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
                        <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
                            {ROOM_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
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

const RoomPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FacRoom | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const [layout, setLayout] = useState<LayoutView>(() => {
        const saved = localStorage.getItem('masterDataLayout');
        return (saved as LayoutView) || LayoutView.VIEW_1;
    });

    const { data, isLoading } = useFacRoomList({ page, limit: 10, search, status });
    const createMutation = useCreateFacilityMasterData<FacRoom>('room');
    const updateMutation = useUpdateFacilityMasterData<FacRoom>('room');
    const deleteMutation = useDeleteFacilityMasterData('room');

    const columns: Column<FacRoom>[] = [
        { header: 'No', accessor: (_, index) => (page - 1) * 10 + index + 1, className: 'w-16' },
        { header: 'Code', accessor: 'code' },
        { header: 'Nama Ruangan', accessor: 'nama' },
        { header: 'Gedung', accessor: (item: FacRoom) => item.building?.nama || '-' },
        { header: 'Tipe', accessor: (item: FacRoom) => item.room_type?.nama || '-' },
        { header: 'Lantai', accessor: (item: FacRoom) => item.lantai || '-' },
        { header: 'Kapasitas', accessor: (item: FacRoom) => item.kapasitas != null ? String(item.kapasitas) : '-' },
        { header: 'Status', accessor: 'status' },
    ];

    const handleAdd = () => { setModalMode('create'); setSelectedItem(null); setIsModalOpen(true); };
    const handleEdit = (item: FacRoom) => { setModalMode('edit'); setSelectedItem(item); setIsModalOpen(true); };
    const handleDelete = (item: FacRoom) => { setSelectedItem(item); setIsConfirmOpen(true); };

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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ruangan</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola data ruangan</p>
                    </div>
                </div>

                <SearchFilter onSearchChange={setSearch} onFilterChange={setStatus} onAdd={handleAdd} addButtonText="Tambah Ruangan" transparent={true} />

                <div className="mb-4 flex justify-end">
                    <LayoutSwitcher currentLayout={layout} onLayoutChange={setLayout} />
                </div>

                <MasterDataTable permissionResource="facility_master_data" view={layout} columns={columns} data={data?.data || []} isLoading={isLoading}
                    pagination={{ page: data?.pagination?.page || 1, totalPages: data?.pagination?.totalPages || 1, totalItems: data?.pagination?.total || 0, onPageChange: setPage }}
                    onEdit={handleEdit} onDelete={handleDelete} transparent={true} />

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Tambah Ruangan' : 'Edit Ruangan'} size="lg">
                    <RoomForm
                        initialValues={selectedItem}
                        onSubmit={onFormSubmit}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>

                <ConfirmDialog isOpen={isConfirmOpen} title="Hapus Ruangan"
                    message={`Apakah Anda yakin ingin menghapus ruangan ${selectedItem?.nama}?`}
                    onConfirm={onConfirmDelete} onCancel={() => setIsConfirmOpen(false)} isLoading={deleteMutation.isPending} />
            </div>
        </MasterDataLayout>
    );
};

export default RoomPage;
