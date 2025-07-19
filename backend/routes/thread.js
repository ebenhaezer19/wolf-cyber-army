const express = require('express');
const router = express.Router();
const threadController = require('../controllers/threadController');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/threads:
 *   post:
 *     summary: Create a new thread
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, category]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thread created
 *       400:
 *         description: Validation error
 *   get:
 *     summary: Get all threads
 *     tags: [Threads]
 *     responses:
 *       200:
 *         description: List of threads
 *
 * /api/threads/{id}:
 *   get:
 *     summary: Get thread by ID
 *     tags: [Threads]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Thread found
 *       404:
 *         description: Thread not found
 *   put:
 *     summary: Update thread by ID
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Thread ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thread updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Thread not found
 *   delete:
 *     summary: Delete thread by ID
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Thread deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Thread not found
 */
/**
 * @swagger
 * /api/threads/{id}/moderate:
 *   delete:
 *     summary: Delete thread (admin only)
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Thread deleted by admin
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Thread not found
 */
// Create thread
router.post('/', authenticate, threadController.createThread);
// Get all threads
router.get('/', threadController.getAllThreads);
// Get thread by id
router.get('/:id', threadController.getThreadById);
// Update thread
router.put('/:id', authenticate, threadController.updateThread);
// Delete thread
router.delete('/:id', authenticate, threadController.deleteThread);

module.exports = router;
