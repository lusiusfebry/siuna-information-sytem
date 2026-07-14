import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useInvUomList, useCreateInventoryMasterData, useUpdateInventoryMasterData, useDeleteInventoryMasterData, useRestoreInventoryMasterData } from '../../../hooks/useInventoryMasterData';
import MasterDataTable, { Column } from '../../../components/hr/MasterDataTable';
import MasterDataForm from '../../../components/hr/MasterDataForm';
import LayoutSwitcher from '../../../components/layout/LayoutSwitcher';
import MasterDataLayout from '../../../components/layout/MasterDataLayout';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SearchFilter from '../../../components/common/SearchFilter';
import { InvUom } from '../../../types/inventory';
import { LayoutView } from '../../../types/layout';

const UomPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Aktif');
    const [showDeleted, setShowDeleted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InvUom | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const [layout, setLayout] = useState<LayoutView>(() => {
        const saved = localStorage.getItem('masterDataLayout');
        return (saved as LayoutView) || LayoutView.VIEW_1;
    });

    const { data, isLoading } = useInvUomList({ page, limit: 10, search, status, only_deleted: showDeleted });
    const createMutation = useCreateInventoryMasterData<InvUom>('uom');
    const updateMutation = useUpdateInventoryMasterData<InvUom>('uom');
        const deleteMutation = useDeleteInventoryMasterData('uom');
    const restoreMutation = useRestoreInventoryMasterData('uom');
    const handleRestore = (item: { id: number | string }) => {
        restoreMutation.mutate(Number(item.id), {
            onSuccess: () => toast.success('Data berhasil dipulihkan'),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onError: (err: any) => toast.error(err?.response?.data?.message || 'Gagal memulihkan data'),
        });
    };

    const columns: Column<InvUom>[] = [
        { header: 'No', accessor: (_, index) => (page - 1) * 10 + index + 1, className: 'w-16' },
        { header: 'Code', accessor: 'code' },
        { header: 'Nama Satuan', accessor: 'nama' },
        { header: 'Keterangan', accessor: 'keterangan' },
        { header: 'Status', accessor: 'status' },
    ];

    const formFields = [
        { name: 'nama', label: 'Nama Satuan (UOM)', type: 'text' as const, required: true, placeholder: 'Contoh: Pcs, Box, Kg, Liter', autoTitleCase: true },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' as const, autoTitleCase: true },
        { name: 'status', label: 'Status', type: 'toggle' as const },
    ];

    const handleAdd = () => { setModalMode('create'); setSelectedItem(null); setIsModalOpen(true); };
    const handleEdit = (item: InvUom) => { setModalMode('edit'); setSelectedItem(item); setIsModalOpen(true); };
    const handleDelete = (item: InvUom) => { setSelectedItem(item); setIsConfirmOpen(true); };

    const onFormSubmit = (formData: Record<string, unknown>) => {
        if (modalMode === 'create') {
            createMutation.mutate(formData as unknown as Partial<InvUom>, {
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unit of Measure (UOM)</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola satuan ukur inventaris</p>
                    </div>
                </div>

                <SearchFilter onSearchChange={setSearch} onFilterChange={(v) => { setStatus(v); setPage(1); }} statusValue={status} onAdd={handleAdd} addButtonText="Tambah UOM" transparent={true} />

                <div className="mb-4 flex justify-between items-center">
                    <button
                        onClick={() => { setShowDeleted(!showDeleted); setPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showDeleted
                            ? 'bg-rose-500 hover:bg-rose-600 border-rose-500 text-white'
                            : 'border-rose-300 text-rose-700 hover:bg-rose-50'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">restore_from_trash</span>
                        {showDeleted ? 'Data Terhapus' : 'Lihat Terhapus'}
                    </button>
                    <LayoutSwitcher currentLayout={layout} onLayoutChange={setLayout} />
                </div>

                <MasterDataTable permissionResource="inventory_master_data" view={layout} columns={columns} data={data?.data || []} isLoading={isLoading}
                    pagination={{ page: data?.pagination?.page || 1, totalPages: data?.pagination?.totalPages || 1, totalItems: data?.pagination?.total || 0, onPageChange: setPage }}
                    onEdit={handleEdit} onDelete={handleDelete}
                    onRestore={showDeleted ? handleRestore : undefined} transparent={true} />

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Tambah UOM' : 'Edit UOM'}>
                    <MasterDataForm fields={formFields} initialValues={(selectedItem || {}) as Record<string, unknown>}
                        onSubmit={onFormSubmit} isLoading={createMutation.isPending || updateMutation.isPending} onCancel={() => setIsModalOpen(false)} />
                </Modal>

                <ConfirmDialog isOpen={isConfirmOpen} title="Hapus UOM"
                    message={`Apakah Anda yakin ingin menghapus satuan ${selectedItem?.nama}?`}
                    onConfirm={onConfirmDelete} onCancel={() => setIsConfirmOpen(false)} isLoading={deleteMutation.isPending} />
            </div>
        </MasterDataLayout>
    );
};

export default UomPage;
