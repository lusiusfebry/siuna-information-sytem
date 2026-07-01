import React from 'react';
import { useEmployeeDocuments } from '../../hooks/useDocuments';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';
import { Tab } from '@headlessui/react';
import clsx from 'clsx';
import { DocumentType, EmployeeDocument } from '../../types/hr';

interface EmployeeDocumentsSectionProps {
    employeeId: number;
}

const DOCUMENT_CATEGORIES: { id: string; label: string; types: DocumentType[] }[] = [
    {
        id: 'identitas',
        label: 'Identitas',
        types: ['foto_ktp', 'foto_npwp', 'foto_kartu_keluarga', 'foto_bpjs_kesehatan', 'foto_bpjs_ketenagakerjaan']
    },
    {
        id: 'kontrak',
        label: 'Kontrak & Kepegawaian',
        types: ['surat_kontrak']
    },
    {
        id: 'sertifikat',
        label: 'Sertifikat & Pendidikan',
        types: ['sertifikat']
    },
    {
        id: 'lainnya',
        label: 'Lainnya',
        types: ['dokumen_lainnya']
    }
];

export const EmployeeDocumentsSection: React.FC<EmployeeDocumentsSectionProps> = ({ employeeId }) => {
    const { data: documents, isLoading } = useEmployeeDocuments(employeeId);

    const getDocsByType = (type: string) => {
        return documents?.filter((d: EmployeeDocument) => d.document_type === type) || [];
    };

    const getDocsByCategory = (types: string[]) => {
        return documents?.filter((d: EmployeeDocument) => types.includes(d.document_type)) || [];
    };

    if (isLoading) return <div>Loading documents...</div>;

    return (
        <div className="w-full px-2 py-4 sm:px-0">
            <Tab.Group>
                <div className="mb-6 border-b border-[#e7ebf3] dark:border-[#2a3447]">
                    <Tab.List className="flex gap-2 overflow-x-auto min-w-max pb-px">
                        {DOCUMENT_CATEGORIES.map((category) => (
                            <Tab
                                key={category.id}
                                className={({ selected }: { selected: boolean }) =>
                                    clsx(
                                        'px-6 py-4 border-b-2 text-[13px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-all focus:outline-none',
                                        selected
                                            ? 'border-primary text-primary bg-primary/5'
                                            : 'border-transparent text-[#4c669a] dark:text-gray-400 hover:text-[#0d121b] hover:bg-gray-50'
                                    )
                                }
                            >
                                {category.label}
                            </Tab>
                        ))}
                    </Tab.List>
                </div>
                <Tab.Panels>
                    {DOCUMENT_CATEGORIES.map((category, idx) => (
                        <Tab.Panel
                            key={idx}
                            className="focus:outline-none"
                        >
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {category.types.map(type => (
                                        <div key={type} className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                                            <div className="px-5 py-3 border-b border-[#e7ebf3] dark:border-[#2a3447] bg-[#fbfbfc] dark:bg-[#1c2638] flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-lg">description</span>
                                                <h3 className="text-sm font-bold text-[#0d121b] dark:text-white capitalize">
                                                    {type.replace(/_/g, ' ')}
                                                </h3>
                                            </div>
                                            <div className="p-5">
                                                <DocumentUpload
                                                    employeeId={employeeId}
                                                    documentType={type}
                                                    label={`Upload ${type.replace(/_/g, ' ')}`}
                                                />
                                                <div className="mt-4">
                                                    <DocumentList
                                                        documents={getDocsByType(type)}
                                                        employeeId={employeeId}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                                    <div className="px-6 py-4 border-b border-[#e7ebf3] dark:border-[#2a3447] bg-[#fbfbfc] dark:bg-[#1c2638]">
                                        <h3 className="text-base font-bold text-[#0d121b] dark:text-white">Semua Riwayat {category.label}</h3>
                                    </div>
                                    <div className="p-6">
                                        <DocumentList
                                            documents={getDocsByCategory(category.types)}
                                            employeeId={employeeId}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Tab.Panel>
                    ))}
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
};
