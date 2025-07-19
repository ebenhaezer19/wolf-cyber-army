const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 */
// Create category (admin only)
router.post('/', authenticate, authorizeRoles('admin'), categoryController.createCategory);

// Get all categories (public)
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Category not found
 *       403:
 *         description: Not authorized
 *   delete:
 *     summary: Delete a category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted
 *       404:
 *         description: Category not found
 *       403:
 *         description: Not authorized
 */
// Update category (admin only)
router.put('/:id', authenticate, authorizeRoles('admin'), categoryController.updateCategory);

// Delete category (admin only)
router.delete('/:id', authenticate, authorizeRoles('admin'), categoryController.deleteCategory);

module.exports = router;
