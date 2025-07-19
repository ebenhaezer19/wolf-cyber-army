const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post (comment) in a thread
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [thread_id, content]
 *             properties:
 *               thread_id:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created
 *       400:
 *         description: Validation error
 *
 * /api/posts/thread/{thread_id}:
 *   get:
 *     summary: Get all posts in a thread
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: thread_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: List of posts
 *
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Post not found
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Post not found
 */
// Create post
router.post('/', authenticate, postController.createPost);
// Get all posts in a thread
router.get('/thread/:thread_id', postController.getPostsByThread);
// Update post
router.put('/:id', authenticate, postController.updatePost);
// Delete post
router.delete('/:id', authenticate, postController.deletePost);

/**
 * @swagger
 * /api/posts/{id}/moderate:
 *   delete:
 *     summary: Delete post (admin/moderator only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted by moderator
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Post not found
 */
router.delete('/:id/moderate', authenticate, authorize(['admin', 'moderator']), postController.moderateDeletePost);

module.exports = router;
