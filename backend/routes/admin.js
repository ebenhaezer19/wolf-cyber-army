const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all admin routes with authentication and admin authorization
router.use(authenticate); 
router.use(authorizeRoles('admin')); // Hanya akses untuk role admin

// Password reset OTP management
router.get('/password-reset-requests', adminController.getPasswordResetRequests);
router.put('/password-reset-requests/:id/mark-used', adminController.markOtpAsUsed);

// User management
router.get('/users', adminController.getAllUsers);

module.exports = router;
