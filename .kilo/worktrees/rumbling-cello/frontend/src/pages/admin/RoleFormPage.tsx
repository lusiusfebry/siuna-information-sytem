import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import permissionService from '../../services/permission.service';
import { Permission } from '../../types/permission';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

const RoleFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        description: ''
    });
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

    const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const data = await permissionService.getAllPermissions();

                // Group permissions by resource
                const grouped = data.reduce((acc, curr) => {
                    if (!acc[curr.resource]) {
                        acc[curr.resource] = [];
                    }
                    acc[curr.resource].push(curr);
                    return acc;
                }, {} as Record<string, Permission[]>);

                setGroupedPermissions(grouped);
            } catch (error) {
                console.error(error);
                toast.error('Gagal memuat list permissions');
            }
        };

        const fetchRole = async () => {
            try {
                const role = await permissionService.getRoleById(Number(id));
                setFormData({
                    name: role.name,
                    display_name: role.display_name,
                    description: role.description || ''
                });
                if (role.permissions) {
                    setSelectedPermissions(role.permissions.map(p => p.id));
                }
            } catch (error) {
                console.error(error);
                toast.error('Gagal memuat data role');
                navigate('/settings/roles');
            }
        };

        const init = async () => {
            setInitialLoading(true);
            await fetchPermissions();
            if (isEdit) {
                await fetchRole();
            }
            setInitialLoading(false);
        };
        init();
    }, [id, isEdit, navigate]);

    const handlePermissionToggle = (permId: number) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permId)) {
                return prev.filter(id => id !== permId);
            } else {
                return [...prev, permId];
            }
        });
    };

    const handleSelectResource = (resource: string, select: boolean) => {
        const resourcePermIds = groupedPermissions[resource].map(p => p.id);
        setSelectedPermissions(prev => {
            if (select) {
                // Add all ids from this resource that aren't already selected
                const toAdd = resourcePermIds.filter(id => !prev.includes(id));
                return [...prev, ...toAdd];
            } else {
                // Remove all ids from this resource
                return prev.filter(id => !resourcePermIds.includes(id));
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.display_name) {
            toast.error('Nama Role dan Kode Role wajib diisi');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                permission_ids: selectedPermissions
            };

            if (isEdit) {
                await permissionService.updateRole(Number(id), payload);
                toast.success('Role berhasil diperbarui');
            } else {
                await permissionService.createRole(payload);
                toast.success('Role berhasil dibuat');
            }
            navigate('/settings/roles');
        } catch (error) {
            console.error(error);
            const err = error as AxiosError<{ message: string }>;
            const msg = err.response?.data?.message || 'Gagal menyimpan role';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="p-6 text-center">Loading form...</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {isEdit ? 'Edit Role' : 'Buat Role Baru'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Nama Role (Display) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData.display_name}
                                onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                                placeholder="Contoh: Administrator HR"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Kode Role (Unique) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 disabled:text-gray-500"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: hr_admin"
                                disabled={isEdit}
                                required
                            />
                            {isEdit && <p className="text-xs text-gray-500">Kode role tidak dapat diubah setelah dibuat.</p>}
                        </div>

                        <div className="col-span-full space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Deskripsi
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Deskripsi singkat tentang role ini..."
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Hak Akses (Permissions)</h3>

                        <div className="space-y-6">
                            {Object.entries(groupedPermissions).map(([resource, perms]) => {
                                const allSelected = perms.every(p => selectedPermissions.includes(p.id));
                                const someSelected = perms.some(p => selectedPermissions.includes(p.id));

                                return (
                                    <div key={resource} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                                            <h4 className="font-semibold capitalize text-gray-800 dark:text-gray-200">
                                                {resource.replace('_', ' ')}
                                            </h4>
                                            <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={allSelected}
                                                    ref={input => {
                                                        if (input) input.indeterminate = someSelected && !allSelected;
                                                    }}
                                                    onChange={(e) => handleSelectResource(resource, e.target.checked)}
                                                />
                                                Pilih Semua
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {perms.map(p => (
                                                <label key={p.id} className="flex items-start gap-2 max-w-full cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 group-hover:border-blue-400"
                                                        value={p.id}
                                                        checked={selectedPermissions.includes(p.id)}
                                                        onChange={() => handlePermissionToggle(p.id)}
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 break-words group-hover:text-gray-900 group-hover:dark:text-white">
                                                        {p.action.replace('_', ' ')}
                                                        {p.description && <span className="block text-xs text-gray-500">{p.description}</span>}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => navigate('/settings/roles')}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={loading}
                        >
                            Simpan Role
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoleFormPage;
