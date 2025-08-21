const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Role = require("../models/Role");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Register user
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("firstName").notEmpty().trim().withMessage("First name is required"),
    body("lastName").notEmpty().trim().withMessage("Last name is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { username, email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          message: "User with this email or username already exists",
        });
      }

      // Get default role (USER)
      let defaultRole = await Role.findOne({ name: "USER" });
      if (!defaultRole) {
        // Create default USER role if it doesn't exist
        defaultRole = await Role.create({
          name: "USER",
          description: "Default user role",
          permissions: ["USER_READ", "USER_UPDATE_OWN"],
        });
      }

      // Create user
      const user = await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        roles: [defaultRole._id],
      });

      const token = generateToken(user._id);

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: [defaultRole.name],
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Login user
router.post(
  "/login",
  [
    body("login").notEmpty().withMessage("Username or email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { login, password } = req.body;

      // Find user by email or username
      const user = await User.findOne({
        $or: [{ email: login }, { username: login }],
        isActive: true,
      }).populate("roles");

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles.map((role) => role.name),
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Change password
router.put(
  "/change-password",
  authenticate,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      // Verify current password
      if (!(await user.comparePassword(currentPassword))) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get current user profile
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("roles")
      .select("-password");

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map((role) => ({
          name: role.name,
          description: role.description,
          permissions: role.permissions,
        })),
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout (client-side token removal)
router.post("/logout", authenticate, (req, res) => {
  res.json({
    message:
      "Logged out successfully. Please remove the token from client storage.",
  });
});

module.exports = router;
