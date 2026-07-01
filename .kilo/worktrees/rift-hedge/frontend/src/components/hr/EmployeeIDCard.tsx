import React from 'react';
import QRCode from 'react-qr-code';
import { Employee } from '../../types/hr';

interface EmployeeIDCardProps {
    employee: Employee;
}

export const EmployeeIDCard: React.FC<EmployeeIDCardProps> = ({ employee }) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const baseUrl = apiUrl.replace('/api', '');

    const photoUrl = employee.foto_karyawan
        ? (employee.foto_karyawan.startsWith('http') ? employee.foto_karyawan : `${baseUrl}${employee.foto_karyawan}`)
        : null;

    return (
        <div className="w-[85.6mm] h-[53.98mm] bg-white relative overflow-hidden shadow-2xl print:shadow-none font-sans select-none rounded-xl border border-gray-200">
            {/* Background Design */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-[35%] bg-gradient-to-r from-blue-900 to-blue-800"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                {/* Accent Line */}
                <div className="absolute top-[35%] left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-yellow-400"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col">
                {/* Header */}
                <div className="h-[35%] px-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <div className="bg-white p-0.5 rounded shadow-sm">
                            <img
                                src="/assets/images/logo-bmi.jpg"
                                alt="Logo PT BMI"
                                className="h-8 w-auto object-contain"
                            />
                        </div>
                        <div className="flex flex-col leading-none">
                            <h1 className="text-[10px] font-bold tracking-wide">PT BINTANI MEGAH INDAH</h1>
                            <span className="text-[7px] font-medium tracking-wider opacity-90">SITE TALIABU</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="px-2 py-0.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded text-[7px] font-bold tracking-widest text-white shadow-sm">
                            MINE PERMIT
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-3 flex gap-3 items-center bg-transparent mt-1">
                    {/* Photo Area */}
                    <div className="relative shrink-0">
                        <div className="w-[20mm] h-[25mm] bg-gray-100 rounded-lg overflow-hidden border-2 border-white shadow-lg relative z-10">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt={employee.nama_lengkap}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        {/* Status Badge */}
                        {employee.status_karyawan?.nama === 'Aktif' && (
                            <div className="absolute -bottom-1 -right-1 z-20 bg-green-500 text-white text-[5px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm">
                                AKTIF
                            </div>
                        )}
                    </div>

                    {/* Employee Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                        <div>
                            <h2 className="text-xs font-black text-blue-900 leading-tight uppercase line-clamp-2">
                                {employee.nama_lengkap || 'NAMA KARYAWAN'}
                            </h2>
                            <p className="text-[8px] text-orange-600 font-bold uppercase truncate mt-0.5">
                                {employee.posisi_jabatan?.nama || 'POSISI / JABATAN'}
                            </p>
                        </div>

                        <div className="grid grid-cols-[20px_4px_1fr] gap-y-0.5 text-[7px] text-gray-600">
                            <span className="font-semibold text-gray-400">NIK</span>
                            <span>:</span>
                            <span className="font-bold font-mono text-gray-800">{employee.nomor_induk_karyawan}</span>

                            <span className="font-semibold text-gray-400">DIV</span>
                            <span>:</span>
                            <span className="truncate font-medium">{employee.divisi?.nama || '-'}</span>

                            <span className="font-semibold text-gray-400">DEPT</span>
                            <span>:</span>
                            <span className="truncate font-medium">{employee.department?.nama || '-'}</span>
                        </div>
                    </div>

                    {/* QR Code & Signature */}
                    <div className="flex flex-col items-center justify-between h-full py-1 shrink-0">
                        <div className="p-0.5 bg-white rounded border border-gray-100 shadow-sm">
                            <QRCode
                                value={`Employee:${employee.nomor_induk_karyawan}`}
                                size={42}
                                level="M"
                            />
                        </div>
                        {/* Signature Area */}
                        <div className="text-center mt-auto">
                            <div className="w-12 h-0.5 bg-gray-200 mb-0.5 mx-auto"></div>
                            <p className="text-[5px] text-gray-400 font-medium uppercase tracking-tighter">Authorized</p>
                        </div>
                    </div>
                </div>

                {/* Footer Info Bar */}
                <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-100 flex justify-between items-center text-[6px]">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-gray-400 font-semibold uppercase">Joined Date</span>
                            <span className="text-gray-700 font-bold">{employee.hr_info?.tanggal_masuk || '-'}</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200"></div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 font-semibold uppercase">Blood Type</span>
                            <span className="text-gray-700 font-bold">{employee.personal_info?.golongan_darah || '-'}</span>
                        </div>
                    </div>
                    <span className="font-bold text-blue-900">ID CARD</span>
                </div>
            </div>
        </div>
    );
};
