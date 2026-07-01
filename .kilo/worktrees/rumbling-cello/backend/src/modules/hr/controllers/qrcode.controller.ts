
import { Request, Response, NextFunction } from 'express';
import { qrcodeService } from '../services/qrcode.service';

class QRCodeController {
    // GET /qrcode/generate?nik=...
    async generateQRCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { nik } = req.query;

            if (!nik || typeof nik !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'NIK is required and must be a string'
                });
                return;
            }

            const data = await qrcodeService.generateQRCode(nik);
            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    // Method for handling direct download if needed via generic route (optional per plan context but good to have)
    // Route: GET /qrcode/download?nik=...
    async downloadQRCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { nik } = req.query;

            if (!nik || typeof nik !== 'string') {
                res.status(400).json({ success: false, message: 'NIK parameter is required' });
                return;
            }

            const buffer = await qrcodeService.generateQRCodeBuffer(nik);

            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename=qr-${nik}.png`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
}

export default new QRCodeController();
