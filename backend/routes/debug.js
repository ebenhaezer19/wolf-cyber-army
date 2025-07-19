const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/debug/token:
 *   get:
 *     summary: Debug endpoint untuk memverifikasi token JWT
 *     tags: [Debug]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token info
 *       401:
 *         description: Unauthorized
 */
router.get('/token', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Decode token tanpa verifikasi untuk debugging
    const decoded = jwt.decode(token);
    
    // Dapatkan user dari database
    const user = await User.findByPk(decoded?.id);
    
    res.json({
      tokenInfo: {
        ...decoded,
        iat: new Date(decoded.iat * 1000).toISOString(),
        exp: new Date(decoded.exp * 1000).toISOString(),
      },
      userFound: !!user,
      userInfo: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      } : null
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error processing token',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/debug/database/users:
 *   get:
 *     summary: Debug endpoint untuk memeriksa users database
 *     tags: [Debug]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database info
 */
router.get('/database/users', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'created_at']
    });
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
});

module.exports = router;
