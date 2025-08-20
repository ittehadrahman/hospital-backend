const mongoose = require('mongoose');

// Services Schema
const servicesSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    unique: true,
    maxlength: [200, 'Service name cannot exceed 200 characters']
  },
  
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0 && Number.isFinite(v);
      },
      message: 'Price must be a valid positive number'
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Pre-save middleware for data formatting
servicesSchema.pre('save', function(next) {
  // Capitalize first letter of each word in service name
  if (this.serviceName) {
    this.serviceName = this.serviceName.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Round price to 2 decimal places
  if (this.price) {
    this.price = Math.round(this.price * 100) / 100;
  }
  
  next();
});

// Instance method to format price with currency
servicesSchema.methods.getFormattedPrice = function() {
  return `৳${this.price.toFixed(2)}`;
};

// Static method to find services within price range
servicesSchema.statics.findByPriceRange = function(minPrice, maxPrice) {
  return this.find({
    price: {
      $gte: minPrice,
      $lte: maxPrice
    }
  });
};

// Static method to find services by name (case insensitive)
servicesSchema.statics.findByName = function(name) {
  return this.find({
    serviceName: { $regex: name, $options: 'i' }
  });
};

// Create and export the model
const Services = mongoose.model('Services', servicesSchema);

module.exports = Services;

