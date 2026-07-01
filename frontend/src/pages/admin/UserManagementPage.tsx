import React, { useEffect, useState } from 'react';
import Button from '../../components/common/Button';
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

            {/* Simple Modal Implementation */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                            Ubah Role User: {selectedUser?.nik}
                                        </h3>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Pilih Role Baru
                                            </label>
                                            <select
                                                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                value={selectedRole || ''}
                                                onChange={(e) => setSelectedRole(Number(e.target.value))}
                                            >
                                                <option value="" disabled>Pilih Role</option>
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.display_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <Button
                                    variant="primary"
                                    onClick={handleRoleUpdate}
                                    className="w-full sm:w-auto sm:ml-3"
                                >
                                    Simpan Perubahan
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsModalOpen(false)}
                                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                                >
                                    Batal
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
