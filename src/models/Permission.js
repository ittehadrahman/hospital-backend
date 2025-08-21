const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
    trim: true,
  },
  resource: {
    type: String,
    required: true,
    trim: true,
  },
  action: {
    type: String,
    required: true,
    enum: ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Permission", permissionSchema);
     