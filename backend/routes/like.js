const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const { authenticate } = require('../middleware/authMiddleware');

// Middleware untuk debugging
router.use((req, res, next) => {
  console.log(`[LIKE ROUTE] ${req.method} ${req.originalUrl}`);
  next();
});

// Toggle like/dislike (memerlukan login)
router.post('/toggle', authenticate, likeController.toggleLike);

// Get like counts for a post/thread (tidak memerlukan login)
router.get('/:target_type/:target_id', likeController.getLikesCount);

module.exports = router;
