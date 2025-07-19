const express = require('express');
const router = express.Router();
const recoveryEmailController = require('../controllers/recoveryEmailController');
const { authenticate } = require('../middleware/authMiddleware');

// Semua route ini memerlukan autentikasi
router.use(authenticate);

// Set recovery email (kirim OTP verifikasi)
router.post('/set', recoveryEmailController.setRecoveryEmail);

// Verifikasi recovery email dengan OTP
router.post('/verify', recoveryEmailController.verifyRecoveryEmail);

// Dapatkan info recovery email
router.get('/', recoveryEmailController.getRecoveryEmail);

module.exports = router;
