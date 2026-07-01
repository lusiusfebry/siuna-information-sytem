import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../../../shared/middleware/auth.middleware';
import { authLimiter } from '../../../shared/middleware/rate-limit.middleware';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to the system
 *     description: Authenticate user by NIK and password. Returns JWT token and user details.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nik, password]
 *             properties:
 *               nik:
 *                 type: string
 *                 example: '111111'
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 'password123'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: number }
 *                     nik: { type: string }
 *                     nama: { type: string }
 *                     role: { type: string }
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged in user
 *     description: Returns the profile of the currently authenticated user based on the Bearer token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout from the system
 *     description: Invalidates the current session (if applicable) and logs the user out.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/schemas/ApiError'
 */
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));


export default router;
