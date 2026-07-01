import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useInvKategoriList, useCreateInventoryMasterData, useUpdateInventoryMasterData, useDeleteInventoryMasterData } from '../../../hooks/useInventoryMasterData';
import MasterDataTable, { Column } from '../../../components/hr/MasterDataTable';
import MasterDataForm from '../../../components/hr/MasterDataForm';
import LayoutSwitcher from '../../../components/layout/LayoutSwitcher';
import MasterDataLayout from '../../../components/layout/MasterDataLayout';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SearchFilter from '../../../components/common/SearchFilter';
import { InvKategori } from '../../../types/inventory';
import { LayoutView } from '../../../types/layout';

const KategoriPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Aktif');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InvKategori | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const [layout, setLayout] = useState<LayoutView>(() => {
        const saved = localStorage.getItem('masterDataLayout');
        return (saved as LayoutView) || LayoutView.VIEW_1;
    });

    const { data, isLoading } = useInvKategoriList({ page, limit: 10, search, status });
    const createMutation = useCreateInventoryMasterData<InvKategori>('kategori');
    const updateMutation = useUpdateInventoryMasterData<InvKategori>('kategori');
    const deleteMutation = useDeleteInventoryMasterData('kategori');

    const columns: Column<InvKategori>[] = [
        { header: 'No', accessor: (_, index) => (page - 1) * 10 + index + 1, className: 'w-16' },
        { header: 'Code', accessor: 'code' },
        { header: 'Nama Kategori', accessor: 'nama' },
        { header: 'Keterangan', accessor: 'keterangan' },
        { header: 'Status', accessor: 'status' },
    ];

    const formFields = [
        { name: 'nama', label: 'Nama Kategori', type: 'text' as const, required: true, placeholder: 'Contoh: Elektronik, Alat Tulis', autoTitleCase: true },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' as const, autoTitleCase: true },
        { name: 'status', label: 'Status', type: 'toggle' as const },
    ];

    const handleAdd = () => {
        setModalMode('create');
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: InvKategori) => {
        setModalMode('edit');
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (item: InvKategori) => {
        setSelectedItem(item);
        setIsConfirmOpen(true);
    };

    const onFormSubmit = (formData: Record<string, unknown>) => {
        if (modalMode === 'create') {
            createMutation.mutate(formData as unknown as Partial<InvKategori>, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Data berhasil disimpan');
                },
                onError: (err: AxiosError<{ message: string }>) => {
                    toast.error(err.response?.data?.message || 'Gagal menyimpan data');
                }
            });
        } else {
            if (!selectedItem) return;
            updateMutation.mutate({ id: selectedItem.id, data: formData }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Data berhasil diperbarui');
                },
                onError: (err: AxiosError<{ message: string }>) => {
                    toast.error(err.response?.data?.message || 'Gagal memperbarui data');
                }
            });
        }
    };

    const onConfirmDelete = () => {
        if (!selectedItem) return;
        deleteMutation.mutate(selectedItem.id, {
            onSuccess: () => {
                setIsConfirmOpen(false);
                toast.success('Data berhasil dihapus');
            },
            onError: (err: AxiosError<{ message: string }>) => {
                toast.error(err.response?.data?.message || 'Gagal menghapus data');
            }
        });
    };

    return (
        <MasterDataLayout view={layout}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kategori</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola kategori inventaris</p>
                    </div>
                </div>

                <SearchFilter onSearchChange={setSearch} onFilterChange={setStatus} onAdd={handleAdd} addButtonText="Tambah Kategori" transparent={true} />

                <div className="mb-4 flex justify-end">
                    <LayoutSwitcher currentLayout={layout} onLayoutChange={setLayout} />
                </div>

                <MasterDataTable
                    view={layout}
                    columns={columns}
                    data={data?.data || []}
                    isLoading={isLoading}
                    pagination={{
                        page: data?.pagination?.page || 1,
                        totalPages: data?.pagination?.totalPages || 1,
                        totalItems: data?.pagination?.total || 0,
                        onPageChange: setPage,
                    }}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    transparent={true}
                />

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Tambah Kategori' : 'Edit Kategori'}>
                    <MasterDataForm
                        fields={formFields}
                        initialValues={(selectedItem || {}) as Record<string, unknown>}
                        onSubmit={onFormSubmit}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>

                <ConfirmDialog
                    isOpen={isConfirmOpen}
                    title="Hapus Kategori"
                    message={`Apakah Anda yakin ingin menghapus kategori ${selectedItem?.nama}?`}
                    onConfirm={onConfirmDelete}
                    onCancel={() => setIsConfirmOpen(false)}
                    isLoading={deleteMutation.isPending}
                />
            </div>
        </MasterDataLayout>
    );
};

export default KategoriPage;
