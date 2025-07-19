const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// Middleware autentikasi untuk semua routes
router.use(authenticate);

// Submit a report (untuk semua user yang sudah login)
router.post('/', reportController.submitReport);

// Routes khusus admin
router.get('/', authorizeRoles('admin'), reportController.getAllReports);
router.put('/:id/status', authorizeRoles('admin'), reportController.updateReportStatus);
router.post('/:id/warning', authorizeRoles('admin'), reportController.sendWarning);

module.exports = router;
