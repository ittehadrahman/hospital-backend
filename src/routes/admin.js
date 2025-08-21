const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const {
  authenticate,
  authorize,
  authorizeRoles,
} = require("../middleware/auth");

const router = express.Router();

// Create role
router.post(
  "/roles",
  authenticate,
  authorizeRoles(["ADMIN", "SUPER_ADMIN"]),
  [
    body("name").notEmpty().trim().withMessage("Role name is required"),
    body("permissions").isArray().withMessage("Permissions must be an array"),
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

      const { name, description, permissions } = req.body;

      const existingRole = await Role.findOne({ name: name.toUpperCase() });
      if (existingRole) {
        return res.status(400).json({ message: "Role already exists" });
      }

      const role = await Role.create({
        name: name.toUpperCase(),
        description,
        permissions,
      });

      res.status(201).json({
        message: "Role created successfully",
        role,
      });
    } catch (error) {
      console.error("Create role error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get all roles
router.get(
  "/roles",
  authenticate,
  authorize(["ROLE_READ", "ROLE_MANAGE"]),
  async (req, res) => {
    try {
      const roles = await Role.find().sort({ name: 1 });
      res.json({ roles });
    } catch (error) {
      console.error("Get roles error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update role
router.put(
  "/roles/:id",
  authenticate,
  authorizeRoles(["ADMIN", "SUPER_ADMIN"]),
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Role name cannot be empty"),
    body("permissions")
      .optional()
      .isArray()
      .withMessage("Permissions must be an array"),
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

      const { name, description, permissions } = req.body;
      const updateData = {};

      if (name) updateData.name = name.toUpperCase();
      if (description !== undefined) updateData.description = description;
      if (permissions) updateData.permissions = permissions;

      const role = await Role.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.json({
        message: "Role updated successfully",
        role,
      });
    } catch (error) {
      console.error("Update role error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Assign roles to user
router.put(
  "/users/:userId/roles",
  authenticate,
  authorizeRoles(["ADMIN", "SUPER_ADMIN"]),
  [body("roleIds").isArray().withMessage("Role IDs must be an array")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { userId } = req.params;
      const { roleIds } = req.body;

      // Verify roles exist
      const roles = await Role.find({ _id: { $in: roleIds } });
      if (roles.length !== roleIds.length) {
        return res.status(400).json({ message: "One or more roles not found" });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { roles: roleIds },
        { new: true }
      ).populate("roles");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User roles updated successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          roles: user.roles.map((role) => ({
            name: role.name,
            description: role.description,
            permissions: role.permissions,
          })),
        },
      });
    } catch (error) {
      console.error("Assign roles error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Toggle user active status
router.put(
  "/users/:userId/status",
  authenticate,
  authorizeRoles(["ADMIN", "SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: `User ${isActive ? "activated" : "deactivated"} successfully`,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error("Toggle user status error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Create permission
router.post(
  "/permissions",
  authenticate,
  authorizeRoles(["SUPER_ADMIN"]),
  [
    body("name").notEmpty().trim().withMessage("Permission name is required"),
    body("resource").notEmpty().trim().withMessage("Resource is required"),
    body("action")
      .isIn(["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"])
      .withMessage("Invalid action"),
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

      const { name, description, resource, action } = req.body;

      const permission = await Permission.create({
        name: name.toUpperCase(),
        description,
        resource,
        action,
      });

      res.status(201).json({
        message: "Permission created successfully",
        permission,
      });
    } catch (error) {
      console.error("Create permission error:", error);
      if (error.code === 11000) {
        return res.status(400).json({ message: "Permission already exists" });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get all permissions
router.get(
  "/permissions",
  authenticate,
  authorize(["PERMISSION_READ", "PERMISSION_MANAGE"]),
  async (req, res) => {
    try {
      const permissions = await Permission.find().sort({
        resource: 1,
        action: 1,
      });
      res.json({ permissions });
    } catch (error) {
      console.error("Get permissions error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
