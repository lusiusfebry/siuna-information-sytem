/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Employee Management
 */

/**
 * @swagger
 * /hr/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or NIK
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 total:
 *                   type: integer
 *   post:
 *     summary: Create new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nama_lengkap:
 *                 type: string
 *               nik:
 *                 type: string
 *               foto_karyawan:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Employee created
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nama_lengkap:
 *           type: string
 *         nomor_induk_karyawan:
 *           type: string
 *         posisi_jabatan:
 *           type: object
 *           properties:
 *             nama:
 *               type: string
 */
