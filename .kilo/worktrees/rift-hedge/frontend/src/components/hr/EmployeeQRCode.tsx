import React, { useRef } from 'react';
import QRCode from 'react-qr-code';

interface EmployeeQRCodeProps {
    nik: string;
    employeeName: string;
}

export const EmployeeQRCode: React.FC<EmployeeQRCodeProps> = ({
    nik,
    employeeName
}) => {
    const qrRef = useRef<HTMLDivElement>(null);

    return (
        <div className="flex flex-col items-center bg-white dark:bg-white p-2 rounded-lg border border-[#e7ebf3] print:border-none print:p-0">
            <div
                ref={qrRef}
                className="print:border-none print:p-0"
            >
                <QRCode
                    value={nik}
                    size={120}
                    level="M"
                    className="w-full h-auto"
                />
            </div>
            <div className="text-center mt-2 print:block">
                <p className="font-bold text-[#0d121b] text-[10px] leading-tight">{employeeName}</p>
                <p className="text-[#4c669a] text-[9px] font-mono leading-tight">{nik}</p>
            </div>
        </div>
    );
};
