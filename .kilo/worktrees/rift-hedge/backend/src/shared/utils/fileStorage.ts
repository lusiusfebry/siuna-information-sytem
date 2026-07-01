import fs from 'fs';
import path from 'path';

export const fileStorage = {
    ensureDirectoryExists: (dirPath: string) => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    },

    deleteFile: (filePath: string) => {
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                return true;
            } catch (error) {
                console.error(`Error deleting file: ${filePath}`, error);
                return false;
            }
        }
        return false;
    },

    getFileStats: (filePath: string) => {
        if (fs.existsSync(filePath)) {
            return fs.statSync(filePath);
        }
        return null;
    },

    generateUniqueFilename: (originalName: string) => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000); // 3 digits
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '-');
        return `${timestamp}-${random}-${name}${ext}`;
    },

    validateFileType: (mimetype: string, allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf']) => {
        return allowedTypes.includes(mimetype);
    },

    getFileExtension: (filename: string) => {
        return path.extname(filename).toLowerCase();
    }
};
