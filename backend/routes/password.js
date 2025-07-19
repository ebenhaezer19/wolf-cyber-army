const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const rateLimit = require('express-rate-limit');

// Rate limiting - membatasi permintaan reset password
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 3, // maksimal 3 request per IP dalam 1 jam
  message: { message: 'Terlalu banyak permintaan reset password. Silakan coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * /api/password/request-reset:
 *   post:
 *     summary: Request password reset
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset email sent (always returns 200 for security)
 *       500:
 *         description: Server error
 */
router.post('/request-reset', resetLimiter, passwordController.requestReset);

/**
 * @swagger
 * /api/password/validate-token/{token}:
 *   get:
 *     summary: Validate reset token
 *     tags: [Password]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Reset token
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid token
 *       500:
 *         description: Server error
 */
router.get('/validate-token/:token', passwordController.validateToken);

/**
 * @swagger
 * /api/password/reset:
 *   post:
 *     summary: Reset password with token
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or password
 *       500:
 *         description: Server error
 */
router.post('/reset', passwordController.resetPassword);

module.exports = router;
