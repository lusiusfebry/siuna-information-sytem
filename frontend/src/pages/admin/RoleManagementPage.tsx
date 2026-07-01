import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import permissionService from '../../services/permission.service';
import { Role } from '../../types/permission';
import { RESOURCES, ACTIONS } from '../../types/permission';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

const RoleManagementPage: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const data = await permissionService.getAllRoles();
            setRoles(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data role');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Apakah anda yakin ingin menghapus role ini?')) return;

        try {
            await permissionService.deleteRole(id);
            toast.success('Role berhasil dihapus');
            fetchRoles();
        } catch (error) {
            console.error(error);
            const err = error as AxiosError<{ message: string }>;
            const msg = err.response?.data?.message || 'Gagal menghapus role';
            toast.error(msg);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Role & Hak Akses</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelola role dan konfigurasi izin akses pengguna.</p>
                </div>
                <PermissionGuard resource={RESOURCES.ROLES} action={ACTIONS.CREATE}>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/settings/roles/create')}
                        className="flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Tambah Role
                    </Button>
                </PermissionGuard>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-3">Role Name</th>
                                <th className="px-6 py-3">Code</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        Loading...
                                    </td>
                                </tr>
                            ) : roles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada role tersedia.
                                    </td>
                                </tr>
                            ) : (
                                roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {role.display_name}
                                            {role.is_system_role && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                    System
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{role.name}</td>
                                        <td className="px-6 py-4">{role.description || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <PermissionGuard resource={RESOURCES.ROLES} action={ACTIONS.UPDATE}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-full text-blue-600 hover:bg-blue-50"
                                                        onClick={() => navigate(`/settings/roles/${role.id}`)}
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </Button>
                                                </PermissionGuard>

                                                {!role.is_system_role && (
                                                    <PermissionGuard resource={RESOURCES.ROLES} action={ACTIONS.DELETE}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 rounded-full text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDelete(role.id)}
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </Button>
                                                    </PermissionGuard>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RoleManagementPage;
