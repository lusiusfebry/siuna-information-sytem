// Application error type carried through the async handlers and honored by the
// central error handler in index.ts (which reads statusCode/errors). The old
// standalone errorHandler()/translateSequelizeError() helpers were never mounted
// (index.ts has its own inline handler) and were removed to avoid divergence.
export class AppError extends Error {
    constructor(public message: string, public statusCode: number = 400, public errors: any[] = []) {
        super(message);
        this.name = 'AppError';
    }
}
