const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
  // Login user
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Find user by username or email
      const user = await User.findOne({
        $or: [{ username }, { email: username }],
        isActive: true
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'hospital_secret_key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get current user
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      res.json(user);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Refresh token
  refreshToken: async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'User not found or inactive' });
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'hospital_secret_key',
        { expiresIn: '24h' }
      );

      res.json({ token });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Logout (client-side token removal, but we can log it)
  logout: async (req, res) => {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just send a success response
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = authController;