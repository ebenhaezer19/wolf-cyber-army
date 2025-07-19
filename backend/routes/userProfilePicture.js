const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { upload, saveFile } = require('../middleware/uploadMiddleware');

// Custom file filter for profile picture (only jpg, jpeg, png)
const multer = require('multer');
const FileType = require('file-type');
const path = require('path');

const allowedProfileImage = [
  { ext: '.jpg', mime: 'image/jpeg' },
  { ext: '.jpeg', mime: 'image/jpeg' },
  { ext: '.png', mime: 'image/png' },
];

const profilePicUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

async function profilePicFilter(req, res, next) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const buffer = req.file.buffer;
  const fileType = await FileType.fromBuffer(buffer);
  if (!fileType) return res.status(400).json({ message: 'File type not allowed.' });
  const allowed = allowedProfileImage.find(
    a => a.mime === fileType.mime && path.extname(req.file.originalname).toLowerCase() === a.ext
  );
  if (!allowed) {
    return res.status(400).json({ message: 'Only jpg, jpeg, png allowed for profile picture.' });
  }
  req.file.detectedMime = fileType.mime;
  req.file.allowedExt = allowed.ext;
  next();
}

const { User } = require('../models');
const fs = require('fs');

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filename:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid file or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/profile-picture', authenticate, profilePicUpload.single('file'), profilePicFilter, saveFile, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    // Optional: delete old profile picture file
    if (user.profile_picture) {
      const oldPath = path.join(__dirname, '../../uploads', user.profile_picture);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    user.profile_picture = req.savedFile.filename;
    await user.save();
    res.json({ filename: req.savedFile.filename, message: 'Profile picture updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile picture.', error: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}/profile-picture:
 *   get:
 *     summary: Get user profile picture
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
 *         description: Profile picture file
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Not found
 */
router.get('/:id/profile-picture', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || !user.profile_picture) return res.status(404).json({ message: 'Profile picture not found.' });
    const filePath = path.join(__dirname, '../../uploads', user.profile_picture);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Profile picture file not found.' });
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve profile picture.', error: err.message });
  }
});

module.exports = router;
