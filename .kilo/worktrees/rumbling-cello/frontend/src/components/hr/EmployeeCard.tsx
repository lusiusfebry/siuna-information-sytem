import React from 'react';
import { Employee } from '../../types/hr';

interface EmployeeCardProps {
    employee: Employee;
    onClick: (employee: Employee) => void;
    onDelete?: (id: number) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onClick, onDelete }) => {
    // Determine status color
    const getStatusStyles = (status: string | undefined) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('aktif') || s === 'active') {
            return 'bg-green-50 text-green-700 ring-green-600/20';
        }
        if (s.includes('training') || s.includes('probation') || s.includes('ojt')) {
            return 'bg-blue-50 text-blue-700 ring-blue-700/10';
        }
        if (s.includes('cuti') || s.includes('off')) {
            return 'bg-orange-50 text-orange-700 ring-orange-600/20';
        }
        if (s.includes('keluar') || s.includes('resign')) {
            return 'bg-red-50 text-red-700 ring-red-600/10';
        }
        return 'bg-gray-50 text-gray-700 ring-gray-600/10';
    };

    const statusName = employee.status_karyawan?.nama || 'Aktif';

    return (
        <div
            onClick={() => onClick(employee)}
            className="group relative flex cursor-pointer flex-col gap-3 rounded-lg bg-white dark:bg-[#1a202c] p-4 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow dark:ring-gray-700"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <img
                        alt={employee.nama_lengkap}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                        src={employee.foto_karyawan ? `http://localhost:3000${employee.foto_karyawan}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.nama_lengkap)}&background=random&size=128`}
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.nama_lengkap)}&background=random&size=128`;
                        }}
                    />
                    <div>
                        <h4 className="font-semibold text-sm text-[#0d121b] dark:text-white">
                            {employee.nama_lengkap}
                        </h4>
                        <p className="text-xs text-[#4c669a]">
                            NIK: {employee.nomor_induk_karyawan}
                        </p>
                    </div>
                </div>
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusStyles(statusName)}`}>
                    {statusName}
                </span>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <p className="text-gray-400 mb-0.5">Jabatan</p>
                        <p className="font-medium text-[#0d121b] dark:text-gray-200 truncate" title={employee.posisi_jabatan?.nama || '-'}>
                            {employee.posisi_jabatan?.nama || '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-400 mb-0.5">Departemen</p>
                        <p className="font-medium text-[#0d121b] dark:text-gray-200 truncate" title={employee.department?.nama || '-'}>
                            {employee.department?.nama || '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Overlay */}
            {onDelete && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(employee.id);
                        }}
                        className="p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmployeeCard;
