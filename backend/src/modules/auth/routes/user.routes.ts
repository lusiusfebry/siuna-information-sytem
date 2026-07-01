import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../../../shared/middleware/auth.middleware';
import { checkPermission } from '../../../shared/middleware/permission.middleware';
import { RESOURCES, ACTIONS } from '../../../shared/constants/permissions';

const router = Router();

// Get all users
/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all system users
 *     description: Returns a list of all registered users in the system, including their roles and status.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 *       403:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get(
    '/users',
    authenticate,
    checkPermission(RESOURCES.USERS, ACTIONS.READ),
    userController.getAllUsers
);

/**
 * @swagger
 * /auth/users/{id}/role:
 *   put:
 *     summary: Update user role
 *     description: Assigns a different role to a specific user.
 *     tags: [Users]
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
 *             required: [role_id]
 *             properties:
 *               role_id: { type: number, example: 2 }
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         $ref: '#/components/schemas/ApiError'
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.put(
    '/users/:id/role',
    authenticate,
    checkPermission(RESOURCES.USERS, ACTIONS.UPDATE),
    userController.updateUserRole
);

/**
 * @swagger
 * /auth/users/{id}/status:
 *   put:
 *     summary: Toggle user active status
 *     description: Enables or disables a user account.
 *     tags: [Users]
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
 *         description: User status toggled successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 *       404:
 *         $ref: '#/components/schemas/ApiError'
 */
router.put(
    '/users/:id/status',
    authenticate,
    checkPermission(RESOURCES.USERS, ACTIONS.UPDATE),
    userController.toggleUserStatus
);


export default router;
