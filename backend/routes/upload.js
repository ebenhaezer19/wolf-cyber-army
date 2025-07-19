const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { upload, fileFilter, saveFile } = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file (image/pdf/txt)
 *     tags: [Upload]
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
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filename:
 *                   type: string
 *                 url:
 *                   type: string
 *       400:
 *         description: Invalid file or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, upload.single('file'), fileFilter, saveFile, (req, res) => {
  const { filename } = req.savedFile;
  res.json({ filename });
});

module.exports = router;
