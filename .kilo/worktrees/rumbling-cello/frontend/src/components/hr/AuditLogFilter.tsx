import { useState, useEffect } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AuditAction, AuditLogFilters, AuditUser } from '../../types/hr';
import { auditService } from '../../services/api/audit.service';

interface AuditLogFilterProps {
    onFilterChange: (filters: AuditLogFilters) => void;
    initialFilters?: AuditLogFilters;
}

export default function AuditLogFilter({ onFilterChange, initialFilters }: AuditLogFilterProps) {
    const [filters, setFilters] = useState<AuditLogFilters>(initialFilters || {});
    const [users, setUsers] = useState<AuditUser[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await auditService.getAuditUsers();
                if (response.data && response.data.data) {
                    setUsers(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch audit users', error);
            }
        };
        fetchUsers();
    }, []);

    const handleChange = (key: keyof AuditLogFilters, value: string | number) => {
        const newFilters = { ...filters, [key]: value };
        if (!value) delete newFilters[key]; // Clean empty values
        setFilters(newFilters);
    };

    const handleApply = () => {
        onFilterChange(filters);
    };

    const handleReset = () => {
        setFilters({});
        onFilterChange({});
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Filter Riwayat
                </h3>
                {Object.keys(filters).length > 0 && (
                    <button
                        onClick={handleReset}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center"
                    >
                        <XMarkIcon className="h-3 w-3 mr-1" />
                        Reset Filter
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* User Filter */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Pengguna (User)</label>
                    <select
                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={filters.user_id || ''}
                        onChange={(e) => handleChange('user_id', e.target.value ? parseInt(e.target.value) : '')}
                    >
                        <option value="">Semua Pengguna</option>
                        {users.map((user) => (
                            <option key={user.user_id} value={user.user_id}>
                                {user.user_name} ({user.log_count})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Filter */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Aksi</label>
                    <select
                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={filters.action || ''}
                        onChange={(e) => handleChange('action', e.target.value as AuditAction)}
                    >
                        <option value="">Semua Aksi</option>
                        <option value="CREATE">Tambah Data (Create)</option>
                        <option value="UPDATE">Ubah Data (Update)</option>
                        <option value="DELETE">Hapus Data (Delete)</option>
                    </select>
                </div>

                {/* Entity Type Filter */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Entitas / Modul</label>
                    <select
                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={filters.entity_type || ''}
                        onChange={(e) => handleChange('entity_type', e.target.value)}
                    >
                        <option value="">Semua Modul</option>
                        <option value="employees">Karyawan</option>
                        <option value="department">Departemen</option>
                        <option value="divisi">Divisi</option>
                        <option value="posisi_jabatan">Posisi Jabatan</option>
                        <option value="employee_documents">Dokumen Karyawan</option>
                        {/* Add more as needed */}
                    </select>
                </div>

                {/* Date From */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal</label>
                    <input
                        type="date"
                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={filters.date_from || ''}
                        onChange={(e) => handleChange('date_from', e.target.value)}
                    />
                </div>

                {/* Date To */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal</label>
                    <input
                        type="date"
                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={filters.date_to || ''}
                        onChange={(e) => handleChange('date_to', e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleApply}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Terapkan Filter
                </button>
            </div>
        </div>
    );
}
