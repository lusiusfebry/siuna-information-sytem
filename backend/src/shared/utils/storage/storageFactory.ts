import { IStorageProvider } from './IStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';

class StorageFactory {
    private static instance: IStorageProvider;

    static getProvider(): IStorageProvider {
        if (!this.instance) {
            const driver = process.env.STORAGE_DRIVER || 'local';
            if (driver === 's3') {
                this.instance = new S3StorageProvider();
            } else {
                this.instance = new LocalStorageProvider();
            }
        }
        return this.instance;
    }
}

export const storageProvider = StorageFactory.getProvider();
