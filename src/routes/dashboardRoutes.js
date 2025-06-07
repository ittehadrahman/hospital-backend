const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getDashboardStats);

// GET /api/dashboard/recent-activity
router.get('/recent-activity', dashboardController.getRecentActivity);

module.exports = router;