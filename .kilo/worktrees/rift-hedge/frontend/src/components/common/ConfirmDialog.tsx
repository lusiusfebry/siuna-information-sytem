import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    itemPreview?: Record<string, unknown> | null;
    isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen, onConfirm, onCancel, title, message, confirmText = "Hapus Data", cancelText = "Batal", variant = 'danger', itemPreview, isLoading
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
            <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'} mb-4`}>
                    <ExclamationTriangleIcon className="w-8 h-8" />
                </div>

                <p className="text-gray-600 mb-6">{message}</p>

                {itemPreview && (
                    <div className="w-full bg-gray-50 p-4 rounded-lg mb-6 text-left border border-gray-200">
                        {Object.entries(itemPreview).map(([key, value]) => (
                            <div key={key} className="flex flex-col mb-2 last:mb-0">
                                <span className="text-xs font-semibold text-gray-500 uppercase">{key}</span>
                                <span className="text-sm text-gray-800 font-medium">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-3 w-full">
                    <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button variant={variant} className="flex-1" onClick={onConfirm} isLoading={isLoading}>
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
