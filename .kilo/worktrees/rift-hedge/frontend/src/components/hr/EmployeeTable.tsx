import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { PermissionGuard } from '../auth/PermissionGuard';
import { RESOURCES, ACTIONS } from '../../types/permission';

interface Employee {
    id: number;
    nama_lengkap: string;
    nomor_induk_karyawan: string;
    foto_karyawan?: string;
    posisi_jabatan?: { nama: string };
    department?: { nama: string };
    status_karyawan?: { nama: string };
}

interface EmployeeTableProps {
    employees: Employee[];
    isLoading: boolean;
    onDelete: (id: number) => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = React.memo(({ employees, isLoading, onDelete }) => {
    const navigate = useNavigate();

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Pegawai</th>
                            <th className="px-6 py-3">NIK</th>
                            <th className="px-6 py-3">Jabatan</th>
                            <th className="px-6 py-3">Departemen</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="p-4 space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex items-center space-x-4 animate-pulse">
                                                <div className="h-10 w-10 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ) : employees.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">face_retouching_off</span>
                                    <p className="text-gray-500">Belum ada data karyawan.</p>
                                </td>
                            </tr>
                        ) : (
                            employees.map((employee) => (
                                <tr
                                    key={employee.id}
                                    className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/hr/employees/${employee.id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                                {employee.foto_karyawan ? (
                                                    <img
                                                        src={employee.foto_karyawan}
                                                        alt={employee.nama_lengkap}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/default-avatar.png'; // Fallback or handling
                                                            (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-sm font-bold text-gray-500 sticky">{employee.nama_lengkap.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{employee.nama_lengkap}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{employee.nomor_induk_karyawan}</td>
                                    <td className="px-6 py-4">{employee.posisi_jabatan?.nama || '-'}</td>
                                    <td className="px-6 py-4">{employee.department?.nama || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.status_karyawan?.nama === 'Tetap' || employee.status_karyawan?.nama === 'Aktif'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {employee.status_karyawan?.nama || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <PermissionGuard resource={RESOURCES.EMPLOYEES} action={ACTIONS.UPDATE}>
                                                <Link to={`/hr/employees/${employee.id}/edit`}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </Button>
                                                </Link>
                                            </PermissionGuard>
                                            <PermissionGuard resource={RESOURCES.EMPLOYEES} action={ACTIONS.DELETE}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(employee.id);
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
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
    );
});

export default EmployeeTable;
