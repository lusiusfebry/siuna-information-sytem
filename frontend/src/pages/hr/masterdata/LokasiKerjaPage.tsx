import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useLokasiKerjaList, useCreateMasterData, useUpdateMasterData, useDeleteMasterData } from '../../../hooks/useMasterData';
import MasterDataTable, { Column } from '../../../components/hr/MasterDataTable';
import MasterDataForm from '../../../components/hr/MasterDataForm';
import LayoutSwitcher from '../../../components/layout/LayoutSwitcher';
import MasterDataLayout from '../../../components/layout/MasterDataLayout';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SearchFilter from '../../../components/common/SearchFilter';
import { LokasiKerja } from '../../../types/hr';
import { LayoutView } from '../../../types/layout';

const LokasiKerjaPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Aktif');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<LokasiKerja | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const [layout, setLayout] = useState<LayoutView>(() => {
        const saved = localStorage.getItem('masterDataLayout');
        return (saved as LayoutView) || LayoutView.VIEW_1;
    });

    const { data, isLoading } = useLokasiKerjaList({ page, limit: 10, search, status });
    const createMutation = useCreateMasterData<LokasiKerja>('lokasi-kerja');
    const updateMutation = useUpdateMasterData<LokasiKerja>('lokasi-kerja');
    const deleteMutation = useDeleteMasterData('lokasi-kerja');

    const isCreating = createMutation.isPending;
    const isUpdating = updateMutation.isPending;
    const isDeleting = deleteMutation.isPending;

    const columns: Column<LokasiKerja>[] = [
        { header: 'No', accessor: (_, index) => (page - 1) * 10 + index + 1, className: 'w-16' },
        { header: 'Code', accessor: 'code' },
        { header: 'Kode Site', accessor: 'kode_site' },
        { header: 'Nama Lokasi', accessor: 'nama' },
        { header: 'Alamat', accessor: 'alamat' },
        { header: 'Status', accessor: 'status' },
    ];

    const formFields = [
        { name: 'nama', label: 'Nama Lokasi', type: 'text' as const, required: true, autoTitleCase: true },
        { name: 'kode_site', label: 'Kode Site', type: 'text' as const, placeholder: 'Contoh: ABM' },
        { name: 'alamat', label: 'Alamat', type: 'textarea' as const, autoTitleCase: true },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' as const, autoTitleCase: true },
        { name: 'status', label: 'Status', type: 'toggle' as const },
    ];

    const handleAdd = () => { setModalMode('create'); setSelectedItem(null); setIsModalOpen(true); };
    const handleEdit = (item: LokasiKerja) => { setModalMode('edit'); setSelectedItem(item); setIsModalOpen(true); };
    const handleDelete = (item: LokasiKerja) => { setSelectedItem(item); setIsConfirmOpen(true); };

    const onFormSubmit = (formData: Record<string, unknown>) => {
        if (modalMode === 'create') {
            createMutation.mutate(formData as unknown as Partial<LokasiKerja>, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Data berhasil ditambahkan'); },
                onError: () => toast.error('Gagal menambahkan data')
            });
        } else {
            if (!selectedItem) return;
            updateMutation.mutate({ id: selectedItem.id, data: formData as unknown as Partial<LokasiKerja> }, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Data berhasil diperbarui'); },
                onError: () => toast.error('Gagal memperbarui data')
            });
        }
    };

    const onConfirmDelete = () => {
        if (selectedItem) {
            deleteMutation.mutate(selectedItem.id, {
                onSuccess: () => {
                    setIsConfirmOpen(false);
                    toast.success('Data berhasil dihapus');
                },
                onError: (err: AxiosError<{ message: string }>) => {
                    const message = err.response?.data?.message || 'Gagal menghapus data';
                    toast.error(message);
                    console.error(err);
                }
            });
        }
    };

    return (
        <MasterDataLayout view={layout}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Master Data Lokasi Kerja</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola data lokasi kerja karyawan</p>
                    </div>
                </div>

                <SearchFilter onSearchChange={setSearch} onFilterChange={setStatus} onAdd={handleAdd} addButtonText="Tambah Lokasi" transparent={true} />

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
                        onPageChange: setPage
                    }}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    transparent={true}
                />

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Tambah Lokasi' : 'Edit Lokasi'} >
                    <MasterDataForm
                        fields={formFields}
                        initialValues={selectedItem as unknown as Record<string, unknown>}
                        onSubmit={onFormSubmit}
                        onCancel={() => setIsModalOpen(false)}
                        isLoading={isCreating || isUpdating}
                    />
                </Modal>

                <ConfirmDialog
                    isOpen={isConfirmOpen}
                    onCancel={() => setIsConfirmOpen(false)}
                    onConfirm={onConfirmDelete}
                    title="Hapus Lokasi"
                    message={`Apakah Anda yakin ingin menghapus lokasi ${selectedItem?.nama}?`}
                    isLoading={isDeleting}
                />
            </div>
        </MasterDataLayout>
    );
};

export default LokasiKerjaPage;
