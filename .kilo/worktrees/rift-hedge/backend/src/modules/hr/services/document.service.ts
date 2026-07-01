import EmployeeDocument from '../models/EmployeeDocument';
import { storageProvider } from '../../../shared/utils/storage/storageFactory';

class DocumentService {
    async uploadDocument(
        employeeId: number,
        documentType: string,
        file: Express.Multer.File,
        uploadedBy?: number,
        description?: string
    ): Promise<EmployeeDocument> {
        // Create database record
        // Note: Multer diskStorage has already saved the file to disk at file.path.
        // We use storageProvider.saveFile mainly for abstraction if we were using memoryStorage
        // or if we needed to move it. For now, we trust the path provided by multer.
        // In a pure abstraction, we might pass the file buffer, but here we work with what we have.
        // We'll verify existence via provider just to be safe/consistent.

        await storageProvider.saveFile(file, '', '');

        const doc = await EmployeeDocument.create({
            employee_id: employeeId,
            document_type: documentType,
            file_name: file.originalname,
            file_path: file.path,
            file_size: file.size,
            mime_type: file.mimetype,
            uploaded_by: uploadedBy,
            description: description
        });

        return doc;
    }

    async validateDocumentAccess(documentId: number, employeeId: number): Promise<EmployeeDocument | null> {
        const doc = await this.getDocumentById(documentId);
        if (!doc) return null;

        if (doc.employee_id !== employeeId) {
            throw new Error('Access denied: Document does not belong to this employee');
        }
        return doc;
    }

    async getEmployeeDocuments(employeeId: number, documentType?: string): Promise<EmployeeDocument[]> {
        const where: any = { employee_id: employeeId };
        if (documentType) {
            where.document_type = documentType;
        }
        return await EmployeeDocument.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
    }

    async getDocumentById(documentId: number): Promise<EmployeeDocument | null> {
        return await EmployeeDocument.findByPk(documentId);
    }

    async deleteDocument(documentId: number): Promise<boolean> {
        const doc = await this.getDocumentById(documentId);
        if (!doc) return false;

        // Delete file using provider
        await storageProvider.deleteFile(doc.file_path);

        // Delete record
        await doc.destroy();
        return true;
    }

    async getDocumentPreview(documentId: number): Promise<{ path: string, mime: string } | null> {
        const doc = await this.getDocumentById(documentId);
        if (!doc) return null;

        const exists = await storageProvider.fileExists(doc.file_path);

        if (exists) {
            return {
                path: doc.file_path,
                mime: doc.mime_type
            };
        }
        return null;
    }
}

export default new DocumentService();
