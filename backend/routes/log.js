const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get all logs (admin/moderator only)
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by action (like)
 *     responses:
 *       200:
 *         description: List of logs
 *       403:
 *         description: Not authorized
 */
router.get('/', authenticate, authorize(['admin', 'moderator']), logController.getAllLogs);

/**
 * @swagger
 * /api/logs/user-activity/{userId}:
 *   get:
 *     summary: Get recent activity for a specific user
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID whose activity to retrieve
 *     responses:
 *       200:
 *         description: Recent activity for the user
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/user-activity/:userId', authenticate, logController.getUserRecentActivity);

/**
 * @swagger
 * /api/logs/my-activity:
 *   get:
 *     summary: Get recent activity for the logged-in user
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity for the logged-in user
 *       500:
 *         description: Server error
 */
router.get('/my-activity', authenticate, logController.getUserRecentActivity);

module.exports = router;
