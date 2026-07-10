import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAssetList, useCreateAsset, useWithdrawAsset } from '../../hooks/useFacilityAsset';
import { useFacRoomList } from '../../hooks/useFacilityMasterData';
import MasterDataTable, { Column } from '../../components/hr/MasterDataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { FacAsset, AssetPayload } from '../../types/facility';

interface AssetFormData { room_id: string; serial_number_id: string; tanggal_penempatan: string; keterangan: string; }

const cls = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
const lbl = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const AssetForm = ({ onSubmit, onCancel, isLoading }: {
    onSubmit: (d: AssetPayload) => void; onCancel: () => void; isLoading?: boolean;
}) => {
    const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<AssetFormData>({
        defaultValues: { room_id: '', serial_number_id: '', tanggal_penempatan: new Date().toISOString().split('T')[0], keterangan: '' },
    });
    const { data: roomData } = useFacRoomList({ limit: 100 });
    const rooms = (roomData?.data || []) as any[];

    // For serial numbers, we use a text input since the inventory module provides the data
    const submit = (d: AssetFormData) => onSubmit({
        room_id: Number(d.room_id), serial_number_id: Number(d.serial_number_id),
        tanggal_penempatan: d.tanggal_penempatan, keterangan: d.keterangan || null,
    });

    return (
        <form onSubmit={handleSubmit(submit)} className="space-y-5">
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Ruangan <span className="text-red-500">*</span></label>
                <Controller
                    control={control}
                    name="room_id"
                    rules={{ required: 'Wajib dipilih' }}
                    render={({ field: { value } }) => (
                        <SearchableSelect
                            options={rooms.map((r: any) => ({ label: `${r.nama}${r.building ? ` (${r.building.nama})` : ''}`, value: r.id }))}
                            value={value || null}
                            onChange={(val) => setValue('room_id', val ? String(val) : '')}
                            placeholder="Pilih Ruangan"
                            error={errors.room_id?.message}
                        />
                    )}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Serial Number ID <span className="text-red-500">*</span></label>
                <input type="number" {...register('serial_number_id', { required: 'Wajib diisi' })} className={`${cls} ${errors.serial_number_id ? 'border-red-500' : ''}`} placeholder="ID Serial Number dari Inventory" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Tanggal Penempatan <span className="text-red-500">*</span></label>
                <input type="date" {...register('tanggal_penempatan', { required: 'Wajib diisi' })} className={`${cls} ${errors.tanggal_penempatan ? 'border-red-500' : ''}`} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className={lbl}>Keterangan</label>
                <textarea {...register('keterangan')} className={cls} rows={2} />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>Batal</Button>
                <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>Simpan</Button>
            </div>
        </form>
    );
};

const AssetPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Aktif');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FacAsset | null>(null);

    const { data, isLoading } = useAssetList({ page, limit: 10, search, status: statusFilter as any });
    const createMutation = useCreateAsset();
    const withdrawMutation = useWithdrawAsset();

    const columns: Column<FacAsset>[] = [
        { header: 'No', accessor: (_, i) => (page - 1) * 10 + i + 1, className: 'w-16' },
        { header: 'Serial Number', accessor: (item) => item.serial_number?.serial_number || '-' },
        { header: 'Tag Number', accessor: (item) => item.serial_number?.tag_number || '-' },
        { header: 'Produk', accessor: (item) => item.serial_number?.produk?.nama || '-' },
        { header: 'Ruangan', accessor: (item) => item.room?.nama || '-' },
        { header: 'Gedung', accessor: (item) => item.room?.building?.nama || '-' },
        { header: 'Tgl Penempatan', accessor: (item) => item.tanggal_penempatan ? new Date(item.tanggal_penempatan).toLocaleDateString('id-ID') : '-' },
        { header: 'Status', accessor: (item) => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {item.status}
            </span>
        )},
    ];

    const handleAdd = () => { setSelectedItem(null); setIsModalOpen(true); };
    const handleWithdraw = (item: FacAsset) => { setSelectedItem(item); setIsWithdrawOpen(true); };

    const onFormSubmit = (formData: AssetPayload) => {
        createMutation.mutate(formData, {
            onSuccess: () => { setIsModalOpen(false); toast.success('Aset berhasil ditempatkan'); },
            onError: (err) => { toast.error(err.response?.data?.message || 'Gagal menempatkan aset'); },
        });
    };

    const onConfirmWithdraw = () => {
        if (!selectedItem) return;
        withdrawMutation.mutate({ id: selectedItem.id }, {
            onSuccess: () => { setIsWithdrawOpen(false); setSelectedItem(null); toast.success('Aset berhasil ditarik'); },
            onError: (err) => { toast.error(err.response?.data?.message || 'Gagal menarik aset'); },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aset Ruangan</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola penempatan aset di ruangan</p>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                    <span className="material-symbols-outlined text-sm mr-1">add</span> Tempatkan Aset
                </Button>
            </div>

            <div className="flex gap-3 items-center">
                <input type="text" placeholder="Cari aset..." value={search}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                <select className="px-3 py-2 border rounded-lg text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="Aktif">Aktif</option>
                    <option value="Ditarik">Ditarik</option>
                </select>
            </div>

            <MasterDataTable permissionResource="facility_master_data" columns={columns} data={data?.data || []} isLoading={isLoading}
                pagination={{ page: data?.pagination?.page || 1, totalPages: data?.pagination?.totalPages || 1, totalItems: data?.pagination?.total || 0, onPageChange: setPage }}
                onEdit={(item) => { if (item.status === 'Aktif') handleWithdraw(item); }}
                onDelete={() => {}}
                transparent={true} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tempatkan Aset" size="lg">
                <AssetForm onSubmit={onFormSubmit} isLoading={createMutation.isPending} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <ConfirmDialog isOpen={isWithdrawOpen} title="Tarik Aset"
                message={`Apakah Anda yakin ingin menarik aset ${selectedItem?.serial_number?.serial_number || ''} dari ruangan ${selectedItem?.room?.nama || ''}?`}
                onConfirm={onConfirmWithdraw} onCancel={() => setIsWithdrawOpen(false)} isLoading={withdrawMutation.isPending} />
        </div>
    );
};

export default AssetPage;
