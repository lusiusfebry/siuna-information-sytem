export interface IStorageProvider {
    saveFile(file: Express.Multer.File, destination: string, filename: string): Promise<string>;
    deleteFile(filePath: string): Promise<boolean>;
    getFileStream(filePath: string): NodeJS.ReadableStream;
    fileExists(filePath: string): Promise<boolean>;
}
