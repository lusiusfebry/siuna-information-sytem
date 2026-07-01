import { IStorageProvider } from './IStorageProvider';
import * as fs from 'fs';

export class LocalStorageProvider implements IStorageProvider {
    async saveFile(file: Express.Multer.File, _destination: string, _filename: string): Promise<string> {
        // Multer with diskStorage already saves the file, so we might just return the path.
        // However, if we move away from diskStorage to memoryStorage for abstraction transparency,
        // we would write the file here.
        // Given current setup uses multer.diskStorage, the file is already at file.path.
        // We will assume the service might want to move it or it's already there.
        // For consistent abstraction, if the file is already saved by multer, we just return the path.
        // If we switch to memory storage later, this method would actually write the buffer.

        // Check if file exists at file.path (Multer diskStorage)
        if (fs.existsSync(file.path)) {
            return file.path;
        }

        // If passing a buffer (MemoryStorage), we would write it.
        // For now, implementing for current DiskStorage usage.
        return file.path;
    }

    async deleteFile(filePath: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            } else {
                resolve(false);
            }
        });
    }

    getFileStream(filePath: string): NodeJS.ReadableStream {
        if (fs.existsSync(filePath)) {
            return fs.createReadStream(filePath);
        }
        throw new Error('File not found');
    }

    async fileExists(filePath: string): Promise<boolean> {
        return fs.existsSync(filePath);
    }
}
