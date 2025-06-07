const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospital_secret_key');
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};
// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions', 
        required: roles,
        current: req.user.role 
      });
    }
    next();
  };
};

// Permission-based access control
const requirePermission = (module, action) => {
  return (req, res, next) => {
    try {
      // Superadmin has all permissions
      if (req.user.role === 'superadmin') {
        return next();
      }

      // Check if user has specific permission
      const permission = req.user.permissions.find(p => p.module === module);
      if (!permission || !permission.actions.includes(action)) {
        return res.status(403).json({ 
          message: 'Permission denied',
          required: { module, action },
          userPermissions: req.user.permissions
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Permission check failed' });
    }
  };
};

// Check if user can access specific resource
const requireResourceAccess = (resourceModel, resourceParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceParam];
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Superadmin can access all resources
      if (req.user.role === 'superadmin') {
        req.resource = resource;
        return next();
      }

      // Check if user created the resource or has admin role
      if (req.user.role === 'admin' || resource.createdBy.toString() === req.user._id.toString()) {
        req.resource = resource;
        return next();
      }

      return res.status(403).json({ message: 'Access denied to this resource' });
    } catch (error) {
      console.error('Resource access error:', error);
      return res.status(500).json({ message: 'Resource access check failed' });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  requireResourceAccess
};
