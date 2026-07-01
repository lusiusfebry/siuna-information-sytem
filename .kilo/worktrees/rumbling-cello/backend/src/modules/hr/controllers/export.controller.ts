
import { Request, Response, NextFunction } from 'express';
import exportService from '../services/export.service';
import moment from 'moment';

class ExportController {
    async exportToExcel(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await exportService.exportEmployeesToExcel(req.query);

            const timestamp = moment().format('YYYY-MM-DD-HHmm');
            const filename = `Data-Karyawan-${timestamp}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async exportEmployeeToPDF(req: Request, res: Response, next: NextFunction) {
        try {
            const employeeId = parseInt(req.params.id);
            if (isNaN(employeeId)) {
                return res.status(400).json({ message: 'Invalid employee ID' });
            }

            const buffer = await exportService.exportEmployeeProfileToPDF(employeeId);

            const filename = `Profil-Karyawan-${employeeId}.pdf`; // Could enhance to include name if fetched first

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
}

export default new ExportController();
