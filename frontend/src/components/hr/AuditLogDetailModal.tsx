import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AuditLog } from '../../types/hr';

interface AuditLogDetailModalProps {
    auditLog: AuditLog | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function AuditLogDetailModal({ auditLog, isOpen, onClose }: AuditLogDetailModalProps) {
    if (!auditLog) return null;

    const formatValue = (val: unknown) => {
        if (typeof val === 'object' && val !== null) {
            return <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">{JSON.stringify(val, null, 2)}</pre>;
        }
        return String(val);
    };

    const renderChanges = () => {
        if (auditLog.action === 'CREATE') {
            return (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 border-b pb-1">Data Baru</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {Object.entries(auditLog.new_values || {}).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 text-sm">
                                <span className="font-medium text-gray-600 col-span-1">{key}</span>
                                <span className="text-gray-900 col-span-2">{formatValue(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (auditLog.action === 'UPDATE') {
            // Find keys that exist in either old or new
            const allKeys = new Set([
                ...Object.keys(auditLog.old_values || {}),
                ...Object.keys(auditLog.new_values || {})
            ]);

            return (
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900 border-b pb-1">Perubahan Data</h4>
                    <div className="space-y-3">
                        {Array.from(allKeys).map((key) => {
                            const oldVal = auditLog.old_values?.[key];
                            const newVal = auditLog.new_values?.[key];

                            // Skip if both undefined (shouldn't happen if key from keys)

                            return (
                                <div key={key} className="bg-gray-50 p-3 rounded-md text-sm border border-gray-100">
                                    <span className="block font-medium text-gray-700 mb-1 capitalize">{key.replace(/_/g, ' ')}</span>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-red-500 font-medium block mb-0.5">Sebelum:</span>
                                            <div className="text-red-700 bg-red-50 p-1.5 rounded text-xs break-all">
                                                {oldVal !== undefined ? formatValue(oldVal) : <span className="italic text-gray-400">Empty</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-green-500 font-medium block mb-0.5">Sesudah:</span>
                                            <div className="text-green-700 bg-green-50 p-1.5 rounded text-xs break-all">
                                                {newVal !== undefined ? formatValue(newVal) : <span className="italic text-gray-400">Empty</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (auditLog.action === 'DELETE') {
            return (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 border-b pb-1">Data Dihapus</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {Object.entries(auditLog.old_values || {}).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 text-sm">
                                <span className="font-medium text-gray-600 col-span-1">{key}</span>
                                <div className="text-gray-900 col-span-2 text-red-600 line-through decoration-red-300">
                                    {formatValue(value)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return null; // VIEW or other
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        Detail Aktivitas
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="mt-2 text-sm text-gray-600 space-y-4">
                                    {/* Header Info */}
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="block text-xs text-blue-500 font-semibold uppercase">User</span>
                                                <span className="font-medium text-gray-900">{auditLog.user_name || 'System'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs text-blue-500 font-semibold uppercase">Waktu</span>
                                                <span className="font-medium text-gray-900">
                                                    {format(new Date(auditLog.timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-xs text-blue-500 font-semibold uppercase">Aksi</span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                                    ${auditLog.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                                        auditLog.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                                            auditLog.action === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {auditLog.action}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-xs text-blue-500 font-semibold uppercase">IP Address</span>
                                                <span className="font-mono text-xs text-gray-600">{auditLog.ip_address || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Entity Info */}
                                    <div className="border-b pb-3">
                                        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Entitas Terkait</div>
                                        <div className="flex items-baseline space-x-2">
                                            <span className="font-semibold text-gray-900">{auditLog.entity_name || `#${auditLog.entity_id}`}</span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full capitalize">
                                                {auditLog.entity_type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Changes Content */}
                                    <div className="mt-4 max-h-[50vh] overflow-y-auto pr-1">
                                        {renderChanges()}
                                    </div>

                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
