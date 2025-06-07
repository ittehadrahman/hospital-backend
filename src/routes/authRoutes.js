const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');

const router = express.Router();

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// GET /api/auth/me
router.get('/me', authenticateToken, authController.getCurrentUser);

// POST /api/auth/refresh
router.post('/refresh', authenticateToken, authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;