import { Request, Response } from 'express';
import documentService from '../services/document.service';
import * as fs from 'fs';

class DocumentController {
    async uploadDocuments(req: Request, res: Response) {
        try {
            const employeeId = parseInt(req.params.id);
            const user = (req as any).user;
            const files = req.files as Express.Multer.File[];
            const { document_type, description } = req.body;

            if (!files || files.length === 0) {
                return res.status(400).json({ message: 'No files uploaded' });
            }

            if (!document_type) {
                return res.status(400).json({ message: 'Document type is required' });
            }

            const uploadedDocs = [];
            for (const file of files) {
                const doc = await documentService.uploadDocument(
                    employeeId,
                    document_type,
                    file,
                    user?.id,
                    description
                );
                uploadedDocs.push(doc);
            }

            res.status(201).json({
                message: 'Documents uploaded successfully',
                data: uploadedDocs
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            res.status(500).json({ message: error.message || 'Failed to upload documents' });
        }
    }

    async getEmployeeDocuments(req: Request, res: Response) {
        try {
            const employeeId = parseInt(req.params.id);
            const { type } = req.query;
            const docs = await documentService.getEmployeeDocuments(employeeId, type as string);
            res.json({ data: docs });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async downloadDocument(req: Request, res: Response) {
        try {
            const docId = parseInt(req.params.docId);
            const employeeId = parseInt(req.params.id || '0');

            if (isNaN(employeeId) || employeeId === 0) {
                return res.status(400).json({ message: 'Employee ID required' });
            }

            try {
                const doc = await documentService.validateDocumentAccess(docId, employeeId);
                if (!doc) {
                    return res.status(404).json({ message: 'Document not found' });
                }

                if (!fs.existsSync(doc.file_path)) {
                    return res.status(404).json({ message: 'File not found on server' });
                }

                res.download(doc.file_path, doc.file_name);
            } catch (error: any) {
                if (error.message.includes('Access denied')) {
                    return res.status(403).json({ message: error.message });
                }
                throw error;
            }
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async deleteDocument(req: Request, res: Response) {
        try {
            const docId = parseInt(req.params.docId);
            const employeeId = parseInt(req.params.id || '0');

            if (isNaN(employeeId) || employeeId === 0) {
                return res.status(400).json({ message: 'Employee ID required' });
            }

            try {
                const doc = await documentService.validateDocumentAccess(docId, employeeId);
                if (!doc) {
                    return res.status(404).json({ message: 'Document not found' });
                }

                const success = await documentService.deleteDocument(docId);

                if (!success) {
                    return res.status(404).json({ message: 'Document could not be deleted' });
                }

                res.json({ message: 'Document deleted successfully' });
            } catch (error: any) {
                if (error.message.includes('Access denied')) {
                    return res.status(403).json({ message: error.message });
                }
                throw error;
            }
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getDocumentPreview(req: Request, res: Response) {
        try {
            const docId = parseInt(req.params.docId);
            const employeeId = parseInt(req.params.id || '0');

            if (isNaN(employeeId) || employeeId === 0) {
                return res.status(400).json({ message: 'Employee ID required' });
            }

            try {
                const doc = await documentService.validateDocumentAccess(docId, employeeId);
                if (!doc) {
                    return res.status(404).json({ message: 'Document not found' });
                }

                const preview = await documentService.getDocumentPreview(docId);

                if (!preview) {
                    return res.status(404).json({ message: 'Document preview not available' });
                }

                res.setHeader('Content-Type', preview.mime);
                const stream = fs.createReadStream(preview.path);
                stream.pipe(res);
            } catch (error: any) {
                if (error.message.includes('Access denied')) {
                    return res.status(403).json({ message: error.message });
                }
                throw error;
            }
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new DocumentController();
