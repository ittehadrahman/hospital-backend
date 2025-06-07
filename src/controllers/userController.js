const User = require('../models/User');
const bcrypt = require('bcryptjs');

const userController = {
  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      const query = { isActive: true };

      if (role) query.role = role;
      if (search) {
        query.$or = [
          { username: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ];
      }

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      res.json({
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create new user
  createUser: async (req, res) => {
    try {
      const { username, email, password, role, permissions } = req.body;

      // Only superadmin can create admin users
      if (role === 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Only superadmin can create admin users' });
      }

      // Check if username or email already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }

      const user = new User({
        username,
        email,
        password,
        role,
        permissions: permissions || []
      });

      await user.save();
      res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
      console.error('Create user error:', error);
      if (error.code === 11000) {
        res.status(400).json({ message: 'Username or email already exists' });
      } else {
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { permissions, role, isActive, password } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Only superadmin can modify admin users or change roles
      if ((user.role === 'admin' || role === 'admin') && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Only superadmin can modify admin users' });
      }

      const updateData = { updatedAt: Date.now() };
      if (permissions !== undefined) updateData.permissions = permissions;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      const updatedUser = await User.findByIdAndUpdate(id, updateData, { 
        new: true,
        runValidators: true 
      }).select('-password');

      res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete user (soft delete)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent deletion of superadmin users
      if (user.role === 'superadmin') {
        return res.status(403).json({ message: 'Cannot delete superadmin user' });
      }

      // Only superadmin can delete admin users
      if (user.role === 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Only superadmin can delete admin users' });
      }

      user.isActive = false;
      user.updatedAt = Date.now();
      await user.save();

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = userController;