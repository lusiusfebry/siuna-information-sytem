import { Router } from 'express';
import roleController from '../controllers/role.controller';
import { authenticate } from '../../../shared/middleware/auth.middleware';
import { checkPermission } from '../../../shared/middleware/permission.middleware';
import { RESOURCES, ACTIONS } from '../../../shared/constants/permissions';

const router = Router();

/**
 * @swagger
 * /auth/roles:
 *   get:
 *     summary: Get all roles
 *     description: Returns a list of all user roles defined in the system.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 *       403:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/roles',
    authenticate,
    checkPermission(RESOURCES.ROLES, ACTIONS.READ),
    roleController.getAllRoles
);

/**
 * @swagger
 * /auth/permissions:
 *   get:
 *     summary: Get all available permissions list
 *     description: Returns a list of all possible permissions available for assignment to roles.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions retrieved successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/permissions',
    authenticate,
    checkPermission(RESOURCES.ROLES, ACTIONS.READ),
    roleController.getPermissions
);

/**
 * @swagger
 * /auth/roles/{id}:
 *   get:
 *     summary: Get role detail by ID
 *     description: Returns detailed information about a specific role, including its assigned permissions.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: '1'
 *     responses:
 *       200:
 *         description: Role detail retrieved successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 *       404:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/roles/:id',
    authenticate,
    checkPermission(RESOURCES.ROLES, ACTIONS.READ),
    roleController.getRoleById
);

/**
 * @swagger
 * /auth/roles:
 *   post:
 *     summary: Create a new role
 *     description: Creates a new role with a set of permissions.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, permissions]
 *             properties:
 *               name: { type: string, example: 'Editor' }
 *               permissions: { type: array, items: { type: string }, example: ['hr:read', 'hr:update'] }
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         $ref: '#/components/schemas/ApiError'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.post(
    '/roles',
    authenticate,
    checkPermission(RESOURCES.ROLES, ACTIONS.CREATE),
    roleController.createRole
);

/**
 * @swagger
 * /auth/roles/{id}:
 *   put:
 *     summary: Update an existing role
 *     description: Updates the name or permissions of an existing role.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: '1'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: 'SuperAdmin' }
 *               permissions: { type: array, items: { type: string }, example: ['*:*'] }
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         $ref: '#/components/schemas/ApiError'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.put(
    '/roles/:id',
    authenticate,
    checkPermission(RESOURCES.ROLES, ACTIONS.UPDATE),
    roleController.updateRole
);

/**
 * @swagger
 * /auth/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     description: Removes a role from the system.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: '1'
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 *       403:
 *         $ref: '#/components/schemas/ApiError'
 */
router.delete(
    '/roles/:id',
    authenticate,
    checkPermission(RESOURCES.ROLES, ACTIONS.DELETE),
    roleController.deleteRole
);


export default router;
