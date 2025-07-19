const jwt = require('jsonwebtoken');

const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Headers:', req.headers);
    
    const authHeader = req.headers['authorization'];
    console.log('Auth header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ message: 'No token provided.' });
    }
    
    // Use the same default secret as in authController
    const JWT_SECRET = process.env.JWT_SECRET || 'wolf_cyber_army_dev_secret_key_2023';
    console.log('Using JWT secret with length:', JWT_SECRET.length);
    
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err.message);
        return res.status(403).json({ message: 'Invalid token.', error: err.message });
      }
      
      console.log('Decoded token:', decoded);
      
      // Ensure user ID is numeric
      if (decoded && decoded.id) {
        decoded.id = parseInt(decoded.id, 10);
      }
      
      // Verify user exists in database
      try {
        // Gunakan cara yang lebih aman untuk query database
        const user = await User.findOne({
          where: { id: decoded.id },
          attributes: ['id', 'username', 'email', 'role', 'created_at', 'is_banned', 'profile_picture']
        });
        
        if (!user) {
          console.error('User from token not found in database, id:', decoded.id);
          return res.status(404).json({ message: 'User from token not found in database' });
        }
        console.log('User verified in database:', user.username);
        
        // Attach the full database user object to request
        req.dbUser = user;
      } catch (dbError) {
        console.error('Database error verifying user:', dbError);
        // Lanjutkan eksekusi meskipun ada error verifikasi user
        // Token sudah diverifikasi, jadi ini tetap valid meskipun user tidak ditemukan
      }
      
      // Attach the decoded token payload to req.user
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Authentication process failed' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: insufficient role.' });
  }
  next();
};

function authorize(roles = []) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorize,
  authorizeRoles
};
