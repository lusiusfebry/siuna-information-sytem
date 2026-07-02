import React, { useEffect, useState } from 'react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import permissionService from '../../services/permission.service';
import { User } from '../../types/auth'; // Ensure this type is updated
import { Role } from '../../types/permission';
import { RESOURCES, ACTIONS } from '../../types/permission';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import api from '../../services/api/client';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { PencilSquareIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// API Helpers
const fetchUsers = () => api.get('/auth/users').then(res => res.data.data);
const updateUserRole = (id: number, role_id: number) => api.put(`/auth/users/${id}/role`, { role_id });
const toggleUserStatus = (id: number, is_active: boolean) => api.put(`/auth/users/${id}/status`, { is_active });

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);

    // Edit Role Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState<number | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, rolesData] = await Promise.all([
                fetchUsers(),
                permissionService.getAllRoles()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRoleUpdate = async () => {
        if (selectedUser && selectedRole) {
            try {
                await updateUserRole(selectedUser.id, selectedRole);
                toast.success('Role user berhasil diperbarui');
                setIsModalOpen(false);
                loadData();
            } catch (error) {
                console.error(error);
                toast.error('Gagal memperbarui role');
            }
        }
    };

    const handleStatusToggle = async (id: number, currentStatus: boolean) => {
        try {
            await toggleUserStatus(id, !currentStatus);
            toast.success('Status user berhasil diperbarui');
            loadData();
        } catch (error) {
            console.error(error);
            const err = error as AxiosError<{ message: string }>;
            const msg = err.response?.data?.message || 'Gagal mengubah status';
            toast.error(msg);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen User & Akun</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kelola akun pengguna, role, dan status aktif.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-3">NIK</th>
                                <th className="px-6 py-3">Nama</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">Loading...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Tidak ada user ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white">{user.nik}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.employee?.nama_lengkap || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {user.roleDetails?.display_name || 'No Role'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <PermissionGuard resource={RESOURCES.USERS} action={ACTIONS.UPDATE}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-full text-blue-600 hover:bg-blue-50"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setSelectedRole(user.role_id);
                                                            setIsModalOpen(true);
                                                        }}
                                                        title="Ubah Role"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`h-8 w-8 p-0 rounded-full ${user.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                        onClick={() => handleStatusToggle(user.id, user.is_active)}
                                                        title={user.is_active ? 'Deactivate User' : 'Activate User'}
                                                    >
                                                        {user.is_active ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                                                    </Button>
                                                </PermissionGuard>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Role Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Ubah Role User: ${selectedUser?.nik || ''}`}
            >
                <form
                    onSubmit={(e) => { e.preventDefault(); handleRoleUpdate(); }}
                    className="space-y-5"
                >
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Pilih Role Baru
                        </label>
                        <SearchableSelect
                            options={roles.map(r => ({ value: r.id, label: r.display_name }))}
                            value={selectedRole}
                            onChange={(val) => setSelectedRole(Number(val))}
                            placeholder="Pilih Role"
                        />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" variant="primary" className="flex-1">
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagementPage;
