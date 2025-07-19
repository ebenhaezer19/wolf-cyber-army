const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/authMiddleware');
const { Post, User } = require('../models');
const path = require('path');
const fs = require('fs');

// Custom file filter untuk attachment
const multer = require('multer');
const FileType = require('file-type');
const { v4: uuidv4 } = require('uuid');

// Allowed extensions and mime types for attachments
const ALLOWED_ATTACHMENTS = [
  { ext: '.jpg', mime: 'image/jpeg', maxSize: 2 * 1024 * 1024 },
  { ext: '.jpeg', mime: 'image/jpeg', maxSize: 2 * 1024 * 1024 },
  { ext: '.png', mime: 'image/png', maxSize: 2 * 1024 * 1024 },
  { ext: '.pdf', mime: 'application/pdf', maxSize: 5 * 1024 * 1024 },
  { ext: '.txt', mime: 'text/plain', maxSize: 1 * 1024 * 1024 },
];

// Setup multer dengan memory storage
const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max size
});

// Pastikan direktori uploads ada
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory at:', uploadDir);
}

// Filter untuk attachment
async function attachmentFilter(req, res, next) {
  try {
    console.log('Attachment filter running');
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    
    console.log('File received:', req.file.originalname, req.file.mimetype, req.file.size);
    
    const buffer = req.file.buffer;
    const fileType = await FileType.fromBuffer(buffer);
    
    if (!fileType) {
      console.log('Could not detect file type');
      return res.status(400).json({ message: 'File type not allowed.' });
    }
    
    console.log('Detected file type:', fileType.mime);
    
    const allowed = ALLOWED_ATTACHMENTS.find(
      a => a.mime === fileType.mime && path.extname(req.file.originalname).toLowerCase() === a.ext
    );
    
    if (!allowed) {
      console.log('File type not allowed');
      return res.status(400).json({ 
        message: 'File type not allowed. Allowed types: JPG, PNG, PDF, TXT' 
      });
    }
    
    if (req.file.size > allowed.maxSize) {
      console.log('File too large');
      return res.status(400).json({ 
        message: `File too large. Max allowed: ${allowed.maxSize / 1024 / 1024}MB` 
      });
    }
    
    req.file.detectedMime = fileType.mime;
    req.file.allowedExt = allowed.ext;
    console.log('File passed filter checks');
    next();
  } catch (err) {
    console.error('Error in attachment filter:', err);
    return res.status(500).json({ message: 'Error processing file', error: err.message });
  }
}

// Save file middleware
async function saveAttachmentFile(req, res, next) {
  try {
    console.log('Saving attachment file');
    const uuid = uuidv4();
    const ext = req.file.allowedExt;
    const filename = uuid + ext;
    const filepath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filepath, req.file.buffer);
    console.log('Saved file to:', filepath);
    
    req.savedFile = { 
      filename, 
      path: filepath, 
      mime: req.file.detectedMime 
    };
    next();
  } catch (err) {
    console.error('Error saving attachment file:', err);
    return res.status(500).json({ message: 'Failed to save file.', error: err.message });
  }
}

/**
 * @swagger
 * /api/posts/{id}/attachment:
 *   post:
 *     summary: Upload or update attachment for a post
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Attachment uploaded
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
 *       404:
 *         description: Post not found
 */
router.post('/:id/attachment', authenticate, attachmentUpload.single('file'), attachmentFilter, saveAttachmentFile, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    // Optional: delete old attachment file
    if (post.attachment) {
      const oldPath = path.join(__dirname, '../../uploads', post.attachment);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    post.attachment = req.savedFile.filename;
    await post.save();
    res.json({ filename: req.savedFile.filename, message: 'Attachment uploaded.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload attachment.', error: err.message });
  }
});

/**
 * @swagger
 * /api/posts/{id}/attachment:
 *   get:
 *     summary: Download post attachment
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Attachment file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Not found
 */
// Fungsi middleware untuk autentikasi dengan token di query parameter atau header
const authenticateWithQuery = async (req, res, next) => {
  try {
    // Cek token di query parameter atau header Authorization
    let token = null;
    
    if (req.query && req.query.token) {
      // Token dari query parameter
      token = req.query.token;
      console.log('Using token from query parameter');
    } else if (req.headers.authorization) {
      // Token dari Authorization header
      token = req.headers.authorization.split(' ')[1];
      console.log('Using token from auth header');
    }
    
    if (!token) {
      // Jika tidak perlu autentikasi, lanjutkan saja
      return next();
    }
    
    // Verifikasi token
    const JWT_SECRET = process.env.JWT_SECRET || 'wolf_cyber_army_dev_secret_key_2023';
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err.message);
        return res.status(403).json({ message: 'Invalid token', error: err.message });
      }
      
      // Jika token valid, cari user di database
      if (decoded && decoded.id) {
        const userId = parseInt(decoded.id, 10);
        const user = await User.findOne({ where: { id: userId } });
        
        if (user) {
          req.user = user;
          return next();
        }
      }
      
      // Default fallback jika tidak ada user yang ditemukan
      next();
    });
  } catch (error) {
    console.error('Auth error:', error);
    next(); // Lanjutkan request meskipun error
  }
};

router.get('/:id/attachment', authenticateWithQuery, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post || !post.attachment) return res.status(404).json({ message: 'Attachment not found.' });
    const filePath = path.join(__dirname, '../../uploads', post.attachment);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Attachment file not found.' });
    res.download(filePath, post.attachment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve attachment.', error: err.message });
  }
});

module.exports = router;
