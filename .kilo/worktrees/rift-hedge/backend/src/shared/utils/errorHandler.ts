import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    constructor(public message: string, public statusCode: number = 400, public errors: any[] = []) {
        super(message);
        this.name = 'AppError';
    }
}

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || [];

    // Handle Sequelize Validation Errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 400;
        message = 'Validation Error';
        errors = err.errors.map((e: any) => ({
            field: e.path,
            message: translateSequelizeError(e.message)
        }));
    }

    // Handle specific Foreign Key errors
    if (
        err.name === 'SequelizeForeignKeyConstraintError' ||
        err.parent?.code === '23503' ||
        err.original?.code === '23503' ||
        err.parent?.code === '23001' ||
        err.original?.code === '23001'
    ) {
        statusCode = 400;
        message = 'Terjadi kesalahan pada data referensi (Foreign Key)';

        if (err.table.includes('divisi')) {
            message = 'Divisi yang dipilih tidak valid atau tidak ditemukan';
        } else if (err.table.includes('department')) {
            message = 'Department yang dipilih tidak valid';
        }
    }

    console.error(`[Error] ${message}:`, err);

    res.status(statusCode).json({
        status: 'error',
        message,
        errors
    });
};

function translateSequelizeError(msg: string): string {
    // Simple translation for common sequelize errors
    if (msg.includes('cannot be null') || msg.includes('notNull Violation')) {
        return 'Data ini tidak boleh kosong';
    }
    if (msg.includes('must be unique')) {
        return 'Data sudah ada, harap gunakan nama lain';
    }
    return msg;
}
