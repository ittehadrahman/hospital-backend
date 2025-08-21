const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authenticate token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("roles");

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Authorize permissions
const authorize = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userPermissions = [];
    req.user.roles.forEach((role) => {
      userPermissions.push(...role.permissions);
    });

    const hasPermission = permissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: "Insufficient permissions",
        required: permissions,
        userPermissions,
      });
    }

    next();
  };
};

// Authorize roles
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userRoles = req.user.roles.map((role) => role.name);
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        message: "Insufficient role access",
        required: roles,
        userRoles,
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize, authorizeRoles };
