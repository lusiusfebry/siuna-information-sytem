import { IStorageProvider } from './IStorageProvider';

export class S3StorageProvider implements IStorageProvider {
    async saveFile(_file: Express.Multer.File, _destination: string, _filename: string): Promise<string> {
        console.log('S3 Storage: Saving file logic stub');
        throw new Error('S3 Storage not implemented');
    }

    async deleteFile(_filePath: string): Promise<boolean> {
        console.log('S3 Storage: Deleting file logic stub');
        return true;
    }

    getFileStream(_filePath: string): NodeJS.ReadableStream {
        throw new Error('S3 Storage not implemented');
    }

    async fileExists(_filePath: string): Promise<boolean> {
        return false;
    }
}
