import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { documentService } from '../../services/api/document.service';

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: number | null;
    documentType: string | null; // mime type
    fileName: string;
    employeeId: number;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
    isOpen,
    onClose,
    documentId,
    documentType,
    fileName,
    employeeId
}) => {
    if (!documentId) return null;

    const previewUrl = documentService.getPreviewUrl(documentId, employeeId);
    const isPdf = documentType === 'application/pdf';

    const handleDownload = async () => {
        if (documentId) {
            await documentService.downloadDocument(documentId, employeeId, fileName);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
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
                    <div className="fixed inset-0 bg-black bg-opacity-75" />
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
                            <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        {fileName}
                                    </Dialog.Title>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDownload}
                                            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                                            title="Download"
                                        >
                                            <ArrowDownTrayIcon className="h-6 w-6" />
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-2 flex justify-center bg-gray-100 rounded-lg p-2 min-h-[500px]">
                                    {isPdf ? (
                                        <iframe
                                            src={previewUrl}
                                            className="w-full h-[600px] rounded-lg"
                                            title="PDF Preview"
                                        />
                                    ) : (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-h-[70vh] object-contain rounded-lg"
                                        />
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
