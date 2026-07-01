import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads/employees/photos');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const nik = req.body.nomor_induk_karyawan || 'unknown';
        cb(null, `${uniqueSuffix}-${nik}-${file.originalname}`);
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'));
    }
};

export const uploadEmployeePhoto = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: fileFilter
});

const excelUploadDir = path.join(process.cwd(), 'uploads/imports/excel');

if (!fs.existsSync(excelUploadDir)) {
    fs.mkdirSync(excelUploadDir, { recursive: true });
}

const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, excelUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const excelFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    // Check extension as well because mime types can be tricky
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || ['.xlsx', '.xls'].includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'));
    }
};

export const uploadExcelFile = multer({
    storage: excelStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: excelFileFilter
});

// Document Upload Middleware
const docUploadDir = path.join(process.cwd(), 'uploads/employees/documents');
if (!fs.existsSync(docUploadDir)) {
    fs.mkdirSync(docUploadDir, { recursive: true });
}

const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Multer parsing order: query > body (if parsed)
        // We rely on 'type' query param as a stable source if body isn't parsed yet.
        const docType = (req.query.type as string) || req.body.document_type || 'others';
        const employeeId = req.params.id || 'temp';
        const targetDir = path.join(docUploadDir, docType, employeeId);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const nik = req.body.nomor_induk_karyawan || 'unknown';
        // Clean filename
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
        cb(null, `${uniqueSuffix}-${nik}-${cleanName}`);
    }
});

const documentFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
    }
};

export const uploadMultipleDocuments = multer({
    storage: documentStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: documentFileFilter
}).array('documents', 10);

// Product Photo Upload
const productPhotoDir = path.join(process.cwd(), 'uploads/inventory/photos');
if (!fs.existsSync(productPhotoDir)) {
    fs.mkdirSync(productPhotoDir, { recursive: true });
}

const productPhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, productPhotoDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `produk-${uniqueSuffix}${ext}`);
    }
});

export const uploadProductPhoto = multer({
    storage: productPhotoStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: fileFilter,
}).single('gambar');

// Transaction Document Upload
const transaksiDocDir = path.join(process.cwd(), 'uploads/inventory/dokumen');
if (!fs.existsSync(transaksiDocDir)) {
    fs.mkdirSync(transaksiDocDir, { recursive: true });
}

const transaksiDocStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, transaksiDocDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
        cb(null, `trx-${uniqueSuffix}-${cleanName}`);
    }
});

export const uploadTransaksiDocuments = multer({
    storage: transaksiDocStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: documentFileFilter,
}).array('dokumen', 5);

