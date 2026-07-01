
import QRCode from 'qrcode';

export class QRCodeService {
    async generateQRCode(nik: string) {
        if (!nik) throw new Error('NIK is required');

        // Generate Data URL for frontend display
        const qrCodeDataUrl = await QRCode.toDataURL(nik, {
            errorCorrectionLevel: 'M',
            width: 300,
            margin: 2
        });

        return {
            qrCode: qrCodeDataUrl, // Renamed from qrCodeDataUrl to align with frontend types
            nik,
            generatedAt: new Date().toISOString()
        };
    }

    async generateQRCodeBuffer(nik: string): Promise<Buffer> {
        if (!nik) throw new Error('NIK is required');

        // Generate Buffer for download/file operations
        return await QRCode.toBuffer(nik, {
            errorCorrectionLevel: 'M',
            width: 300,
            margin: 2,
            type: 'png'
        });
    }
}

export const qrcodeService = new QRCodeService();
