import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useEntityHistory } from '../../hooks/useAuditLogs';
import { useState } from 'react';
import AuditLogDetailModal from './AuditLogDetailModal';
import { AuditLog } from '../../types/hr';

interface EntityHistoryTimelineProps {
    entityType: string;
    entityId: number;
}

export default function EntityHistoryTimeline({ entityType, entityId }: EntityHistoryTimelineProps) {
    const { history, loading } = useEntityHistory(entityType, entityId);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    if (loading) {
        return <div className="p-4 text-center text-gray-500">Memuat riwayat perubahan...</div>;
    }

    if (!history || history.length === 0) {
        return <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">Belum ada riwayat perubahan tercatat.</div>;
    }

    return (
        <div className="flow-root mt-4">
            <ul role="list" className="-mb-8">
                {history.map((log, logIdx) => (
                    <li key={log.id}>
                        <div className="relative pb-8">
                            {logIdx !== history.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white 
                                        ${log.action === 'CREATE' ? 'bg-green-500' :
                                            log.action === 'UPDATE' ? 'bg-blue-500' :
                                                log.action === 'DELETE' ? 'bg-red-500' : 'bg-gray-400'}`}>

                                        {log.action === 'CREATE' && (
                                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        )}
                                        {log.action === 'UPDATE' && (
                                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        )}
                                        {log.action === 'DELETE' && (
                                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                        {log.action === 'VIEW' && (
                                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            <span className="font-medium text-gray-900">{log.user_name || 'System'}</span>
                                            {' '}
                                            {log.action === 'CREATE' ? 'membuat data' :
                                                log.action === 'UPDATE' ? 'memperbarui data' :
                                                    log.action === 'DELETE' ? 'menghapus data' : 'melihat data'}

                                        </p>
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Lihat Detail Perubahan
                                        </button>
                                    </div>
                                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                        <time dateTime={log.timestamp}>
                                            {format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
                                        </time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            <AuditLogDetailModal
                auditLog={selectedLog}
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
            />
        </div>
    );
}
