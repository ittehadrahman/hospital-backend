const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Get all users (admin only)
router.get(
  "/",
  authenticate,
  authorize(["USER_MANAGE", "USER_READ_ALL"]),
  async (req, res) => {
    try {
      const users = await User.find()
        .populate("roles")
        .select("-password")
        .sort({ createdAt: -1 });

      res.json({
        users: users.map((user) => ({
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles.map((role) => role.name),
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        })),
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get user by ID
router.get(
  "/:id",
  authenticate,
  authorize(["USER_MANAGE", "USER_READ_ALL"]),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id)
        .populate("roles")
        .select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

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
      console.error("Get user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update user profile (own profile or admin)
router.put(
  "/:id",
  authenticate,
  [
    body("firstName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("First name cannot be empty"),
    body("lastName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Last name cannot be empty"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
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

      const userId = req.params.id;
      const currentUser = req.user;

      // Check if user can update this profile
      const canUpdate =
        currentUser._id.toString() === userId ||
        currentUser.hasPermission("USER_MANAGE");

      if (!canUpdate) {
        return res.status(403).json({
          message: "You can only update your own profile",
        });
      }

      const { firstName, lastName, email } = req.body;
      const updateData = {};

      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;

      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("roles")
        .select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile updated successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles.map((role) => role.name),
        },
      });
    } catch (error) {
      console.error("Update user error:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
