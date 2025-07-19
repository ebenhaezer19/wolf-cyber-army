const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { upload, fileFilter, saveFile } = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get('/:id', userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.put('/:id', authenticate, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}/ban:
 *   put:
 *     summary: Ban user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User banned
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *
 * /api/users/{id}/unban:
 *   put:
 *     summary: Unban user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User unbanned
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.put('/:id/ban', authenticate, authorize(['admin']), userController.banUser);
router.put('/:id/unban', authenticate, authorize(['admin']), userController.unbanUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.delete('/:id', authenticate, authorize(['admin']), userController.deleteUser);

/**
 * @swagger
 * /api/users/profile-picture:
 *   post:
 *     summary: Upload or update user profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated
 *       400:
 *         description: Invalid file or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/profile-picture', authenticate, upload.single('file'), fileFilter, saveFile, userController.updateProfilePicture);

/**
 * @swagger
 * /api/users/{id}/profile-picture:
 *   get:
 *     summary: Get user's profile picture
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Profile picture
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: User or profile picture not found
 */
router.get('/:id/profile-picture', userController.getProfilePicture);

module.exports = router;
