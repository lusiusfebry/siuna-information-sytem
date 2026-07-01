import { Router } from 'express';
import { validateMasterData } from '../../../shared/middleware/validateMasterData';
import employeeController from '../controllers/employee.controller';
import masterDataController from '../controllers/master-data.controller';
import dashboardController from '../controllers/dashboard.controller';
import documentController from '../controllers/document.controller';
import { uploadMultipleDocuments } from '../../../shared/middleware/upload.middleware';
import { checkPermission, checkDepartmentAccess, checkResourceOwnership } from '../../../shared/middleware/permission.middleware';
import { authenticate } from '../../../shared/middleware/auth.middleware';
import { RESOURCES, ACTIONS } from '../../../shared/constants/permissions';
import { cacheMiddleware } from '../../../shared/middleware/cache.middleware';

const router = Router();

// Apply authentication to all HR routes
router.use(authenticate);

/**
 * @swagger
 * /hr/dashboard/stats:
 *   get:
 *     summary: Get overall dashboard statistics
 *     description: Returns key HR metrics like total employees, active employees, and recent hires.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/dashboard/stats',
    checkPermission(RESOURCES.DASHBOARD, ACTIONS.READ),
    checkDepartmentAccess(),
    dashboardController.getDashboardStats
);

/**
 * @swagger
 * /hr/dashboard/distribution:
 *   get:
 *     summary: Get employee distribution
 *     description: Returns employee counts grouped by department and divisi.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Distribution data retrieved successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/dashboard/distribution',
    checkPermission(RESOURCES.DASHBOARD, ACTIONS.READ),
    checkDepartmentAccess(),
    dashboardController.getEmployeeDistribution
);

/**
 * @swagger
 * /hr/dashboard/activities:
 *   get:
 *     summary: Get recent activities
 *     description: Returns a list of the most recent audit logs for the dashboard.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuditLog'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/dashboard/activities',
    checkPermission(RESOURCES.DASHBOARD, ACTIONS.READ),
    checkDepartmentAccess(),
    dashboardController.getRecentActivities
);

/**
 * @swagger
 * /hr/dashboard/employment-status:
 *   get:
 *     summary: Get employment status summary
 *     description: Returns counts of employees by their employment status (e.g., PKWT, Permanent).
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employment status summary retrieved successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/dashboard/employment-status',
    checkPermission(RESOURCES.DASHBOARD, ACTIONS.READ),
    checkDepartmentAccess(),
    dashboardController.getEmploymentStatus
);


import { uploadEmployeePhoto } from '../../../shared/middleware/upload.middleware';
import { validateEmployeeCreate, validateEmployeeUpdate } from '../../../shared/middleware/validateEmployee';

// Audit Log Routes
import auditController from '../controllers/audit.controller';
import { auditLogger } from '../../../shared/middleware/auditLog.middleware';

/**
 * @swagger
 * /hr/audit-logs/stats:
 *   get:
 *     summary: Get audit log statistics
 *     description: Returns statistical data about audit logs, such as action counts.
 *     tags: [Audit Log]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit statistics retrieved successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get('/audit-logs/stats', checkPermission(RESOURCES.AUDIT_LOGS, ACTIONS.READ), auditController.getAuditStats);

/**
 * @swagger
 * /hr/audit-logs/users:
 *   get:
 *     summary: Get audit log users
 *     description: Returns a list of users who have associated audit log entries.
 *     tags: [Audit Log]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User list retrieved successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get('/audit-logs/users', checkPermission(RESOURCES.AUDIT_LOGS, ACTIONS.READ), auditController.getAuditUsers);

/**
 * @swagger
 * /hr/audit-logs/entity/{entityType}/{entityId}:
 *   get:
 *     summary: Get entity change history
 *     description: Returns the full audit trail for a specific entity (e.g., a specific employee).
 *     tags: [Audit Log]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema: { type: string }
 *         example: 'employees'
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: History list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuditLog'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get('/audit-logs/entity/:entityType/:entityId', checkPermission(RESOURCES.AUDIT_LOGS, ACTIONS.READ), auditController.getEntityHistory);

/**
 * @swagger
 * /hr/audit-logs/{id}:
 *   get:
 *     summary: Get audit log detail
 *     description: Returns the full details of a single audit log entry, including data changes.
 *     tags: [Audit Log]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: Audit log detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLog'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get('/audit-logs/:id', checkPermission(RESOURCES.AUDIT_LOGS, ACTIONS.READ), auditController.getAuditLogDetail);

/**
 * @swagger
 * /hr/audit-logs:
 *   get:
 *     summary: Get all audit logs
 *     description: Returns a paginated list of all audit logs with optional filtering.
 *     tags: [Audit Log]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: number, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: number, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [CREATE, UPDATE, DELETE] }
 *     responses:
 *       200:
 *         description: List of audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get('/audit-logs', checkPermission(RESOURCES.AUDIT_LOGS, ACTIONS.READ), auditController.getAuditLogs);


// Export Routes
import exportController from '../controllers/export.controller';

/**
 * @swagger
 * /hr/employees/export/excel:
 *   get:
 *     summary: Export employees to Excel
 *     description: Downloads an Excel file containing all employee data based on current system state.
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file retrieved successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema: { type: string, format: binary }
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/export/excel',
    checkPermission(RESOURCES.EXPORT, ACTIONS.EXPORT),
    (req, res, next) => exportController.exportToExcel(req, res, next)
);

/**
 * @swagger
 * /hr/employees/{id}/export/pdf:
 *   get:
 *     summary: Export employee to PDF
 *     description: Generates and downloads a personal profile PDF for a specific employee.
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: PDF file retrieved successfully
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 *       404:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/:id/export/pdf',
    checkPermission(RESOURCES.EXPORT, ACTIONS.EXPORT),
    checkResourceOwnership('employee'),
    (req, res, next) => exportController.exportEmployeeToPDF(req, res, next)
);

// Employee Routes
/**
 * @swagger
 * /hr/employees:
 *   get:
 *     summary: Get all employees
 *     description: Returns a paginated list of employees with optional search and filtering by department or divisi.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: number, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: number, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or NIK
 *       - in: query
 *         name: department_id
 *         schema: { type: number }
 *       - in: query
 *         name: divisi_id
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: List of employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.READ),
    checkDepartmentAccess(),
    (req, res, next) => employeeController.getAll(req, res, next)
);


/**
 * @swagger
 * /hr/employees/{id}:
 *   get:
 *     summary: Get full employee profile
 *     description: Returns the complete data for an employee, including personal, HR, and family info.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: Complete employee data retrieved successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 *       404:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/:id',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.READ),
    checkResourceOwnership('employee'),
    (req, res, next) => employeeController.getOne(req, res, next)
);


/**
 * @swagger
 * /hr/employees/{id}/base:
 *   get:
 *     summary: Get employee head data
 *     description: Returns basic information (head data) for a specific employee.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: Base info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeHead'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/:id/base',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.READ),
    checkResourceOwnership('employee'),
    (req, res, next) => employeeController.getBase(req, res, next)
);

/**
 * @swagger
 * /hr/employees/{id}/personal:
 *   get:
 *     summary: Get employee personal info
 *     description: Returns personal details for a specific employee.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: Personal info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeePersonalInfo'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/:id/personal',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.READ),
    checkResourceOwnership('employee'),
    (req, res, next) => employeeController.getPersonal(req, res, next)
);

/**
 * @swagger
 * /hr/employees/{id}/employment:
 *   get:
 *     summary: Get employee HR info
 *     description: Returns employment/HR related information for a specific employee.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: HR info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeHRInfo'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/:id/employment',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.READ),
    checkResourceOwnership('employee'),
    (req, res, next) => employeeController.getEmployment(req, res, next)
);

/**
 * @swagger
 * /hr/employees/{id}/family:
 *   get:
 *     summary: Get employee family info
 *     description: Returns family and background details for a specific employee.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: Family info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeFamilyInfo'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/:id/family',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.READ),
    checkResourceOwnership('employee'),
    (req, res, next) => employeeController.getFamily(req, res, next)
);


/**
 * @swagger
 * /hr/employees:
 *   post:
 *     summary: Create employee
 *     description: Creates a new employee record. Supports multipart/form-data for photo upload.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/EmployeeHead'
 *               - type: object
 *                 properties:
 *                   foto_karyawan: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         $ref: '#/components/schemas/ApiError'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.post(
    '/employees',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.CREATE),
    uploadEmployeePhoto.single('foto_karyawan'),
    validateEmployeeCreate,
    auditLogger('employees'),
    (req, res, next) => employeeController.create(req, res, next)
);

/**
 * @swagger
 * /hr/employees/{id}:
 *   put:
 *     summary: Update employee
 *     description: Updates an existing employee record. Supports multipart/form-data for photo update.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/EmployeeHead'
 *               - type: object
 *                 properties:
 *                   foto_karyawan: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       400:
 *         $ref: '#/components/schemas/ApiError'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.put(
    '/employees/:id',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.UPDATE),
    uploadEmployeePhoto.single('foto_karyawan'),
    validateEmployeeUpdate,
    auditLogger('employees'),
    (req, res, next) => employeeController.update(req, res, next)
);

/**
 * @swagger
 * /hr/employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     description: Soft deletes an employee record.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.delete(
    '/employees/:id',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.DELETE),
    auditLogger('employees'),
    (req, res, next) => employeeController.delete(req, res, next)
);


// Master Data Generic Routes
const dynamicAuditLogger = (req: any, res: any, next: any) => {
    return auditLogger(req.params.model)(req, res, next);
};

/**
 * @swagger
 * /hr/master/{model}:
 *   get:
 *     summary: Get all master records
 *     description: Returns all records for a specified master data model (e.g., divisi, department).
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: model
 *         required: true
 *         schema:
 *           type: string
 *           enum: [divisi, department, posisi_jabatan, status_karyawan, lokasi_kerja, jenis_hubungan_kerja, kategori_pangkat, golongan, sub_golongan]
 *         description: Model name to fetch
 *     responses:
 *       200:
 *         description: List of records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MasterData'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/master/:model',
    checkPermission(RESOURCES.MASTER_DATA, ACTIONS.READ),
    cacheMiddleware(3600),
    (req, res, next) => masterDataController.getAll(req, res, next)
);

/**
 * @swagger
 * /hr/master/{model}/{id}:
 *   get:
 *     summary: Get single master record
 *     description: Returns a single record from a specified master data model.
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: model
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: Record detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MasterData'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 *       404:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/master/:model/:id',
    checkPermission(RESOURCES.MASTER_DATA, ACTIONS.READ),
    (req, res, next) => masterDataController.getOne(req, res, next)
);

/**
 * @swagger
 * /hr/master/{model}:
 *   post:
 *     summary: Create master record
 *     description: Creates a new record in a specified master data model.
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: model
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterData'
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         $ref: '#/components/schemas/ApiError'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.post(
    '/master/:model',
    checkPermission(RESOURCES.MASTER_DATA, ACTIONS.CREATE),
    validateMasterData,
    dynamicAuditLogger,
    (req, res, next) => masterDataController.create(req, res, next)
);

/**
 * @swagger
 * /hr/master/{model}/{id}:
 *   put:
 *     summary: Update master record
 *     description: Updates an existing record in a specified master data model.
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: model
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterData'
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       400:
 *         $ref: '#/components/schemas/ApiError'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.put(
    '/master/:model/:id',
    checkPermission(RESOURCES.MASTER_DATA, ACTIONS.UPDATE),
    validateMasterData,
    dynamicAuditLogger,
    (req, res, next) => masterDataController.update(req, res, next)
);

/**
 * @swagger
 * /hr/master/{model}/{id}:
 *   delete:
 *     summary: Delete master record
 *     description: Soft deletes a record from a specified master data model.
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: model
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.delete(
    '/master/:model/:id',
    checkPermission(RESOURCES.MASTER_DATA, ACTIONS.DELETE),
    dynamicAuditLogger,
    (req, res, next) => masterDataController.delete(req, res, next)
);

router.post(
    '/master/:model/:id/restore',
    checkPermission(RESOURCES.MASTER_DATA, ACTIONS.DELETE),
    dynamicAuditLogger,
    (req, res, next) => masterDataController.restore(req, res, next)
);


// QR Code Routes
import qrcodeController from '../controllers/qrcode.controller';
/**
 * @swagger
 * /hr/employees/{id}/qrcode:
 *   get:
 *     summary: Get employee QR Code
 *     description: Returns a base64 encoded QR Code image representing the employee's ID.
 *     tags: [QR Code]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: QR Code data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCode: { type: string, description: 'Base64 image data' }
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/:id/qrcode',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.READ),
    checkResourceOwnership('employee'),
    (req, res, next) => employeeController.getQRCode(req, res, next)
);

/**
 * @swagger
 * /hr/employees/{id}/qrcode/download:
 *   get:
 *     summary: Download employee QR Code
 *     description: Returns the employee's QR Code as a PNG file for download.
 *     tags: [QR Code]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: PNG file
 *         content:
 *           image/png:
 *             schema: { type: string, format: binary }
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/:id/qrcode/download',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.READ),
    checkResourceOwnership('employee'),
    (req, res, next) => employeeController.downloadQRCode(req, res, next)
);

/**
 * @swagger
 * /hr/qrcode/generate:
 *   get:
 *     summary: Generate generic QR Code
 *     description: Generates a QR Code for any text string provided in the query.
 *     tags: [QR Code]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: text
 *         required: true
 *         schema: { type: string }
 *         example: 'https://example.com'
 *     responses:
 *       200:
 *         description: QR Code SVG/Image
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/qrcode/generate',
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.READ), // Assuming employee create/read context? or specific permission?
    (req, res, next) => qrcodeController.generateQRCode(req, res, next)
);


/**
 * @swagger
 * /hr/departments/by-divisi/{divisiId}:
 *   get:
 *     summary: Get departments by divisi
 *     description: Returns a list of departments associated with a specific divisi ID.
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: divisiId
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: List of departments retrieved successfully
 */
router.get('/departments/by-divisi/:divisiId', checkPermission(RESOURCES.MASTER_DATA, ACTIONS.READ), (req, res, next) => masterDataController.getDepartmentsByDivisi(req, res, next));

/**
 * @swagger
 * /hr/posisi-jabatan/by-department/{departmentId}:
 *   get:
 *     summary: Get posisi by department
 *     description: Returns a list of positions associated with a specific department ID.
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: List of positions retrieved successfully
 */
router.get('/posisi-jabatan/by-department/:departmentId', checkPermission(RESOURCES.MASTER_DATA, ACTIONS.READ), (req, res, next) => masterDataController.getPosisiByDepartment(req, res, next));

/**
 * @swagger
 * /hr/validation/employees/managers:
 *   get:
 *     summary: Get all potential managers
 *     description: Returns a list of employees who can be assigned as managers.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of potential managers retrieved successfully
 */
router.get('/validation/employees/managers', checkPermission(RESOURCES.MASTER_DATA, ACTIONS.READ), (req, res, next) => masterDataController.getManagers(req, res, next));

/**
 * @swagger
 * /hr/validation/employees/active:
 *   get:
 *     summary: Get all active employees
 *     description: Returns a list of all currently active employees.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active employees retrieved successfully
 */
router.get('/validation/employees/active', checkPermission(RESOURCES.MASTER_DATA, ACTIONS.READ), (req, res, next) => masterDataController.getActiveEmployees(req, res, next));

// Import Routes
import importController from '../controllers/import.controller';
import { uploadExcelFile } from '../../../shared/middleware/upload.middleware';

/**
 * @swagger
 * /hr/import/preview:
 *   post:
 *     summary: Preview employee import
 *     description: Uploads an Excel file to preview data rows and identify validation errors before importing.
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Preview results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ImportPreviewRow' }
 *       400:
 *         $ref: '#/components/schemas/ApiError'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.post(
    '/import/preview',
    checkPermission(RESOURCES.IMPORT, ACTIONS.IMPORT),
    uploadExcelFile.single('file'),
    (req, res, next) => importController.uploadAndPreview(req, res, next)
);

/**
 * @swagger
 * /hr/import/employees:
 *   post:
 *     summary: Process employee import
 *     description: Finalizes the import of employee rows previously previewed.
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rows: { type: array, items: { type: object } }
 *     responses:
 *       200:
 *         description: Import completed successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.post(
    '/import/employees',
    checkPermission(RESOURCES.IMPORT, ACTIONS.IMPORT),
    auditLogger('employees_bulk_import'),
    (req, res, next) => importController.importEmployees(req, res, next)
);

/**
 * @swagger
 * /hr/import/master-data/{type}:
 *   post:
 *     summary: Import master data from JSON
 *     description: Processes a bulk import of master data for a specific type.
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema: { type: string }
 *         example: 'divisi'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rows: { type: array, items: { type: object } }
 *     responses:
 *       200:
 *         description: Import results retrieved successfully
 */
router.post(
    '/import/master-data/:type',
    checkPermission(RESOURCES.IMPORT, ACTIONS.IMPORT),
    (req, res, next) => auditLogger(`import_${req.params.type}`)(req, res, next),
    (req, res, next) => importController.importMasterData(req, res, next)
);

/**
 * @swagger
 * /hr/import/error-report:
 *   post:
 *     summary: Download import error report
 *     description: Generates and downloads an Excel file containing the errors from the last import attempt.
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel error report file retrieved successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema: { type: string, format: binary }
 */
router.post(
    '/import/error-report',
    checkPermission(RESOURCES.IMPORT, ACTIONS.IMPORT),
    (req, res, next) => importController.downloadErrorReport(req, res, next)
);





// Document Management
/**
 * @swagger
 * /hr/employees/{id}/documents:
 *   post:
 *     summary: Upload documents
 *     description: Uploads multiple documents for an employee. Supports multipart/form-data.
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Documents uploaded successfully
 *       400:
 *         $ref: '#/components/schemas/ApiError'
 */
router.post(
    '/employees/:id/documents',
    checkPermission(RESOURCES.DOCUMENTS, ACTIONS.CREATE),
    checkResourceOwnership('employee'),
    uploadMultipleDocuments,
    auditLogger('employee_documents'),
    documentController.uploadDocuments
);

/**
 * @swagger
 * /hr/employees/{id}/documents:
 *   get:
 *     summary: List employee documents
 *     description: Returns a list of all documents uploaded for a specific employee.
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *         example: 1
 *     responses:
 *       200:
 *         description: List of documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Document' }
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/:id/documents',
    checkPermission(RESOURCES.DOCUMENTS, ACTIONS.READ),
    checkResourceOwnership('employee'),
    documentController.getEmployeeDocuments
);

/**
 * @swagger
 * /hr/employees/{id}/documents/{docId}:
 *   delete:
 *     summary: Delete document
 *     description: Permanently removes a document for an employee.
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 *       404:
 *         $ref: '#/components/schemas/ApiError'
 */
router.delete(
    '/employees/:id/documents/:docId',
    checkPermission(RESOURCES.DOCUMENTS, ACTIONS.DELETE),
    auditLogger('employee_documents'),
    documentController.deleteDocument
);

/**
 * @swagger
 * /hr/employees/{id}/documents/{docId}/download:
 *   get:
 *     summary: Download document
 *     description: Downloads a specific document file.
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Document file retrieved successfully
 *         content:
 *           application/octet-stream:
 *             schema: { type: string, format: binary }
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/:id/documents/:docId/download',
    checkPermission(RESOURCES.DOCUMENTS, ACTIONS.READ),
    checkResourceOwnership('employee'),
    documentController.downloadDocument
);

/**
 * @swagger
 * /hr/employees/{id}/documents/{docId}/preview:
 *   get:
 *     summary: Preview document
 *     description: Returns content for document preview (if supported).
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Preview content retrieved successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/employees/:id/documents/:docId/preview',
    checkPermission(RESOURCES.DOCUMENTS, ACTIONS.READ),
    checkResourceOwnership('employee'),
    documentController.getDocumentPreview
);


export default router;
