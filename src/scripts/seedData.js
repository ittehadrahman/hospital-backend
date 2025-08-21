const mongoose = require("mongoose");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
require("dotenv").config();

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Create permissions
    const permissions = [
      {
        name: "USER_CREATE",
        description: "Create users",
        resource: "user",
        action: "CREATE",
      },
      {
        name: "USER_READ",
        description: "Read own user data",
        resource: "user",
        action: "READ",
      },
      {
        name: "USER_READ_ALL",
        description: "Read all users data",
        resource: "user",
        action: "READ",
      },
      {
        name: "USER_UPDATE_OWN",
        description: "Update own user data",
        resource: "user",
        action: "UPDATE",
      },
      {
        name: "USER_UPDATE",
        description: "Update any user data",
        resource: "user",
        action: "UPDATE",
      },
      {
        name: "USER_DELETE",
        description: "Delete users",
        resource: "user",
        action: "DELETE",
      },
      {
        name: "USER_MANAGE",
        description: "Full user management",
        resource: "user",
        action: "MANAGE",
      },
      {
        name: "ROLE_CREATE",
        description: "Create roles",
        resource: "role",
        action: "CREATE",
      },
      {
        name: "ROLE_READ",
        description: "Read roles",
        resource: "role",
        action: "READ",
      },
      {
        name: "ROLE_UPDATE",
        description: "Update roles",
        resource: "role",
        action: "UPDATE",
      },
      {
        name: "ROLE_DELETE",
        description: "Delete roles",
        resource: "role",
        action: "DELETE",
      },
      {
        name: "ROLE_MANAGE",
        description: "Full role management",
        resource: "role",
        action: "MANAGE",
      },
      {
        name: "PERMISSION_READ",
        description: "Read permissions",
        resource: "permission",
        action: "READ",
      },
      {
        name: "PERMISSION_MANAGE",
        description: "Manage permissions",
        resource: "permission",
        action: "MANAGE",
      },
    ];

    await Permission.deleteMany({});
    await Permission.insertMany(permissions);
    console.log("Permissions seeded");

    // Create roles
    const roles = [
      {
        name: "USER",
        description: "Default user role",
        permissions: ["USER_READ", "USER_UPDATE_OWN"],
      },
      {
        name: "ADMIN",
        description: "Administrator role",
        permissions: [
          "USER_READ_ALL",
          "USER_UPDATE",
          "USER_DELETE",
          "USER_MANAGE",
          "ROLE_READ",
          "ROLE_CREATE",
          "ROLE_UPDATE",
          "ROLE_MANAGE",
        ],
      },
      {
        name: "SUPER_ADMIN",
        description: "Super administrator role",
        permissions: [
          "USER_CREATE",
          "USER_READ_ALL",
          "USER_UPDATE",
          "USER_DELETE",
          "USER_MANAGE",
          "ROLE_CREATE",
          "ROLE_READ",
          "ROLE_UPDATE",
          "ROLE_DELETE",
          "ROLE_MANAGE",
          "PERMISSION_READ",
          "PERMISSION_MANAGE",
        ],
      },
    ];

    await Role.deleteMany({});
    await Role.insertMany(roles);
    console.log("Roles seeded");

    console.log("Data seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seedData();
