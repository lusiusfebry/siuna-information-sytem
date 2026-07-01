
import { Request, Response, NextFunction } from 'express';
import excelImportService from '../services/excel-import.service';
import fs from 'fs';

class ImportController {
    async uploadAndPreview(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const filePath = req.file.path;

            try {
                const { workbook, rows } = await excelImportService.parseExcelFile(filePath);
                const mapping = await excelImportService.getMappingConfiguration(workbook);

                // Preview first 20 rows
                const previewRows = rows.slice(0, 20);

                // Get headers from mapping or first row keys
                const headers = rows.length > 0 ? Object.keys(rows[0]).filter(k => k !== '_rowNumber') : [];

                res.json({
                    data: {
                        headers,
                        rows: previewRows,
                        totalRows: rows.length,
                        mapping,
                        filePath: req.file.path // Return path to be sent back for import confirmation
                    }
                });
            } catch (serviceError: any) {
                // Return 400 for parsing errors (e.g. invalid format, password protected)
                return res.status(400).json({ message: serviceError.message || 'Gagal memproses file Excel' });
            }
        } catch (error) {
            next(error);
        }
    }

    async importEmployees(req: Request, res: Response, next: NextFunction) {
        try {
            const { filePath } = req.body;
            if (!filePath) {
                return res.status(400).json({ message: 'File path is required' });
            }

            // Verify file exists
            if (!fs.existsSync(filePath)) {
                return res.status(400).json({ message: 'File not found or expired. Please upload again.' });
            }

            const result = await excelImportService.importEmployees(filePath);

            // Clean up file if success (or keep for audit?)
            // Usually clean up after processing
            if (result.success > 0 || result.failed > 0) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error('Failed to delete temp file', e);
                }
            }

            res.json({ data: result });
        } catch (error) {
            next(error);
        }
    }

    async importMasterData(req: Request, res: Response, next: NextFunction) {
        try {
            const { type } = req.params;
            const { filePath } = req.body;

            if (!filePath) {
                return res.status(400).json({ message: 'File path required' });
            }
            if (!fs.existsSync(filePath)) {
                return res.status(400).json({ message: 'File not found' });
            }

            const result = await excelImportService.importMasterData(filePath, type);

            // Clean up
            if (result.success > 0 || result.failed > 0) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error('Failed to delete temp file', e);
                }
            }

            res.json({ data: result });
        } catch (error) {
            next(error);
        }
    }
    async downloadErrorReport(req: Request, res: Response, next: NextFunction) {
        // This assumes we stored the error report somewhere or we generate it on the fly?
        // Service `generateErrorReport` takes `errors` array.
        // But `importEmployees` returns `result` with errors.
        // Frontend receives `result`. Frontend can re-send errors to backend to generate file?
        // OR `importEmployees` saves error report to disk and returns ID?
        // The plan says: "Generate Excel file with error details... Return file as download"
        // But the previous step `importEmployees` returns JSON.
        // So frontend has the errors. Frontend can request download by SENDING errors back? No that's inefficient.
        // Best approach: Store error report file temporarily if errors > 0.
        // Let's modify `importEmployees` to save error report if failed > 0 ?
        // Or simplify: Frontend sends `errors` (array of objects) to this endpoint and backend generates Excel stream.
        // Or better: `importEmployees` in Controller generates the error file and returns a download link/token?
        // Let's stick to what's common: Frontend sends JSON of errors to a `generate-report` endpoint?
        // Or: `importEmployees` returns the JSON errors. Frontend displays them. Frontend has "Download" button.
        // The "Download" button makes a POST request to `generate-error-report` with the errors payload.

        // However, the route definition in plan is GET `/import/error-report/:importId`.
        // This implies we persisted the result. We don't have an `Import` model/table.
        // I will implement a POST endpoint `/import/error-report` (dynamic generation) for simplicity.
        // I'll adjust route to POST.

        try {
            const { errors } = req.body;
            if (!errors || !Array.isArray(errors)) {
                return res.status(400).json({ message: 'Invalid errors data' });
            }

            const buffer = await excelImportService.generateErrorReport(errors);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=error-report-${Date.now()}.xlsx`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
}

export default new ImportController();
