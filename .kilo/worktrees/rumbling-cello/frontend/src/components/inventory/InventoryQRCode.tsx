import React from 'react';
import QRCode from 'react-qr-code';

interface Props {
    value: string;
    label: string;
    sublabel?: string;
    size?: number;
}

const InventoryQRCode: React.FC<Props> = ({ value, label, sublabel, size = 120 }) => {
    return (
        <div className="flex flex-col items-center bg-white p-3 rounded-lg border border-gray-200">
            <QRCode value={value} size={size} level="M" className="w-full h-auto" />
            <div className="text-center mt-2">
                <p className="font-bold text-gray-900 text-xs leading-tight">{label}</p>
                {sublabel && <p className="text-gray-500 text-[10px] font-mono leading-tight">{sublabel}</p>}
            </div>
        </div>
    );
};

export default InventoryQRCode;
