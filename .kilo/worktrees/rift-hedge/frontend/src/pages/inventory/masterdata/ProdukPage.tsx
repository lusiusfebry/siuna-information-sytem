import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useInvProdukList, useInvBrandList, useCreateInventoryMasterData, useUpdateInventoryMasterData, useDeleteInventoryMasterData } from '../../../hooks/useInventoryMasterData';
import { useQueryClient } from '@tanstack/react-query';
import MasterDataTable, { Column } from '../../../components/hr/MasterDataTable';
import MasterDataForm from '../../../components/hr/MasterDataForm';
import LayoutSwitcher from '../../../components/layout/LayoutSwitcher';
import MasterDataLayout from '../../../components/layout/MasterDataLayout';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SearchFilter from '../../../components/common/SearchFilter';
import { InvProduk } from '../../../types/inventory';
import { LayoutView } from '../../../types/layout';
import inventoryMasterDataService from '../../../services/api/inventory-master-data.service';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const ProdukPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Aktif');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InvProduk | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const [layout, setLayout] = useState<LayoutView>(() => {
        const saved = localStorage.getItem('masterDataLayout');
        return (saved as LayoutView) || LayoutView.VIEW_1;
    });

    const { data, isLoading } = useInvProdukList({ page, limit: 10, search, status });
    const { data: brandData } = useInvBrandList({ limit: 100, status: 'true' });
    const createMutation = useCreateInventoryMasterData<InvProduk>('produk');
    const updateMutation = useUpdateInventoryMasterData<InvProduk>('produk');
    const deleteMutation = useDeleteInventoryMasterData('produk');
    const queryClient = useQueryClient();
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const columns: Column<InvProduk>[] = [
        { header: 'No', accessor: (_, index) => (page - 1) * 10 + index + 1, className: 'w-16' },
        {
            header: 'Foto', className: 'w-16', accessor: (item: InvProduk) => item.gambar
                ? <img src={`${API_BASE}${item.gambar}`} alt={item.nama} className="w-10 h-10 rounded object-cover" />
                : <span className="material-symbols-outlined text-gray-300 text-[28px]">image</span>
        },
        { header: 'Code', accessor: 'code' },
        { header: 'Nama Produk', accessor: 'nama' },
        { header: 'Brand', accessor: (item: InvProduk) => item.brand?.nama || '-' },
        { header: 'Serial Number', accessor: (item: InvProduk) => item.has_serial_number ? 'Ya' : 'Tidak' },
        { header: 'Tag Number', accessor: (item: InvProduk) => item.has_tag_number ? 'Ya' : 'Tidak' },
        { header: 'Stok Min', accessor: (item: InvProduk) => item.stok_minimum ?? 5, className: 'w-24' },
        { header: 'Status', accessor: 'status' },
    ];

    const formFields = [
        { name: 'nama', label: 'Nama Produk', type: 'text' as const, required: true, autoTitleCase: true },
        {
            name: 'brand_id',
            label: 'Brand',
            type: 'select' as const,
            required: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options: brandData?.data.map((d: any) => ({ label: d.nama, value: d.id })) || []
        },
        { name: 'has_serial_number', label: 'Memiliki Serial Number', type: 'toggle' as const },
        { name: 'has_tag_number', label: 'Memiliki Tag Number', type: 'toggle' as const },
        { name: 'stok_minimum', label: 'Stok Minimum', type: 'number' as const },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' as const, autoTitleCase: true },
        { name: 'status', label: 'Status', type: 'toggle' as const },
    ];

    const handleAdd = () => { setModalMode('create'); setSelectedItem(null); setIsModalOpen(true); };
    const handleEdit = (item: InvProduk) => { setModalMode('edit'); setSelectedItem(item); setIsModalOpen(true); };
    const handleDelete = (item: InvProduk) => { setSelectedItem(item); setIsConfirmOpen(true); };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedItem) return;
        setUploadingPhoto(true);
        try {
            const result = await inventoryMasterDataService.uploadPhoto(selectedItem.id, file);
            setSelectedItem({ ...selectedItem, gambar: result.data.gambar });
            queryClient.invalidateQueries({ queryKey: ['inventoryMasterData', 'produk'] });
            toast.success('Foto berhasil diupload');
        } catch {
            toast.error('Gagal upload foto');
        } finally {
            setUploadingPhoto(false);
            if (photoInputRef.current) photoInputRef.current.value = '';
        }
    };

    const onFormSubmit = (formData: Record<string, unknown>) => {
        const payload = {
            ...formData,
            brand_id: Number(formData.brand_id),
            has_serial_number: formData.has_serial_number === true || formData.has_serial_number === 'true',
            has_tag_number: formData.has_tag_number === true || formData.has_tag_number === 'true',
            stok_minimum: formData.stok_minimum ? Number(formData.stok_minimum) : 5,
        };
        if (modalMode === 'create') {
            createMutation.mutate(payload, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Data berhasil disimpan'); },
                onError: (err: AxiosError<{ message: string }>) => { toast.error(err.response?.data?.message || 'Gagal menyimpan data'); }
            });
        } else {
            if (!selectedItem) return;
            updateMutation.mutate({ id: selectedItem.id, data: payload }, {
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produk</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola produk inventaris</p>
                    </div>
                </div>

                <SearchFilter onSearchChange={setSearch} onFilterChange={setStatus} onAdd={handleAdd} addButtonText="Tambah Produk" transparent={true} />

                <div className="mb-4 flex justify-end">
                    <LayoutSwitcher currentLayout={layout} onLayoutChange={setLayout} />
                </div>

                <MasterDataTable view={layout} columns={columns} data={data?.data || []} isLoading={isLoading}
                    pagination={{ page: data?.pagination?.page || 1, totalPages: data?.pagination?.totalPages || 1, totalItems: data?.pagination?.total || 0, onPageChange: setPage }}
                    onEdit={handleEdit} onDelete={handleDelete} transparent={true} />

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Tambah Produk' : 'Edit Produk'}>
                    {modalMode === 'edit' && selectedItem && (
                        <div className="mb-4 pb-4 border-b border-gray-100">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Foto Produk</label>
                            <div className="flex items-center gap-4">
                                {selectedItem.gambar ? (
                                    <img src={`${API_BASE}${selectedItem.gambar}`} alt={selectedItem.nama} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                                ) : (
                                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-gray-300 text-[32px]">image</span>
                                    </div>
                                )}
                                <div>
                                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    <button type="button" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                                        {uploadingPhoto ? 'Uploading...' : selectedItem.gambar ? 'Ganti Foto' : 'Upload Foto'}
                                    </button>
                                    <p className="text-xs text-gray-400 mt-1">Maks 2MB, format JPG/PNG</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <MasterDataForm fields={formFields} initialValues={(selectedItem || {}) as Record<string, unknown>}
                        onSubmit={onFormSubmit} isLoading={createMutation.isPending || updateMutation.isPending} onCancel={() => setIsModalOpen(false)} />
                </Modal>

                <ConfirmDialog isOpen={isConfirmOpen} title="Hapus Produk"
                    message={`Apakah Anda yakin ingin menghapus produk ${selectedItem?.nama}?`}
                    onConfirm={onConfirmDelete} onCancel={() => setIsConfirmOpen(false)} isLoading={deleteMutation.isPending} />
            </div>
        </MasterDataLayout>
    );
};

export default ProdukPage;
