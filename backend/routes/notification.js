const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for logged-in user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: unread
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Only show unread notifications
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         description: "Limit number of notifications (default: 20)"
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *         description: "Offset for pagination (default: 0)"
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/mark-read:
 *   post:
 *     summary: Mark notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: No notification ids provided
 *       401:
 *         description: Unauthorized
 */
router.post('/mark-read', authenticate, notificationController.markAsRead);

module.exports = router;
