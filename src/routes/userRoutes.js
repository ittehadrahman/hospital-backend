const express = require('express');
const router = express.Router();
// Make sure this path matches your folder structure
const userController = require('../controllers/userController');
const { validateUserInput, validatePasswordUpdate } = require('../middleware/authMiddleware');

// GET all users
router.get('/', userController.getAllUsers);

// POST create new user
router.post('/', userController.createUser);

// PUT update user
router.put('/:id', validateUserInput, userController.updateUser);

// PUT update user password
router.put('/:id/password', validatePasswordUpdate, userController.updatePassword);

// DELETE user
router.delete('/:id', userController.deleteUser);

module.exports = router;