const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateUser } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/users
router.get('/', requireRole(['superadmin', 'admin']), userController.getAllUsers);

// GET /api/users/:id
router.get('/:id', requireRole(['superadmin', 'admin']), userController.getUserById);

// POST /api/users
router.post('/', requireRole(['superadmin', 'admin']), validateUser, userController.createUser);

// PUT /api/users/:id
router.put('/:id', requireRole(['superadmin', 'admin']), userController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', requireRole(['superadmin', 'admin']), userController.deleteUser);

module.exports = router;