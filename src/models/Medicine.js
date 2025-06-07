const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  genericName: {
    type: String,
    required: [true, 'Generic name is required'],
    trim: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  strength: {
    type: String,
    required: [true, 'Strength is required'],
    trim: true
  },
  form: {
    type: String,
    required: [true, 'Form is required'],
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'spray'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative']
  },
  minStockLevel: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock level cannot be negative']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  supplier: {
    type: String,
    required: [true, 'Supplier is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sideEffects: {
    type: String,
    trim: true
  },
  storageConditions: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
medicineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better search performance
medicineSchema.index({ name: 'text', genericName: 'text', category: 'text' });
medicineSchema.index({ stock: 1, minStockLevel: 1 });
medicineSchema.index({ expiryDate: 1 });

// Virtual for checking if medicine is low in stock
medicineSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStockLevel;
});

// Virtual for checking if medicine is expired
medicineSchema.virtual('isExpired').get(function() {
  return this.expiryDate <= new Date();
});

module.exports = mongoose.model('Medicine', medicineSchema);