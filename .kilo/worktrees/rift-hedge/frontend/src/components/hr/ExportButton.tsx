
import React, { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { exportService } from '../../services/api/export.service';
import toast from 'react-hot-toast';

import { EmployeeFilterParams } from '../../types/hr';

interface ExportButtonProps {
    filters?: EmployeeFilterParams & { search?: string };
    selectedEmployeeId?: number | null;
    showExcel?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ filters, selectedEmployeeId, showExcel = true }) => {
    const [loading, setLoading] = useState(false);

    const handleExportExcel = async () => {
        setLoading(true);
        const toastId = toast.loading('Generating Excel...');
        try {
            const blob = await exportService.exportEmployeesToExcel(filters || {});
            exportService.downloadFile(blob, `Data-Karyawan-${new Date().getTime()}.xlsx`);
            toast.success('Excel berhasil didownload', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Gagal export Excel', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!selectedEmployeeId) {
            toast.error('Pilih karyawan terlebih dahulu');
            return;
        }
        setLoading(true);
        const toastId = toast.loading('Generating PDF...');
        try {
            const blob = await exportService.exportEmployeeToPDF(selectedEmployeeId);
            exportService.downloadFile(blob, `Profil-Karyawan-${selectedEmployeeId}.pdf`);
            toast.success('PDF berhasil didownload', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Gagal export PDF', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    disabled={loading}
                >
                    <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
                    Export
                </Menu.Button>
            </div>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        {showExcel && (
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={handleExportExcel}
                                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                            } group flex w-full items-center px-4 py-2 text-sm`}
                                    >
                                        Export Data ke Excel
                                    </button>
                                )}
                            </Menu.Item>
                        )}
                        {selectedEmployeeId && (
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={handleExportPDF}
                                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                            } group flex w-full items-center px-4 py-2 text-sm`}
                                    >
                                        Export Profil ke PDF
                                    </button>
                                )}
                            </Menu.Item>
                        )}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
};
